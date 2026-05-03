from fastapi import HTTPException, status

from app.core.permission_checker import TokenData
from app.models.drug import Drug
from app.repositories.drug_repository import DrugRepository
from app.schemas.drug import DrugCreate, DrugUpdate
from app.services.base_crud_service import BaseCrudService
from app.utils.mongo_helpers import generate_prefixed_id, normalize_for_mongo, serialize_mongo_doc
from app.utils.ws import broadcast


class DrugService:
    def __init__(self, repository: DrugRepository) -> None:
        self.crud = BaseCrudService(repository, Drug, id_field="drug_id", id_prefix="drug")
        self.repository = repository

    async def list_by_drug_ids(self, drug_ids: list[str]) -> list[dict]:
        """List drugs by drug_id values."""
        drugs = await self.repository.list_by_drug_ids(drug_ids)
        return [serialize_mongo_doc(drug, "drug_id") for drug in drugs]

    async def create_drug(self, request: DrugCreate, current_user: TokenData) -> dict:
        """
        Create a drug. Doctor/owner auto-assigns their clinic_id. Admin can set or omit clinic_id.
        Persists with the public field name `class` (not `class_`) so the API contract is unified.
        """
        payload = request.model_dump(by_alias=True, exclude_none=True)
        if not current_user.is_superuser:
            payload["clinic_id"] = current_user.clinic_id

        drug_id = generate_prefixed_id("drug")
        payload["drug_id"] = drug_id
        payload = normalize_for_mongo(payload)

        created = await self.repository.create(payload)
        await broadcast("drugs:created", {"id": drug_id})
        return serialize_mongo_doc(created, "drug_id")

    async def list_drugs(self, current_user: TokenData) -> list[dict]:
        """
        List drugs:
        - Admin: all drugs
        - Doctor/owner/staff/client: their clinic's drugs + global drugs (clinic_id is None)
        """
        all_drugs = await self.crud.list()
        if current_user.is_superuser:
            return all_drugs
        return [d for d in all_drugs if not d.get("clinic_id") or d.get("clinic_id") == current_user.clinic_id]

    async def get_drug(self, drug_id: str, current_user: TokenData) -> dict:
        """
        Get a drug:
        - Admin: any drug
        - Non-admin roles: only their clinic's drugs or global drugs
        """
        drug = await self.crud.get(drug_id)
        if current_user.is_superuser:
            return drug
        if not drug.get("clinic_id") or drug.get("clinic_id") == current_user.clinic_id:
            return drug
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    async def update_drug(self, drug_id: str, request: DrugUpdate, current_user: TokenData) -> dict:
        """
        Update a drug. Persists with `class` alias to keep the document shape aligned with the API.
        """
        existing = await self.crud.get(drug_id)
        if not current_user.is_superuser and existing.get("clinic_id") != current_user.clinic_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        payload = request.model_dump(by_alias=True, exclude_none=True)
        if not current_user.is_superuser:
            payload.pop("clinic_id", None)
        if not payload:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update.")

        payload = normalize_for_mongo(payload)
        updated = await self.repository.update_by_id(drug_id, payload)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
        await broadcast("drugs:updated", {"id": drug_id})
        return serialize_mongo_doc(updated, "drug_id")

    async def delete_drug(self, drug_id: str, current_user: TokenData) -> None:
        """
        Delete a drug:
        - Admin: any drug
        - Doctor/owner: only their clinic's drugs
        """
        drug = await self.crud.get(drug_id)
        if current_user.is_superuser or drug.get("clinic_id") == current_user.clinic_id:
            await self.crud.delete(drug_id)
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    def _assess_severity(self, drug_a: dict, drug_b: dict, matched_reason: str) -> str:
        """
        Assess severity of drug interaction based on contraindication match and keyword scan.
        Returns: "contraindication", "major", "moderate", or "minor"
        """
        reason_lower = matched_reason.lower()

        contraindications_a = [c.lower() for c in drug_a.get("contraindications", [])]
        contraindications_b = [c.lower() for c in drug_b.get("contraindications", [])]

        name_b_lower = drug_b.get("name", "").lower()
        class_b_lower = drug_b.get("class", "").lower()
        name_a_lower = drug_a.get("name", "").lower()
        class_a_lower = drug_a.get("class", "").lower()

        for contra in contraindications_a:
            if name_b_lower in contra or (class_b_lower and class_b_lower in contra):
                return "contraindication"
        for contra in contraindications_b:
            if name_a_lower in contra or (class_a_lower and class_a_lower in contra):
                return "contraindication"

        major_keywords = [
            "serotonin", "maoi", "ssri", "interaction", "contraindicated",
            "avoid", "severe", "critical", "hypotension", "hemorrhage",
            "nephrotoxicity", "hepatotoxicity", "seizure", "arrhythmia",
        ]
        moderate_keywords = [
            "caution", "monitor", "dose", "adjust", "reduce", "increase",
            "accumulation", "clearance", "metabolism", "synergistic",
        ]

        reason_keywords = reason_lower.split()
        for keyword in reason_keywords:
            if any(major in keyword for major in major_keywords):
                return "major"

        for keyword in reason_keywords:
            if any(mod in keyword for mod in moderate_keywords):
                return "moderate"

        return "minor"

    async def check_interactions(self, drug_ids: list[str], current_user: TokenData) -> dict:
        """
        Check for drug interactions and contraindications.
        Returns structured warnings with severity levels.
        """
        if len(drug_ids) < 2:
            return {"has_interactions": False, "warnings": []}

        drug_docs = await self.list_by_drug_ids(drug_ids)
        drugs_map: dict[str, dict] = {}
        for d in drug_docs:
            did = d.get("drug_id") or d.get("_id", "")
            drugs_map[did] = d

        warnings: list[dict] = []
        checked: set[tuple[str, str]] = set()

        for did_a, drug_a in drugs_map.items():
            interactions_a = drug_a.get("interactions", [])
            interactions_a_text = [str(i).lower() for i in interactions_a]
            name_a = drug_a.get("name", "")
            class_a = drug_a.get("class", "")

            for did_b, drug_b in drugs_map.items():
                if did_a == did_b:
                    continue
                pair = tuple(sorted([did_a, did_b]))
                if pair in checked:
                    continue
                checked.add(pair)

                name_b = drug_b.get("name", "")
                class_b = drug_b.get("class", "")
                interactions_b = drug_b.get("interactions", [])
                interactions_b_text = [str(i).lower() for i in interactions_b]

                matched_reason = None

                if did_b in interactions_a:
                    matched_reason = f"Explicit interaction noted with {name_b}"
                elif did_a in interactions_b:
                    matched_reason = f"Explicit interaction noted with {name_a}"

                if not matched_reason:
                    for entry in interactions_a_text:
                        if (name_b.lower() in entry or entry in name_b.lower() or
                            (class_b and (class_b.lower() in entry or entry in class_b.lower()))):
                            matched_reason = entry
                            break

                if not matched_reason:
                    for entry in interactions_b_text:
                        if (name_a.lower() in entry or entry in name_a.lower() or
                            (class_a and (class_a.lower() in entry or entry in class_a.lower()))):
                            matched_reason = entry
                            break

                if matched_reason:
                    severity = self._assess_severity(drug_a, drug_b, matched_reason)
                    warnings.append({
                        "drug_a": name_a,
                        "drug_a_id": did_a,
                        "drug_b": name_b,
                        "drug_b_id": did_b,
                        "reason": matched_reason.title(),
                        "severity": severity,
                    })

        severity_order = {"contraindication": 0, "major": 1, "moderate": 2, "minor": 3}
        warnings.sort(key=lambda w: severity_order.get(w.get("severity", "minor"), 4))

        return {"has_interactions": len(warnings) > 0, "warnings": warnings}

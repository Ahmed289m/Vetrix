from __future__ import annotations

import asyncio
import threading
from datetime import datetime
from typing import Any

from crewai.tools import tool
from fastapi import HTTPException

from app.core.database import get_database
from app.core.permission_checker import TokenData
from app.models.enums.user_role import UserRole
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.clinic_repository import ClinicRepository
from app.repositories.drug_repository import DrugRepository
from app.repositories.pet_repository import PetRepository
from app.repositories.prescription_item_repository import PrescriptionItemRepository
from app.repositories.prescription_repository import PrescriptionRepository
from app.repositories.user_repository import UserRepository
from app.repositories.visit_repository import VisitRepository
from app.schemas.appointment import AppointmentCreate
from app.schemas.pet import PetCreate, PetUpdate
from app.schemas.user import UserUpdate
from app.services.appointment_service import AppointmentService
from app.services.credential_service import CredentialService
from app.services.drug_service import DrugService
from app.services.pet_service import PetService
from app.services.prescription_item_service import PrescriptionItemService
from app.services.prescription_service import PrescriptionService
from app.services.user_service import UserService
from app.services.visit_service import VisitService

# ── Thread-local context for system-injected values ─────────────────────────
_context = threading.local()


def set_context(client_id: str, clinic_id: str = "") -> None:
	_context.client_id = client_id
	_context.clinic_id = clinic_id


def _get_client_id() -> str:
	return getattr(_context, "client_id", "")


def _get_clinic_id() -> str:
	return getattr(_context, "clinic_id", "") or ""


# ── Helpers ─────────────────────────────────────────────────────────────────

def _run_async(coro: Any) -> Any:
	from app.core.database import get_event_loop

	main_loop = get_event_loop()
	future = asyncio.run_coroutine_threadsafe(coro, main_loop)
	return future.result()


def _services() -> dict[str, Any]:
	db = get_database()

	appointment_repo = AppointmentRepository(db)
	clinic_repo = ClinicRepository(db)
	pet_repo = PetRepository(db)
	user_repo = UserRepository(db)

	prescription_repo = PrescriptionRepository(db)
	prescription_item_repo = PrescriptionItemRepository(db)
	drug_repo = DrugRepository(db)
	visit_repo = VisitRepository(db)

	return {
		"appointments": AppointmentService(appointment_repo, clinic_repo, pet_repo, user_repo),
		"pets": PetService(pet_repo, user_repo),
		"visits": VisitService(visit_repo, user_repo),
		"prescriptions": PrescriptionService(prescription_repo, drug_repo, prescription_item_repo),
		"prescription_items": PrescriptionItemService(prescription_item_repo, prescription_repo),
		"drugs": DrugService(drug_repo),
		"users": UserService(user_repo, clinic_repo, CredentialService()),
	}


def _client_token(clinic_id: str = "") -> TokenData:
	return TokenData(
		user_id=_get_client_id(),
		email="",
		role=UserRole.CLIENT,
		clinic_id=clinic_id or _get_clinic_id() or None,
		is_superuser=False,
	)


async def _resolve_clinic_id() -> str | None:
	cid = _get_clinic_id()
	if cid:
		return cid
	client_id = _get_client_id()
	db = get_database()
	user_repo = UserRepository(db)
	user = await user_repo.get_by_user_id(client_id)
	return user.get("clinic_id") if user else None


# ── Read-only tools ─────────────────────────────────────────────────────────

@tool("client_allowed_actions")
def client_allowed_actions(action: str = "fetch") -> dict[str, list[str]]:
	"""Return the list of actions the current client is allowed to perform, grouped by category."""
	return {
		"read": [
			"appointments.read.own",
			"appointments.read",
			"visits.read.own",
			"prescriptions.read.own",
			"prescription_items.read.own",
			"drugs.read",
			"pets.read.own",
			"users.read.own",
		],
		"add": [
			"appointments.create.own",
			"pets.create.own",
		],
		"update": [
			"pets.update.own",
			"users.update.own",
		],
		"delete": [
			"pets.delete.own",
		],
	}


@tool("read_my_appointments")
def read_my_appointments(action: str = "fetch") -> list[dict[str, Any]]:
	"""Retrieve all appointments belonging to the current client."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["appointments"].get_appointments(_client_token())
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_clinic_appointments")
def read_clinic_appointments(action: str = "fetch") -> list[dict[str, Any]]:
	"""Retrieve all appointments for the clinic."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["appointments"].get_appointments(_client_token())
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_visits")
def read_my_visits(action: str = "fetch") -> list[dict[str, Any]]:
	"""Retrieve all veterinary visit records for the current client."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["visits"].list_visits(_client_token())
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_prescriptions")
def read_my_prescriptions(action: str = "fetch") -> list[dict[str, Any]]:
	"""Retrieve all prescriptions for the current client."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["prescriptions"].list_prescriptions(_client_token())
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_prescription_items")
def read_my_prescription_items(action: str = "fetch") -> list[dict[str, Any]]:
	"""Retrieve all individual prescription items (medications) for the current client."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["prescription_items"].list_prescription_items(_client_token())
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_drugs")
def read_drugs(drug_ids: str = "") -> list[dict[str, Any]]:
	"""Retrieve drug/medication information. Optionally pass drug_ids as a comma-separated string to filter."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			ids = [d.strip() for d in drug_ids.split(",") if d.strip()] if drug_ids else []
			if ids:
				return await services["drugs"].list_by_drug_ids(ids)
			resolved_clinic = await _resolve_clinic_id()
			return await services["drugs"].list_drugs(_client_token(resolved_clinic or ""))
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_pets")
def read_my_pets(action: str = "fetch") -> list[dict[str, Any]]:
	"""Retrieve all pets owned by the current client."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["pets"].list_pets(_client_token())
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_profile")
def read_my_profile(action: str = "fetch") -> dict[str, Any]:
	"""Retrieve the profile information for the current client."""
	services = _services()

	async def _query() -> dict[str, Any]:
		try:
			resolved_clinic = await _resolve_clinic_id()
			token = _client_token(resolved_clinic or "")
			doc = await services["users"].get_user(_get_client_id(), token)
			return {"success": True, "data": doc}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_query())


# ── Write tools ─────────────────────────────────────────────────────────────

@tool("add_my_appointment")
def add_my_appointment(
	pet_id: str,
	appointment_date: str = "",
	reason: str = "",
	doctor_id: str = "",
) -> dict[str, Any]:
	"""Create a new appointment for a pet. Requires pet_id. Optionally provide appointment_date (ISO format), reason, and doctor_id."""
	services = _services()

	async def _create() -> dict[str, Any]:
		parsed_date = None
		if appointment_date:
			try:
				parsed_date = datetime.fromisoformat(appointment_date)
			except ValueError:
				return {"success": False, "message": "appointment_date must be ISO format."}

		request = AppointmentCreate(
			pet_id=pet_id,
			client_id=_get_client_id(),
			doctor_id=doctor_id or None,
			appointment_date=parsed_date,
			reason=reason or None,
		)

		try:
			created = await services["appointments"].create_appointment(
				request,
				_client_token(),
			)
			return {"success": True, "data": created}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_create())


@tool("add_my_pet")
def add_my_pet(
	name: str,
	weight: float,
	pet_type: str,
) -> dict[str, Any]:
	"""Add a new pet for the current client. Requires name, weight, and pet_type (e.g. 'dog', 'cat')."""
	services = _services()

	async def _create() -> dict[str, Any]:
		try:
			request = PetCreate(
				name=name,
				weight=weight,
				type=pet_type,
				client_id=_get_client_id(),
			)
			created = await services["pets"].create_pet(
				request,
				_client_token(),
			)
			return {"success": True, "data": created}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}
		except Exception as exc:
			return {"success": False, "message": str(exc)}

	return _run_async(_create())


@tool("update_my_pet")
def update_my_pet(
	pet_id: str,
	name: str = "",
	weight: str = "",
	pet_type: str = "",
) -> dict[str, Any]:
	"""Update an existing pet's information. Requires pet_id. Provide any of name, weight, or pet_type to update."""
	services = _services()

	async def _update() -> dict[str, Any]:
		parsed_weight = None
		if weight:
			try:
				parsed_weight = float(weight)
			except ValueError:
				return {"success": False, "message": "weight must be a number."}

		if not name and parsed_weight is None and not pet_type:
			return {"success": False, "message": "No fields provided for update."}

		request = PetUpdate(
			name=name or None,
			weight=parsed_weight,
			type=pet_type or None,
		)
		try:
			updated = await services["pets"].update_pet(
				pet_id,
				request,
				_client_token(),
			)
			return {"success": True, "data": updated}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_update())


@tool("update_my_profile")
def update_my_profile(
	fullname: str = "",
	phone: str = "",
	email: str = "",
) -> dict[str, Any]:
	"""Update the current client's profile. Provide any of fullname, phone, or email to update."""
	services = _services()

	async def _update() -> dict[str, Any]:
		if not fullname and not phone and not email:
			return {"success": False, "message": "No fields provided for update."}

		resolved_clinic = await _resolve_clinic_id()
		request = UserUpdate(
			fullname=fullname or None,
			phone=phone or None,
			email=email or None,
		)
		try:
			updated = await services["users"].update_user(
				_get_client_id(),
				request,
				_client_token(resolved_clinic or ""),
			)
			return {"success": True, "data": updated}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_update())


@tool("delete_my_pet")
def delete_my_pet(pet_id: str) -> dict[str, Any]:
	"""Delete a pet by pet_id. The pet must belong to the current client."""
	services = _services()

	async def _delete() -> dict[str, Any]:
		try:
			await services["pets"].delete_pet(pet_id, _client_token())
			return {"success": True, "message": "Pet deleted successfully.", "data": {"pet_id": pet_id}}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_delete())

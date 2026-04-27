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
# set_context() is called on the thread-pool thread where CrewAI runs.
# Tool functions (also on that thread) capture values BEFORE _run_async()
# schedules work on the main event loop thread.
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


def _make_token(client_id: str, clinic_id: str = "") -> TokenData:
	return TokenData(
		user_id=client_id,
		email="",
		role=UserRole.CLIENT,
		clinic_id=clinic_id or None,
		is_superuser=False,
	)


async def _resolve_clinic(client_id: str, clinic_id: str) -> str:
	if clinic_id:
		return clinic_id
	db = get_database()
	user_repo = UserRepository(db)
	user = await user_repo.get_by_user_id(client_id)
	return (user.get("clinic_id") if user else None) or ""


# ── Read-only tools ─────────────────────────────────────────────────────────
# All params are required (no defaults) so Groq always gets every property
# in the tool call. Pass empty string "" for unused optional fields.

@tool("read_my_appointments")
def read_my_appointments(action: str) -> list[dict[str, Any]]:
	"""Retrieve all appointments belonging to the current client. Pass action='fetch'."""
	services = _services()
	token = _make_token(_get_client_id(), _get_clinic_id())

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["appointments"].get_appointments(token)
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_clinic_appointments")
def read_clinic_appointments(action: str) -> list[dict[str, Any]]:
	"""Retrieve all appointments for the clinic. Pass action='fetch'."""
	client_id = _get_client_id()
	clinic_id = _get_clinic_id()

	async def _query() -> list[dict[str, Any]]:
		try:
			resolved_clinic_id = await _resolve_clinic(client_id, clinic_id)
			if not resolved_clinic_id:
				return []

			db = get_database()
			repo = AppointmentRepository(db)
			appointments = await repo.list(clinic_id=resolved_clinic_id, is_superuser=False)

			# Return a privacy-safe clinic schedule view.
			return [
				{
					"appointment_id": appt.get("appointment_id"),
					"pet_id": appt.get("pet_id"),
					"doctor_id": appt.get("doctor_id"),
					"appointment_date": appt.get("appointment_date"),
					"status": appt.get("status"),
				}
				for appt in appointments
			]
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_visits")
def read_my_visits(action: str) -> list[dict[str, Any]]:
	"""Retrieve all veterinary visit records for the current client. Pass action='fetch'."""
	services = _services()
	token = _make_token(_get_client_id(), _get_clinic_id())

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["visits"].list_visits(token)
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_prescriptions")
def read_my_prescriptions(action: str) -> list[dict[str, Any]]:
	"""Retrieve all prescriptions for the current client. Pass action='fetch'."""
	services = _services()
	token = _make_token(_get_client_id(), _get_clinic_id())

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["prescriptions"].list_prescriptions(token)
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_prescription_items")
def read_my_prescription_items(action: str) -> list[dict[str, Any]]:
	"""Retrieve all individual prescription items (medications) for the current client. Pass action='fetch'."""
	services = _services()
	token = _make_token(_get_client_id(), _get_clinic_id())

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["prescription_items"].list_prescription_items(token)
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_drugs")
def read_drugs(drug_ids: str) -> list[dict[str, Any]]:
	"""Retrieve drug/medication information. Pass drug_ids as comma-separated string, or empty string "" to list all."""
	services = _services()
	client_id = _get_client_id()
	clinic_id = _get_clinic_id()

	async def _query() -> list[dict[str, Any]]:
		try:
			ids = [d.strip() for d in drug_ids.split(",") if d.strip()] if drug_ids else []
			if ids:
				return await services["drugs"].list_by_drug_ids(ids)
			resolved = await _resolve_clinic(client_id, clinic_id)
			return await services["drugs"].list_drugs(_make_token(client_id, resolved))
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_pets")
def read_my_pets(action: str) -> list[dict[str, Any]]:
	"""Retrieve all pets owned by the current client. Pass action='fetch'."""
	services = _services()
	token = _make_token(_get_client_id(), _get_clinic_id())

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["pets"].list_pets(token)
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_profile")
def read_my_profile(action: str) -> dict[str, Any]:
	"""Retrieve the profile information for the current client. Pass action='fetch'."""
	services = _services()
	client_id = _get_client_id()
	clinic_id = _get_clinic_id()

	async def _query() -> dict[str, Any]:
		try:
			resolved = await _resolve_clinic(client_id, clinic_id)
			doc = await services["users"].get_user(client_id, _make_token(client_id, resolved))
			return {"success": True, "data": doc}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_query())


# ── Write tools ─────────────────────────────────────────────────────────────
# All params required. Pass empty string "" for fields the user hasn't provided.

@tool("add_my_appointment")
def add_my_appointment(
	pet_id: str,
	appointment_date: str,
	reason: str,
	doctor_id: str,
) -> dict[str, Any]:
	"""Create a new appointment for a pet. Requires pet_id. Pass empty string "" for appointment_date, reason, or doctor_id if not provided by user."""
	services = _services()
	client_id = _get_client_id()
	token = _make_token(client_id, _get_clinic_id())

	async def _create() -> dict[str, Any]:
		parsed_date = None
		if appointment_date:
			try:
				parsed_date = datetime.fromisoformat(appointment_date)
			except ValueError:
				return {"success": False, "message": "appointment_date must be ISO format."}

		request = AppointmentCreate(
			pet_id=pet_id,
			client_id=client_id,
			doctor_id=doctor_id or None,
			appointment_date=parsed_date,
			reason=reason or None,
		)

		try:
			created = await services["appointments"].create_appointment(request, token)
			return {"success": True, "data": created}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_create())


@tool("add_my_pet")
def add_my_pet(
	name: str,
	weight: str,
	pet_type: str,
) -> dict[str, Any]:
	"""Add a new pet for the current client. Requires name, weight (number as string), and pet_type (e.g. 'dog', 'cat')."""
	services = _services()
	client_id = _get_client_id()
	token = _make_token(client_id, _get_clinic_id())

	async def _create() -> dict[str, Any]:
		try:
			parsed_weight = float(weight)
		except (ValueError, TypeError):
			return {"success": False, "message": "weight must be a valid number."}

		try:
			request = PetCreate(
				name=name,
				weight=parsed_weight,
				type=pet_type,
				client_id=client_id,
			)
			created = await services["pets"].create_pet(request, token)
			return {"success": True, "data": created}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}
		except Exception as exc:
			return {"success": False, "message": str(exc)}

	return _run_async(_create())


@tool("update_my_pet")
def update_my_pet(
	pet_id: str,
	name: str,
	weight: str,
	pet_type: str,
) -> dict[str, Any]:
	"""Update an existing pet's information. Requires pet_id. Pass empty string "" for name, weight, or pet_type if not changing."""
	services = _services()
	token = _make_token(_get_client_id(), _get_clinic_id())

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
			updated = await services["pets"].update_pet(pet_id, request, token)
			return {"success": True, "data": updated}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_update())


@tool("update_my_profile")
def update_my_profile(
	fullname: str,
	phone: str,
	email: str,
) -> dict[str, Any]:
	"""Update the current client's profile. Pass empty string "" for fields not being changed."""
	services = _services()
	client_id = _get_client_id()
	clinic_id = _get_clinic_id()

	async def _update() -> dict[str, Any]:
		if not fullname and not phone and not email:
			return {"success": False, "message": "No fields provided for update."}

		resolved = await _resolve_clinic(client_id, clinic_id)
		request = UserUpdate(
			fullname=fullname or None,
			phone=phone or None,
			email=email or None,
		)
		try:
			updated = await services["users"].update_user(
				client_id, request, _make_token(client_id, resolved),
			)
			return {"success": True, "data": updated}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_update())


@tool("delete_my_pet")
def delete_my_pet(pet_id: str) -> dict[str, Any]:
	"""Delete a pet by pet_id. The pet must belong to the current client."""
	services = _services()
	token = _make_token(_get_client_id(), _get_clinic_id())

	async def _delete() -> dict[str, Any]:
		try:
			await services["pets"].delete_pet(pet_id, token)
			return {"success": True, "message": "Pet deleted successfully.", "data": {"pet_id": pet_id}}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_delete())

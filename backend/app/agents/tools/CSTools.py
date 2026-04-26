from __future__ import annotations

import asyncio
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


def _client_token(client_id: str, clinic_id: str | None = None) -> TokenData:
	return TokenData(
		user_id=client_id,
		email="",
		role=UserRole.CLIENT,
		clinic_id=clinic_id,
		is_superuser=False,
	)


async def _resolve_clinic_id(client_id: str, clinic_id: str | None = None) -> str | None:
	"""Return *clinic_id* if already provided, otherwise look it up from the client's DB record."""
	if clinic_id:
		return clinic_id
	db = get_database()
	user_repo = UserRepository(db)
	user = await user_repo.get_by_user_id(client_id)
	return user.get("clinic_id") if user else None


@tool("client_allowed_actions")
def client_allowed_actions(client_id: str) -> dict[str, list[str]]:
	"""Return the list of actions a client is allowed to perform, grouped by category (read, add, update, delete). Requires client_id."""
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
def read_my_appointments(client_id: str) -> list[dict[str, Any]]:
	"""Retrieve all appointments belonging to the client identified by client_id."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["appointments"].get_appointments(_client_token(client_id))
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_clinic_appointments")
def read_clinic_appointments(client_id: str, clinic_id: str | None = None) -> list[dict[str, Any]]:
	"""Retrieve all appointments for the clinic. Requires client_id for auth and optionally clinic_id."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["appointments"].get_appointments(_client_token(client_id, clinic_id))
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_visits")
def read_my_visits(client_id: str) -> list[dict[str, Any]]:
	"""Retrieve all veterinary visit records for the client identified by client_id."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["visits"].list_visits(_client_token(client_id))
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_prescriptions")
def read_my_prescriptions(client_id: str) -> list[dict[str, Any]]:
	"""Retrieve all prescriptions for the client identified by client_id."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["prescriptions"].list_prescriptions(_client_token(client_id))
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_prescription_items")
def read_my_prescription_items(client_id: str) -> list[dict[str, Any]]:
	"""Retrieve all individual prescription items (medications) for the client identified by client_id."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["prescription_items"].list_prescription_items(_client_token(client_id))
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_drugs")
def read_drugs(client_id: str, clinic_id: str | None = None, drug_ids: list[str] | None = None) -> list[dict[str, Any]]:
	"""Retrieve drug/medication information. Optionally filter by a list of drug_ids."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			if drug_ids:
				return await services["drugs"].list_by_drug_ids(drug_ids)
			resolved_clinic = await _resolve_clinic_id(client_id, clinic_id)
			return await services["drugs"].list_drugs(_client_token(client_id, resolved_clinic))
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_pets")
def read_my_pets(client_id: str) -> list[dict[str, Any]]:
	"""Retrieve all pets owned by the client identified by client_id."""
	services = _services()

	async def _query() -> list[dict[str, Any]]:
		try:
			return await services["pets"].list_pets(_client_token(client_id))
		except HTTPException:
			return []

	return _run_async(_query())


@tool("read_my_profile")
def read_my_profile(client_id: str, clinic_id: str | None = None) -> dict[str, Any]:
	"""Retrieve the profile information for the client identified by client_id."""
	services = _services()

	async def _query() -> dict[str, Any]:
		try:
			resolved_clinic = await _resolve_clinic_id(client_id, clinic_id)
			doc = await services["users"].get_user(client_id, _client_token(client_id, resolved_clinic))
			return {"success": True, "data": doc}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_query())


@tool("add_my_appointment")
def add_my_appointment(
	client_id: str,
	pet_id: str,
	appointment_date: str | None = None,
	reason: str | None = None,
	doctor_id: str | None = None,
	clinic_id: str | None = None,
) -> dict[str, Any]:
	"""Create a new appointment for a pet. Requires client_id and pet_id. Optionally provide appointment_date (ISO format), reason, and doctor_id."""
	services = _services()

	async def _create() -> dict[str, Any]:
		try:
			parsed_date = datetime.fromisoformat(appointment_date) if appointment_date else None
		except ValueError:
			return {"success": False, "message": "appointment_date must be ISO format."}

		request = AppointmentCreate(
			pet_id=pet_id,
			client_id=client_id,
			doctor_id=doctor_id,
			appointment_date=parsed_date,
			reason=reason,
		)

		try:
			created = await services["appointments"].create_appointment(
				request,
				_client_token(client_id, clinic_id),
			)
			return {"success": True, "data": created}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_create())


@tool("add_my_pet")
def add_my_pet(
	client_id: str,
	name: str,
	weight: float,
	pet_type: str,
	clinic_id: str | None = None,
) -> dict[str, Any]:
	"""Add a new pet for the client. Requires name, weight, and pet_type (e.g. 'dog', 'cat')."""
	services = _services()

	async def _create() -> dict[str, Any]:
		try:
			request = PetCreate(
				name=name,
				weight=weight,
				type=pet_type,
				client_id=client_id,
			)
			created = await services["pets"].create_pet(
				request,
				_client_token(client_id, clinic_id),
			)
			return {"success": True, "data": created}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}
		except Exception as exc:
			return {"success": False, "message": str(exc)}

	return _run_async(_create())


@tool("update_my_pet")
def update_my_pet(
	client_id: str,
	pet_id: str,
	name: str | None = None,
	weight: float | None = None,
	pet_type: str | None = None,
	clinic_id: str | None = None,
) -> dict[str, Any]:
	"""Update an existing pet's information. Requires pet_id. Provide any of name, weight, or pet_type to update."""
	services = _services()

	async def _update() -> dict[str, Any]:
		if name is None and weight is None and pet_type is None:
			return {"success": False, "message": "No fields provided for update."}

		request = PetUpdate(name=name, weight=weight, type=pet_type)
		try:
			updated = await services["pets"].update_pet(
				pet_id,
				request,
				_client_token(client_id, clinic_id),
			)
			return {"success": True, "data": updated}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_update())


@tool("update_my_profile")
def update_my_profile(
	client_id: str,
	clinic_id: str | None = None,
	fullname: str | None = None,
	phone: str | None = None,
	email: str | None = None,
) -> dict[str, Any]:
	"""Update the client's profile. Provide any of fullname, phone, or email to update."""
	services = _services()

	async def _update() -> dict[str, Any]:
		if fullname is None and phone is None and email is None:
			return {"success": False, "message": "No fields provided for update."}

		resolved_clinic = await _resolve_clinic_id(client_id, clinic_id)
		request = UserUpdate(fullname=fullname, phone=phone, email=email)
		try:
			updated = await services["users"].update_user(
				client_id,
				request,
				_client_token(client_id, resolved_clinic),
			)
			return {"success": True, "data": updated}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_update())


@tool("delete_my_pet")
def delete_my_pet(client_id: str, pet_id: str, clinic_id: str | None = None) -> dict[str, Any]:
	"""Delete a pet by pet_id. The pet must belong to the client identified by client_id."""
	services = _services()

	async def _delete() -> dict[str, Any]:
		try:
			await services["pets"].delete_pet(pet_id, _client_token(client_id, clinic_id))
			return {"success": True, "message": "Pet deleted successfully.", "data": {"pet_id": pet_id}}
		except HTTPException as exc:
			return {"success": False, "message": str(exc.detail)}

	return _run_async(_delete())


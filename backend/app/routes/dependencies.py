from app.controllers.auth_controller import AuthController
from app.controllers.appointment_controller import AppointmentController
from app.controllers.clinic_controller import ClinicController
from app.controllers.drug_controller import DrugController
from app.controllers.pet_controller import PetController
from app.controllers.prescription_controller import PrescriptionController
from app.controllers.prescription_item_controller import PrescriptionItemController
from app.controllers.user_controller import UserController
from app.controllers.visit_controller import VisitController
from app.core.database import get_database
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.clinic_repository import ClinicRepository
from app.repositories.drug_repository import DrugRepository
from app.repositories.pet_repository import PetRepository
from app.repositories.prescription_repository import PrescriptionRepository
from app.repositories.prescription_item_repository import PrescriptionItemRepository
from app.repositories.user_repository import UserRepository
from app.repositories.visit_repository import VisitRepository
from app.services.auth_service import AuthService
from app.services.appointment_service import AppointmentService
from app.services.clinic_service import ClinicService
from app.services.credential_service import CredentialService
from app.services.drug_service import DrugService
from app.services.user_service import UserService
from app.services.pet_service import PetService
from app.services.prescription_service import PrescriptionService
from app.services.prescription_item_service import PrescriptionItemService
from app.services.visit_service import VisitService


def get_auth_controller() -> AuthController:
    db = get_database()
    user_repo = UserRepository(db)
    clinic_repo = ClinicRepository(db)
    auth_service = AuthService(user_repo, clinic_repo)
    return AuthController(auth_service)


def get_clinic_controller() -> ClinicController:
    db = get_database()
    clinic_repo = ClinicRepository(db)
    clinic_service = ClinicService(clinic_repo)
    return ClinicController(clinic_service)


def get_user_controller() -> UserController:
    db = get_database()
    user_repo = UserRepository(db)
    clinic_repo = ClinicRepository(db)
    credential_service = CredentialService()
    user_service = UserService(user_repo, clinic_repo, credential_service)
    return UserController(user_service)


def get_drug_controller() -> DrugController:
    db = get_database()
    repo = DrugRepository(db)
    service = DrugService(repo)
    return DrugController(service)


def get_pet_controller() -> PetController:
    db = get_database()
    repo = PetRepository(db)
    user_repo = UserRepository(db)
    service = PetService(repo, user_repo)
    return PetController(service)


def get_prescription_item_controller() -> PrescriptionItemController:
    db = get_database()
    repo = PrescriptionItemRepository(db)
    service = PrescriptionItemService(repo)
    return PrescriptionItemController(service)


def get_prescription_controller() -> PrescriptionController:
    db = get_database()
    repo = PrescriptionRepository(db)
    drug_repo = DrugRepository(db)
    rx_item_repo = PrescriptionItemRepository(db)
    service = PrescriptionService(repo, drug_repo, rx_item_repo)
    return PrescriptionController(service)


def get_visit_controller() -> VisitController:
    db = get_database()
    repo = VisitRepository(db)
    user_repo = UserRepository(db)
    service = VisitService(repo, user_repo)
    return VisitController(service)


def get_appointment_controller() -> AppointmentController:
    db = get_database()
    appointment_repo = AppointmentRepository(db)
    clinic_repo = ClinicRepository(db)
    pet_repo = PetRepository(db)
    user_repo = UserRepository(db)
    service = AppointmentService(appointment_repo, clinic_repo, pet_repo, user_repo)
    return AppointmentController(service)

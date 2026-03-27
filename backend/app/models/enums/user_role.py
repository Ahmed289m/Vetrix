from enum import Enum


class UserRole(str, Enum):
    DOCTOR = "doctor"
    STAFF = "staff"
    OWNER = "owner"
    ADMIN = "admin"
    CLIENT = "client"

import re

from app.models.enums.user_role import UserRole


class CredentialService:
    @staticmethod
    def _slug(value: str) -> str:
        cleaned = re.sub(r"[^a-zA-Z0-9]+", ".", value.strip().lower())
        return cleaned.strip(".")

    def generate_email(self, fullname: str, role: UserRole, clinic_name: str) -> str:
        name_slug = self._slug(fullname)
        role_slug = self._slug(role.value if hasattr(role, "value") else str(role))
        clinic_slug = self._slug(clinic_name)
        return f"{name_slug}.{role_slug}@{clinic_slug}.vetrix.local"

    def generate_password(self, fullname: str, clinic_name: str, user_id: str) -> str:
        name_token = self._slug(fullname).replace(".", "")
        clinic_token = self._slug(clinic_name).replace(".", "")
        return f"{name_token}@{clinic_token}#{user_id}"

    def get_or_set_email(
        self, provided_email: str | None, fullname: str, role: UserRole, clinic_name: str
    ) -> str:
        return provided_email or self.generate_email(fullname, role, clinic_name)

    def get_or_set_password(
        self, provided_password: str | None, fullname: str, clinic_name: str, user_id: str
    ) -> str:
        return provided_password or self.generate_password(fullname, clinic_name, user_id)

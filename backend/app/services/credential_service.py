import re
import secrets

from app.models.enums.user_role import UserRole


class CredentialService:
    @staticmethod
    def _slug(value: str) -> str:
        cleaned = re.sub(r"[^a-zA-Z0-9]+", ".", value.strip().lower())
        return cleaned.strip(".")

    @staticmethod
    def _first_two_name_parts(fullname: str) -> str:
        parts = [p for p in re.split(r"\s+", fullname.strip()) if p]
        if len(parts) >= 2:
            return " ".join(parts[:2])
        return fullname

    def generate_email(self, fullname: str, role: UserRole, clinic_name: str) -> str:
        name_slug = self._slug(self._first_two_name_parts(fullname)) or self._slug(fullname)
        role_slug = self._slug(role.value if hasattr(role, "value") else str(role))
        clinic_slug = self._slug(clinic_name)
        return f"{name_slug}.{role_slug}@{clinic_slug}.vetrix"

    def generate_password(self, fullname: str, clinic_name: str, user_id: str) -> str:
        """Generate a 15-char password using name + clinic + random number + special char."""
        _ = user_id  # Kept for signature compatibility with existing callers.

        name_source = self._slug(self._first_two_name_parts(fullname)).replace(".", "")
        clinic_source = self._slug(clinic_name).replace(".", "")

        name_part = (name_source + "user")[:4]
        clinic_part = (clinic_source + "vetx")[:4]
        random_number = f"{secrets.randbelow(1_000_000):06d}"
        special_char = secrets.choice("!@#$%&*")

        # 4 (name) + 1 (special) + 4 (clinic) + 6 (random digits) = 15 chars
        return f"{name_part}{special_char}{clinic_part}{random_number}"

    def get_or_set_email(
        self, provided_email: str | None, fullname: str, role: UserRole, clinic_name: str
    ) -> str:
        return provided_email or self.generate_email(fullname, role, clinic_name)

    def get_or_set_password(
        self, provided_password: str | None, fullname: str, clinic_name: str, user_id: str
    ) -> str:
        return provided_password or self.generate_password(fullname, clinic_name, user_id)

import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

from fastapi import HTTPException

from app.models.enums.user_role import UserRole
from app.services.visit_service import VisitService


class VisitServiceAccessTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.repository = MagicMock()
        self.user_repository = MagicMock()
        self.service = VisitService(self.repository, self.user_repository)

    async def test_list_visits_for_client_returns_only_owner_visits(self) -> None:
        current_user = SimpleNamespace(
            is_superuser=False,
            role=UserRole.CLIENT,
            user_id="client_1",
            clinic_id=None,
        )
        self.user_repository.get_by_user_id = AsyncMock(
            return_value={"user_id": "client_1", "clinic_id": "clinic_1"}
        )
        self.repository.list_by_owner = AsyncMock(
            return_value=[
                {
                    "_id": "visit_1",
                    "client_id": "client_1",
                    "clinic_id": "clinic_1",
                    "pet_id": "pet_1",
                    "doctor_id": "doctor_1",
                    "date": "2026-04-16T10:00:00Z",
                }
            ]
        )

        result = await self.service.list_visits(current_user)

        self.repository.list_by_owner.assert_awaited_once_with("client_1", "clinic_1")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["visit_id"], "visit_1")
        self.assertEqual(result[0]["client_id"], "client_1")

    async def test_list_visits_for_client_without_clinic_returns_empty(self) -> None:
        current_user = SimpleNamespace(
            is_superuser=False,
            role=UserRole.CLIENT,
            user_id="client_2",
            clinic_id=None,
        )
        self.user_repository.get_by_user_id = AsyncMock(
            return_value={"user_id": "client_2"}
        )
        self.repository.list_by_owner = AsyncMock()

        result = await self.service.list_visits(current_user)

        self.assertEqual(result, [])
        self.repository.list_by_owner.assert_not_called()

    async def test_get_visit_for_client_denies_other_owner_visit(self) -> None:
        current_user = SimpleNamespace(
            is_superuser=False,
            role=UserRole.CLIENT,
            user_id="client_1",
            clinic_id=None,
        )
        self.service.crud = SimpleNamespace(
            get=AsyncMock(return_value={"visit_id": "visit_99", "client_id": "client_2"})
        )

        with self.assertRaises(HTTPException) as ctx:
            await self.service.get_visit("visit_99", current_user)

        self.assertEqual(ctx.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()

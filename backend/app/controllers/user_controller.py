from app.schemas.user import UserCreate, UserUpdate
from app.services.user_service import UserService


class UserController:
    def __init__(self, user_service: UserService) -> None:
        self.user_service = user_service

    async def create_user(self, request: UserCreate) -> dict:
        return await self.user_service.create_user(request)

    async def list_users(self) -> list[dict]:
        return await self.user_service.list_users()

    async def get_user(self, user_id: str) -> dict:
        return await self.user_service.get_user(user_id)

    async def update_user(self, user_id: str, request: UserUpdate) -> dict:
        return await self.user_service.update_user(user_id, request)

    async def delete_user(self, user_id: str) -> None:
        await self.user_service.delete_user(user_id)

from app.core.permission_checker import TokenData
from app.schemas.user import UserCreate, UserUpdate
from app.services.user_service import UserService


class UserController:
    def __init__(self, user_service: UserService) -> None:
        self.user_service = user_service

    async def create_user(self, request: UserCreate, current_user: TokenData) -> dict:
        return await self.user_service.create_user(request, current_user)

    async def list_users(self, current_user: TokenData) -> list[dict]:
        return await self.user_service.list_users(current_user)

    async def get_user(self, user_id: str, current_user: TokenData) -> dict:
        return await self.user_service.get_user(user_id, current_user)

    async def update_user(self, user_id: str, request: UserUpdate, current_user: TokenData) -> dict:
        return await self.user_service.update_user(user_id, request, current_user)

    async def delete_user(self, user_id: str, current_user: TokenData) -> None:
        await self.user_service.delete_user(user_id, current_user)

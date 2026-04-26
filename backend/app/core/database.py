import asyncio

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None
_loop: asyncio.AbstractEventLoop | None = None


async def connect_to_mongo() -> None:
    global client, db, _loop
    _loop = asyncio.get_running_loop()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]


async def close_mongo_connection() -> None:
    global client, db
    if client is not None:
        client.close()
    client = None
    db = None


def get_database() -> AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("Database is not connected. Call connect_to_mongo() first.")
    return db


def get_event_loop() -> asyncio.AbstractEventLoop:
    if _loop is None:
        raise RuntimeError("Database is not connected. Call connect_to_mongo() first.")
    return _loop

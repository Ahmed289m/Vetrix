"""
WebSocket broadcast helper.

Import ``broadcast`` in any controller / route to push real-time events
to all connected frontend clients after a mutation (create / update / delete).

Usage:
    from app.utils.ws import broadcast
    await broadcast("pets:created", {"pet_id": "123"})
"""


async def broadcast(event: str, data: dict | None = None) -> None:
    """Broadcast an event via the global WebSocket manager.

    The import is deferred to avoid circular imports.
    """
    from app.websocket.dependencies import ws_manager  # noqa: WPS433

    await ws_manager.broadcast(event, data)

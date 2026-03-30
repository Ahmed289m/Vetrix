"""WebSocket connection manager for real-time broadcasting."""

import logging
from typing import Optional

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages active WebSocket connections for real-time broadcasting.

    Features:
    - Maintains a list of active connections.
    - Safely broadcasts events to all connected clients.
    - Handles disconnections gracefully.
    - Removes dead connections automatically during broadcast.
    """

    def __init__(self) -> None:
        """Initialize the connection manager with an empty connection list."""
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """
        Accept and register a new WebSocket connection.

        Args:
            websocket: The WebSocket connection to register.
        """
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.debug(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        """
        Unregister a WebSocket connection.

        Args:
            websocket: The WebSocket connection to remove.
        """
        try:
            self.active_connections.remove(websocket)
            logger.debug(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
        except ValueError:
            logger.warning("Attempted to disconnect a connection that was not in the list.")

    async def broadcast(self, event: str, data: Optional[dict] = None) -> None:
        """
        Broadcast an event to all connected clients.

        Automatically removes dead connections if sending fails.

        Args:
            event: The event name to broadcast.
            data: Optional data payload to include with the event.
        """
        message = {"event": event, "data": data}
        dead_connections: list[WebSocket] = []

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as exc:
                logger.warning(f"Failed to send message to client: {exc}. Marking for removal.")
                dead_connections.append(connection)

        # Remove dead connections
        for dead_connection in dead_connections:
            try:
                self.active_connections.remove(dead_connection)
                logger.debug(f"Removed dead connection. Total connections: {len(self.active_connections)}")
            except ValueError:
                pass  # Already removed

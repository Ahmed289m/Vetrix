"""WebSocket dependencies and singleton instances."""

from app.websocket.manager import ConnectionManager

# Global WebSocket connection manager singleton
ws_manager = ConnectionManager()

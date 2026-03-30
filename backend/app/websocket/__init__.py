"""WebSocket module for real-time communication."""

from app.websocket.dependencies import ws_manager
from app.websocket.routes import router

__all__ = ["ws_manager", "router"]

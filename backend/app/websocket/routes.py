"""WebSocket routes and endpoints."""

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket.dependencies import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time client connections.

    Accepts connections, maintains the connection alive, and broadcasts
    server events. Also handles incoming ping messages for keep-alive.

    Lifecycle:
    - Client connects → connection registered in ws_manager
    - Server broadcasts events → all connected clients receive them
    - Client sends ping → server responds with pong
    - Client disconnects → connection unregistered from ws_manager
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; clients can also send pings
            data = await websocket.receive_json()

            # Handle client-to-server ping/pong for keep-alive
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as exc:
        logger.error(f"WebSocket error: {exc}")
        ws_manager.disconnect(websocket)

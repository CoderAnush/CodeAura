"""
WebSocket support for real-time collaboration
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio
from datetime import datetime


class ConnectionManager:
    def __init__(self):
        # Store active connections by room/project
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Store user data
        self.user_data: Dict[str, dict] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        
        # Store user info
        self.user_data[user_id] = {
            "websocket": websocket,
            "room_id": room_id,
            "joined_at": datetime.utcnow(),
            "cursor_position": {"line": 0, "column": 0}
        }
        
        # Notify others in room
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        room_id = self.user_data.get(user_id, {}).get("room_id")
        if room_id and room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        
        if user_id in self.user_data:
            del self.user_data[user_id]
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            # Add timestamp if not present
            if "timestamp" not in message:
                message["timestamp"] = datetime.utcnow().isoformat()
                
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    # Remove dead connections
                    if room_id in self.active_connections:
                        self.active_connections[room_id] = [
                            conn for conn in self.active_connections[room_id] 
                            if conn != connection
                        ]


# Global connection manager
manager = ConnectionManager()


async def handle_collaboration(websocket: WebSocket, room_id: str, user_id: str):
    """Handle real-time collaboration WebSocket connections"""
    await manager.connect(websocket, room_id, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message["type"] == "code_change":
                # Broadcast code changes to all users in room
                await manager.broadcast_to_room(room_id, {
                    "type": "code_update",
                    "user_id": user_id,
                    "changes": message.get("changes", []),
                    "full_code": message.get("full_code", "")
                })
                
            elif message["type"] == "cursor_move":
                # Update cursor position
                if user_id in manager.user_data:
                    manager.user_data[user_id]["cursor_position"] = message.get("position", {})
                
                # Broadcast cursor position
                await manager.broadcast_to_room(room_id, {
                    "type": "cursor_update",
                    "user_id": user_id,
                    "position": message.get("position", {})
                })
                
            elif message["type"] == "chat_message":
                # Broadcast chat messages
                await manager.broadcast_to_room(room_id, {
                    "type": "chat",
                    "user_id": user_id,
                    "message": message.get("message", ""),
                    "username": message.get("username", "Anonymous")
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        await manager.broadcast_to_room(room_id, {
            "type": "user_left",
            "user_id": user_id
        })

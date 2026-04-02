"""Real-time updates using WebSockets"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
from datetime import datetime

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int = None):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: int = None):
        """Remove a WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to a specific connection"""
        try:
            await websocket.send_json(message)
        except:
            pass
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            self.disconnect(conn)
    
    async def send_to_user(self, user_id: int, message: dict):
        """Send message to all connections of a specific user"""
        if user_id in self.user_connections:
            disconnected = []
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.disconnect(conn, user_id)
    
    async def send_to_state(self, state: str, message: dict, user_states: Dict[int, str]):
        """Send message to all users in a specific state"""
        target_users = [uid for uid, st in user_states.items() if st == state]
        for user_id in target_users:
            await self.send_to_user(user_id, message)

# Global connection manager
manager = ConnectionManager()

async def notify_new_submission(submission_data: dict, state: str, user_states: Dict[int, str]):
    """Notify all users about a new submission"""
    message = {
        "type": "new_submission",
        "data": submission_data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.send_to_state(state, message, user_states)
    await manager.broadcast({
        "type": "stats_update",
        "message": f"New incident reported in {state}",
        "timestamp": datetime.utcnow().isoformat()
    })

async def notify_red_alert(alert_data: dict):
    """Notify all users about a RED alert"""
    message = {
        "type": "red_alert",
        "data": alert_data,
        "priority": "high",
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast(message)

async def notify_report_generated(report_type: str, report_data: dict):
    """Notify users when a report is generated"""
    message = {
        "type": "report_generated",
        "report_type": report_type,
        "data": report_data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast(message)

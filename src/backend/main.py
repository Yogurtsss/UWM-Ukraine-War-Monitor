from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Dict, Any
import json
import logging
import os
from datetime import datetime

# Logging setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="UWM Relay Server", version="2.0")

# SECURITY: Secret key for ingest (Must match in Home Engine)
INGEST_API_KEY = os.getenv("INGEST_API_KEY", "uwm_default_secret_key_change_me")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        logger.info(f"Client connected. Active: {len(self.active)}")

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)
        logger.info(f"Client disconnected. Active: {len(self.active)}")

    async def broadcast(self, message: str):
        dead = []
        for ws in self.active:
            try: await ws.send_text(message)
            except: dead.append(ws)
        for ws in dead: self.disconnect(ws)

manager = ConnectionManager()
recent_events_cache: List[Dict[str, Any]] = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    if recent_events_cache:
        await websocket.send_text(json.dumps({"source": "cache", "events": recent_events_cache}))
    try:
        while True: await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/ingest")
@app.post("/ingest")
async def ingest_data(data: Dict[str, Any], x_api_key: str = Header(None)):
    """The secure endpoint for the Home Engine to push data."""
    if x_api_key != INGEST_API_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API Key")
    
    events = data.get("events", [])
    source = data.get("source", "home_worker")
    
    if not events:
        return {"status": "ignored", "reason": "empty_batch"}

    # Update cache (keep last 500)
    global recent_events_cache
    recent_events_cache = (events + recent_events_cache)[:500]
    
    # Broadcast to all live users
    payload = json.dumps({"source": source, "events": events})
    await manager.broadcast(payload)
    
    logger.info(f"Ingested {len(events)} events from {source}")
    return {"status": "ok", "ingested": len(events)}

@app.get("/health")
async def health():
    return {"status": "live", "clients": len(manager.active), "cached": len(recent_events_cache)}

@app.get("/api/events")
@app.get("/events")
async def get_events():
    return {"events": recent_events_cache}

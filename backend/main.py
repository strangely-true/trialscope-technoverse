"""
FastAPI main entry point — TrialGo Backend.
All routers, WebSocket endpoints, CORS, and startup events.
"""
import os
from pathlib import Path
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Import all routers
from routers.auth import router as auth_router
from routers.trials import router as trials_router
from routers.patients import router as patients_router
from routers.consent import router as consent_router
from routers.monitoring import monitoring_router, coordinator_router, manager
from routers.pharma import router as pharma_router

# Import chatbot WebSocket handler
from agents.agent9_chatbot import run_trust_chatbot

# ─── App Factory ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="TrialGo API",
    description="AI-powered clinical trial recruitment platform. 12 specialised agents for end-to-end trial management.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3001",
        "*",  # Allow all origins for WebSocket compatibility in dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Startup Event ────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    """Initialize ORM metadata on startup. Migrations are handled by docker-compose command."""
    from db.database import engine, Base
    import models.models  # ensure all models are imported before create_all

    try:
        Base.metadata.create_all(bind=engine)
        print("TrialGo backend started - all tables initialised")
    except Exception as e:
        print(f"WARNING: Could not initialise tables on startup: {e}\nBackend will start anyway — DB may be temporarily unavailable.")


# ─── Routers ─────────────────────────────────────────────────────────────────

from routers.pharma import router as pharma_router
from routers.chat import router as chat_router
from routers.questionnaire import router as questionnaire_router

# ...

app.include_router(auth_router)
app.include_router(trials_router)
app.include_router(patients_router)
app.include_router(consent_router)
app.include_router(monitoring_router)
app.include_router(coordinator_router)
app.include_router(pharma_router)
app.include_router(chat_router)
app.include_router(questionnaire_router)


# ─── WebSocket — Trust Chatbot ────────────────────────────────────────────────

@app.websocket("/chatbot/{candidate_id}")
async def chatbot_endpoint(websocket: WebSocket, candidate_id: int):
    """Agent 9 — Patient Trust Chatbot via WebSocket."""
    await run_trust_chatbot(websocket, candidate_id)


# ─── WebSocket — Dashboard (top-level for easy frontend access) ───────────────

@app.websocket("/ws/dashboard/{trial_id}")
async def dashboard_ws(websocket: WebSocket, trial_id: int):
    """
    Agent 7/8 real-time coordinator dashboard stream.
    Broadcasts enrolled count and active anomaly alerts every 10 seconds.
    Registered at top level (/ws/dashboard/{trial_id}) for frontend compatibility.
    """
    from db.database import SessionLocal
    import asyncio
    from models.models import VerifiedPatient, AnomalyAlert

    await manager.connect(websocket, trial_id)
    db = SessionLocal()
    try:
        while True:
            patients = db.query(VerifiedPatient).filter(VerifiedPatient.trial_id == trial_id).all()
            alerts = (
                db.query(AnomalyAlert)
                .filter(AnomalyAlert.trial_id == trial_id, AnomalyAlert.resolved == False)
                .order_by(AnomalyAlert.created_at.desc())
                .limit(5)
                .all()
            )
            await websocket.send_json({
                "type": "cohort_update",
                "enrolled_count": len(patients),
                "active_alerts": len(alerts),
                "alerts": [
                    {
                        "id": a.id,
                        "biometric_type": a.biometric_type,
                        "patient_id": a.patient_id,
                        "alert_tier": a.alert_tier.value if hasattr(a.alert_tier, "value") else str(a.alert_tier),
                        "z_score": a.z_score,
                    }
                    for a in alerts
                ],
            })
            await asyncio.sleep(10)
    except Exception:
        manager.disconnect(websocket, trial_id)
    finally:
        db.close()


# ─── WebSocket — Per-user notification channel (for incoming call alerts) ──────

# user_id -> list of connected WebSockets
user_notification_sockets: dict[int, list[WebSocket]] = {}

@app.websocket("/ws/user/{user_id}")
async def user_notification_ws(websocket: WebSocket, user_id: int):
    """
    Each logged-in user (patient or coordinator) connects here.
    Used to push incoming-call notifications to a specific user.
    """
    from fastapi import WebSocketDisconnect
    await websocket.accept()
    user_notification_sockets.setdefault(user_id, []).append(websocket)
    try:
        while True:
            # Keep alive — client can also send pings
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        try:
            user_notification_sockets[user_id].remove(websocket)
        except (KeyError, ValueError):
            pass


async def _notify_user(user_id: int, payload: dict):
    """Send a JSON message to all active sockets for a user."""
    import json
    for ws in list(user_notification_sockets.get(user_id, [])):
        try:
            await ws.send_json(payload)
        except Exception:
            pass


# ─── WebSocket — WebRTC Signaling Relay ──────────────────────────────────────

call_rooms: dict[str, list[WebSocket]] = {}

@app.websocket("/ws/call/{room_id}")
async def webrtc_signal_ws(websocket: WebSocket, room_id: str):
    """
    Pure relay: forward every message received from one peer to all other peers
    in the same call room. Handles offer, answer, and ICE candidates.
    """
    from fastapi import WebSocketDisconnect
    import json
    await websocket.accept()
    call_rooms.setdefault(room_id, []).append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Relay to everyone else in the room
            for peer in list(call_rooms.get(room_id, [])):
                if peer is not websocket:
                    try:
                        await peer.send_text(data)
                    except Exception:
                        pass
    except Exception:
        pass
    finally:
        try:
            call_rooms[room_id].remove(websocket)
        except (KeyError, ValueError):
            pass
        # Notify remaining peers that this peer left
        for peer in list(call_rooms.get(room_id, [])):
            try:
                await peer.send_text('{"type":"peer_left"}')
            except Exception:
                pass


# ─── REST — Initiate in-browser call (coordinator → patient) ─────────────────

@app.post("/call/initiate/{verified_patient_id}")
async def initiate_portal_call(verified_patient_id: int, room_id: str):
    """
    Coordinator tells the backend to notify a patient of an incoming call.
    The backend pushes a 'incoming_call' event to the patient's notification socket.
    Both sides then connect to /ws/call/{room_id} for WebRTC signaling.
    """
    from db.database import SessionLocal
    from models.models import VerifiedPatient, IdentityMap, User
    import hashlib

    db = SessionLocal()
    try:
        vp = db.query(VerifiedPatient).filter(VerifiedPatient.id == verified_patient_id).first()
        if not vp:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Patient not found")

        # Find the User linked to this VerifiedPatient
        identity = db.query(IdentityMap).filter(IdentityMap.hash_id == vp.hash_id).first()
        patient_user = None
        if identity and identity.email:
            patient_user = db.query(User).filter(User.email == identity.email).first()
        if not patient_user:
            for u in db.query(User).filter(User.role == "patient").all():
                if hashlib.sha256(u.email.encode()).hexdigest() == vp.hash_id:
                    patient_user = u
                    break

        if patient_user:
            await _notify_user(patient_user.id, {
                "type": "incoming_call",
                "room_id": room_id,
                "from": "Your Trial Coordinator",
            })

        return {"status": "notified", "room_id": room_id}
    finally:
        db.close()


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "TrialGo API",
        "version": "1.0.0",
        "agents": 12,
    }


@app.get("/", tags=["System"])
def root():
    return {
        "message": "Welcome to TrialGo API 🧬",
        "docs": "/docs",
        "health": "/health",
    }

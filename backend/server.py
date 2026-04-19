from fastapi import FastAPI, APIRouter, HTTPException, Request, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Any, Optional, List, Dict
from datetime import datetime, timezone
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Fixed price packages — ALL pricing defined server-side
PACKAGES = {
    "match_skip": {"amount": 1.00, "currency": "usd", "label": "Match Skip/Fast"},
}

app = FastAPI(title="Master League API")
api_router = APIRouter(prefix="/api")


class SaveGameRequest(BaseModel):
    manager_name: str
    team_id: str
    state: dict


class SaveGameResponse(BaseModel):
    ok: bool
    manager_name: str
    updated_at: str


class LoadGameResponse(BaseModel):
    manager_name: str
    team_id: str
    state: dict
    updated_at: str


class LeaderboardEntry(BaseModel):
    manager_name: str
    team_id: str
    season: int
    current_week: int
    trophies: int
    updated_at: str


class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str
    manager_name: Optional[str] = None


class CheckoutResponse(BaseModel):
    url: str
    session_id: str


class PaymentStatusResponse(BaseModel):
    session_id: str
    payment_status: str
    status: str
    amount_total: int
    currency: str
    already_processed: bool


@api_router.get("/")
async def root():
    return {"service": "Master League", "status": "ok"}


# --- Save / Load ---

@api_router.post("/save", response_model=SaveGameResponse)
async def save_game(req: SaveGameRequest):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "manager_name": req.manager_name,
        "team_id": req.team_id,
        "state": req.state,
        "updated_at": now,
    }
    await db.saves.update_one(
        {"manager_name": req.manager_name},
        {"$set": doc},
        upsert=True,
    )
    lb = {
        "manager_name": req.manager_name,
        "team_id": req.team_id,
        "season": req.state.get("season", 1),
        "current_week": req.state.get("currentWeek", 0),
        "trophies": len(req.state.get("trophies", []) or []),
        "updated_at": now,
    }
    await db.leaderboard.update_one(
        {"manager_name": req.manager_name},
        {"$set": lb},
        upsert=True,
    )
    return SaveGameResponse(ok=True, manager_name=req.manager_name, updated_at=now)


@api_router.get("/load/{manager_name}", response_model=LoadGameResponse)
async def load_game(manager_name: str):
    doc = await db.saves.find_one({"manager_name": manager_name}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="No save found for this manager")
    return LoadGameResponse(**doc)


@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def leaderboard():
    docs = await db.leaderboard.find({}, {"_id": 0}).sort([
        ("trophies", -1), ("season", -1), ("current_week", -1)
    ]).to_list(50)
    return [LeaderboardEntry(**d) for d in docs]


@api_router.delete("/save/{manager_name}")
async def delete_save(manager_name: str):
    await db.saves.delete_one({"manager_name": manager_name})
    await db.leaderboard.delete_one({"manager_name": manager_name})
    return {"ok": True}


# --- Payments ---

def _get_stripe(request: Request):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    return StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)


@api_router.post("/payments/checkout", response_model=CheckoutResponse)
async def create_checkout(req: CheckoutRequest, request: Request):
    if req.package_id not in PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    pkg = PACKAGES[req.package_id]
    amount = float(pkg["amount"])
    currency = pkg["currency"]

    origin = req.origin_url.rstrip('/')
    success_url = f"{origin}/match?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/match"

    stripe_checkout = _get_stripe(request)
    metadata = {
        "package_id": req.package_id,
        "manager_name": req.manager_name or "unknown",
        "source": "master_league",
    }
    session = await stripe_checkout.create_checkout_session(
        CheckoutSessionRequest(
            amount=amount,
            currency=currency,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
        )
    )

    # Record pending transaction
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "package_id": req.package_id,
        "manager_name": req.manager_name,
        "amount": amount,
        "currency": currency,
        "metadata": metadata,
        "payment_status": "pending",
        "status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return CheckoutResponse(url=session.url, session_id=session.session_id)


@api_router.get("/payments/status/{session_id}", response_model=PaymentStatusResponse)
async def payment_status(session_id: str, request: Request):
    existing = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Session not found")

    already_processed = existing.get("payment_status") == "paid"

    stripe_checkout = _get_stripe(request)
    status_obj = await stripe_checkout.get_checkout_status(session_id)

    update_fields = {
        "payment_status": status_obj.payment_status,
        "status": status_obj.status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": update_fields},
    )

    return PaymentStatusResponse(
        session_id=session_id,
        payment_status=status_obj.payment_status,
        status=status_obj.status,
        amount_total=status_obj.amount_total,
        currency=status_obj.currency,
        already_processed=already_processed,
    )


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    body = await request.body()
    stripe_checkout = _get_stripe(request)
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
    except Exception as e:
        logger.exception("Stripe webhook error")
        raise HTTPException(status_code=400, detail=str(e))

    await db.payment_transactions.update_one(
        {"session_id": webhook_response.session_id},
        {"$set": {
            "payment_status": webhook_response.payment_status,
            "status": "completed" if webhook_response.payment_status == "paid" else "pending",
            "webhook_event_type": webhook_response.event_type,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

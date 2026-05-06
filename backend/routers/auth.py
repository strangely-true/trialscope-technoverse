"""
Auth router — Register, Login, Me endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.models import User
from models.schemas import UserRegister, UserLogin, Token, UserOut, UserRole
from auth.jwt_handler import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


import random
import os
import redis
from twilio.rest import Client
from pydantic import BaseModel

redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://trialgo-redis-1:6379/0"), decode_responses=True)

class VerifyPhone(BaseModel):
    user_id: int
    otp: str

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user with role: patient / coordinator / pharma."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        role=payload.role,
        preferred_language=payload.preferred_language,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if user.phone_number:
        try:
            otp = str(random.randint(1000, 9999))
            redis_client.setex(f"otp:{user.id}", 600, otp)
            print(f"--- DEVELOPMENT OTP FOR {user.phone_number}: {otp} ---")
            client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
            client.messages.create(
                body=f"Your TrialGo verification code is {otp}. Valid for 10 minutes.",
                from_=os.getenv("TWILIO_PHONE_NUMBER"),
                to=user.phone_number
            )
        except Exception as e:
            print(f"Twilio error: {e}")

    return user

@router.post("/verify-phone")
def verify_phone(payload: VerifyPhone, db: Session = Depends(get_db)):
    stored_otp = redis_client.get(f"otp:{payload.user_id}")
    if not stored_otp or stored_otp != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    user = db.query(User).filter(User.id == payload.user_id).first()
    if user:
        user.phone_verified = True
        db.commit()
        redis_client.delete(f"otp:{payload.user_id}")
        return {"message": "Phone verified successfully"}
    raise HTTPException(status_code=404, detail="User not found")


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and return JWT token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(
        access_token=token,
        user_id=user.id,
        role=user.role.value,
        full_name=user.full_name or "",
    )


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone_number: str | None = None
    preferred_language: str | None = None

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return current authenticated user's info."""
    return current_user

@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update current user profile. If phone changes, trigger re-verification."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.preferred_language is not None:
        current_user.preferred_language = payload.preferred_language
        
    phone_changed = False
    if payload.phone_number is not None and payload.phone_number != current_user.phone_number:
        current_user.phone_number = payload.phone_number
        current_user.phone_verified = False
        phone_changed = True
        
    db.commit()
    db.refresh(current_user)

    if phone_changed and current_user.phone_number:
        try:
            otp = str(random.randint(1000, 9999))
            redis_client.setex(f"otp:{current_user.id}", 600, otp)
            print(f"--- DEVELOPMENT OTP FOR {current_user.phone_number}: {otp} ---")
            client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
            client.messages.create(
                body=f"Your TrialGo verification code is {otp}. Valid for 10 minutes.",
                from_=os.getenv("TWILIO_PHONE_NUMBER"),
                to=current_user.phone_number
            )
        except Exception as e:
            print(f"Twilio error: {e}")

    return current_user

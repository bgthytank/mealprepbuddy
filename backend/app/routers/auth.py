from fastapi import APIRouter, HTTPException, status
from datetime import datetime

from ..models import UserCreate, UserLogin, Token, User
from ..services.auth import auth_service
from ..services.dynamodb import db_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user"""
    user = auth_service.register_user(user_data.email, user_data.password)
    token = auth_service.create_access_token(user["user_id"], user["household_id"])

    return Token(
        access_token=token,
        user=User(
            user_id=user["user_id"],
            email=user["email"],
            household_id=user["household_id"],
            created_at=datetime.fromisoformat(user["created_at"]),
        ),
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login and get access token"""
    user = auth_service.authenticate_user(credentials.email, credentials.password)
    token = auth_service.create_access_token(user["user_id"], user["household_id"])

    return Token(
        access_token=token,
        user=User(
            user_id=user["user_id"],
            email=user["email"],
            household_id=user["household_id"],
            created_at=datetime.fromisoformat(user["created_at"]),
        ),
    )

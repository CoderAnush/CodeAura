"""
Authentication module with JWT and password hashing
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel
from backend.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS


class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: str  # subject (user_id)
    exp: datetime
    iat: datetime
    type: str  # "access" or "refresh"


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.utcnow() + expires_delta
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }

    encoded_jwt = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT refresh token"""
    if expires_delta is None:
        expires_delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    expire = datetime.utcnow() + expires_delta
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    }

    encoded_jwt = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=ALGORITHM
    )
    return encoded_jwt


def create_token_pair(user_id: int) -> TokenResponse:
    """Create both access and refresh tokens"""
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


def decode_token(token: str) -> Optional[Tuple[int, str]]:
    """Decode and validate JWT token

    Returns:
        (user_id, token_type) if valid, None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type", "access")

        if user_id is None:
            return None

        return int(user_id), token_type
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[int]:
    """Verify access token and return user_id"""
    result = decode_token(token)
    if result is None:
        return None

    user_id, token_type = result
    if token_type != "access":
        return None

    return user_id


def verify_refresh_token(token: str) -> Optional[int]:
    """Verify refresh token and return user_id"""
    result = decode_token(token)
    if result is None:
        return None

    user_id, token_type = result
    if token_type != "refresh":
        return None

    return user_id

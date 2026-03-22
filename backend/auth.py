import os
from typing import Optional

from jose import jwk, jwt, JWTError
from dotenv import load_dotenv

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models import Profile

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://esrbbtorbrvfwyodejak.supabase.co")
ALGORITHM = "ES256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# EC public key from Supabase JWKS — fetched once at startup
_SUPABASE_JWK = {
    "kty": "EC", "crv": "P-256", "alg": "ES256",
    "x": "RWTJkPrC7loq6_A3wkfnPuz1wplWduuFPkk9sbY31c4",
    "y": "JrsQTz8vA2FNnijR8fbm9i9DdYSbf-hKVaVuMxz8jas",
}
_PUBLIC_KEY = jwk.construct(_SUPABASE_JWK, algorithm=ALGORITHM)


async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> Profile:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            _PUBLIC_KEY,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},
        )
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as e:
        print(f"[auth] JWTError: {e}")
        raise credentials_exception

    profile = db.query(Profile).filter(Profile.id == user_id).first()

    if profile is None:
        # Auto-create profile from JWT claims (handles local SQLite dev + trigger fallback)
        user_metadata = payload.get("user_metadata") or {}
        username = user_metadata.get("username")
        if not username:
            email = payload.get("email", "")
            username = email.split("@")[0] if email else user_id[:8]
        try:
            profile = Profile(id=user_id, username=username)
            db.add(profile)
            db.commit()
            db.refresh(profile)
        except Exception:
            db.rollback()
            raise credentials_exception

    return profile

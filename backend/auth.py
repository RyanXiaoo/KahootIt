from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import os
from dotenv import load_dotenv

# Added imports
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db # Assuming get_db is in backend/database.py
from models import User as UserModel # Alias to avoid naming conflict
from schemas import TokenData, User as UserSchema # Import User schema for return type hint

load_dotenv() # Load environment variables from .env

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-default-secret-key-if-not-set") # Should be loaded from .env
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login") # UPDATED from "token"

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Database utility function to get user by username
def get_user_by_username(db: Session, username: str) -> Optional[UserModel]:
    return db.query(UserModel).filter(UserModel.username == username).first()

# Dependency to get current user
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserSchema:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    # Convert UserModel to UserSchema before returning if necessary,
    # or ensure your UserSchema can be created from UserModel (e.g. with orm_mode)
    return UserSchema.from_orm(user)

async def get_current_active_user(current_user: UserSchema = Depends(get_current_user)) -> UserSchema:
    # if not current_user.is_active: # Add this check if you have an is_active field in your User model/schema
    #     raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# We'll add verify_token and get_current_user functions later, which will depend on User model and DB session
# The above comment is now outdated. 
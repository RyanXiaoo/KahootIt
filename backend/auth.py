import os
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel # Changed from EmailStr
from dotenv import load_dotenv

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User as UserModel # Alias to avoid naming conflict

load_dotenv() # Load environment variables from .env

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your_super_secret_key_please_change_it")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # Relative path to the token endpoint

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class TokenData(BaseModel): # Defined here using Pydantic BaseModel
    username: Optional[str] = None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user(db: Session, username: str) -> Optional[UserModel]:
    return db.query(UserModel).filter(UserModel.username == username).first()

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> UserModel:
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
        # No need to instantiate TokenData here if only username is used from payload
        # token_data = TokenData(username=username) 
    except JWTError:
        raise credentials_exception
    
    # user = get_user(db, username=token_data.username) # If using TokenData
    user = get_user(db, username=username) # Direct use of username from payload
    if user is None:
        raise credentials_exception
    return user

# Simplified: get_current_active_user can be added later if an 'is_active' field is used in UserModel
# For now, get_current_user returns the UserModel instance.
# async def get_current_active_user(current_user: UserModel = Depends(get_current_user)):
#     # if not current_user.is_active: # Assuming 'is_active' attribute in UserModel
#     #     raise HTTPException(status_code=400, detail="Inactive user")
#     return current_user

# We'll add verify_token and get_current_user functions later, which will depend on User model and DB session
# The above comment is now outdated. 
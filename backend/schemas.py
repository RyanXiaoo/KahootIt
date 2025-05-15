from pydantic import BaseModel
from typing import Optional

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    username: str
    # email: Optional[EmailStr] = None # Add if you uncomment in models.py
    # full_name: Optional[str] = None # Add if you uncomment in models.py

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    # is_active: bool # Add if you uncomment in models.py

    class Config:
        orm_mode = True # Changed from from_attributes for Pydantic v2 
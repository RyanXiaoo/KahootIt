from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Define the SQLite database URL. 
# This will create a file named `kahootit.db` in the backend directory.
SQLALCHEMY_DATABASE_URL = "sqlite:///./kahootit.db"

# Create the SQLAlchemy engine.
# connect_args is needed only for SQLite to allow multiple threads to share the connection.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create a SessionLocal class. Each instance of SessionLocal will be a database session.
# autocommit=False and autoflush=False are standard settings for database sessions with SQLAlchemy.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class. Our ORM models will inherit from this class.
Base = declarative_base()

# Dependency to get a DB session in path operations
async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 
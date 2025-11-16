from sqlmodel import create_engine, SQLModel, Session
from typing import Generator
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./divergent_unity.db")

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def init_db():
    """Initialize database tables"""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Get database session"""
    with Session(engine) as session:
        yield session

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings

settings = BaseSettings(
    DATABASE_URL="postgresql://bidflow:bidflow_secret@localhost:5432/bidflow_db",
    API_HOST="0.0.0.0",
    API_PORT="3002",
    PYTHON_ENV="development"
)

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
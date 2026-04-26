"""
Database Configuration and Models
"""
try:
    from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy.orm import sessionmaker
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    # Mock implementations for when SQLAlchemy is not available
    SQLALCHEMY_AVAILABLE = False
    Base = object
    
    class MockColumn:
        def __init__(self, *args, **kwargs):
            pass
    
    Column = MockColumn
    Integer = MockColumn
    String = MockColumn
    Text = MockColumn
    DateTime = MockColumn
    Boolean = MockColumn
    
    def create_engine(*args, **kwargs):
        return None
        
    def sessionmaker(*args, **kwargs):
        return lambda: None
        
    def declarative_base():
        return object
from datetime import datetime
import os
from backend.config import settings

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    echo=settings.DEBUG
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    username = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    description = Column(Text)
    owner_id = Column(Integer)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, index=True)
    filename = Column(String(255))
    language = Column(String(50))
    original_code = Column(Text)
    improved_code = Column(Text)
    issues = Column(Text)  # JSON string
    complexity = Column(String(50))
    explanation = Column(Text)
    ai_provider = Column(String(50))  # openai, ollama, gemini
    created_at = Column(DateTime, default=datetime.utcnow)


class SharedLink(Base):
    __tablename__ = "shared_links"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True)
    analysis_id = Column(Integer)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


# Create tables
def init_db():
    Base.metadata.create_all(bind=engine)


# Dependency for getting DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

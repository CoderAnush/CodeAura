from pydantic import BaseModel, Field
try:
    from pydantic import EmailStr
except ImportError:
    # Fallback if email-validator is not installed
    from typing import Annotated
    from pydantic import StringConstraints
    EmailStr = Annotated[str, StringConstraints(pattern=r'^[^@]+@[^@]+\.[^@]+$')]
from typing import List, Optional
from datetime import datetime


class CodeInput(BaseModel):
    code: str = Field(..., min_length=1, max_length=1024*1024)  # 1MB max
    language: str = Field(default="python", description="Programming language")
    ai_provider: Optional[str] = Field(
        default="openai", 
        description="AI provider to use: openai, ollama, gemini"
    )
    project_id: Optional[int] = None


class AnalysisResult(BaseModel):
    issues: List[str]
    complexity: str
    improved_code: str
    explanation: str
    ai_provider: Optional[str] = None
    quality_metrics: Optional[dict] = None


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: bool = False


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_public: bool
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AnalysisHistory(BaseModel):
    id: int
    filename: Optional[str]
    language: str
    complexity: str
    issues_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class ShareRequest(BaseModel):
    analysis_id: int
    expires_in_hours: int = 24


class ShareResponse(BaseModel):
    share_url: str
    expires_at: datetime

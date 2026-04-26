"""
Application Configuration Module
"""
import os
from typing import List, Optional
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings


class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = "CodeAura"
    APP_ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    VERSION: str = "2.0.0"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4

    # Database Settings
    DATABASE_URL: str = "sqlite:///./codeaura.db"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 30

    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # Security Settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI Provider Settings - OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_TEMPERATURE: float = 0.2
    OPENAI_MAX_TOKENS: int = 2000

    # AI Provider Settings - Ollama (Local)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    # AI Provider Settings - Google Gemini
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-pro"

    # Analysis Settings
    MAX_CODE_SIZE_KB: int = 1024
    ANALYSIS_TIMEOUT_SECONDS: int = 30
    CACHE_TTL_HOURS: int = 24

    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60
    RATE_LIMIT_WINDOW_MINUTES: int = 1

    # CORS Settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: List[str] = ["*"]
    CORS_HEADERS: List[str] = ["*"]

    # Supported Languages
    SUPPORTED_LANGUAGES: List[str] = [
        "python", "javascript", "typescript", "java", "c", "cpp", "csharp",
        "go", "rust", "php", "ruby", "swift", "kotlin", "scala", "r", "dart",
        "elixir", "erlang", "haskell", "lua", "perl", "shell"
    ]

    # File Upload Settings
    UPLOAD_FOLDER: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = [
        "py", "js", "ts", "jsx", "tsx", "java", "c", "cpp", "h", "hpp",
        "cs", "go", "rs", "php", "rb", "swift", "kt", "scala", "r", "dart",
        "ex", "erl", "hs", "lua", "pl", "sh", "bash", "sql"
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()

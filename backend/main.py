from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import json
from datetime import datetime, timedelta
from typing import List, Optional

from backend.config import settings
from backend.schemas import (
    CodeInput, AnalysisResult, UserCreate, UserLogin, Token, 
    ProjectCreate, ProjectResponse, AnalysisHistory
)
from backend.database import init_db, get_db, User, Project, Analysis
from backend.cache import get_cache_key, get_cached_result, set_cached_result
from backend.ai_providers import get_ai_provider
from backend.analyzers.tree_sitter_analyzer import TreeSitterAnalyzer
from backend.websocket import handle_collaboration
from backend.analytics import analytics_engine
from backend.exporters import export_analysis

# Initialize database (optional)
try:
    init_db()
except Exception as e:
    print(f"Database initialization skipped: {e}")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-Powered Multi-Language Code Analysis and Optimization Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Security
security = HTTPBearer()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)

# Initialize analyzers
tree_sitter_analyzer = TreeSitterAnalyzer()

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": settings.VERSION
    }

# Authentication endpoints
@app.post("/auth/register", response_model=Token)
async def register(user: UserCreate, db = Depends(get_db)):
    # TODO: Implement user registration with password hashing
    return Token(access_token="dummy_token", token_type="bearer")

@app.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin, db = Depends(get_db)):
    # TODO: Implement authentication
    return Token(access_token="dummy_token", token_type="bearer")

# Core Analysis Endpoint
@app.post("/analyze", response_model=AnalysisResult)
async def analyze_source_code(
    request: CodeInput, 
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    code = request.code
    language = request.language.lower()
    ai_provider = request.ai_provider or "ollama"
    
    if not code:
        raise HTTPException(status_code=400, detail="No code provided")
    
    # Check code size limit
    if len(code.encode('utf-8')) > settings.MAX_CODE_SIZE_KB * 1024:
        raise HTTPException(status_code=413, detail="Code exceeds maximum size limit")
    
    # Generate cache key
    cache_key = get_cache_key("analysis", language, hash(code))
    
    # Check cache first
    cached_result = get_cached_result(cache_key)
    if cached_result:
        return AnalysisResult(**cached_result)
    
    # Analyze code
    detected_issues, complexity = tree_sitter_analyzer.analyze(code, language)
    
    # Get AI-powered optimization
    try:
        ai = get_ai_provider(ai_provider)
        improved_code, explanation = ai.analyze_code(code, language, detected_issues)
    except Exception as e:
        improved_code = code
        explanation = f"AI analysis failed: {str(e)}"
    
    # Advanced analytics
    quality_metrics = analytics_engine.analyze_code_quality(code, language, detected_issues)
    
    # Prepare result
    result = AnalysisResult(
        issues=detected_issues,
        complexity=complexity,
        improved_code=improved_code,
        explanation=explanation,
        ai_provider=ai_provider,
        quality_metrics=quality_metrics
    )
    
    # Cache result
    background_tasks.add_task(
        set_cached_result, 
        cache_key, 
        result.dict(), 
        settings.CACHE_TTL_HOURS
    )
    
    return result

# Project Management Endpoints
@app.post("/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, db = Depends(get_db)):
    # TODO: Implement project creation
    pass

@app.get("/projects", response_model=List[ProjectResponse])
async def list_projects(db = Depends(get_db)):
    # TODO: Implement project listing
    pass

@app.get("/projects/{project_id}/analyses", response_model=List[AnalysisHistory])
async def get_project_analyses(project_id: int, db = Depends(get_db)):
    # TODO: Implement analysis history
    pass

# Metrics and Statistics
@app.get("/stats")
async def get_statistics(db = Depends(get_db)):
    return {
        "total_analyses": len(analytics_engine.metrics_history),
        "supported_languages": len(settings.SUPPORTED_LANGUAGES),
        "uptime": str(datetime.utcnow()),
        "recent_trends": analytics_engine.get_trends(24)
    }

# Analytics Endpoint
@app.get("/analytics/trends")
async def get_analytics_trends(hours: int = 24):
    return analytics_engine.get_trends(hours)

# Export Endpoint
@app.post("/export/{format_type}")
async def export_analysis_result(format_type: str, analysis_result: dict):
    try:
        exported_data = export_analysis(analysis_result, format_type)
        return JSONResponse(content={
            "data": exported_data,
            "format": format_type,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Export failed: {str(e)}")

# WebSocket for Collaboration
@app.websocket("/ws/collaborate/{room_id}/{user_id}")
async def websocket_collaboration(websocket: WebSocket, room_id: str, user_id: str):
    await handle_collaboration(websocket, room_id, user_id)

# Serve Frontend
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend-react")
legacy_frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

# Try React frontend first, fallback to legacy
if os.path.exists(frontend_path):
    app.mount("/app", StaticFiles(directory=frontend_path, html=True), name="react_frontend")
elif os.path.exists(legacy_frontend_path):
    app.mount("/", StaticFiles(directory=legacy_frontend_path, html=True), name="legacy_frontend")

@app.get("/")
async def read_root():
    if os.path.exists(frontend_path):
        return FileResponse(os.path.join(frontend_path, "index.html"))
    elif os.path.exists(legacy_frontend_path):
        return FileResponse(os.path.join(legacy_frontend_path, "index.html"))
    return {"message": "Welcome to CodeAura API", "docs": "/docs"}

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected error occurred: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        workers=settings.WORKERS,
        reload=settings.DEBUG
    )

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, WebSocket, status
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
    CodeInput, AnalysisResult, UserCreate, UserLogin, Token, TokenResponse, UserResponse,
    ProjectCreate, ProjectResponse, AnalysisHistory, RefreshTokenRequest
)
from backend.database import init_db, get_db, User, Project, Analysis
from backend.cache import get_cache_key, get_cached_result, set_cached_result
from backend.ai_providers import get_ai_provider
from backend.analyzers.tree_sitter_analyzer import TreeSitterAnalyzer
from backend.websocket import handle_collaboration
from backend.analytics import analytics_engine
from backend.exporters import export_analysis
from backend.auth import (
    hash_password, verify_password, create_token_pair,
    verify_access_token, verify_refresh_token
)

# Initialize database
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

# ==================== DEPENDENCY INJECTION ====================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db = Depends(get_db)):
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    user_id = verify_access_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return user


# ==================== HEALTH & STATUS ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": settings.VERSION
    }


# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email or username already registered"
        )

    # Hash password
    hashed_password = hash_password(user_data.password)

    # Create new user
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db = Depends(get_db)):
    """Login and get JWT tokens"""
    # Find user by email or username
    user = db.query(User).filter(
        (User.email == credentials.email) | (User.username == credentials.email)
    ).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create tokens
    tokens = create_token_pair(user.id)
    return tokens


@app.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest, db = Depends(get_db)):
    """Refresh access token using refresh token"""
    user_id = verify_refresh_token(request.refresh_token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Create new token pair
    tokens = create_token_pair(user.id)
    return tokens


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user


# ==================== CORE ANALYSIS ENDPOINT ====================

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_source_code(
    request: CodeInput,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Analyze code and save results to database"""
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

    # Save analysis to database
    try:
        analysis = Analysis(
            project_id=request.project_id,
            filename=f"analysis_{datetime.utcnow().timestamp()}.{language}",
            language=language,
            original_code=code,
            improved_code=improved_code,
            issues=json.dumps(detected_issues),
            complexity=complexity,
            explanation=explanation,
            ai_provider=ai_provider
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
    except Exception as e:
        print(f"Failed to save analysis: {e}")
        # Continue without saving

    # Cache result
    background_tasks.add_task(
        set_cached_result,
        cache_key,
        result.dict(),
        settings.CACHE_TTL_HOURS
    )

    return result


# ==================== PROJECT MANAGEMENT ====================

@app.post("/projects", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create a new project"""
    new_project = Project(
        name=project.name,
        description=project.description,
        owner_id=current_user.id,
        is_public=project.is_public
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@app.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """List user's projects"""
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    return projects


@app.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get project details"""
    project = db.query(Project).filter(
        (Project.id == project_id) & (Project.owner_id == current_user.id)
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@app.get("/projects/{project_id}/analyses", response_model=List[AnalysisHistory])
async def get_project_analyses(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get analysis history for a project"""
    # Verify project ownership
    project = db.query(Project).filter(
        (Project.id == project_id) & (Project.owner_id == current_user.id)
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get analyses
    analyses = db.query(Analysis).filter(Analysis.project_id == project_id).all()

    return [
        AnalysisHistory(
            id=a.id,
            filename=a.filename,
            language=a.language,
            complexity=a.complexity,
            issues_count=len(json.loads(a.issues) if a.issues else []),
            created_at=a.created_at
        )
        for a in analyses
    ]


# ==================== METRICS & STATISTICS ====================

@app.get("/stats")
async def get_statistics(db = Depends(get_db)):
    """Get system statistics"""
    total_users = db.query(User).count()
    total_analyses = db.query(Analysis).count()
    total_projects = db.query(Project).count()

    return {
        "total_users": total_users,
        "total_analyses": total_analyses,
        "total_projects": total_projects,
        "supported_languages": len(settings.SUPPORTED_LANGUAGES),
        "uptime": str(datetime.utcnow()),
        "recent_trends": analytics_engine.get_trends(24)
    }


@app.get("/analytics/trends")
async def get_analytics_trends(hours: int = 24):
    """Get analytics trends"""
    return analytics_engine.get_trends(hours)


# ==================== EXPORT ====================

@app.post("/export/{format_type}")
async def export_analysis_result(
    format_type: str,
    analysis_result: dict,
    current_user: User = Depends(get_current_user)
):
    """Export analysis in multiple formats"""
    try:
        exported_data = export_analysis(analysis_result, format_type)
        return JSONResponse(content={
            "data": exported_data,
            "format": format_type,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Export failed: {str(e)}")


# ==================== WEBSOCKET COLLABORATION ====================

@app.websocket("/ws/collaborate/{room_id}/{user_id}")
async def websocket_collaboration(websocket: WebSocket, room_id: str, user_id: str):
    """Real-time collaboration via WebSocket"""
    await handle_collaboration(websocket, room_id, user_id)


# ==================== FRONTEND SERVING ====================
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

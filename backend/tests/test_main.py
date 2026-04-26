"""
Backend unit tests for CodeAura
Run with: pytest backend/tests/ -v
"""

import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app, get_db
from backend.database import Base, User
from backend.auth import hash_password, verify_password, create_token_pair
from backend.schemas import UserCreate, CodeInput

# Use file-based database (deleted before test session)
# CI/CD will start fresh, so this works fine
db_file = "test_backend.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_file}"

# Clean up old test database if it exists
if os.path.exists(db_file):
    try:
        os.remove(db_file)
    except:
        pass

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


# ==================== AUTHENTICATION TESTS ====================

class TestAuthentication:
    """Test authentication endpoints"""

    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_register_user(self):
        """Test user registration"""
        response = client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "SecurePassword123!",
            },
        )
        assert response.status_code == 200
        assert response.json()["email"] == "test@example.com"
        assert response.json()["username"] == "testuser"

    def test_register_duplicate_email(self):
        """Test duplicate email registration"""
        # Register first user
        client.post(
            "/auth/register",
            json={
                "email": "duplicate@example.com",
                "username": "user1",
                "password": "password123",
            },
        )

        # Try to register with same email
        response = client.post(
            "/auth/register",
            json={
                "email": "duplicate@example.com",
                "username": "user2",
                "password": "password123",
            },
        )
        assert response.status_code == 409
        assert "already registered" in response.json()["detail"]

    def test_login_success(self):
        """Test successful login"""
        # Register user
        client.post(
            "/auth/register",
            json={
                "email": "login@example.com",
                "username": "loginuser",
                "password": "LoginPass123!",
            },
        )

        # Login
        response = client.post(
            "/auth/login",
            json={
                "email": "login@example.com",
                "password": "LoginPass123!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0

    def test_login_wrong_password(self):
        """Test login with wrong password"""
        # Register user
        client.post(
            "/auth/register",
            json={
                "email": "wrong@example.com",
                "username": "wronguser",
                "password": "CorrectPass123!",
            },
        )

        # Try to login with wrong password
        response = client.post(
            "/auth/login",
            json={
                "email": "wrong@example.com",
                "password": "WrongPass123!",
            },
        )
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_get_current_user(self):
        """Test getting current user info"""
        # Register and login
        client.post(
            "/auth/register",
            json={
                "email": "current@example.com",
                "username": "currentuser",
                "password": "CurrentPass123!",
            },
        )

        login_response = client.post(
            "/auth/login",
            json={
                "email": "current@example.com",
                "password": "CurrentPass123!",
            },
        )
        token = login_response.json()["access_token"]

        # Get current user
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["email"] == "current@example.com"

    def test_unauthorized_without_token(self):
        """Test accessing protected endpoint without token"""
        response = client.get("/auth/me")
        assert response.status_code == 401


# ==================== PASSWORD HASHING TESTS ====================

class TestPasswordHashing:
    """Test password hashing and verification"""

    def test_hash_password(self):
        """Test password hashing"""
        password = "MySecurePassword123!"
        hashed = hash_password(password)

        # Hash should be different each time (bcrypt uses salt)
        hashed2 = hash_password(password)
        assert hashed != hashed2

        # But both should verify
        assert verify_password(password, hashed)
        assert verify_password(password, hashed2)

    def test_wrong_password_verification(self):
        """Test verification fails with wrong password"""
        password = "CorrectPassword123!"
        hashed = hash_password(password)

        assert not verify_password("WrongPassword123!", hashed)

    def test_token_creation(self):
        """Test JWT token creation"""
        user_id = 1
        tokens = create_token_pair(user_id)

        assert tokens.access_token
        assert tokens.refresh_token
        assert tokens.token_type == "bearer"
        assert tokens.expires_in > 0


# ==================== CODE ANALYSIS TESTS ====================

class TestCodeAnalysis:
    """Test code analysis endpoint"""

    @pytest.fixture
    def auth_token(self):
        """Get authentication token for testing"""
        client.post(
            "/auth/register",
            json={
                "email": "analysis@example.com",
                "username": "analysisuser",
                "password": "AnalysisPass123!",
            },
        )

        response = client.post(
            "/auth/login",
            json={
                "email": "analysis@example.com",
                "password": "AnalysisPass123!",
            },
        )
        return response.json()["access_token"]

    def test_analyze_python_code(self, auth_token):
        """Test analyzing Python code"""
        response = client.post(
            "/analyze",
            json={
                "code": "def hello():\n    print('Hello')",
                "language": "python",
                "ai_provider": "ollama",
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "issues" in data
        assert "complexity" in data
        assert "improved_code" in data
        assert "quality_metrics" in data

    def test_analyze_empty_code(self, auth_token):
        """Test analyzing empty code"""
        response = client.post(
            "/analyze",
            json={
                "code": "",
                "language": "python",
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 400

    def test_analyze_code_too_large(self, auth_token):
        """Test code size limit"""
        large_code = "x = 1\n" * (1024 * 1024)  # 1MB+

        response = client.post(
            "/analyze",
            json={
                "code": large_code,
                "language": "python",
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 413


# ==================== PROJECT MANAGEMENT TESTS ====================

class TestProjectManagement:
    """Test project management endpoints"""

    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        client.post(
            "/auth/register",
            json={
                "email": "project@example.com",
                "username": "projectuser",
                "password": "ProjectPass123!",
            },
        )

        response = client.post(
            "/auth/login",
            json={
                "email": "project@example.com",
                "password": "ProjectPass123!",
            },
        )
        return response.json()["access_token"]

    def test_create_project(self, auth_token):
        """Test creating a project"""
        response = client.post(
            "/projects",
            json={
                "name": "Test Project",
                "description": "A test project",
                "is_public": False,
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Project"
        assert data["description"] == "A test project"
        assert data["is_public"] is False

    def test_list_projects(self, auth_token):
        """Test listing projects"""
        # Create some projects
        client.post(
            "/projects",
            json={
                "name": "Project 1",
                "description": "First project",
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        client.post(
            "/projects",
            json={
                "name": "Project 2",
                "description": "Second project",
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        # List projects
        response = client.get(
            "/projects",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        projects = response.json()
        assert len(projects) >= 2


# ==================== STATISTICS TESTS ====================

class TestStatistics:
    """Test statistics endpoints"""

    def test_get_stats(self):
        """Test getting system statistics"""
        response = client.get("/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_analyses" in data
        assert "total_projects" in data
        assert "supported_languages" in data

    def test_get_analytics_trends(self):
        """Test getting analytics trends"""
        response = client.get("/analytics/trends?hours=24")
        assert response.status_code == 200
        data = response.json()
        # Should return trend data
        assert data is not None


# ==================== INTEGRATION TESTS ====================

class TestIntegration:
    """Integration tests for complete workflows"""

    def test_complete_user_workflow(self):
        """Test complete workflow: register → login → analyze → projects"""
        # Register
        register_response = client.post(
            "/auth/register",
            json={
                "email": "workflow@example.com",
                "username": "workflowuser",
                "password": "WorkflowPass123!",
            },
        )
        assert register_response.status_code == 200

        # Login
        login_response = client.post(
            "/auth/login",
            json={
                "email": "workflow@example.com",
                "password": "WorkflowPass123!",
            },
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Create project
        project_response = client.post(
            "/projects",
            json={
                "name": "My Workflow Project",
                "description": "Testing complete workflow",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert project_response.status_code == 200
        project_id = project_response.json()["id"]

        # Analyze code
        analysis_response = client.post(
            "/analyze",
            json={
                "code": "def test():\n    pass",
                "language": "python",
                "project_id": project_id,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert analysis_response.status_code == 200

        # Get project analyses
        history_response = client.get(
            f"/projects/{project_id}/analyses",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert history_response.status_code == 200
        analyses = history_response.json()
        assert len(analyses) >= 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

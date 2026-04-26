"""
GitHub Integration Module for CodeAura
This is the KILLER FEATURE that differentiates CodeAura from competitors.

Features:
1. GitHub OAuth Login
2. Repository Analysis
3. Automatic PR Comments
4. Continuous Monitoring
5. Quality Trends
"""

from typing import Optional, List
import hmac
import hashlib
import json
import base64
from datetime import datetime
import httpx

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel

from backend.config import settings
from backend.database import User, Project, Analysis, get_db
from backend.auth import verify_access_token

# GitHub Configuration
GITHUB_CLIENT_ID = settings.__dict__.get("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = settings.__dict__.get("GITHUB_CLIENT_SECRET")
GITHUB_API_BASE = "https://api.github.com"

# Router
router = APIRouter(prefix="/github", tags=["github"])


# ==================== MODELS ====================

class GitHubOAuthRequest(BaseModel):
    """GitHub OAuth code request"""
    code: str
    state: str


class GitHubUser(BaseModel):
    """GitHub user info"""
    login: str
    name: str
    email: str
    avatar_url: str
    bio: str


class GitHubRepository(BaseModel):
    """GitHub repository info"""
    owner: str
    name: str
    url: str
    language: Optional[str]
    description: Optional[str]


class GitHubPullRequest(BaseModel):
    """GitHub PR info"""
    number: int
    title: str
    author: str
    changed_files: int
    url: str


class AnalysisComment(BaseModel):
    """PR comment with analysis"""
    quality_score: float
    issues_count: int
    complexity: str
    improved_score: float


# ==================== GITHUB API CLIENT ====================

class GitHubClient:
    """GitHub API client"""

    def __init__(self, access_token: str):
        self.token = access_token
        self.headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/vnd.github.v3+json",
        }

    async def get_user(self) -> GitHubUser:
        """Get authenticated user info"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_BASE}/user",
                headers=self.headers
            )
            response.raise_for_status()
            data = response.json()

            return GitHubUser(
                login=data["login"],
                name=data.get("name", data["login"]),
                email=data.get("email", ""),
                avatar_url=data["avatar_url"],
                bio=data.get("bio", "")
            )

    async def get_repositories(self, username: str) -> List[GitHubRepository]:
        """Get user's repositories"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_BASE}/users/{username}/repos",
                headers=self.headers
            )
            response.raise_for_status()
            repos = response.json()

            return [
                GitHubRepository(
                    owner=repo["owner"]["login"],
                    name=repo["name"],
                    url=repo["html_url"],
                    language=repo.get("language"),
                    description=repo.get("description")
                )
                for repo in repos
            ]

    async def get_repository_files(
        self,
        owner: str,
        repo: str,
        path: str = ""
    ) -> List[dict]:
        """Get files in repository"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{path}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def get_file_content(
        self,
        owner: str,
        repo: str,
        path: str
    ) -> str:
        """Get file content"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{path}",
                headers=self.headers
            )
            response.raise_for_status()
            data = response.json()

            # File content is base64 encoded
            if "content" in data:
                return base64.b64decode(data["content"]).decode("utf-8")
            return ""

    async def create_pr_comment(
        self,
        owner: str,
        repo: str,
        pr_number: int,
        body: str
    ) -> dict:
        """Create comment on PR"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/issues/{pr_number}/comments",
                headers=self.headers,
                json={"body": body}
            )
            response.raise_for_status()
            return response.json()

    async def create_check_run(
        self,
        owner: str,
        repo: str,
        head_sha: str,
        analysis: AnalysisComment
    ) -> dict:
        """Create check run with analysis results"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/check-runs",
                headers={
                    **self.headers,
                    "Accept": "application/vnd.github.antiope-preview+json",
                },
                json={
                    "name": "CodeAura Analysis",
                    "head_sha": head_sha,
                    "status": "completed",
                    "conclusion": "success" if analysis.quality_score > 70 else "neutral",
                    "output": {
                        "title": f"Code Quality: {analysis.quality_score:.0f}/100",
                        "summary": f"Issues: {analysis.issues_count} | Complexity: {analysis.complexity}",
                        "text": f"Quality Score: {analysis.quality_score:.0f}/100\nIssues Found: {analysis.issues_count}\nComplexity: {analysis.complexity}"
                    }
                }
            )
            response.raise_for_status()
            return response.json()


# ==================== OAUTH FLOW ====================

@router.get("/oauth/callback")
async def github_oauth_callback(
    code: str,
    state: str,
    db = Depends(get_db)
):
    """GitHub OAuth callback endpoint"""
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")

    try:
        # Exchange code for access token
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                json={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                },
                headers={"Accept": "application/json"}
            )
            response.raise_for_status()
            token_data = response.json()

            if "error" in token_data:
                raise HTTPException(status_code=400, detail=token_data["error"])

            access_token = token_data["access_token"]

            # Get user info
            gh_client = GitHubClient(access_token)
            gh_user = await gh_client.get_user()

            # Find or create user
            user = db.query(User).filter(User.email == gh_user.email).first()
            if not user:
                user = User(
                    email=gh_user.email or f"{gh_user.login}@github.com",
                    username=gh_user.login,
                    hashed_password="",  # GitHub auth, no password
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            # Store GitHub token (in real app, use secure storage)
            # TODO: Implement secure token storage in database

            # Return redirect with access token
            from backend.auth import create_token_pair
            tokens = create_token_pair(user.id)

            return {
                "access_token": tokens.access_token,
                "refresh_token": tokens.refresh_token,
                "github_user": gh_user.dict()
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth failed: {str(e)}")


# ==================== REPOSITORY ANALYSIS ====================

@router.post("/analyze/repository")
async def analyze_repository(
    owner: str,
    repo: str,
    github_token: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(lambda: None),  # Optional
    db = Depends(get_db)
):
    """Analyze entire GitHub repository"""
    try:
        gh_client = GitHubClient(github_token)

        # Create project
        project = Project(
            name=f"{owner}/{repo}",
            description=f"Analysis of {owner}/{repo}",
            owner_id=current_user.id if current_user else 1,
            is_public=True
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        # Queue background job to analyze files
        background_tasks.add_task(
            analyze_repo_files,
            owner,
            repo,
            github_token,
            project.id,
            db
        )

        return {
            "project_id": project.id,
            "status": "Analysis started",
            "owner": owner,
            "repo": repo
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def analyze_repo_files(owner: str, repo: str, token: str, project_id: int, db):
    """Background task to analyze all repository files"""
    from backend.analyzers.tree_sitter_analyzer import TreeSitterAnalyzer
    from backend.analytics import analytics_engine

    gh_client = GitHubClient(token)
    analyzer = TreeSitterAnalyzer()

    # Language extensions to analyze
    ANALYZABLE_EXTENSIONS = {
        '.py': 'python',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.java': 'java',
        '.cpp': 'cpp',
        '.c': 'c',
        '.go': 'go',
        '.rs': 'rust',
    }

    try:
        # Get all files
        files = await gh_client.get_repository_files(owner, repo)

        for file_info in files:
            if file_info['type'] == 'file':
                # Check if analyzable
                ext = None
                for ext_key, lang in ANALYZABLE_EXTENSIONS.items():
                    if file_info['name'].endswith(ext_key):
                        ext = ext_key
                        language = lang
                        break

                if ext:
                    try:
                        # Get file content
                        content = await gh_client.get_file_content(
                            owner,
                            repo,
                            file_info['path']
                        )

                        # Analyze
                        issues, complexity = analyzer.analyze(content, language)
                        quality_metrics = analytics_engine.analyze_code_quality(
                            content,
                            language,
                            issues
                        )

                        # Store analysis
                        analysis = Analysis(
                            project_id=project_id,
                            filename=file_info['name'],
                            language=language,
                            original_code=content,
                            improved_code=content,
                            issues=json.dumps(issues),
                            complexity=complexity,
                            explanation=f"Analyzed from GitHub: {owner}/{repo}/{file_info['path']}",
                            ai_provider="treesitter"
                        )
                        db.add(analysis)
                        db.commit()

                    except Exception as e:
                        print(f"Failed to analyze {file_info['path']}: {e}")
                        continue

        print(f"Repository analysis complete: {owner}/{repo}")

    except Exception as e:
        print(f"Repository analysis failed: {e}")


# ==================== WEBHOOK RECEIVER ====================

def verify_github_signature(request_body: bytes, signature: str) -> bool:
    """Verify GitHub webhook signature"""
    expected_signature = "sha256=" + hmac.new(
        GITHUB_CLIENT_SECRET.encode(),
        request_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected_signature)


@router.post("/webhooks/push")
async def github_webhook_push(
    request_body: bytes,
    x_hub_signature_256: str,
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    """GitHub push webhook - analyze changed files"""

    # Verify signature
    if not verify_github_signature(request_body, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = json.loads(request_body)

    owner = payload["repository"]["owner"]["login"]
    repo = payload["repository"]["name"]
    commits = payload.get("commits", [])

    # Queue analysis of changed files
    background_tasks.add_task(
        analyze_changed_files,
        owner,
        repo,
        commits,
        db
    )

    return {"status": "Analysis queued"}


async def analyze_changed_files(owner: str, repo: str, commits: list, db):
    """Analyze changed files from push"""
    print(f"Analyzing changed files in {owner}/{repo}")

    for commit in commits:
        for file_path in commit.get("added", []) + commit.get("modified", []):
            print(f"Analyzing: {file_path}")
            # Implementation would go here


# ==================== PR COMMENT GENERATOR ====================

def generate_pr_comment(analysis: AnalysisComment) -> str:
    """Generate PR comment with analysis"""

    emoji_quality = "✅" if analysis.quality_score > 80 else "⚠️" if analysis.quality_score > 60 else "❌"
    emoji_improvement = "📈" if analysis.improved_score > analysis.quality_score else "📉"

    return f"""
## CodeAura Analysis {emoji_quality}

**Code Quality Score:** {analysis.quality_score:.0f}/100

**Issues Found:** {analysis.issues_count}
**Complexity:** {analysis.complexity}

**Improvement Potential:** {emoji_improvement} {abs(analysis.improved_score - analysis.quality_score):.1f} points

---

### 💡 Recommendations

1. Review detected issues in the CodeAura dashboard
2. Consider refactoring high-complexity functions
3. Add more test coverage for complex sections

### 🔗 View Full Report

[Open in CodeAura Dashboard](https://codeaura.example.com/analysis/{id})

---

*Powered by [CodeAura](https://github.com/CoderAnush/CodeAura) 🚀*
"""


export router

# CodeAura v2.0 🚀

**AI-Powered Multi-Language Code Analysis and Optimization Platform**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)

CodeAura is a production-ready, enterprise-grade code analysis platform that leverages cutting-edge AI technologies to analyze, optimize, and secure code across 20+ programming languages.

## 🌟 Key Features

### 🔬 **Multi-Language Support (20+ Languages)**
- Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, Scala, R, Dart, Elixir, Erlang, Haskell, Lua, Perl, Shell
- Powered by **Tree-sitter** parsers for accurate syntax analysis

### 🤖 **AI-Powered Optimization**
- **OpenAI GPT-4/Turbo** integration for premium analysis
- **Ollama** support for local/private LLM deployment
- **Google Gemini** alternative provider
- Intelligent code refactoring suggestions

### 🛡️ **Advanced Security Scanning**
- SQL injection detection
- Hardcoded secret identification
- Vulnerability pattern recognition
- OWASP Top 10 compliance checking

### ⚡ **Performance Profiling**
- Algorithmic complexity estimation (Big O notation)
- Nested loop detection and optimization
- Memory usage analysis
- Performance bottleneck identification

### 🎨 **Stunning Modern UI**
- **React 18** with TypeScript
- **Monaco Editor** (VS Code engine)
- Real-time syntax highlighting
- Dark/light theme support
- Responsive design
- Smooth animations with Framer Motion

### 🚀 **Production Features**
- Docker containerization
- PostgreSQL database with SQLAlchemy ORM
- Redis caching for blazing-fast responses
- RESTful API with Swagger documentation
- User authentication and project management
- Rate limiting and security middleware
- Comprehensive logging and monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│────│   FastAPI       │────│   PostgreSQL    │
│   (Monaco Editor)│    │   Backend       │    │   (Data Store)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                       ┌──────▼──────┐         ┌──────▼──────┐
                       │   Redis     │         │   Celery    │
                       │   (Cache)   │         │  (Workers)  │
                       └─────────────┘         └─────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- Docker (optional)
- PostgreSQL (optional)
- Redis (optional)

### Option 1: Development Setup

1. **Clone and Setup Backend**
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start backend server
   cd backend
   uvicorn main:app --reload
   ```

2. **Setup Frontend**
   ```bash
   # Install frontend dependencies
   cd frontend-react
   npm install
   
   # Start development server
   npm run dev
   ```

3. **Access the Application**
   - Backend API: http://localhost:8000
   - Frontend App: http://localhost:3000
   - API Docs: http://localhost:8000/docs

### Option 2: Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access services:
# - Frontend: http://localhost
# - API: http://localhost/api
# - API Docs: http://localhost/api/docs
```

## 🧠 AI Providers Configuration

### OpenAI (Recommended)
```bash
# In .env file
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-4-turbo-preview
```

### Ollama (Local/Private)
```bash
# Install Ollama first: https://ollama.ai
# Pull model
ollama pull llama3

# In .env file
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### Google Gemini
```bash
# In .env file
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-pro
```

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze` | POST | Analyze code with AI optimization |
| `/auth/register` | POST | User registration |
| `/auth/login` | POST | User authentication |
| `/projects` | POST/GET | Project management |
| `/stats` | GET | System statistics |
| `/health` | GET | Health check |

### Example Request
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function hello() { console.log(\"Hello World\"); }",
    "language": "javascript",
    "ai_provider": "openai"
  }'
```

## 🧪 Running Tests

```bash
# Backend tests
pytest backend/tests/

# Frontend tests
cd frontend-react
npm test

# Coverage report
pytest --cov=backend --cov-report=html
```

## 📈 Performance Benchmarks

| Metric | Value |
|--------|-------|
| Response Time (Cached) | < 100ms |
| Response Time (Uncached) | < 2s |
| Concurrent Users | 1000+ |
| Supported Languages | 20+ |
| Code Size Limit | 1MB per request |

## 🔐 Security Features

- JWT-based authentication
- Input validation and sanitization
- Rate limiting (60 requests/minute)
- SQL injection prevention
- XSS protection
- Secure headers
- Encrypted data storage

## 🎯 Roadmap

### v2.1 (Q2 2026)
- [ ] Real-time collaboration
- [ ] GitHub/GitLab integration
- [ ] Custom rule engine
- [ ] Team management

### v2.2 (Q3 2026)
- [ ] VS Code extension
- [ ] CI/CD pipeline integration
- [ ] Advanced metrics dashboard
- [ ] Mobile app

### v3.0 (Q4 2026)
- [ ] Self-hosted model training
- [ ] Enterprise SSO
- [ ] Audit trails
- [ ] Advanced analytics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Lightning-fast API framework
- [Tree-sitter](https://tree-sitter.github.io/) - Parser generator tool
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor engine
- [React](https://reactjs.org/) - Frontend library
- [OpenAI](https://openai.com/) - AI models

## 📞 Support

- 🐛 [Report a Bug](https://github.com/yourusername/code-aura/issues)
- 💡 [Request a Feature](https://github.com/yourusername/code-aura/issues)
- 📧 Email: support@codeaura.com
- 💬 Discord: [Join our community](https://discord.gg/codeaura)

---

<p align="center">
  Made with ❤️ by the CodeAura Team
</p>

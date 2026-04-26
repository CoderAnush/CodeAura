"""
AI Providers Abstraction Layer
Supports OpenAI, Ollama, and Google Gemini
"""
import requests
import json
from typing import Dict, List, Optional, Tuple
from abc import ABC, abstractmethod
from backend.config import settings

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    openai = None


class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @abstractmethod
    def analyze_code(self, code: str, language: str, issues: List[str]) -> Tuple[str, str]:
        """Analyze code and return improved version with explanation"""
        pass
    
    @abstractmethod
    def get_name(self) -> str:
        """Get provider name"""
        pass


class OpenAIProvider(AIProvider):
    """OpenAI GPT Provider"""
    
    def __init__(self):
        if not OPENAI_AVAILABLE:
            raise ValueError("OpenAI library not installed")
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")
        openai.api_key = settings.OPENAI_API_KEY
    
    def get_name(self) -> str:
        return "openai"
    
    def analyze_code(self, code: str, language: str, issues: List[str]) -> Tuple[str, str]:
        prompt = f"""
You are an expert {language} developer and code optimization specialist.

Code to analyze:
```{language}
{code}
```

Detected issues:
{chr(10).join(f'- {issue}' for issue in issues)}

Please provide:
1. An optimized version of the code that fixes the issues
2. A detailed explanation of the improvements made

Return your response in this exact format:
IMPROVED_CODE:
[Your optimized code here]

EXPLANATION:
[Your detailed explanation here]
"""

        try:
            response = openai.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a senior software engineer specializing in code optimization."},
                    {"role": "user", "content": prompt}
                ],
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS
            )
            
            content = response.choices[0].message.content
            
            # Parse response
            if "IMPROVED_CODE:" in content and "EXPLANATION:" in content:
                parts = content.split("EXPLANATION:")
                improved_code = parts[0].replace("IMPROVED_CODE:", "").strip()
                explanation = parts[1].strip()
                return improved_code, explanation
            else:
                return code, content
                
        except Exception as e:
            return code, f"OpenAI analysis failed: {str(e)}"


class OllamaProvider(AIProvider):
    """Ollama Local LLM Provider"""
    
    def get_name(self) -> str:
        return "ollama"
    
    def analyze_code(self, code: str, language: str, issues: List[str]) -> Tuple[str, str]:
        prompt = f"""
You are an expert {language} developer. Optimize this code:

Code:
```{language}
{code}
```

Issues to fix:
{chr(10).join(f'- {issue}' for issue in issues)}

Provide optimized code and explanation.
"""

        try:
            response = requests.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result.get("response", "")
                return code, content
            else:
                return code, f"Ollama request failed: {response.status_code}"
                
        except Exception as e:
            return code, f"Ollama analysis failed: {str(e)}"


class GeminiProvider(AIProvider):
    """Google Gemini Provider"""
    
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")
    
    def get_name(self) -> str:
        return "gemini"
    
    def analyze_code(self, code: str, language: str, issues: List[str]) -> Tuple[str, str]:
        prompt = f"""
You are an expert {language} developer. Analyze and optimize this code:

Code:
```{language}
{code}
```

Issues:
{chr(10).join(f'- {issue}' for issue in issues)}

Return optimized code and explanation.
"""

        try:
            response = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}",
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }],
                    "generationConfig": {
                        "temperature": settings.OPENAI_TEMPERATURE,
                        "maxOutputTokens": settings.OPENAI_MAX_TOKENS
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["candidates"][0]["content"]["parts"][0]["text"]
                return code, content
            else:
                return code, f"Gemini request failed: {response.status_code}"
                
        except Exception as e:
            return code, f"Gemini analysis failed: {str(e)}"


class BasicAnalysisProvider(AIProvider):
    """Basic analysis provider when no AI is available"""
    
    def get_name(self) -> str:
        return "basic"
    
    def analyze_code(self, code: str, language: str, issues: List[str]) -> Tuple[str, str]:
        explanation = "Basic static analysis completed.\n\nIssues found:\n"
        if issues:
            for issue in issues:
                explanation += f"- {issue}\n"
            explanation += "\nSuggestions:\n"
            explanation += "- Review the issues above and refactor accordingly\n"
            explanation += "- Consider using more descriptive variable names\n"
            explanation += "- Optimize nested loops for better performance\n"
        else:
            explanation += "- No major issues detected\n"
        
        # Return original code with basic formatting
        improved_code = code
        return improved_code, explanation


def get_ai_provider(provider_name: str = "openai") -> AIProvider:
    """Factory function to get AI provider instance"""
    providers = {
        "openai": OpenAIProvider if OPENAI_AVAILABLE else None,
        "ollama": OllamaProvider,
        "gemini": GeminiProvider
    }
    
    if provider_name not in providers or providers[provider_name] is None:
        print(f"Provider {provider_name} not available. Using Ollama as fallback.")
        provider_name = "ollama"
    
    try:
        return providers[provider_name]()
    except Exception as e:
        # Fallback to basic analysis
        print(f"All AI providers failed: {e}. Using basic analysis.")
        return BasicAnalysisProvider()

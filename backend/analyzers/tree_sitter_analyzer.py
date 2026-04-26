"""
Tree-sitter Based Multi-Language Analyzer
"""
try:
    import tree_sitter_languages
except ImportError:
    tree_sitter_languages = None
    print("Warning: tree-sitter-languages not installed. Some features may be limited.")
from typing import List, Tuple, Dict, Any
import re


class TreeSitterAnalyzer:
    """Universal code analyzer using tree-sitter parsers"""
    
    LANGUAGE_MAP = {
        'python': 'python',
        'javascript': 'javascript',
        'typescript': 'typescript',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'c++': 'cpp',
        'csharp': 'c_sharp',
        'cs': 'c_sharp',
        'go': 'go',
        'rust': 'rust',
        'rs': 'rust',
        'php': 'php',
        'ruby': 'ruby',
        'rb': 'ruby',
        'swift': 'swift',
        'kotlin': 'kotlin',
        'kt': 'kotlin',
        'scala': 'scala',
        'r': 'r',
        'dart': 'dart',
        'elixir': 'elixir',
        'erlang': 'erlang',
        'haskell': 'haskell',
        'lua': 'lua',
        'perl': 'perl',
        'shell': 'bash',
        'bash': 'bash',
        'sh': 'bash'
    }
    
    def __init__(self):
        self.parsers = {}
    
    def get_parser(self, language: str):
        """Get or create parser for language"""
        if language not in self.parsers:
            try:
                lang_key = self.LANGUAGE_MAP.get(language.lower(), language.lower())
                self.parsers[language] = tree_sitter_languages.get_language(lang_key)
            except Exception as e:
                print(f"No parser available for {language}: {e}")
                return None
        return self.parsers.get(language)
    
    def analyze(self, code: str, language: str) -> Tuple[List[str], str]:
        """Analyze code using tree-sitter"""
        issues = []
        complexity = "O(1)"
        
        parser = self.get_parser(language)
        if not parser:
            return [f"Language '{language}' not supported"], "Unknown"
        
        try:
            # Parse the code
            tree = parser.parse(bytes(code, "utf8"))
            root_node = tree.root_node
            
            # Generic analysis patterns
            issues.extend(self._find_security_issues(code, language))
            issues.extend(self._find_performance_issues(root_node, language))
            issues.extend(self._find_style_issues(code, language))
            
            # Complexity estimation
            complexity = self._estimate_complexity(root_node, language)
            
            return list(set(issues)), complexity
            
        except Exception as e:
            return [f"Parsing error: {str(e)}"], "Error"
    
    def _find_security_issues(self, code: str, language: str) -> List[str]:
        """Find common security vulnerabilities"""
        issues = []
        
        # SQL Injection patterns
        sql_patterns = [
            r"(SELECT|INSERT|UPDATE|DELETE).*\+.*['\"]",
            r"execute\(.*\+.*\)",
            r"query\(.*\+.*\)"
        ]
        
        for pattern in sql_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                issues.append("Potential SQL injection vulnerability detected")
        
        # Hardcoded secrets
        secret_patterns = [
            r"[a-zA-Z0-9]{32}",  # API keys
            r"['\"][a-zA-Z0-9+/]{40,}['\"]",  # Base64 encoded
        ]
        
        for pattern in secret_patterns:
            if re.search(pattern, code):
                issues.append("Possible hardcoded secret detected")
        
        return issues
    
    def _find_performance_issues(self, node, language: str) -> List[str]:
        """Find performance-related issues"""
        issues = []
        
        # Count nested loops
        loop_count = self._count_loops(node)
        if loop_count > 2:
            issues.append(f"Deeply nested loops detected ({loop_count} levels)")
        
        return issues
    
    def _find_style_issues(self, code: str, language: str) -> List[str]:
        """Find code style issues"""
        issues = []
        
        # Line length violations
        lines = code.split('\n')
        long_lines = [i+1 for i, line in enumerate(lines) if len(line) > 100]
        if long_lines:
            issues.append(f"Lines too long: {long_lines[:3]}{'...' if len(long_lines) > 3 else ''}")
        
        return issues
    
    def _count_loops(self, node) -> int:
        """Count nested loop depth"""
        if node.type in ['for_statement', 'while_statement', 'do_statement']:
            max_depth = 1
            for child in node.children:
                child_depth = self._count_loops(child)
                max_depth = max(max_depth, 1 + child_depth)
            return max_depth
        else:
            max_depth = 0
            for child in node.children:
                max_depth = max(max_depth, self._count_loops(child))
            return max_depth
    
    def _estimate_complexity(self, node, language: str) -> str:
        """Estimate algorithmic complexity"""
        loop_depth = self._count_loops(node)
        
        if loop_depth >= 3:
            return f"O(n^{loop_depth})"
        elif loop_depth == 2:
            return "O(n^2)"
        elif loop_depth == 1:
            return "O(n)"
        else:
            return "O(1)"

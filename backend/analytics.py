"""
Advanced Analytics and Metrics
"""
from typing import Dict, List, Any
from datetime import datetime, timedelta
import json
from collections import defaultdict


class CodeAnalytics:
    """Advanced code analysis metrics and insights"""
    
    def __init__(self):
        self.metrics_history = []
    
    def analyze_code_quality(self, code: str, language: str, issues: List[str]) -> Dict[str, Any]:
        """Comprehensive code quality analysis"""
        metrics = {
            "language": language,
            "lines_of_code": len(code.split('\n')),
            "character_count": len(code),
            "issue_count": len(issues),
            "quality_score": self._calculate_quality_score(code, issues),
            "complexity_metrics": self._analyze_complexity(code, language),
            "maintainability_index": self._calculate_maintainability(code),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Store for historical analysis
        self.metrics_history.append(metrics)
        
        return metrics
    
    def _calculate_quality_score(self, code: str, issues: List[str]) -> float:
        """Calculate overall code quality score (0-100)"""
        base_score = 100
        
        # Deduct points for issues
        base_score -= len(issues) * 5
        
        # Deduct for code smells
        if "nested loop" in str(issues).lower():
            base_score -= 10
        if "security" in str(issues).lower():
            base_score -= 15
        if "performance" in str(issues).lower():
            base_score -= 8
            
        # Bonus for good practices
        if "docstring" not in str(issues).lower():
            base_score += 5
        if len(code) > 10:  # Has meaningful content
            base_score += 3
            
        return max(0, min(100, base_score))
    
    def _analyze_complexity(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze various complexity metrics"""
        lines = code.split('\n')
        
        return {
            "cyclomatic_complexity": self._estimate_cyclomatic_complexity(code),
            "cognitive_complexity": self._estimate_cognitive_complexity(code),
            "nesting_depth": self._calculate_nesting_depth(lines),
            "function_count": self._count_functions(code, language),
            "class_count": self._count_classes(code, language)
        }
    
    def _estimate_cyclomatic_complexity(self, code: str) -> int:
        """Rough estimate of cyclomatic complexity"""
        complexity_keywords = ['if', 'elif', 'for', 'while', 'case', 'catch', '&&', '||']
        complexity = 1  # Base complexity
        
        for keyword in complexity_keywords:
            complexity += code.count(keyword)
            
        return complexity
    
    def _estimate_cognitive_complexity(self, code: str) -> int:
        """Estimate cognitive complexity (simpler than cyclomatic)"""
        # This is a simplified estimation
        nesting_keywords = ['if', 'for', 'while', 'catch']
        complexity = 0
        
        for keyword in nesting_keywords:
            complexity += code.count(keyword) * 2
            
        return max(1, complexity)
    
    def _calculate_nesting_depth(self, lines: List[str]) -> int:
        """Calculate maximum nesting depth"""
        max_depth = 0
        current_depth = 0
        indent_stack = []
        
        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith('#') or stripped.startswith('//'):
                continue
                
            indent = len(line) - len(line.lstrip())
            
            if indent > current_depth:
                current_depth = indent
                indent_stack.append(indent)
            elif indent < current_depth and indent_stack:
                # Pop stack until we find matching or smaller indent
                while indent_stack and indent_stack[-1] > indent:
                    indent_stack.pop()
                if indent_stack:
                    current_depth = indent_stack[-1]
                else:
                    current_depth = 0
                    
            max_depth = max(max_depth, len(indent_stack))
            
        return max_depth
    
    def _count_functions(self, code: str, language: str) -> int:
        """Count function definitions"""
        if language.lower() in ['python']:
            return code.count('def ') + code.count('lambda ')
        elif language.lower() in ['javascript', 'typescript']:
            return code.count('function ') + code.count('=>')
        elif language.lower() in ['java', 'c', 'cpp', 'csharp']:
            # Look for method signatures
            return code.count('{') - code.count('};')  # Rough estimate
        return 0
    
    def _count_classes(self, code: str, language: str) -> int:
        """Count class definitions"""
        if language.lower() in ['python']:
            return code.count('class ')
        elif language.lower() in ['java', 'csharp']:
            return code.count('class ')
        elif language.lower() in ['javascript']:
            return code.count('class ')
        return 0
    
    def _calculate_maintainability(self, code: str) -> float:
        """Calculate maintainability index (0-100)"""
        loc = len(code.split('\n'))
        if loc == 0:
            return 100
            
        # Simplified maintainability calculation
        halstead_volume = len(set(code.split())) * 2  # Very rough approximation
        maintainability = 171 - 5.2 * 10 - 0.23 * halstead_volume - 16.2 * 10
        
        return max(0, min(100, maintainability))
    
    def get_trends(self, hours: int = 24) -> Dict[str, Any]:
        """Get analysis trends over time"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        recent_metrics = [
            m for m in self.metrics_history 
            if datetime.fromisoformat(m['timestamp']) > cutoff_time
        ]
        
        if not recent_metrics:
            return {"message": "No recent data available"}
        
        return {
            "total_analyses": len(recent_metrics),
            "average_quality_score": sum(m['quality_score'] for m in recent_metrics) / len(recent_metrics),
            "most_common_language": self._get_most_common(recent_metrics, 'language'),
            "average_lines_of_code": sum(m['lines_of_code'] for m in recent_metrics) / len(recent_metrics),
            "trend_data": recent_metrics[-20:]  # Last 20 entries
        }
    
    def _get_most_common(self, items: List[Dict], key: str) -> str:
        """Get most common value for a key"""
        counter = defaultdict(int)
        for item in items:
            counter[item[key]] += 1
        return max(counter.items(), key=lambda x: x[1])[0] if counter else "N/A"


# Global analytics instance
analytics_engine = CodeAnalytics()

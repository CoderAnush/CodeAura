import re
from typing import List, Tuple

class CppAnalyzer:
    def __init__(self, code: str, is_cpp: bool = True):
        self.code = code
        self.issues = []
        self.complexity_label = "O(1)"
        self.is_cpp = is_cpp # true for C++, false for C

    def analyze(self):
        self._check_forbidden_functions()
        self._check_style()
        self._check_complexity()
        self._check_memory_management()

    def _check_forbidden_functions(self):
        # Unsafe string functions
        if re.search(r'\bstrcpy\(', self.code):
            self.issues.append("Unsafe function 'strcpy' detected. Use 'strncpy' or 'std::string' to prevent buffer overflows.")
        if re.search(r'\bgets\(', self.code):
            self.issues.append("Function 'gets' is extremely dangerous. Use 'fgets' instead.")
        if re.search(r'\bsprintf\(', self.code):
            self.issues.append("Function 'sprintf' is unsafe. Use 'snprintf'.")

    def _check_style(self):
        # using namespace std (C++ only)
        if self.is_cpp and re.search(r'using\s+namespace\s+std\s*;', self.code):
            self.issues.append("Avoid 'using namespace std;' in global scope. It pollutes the namespace.")
        
        # void main
        if re.search(r'void\s+main\s*\(', self.code):
            self.issues.append("Non-standard 'void main()'. Use 'int main()' and return 0.")

        # Single letter variables check (heuristic)
        # Match "int x;" or "float y ="
        matches = re.findall(r'\b(int|float|double|char|auto|bool)\s+([a-zA-Z])\b\s*[;=]', self.code)
        for _, var in matches:
            if var not in ['i', 'j', 'k', 'x', 'y', 'z']:
                self.issues.append(f"Variable '{var}' is too short. Use descriptive names.")

    def _check_memory_management(self):
        # malloc without free? (basic check)
        mallocs = len(re.findall(r'\bmalloc\(', self.code))
        frees = len(re.findall(r'\bfree\(', self.code))
        
        if mallocs > frees:
            self.issues.append(f"Potential memory leak: Found {mallocs} malloc(s) but only {frees} free(s).")
        
        if self.is_cpp and mallocs > 0:
            self.issues.append("C-style 'malloc' detected in C++. Use 'new' or smart pointers (std::unique_ptr) instead.")

    def _check_complexity(self):
        # Heuristic: Indentation-based complexity estimation
        # This assumes code is reasonably formatted (standard indentation).
        
        lines = self.code.split('\n')
        max_depth = 0
        current_depth = 0
        
        # Regex to detect loop starts
        loop_pattern = re.compile(r'^\s*(for|while|do)\b')
        
        indent_stack = [] 
        
        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith("//"):
                continue
                
            # Calculate indentation (number of spaces)
            indent = len(line) - len(line.lstrip())
            
            # Check if this line matches a loop
            if loop_pattern.match(line):
                # Check if this loop is nested inside another loop level
                # We approximate 'nesting' by strictly increasing indent relative to previous known loops
                if not indent_stack:
                    indent_stack.append(indent)
                else:
                    # If this loop is deeper than the last one, it's nested
                    if indent > indent_stack[-1]:
                        indent_stack.append(indent)
                    # If it's same level or less, we might have exited the previous loop scope
                    # But indentation alone is tricky. 
                    # Let's simplify: Just count distinct indentation levels of LOOPS.
                    
        # Simplified robust approach:
        # Find all indentations of lines starting with 'for' or 'while'
        loop_indents = []
        for line in lines:
            if loop_pattern.match(line):
                indent = len(line) - len(line.lstrip())
                loop_indents.append(indent)
        
        # Sort and count meaningful steps (e.g. 4 spaces)
        loop_indents = sorted(list(set(loop_indents)))
        
        # If we have [0, 4, 8] -> likely 3 nested loops
        # If we have [0, 0] -> 2 loops at same level -> 1 level depth
        
        nesting_level = 0
        if len(loop_indents) > 1:
            # Check if they are likely nested (increasing indent)
            nesting_level = len(loop_indents)
        elif len(loop_indents) == 1:
            nesting_level = 1
            
        if nesting_level >= 3:
            self.complexity_label = f"O(n^{nesting_level})"
            self.issues.append(f"Deeply nested loops detected (depth ~{nesting_level}). Potential performance bottleneck.")
        elif nesting_level == 2:
            self.complexity_label = "O(n^2)"
            self.issues.append("Nested loops detected. Potential O(n^2) complexity.")
        elif nesting_level == 1:
            if self.complexity_label == "O(1)":
                self.complexity_label = "O(n)"

def analyze_cpp_code(code: str, language: str = "cpp") -> Tuple[List[str], str]:
    if not code.strip():
        return [], "N/A"
    
    is_cpp = (language.lower() == "cpp" or language.lower() == "c++")
    analyzer = CppAnalyzer(code, is_cpp)
    analyzer.analyze()
    
    return sorted(list(set(analyzer.issues))), analyzer.complexity_label

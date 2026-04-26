import ast
from typing import List, Tuple

class CodeAnalyzer(ast.NodeVisitor):
    def __init__(self):
        self.issues = []
        self.complexity_score = 1
        self.complexity_label = "O(1)"
        self.variables = set()

    def visit_FunctionDef(self, node):
        # Rule 1: Mutable Default Arguments
        for default in node.args.defaults:
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                self.issues.append(f"Function '{node.name}': Mutable default argument detected (e.g., [], {{}}). Use None instead.")
        
        # Rule 2: Function too long
        length = node.end_lineno - node.lineno
        if length > 15:
            self.issues.append(f"Function '{node.name}' is too long ({length} lines). Consider refactoring.")

        # Rule 3: Too many arguments
        if len(node.args.args) > 5:
            self.issues.append(f"Function '{node.name}' has too many arguments ({len(node.args.args)}). limit is 5.")

        self.generic_visit(node)

    def visit_For(self, node):
        self._check_loop(node)
        self._check_range_len(node)
        self.generic_visit(node)

    def visit_While(self, node):
        self._check_loop(node)
        self.generic_visit(node)

    def visit_ExceptHandler(self, node):
        # Rule 4: Broad Exception
        if node.type is None:
            self.issues.append("Avoid using bare 'except:'. Catch specific exceptions instead.")
        elif isinstance(node.type, ast.Name) and node.type.id == 'Exception':
            self.issues.append("Catching generic 'Exception' is discouraged. Be more specific.")
        self.generic_visit(node)

    def _check_loop(self, node):
        # Complexity Estimation
        nesting = 0
        for child in ast.walk(node):
            if child is not node and isinstance(child, (ast.For, ast.While)):
                nesting += 1
        
        if nesting > 0:
            self.issues.append(f"Nested loop detected. Potential O(n^{nesting + 1}) complexity.")
            if nesting + 1 > self.complexity_score:
                self.complexity_score = nesting + 1
                self.complexity_label = f"O(n^{nesting + 1})"
        elif self.complexity_score == 1:
            self.complexity_score = 1  # Loops are at least n, but nesting adds to exponent
            if self.complexity_label == "O(1)":
                self.complexity_label = "O(n)"

    def _check_range_len(self, node):
        # Detect 'for i in range(len(x))' pattern
        if isinstance(node.iter, ast.Call) and isinstance(node.iter.func, ast.Name):
            if node.iter.func.id == 'range':
                if len(node.iter.args) == 1 and isinstance(node.iter.args[0], ast.Call):
                     inner_call = node.iter.args[0]
                     if isinstance(inner_call.func, ast.Name) and inner_call.func.id == 'len':
                         self.issues.append("Pattern 'range(len(seq))' detected. Consider using 'enumerate(seq)' or iterating directly.")

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Store):
            # Rule 5: Non-pythonic variable names (camelCase vs snake_case)
            if not node.id.islower() and "_" not in node.id and len(node.id) > 2:
                 # heuristic for likely camelCase like 'myVar' (not strict)
                 if any(x.isupper() for x in node.id):
                     self.issues.append(f"Variable '{node.id}' may not follow snake_case naming convention.")
            
            # Rule 6: Single letter names (except i, j, k, x, y, z in loops/math)
            if len(node.id) == 1 and node.id not in ['i', 'j', 'k', 'x', 'y', 'z', '_']:
                self.issues.append(f"Variable '{node.id}' is too short. Use descriptive names.")

        self.generic_visit(node)

def analyze_code(code: str) -> Tuple[List[str], str]:
    if not code.strip():
        return [], "N/A"
    
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return [f"Syntax Error on line {e.lineno}: {e.msg}"], "Error"

    analyzer = CodeAnalyzer()
    analyzer.visit(tree)
    
    unique_issues = sorted(list(set(analyzer.issues)))
    return unique_issues, analyzer.complexity_label

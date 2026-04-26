import ast
import sys
import re

class CodeOptimizer(ast.NodeTransformer):
    def __init__(self):
        self.changes = []

    def visit_FunctionDef(self, node):
        # Optimization 1: Add Docstring if missing
        if ast.get_docstring(node) is None:
            doc_node = ast.Expr(value=ast.Constant(value=f" Function {node.name}.\n    Auto-generated docstring."))
            node.body.insert(0, doc_node)
            self.changes.append(f"Added docstring to function '{node.name}'.")
        
        self.generic_visit(node)
        return node

    def visit_Assign(self, node):
        # Optimization 2: Convert 'x = x + 1' to 'x += 1'
        if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            var_name = node.targets[0].id
            if isinstance(node.value, ast.BinOp):
                # Check for x + 1 or 1 + x
                is_left_var = isinstance(node.value.left, ast.Name) and node.value.left.id == var_name
                is_right_var = isinstance(node.value.right, ast.Name) and node.value.right.id == var_name
                
                if (is_left_var or (is_right_var and isinstance(node.value.op, (ast.Add, ast.Mult)))):
                    # Safe to convert Add/Mult. Sub/Div order matters, so only if left is var
                    if is_left_var:
                        op = node.value.op
                        other_operand = node.value.right
                        
                        aug_assign = ast.AugAssign(
                            target=ast.Name(id=var_name, ctx=ast.Store()),
                            op=op,
                            value=other_operand
                        )
                        self.changes.append(f"Converted explicit assignment to {type(op).__name__}= for variable '{var_name}'.")
                        return aug_assign

        return node

def optimize_code(code: str, issues: list) -> tuple[str, str]:
    """
    Parses the code, applies AST transformations, and unparses it back.
    Includes explicit fixes for common patterns.
    """
    if not code.strip():
        return "", "No code provided."

    try:
        tree = ast.parse(code)
    except SyntaxError:
        return code, "Syntax error prevented optimization."

    optimizer = CodeOptimizer()
    optimized_tree = optimizer.visit(tree)
    ast.fix_missing_locations(optimized_tree)

    # Use ast.unparse if available (Python 3.9+)
    try:
        if sys.version_info >= (3, 9):
            improved_code = ast.unparse(optimized_tree)
        else:
            # Fallback for older python (unlikely on user system but safe)
            import astunparse
            improved_code = astunparse.unparse(optimized_tree)
    except Exception as e:
        return code, f"Optimization failed during code generation: {str(e)}"

    # Generate Explanation
    explanation_parts = []
    
    if optimizer.changes:
        explanation_parts.append("Applied Automated Refactorings:")
        for change in optimizer.changes:
            explanation_parts.append(f"- {change}")

    # Add advice based on issues (since we can't always safely fix them automatically)
    if issues:
        explanation_parts.append("\nAddress the following manually for better performance:")
        for issue in issues:
            if "nested loop" in issue.lower():
                explanation_parts.append("- Refactor nested loops using hash maps or sliding window technique.")
            elif "mutable default" in issue.lower():
                explanation_parts.append("- Change standard argument defaults to None and initialize inside function.")
            elif "range(len" in issue.lower():
                explanation_parts.append("- Use 'enumerate()' instead of 'range(len())'.")
    
    if not explanation_parts:
        explanation = "Code structure looks good! No safe automated optimizations found."
    else:
        explanation = "\n".join(explanation_parts)

    return improved_code, explanation

def optimize_cpp_code(code: str, issues: list) -> tuple[str, str]:
    """
    Regex-based text optimizer for C/C++
    """
    improved_code = code
    explanation_parts = []
    
    # 1. Fix Headers (include iostream if printf used but suggesting cout)
    # This is complex, let's Stick to style fixes

    # 2. Add Comments to functions
    lines = improved_code.split('\n')
    new_lines = []
    for line in lines:
        if re.match(r'^\s*(int|void|float|double|bool)\s+\w+\s*\(.*\)\s*\{?', line) and "main" not in line:
            # It's a function definition
            indent = line[:len(line)-len(line.lstrip())]
            new_lines.append(f"{indent}// Function: {line.strip().split('(')[0].split()[-1]}")
            new_lines.append(f"{indent}// Add description here...")
        new_lines.append(line)
    improved_code = "\n".join(new_lines)
    
    # 3. Replace unsafe functions
    if "Unsafe function 'strcpy' detected" in str(issues):
        improved_code = improved_code.replace("strcpy(", "strncpy(")
        explanation_parts.append("- Replaced 'strcpy' with 'strncpy' (check size arguments manually).")
    
    if "using namespace std;" in str(issues):
        improved_code = improved_code.replace("using namespace std;", "// using namespace std; // Removed global namespace pollution")
        explanation_parts.append("- Commented out 'using namespace std;'. Use 'std::' prefix instead.")

    # 4. Void main fix
    if "void main" in str(issues):
        improved_code = re.sub(r'void\s+main', 'int main', improved_code)
        explanation_parts.append("- Changed 'void main()' to 'int main()'. return 0 added implicitly by compiler or add manually.")

    if not explanation_parts:
         explanation_parts.append("No automated optimizations available for C/C++. Reviewed static analysis issues.")
    
    return improved_code, "\n".join(explanation_parts)


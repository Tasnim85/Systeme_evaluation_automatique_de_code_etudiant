# test_analyzer.py
import sys
sys.path.append(".")

from app.static_analysis.analyzer import analyze_python_code

code = """
def addition(a, b):
    return a + b

def multiplication(a, b):
    \"\"\"Multiplie deux nombres.\"\"\"
    return a * b
"""

result = analyze_python_code(code)
print(result)
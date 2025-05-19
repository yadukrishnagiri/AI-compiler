import ast
import sys

def check_syntax(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            source = file.read()
        
        # Try to parse the file
        ast.parse(source)
        print(f"No syntax errors found in {filename}")
        return True
    except SyntaxError as e:
        line_num = e.lineno
        col_num = e.offset
        print(f"Syntax error in {filename} at line {line_num}, column {col_num}")
        print(f"Error message: {e}")
        
        # Show the problematic line and context
        try:
            with open(filename, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                
                # Print context (5 lines before and after the error)
                start = max(0, line_num - 6)
                end = min(len(lines), line_num + 5)
                
                print("\nContext:")
                for i in range(start, end):
                    prefix = ">> " if i == line_num - 1 else "   "
                    print(f"{prefix}{i+1}: {lines[i].rstrip()}")
                    
                # Point to the exact column
                if col_num:
                    print("   " + " " * col_num + "^")
        except Exception as context_err:
            print(f"Error showing context: {context_err}")
        
        return False

if __name__ == "__main__":
    filename = "app.py"
    check_syntax(filename) 
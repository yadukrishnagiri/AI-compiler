file_path = 'app_fixed2.py'

# Read the original file
with open(file_path, 'r', encoding='utf-8') as file:
    lines = file.readlines()

# Find the specific lines with the indentation problem
try:
    # Print lines around issues we found
    print("Checking lines 827-831:")
    for i, line in enumerate(lines[825:835]):
        print(f"Line {i+826}: {repr(line)}")
    
    print("\nChecking lines 856-866:")
    for i, line in enumerate(lines[855:865]):
        print(f"Line {i+856}: {repr(line)}")
    
    # Fix the specific indentation problems
    if len(lines) > 827 and lines[827].strip() == 'else:':
        # Fix the indentation after the else: statement
        if len(lines) > 828:
            indentation = len(lines[827]) - len(lines[827].lstrip())
            fixed_indentation = ' ' * (indentation + 4)
            content = lines[828].strip()
            lines[828] = fixed_indentation + content + '\n'
            print(f"Fixed indentation at line 829")
    
    # Fix indentation around line 861
    if len(lines) > 860:
        # Check the indentation of surrounding lines
        if len(lines) > 859:
            line860_indent = len(lines[859]) - len(lines[859].lstrip())
            if lines[859].strip().endswith(':'):
                # This is a block start, next line should be indented
                expected_indent = line860_indent + 4
            else:
                # Use same indentation as previous line
                expected_indent = line860_indent
        else:
            expected_indent = 16  # Default indentation if can't determine
            
        # Fix line 861 indentation
        content = lines[860].strip()
        lines[860] = ' ' * expected_indent + content + '\n'
        print(f"Fixed indentation at line 861")
    
    # Check for unindented code after return statements
    for i in range(len(lines) - 1):
        if 'return jsonify' in lines[i].strip():
            # Check if next line is indented less but not a new block or function
            if i + 1 < len(lines):
                curr_indent = len(lines[i]) - len(lines[i].lstrip())
                next_indent = len(lines[i+1]) - len(lines[i+1].lstrip())
                
                if 0 < next_indent < curr_indent and not lines[i+1].strip().startswith(('def ', 'class ', '@', 'except ', 'else:', 'elif ')):
                    # Find parent block indentation
                    parent_indent = 0
                    for j in range(i-1, -1, -1):
                        if lines[j].strip().endswith(':'):
                            parent_indent = len(lines[j]) - len(lines[j].lstrip())
                            break
                    
                    # If parent block found, fix indentation
                    if parent_indent > 0 and next_indent > parent_indent:
                        print(f"Found misindented code after return at line {i+2}")
                        content = lines[i+1].strip()
                        lines[i+1] = ' ' * curr_indent + content + '\n'
    
    # Fix exception handling for any 'try:' without 'except:'
    for i in range(len(lines) - 1):
        if lines[i].strip() == 'try:':
            # Check for an 'except:' at the same indentation level
            indent_level = len(lines[i]) - len(lines[i].lstrip())
            j = i + 1
            has_except = False
            
            while j < len(lines):
                curr_line = lines[j]
                curr_indent = len(curr_line) - len(curr_line.lstrip())
                
                # Found a line at same indent level as try
                if curr_indent == indent_level:
                    if curr_line.strip().startswith('except') or curr_line.strip() == 'finally:':
                        has_except = True
                        break
                    # Found another statement at same level but not except/finally
                    elif not curr_line.strip().startswith('#') and curr_line.strip():
                        break
                
                j += 1
            
            if not has_except:
                print(f"Found 'try:' without 'except:' at line {i+1}")
                # Add an except block right after the try block
                except_line = ' ' * indent_level + 'except Exception as e:\n'
                pass_line = ' ' * (indent_level + 4) + 'pass  # Auto-fixed\n'
                
                # Insert at j position (end of try block)
                lines.insert(j, except_line)
                lines.insert(j + 1, pass_line)
    
    # Write the fixed file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.writelines(lines)
    
    print(f"Fixes applied to {file_path}")
    
except Exception as e:
    print(f"Error during fixing: {e}") 
def fix_indentation_issues():
    # Read the entire app.py file
    with open('app_backup.py', 'r', encoding='utf-8') as file:
        lines = file.readlines()

    # Look for indentation issues
    modified = False
    i = 0
    while i < len(lines) - 1:
        line = lines[i].strip()
        
        # Fix 'else:' or 'except:' indentation issues
        if line.endswith('else:') or (line.startswith('except') and line.endswith(':')):
            next_line = lines[i + 1]
            current_indent = len(lines[i]) - len(lines[i].lstrip())
            next_indent = len(next_line) - len(next_line.lstrip())
            
            # Check if the next line has proper indentation
            if next_indent <= current_indent:
                # Fix indentation for the next line
                proper_indent = ' ' * (current_indent + 4)
                next_content = next_line.strip()
                lines[i + 1] = proper_indent + next_content + '\n'
                modified = True
                print(f"Fixed indentation after '{line}' on line {i+1}")
        
        # Find try blocks without matching except
        if line == 'try:':
            # Get the indentation level
            current_indent = len(lines[i]) - len(lines[i].lstrip())
            
            # Find where the block ends by looking for same indentation level
            j = i + 1
            try_block_lines = []
            except_found = False
            
            while j < len(lines):
                check_line = lines[j]
                check_indent = len(check_line) - len(check_line.lstrip())
                
                # Check if it's at same indentation as try
                if check_indent == current_indent:
                    check_content = check_line.strip()
                    if check_content.startswith('except') or check_content == 'finally:':
                        except_found = True
                        break
                    elif check_content.endswith(':'):  # Found another block at same level
                        break
                
                try_block_lines.append(check_line)
                j += 1
            
            if not except_found and j < len(lines):
                # If no except found, add a simple except 
                except_line = ' ' * current_indent + 'except Exception as e:\n'
                pass_line = ' ' * (current_indent + 4) + 'pass  # Added by indentation fixer\n'
                
                # Insert the except block
                lines.insert(j, except_line)
                lines.insert(j + 1, pass_line)
                modified = True
                print(f"Added missing except block for try on line {i+1}")
                # Skip ahead to avoid reprocessing
                i = j + 2
                continue
                
        # Handle try without any content
        if line == 'try:' and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if next_line.startswith('except'):
                # Add a pass statement inside empty try block
                current_indent = len(lines[i]) - len(lines[i].lstrip())
                pass_line = ' ' * (current_indent + 4) + 'pass  # Added by indentation fixer\n'
                lines.insert(i + 1, pass_line)
                modified = True
                print(f"Added pass to empty try block on line {i+1}")
                # Skip ahead to avoid reprocessing
                i += 1
                
        # Fix unindented statements inside blocks
        if not line.endswith(':') and i > 0:
            prev_line = lines[i - 1].strip()
            if prev_line.endswith(':'):
                # Previous line starts a block, this line should be indented
                prev_indent = len(lines[i - 1]) - len(lines[i - 1].lstrip())
                current_indent = len(lines[i]) - len(lines[i].lstrip())
                
                if current_indent <= prev_indent:
                    # This line needs indentation
                    proper_indent = ' ' * (prev_indent + 4)
                    current_content = lines[i].strip()
                    lines[i] = proper_indent + current_content + '\n'
                    modified = True
                    print(f"Fixed missing indentation for line {i+1} after block start on line {i}")
        
        i += 1
                
    # Write the corrected file
    if modified:
        with open('app_fixed.py', 'w', encoding='utf-8') as file:
            file.writelines(lines)
        print("Fixed file saved as app_fixed.py")
    else:
        print("No indentation issues detected")

if __name__ == "__main__":
    fix_indentation_issues() 
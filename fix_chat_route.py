def fix_chat_route():
    with open("app.py", "r", encoding="utf-8") as file:
        content = file.read()
        
    # Fix the indentation in the chat route
    fixed_content = content.replace(
"""                # Send the user message and get the response
                response = chat.send_message(enhanced_query)
            
            # Extract content from the response
            ai_response = response.text
            
                # Check if the response contains code modifications to send back to the UI
                code_update = None
                if "```" in ai_response:
                    # Extract code blocks from the response
                    code_blocks = re.findall(r'```(?:\\w+)?\\n(.*?)\\n```', ai_response, re.DOTALL)
                    if code_blocks and len(code_blocks) > 0:
                        # If there's code in the response, prepare it for the editor
                        main_code_block = code_blocks[0]
                        code_update = {
                            "code": main_code_block,
                            "explanation": ai_response.replace('```' + main_code_block + '```', '').strip()
                        }
                
                # Gemini successful, return response with optional code update
                if code_update:
                    return jsonify({"response": ai_response, "codeUpdate": code_update})
                else:
            return jsonify({"response": ai_response})
            
            except Exception as gemini_error:""",
    
"""                # Send the user message and get the response
                response = chat.send_message(enhanced_query)
            
                # Extract content from the response
                ai_response = response.text
            
                # Check if the response contains code modifications to send back to the UI
                code_update = None
                if "```" in ai_response:
                    # Extract code blocks from the response
                    code_blocks = re.findall(r'```(?:\\w+)?\\n(.*?)\\n```', ai_response, re.DOTALL)
                    if code_blocks and len(code_blocks) > 0:
                        # If there's code in the response, prepare it for the editor
                        main_code_block = code_blocks[0]
                        code_update = {
                            "code": main_code_block,
                            "explanation": ai_response.replace('```' + main_code_block + '```', '').strip()
                        }
                
                # Gemini successful, return response with optional code update
                if code_update:
                    return jsonify({"response": ai_response, "codeUpdate": code_update})
                else:
                    return jsonify({"response": ai_response})
            
            except Exception as gemini_error:"""
    )
    
    # Save the fixed file
    with open("app_fixed3.py", "w", encoding="utf-8") as file:
        file.write(fixed_content)
    
    print("Fixed file saved as app_fixed3.py")

if __name__ == "__main__":
    fix_chat_route() 
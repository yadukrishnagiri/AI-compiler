import os
from flask import Flask, render_template, request, jsonify, session
import google.generativeai as genai
from flask_cors import CORS  # Add CORS support
from dotenv import load_dotenv
import time
import requests
import json
import jsbeautifier  # Import JS beautifier for proper code formatting
from datetime import datetime
import re
import logging
try:
    from groq import Groq
except ImportError:
    print("Groq package not installed, but will try to use Groq API directly.")

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Configure Groq API
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-70b-8192")
USE_GROQ = True  # Enable Groq API

# Available models for Gemini
try:
    AVAILABLE_MODELS = [model.name for model in genai.list_models()]
    print(f"Available models: {AVAILABLE_MODELS}")
except Exception as e:
    print(f"Error listing models: {str(e)}")
    AVAILABLE_MODELS = []

# Choose the appropriate model from the available models list
MODEL_NAME = "models/gemini-1.5-pro"
print(f"Using model: {MODEL_NAME}")

# Ollama configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral:latest")
USE_OLLAMA_BACKUP = True
USE_OLLAMA_PRIMARY = False  # Don't use Ollama as primary - fall back to it if needed
OLLAMA_TIMEOUT = 60  # Increase timeout for Ollama calls

# Store chat history by session ID
chat_history = {}

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.secret_key = os.getenv('SECRET_KEY', 'dev_key_for_sessions')

@app.route("/")
def index():
    # Get language preference from cookie or set default
    default_language = session.get('preferred_language', 'auto')
    return render_template("index.html", default_language=default_language)

def process_with_ollama(instruction, original_code, user_prompt, language):
    """Use Ollama via shell command since API seems problematic"""
    try:
        print(f"Using Ollama shell command with model: {OLLAMA_MODEL}")
        
        # Prepare a temporary prompt file
        import tempfile
        import subprocess
        import os
        
        # Create a temp file for the prompt
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            prompt_file = f.name
            # Create the prompt content
            language_context = f"This code is written in {language}. " if language and language != "auto" else ""
        
            prompt_content = f"""You are an AI assistant that helps with programming code improvements and bug fixes. {language_context}

The user has provided the following code:
```
{original_code}
```

{user_prompt if user_prompt else "Please improve this code and fix any errors."}

IMPORTANT: Return the COMPLETE CODE. Do not use placeholders or comments like '... (rest of the class remains unchanged)'.
Provide the entire code with your improvements implemented. Do not abbreviate any part of the code.

Return your response in this format:
1. The modified code in triple backticks
2. A brief explanation of the changes"""
            
            f.write(prompt_content)
        
        # Create a temp file for the output
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            output_file = f.name
        
        try:
            # Run Ollama with prompt directly since -f is not a valid option
            prompt_short = prompt_content[:500] + "..." if len(prompt_content) > 500 else prompt_content
            
            # Write the full prompt to a file that will be read manually into Ollama
            with open(output_file, 'w') as f:
                f.write("Waiting for Ollama response...\n")
                
            # We'll use echo to pipe the prompt to Ollama run
            cmd = f'echo "{prompt_short}" | ollama run {OLLAMA_MODEL} > "{output_file}"'
            print(f"Running command: {cmd}")
            
            # Execute command with timeout
            process = subprocess.Popen(cmd, shell=True)
            try:
                process.wait(timeout=OLLAMA_TIMEOUT)
            except subprocess.TimeoutExpired:
                process.kill()
                print("Ollama process timed out")
                return {
                    "modified_code": original_code,
                    "explanation": f"Ollama process timed out after {OLLAMA_TIMEOUT} seconds. Try with a simpler request.",
                    "using_backup": True
                }
            
            # Read the output
            with open(output_file, 'r') as f:
                ai_response = f.read()
            
            # Clean up temp files
            os.unlink(prompt_file)
            os.unlink(output_file)
            
            # Parse the response to separate code and explanation
            parts = ai_response.split("```")
            
            if len(parts) >= 3:
                # Extract code and explanation from parts
                code_part = parts[1].strip()
                explanation = "".join(parts[2:]).strip()
                
                # If the first line is a language specifier, remove it
                if code_part.startswith(language) or any(code_part.startswith(lang) for lang in ["python", "javascript", "java"]):
                    first_line_end = code_part.find('\n')
                    if first_line_end != -1:
                        modified_code = code_part[first_line_end+1:].strip()
                    else:
                        modified_code = code_part.strip()
                else:
                    modified_code = code_part.strip()
                
                # Check if code still contains placeholder comments
                if "// ... (rest of the class remains unchanged)" in modified_code or "// ..." in modified_code:
                    print("Ollama response still contains placeholders, trying again")
                    
                    # Try again with a more explicit instruction
                    retry_prompt_content = f"""You are an AI assistant that helps with programming code improvements and bug fixes. {language_context}

The user has provided the following code:
```
{original_code}
```

{user_prompt if user_prompt else "Please improve this code and fix any errors."}

CRITICAL REQUIREMENT: You MUST return the ENTIRE code implementation without ANY placeholders.
DO NOT use comments like "// ... (rest of the class remains unchanged)" or "// ..." or any abbreviations.
Include ALL classes, methods, and properties in your response, even if unchanged.

Return your response in this format:
1. The complete modified code in triple backticks
2. A brief explanation of the changes"""
                    
                    # Create new temp files for retry
                    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
                        retry_prompt_file = f.name
                        f.write(retry_prompt_content)
                    
                    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
                        retry_output_file = f.name
                        f.write("Waiting for Ollama retry response...\n")
                    
                    # Execute Ollama with the retry prompt
                    retry_prompt_short = retry_prompt_content[:500] + "..." if len(retry_prompt_content) > 500 else retry_prompt_content
                    retry_cmd = f'echo "{retry_prompt_short}" | ollama run {OLLAMA_MODEL} > "{retry_output_file}"'
                    print(f"Running retry command: {retry_cmd}")
                    
                    retry_process = subprocess.Popen(retry_cmd, shell=True)
                    try:
                        retry_process.wait(timeout=OLLAMA_TIMEOUT)
                    except subprocess.TimeoutExpired:
                        retry_process.kill()
                        print("Ollama retry process timed out")
                        # Continue with the original response
                    
                    # Read the retry output
                    with open(retry_output_file, 'r') as f:
                        retry_ai_response = f.read()
                    
                    # Clean up retry temp files
                    os.unlink(retry_prompt_file)
                    os.unlink(retry_output_file)
                    
                    # Parse the retry response
                    retry_parts = retry_ai_response.split("```")
                    if len(retry_parts) >= 3:
                        retry_code_part = retry_parts[1].strip()
                        retry_explanation = "".join(retry_parts[2:]).strip()
                        
                        # Process the retry code
                        if retry_code_part.startswith(language) or any(retry_code_part.startswith(lang) for lang in ["python", "javascript", "java"]):
                            first_line_end = retry_code_part.find('\n')
                            if first_line_end != -1:
                                retry_modified_code = retry_code_part[first_line_end+1:].strip()
                            else:
                                retry_modified_code = retry_code_part.strip()
                        else:
                            retry_modified_code = retry_code_part.strip()
                        
                        # If retry response is better (no placeholders), use it
                        if ("// ... (rest of the class remains unchanged)" not in retry_modified_code 
                            and "// ..." not in retry_modified_code 
                            and len(retry_modified_code) > len(modified_code)):
                            modified_code = retry_modified_code
                            explanation = retry_explanation
                
                return {
                    "modified_code": modified_code,
                    "explanation": explanation,
                    "using_backup": True
                }
            else:
                # Fallback if parsing fails
                return {
                    "modified_code": original_code,
                    "explanation": "The AI couldn't generate properly formatted code. Here's the raw response:\n\n" + ai_response,
                    "using_backup": True
                }
                
        except Exception as e:
            print(f"Error running Ollama command: {str(e)}")
            return {
                "modified_code": original_code,
                "explanation": f"Error running Ollama: {str(e)}",
                "using_backup": True
            }
            
    except Exception as e:
        return {
            "modified_code": original_code,
            "explanation": f"Error with Ollama service: {str(e)}",
            "using_backup": True
        }

def process_with_groq(instruction, original_code, user_prompt, language):
    """Use Groq API as a fallback or primary model"""
    try:
        print(f"Sending request to Groq API, model: {GROQ_MODEL}")
        
        # Create a prompt for Groq
        language_context = ""
        if language and language != "auto":
            language_context = f"This code is written in {language}."
        
        # Create the system and user messages
        system_message = f"You are an AI assistant that helps with programming code improvements and bug fixes. {language_context}"
        user_message = f"""
I need help with this code:
```
{original_code}
```

{user_prompt if user_prompt else "Please improve this code and fix any errors."}

IMPORTANT: Return the COMPLETE CODE. Do not use placeholders or comments like '... (rest of the class remains unchanged)'.
Provide the entire code with your improvements implemented. Do not abbreviate any part of the code.

Return your response in this format:
1. The improved code in triple backticks
2. A brief explanation of the changes

Keep your response focused and concise."""

        # Prepare request to Groq API
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": GROQ_MODEL,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.3,
            "max_tokens": 4096
        }
        
        # Make the request
        response = requests.post(
            GROQ_API_URL,
            headers=headers,
            json=payload,
            timeout=60  # 60 second timeout
        )
        
        # Process the response
        if response.status_code == 200:
            result = response.json()
            ai_response = result['choices'][0]['message']['content']
            
            # Parse the response to separate code and explanation
            parts = ai_response.split("```")
            
            if len(parts) >= 3:  # We should have at least 3 parts if there's code between backticks
                # Extract code and explanation from parts
                code_part = parts[1].strip()
                explanation = "".join(parts[2:]).strip()
                
                # If the first line is a language specifier, remove it
                if code_part.startswith(language) or any(code_part.startswith(lang) for lang in ["python", "javascript", "java"]):
                    first_line_end = code_part.find('\n')
                    if first_line_end != -1:
                        modified_code = code_part[first_line_end+1:].strip()
                    else:
                        modified_code = code_part.strip()
                else:
                    modified_code = code_part.strip()
                
                # Check if code still contains placeholder comments
                if "// ... (rest of the class remains unchanged)" in modified_code or "// ..." in modified_code:
                    print("Groq response still contains placeholders, trying again")
                    # Try again with an even more explicit instruction
                    user_message_retry = f"""
I need you to fix and improve this code:
```
{original_code}
```

{user_prompt}

CRITICAL REQUIREMENT: You MUST return the ENTIRE code implementation without ANY placeholders.
DO NOT use comments like "// ... (rest of the class remains unchanged)" or "// ..." or any abbreviations.
Include ALL classes, methods, and properties in your response, even if unchanged.

Return your response in this format:
1. The complete improved code in triple backticks
2. A brief explanation of the changes
"""
                    payload["messages"][1]["content"] = user_message_retry
                    
                    retry_response = requests.post(
                        GROQ_API_URL,
                        headers=headers,
                        json=payload,
                        timeout=60
                    )
                    
                    if retry_response.status_code == 200:
                        retry_result = retry_response.json()
                        retry_ai_response = retry_result['choices'][0]['message']['content']
                        
                        retry_parts = retry_ai_response.split("```")
                        if len(retry_parts) >= 3:
                            retry_code_part = retry_parts[1].strip()
                            retry_explanation = "".join(retry_parts[2:]).strip()
                            
                            # Process the code part
                            if retry_code_part.startswith(language) or any(retry_code_part.startswith(lang) for lang in ["python", "javascript", "java"]):
                                first_line_end = retry_code_part.find('\n')
                                if first_line_end != -1:
                                    modified_code = retry_code_part[first_line_end+1:].strip()
                                else:
                                    modified_code = retry_code_part.strip()
                            else:
                                modified_code = retry_code_part.strip()
                                
                            explanation = retry_explanation
                
                return {
                    "modified_code": modified_code,
                    "explanation": explanation,
                    "using_groq": True
                }
            else:
                # Fallback if the response format is unexpected
                return {
                    "modified_code": original_code,
                    "explanation": "The Groq API response format was unexpected. Here's the raw response:\n\n" + ai_response,
                    "using_groq": True
                }
        else:
            error_message = f"Groq API error: Status {response.status_code}"
            try:
                error_data = response.json()
                if 'error' in error_data:
                    error_message += f" - {error_data['error']['message']}"
            except:
                pass
                
            print(error_message)
            return {
                "modified_code": original_code,
                "explanation": error_message,
                "using_groq": True
            }
            
    except Exception as e:
        print(f"Error with Groq API: {str(e)}")
        return {
            "modified_code": original_code,
            "explanation": f"Error with Groq API: {str(e)}",
            "using_groq": True
        }

@app.route("/iterate", methods=["POST"])
def iterate():
    try:
        data = request.get_json()
        original_code = data.get("code", "")
        user_prompt = data.get("prompt", "")
        language = data.get("language", "auto") 
        
        # Save the language preference in the session
        session['preferred_language'] = language
        
        if not original_code:
            return jsonify({"error": "Code is required"}), 400
        
        # If no specific prompt is provided, default to a general code improvement request
        if not user_prompt:
            user_prompt = "Improve this code and fix any errors"
        
        # Analyze the code to determine if it's game-related
        is_game_related = any(term in original_code.lower() for term in [
            "player", "game", "move", "position", "sprite", "collision", "enemy",
            "score", "level", "pygame", "unity", "godot", "unreal"
        ])
        
        # Language-specific context
        language_context = ""
        if language and language != "auto":
            language_context = f"This code is written in {language}. "
            
            # Add language-specific advice where applicable
            if language == "python":
                language_context += "Follow PEP 8 guidelines, use f-strings where appropriate, and leverage Python's built-in functions."
            elif language == "javascript":
                language_context += "Follow modern ES6+ practices, prefer const/let over var, and use arrow functions where appropriate."
            elif language == "typescript":
                language_context += "Leverage TypeScript's strong typing features and interfaces."
            elif language == "java":
                language_context += "Follow Java naming conventions and OOP best practices."
            elif language == "csharp":
                language_context += "Follow C# conventions and leverage .NET features where appropriate."
            elif language == "cpp":
                language_context += "Follow modern C++ practices and be mindful of memory management."
            elif language == "php":
                language_context += "Follow PSR standards and modern PHP practices."
        
        # Check if the original code contains placeholder comments
        has_placeholders = "// ... (rest of the class remains unchanged)" in original_code or "// ..." in original_code
        
        # Craft the prompt for AI models based on code context, specifically asking for complete code without placeholders
        complete_code_instruction = """
IMPORTANT: Return the COMPLETE CODE. Do not use placeholders or comments like '... (rest of the class remains unchanged)'.
Provide the entire code with your improvements implemented. Do not abbreviate any part of the code.
"""
        
        if is_game_related and "movement" in user_prompt.lower():
            # Game-specific prompt for movement-related requests
            system_context = f"You are an AI assistant that helps with game development code improvements. {language_context}"
            instruction = f"""
I need help with this {language if language != 'auto' else ''} game-related code:
```
{original_code}
```

{user_prompt}

{complete_code_instruction}

Please provide:
1. The improved code in triple backticks
2. A brief explanation of the changes

Keep your response focused and concise, considering game development best practices."""
        else:
            # General purpose code improvement prompt
            system_context = f"You are an AI assistant that helps with programming code improvements and bug fixes. {language_context}"
            instruction = f"""
I need help with this {language if language != 'auto' else ''} code:
```
{original_code}
```

{user_prompt}

{complete_code_instruction}

Please provide:
1. The improved code in triple backticks
2. A brief explanation of the changes

Keep your response focused and concise."""

        try:
            # If using Ollama as primary model, skip Gemini and go straight to Ollama
            if USE_OLLAMA_PRIMARY:
                ollama_result = process_with_ollama(instruction, original_code, user_prompt, language)
                
                # Format the returned code with jsbeautifier if it's JavaScript
                if language in ["auto", "javascript", "js"]:
                    try:
                        ollama_result["modified_code"] = jsbeautifier.beautify(ollama_result["modified_code"], {
                            "indent_size": 2,
                            "indent_char": " ",
                            "max_preserve_newlines": 2,
                            "preserve_newlines": True,
                            "keep_array_indentation": False,
                            "break_chained_methods": False,
                            "indent_scripts": "normal",
                            "brace_style": "collapse",
                            "space_before_conditional": True,
                            "unescape_strings": False,
                            "jslint_happy": False,
                            "end_with_newline": False,
                            "wrap_line_length": 0,
                            "indent_inner_html": False,
                            "comma_first": False,
                            "e4x": False,
                            "indent_empty_lines": False
                        })
                    except Exception as e:
                        print(f"Error formatting JavaScript code: {e}")
                
                return jsonify({
                    "modified_code": ollama_result["modified_code"],
                    "explanation": ollama_result["explanation"],
                    "original_code": original_code,
                    "language": language,
                    "using_backup": True
                })
            
            # Try with Gemini first
            try:
                # Set a timeout for API calls to prevent long-running requests
                start_time = time.time()
                max_time = 45  # Increased timeout for larger code processing
                
                # Set up the model with safety settings and generation config
                try:
                    generation_config = {
                        "temperature": 0.2,  # Lower temperature for more focused responses
                        "max_output_tokens": 8192,  # Ensure enough tokens for large code responses
                        "top_p": 0.95,
                        "top_k": 40,
                    }
                    
                    safety_settings = [
                        {
                            "category": "HARM_CATEGORY_HARASSMENT",
                            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            "category": "HARM_CATEGORY_HATE_SPEECH",
                            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                    
                    model = genai.GenerativeModel(MODEL_NAME, 
                                                generation_config=generation_config, 
                                                safety_settings=safety_settings)
            
                    # For Gemini API, we need to provide the system prompt and user content differently
                    # First, create the chat with system instructions
                    chat = model.start_chat(history=[])
                    
                    # First send the system context as a regular message
                    response = chat.send_message(system_context)
                    
                    # Then send the actual instruction with the code
                    response = chat.send_message(instruction)
                    
                    # Extract content from the response
                    ai_response = response.text
                    
                    # Parse the response to separate code and explanation
                    parts = ai_response.split("```")
                    
                    if len(parts) >= 3:  # We should have at least 3 parts if there's code between backticks
                        # Look for a language specifier like ```python at the start
                        code_part = parts[1]
                        if code_part.strip().startswith(language) or (language == "auto" and any(code_part.strip().startswith(lang) for lang in ["python", "javascript", "java", "cpp", "csharp", "php", "ruby", "typescript"])):
                            # Remove language specifier
                            first_line_end = code_part.find('\n')
                            if first_line_end != -1:
                                modified_code = code_part[first_line_end+1:].strip()
                            else:
                                modified_code = code_part.strip()
                        else:
                            modified_code = code_part.strip()
                        
                        # The explanation should be everything after the code block
                        explanation = "".join(parts[2:]).strip()
                        
                        # Check if the modified code still contains placeholder comments
                        if "// ... (rest of the class remains unchanged)" in modified_code or "// ..." in modified_code:
                            # Try to regenerate a more complete response
                            print("Detected placeholder comments in Gemini response, trying again with explicit instruction")
                            response = chat.send_message("Please provide the FULL code without any placeholders or '...' comments. Include the entire code with all classes and methods complete.")
                            
                            # Parse the response again
                            ai_response = response.text
                            parts = ai_response.split("```")
                            
                            if len(parts) >= 3:
                                code_part = parts[1]
                                if code_part.strip().startswith(language) or (language == "auto" and any(code_part.strip().startswith(lang) for lang in ["python", "javascript", "java", "cpp", "csharp", "php", "ruby", "typescript"])):
                                    first_line_end = code_part.find('\n')
                                    if first_line_end != -1:
                                        modified_code = code_part[first_line_end+1:].strip()
                                    else:
                                        modified_code = code_part.strip()
                                else:
                                    modified_code = code_part.strip()
                                
                                explanation = "".join(parts[2:]).strip()
                            else:
                                print("Failed to get complete code from Gemini, falling back to Groq")
                                raise Exception("Failed to get complete code")
                        
                        # Gemini processing success, return result
                        return jsonify({
                            "modified_code": format_code_output(modified_code, language),
                            "explanation": explanation,
                            "original_code": original_code,
                            "language": language
                        })
                    
                    # If no proper response format, fall through to Groq
                    print("Gemini returned improper response format, falling back to Groq")
                    
                except Exception as api_error:
                    print(f"Gemini API error: {str(api_error)}")
                    # Fall through to Groq
            
            except Exception as gemini_error:
                print(f"Gemini processing error: {str(gemini_error)}")
                # Fall through to Groq
                
            # Try with Groq as second option if enabled
            if USE_GROQ:
                try:
                    print("Falling back to Groq API")
                    groq_result = process_with_groq(instruction, original_code, user_prompt, language)
                    
                    # Check if the result contains placeholder comments
                    if "// ... (rest of the class remains unchanged)" in groq_result["modified_code"] or "// ..." in groq_result["modified_code"]:
                        # Try to get a more complete response from Groq
                        complete_instruction = f"""
I need help with this {language if language != 'auto' else ''} code:
```
{original_code}
```

{user_prompt}

CRITICAL: You MUST provide the COMPLETE CODE. DO NOT use placeholders or comments like '... (rest of the class remains unchanged)'.
Return the entire code with your improvements implemented. Do not abbreviate any part of the code.

Please provide:
1. The improved code in triple backticks
2. A brief explanation of the changes
"""
                        print("Detected placeholder comments in Groq response, trying again with explicit instruction")
                        complete_groq_result = process_with_groq(complete_instruction, original_code, user_prompt, language)
                        
                        # Use the new result if it doesn't have placeholder comments
                        if ("// ... (rest of the class remains unchanged)" not in complete_groq_result["modified_code"] and 
                            "// ..." not in complete_groq_result["modified_code"]):
                            groq_result = complete_groq_result
                    
                    return jsonify({
                        "modified_code": format_code_output(groq_result["modified_code"], language),
                        "explanation": groq_result["explanation"],
                        "original_code": original_code,
                        "language": language,
                        "using_groq": True
                    })
                except Exception as groq_error:
                    print(f"Groq processing error: {str(groq_error)}")
                    # Fall through to Ollama
            
            # Finally try with Ollama as last resort
            if USE_OLLAMA_BACKUP:
                print("Falling back to Ollama")
                ollama_result = process_with_ollama(instruction, original_code, user_prompt, language)
                
                # Check if the result contains placeholder comments
                if "// ... (rest of the class remains unchanged)" in ollama_result["modified_code"] or "// ..." in ollama_result["modified_code"]:
                    # Try to get a more complete response from Ollama
                    complete_instruction = f"""
I need help with this {language if language != 'auto' else ''} code:
```
{original_code}
```

{user_prompt}

CRITICAL: You MUST provide the COMPLETE CODE. DO NOT use placeholders or comments like '... (rest of the class remains unchanged)'.
Return the entire code with your improvements implemented. Do not abbreviate any part of the code.

Please provide:
1. The improved code in triple backticks
2. A brief explanation of the changes
"""
                    print("Detected placeholder comments in Ollama response, trying again with explicit instruction")
                    complete_ollama_result = process_with_ollama(complete_instruction, original_code, user_prompt, language)
                    
                    # Use the new result if it doesn't have placeholder comments
                    if ("// ... (rest of the class remains unchanged)" not in complete_ollama_result["modified_code"] and 
                        "// ..." not in complete_ollama_result["modified_code"]):
                        ollama_result = complete_ollama_result
                
                return jsonify({
                    "modified_code": format_code_output(ollama_result["modified_code"], language),
                    "explanation": ollama_result["explanation"],
                    "original_code": original_code,
                    "language": language,
                    "using_backup": True
                })
            
            # If all else fails, return an error
            return jsonify({
                "error": "All AI services failed to process your request.",
                "modified_code": original_code,
                "explanation": "Please try again later or try a simpler code sample."
            }), 500
            
        except Exception as e:
            # Try with Ollama as backup
            if USE_OLLAMA_BACKUP:
                ollama_result = process_with_ollama(instruction, original_code, user_prompt, language)
                return jsonify({
                    "modified_code": ollama_result["modified_code"],
                    "explanation": ollama_result["explanation"],
                    "original_code": original_code,
                    "language": language,
                    "using_backup": True
                })
            
            return jsonify({"error": f"API Error: {str(e)}", "modified_code": original_code, "explanation": "An error occurred while processing your request. Please try again."}), 500
            
    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        query = data.get("query", "")  # Changed from message to query to match frontend
        code_context = data.get("codeContext", {})  # Get code context from request
        session_id = request.remote_addr  # Use IP address as session ID for simplicity
        
        if not query:
            return jsonify({"error": "Message is required"}), 400
        
        # Store code context in session if provided
        if code_context:
            if session_id not in chat_history:
                chat_history[session_id] = {}
            chat_history[session_id]['code_context'] = code_context
            logger.info(f"Stored code context for session {session_id}")
        
        # Create a more informative prompt with code context
        enhanced_query = query
        if session_id in chat_history and 'code_context' in chat_history[session_id]:
            ctx = chat_history[session_id]['code_context']
            
            # Add original code if available
            if ctx.get('originalCode'):
                enhanced_query = f"Context: I'm working with this code:\n```{ctx.get('lastLanguage', 'javascript')}\n{ctx['originalCode']}\n```\n\nUser Query: {query}"
            
            # If there's modified code, include that too
            if ctx.get('modifiedCode') and ctx['originalCode'] != ctx['modifiedCode']:
                enhanced_query = f"Context: I'm working with original code:\n```{ctx.get('lastLanguage', 'javascript')}\n{ctx['originalCode']}\n```\n\nThe code was modified to:\n```{ctx.get('lastLanguage', 'javascript')}\n{ctx['modifiedCode']}\n```\n\nUser Query: {query}"
            
            # Add optimization focus if available
            if ctx.get('optimizationFocus') and len(ctx['optimizationFocus']) > 0:
                focus_str = ", ".join(ctx['optimizationFocus'])
                enhanced_query += f"\nOptimization focus: {focus_str}"
            
            logger.info(f"Enhanced query with code context for session {session_id}")
        
        try:
            # If using Ollama as primary, skip Gemini and go straight to Ollama
            if USE_OLLAMA_PRIMARY:
                    try:
                        # Call Ollama API for chat
                        ollama_response = requests.post(
                            f"{OLLAMA_URL}/api/generate",
                            json={
                                "model": OLLAMA_MODEL,
                            "prompt": f"You are a helpful AI coding assistant specializing in game development and software engineering. The user asks: {enhanced_query}",
                                "stream": False
                            },
                        timeout=OLLAMA_TIMEOUT
                        )
                        
                        if ollama_response.status_code == 200:
                            result = ollama_response.json()
                            ai_response = result.get("response", "")
                            return jsonify({"response": ai_response, "using_backup": True})
                        else:
                            return jsonify({"response": f"Ollama service failed with status code {ollama_response.status_code}. Please try again later.", "using_backup": True})
                    except Exception as e:
                        return jsonify({"response": f"Error with Ollama service: {str(e)}. Please try again later.", "using_backup": True})
                
            # Try Gemini first
            try:
                # Set a timeout for API calls
                start_time = time.time()
                max_time = 45  # Increased timeout for larger responses
                
                # Initialize chat history for this session if it doesn't exist
                if session_id not in chat_history or 'chat' not in chat_history[session_id]:
                    model = genai.GenerativeModel(MODEL_NAME)
                    chat = model.start_chat(history=[])
                    # Send an initial system message
                    chat.send_message("You are a helpful AI coding assistant. You specialize in game development, Python, and software engineering. Provide clear, accurate answers with code examples when appropriate.")
                    if session_id not in chat_history:
                        chat_history[session_id] = {'chat': chat}
                    else:
                        chat_history[session_id]['chat'] = chat
                else:
                    chat = chat_history[session_id]['chat']
                
                # Send the user message and get the response
                response = chat.send_message(enhanced_query)
                
                # Extract content from the response
                ai_response = response.text
                
                # Check if the response contains code modifications to send back to the UI
                code_update = None
                if "```" in ai_response:
                    # Extract code blocks from the response
                    code_blocks = re.findall(r'```(?:\w+)?\n(.*?)\n```', ai_response, re.DOTALL)
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
            
            except Exception as gemini_error:
                print(f"Gemini chat error: {str(gemini_error)}")
                # Fall through to Groq
            
            # Try with Groq as second option if enabled
            if USE_GROQ:
                try:
                    print("Falling back to Groq API for chat")
                    # Create Groq chat request
                    headers = {
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    }
                    
                    payload = {
                        "model": GROQ_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are a helpful AI coding assistant specializing in game development and software engineering."},
                            {"role": "user", "content": enhanced_query}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 4096
                    }
                    
                    # Make the request
                    response = requests.post(
                        GROQ_API_URL,
                        headers=headers,
                        json=payload,
                        timeout=60
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        ai_response = result['choices'][0]['message']['content']
                        
                        # Check if the response contains code modifications
                        code_update = None
                        if "```" in ai_response:
                            # Extract code blocks from the response
                            code_blocks = re.findall(r'```(?:\w+)?\n(.*?)\n```', ai_response, re.DOTALL)
                            if code_blocks and len(code_blocks) > 0:
                                # If there's code in the response, prepare it for the editor
                                main_code_block = code_blocks[0]
                                code_update = {
                                    "code": main_code_block,
                                    "explanation": ai_response.replace('```' + main_code_block + '```', '').strip()
                                }
                        
                        if code_update:
                            return jsonify({"response": ai_response, "codeUpdate": code_update, "using_groq": True})
                        else:
                            return jsonify({"response": ai_response, "using_groq": True})
                    else:
                        print(f"Groq API error: Status {response.status_code}")
                        # Fall through to Ollama
                        
                except Exception as groq_error:
                    print(f"Groq chat error: {str(groq_error)}")
                    # Fall through to Ollama
            
            # Finally try with Ollama as last resort
            if USE_OLLAMA_BACKUP:
                try:
                    print("Falling back to Ollama for chat")
                    # Call Ollama API for chat
                    ollama_response = requests.post(
                        f"{OLLAMA_URL}/api/generate",
                        json={
                            "model": OLLAMA_MODEL,
                            "prompt": f"You are a helpful AI coding assistant. The user asks: {enhanced_query}",
                            "stream": False
                        },
                        timeout=OLLAMA_TIMEOUT
                    )
                    
                    if ollama_response.status_code == 200:
                        result = ollama_response.json()
                        ai_response = result.get("response", "")
                        return jsonify({"response": ai_response, "using_backup": True})
                    else:
                        return jsonify({"response": "I'm sorry, all AI services are experiencing issues. Please try again later.", "using_backup": True})
                except Exception as e:
                    return jsonify({"response": f"I'm sorry, all AI services encountered errors. Please try again later.", "using_backup": True})
            
            # If all services fail
            return jsonify({"response": "I'm sorry, all AI services are currently unavailable. Please try again later."}), 500
            
        except Exception as e:
            # If there's a global API error, we'll create a new chat session to ensure fresh start
            if session_id in chat_history:
                # Keep code context but reset chat
                code_context_backup = chat_history[session_id].get('code_context', {})
                chat_history[session_id] = {'code_context': code_context_backup}
            return jsonify({"response": f"I'm sorry, but I encountered an error: {str(e)}. Let's start a fresh conversation."}), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Function to format code output based on language
def format_code_output(code, language):
    """Format code based on language for better readability"""
    try:
        # Handle JavaScript/TypeScript code formatting
        if language in ["auto", "javascript", "js", "typescript", "ts"]:
            opts = {
                "indent_size": 2, 
                "indent_char": " ", 
                "max_preserve_newlines": 2,
                "preserve_newlines": True,
                "keep_array_indentation": False,
                "break_chained_methods": False,
                "indent_scripts": "normal",
                "brace_style": "collapse",
                "space_before_conditional": True,
                "unescape_strings": False,
                "jslint_happy": False,
                "end_with_newline": True,
                "wrap_line_length": 0,
                "indent_inner_html": False,
                "comma_first": False,
                "e4x": False,
                "indent_empty_lines": False
            }
            return jsbeautifier.beautify(code, opts)
        # For other languages, return as is
        return code
    except Exception as e:
        print(f"Error formatting code: {e}")
        return code  # Return original code if formatting fails

if __name__ == "__main__":
    app.run(debug=True) 
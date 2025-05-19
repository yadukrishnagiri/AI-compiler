# AI Code Iterator

A lightweight web application that helps developers improve their code using AI-powered suggestions. Built as a proof of concept for Aicade's AI Engineer Task.

## Features

- **Code Input**: Paste your code snippet for improvement
- **Custom Prompts**: Describe specific changes or enhancements you want
- **AI-Powered Suggestions**: Get modified code with detailed explanations
- **Code Integration**: Easily integrate suggested changes into your codebase

## Technical Details

- **Backend**: Python with Flask
- **Frontend**: HTML, CSS, JavaScript
- **AI Integration**: OpenAI API (GPT-3.5 Turbo)

## Setup Instructions

1. **Clone this repository**:
   ```
   git clone <repository-url>
   cd ai-code-iterator
   ```

2. **Install dependencies**:
   ```
   pip install -r requirements.txt
   ```

3. **Set up your OpenAI API key**:
   - Create a `.env` file in the project root
   - Add your OpenAI API key: `OPENAI_API_KEY=your_api_key_here`

4. **Run the application**:
   ```
   python app.py
   ```

5. **Access the web interface**:
   Open your browser and navigate to `http://localhost:5000`

## Usage

1. Paste your code into the "Original Code" textarea
2. Describe what you want to improve in the "Your Request" textarea
3. Click "Generate Suggestions" to get AI-powered recommendations
4. Review the modified code and explanation
5. Click "Integrate Code" to apply the changes to your original code

## Example Use Cases

- Optimizing game loops for better performance
- Adding error handling to existing functions
- Converting procedural code to object-oriented design
- Implementing best practices for specific gaming frameworks
- Refactoring code for better readability and maintainability

## Note for Evaluators

This application is designed as a proof of concept for the AI Engineer Task. The focus has been on creating a functional, user-friendly interface that demonstrates the capabilities of AI-assisted code improvement, specifically targeting game development workflows. 
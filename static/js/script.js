document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const originalCodeTextarea = document.getElementById('original-code');
    const userPromptTextarea = document.getElementById('user-prompt');
    const submitBtn = document.getElementById('submit-btn');
    const outputSection = document.getElementById('output-section');
    const modifiedCodePre = document.getElementById('modified-code');
    const explanationText = document.getElementById('explanation-text');
    const integrateBtn = document.getElementById('integrate-btn');
    const loadingIndicator = document.getElementById('loading');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const chatMessages = document.getElementById('chat-messages');
    
    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Example code for game development (helpful for users to see an example)
    const exampleCode = `def update_player_position(player, direction, speed):
    if direction == "up":
        player.y -= speed
    elif direction == "down":
        player.y += speed
    elif direction == "left":
        player.x -= speed
    elif direction == "right":
        player.x += speed
    
    # Make sure player stays within bounds
    if player.x < 0:
        player.x = 0
    if player.x > 800:
        player.x = 800
    if player.y < 0:
        player.y = 0
    if player.y > 600:
        player.y = 600`;

    // Example prompt
    const examplePrompt = "Optimize this function and add diagonal movement support";

    // Set example code and prompt
    originalCodeTextarea.value = exampleCode;
    userPromptTextarea.value = examplePrompt;

    // Update placeholder text to be more descriptive
    userPromptTextarea.placeholder = "Describe what you want to change (e.g., 'Fix errors', 'Optimize code', 'Add features'). Optional - if blank, errors will be fixed automatically.";

    // Submit button functionality for code iteration
    submitBtn.addEventListener('click', async () => {
        const originalCode = originalCodeTextarea.value.trim();
        const userPrompt = userPromptTextarea.value.trim();

        if (!originalCode) {
            alert('Please provide code to improve');
            return;
        }

        // Show loading indicator
        loadingIndicator.style.display = 'flex';

        try {
            const response = await fetch('/iterate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: originalCode,
                    prompt: userPrompt
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Display the results
                modifiedCodePre.textContent = data.modified_code;
                explanationText.innerHTML = formatExplanation(data.explanation);
                
                // Show the output section
                outputSection.style.display = 'flex';
                
                // Scroll to the output section
                outputSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert(`Error: ${data.error || 'Something went wrong'}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
        }
    });

    // Integrate button functionality
    integrateBtn.addEventListener('click', () => {
        originalCodeTextarea.value = modifiedCodePre.textContent;
        
        // Scroll back to the top
        originalCodeTextarea.scrollIntoView({ behavior: 'smooth' });
        
        // Focus on the textarea
        originalCodeTextarea.focus();
    });

    // Chat functionality
    sendChatBtn.addEventListener('click', async () => {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessageToChat(message, 'user');
        
        // Clear input
        chatInput.value = '';
        
        // Show loading indicator
        loadingIndicator.style.display = 'flex';
        
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Add AI response to chat
                addMessageToChat(data.response, 'system');
            } else {
                addMessageToChat(`Error: ${data.error || 'Something went wrong'}`, 'system');
            }
        } catch (error) {
            addMessageToChat(`Error: ${error.message}`, 'system');
        } finally {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
        }
    });
    
    // Handle enter key in chat input
    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendChatBtn.click();
        }
    });
    
    // Function to add message to chat
    function addMessageToChat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        // Check if the message contains code blocks
        if (message.includes('```')) {
            // Split by code blocks and process each part
            const parts = message.split(/```([\s\S]*?)```/);
            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 0) {
                    // Regular text
                    if (parts[i].trim()) {
                        const textPart = document.createElement('div');
                        textPart.innerHTML = formatExplanation(parts[i]);
                        messageContent.appendChild(textPart);
                    }
                } else {
                    // Code block
                    const codePart = document.createElement('pre');
                    codePart.textContent = parts[i];
                    messageContent.appendChild(codePart);
                }
            }
        } else {
            messageContent.innerHTML = formatExplanation(message);
        }
        
        messageElement.appendChild(messageContent);
        chatMessages.appendChild(messageElement);
        
        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Helper function to format explanation text
    function formatExplanation(text) {
        // Simple Markdown-like formatting
        // Convert line breaks to paragraphs
        let formatted = text.split('\n\n').map(paragraph => `<p>${paragraph}</p>`).join('');
        
        // Format lists
        formatted = formatted.replace(/- (.*?)(\n|$)/g, '<li>$1</li>');
        formatted = formatted.replace(/<li>.*?<\/li>/gs, match => `<ul>${match}</ul>`);
        
        // Bold text between ** markers
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic text between * markers
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return formatted;
    }

    // Navigation functionality
    const navItems = document.querySelectorAll('.nav-item');
    const contentPanels = document.querySelectorAll('.content-panel');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all nav items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get the panel id from data attribute
            const panelId = this.getAttribute('data-panel');
            
            // Hide all panels
            contentPanels.forEach(panel => panel.classList.remove('active'));
            
            // Show the selected panel
            document.getElementById(panelId).classList.add('active');
        });
    });

    // Code editor line numbers
    const codeInput = document.getElementById('code-input');
    const lineNumbers = document.querySelector('.line-numbers');
    
    function updateLineNumbers() {
        const linesCount = codeInput.value.split('\n').length;
        lineNumbers.innerHTML = '';
        
        for (let i = 1; i <= linesCount; i++) {
            const span = document.createElement('span');
            span.textContent = i;
            lineNumbers.appendChild(span);
        }
    }
    
    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', function() {
        lineNumbers.scrollTop = codeInput.scrollTop;
    });
    
    // Initialize with at least one line number
    updateLineNumbers();
    
    // File explorer expand/collapse
    const folderNames = document.querySelectorAll('.folder-name');
    
    folderNames.forEach(folder => {
        folder.addEventListener('click', function() {
            const folderContents = this.nextElementSibling;
            folderContents.style.display = folderContents.style.display === 'none' ? 'block' : 'none';
            
            // Change the icon
            const icon = this.querySelector('i');
            if (folderContents.style.display === 'none') {
                icon.classList.replace('fa-folder-open', 'fa-folder');
            } else {
                icon.classList.replace('fa-folder', 'fa-folder-open');
            }
        });
    });
    
    // Simulate code execution
    const runButton = document.querySelector('.run-button');
    const terminalContent = document.querySelector('.terminal-content');
    
    runButton.addEventListener('click', function() {
        // Show loading overlay
        const loadingOverlay = document.querySelector('.loading-overlay');
        loadingOverlay.style.display = 'flex';
        
        // Simulate processing
        setTimeout(() => {
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
            
            // Get the code
            const code = codeInput.value.trim();
            
            // Add to terminal
            const timestamp = new Date().toLocaleTimeString();
            terminalContent.innerHTML += `<div>[${timestamp}] Running code...</div>`;
            
            try {
                // For demo purposes, just output the code
                // In a real IDE, you might want to use something like eval() carefully
                // or better, use a sandboxed environment or server-side execution
                terminalContent.innerHTML += `<div style="color: #00c853;">[${timestamp}] Output:</div>`;
                terminalContent.innerHTML += `<pre>${code}</pre>`;
                terminalContent.innerHTML += `<div style="color: #00c853;">[${timestamp}] Code executed successfully.</div>`;
            } catch (error) {
                terminalContent.innerHTML += `<div style="color: #f44336;">[${timestamp}] Error: ${error.message}</div>`;
            }
            
            // Scroll to bottom of terminal
            terminalContent.scrollTop = terminalContent.scrollHeight;
        }, 1000);
    });
    
    // Chat functionality
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.querySelector('.chat-input-container button');
    const chatMessages = document.querySelector('.chat-messages');
    
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            // Add user message
            const userMessage = document.createElement('div');
            userMessage.classList.add('message', 'message-user');
            userMessage.textContent = message;
            chatMessages.appendChild(userMessage);
            
            // Clear input
            chatInput.value = '';
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Simulate AI response
            setTimeout(() => {
                const aiMessage = document.createElement('div');
                aiMessage.classList.add('message', 'message-assistant');
                aiMessage.textContent = "I'm your AI assistant. I can help you with your code and answer questions.";
                chatMessages.appendChild(aiMessage);
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 1000);
        }
    }
    
    sendButton.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // File tabs functionality
    const fileTabs = document.querySelectorAll('.file-tab');
    const closeTabButtons = document.querySelectorAll('.close-tab');
    
    fileTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            fileTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    closeTabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const tab = this.parentElement;
            
            // If the closing tab is active, activate the first remaining tab
            if (tab.classList.contains('active')) {
                const remainingTabs = Array.from(fileTabs).filter(t => t !== tab);
                if (remainingTabs.length > 0) {
                    remainingTabs[0].classList.add('active');
                }
            }
            
            // Remove the tab
            tab.remove();
        });
    });

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
    
    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }
}); 
// Debug script to fix UI interaction issues
document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug script loaded');
    
    // Create a global shared context
    window.AicadesContext = {
        currentCode: '',
        currentLanguage: 'auto',
        currentPrompt: '',
        lastModifiedCode: '',
        lastExplanation: ''
    };
    
    // Fix for Generate Suggestions button
    setTimeout(function() {
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            console.log('Found submit button, adding event listener');
            
            // Remove any existing listeners by cloning and replacing the element
            const newSubmitBtn = submitBtn.cloneNode(true);
            submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
            
            // Add new click listener
            newSubmitBtn.addEventListener('click', function(e) {
                console.log('Generate Suggestions button clicked');
                
                // Get the necessary elements
                const originalEditor = document.querySelector('.CodeMirror').CodeMirror;
                const userPrompt = document.getElementById('user-prompt');
                const loadingOverlay = document.getElementById('loading');
                const languageSelector = document.getElementById('language');
                
                if (!originalEditor || !originalEditor.getValue().trim()) {
                    alert('Please enter some code to iterate on.');
                    return;
                }
                
                // Update shared context
                window.AicadesContext.currentCode = originalEditor.getValue();
                window.AicadesContext.currentLanguage = languageSelector ? languageSelector.value : 'auto';
                window.AicadesContext.currentPrompt = userPrompt ? userPrompt.value : '';
                
                // Show loading overlay
                if (loadingOverlay) {
                    loadingOverlay.classList.remove('hidden');
                }
                
                // Get selected language
                const selectedLanguage = window.AicadesContext.currentLanguage;
                
                // Make the API request
                fetch('/iterate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code: window.AicadesContext.currentCode,
                        prompt: window.AicadesContext.currentPrompt,
                        language: selectedLanguage
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => {
                            throw new Error(data.error || `Server returned ${response.status}: ${response.statusText}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('API response received', data);
                    // Hide loading overlay
                    if (loadingOverlay) {
                        loadingOverlay.classList.add('hidden');
                    }
                    
                    // Update shared context with results
                    window.AicadesContext.lastModifiedCode = data.modified_code || '';
                    window.AicadesContext.lastExplanation = data.explanation || '';
                    
                    // Handle the response similar to the original code
                    // Create or get output editor
                    let outputEditor = null;
                    const existingEditor = document.querySelector('#output-container .CodeMirror');
                    if (existingEditor && existingEditor.CodeMirror) {
                        outputEditor = existingEditor.CodeMirror;
                    } else {
                        const outputContainer = document.getElementById('output-container');
                        if (outputContainer) {
                            outputContainer.innerHTML = '';
                            const textarea = document.createElement('textarea');
                            textarea.id = 'output-editor';
                            outputContainer.appendChild(textarea);
                            
                            outputEditor = CodeMirror.fromTextArea(textarea, {
                                mode: selectedLanguage === 'python' ? 'python' : 'javascript',
                                theme: "monokai",
                                lineNumbers: true,
                                matchBrackets: true,
                                readOnly: true,
                                indentUnit: 2,
                                tabSize: 2,
                                lineWrapping: false,
                                gutters: ["CodeMirror-linenumbers"]
                            });
                            outputEditor.setSize(null, "100%");
                        }
                    }
                    
                    // Set the content
                    if (outputEditor) {
                        outputEditor.setValue(data.modified_code || '');
                    }
                    
                    // Show explanation
                    const explanationText = document.getElementById('explanation-text');
                    if (explanationText) {
                        explanationText.innerHTML = (data.explanation || 'No explanation provided.').replace(/\n/g, '<br>');
                    }
                    
                    // Show model info if available
                    if (data.using_backup || data.using_groq) {
                        let serviceNote = '';
                        if (data.using_backup) {
                            serviceNote = '<div class="text-amber-600 dark:text-amber-400 text-sm mt-2 p-2 bg-amber-100 dark:bg-amber-900 rounded"><i class="fas fa-info-circle mr-1"></i> Using local AI model (Ollama) as a backup since the primary service is unavailable.</div>';
                        } else if (data.using_groq) {
                            serviceNote = '<div class="text-blue-600 dark:text-blue-400 text-sm mt-2 p-2 bg-blue-100 dark:bg-blue-900 rounded"><i class="fas fa-info-circle mr-1"></i> Using Groq AI as a fallback since Gemini service is unavailable.</div>';
                        }
                        
                        if (serviceNote && explanationText) {
                            explanationText.insertAdjacentHTML('afterbegin', serviceNote);
                        }
                    }
                    
                    // Show the output section if it's hidden
                    const outputSection = document.getElementById('output-section');
                    if (outputSection && outputSection.classList.contains('hidden')) {
                        outputSection.classList.remove('hidden');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    
                    // Hide loading overlay
                    if (loadingOverlay) {
                        loadingOverlay.classList.add('hidden');
                    }
                    
                    // Show error message
                    const explanationText = document.getElementById('explanation-text');
                    if (explanationText) {
                        explanationText.innerHTML = `<div class="text-red-600 dark:text-red-400 font-semibold">
                            <i class="fas fa-exclamation-circle mr-2"></i>
                            ${error.message || 'An error occurred while processing your request.'}
                        </div>`;
                    }
                    
                    // Show the output section if it's hidden
                    const outputSection = document.getElementById('output-section');
                    if (outputSection && outputSection.classList.contains('hidden')) {
                        outputSection.classList.remove('hidden');
                    }
                });
            });
            
            console.log('New event listener added to Generate Suggestions button');
        } else {
            console.error('Submit button not found');
        }
        
        // Fix for dark mode toggle
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            console.log('Found dark mode toggle, adding event listener');
            
            // Remove any existing listeners and add new one
            const newDarkModeToggle = darkModeToggle.cloneNode(true);
            darkModeToggle.parentNode.replaceChild(newDarkModeToggle, darkModeToggle);
            
            newDarkModeToggle.addEventListener('change', function() {
                console.log('Dark mode toggled to:', this.checked);
                document.documentElement.classList.toggle('dark', this.checked);
                localStorage.setItem('dark-mode', this.checked ? 'enabled' : 'disabled');
            });
            
            // Check saved preference
            if (localStorage.getItem('dark-mode') === 'enabled') {
                newDarkModeToggle.checked = true;
                document.documentElement.classList.add('dark');
            }
        }
        
        // Fix for chat input - Enhanced with code sharing features
        const chatInput = document.getElementById('chat-input');
        const sendChatBtn = document.getElementById('send-chat-btn');
        if (chatInput && sendChatBtn) {
            console.log('Found chat elements, ensuring event listeners');
            
            // Create completely new send button to replace the existing one
            const newSendBtn = document.createElement('button');
            newSendBtn.id = 'send-chat-btn-new';
            newSendBtn.className = 'bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow flex items-center justify-center transition';
            newSendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            
            // Replace the existing button
            if (sendChatBtn.parentNode) {
                sendChatBtn.parentNode.replaceChild(newSendBtn, sendChatBtn);
                console.log('Replaced send button with new element');
            }
            
            // Add direct click handler with normal function (not arrow function)
            newSendBtn.onclick = function() {
                console.log('New send chat button clicked');
                sendChatMessage();
            };
            
            // Add additional click handler to be safe
            newSendBtn.addEventListener('click', function() {
                console.log('Send chat event listener triggered');
                sendChatMessage();
            });
            
            // Add direct attribute click handler as another fallback
            newSendBtn.setAttribute('onclick', "console.log('Inline onclick triggered'); this.classList.add('clicked-effect'); setTimeout(() => this.classList.remove('clicked-effect'), 200);");
            
            // Add visual feedback style
            const style = document.createElement('style');
            style.textContent = `
                .clicked-effect {
                    transform: scale(0.95);
                    opacity: 0.9;
                }
                #send-chat-btn-new:active {
                    transform: scale(0.95);
                    opacity: 0.9;
                }
            `;
            document.head.appendChild(style);
            
            // Add chat input key handler
            chatInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    console.log('Enter pressed in chat input');
                    e.preventDefault();
                    sendChatMessage();
                }
            });
            
            // Add quick action buttons to the chat
            const chatInputArea = document.querySelector('.chat-input-area');
            if (chatInputArea) {
                const quickActionsDiv = document.createElement('div');
                quickActionsDiv.className = 'chat-quick-actions flex space-x-2 mb-2';
                quickActionsDiv.innerHTML = `
                    <button class="code-action-btn text-xs bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 px-2 py-1 rounded hover:bg-primary-200 dark:hover:bg-primary-700 transition">
                        <i class="fas fa-code mr-1"></i> Use Editor Code
                    </button>
                    <button class="explain-action-btn text-xs bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 px-2 py-1 rounded hover:bg-primary-200 dark:hover:bg-primary-700 transition">
                        <i class="fas fa-question-circle mr-1"></i> Explain Editor Code
                    </button>
                    <button class="result-action-btn text-xs bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 px-2 py-1 rounded hover:bg-primary-200 dark:hover:bg-primary-700 transition">
                        <i class="fas fa-lightbulb mr-1"></i> Discuss Latest Results
                    </button>
                `;
                chatInputArea.insertBefore(quickActionsDiv, chatInput.parentElement);
                
                // Add event listeners to quick action buttons
                const codeActionBtn = document.querySelector('.code-action-btn');
                if (codeActionBtn) {
                    codeActionBtn.addEventListener('click', function() {
                        const originalEditor = document.querySelector('.CodeMirror');
                        if (originalEditor && originalEditor.CodeMirror) {
                            const code = originalEditor.CodeMirror.getValue();
                            if (code.trim()) {
                                chatInput.value = "Help me improve this code:\n```\n" + code + "\n```";
                                chatInput.focus();
                                autoGrow(chatInput);
                            } else {
                                alert('No code in editor to share.');
                            }
                        } else {
                            alert('Code editor not available.');
                        }
                    });
                }
                
                const explainActionBtn = document.querySelector('.explain-action-btn');
                if (explainActionBtn) {
                    explainActionBtn.addEventListener('click', function() {
                        const originalEditor = document.querySelector('.CodeMirror');
                        if (originalEditor && originalEditor.CodeMirror) {
                            const code = originalEditor.CodeMirror.getValue();
                            if (code.trim()) {
                                chatInput.value = "Explain what this code does and identify any issues:\n```\n" + code + "\n```";
                                chatInput.focus();
                                autoGrow(chatInput);
                            } else {
                                alert('No code in editor to explain.');
                            }
                        } else {
                            alert('Code editor not available.');
                        }
                    });
                }
                
                const resultActionBtn = document.querySelector('.result-action-btn');
                if (resultActionBtn) {
                    resultActionBtn.addEventListener('click', function() {
                        if (window.AicadesContext.lastModifiedCode && window.AicadesContext.lastExplanation) {
                            chatInput.value = "Let's discuss the latest code improvements. The original code was modified to:\n```\n" 
                                + window.AicadesContext.lastModifiedCode 
                                + "\n```\nWith the explanation: " 
                                + window.AicadesContext.lastExplanation.replace(/<br>/g, '\n');
                            chatInput.focus();
                            autoGrow(chatInput);
                        } else {
                            alert('No recent code modifications to discuss.');
                        }
                    });
                }
            }
            
            // Auto-grow chat input
            function autoGrow(textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = (textarea.scrollHeight) + 'px';
            }
            
            chatInput.addEventListener('input', function() {
                autoGrow(this);
            });
            
            // Create a simpler sendChatMessage function that works more reliably
            window.sendChatMessage = function() {
                const message = chatInput.value.trim();
                if (!message) return;
                
                console.log('Sending chat message:', message);
                
                // Clear input
                chatInput.value = '';
                chatInput.style.height = 'auto';
                
                // Show a loading indicator
                const chatMessagesContainer = document.getElementById('chat-messages');
                if (!chatMessagesContainer) {
                    console.error('Chat messages container not found');
                    return;
                }
                
                // Add user message
                const userMsgDiv = document.createElement('div');
                userMsgDiv.className = 'message user-message flex space-x-3 mb-4';
                userMsgDiv.innerHTML = `
                    <div class="message-avatar flex-shrink-0 h-10 w-10 rounded-full bg-primary-500 text-white flex items-center justify-center">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="message-content bg-primary-500 text-white rounded-lg p-3 max-w-3xl">
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                `;
                chatMessagesContainer.appendChild(userMsgDiv);
                
                // Add loading message
                const loadingDiv = document.createElement('div');
                loadingDiv.id = 'chat-loading-indicator';
                loadingDiv.className = 'message system-message flex space-x-3 mb-4';
                loadingDiv.innerHTML = `
                    <div class="message-avatar flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-content bg-primary-50 dark:bg-gray-700 rounded-lg p-3 max-w-3xl flex items-center">
                        <div class="flex space-x-2">
                            <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                            <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                            <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                        </div>
                    </div>
                `;
                chatMessagesContainer.appendChild(loadingDiv);
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                
                // Enhance the chat context with editor info if code-related keywords are detected
                let enhancedMessage = message;
                
                // Check if message mentions code but doesn't include code blocks
                const mentionsCode = /\b(code|function|bug|error|fix|improve)\b/i.test(message);
                const hasCodeBlock = message.includes('```');
                
                // If message mentions code but doesn't include code blocks, add the current editor code
                if (mentionsCode && !hasCodeBlock && window.AicadesContext.currentCode) {
                    enhancedMessage = message + "\n\nHere's the code from my editor:\n```\n" + window.AicadesContext.currentCode + "\n```";
                    console.log('Enhanced message with editor code');
                }
                
                // Call API with potentially enhanced message
                fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: enhancedMessage
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Chat API response:', data);
                    
                    // Remove loading indicator
                    const loadingIndicator = document.getElementById('chat-loading-indicator');
                    if (loadingIndicator) {
                        loadingIndicator.remove();
                    }
                    
                    // Add AI response
                    if (chatMessagesContainer) {
                        const aiMsgDiv = document.createElement('div');
                        aiMsgDiv.className = 'message system-message flex space-x-3 mb-4';
                        aiMsgDiv.innerHTML = `
                            <div class="message-avatar flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="message-content bg-primary-50 dark:bg-gray-700 rounded-lg p-3 max-w-3xl">
                                ${data.response.replace(/\n/g, '<br>')}
                            </div>
                        `;
                        chatMessagesContainer.appendChild(aiMsgDiv);
                        
                        // Add model info if needed
                        if (data.using_backup || data.using_groq) {
                            const modelInfoDiv = document.createElement('div');
                            modelInfoDiv.className = 'message system-message flex space-x-3 mb-4';
                            
                            if (data.using_backup) {
                                modelInfoDiv.innerHTML = `
                                    <div class="message-avatar flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                        <i class="fas fa-info-circle"></i>
                                    </div>
                                    <div class="message-content bg-amber-50 dark:bg-amber-900 text-amber-600 dark:text-amber-400 rounded-lg p-3 max-w-3xl">
                                        Using local AI model (Ollama) as a backup since the primary services are unavailable.
                                    </div>
                                `;
                            } else if (data.using_groq) {
                                modelInfoDiv.innerHTML = `
                                    <div class="message-avatar flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <i class="fas fa-info-circle"></i>
                                    </div>
                                    <div class="message-content bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg p-3 max-w-3xl">
                                        Using Groq AI as a fallback since Gemini service is unavailable.
                                    </div>
                                `;
                            }
                            
                            chatMessagesContainer.appendChild(modelInfoDiv);
                        }
                        
                        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                    }
                })
                .catch(error => {
                    console.error('Chat error:', error);
                    
                    // Remove loading indicator
                    const loadingIndicator = document.getElementById('chat-loading-indicator');
                    if (loadingIndicator) {
                        loadingIndicator.remove();
                    }
                    
                    // Add error message
                    if (chatMessagesContainer) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'message system-message flex space-x-3 mb-4';
                        errorDiv.innerHTML = `
                            <div class="message-avatar flex-shrink-0 h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-400">
                                <i class="fas fa-exclamation-circle"></i>
                            </div>
                            <div class="message-content bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg p-3 max-w-3xl">
                                Sorry, an error occurred: ${error.message || 'Unknown error'}
                            </div>
                        `;
                        chatMessagesContainer.appendChild(errorDiv);
                        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                    }
                });
            };
            
            // Make function globally available as a fallback
            window.sendChatMessage = sendChatMessage;
            
            // Use an inline click handler as another fallback
            document.body.addEventListener('click', function(e) {
                if (e.target.id === 'send-chat-btn-new' || e.target.closest('#send-chat-btn-new')) {
                    console.log('Body click handler caught send button click');
                    sendChatMessage();
                }
            });
        }
        
        // Fix for code highlighting in diff view
        const showDiffBtn = document.getElementById('show-diff-btn');
        if (showDiffBtn) {
            console.log('Found Show Diff button, enhancing functionality');
            
            // Clone and replace button to remove existing listeners
            const newShowDiffBtn = showDiffBtn.cloneNode(true);
            showDiffBtn.parentNode.replaceChild(newShowDiffBtn, showDiffBtn);
            
            newShowDiffBtn.addEventListener('click', function() {
                console.log('Show Diff button clicked');
                
                // Get the diff legend and toggle its visibility
                const diffLegend = document.getElementById('diff-legend');
                if (diffLegend) {
                    diffLegend.classList.toggle('hidden');
                }
                
                // Get original and modified code
                let originalCode = '';
                let modifiedCode = '';
                
                const originalEditor = document.querySelector('.CodeMirror');
                if (originalEditor && originalEditor.CodeMirror) {
                    originalCode = originalEditor.CodeMirror.getValue();
                }
                
                const outputEditor = document.querySelector('#output-container .CodeMirror');
                if (outputEditor && outputEditor.CodeMirror) {
                    modifiedCode = outputEditor.CodeMirror.getValue();
                    
                    // If we have both codes and the legend is visible, highlight the differences
                    if (originalCode && modifiedCode && !diffLegend.classList.contains('hidden')) {
                        // Get the output container
                        const outputContainer = document.getElementById('output-container');
                        if (outputContainer) {
                            console.log('Highlighting code differences');
                            
                            // Create highlighted HTML
                            const highlightedHTML = highlightCodeChanges(originalCode, modifiedCode);
                            
                            // Temporarily hide CodeMirror and show highlighted HTML
                            outputEditor.style.display = 'none';
                            
                            // Create or update highlighted div
                            let highlightedDiv = document.getElementById('highlighted-diff');
                            if (!highlightedDiv) {
                                highlightedDiv = document.createElement('div');
                                highlightedDiv.id = 'highlighted-diff';
                                highlightedDiv.className = 'text-sm h-full overflow-auto p-4 font-mono';
                                outputContainer.appendChild(highlightedDiv);
                            }
                            
                            highlightedDiv.innerHTML = highlightedHTML;
                            highlightedDiv.style.display = 'block';
                            
                            // Add a timer to go back to CodeMirror after some time
                            setTimeout(() => {
                                highlightedDiv.style.display = 'none';
                                outputEditor.style.display = 'block';
                                diffLegend.classList.add('hidden');
                            }, 5000);
                        }
                    }
                }
            });
        }
        
        // Fix vertical scrolling for original code editor
        const originalEditorContainer = document.querySelector('.code-editor-height');
        if (originalEditorContainer) {
            console.log('Found original editor container, ensuring proper scrolling');
            // Ensure the container has proper overflow settings
            originalEditorContainer.style.overflow = 'auto';
            
            // Make sure CodeMirror has proper height
            const cmElement = originalEditorContainer.querySelector('.CodeMirror');
            if (cmElement) {
                cmElement.style.height = '100%';
                cmElement.CodeMirror?.refresh();
            }
        }
        
        // Fix Apply Changes button
        const integrateBtn = document.getElementById('integrate-btn');
        if (integrateBtn) {
            console.log('Found Apply Changes button, adding event listener');
            
            // Remove any existing listeners
            const newIntegrateBtn = integrateBtn.cloneNode(true);
            integrateBtn.parentNode.replaceChild(newIntegrateBtn, integrateBtn);
            
            // Add new click listener
            newIntegrateBtn.addEventListener('click', function() {
                console.log('Apply Changes button clicked');
                
                // Get the output editor content
                let modifiedCode = '';
                const outputEditor = document.querySelector('#output-container .CodeMirror');
                if (outputEditor && outputEditor.CodeMirror) {
                    modifiedCode = outputEditor.CodeMirror.getValue();
                } else {
                    const modifiedCodeElement = document.getElementById('modified-code');
                    if (modifiedCodeElement) {
                        modifiedCode = modifiedCodeElement.textContent;
                    }
                }
                
                if (!modifiedCode.trim()) {
                    alert('No modified code to apply.');
                    return;
                }
                
                // Get the original editor
                const originalEditor = document.querySelector('.CodeMirror');
                if (originalEditor && originalEditor.CodeMirror) {
                    // Set the modified code in the original editor
                    originalEditor.CodeMirror.setValue(modifiedCode);
                    
                    // Update the shared context
                    window.AicadesContext.currentCode = modifiedCode;
                    
                    // Provide feedback
                    alert('Changes applied to the original code.');
                    
                    // Focus back to the original editor
                    originalEditor.CodeMirror.focus();
                } else {
                    alert('Original code editor not found.');
                }
            });
            
            console.log('New event listener added to Apply Changes button');
        }
    }, 500); // Give the page time to fully load and initialize
    
    // Helper function to highlight code differences
    function highlightCodeChanges(originalCode, modifiedCode) {
        if (!originalCode || !modifiedCode) return modifiedCode;
        
        // Split code into lines
        const originalLines = originalCode.split('\n');
        const modifiedLines = modifiedCode.split('\n');
        
        // Helper function to escape HTML
        function escapeHtml(text) {
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        
        // Create a map of line changes
        const changedLines = new Map();
        
        // Simple line-by-line comparison
        for (let i = 0; i < modifiedLines.length; i++) {
            const modLine = modifiedLines[i];
            const origLine = i < originalLines.length ? originalLines[i] : null;
            
            if (origLine === null) {
                // New line added
                changedLines.set(i, 'added');
            } else if (modLine !== origLine) {
                // Line was modified
                changedLines.set(i, 'modified');
            }
        }
        
        // Highlight the changed lines
        let highlightedCode = '';
        for (let i = 0; i < modifiedLines.length; i++) {
            const line = escapeHtml(modifiedLines[i]);
            if (changedLines.has(i)) {
                const changeType = changedLines.get(i);
                if (changeType === 'added') {
                    // Green background for added lines
                    highlightedCode += `<div class="bg-green-100 dark:bg-green-900 block px-2 py-0.5">${line}</div>`;
                } else if (changeType === 'modified') {
                    // Yellow background for modified lines
                    highlightedCode += `<div class="bg-yellow-100 dark:bg-yellow-900 block px-2 py-0.5">${line}</div>`;
                }
            } else {
                highlightedCode += `<div class="px-2 py-0.5">${line}</div>`;
            }
        }
        
        return highlightedCode;
    }
}); 
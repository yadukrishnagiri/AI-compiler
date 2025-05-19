// Simplified direct fix for the Apply Changes button
(function() {
    console.log("🛠️ Simple direct-fix script loaded");
    
    // Global context to track code state
    window.codeContext = {
        originalCode: '',
        modifiedCode: '',
        lastLanguage: '',
        lastPrompt: '',
        optimizationFocus: [],
        beforeAfterMode: 'after'
    };
    
    // Function to update code context
    function updateCodeContext() {
        try {
            console.log("🛠️ Updating code context...");
            
            // Get original code
            const originalEditor = document.querySelector('#original-code').nextElementSibling;
            if (originalEditor && originalEditor.CodeMirror) {
                window.codeContext.originalCode = originalEditor.CodeMirror.getValue();
            }
            
            // Get output code if available
            const outputContainer = document.querySelector('#output-container');
            if (outputContainer) {
                const outputEditor = outputContainer.querySelector('.CodeMirror');
                if (outputEditor && outputEditor.CodeMirror) {
                    window.codeContext.modifiedCode = outputEditor.CodeMirror.getValue();
                }
            }
            
            // Get language
            const langIndicator = document.querySelector('.language-indicator');
            if (langIndicator) {
                window.codeContext.lastLanguage = langIndicator.textContent.trim();
            }
            
            // Get optimization focus
            const optFocus = Array.from(document.querySelectorAll('.optimization-chip.selected'))
                .map(el => el.textContent.trim());
            window.codeContext.optimizationFocus = optFocus;
            
            // Get last prompt (from input or history)
            const messageInput = document.querySelector('#message-input');
            if (messageInput) {
                const lastMessage = messageInput.value.trim();
                if (lastMessage) {
                    window.codeContext.lastPrompt = lastMessage;
                } else {
                    // Try to get last message from history
                    const lastBubble = document.querySelector('#chat-container .user-message:last-child .message-text');
                    if (lastBubble) {
                        window.codeContext.lastPrompt = lastBubble.textContent.trim();
                    }
                }
            }
            
            console.log("🛠️ Code context updated:", window.codeContext);
            return true;
        } catch (e) {
            console.error("🛠️ Error updating code context:", e);
            return false;
        }
    }
    
    // Fix for all send buttons - make it work no matter what
    document.addEventListener('click', function(e) {
        // Find any button that looks like a send button
        if (e.target && (
            e.target.id === 'send-chat-btn' || 
            e.target.id === 'send-chat-btn-new' ||
            (e.target.closest && (
                e.target.closest('#send-chat-btn') || 
                e.target.closest('#send-chat-btn-new')
            )) ||
            // Also match any button with paper-plane icon
            (e.target.querySelector && e.target.querySelector('.fa-paper-plane') ||
            (e.target.classList && e.target.classList.contains('fa-paper-plane')))
        )) {
            console.log("🛠️ Send button captured via global handler");
            
            // Get the actual button element
            const clickedBtn = e.target.closest('button') || e.target;
            
            // Visual feedback
            clickedBtn.classList.add('clicked-effect');
            setTimeout(() => clickedBtn.classList.remove('clicked-effect'), 200);
            
            // Update code context before sending message
            updateCodeContext();
            
            // Always try the main function first
            if (typeof window.sendChatMessage === 'function') {
                window.sendChatMessage();
                return;
            }
            
            // If that fails, use the fallback implementation
            emergencySendMessage();
        }
    });
    
    // Emergency fallback chat function
    function emergencySendMessage() {
        console.log("🛠️ Using emergency fallback send function");
        
        // Get chat input and container
        const chatInput = document.getElementById('chat-input');
        const chatContainer = document.getElementById('chat-messages');
        
        if (!chatInput || !chatContainer) {
            console.error('Chat elements not found');
            return;
        }
        
        // Get message text
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Update code context before sending
        updateCodeContext();
        
        // Add user message to chat
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message flex space-x-3 mb-4';
        messageDiv.innerHTML = `
            <div class="message-avatar flex-shrink-0 h-10 w-10 rounded-full bg-primary-500 text-white flex items-center justify-center">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content bg-primary-500 text-white rounded-lg p-3 max-w-3xl">
                ${message.replace(/\n/g, '<br>')}
            </div>
        `;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Clear input
        chatInput.value = '';
        
        // Show loading indicator
        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = loadingId;
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
        chatContainer.appendChild(loadingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Prepare request with code context
        const requestBody = {
            query: message,
            codeContext: window.codeContext
        };
        
        // Send to backend
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Remove loading message
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                chatContainer.removeChild(loadingElement);
            }
            
            // Add AI response
            const aiMessageDiv = document.createElement('div');
            aiMessageDiv.className = 'message system-message flex space-x-3 mb-4';
            aiMessageDiv.innerHTML = `
                <div class="message-avatar flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content bg-primary-50 dark:bg-gray-700 rounded-lg p-3 max-w-3xl">
                    ${data.response.replace(/\n/g, '<br>')}
                </div>
            `;
            
            chatContainer.appendChild(aiMessageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        })
        .catch(error => {
            console.error('Chat error:', error);
            
            // Remove loading message
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                chatContainer.removeChild(loadingElement);
            }
            
            // Add error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message system-message flex space-x-3 mb-4';
            errorDiv.innerHTML = `
                <div class="message-avatar flex-shrink-0 h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-300">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="message-content bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg p-3 max-w-3xl">
                    Error: Could not process your request.
                </div>
            `;
            
            chatContainer.appendChild(errorDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
    }
    
    // Track code changes and context updates
    function setupCodeTracking() {
        try {
            console.log("🛠️ Setting up code tracking...");
            
            // Track original code changes
            const originalEditor = document.querySelector('#original-code').nextElementSibling;
            if (originalEditor && originalEditor.CodeMirror) {
                // Save initial state
                window.codeContext.originalCode = originalEditor.CodeMirror.getValue();
                
                // Listen for changes
                originalEditor.CodeMirror.on('change', function() {
                    window.codeContext.originalCode = originalEditor.CodeMirror.getValue();
                });
            }
            
            // Track output code changes
            const outputObserver = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length) {
                        const outputContainer = document.querySelector('#output-container');
                        if (outputContainer) {
                            const outputEditor = outputContainer.querySelector('.CodeMirror');
                            if (outputEditor && outputEditor.CodeMirror) {
                                // Store the modified code
                                window.codeContext.modifiedCode = outputEditor.CodeMirror.getValue();
                                
                                // Add change listener to the output editor
                                if (!outputEditor.hasChangeListener) {
                                    outputEditor.CodeMirror.on('change', function() {
                                        window.codeContext.modifiedCode = outputEditor.CodeMirror.getValue();
                                    });
                                    outputEditor.hasChangeListener = true;
                                }
                            }
                        }
                    }
                });
            });
            
            // Start observing for output changes
            const mainContainer = document.querySelector('main');
            if (mainContainer) {
                outputObserver.observe(mainContainer, { childList: true, subtree: true });
            }
            
            console.log("🛠️ Code tracking setup complete");
            return true;
        } catch (e) {
            console.error("🛠️ Error setting up code tracking:", e);
            return false;
        }
    }
    
    function fixApplyButton() {
        try {
            // Find the button
            const applyBtn = document.querySelector('#integrate-btn');
            if (!applyBtn) return false;
            
            // Replace it with a clean version
            const newBtn = applyBtn.cloneNode(true);
            applyBtn.parentNode.replaceChild(newBtn, applyBtn);
            
            // Simple implementation
            newBtn.addEventListener('click', function() {
                try {
                    // Visual feedback
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => this.style.transform = 'scale(1)', 200);
                    
                    // Get editors
                    const outputCM = document.querySelector('#output-container .CodeMirror');
                    const originalCM = document.querySelector('#original-code').nextElementSibling;
                    
                    if (!outputCM || !outputCM.CodeMirror || !originalCM || !originalCM.CodeMirror) {
                        alert('Could not find code editors');
                        return;
                    }
                    
                    // Get and apply code
                    const modifiedCode = outputCM.CodeMirror.getValue();
                    originalCM.CodeMirror.setValue(modifiedCode);
                    
                    // Update context after applying changes
                    updateCodeContext();
                    
                    alert('Changes applied successfully!');
                } catch (err) {
                    console.error('Apply button error:', err);
                    alert('Error: ' + err.message);
                }
            });
            
            console.log("🛠️ Apply button fixed (simple version)");
            return true;
        } catch (e) {
            console.error("🛠️ Error fixing button:", e);
            return false;
        }
    }
    
    function fixChatSendButton() {
        try {
            console.log("🛠️ Attempting to fix chat send button");
            
            // Directly target any relevant buttons and add ultra-reliable handlers
            setTimeout(function() {
                const buttons = [
                    document.querySelector('#send-chat-btn'),
                    document.querySelector('#send-chat-btn-new'),
                    ...Array.from(document.querySelectorAll('button')).filter(b => 
                        b.querySelector('.fa-paper-plane') || 
                        b.innerHTML.includes('paper-plane')
                    )
                ].filter(Boolean);
                
                buttons.forEach(btn => {
                    // Clone the button to remove all event listeners
                    const newBtn = btn.cloneNode(true);
                    if (btn.parentNode) {
                        btn.parentNode.replaceChild(newBtn, btn);
                    }
                    
                    // Add fresh handlers
                    newBtn.onclick = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("🛠️ Fixed button clicked:", this.id);
                        
                        // Visual feedback
                        this.classList.add('clicked-effect');
                        setTimeout(() => this.classList.remove('clicked-effect'), 200);
                        
                        // Update code context before sending
                        updateCodeContext();
                        
                        if (typeof window.sendChatMessage === 'function') {
                            window.sendChatMessage();
                        } else {
                            emergencySendMessage();
                        }
                        
                        return false; // Prevent default and bubbling
                    };
                    
                    console.log("🛠️ Fixed button:", newBtn.id || "unnamed");
                });
            }, 1000);  // Delay to ensure all other scripts have run
            
            console.log("🛠️ Chat send button fixed");
            return true;
        } catch (e) {
            console.error("🛠️ Error fixing chat send button:", e);
            return false;
        }
    }
    
    // New function to setup before/after toggle view
    function setupBeforeAfterToggle() {
        try {
            console.log("🛠️ Setting up before/after toggle...");
            
            // Find or create toggle button
            let toggleButton = document.querySelector('#before-after-toggle');
            if (!toggleButton) {
                const outputHeader = document.querySelector('#output-container .container-header');
                if (!outputHeader) {
                    console.error("🛠️ Cannot find output header to add toggle button");
                    return false;
                }
                
                // Create toggle button
                toggleButton = document.createElement('button');
                toggleButton.id = 'before-after-toggle';
                toggleButton.className = 'action-button mode-toggle';
                toggleButton.innerHTML = `
                    <span class="before-text">Before</span>
                    <span class="toggle-slider">
                        <span class="toggle-knob"></span>
                    </span>
                    <span class="after-text">After</span>
                `;
                
                // Create diff button
                const diffButton = document.createElement('button');
                diffButton.id = 'diff-highlight-toggle';
                diffButton.className = 'action-button diff-toggle';
                diffButton.textContent = 'Highlight Diff';
                
                // Add buttons to header
                outputHeader.appendChild(toggleButton);
                outputHeader.appendChild(diffButton);
                
                // Add styles
                const style = document.createElement('style');
                style.textContent = `
                    .action-button {
                        margin-left: 10px;
                        border: 1px solid #ccc;
                        background: #f5f5f5;
                        border-radius: 4px;
                        padding: 5px 10px;
                        cursor: pointer;
                        font-size: 12px;
                        transition: all 0.2s;
                    }
                    .action-button:hover {
                        background: #e5e5e5;
                    }
                    .mode-toggle {
                        display: flex;
                        align-items: center;
                        padding: 5px 8px;
                    }
                    .toggle-slider {
                        position: relative;
                        width: 36px;
                        height: 18px;
                        background: #ccc;
                        border-radius: 10px;
                        margin: 0 8px;
                        transition: all 0.3s;
                    }
                    .toggle-knob {
                        position: absolute;
                        top: 2px;
                        left: 2px;
                        width: 14px;
                        height: 14px;
                        background: white;
                        border-radius: 50%;
                        transition: all 0.3s;
                    }
                    .mode-after .toggle-slider {
                        background: #4CAF50;
                    }
                    .mode-after .toggle-knob {
                        left: 20px;
                    }
                    .before-text, .after-text {
                        font-weight: 500;
                        opacity: 0.6;
                        transition: all 0.3s;
                    }
                    .mode-after .after-text, .mode-before .before-text {
                        opacity: 1;
                    }
                    .diff-line {
                        display: block;
                        width: 100%;
                    }
                    .diff-added {
                        background-color: rgba(0, 255, 0, 0.1);
                    }
                    .diff-removed {
                        background-color: rgba(255, 0, 0, 0.1);
                    }
                    .diff-modified {
                        background-color: rgba(255, 255, 0, 0.1);
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Set initial state
            toggleButton.classList.toggle('mode-after', window.codeContext.beforeAfterMode === 'after');
            toggleButton.classList.toggle('mode-before', window.codeContext.beforeAfterMode === 'before');
            
            // Toggle action
            toggleButton.addEventListener('click', function() {
                window.codeContext.beforeAfterMode = window.codeContext.beforeAfterMode === 'after' ? 'before' : 'after';
                toggleButton.classList.toggle('mode-after', window.codeContext.beforeAfterMode === 'after');
                toggleButton.classList.toggle('mode-before', window.codeContext.beforeAfterMode === 'before');
                
                updateOutputView();
            });
            
            // Diff highlight toggle
            const diffButton = document.querySelector('#diff-highlight-toggle');
            if (diffButton) {
                diffButton.addEventListener('click', function() {
                    const isDiffMode = diffButton.classList.toggle('active');
                    if (isDiffMode) {
                        highlightDifferences();
                    } else {
                        updateOutputView();
                    }
                });
            }
            
            console.log("🛠️ Before/after toggle setup complete");
            return true;
        } catch (e) {
            console.error("🛠️ Error setting up before/after toggle:", e);
            return false;
        }
    }
    
    function updateOutputView() {
        try {
            const outputContainer = document.querySelector('#output-container');
            if (!outputContainer) return false;
            
            const outputEditor = outputContainer.querySelector('.CodeMirror');
            if (!outputEditor || !outputEditor.CodeMirror) return false;
            
            if (window.codeContext.beforeAfterMode === 'before') {
                // Show original code
                outputEditor.CodeMirror.setValue(window.codeContext.originalCode || '');
            } else {
                // Show modified code
                outputEditor.CodeMirror.setValue(window.codeContext.modifiedCode || '');
            }
            
            return true;
        } catch (e) {
            console.error("🛠️ Error updating output view:", e);
            return false;
        }
    }
    
    function highlightDifferences() {
        try {
            if (!window.codeContext || !window.codeContext.originalCode || !window.codeContext.modifiedCode) {
                console.warn("Cannot highlight differences: missing code context");
                return;
            }

            // Save the current content of the output editor
            const outputElement = document.querySelector('.output-editor .cm-content');
            if (!outputElement) {
                console.warn("Cannot find output editor element");
                return;
            }
            
            // If a diff display already exists, just remove it
            const existingDiffDisplay = document.querySelector('.diff-display');
            if (existingDiffDisplay) {
                existingDiffDisplay.remove();
                const diffToggle = document.querySelector('.diff-highlight-toggle');
                if (diffToggle) {
                    diffToggle.classList.remove('active');
                    diffToggle.textContent = 'Show Differences';
                }
                return;
            }
            
            // Create a container for the diff display if it doesn't exist
            let diffContainer = document.querySelector('.diff-container');
            if (!diffContainer) {
                diffContainer = document.createElement('div');
                diffContainer.className = 'diff-container';
                document.querySelector('.output-editor').appendChild(diffContainer);
            }
            
            // Create a div for the diff display
            const diffDisplay = document.createElement('div');
            diffDisplay.className = 'diff-display';
            diffDisplay.style.position = 'absolute';
            diffDisplay.style.top = '0';
            diffDisplay.style.left = '0';
            diffDisplay.style.right = '0';
            diffDisplay.style.bottom = '0';
            diffDisplay.style.backgroundColor = 'var(--background-color, white)';
            diffDisplay.style.zIndex = '10';
            diffDisplay.style.overflow = 'auto';
            diffDisplay.style.padding = '8px';
            
            // Add a header with close button
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.style.marginBottom = '10px';
            
            const title = document.createElement('div');
            title.textContent = 'Code Differences';
            title.style.fontWeight = 'bold';
            
            const closeButton = document.createElement('button');
            closeButton.textContent = '×';
            closeButton.style.border = 'none';
            closeButton.style.background = 'none';
            closeButton.style.fontSize = '20px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.padding = '0 5px';
            closeButton.title = 'Close diff view';
            
            header.appendChild(title);
            header.appendChild(closeButton);
            diffDisplay.appendChild(header);
            
            // Compute and display the diff
            const original = window.codeContext.originalCode;
            const modified = window.codeContext.modifiedCode;
            
            // Use diff-match-patch library if available, otherwise use a simple comparison
            if (window.diff_match_patch) {
                const dmp = new window.diff_match_patch();
                const diffs = dmp.diff_main(original, modified);
                dmp.diff_cleanupSemantic(diffs);
                
                const diffContent = document.createElement('div');
                
                diffs.forEach(function(part) {
                    const diffType = part[0]; // -1 for deletion, 0 for common, 1 for addition
                    const text = part[1];
                    
                    if (text.trim()) {
                        const lines = text.split('\n');
                        
                        lines.forEach(function(line, i) {
                            if (line.trim() || i < lines.length - 1) { // Show empty lines except the last one if it's empty
                                const span = document.createElement('span');
                                span.className = 'diff-line';
                                span.textContent = line;
                                
                                if (diffType === -1) {
                                    span.classList.add('diff-removed');
                                } else if (diffType === 1) {
                                    span.classList.add('diff-added');
                                }
                                
                                diffContent.appendChild(span);
                                if (i < lines.length - 1) {
                                    diffContent.appendChild(document.createElement('br'));
                                }
                            }
                        });
                    }
                });
                
                diffDisplay.appendChild(diffContent);
            } else {
                // Simple fallback if diff-match-patch is not available
                const originalLines = original.split('\n');
                const modifiedLines = modified.split('\n');
                
                const diffContent = document.createElement('div');
                
                // Simple line-by-line comparison
                const maxLines = Math.max(originalLines.length, modifiedLines.length);
                for (let i = 0; i < maxLines; i++) {
                    const originalLine = i < originalLines.length ? originalLines[i] : '';
                    const modifiedLine = i < modifiedLines.length ? modifiedLines[i] : '';
                    
                    if (originalLine !== modifiedLine) {
                        if (originalLine) {
                            const removedLine = document.createElement('span');
                            removedLine.className = 'diff-line diff-removed';
                            removedLine.textContent = originalLine;
                            diffContent.appendChild(removedLine);
                            diffContent.appendChild(document.createElement('br'));
                        }
                        
                        if (modifiedLine) {
                            const addedLine = document.createElement('span');
                            addedLine.className = 'diff-line diff-added';
                            addedLine.textContent = modifiedLine;
                            diffContent.appendChild(addedLine);
                            diffContent.appendChild(document.createElement('br'));
                        }
                    } else {
                        const commonLine = document.createElement('span');
                        commonLine.className = 'diff-line';
                        commonLine.textContent = originalLine;
                        diffContent.appendChild(commonLine);
                        diffContent.appendChild(document.createElement('br'));
                    }
                }
                
                diffDisplay.appendChild(diffContent);
            }
            
            // Add the diff display to the container
            diffContainer.appendChild(diffDisplay);
            
            // Update the toggle button
            const diffToggle = document.querySelector('.diff-highlight-toggle');
            if (diffToggle) {
                diffToggle.classList.add('active');
                diffToggle.textContent = 'Hide Differences';
            }
            
            // Set up the close button event
            closeButton.addEventListener('click', function() {
                diffDisplay.remove();
                const diffToggle = document.querySelector('.diff-highlight-toggle');
                if (diffToggle) {
                    diffToggle.classList.remove('active');
                    diffToggle.textContent = 'Show Differences';
                }
            });
        } catch (error) {
            console.error("Error highlighting differences:", error);
        }
    }
    
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Document ready
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize global context
        if (!window.codeContext) {
            window.codeContext = {
                originalCode: '',
                modifiedCode: '',
                beforeAfterMode: 'after'  // Default to 'after'
            };
        }
        
        // Add CSS for diff highlighting
        const style = document.createElement('style');
        style.textContent = `
            .diff-line {
                display: block;
                padding: 0 4px;
                min-height: 1.2em;
            }
            .diff-added {
                background-color: rgba(0, 255, 0, 0.1);
                border-left: 3px solid #4caf50;
            }
            .diff-removed {
                background-color: rgba(255, 0, 0, 0.1);
                border-left: 3px solid #f44336;
            }
            .before-after-toggle, .diff-highlight-toggle {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                text-decoration: none;
                text-align: center;
                cursor: pointer;
                outline: none;
                font-size: 0.8rem;
                border-radius: 4px;
                padding: 4px 8px;
                margin-right: 8px;
                transition: all 0.2s;
                user-select: none;
            }
            .diff-display .diff-line:hover {
                background-color: rgba(128, 128, 128, 0.1);
            }
            .diff-display {
                font-size: 14px;
                line-height: 1.5;
            }
        `;
        document.head.appendChild(style);
        
        // Try to set up the toggle immediately
        setupBeforeAfterToggle();
        
        // Set up a MutationObserver to detect when new nodes are added to the output container
        const outputContainer = document.querySelector('#output-container');
        if (outputContainer) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length > 0) {
                        setupBeforeAfterToggle();
                    }
                });
            });
            
            observer.observe(outputContainer, { childList: true, subtree: true });
        }
        
        // Initialize MutationObserver to detect new output containers
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    const outputContainer = document.querySelector('#output-container');
                    if (outputContainer && !outputContainer.querySelector('.diff-highlight-toggle')) {
                        setupDiffToggle(outputContainer);
                    }
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Setup diff toggle for existing output container
        const existingOutputContainer = document.querySelector('#output-container');
        if (existingOutputContainer) {
            setupDiffToggle(existingOutputContainer);
        }
        
        // Function to set up the diff toggle button
        function setupDiffToggle(container) {
            // Create toolbar if it doesn't exist
            let toolbar = container.querySelector('.output-toolbar');
            if (!toolbar) {
                toolbar = document.createElement('div');
                toolbar.className = 'output-toolbar';
                toolbar.style.display = 'flex';
                toolbar.style.justifyContent = 'flex-end';
                toolbar.style.padding = '5px';
                toolbar.style.borderBottom = '1px solid var(--border-color, #ddd)';
                container.prepend(toolbar);
            }
            
            // Add the diff toggle button
            const diffToggle = document.createElement('button');
            diffToggle.className = 'diff-highlight-toggle';
            diffToggle.textContent = 'Show Differences';
            diffToggle.title = 'Toggle diff highlighting';
            toolbar.appendChild(diffToggle);
            
            // Add event listener for toggle button
            diffToggle.addEventListener('click', function() {
                toggleDiffHighlight();
            });
        }
        
        // Function to toggle diff highlighting
        function toggleDiffHighlight() {
            const diffDisplay = document.querySelector('.diff-display');
            if (diffDisplay) {
                // If diff is already displayed, hide it
                diffDisplay.remove();
                const diffToggle = document.querySelector('.diff-highlight-toggle');
                if (diffToggle) {
                    diffToggle.classList.remove('active');
                    diffToggle.textContent = 'Show Differences';
                }
            } else {
                // Show the diff
                highlightDifferences();
            }
        }
    });
    
    // Make functions available globally
    window.fixApplyButton = fixApplyButton;
    window.fixChatSendButton = fixChatSendButton;
    window.emergencySendMessage = emergencySendMessage;
    window.updateCodeContext = updateCodeContext;
    window.setupBeforeAfterToggle = setupBeforeAfterToggle;
})();

// Remove the duplicated functions and call the original implementations instead
$(document).ready(function () {
    setupBeforeAfterToggle();
    updateCodeContext();
    fixChatSendButton();
}); 
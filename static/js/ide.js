document.addEventListener('DOMContentLoaded', function() {
    // Navigation functionality
    const navItems = document.querySelectorAll('.nav-item');
    const contentPanels = document.querySelectorAll('.content-panel');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked nav item
            this.classList.add('active');
            
            // Hide all content panels
            contentPanels.forEach(panel => panel.classList.remove('active'));
            
            // Show the corresponding content panel
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
    
    // Line Numbers in Code Editor
    const codeInput = document.getElementById('code-input');
    const lineNumbers = document.querySelector('.line-numbers');
    
    function updateLineNumbers() {
        const numberOfLines = codeInput.value.split('\n').length;
        lineNumbers.innerHTML = Array(numberOfLines)
            .fill(0)
            .map((_, i) => `<div>${i + 1}</div>`)
            .join('');
    }
    
    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', function() {
        lineNumbers.scrollTop = codeInput.scrollTop;
    });
    
    // Initial line numbers
    updateLineNumbers();
    
    // Output tabs functionality
    const outputTabs = document.querySelectorAll('.tab');
    const outputContents = document.querySelectorAll('.output-content');
    
    outputTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            outputTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all content sections
            outputContents.forEach(content => content.style.display = 'none');
            
            // Show the corresponding content section
            const targetContent = document.querySelector(`.${this.getAttribute('data-target')}`);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });
    
    // Run code functionality
    const promptForm = document.getElementById('prompt-form');
    const loadingOverlay = document.querySelector('.loading-overlay');
    const codeOutput = document.querySelector('.code-output');
    const explanationContent = document.querySelector('.explanation-content');
    
    promptForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userPrompt = document.getElementById('user-prompt').value.trim();
        if (!userPrompt) return;
        
        // Show loading overlay
        loadingOverlay.classList.add('active');
        
        // Simulate processing (replace with actual API call)
        setTimeout(() => {
            const code = codeInput.value;
            
            try {
                // For demo purposes, we're using eval. In production, use a safer method.
                const result = eval(`(function() { ${code} ; return executeCode('${userPrompt.replace(/'/g, "\\'")}'); })()`);
                
                codeOutput.textContent = JSON.stringify(result, null, 2);
                explanationContent.innerHTML = `<p>Your code ran successfully with the prompt: "${userPrompt}"</p>
                <p>The function returned a ${typeof result} value.</p>`;
                
                // Activate the output tab
                document.querySelector('.tab[data-target="code-output"]').click();
            } catch (error) {
                codeOutput.textContent = error.toString();
                explanationContent.innerHTML = `<p>Your code generated an error:</p><p>${error.message}</p>
                <p>Check your syntax and try again.</p>`;
                
                // Activate the explanation tab
                document.querySelector('.tab[data-target="explanation-content"]').click();
            }
            
            // Hide loading overlay
            loadingOverlay.classList.remove('active');
        }, 1000);
    });
    
    // Chat functionality
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.querySelector('.chat-messages');
    
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message
        appendMessage(message, 'user');
        chatInput.value = '';
        
        // Simulate AI response (replace with actual API call)
        setTimeout(() => {
            // Simple response for demonstration
            const responses = [
                "I can help you with that code. What specific issue are you facing?",
                "Let me analyze that. Have you tried checking the documentation?",
                "That's an interesting approach. Consider using a different method for better performance.",
                "I'd recommend restructuring this part to improve readability.",
                "The error might be related to your variable scope. Try declaring it outside the function."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            appendMessage(randomResponse, 'assistant');
        }, 1000);
    });
    
    function appendMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `message-${sender}`);
        messageDiv.textContent = content;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Settings functionality
    const darkThemeToggle = document.getElementById('dark-theme-toggle');
    
    darkThemeToggle.addEventListener('change', function() {
        document.body.classList.toggle('dark-theme', this.checked);
        localStorage.setItem('dark-theme', this.checked ? 'enabled' : 'disabled');
    });
    
    // Check for saved theme preference
    if (localStorage.getItem('dark-theme') === 'enabled') {
        darkThemeToggle.checked = true;
        document.body.classList.add('dark-theme');
    }
    
    // Font size settings
    const fontSizeOptions = document.querySelectorAll('input[name="font-size"]');
    
    fontSizeOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (this.checked) {
                const fontSize = this.value;
                codeInput.style.fontSize = `${fontSize}px`;
                localStorage.setItem('font-size', fontSize);
            }
        });
    });
    
    // Check for saved font size preference
    const savedFontSize = localStorage.getItem('font-size');
    if (savedFontSize) {
        document.querySelector(`input[value="${savedFontSize}"]`).checked = true;
        codeInput.style.fontSize = `${savedFontSize}px`;
    }
    
    // Other settings toggles
    const settingToggles = document.querySelectorAll('.setting-toggle');
    
    settingToggles.forEach(toggle => {
        const settingName = toggle.id.replace('-toggle', '');
        
        // Check for saved setting
        if (localStorage.getItem(settingName) === 'enabled') {
            toggle.checked = true;
        }
        
        toggle.addEventListener('change', function() {
            localStorage.setItem(settingName, this.checked ? 'enabled' : 'disabled');
            
            // Add functionality for each setting as needed
            switch (settingName) {
                case 'auto-save':
                    // Implement auto-save functionality
                    break;
                case 'line-numbers':
                    document.querySelector('.line-numbers').style.display = this.checked ? 'block' : 'none';
                    break;
                case 'auto-complete':
                    // Implement auto-complete functionality
                    break;
                case 'code-suggestions':
                    // Implement code suggestions functionality
                    break;
                case 'error-detection':
                    // Implement error detection functionality
                    break;
            }
        });
    });
    
    // File tab functionality
    const newTabButton = document.querySelector('.new-tab');
    const fileTabs = document.querySelector('.file-tabs');
    let tabCounter = 1;
    
    // Start with one tab
    createNewTab();
    
    newTabButton.addEventListener('click', createNewTab);
    
    function createNewTab() {
        // Create new tab
        const tabId = `tab-${tabCounter++}`;
        const tab = document.createElement('div');
        tab.classList.add('file-tab');
        tab.setAttribute('data-tab-id', tabId);
        tab.innerHTML = `Untitled-${tabCounter-1}.js <button class="close-tab">&times;</button>`;
        
        // Insert before the new tab button
        fileTabs.insertBefore(tab, newTabButton);
        
        // Set as active tab
        activateTab(tab);
        
        // Add close functionality
        tab.querySelector('.close-tab').addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Don't close if it's the last tab
            const tabs = document.querySelectorAll('.file-tab');
            if (tabs.length <= 1) return;
            
            // If closing active tab, activate another tab
            if (tab.classList.contains('active')) {
                const nextTab = tab.nextElementSibling === newTabButton ? 
                    tab.previousElementSibling : tab.nextElementSibling;
                activateTab(nextTab);
            }
            
            // Remove the tab
            tab.remove();
        });
        
        // Add click handler to activate tab
        tab.addEventListener('click', function() {
            activateTab(this);
        });
    }
    
    function activateTab(tab) {
        // Deactivate all tabs
        document.querySelectorAll('.file-tab').forEach(t => t.classList.remove('active'));
        
        // Activate selected tab
        tab.classList.add('active');
        
        // In a real implementation, we would load the corresponding file content here
        // For demo purposes, we'll just clear the editor
        if (!tab.getAttribute('data-has-content')) {
            codeInput.value = '// Write your code here\n\nfunction executeCode(prompt) {\n    // This function will be called when you run your code\n    // You can use the prompt parameter to customize behavior\n    return {\n        result: "Success!",\n        prompt: prompt\n    };\n}';
            tab.setAttribute('data-has-content', 'true');
            updateLineNumbers();
        }
    }
}); 
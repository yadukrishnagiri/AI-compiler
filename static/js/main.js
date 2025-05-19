document.addEventListener('DOMContentLoaded', () => {
    initUI();
    setupEventListeners();
    setupCodeEditor();
});

// Initialize UI elements
function initUI() {
    // Set first nav item as active
    document.querySelector('.nav-item').classList.add('active');
    
    // Show code panel by default
    document.getElementById('code-panel').classList.add('active');
    
    // Set output tabs
    document.getElementById('output-tab').classList.add('active');
    document.getElementById('output-content').style.display = 'block';
    
    // Generate line numbers
    updateLineNumbers();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked nav item
            item.classList.add('active');
            
            // Show corresponding panel
            const panels = document.querySelectorAll('.content-panel');
            panels.forEach(panel => panel.classList.remove('active'));
            
            const targetPanel = item.getAttribute('data-target');
            document.getElementById(targetPanel).classList.add('active');
        });
    });
    
    // Output tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const contents = document.querySelectorAll('.output-content');
            contents.forEach(content => content.style.display = 'none');
            
            const targetContent = tab.getAttribute('data-target');
            document.getElementById(targetContent).style.display = 'block';
        });
    });
    
    // Run code button
    const runButton = document.querySelector('.run-button');
    runButton.addEventListener('click', () => {
        executeCode();
    });
    
    // User prompt form
    const promptForm = document.getElementById('prompt-form');
    promptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        executeCode();
    });
    
    // Chat form
    const chatForm = document.getElementById('chat-form');
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendChatMessage();
    });
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme');
    });
    
    // File tabs
    setupFileTabs();
}

// Code editor setup
function setupCodeEditor() {
    const codeInput = document.getElementById('code-input');
    
    // Tab key handling
    codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeInput.selectionStart;
            const end = codeInput.selectionEnd;
            
            // Insert tab at cursor position
            codeInput.value = codeInput.value.substring(0, start) + '    ' + codeInput.value.substring(end);
            
            // Move cursor after tab
            codeInput.selectionStart = codeInput.selectionEnd = start + 4;
        }
    });
    
    // Update line numbers when typing
    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', () => {
        document.querySelector('.line-numbers').scrollTop = codeInput.scrollTop;
    });
}

// Update line numbers in editor
function updateLineNumbers() {
    const codeInput = document.getElementById('code-input');
    const lineNumbers = document.querySelector('.line-numbers');
    const lines = codeInput.value.split('\n');
    
    lineNumbers.innerHTML = '';
    for (let i = 0; i < lines.length; i++) {
        lineNumbers.innerHTML += `<div>${i + 1}</div>`;
    }
    
    // Add extra line for new line at end
    if (codeInput.value.endsWith('\n') || lines.length === 0) {
        lineNumbers.innerHTML += `<div>${lines.length + 1}</div>`;
    }
}

// Execute code
function executeCode() {
    const codeInput = document.getElementById('code-input');
    const prompt = document.getElementById('user-prompt').value;
    const outputContent = document.getElementById('output-content');
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    // Show loading
    loadingOverlay.style.display = 'flex';
    
    // Simulate code execution (in a real app, this would call an API)
    setTimeout(() => {
        // Hide loading
        loadingOverlay.style.display = 'none';
        
        // Update output
        outputContent.innerHTML = `<div class="code-output">// Code execution result for: ${prompt}\nconsole.log("Running your code...");\n\n> Hello World! Your code is executing.</div>`;
        
        // Update explanation
        document.getElementById('explanation-content').innerHTML = `
            <p>This is an explanation of your code execution:</p>
            <ul>
                <li>Your code was compiled successfully</li>
                <li>The execution took 0.5s</li>
                <li>No errors were found</li>
            </ul>
            <p>The output "Hello World!" was produced by your code.</p>
        `;
        
        // Clear prompt
        document.getElementById('user-prompt').value = '';
    }, 1500);
}

// Send chat message
function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (message) {
        const chatMessages = document.querySelector('.chat-messages');
        
        // Add user message
        chatMessages.innerHTML += `
            <div class="message message-user">
                ${message}
            </div>
        `;
        
        // Clear input
        chatInput.value = '';
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simulate AI response (in a real app, this would call an API)
        setTimeout(() => {
            // Add AI response
            chatMessages.innerHTML += `
                <div class="message message-assistant">
                    I'll help you with that. What specific aspect of coding are you struggling with?
                </div>
            `;
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }
}

// Setup file tabs
function setupFileTabs() {
    const fileTabs = document.querySelectorAll('.file-tab');
    fileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            fileTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
        });
        
        const closeBtn = tab.querySelector('.close-tab');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Prevent closing the last tab
                if (fileTabs.length > 1) {
                    tab.remove();
                    // Activate another tab if the closed one was active
                    if (tab.classList.contains('active')) {
                        document.querySelector('.file-tab').classList.add('active');
                    }
                }
            });
        }
    });
    
    // New tab button
    const newTabBtn = document.querySelector('.new-tab');
    newTabBtn.addEventListener('click', () => {
        const fileTabsContainer = document.querySelector('.file-tabs');
        const newTab = document.createElement('div');
        newTab.className = 'file-tab';
        newTab.innerHTML = `
            <i class="fas fa-code"></i>
            New File
            <span class="close-tab">×</span>
        `;
        
        // Insert before the new tab button
        fileTabsContainer.insertBefore(newTab, newTabBtn);
        
        // Set up new tab events
        setupFileTabs();
        
        // Activate new tab
        fileTabs.forEach(t => t.classList.remove('active'));
        newTab.classList.add('active');
    });
} 
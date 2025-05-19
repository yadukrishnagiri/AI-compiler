// Modern IDE JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeUI();
    addEventListeners();
    setActivePanel('code-panel');
});

function initializeUI() {
    // Set up line numbers in code editor
    const codeInput = document.getElementById('code-input');
    const lineNumbers = document.querySelector('.line-numbers');
    updateLineNumbers(codeInput, lineNumbers);
    
    // Check for saved dark mode preference
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        document.getElementById('dark-mode-toggle').checked = true;
    }
}

function addEventListeners() {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            setActivePanel(target);
            setActiveNavItem(this);
        });
    });
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', this.checked);
    });
    
    // Code editor events
    const codeInput = document.getElementById('code-input');
    const lineNumbers = document.querySelector('.line-numbers');
    
    codeInput.addEventListener('input', function() {
        updateLineNumbers(this, lineNumbers);
    });
    
    codeInput.addEventListener('scroll', function() {
        lineNumbers.scrollTop = this.scrollTop;
    });
    
    codeInput.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
            updateLineNumbers(this, lineNumbers);
        }
    });
    
    // Run button
    const runButton = document.querySelector('.run-button');
    runButton.addEventListener('click', function() {
        showLoadingOverlay();
        
        // Simulate processing
        setTimeout(() => {
            hideLoadingOverlay();
            showOutput('Code executed successfully!');
        }, 1500);
    });
    
    // Chat input
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.querySelector('.chat-input-container button');
    
    sendButton.addEventListener('click', function() {
        sendChatMessage();
    });
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
    
    // File explorer
    const folders = document.querySelectorAll('.folder-name');
    folders.forEach(folder => {
        folder.addEventListener('click', function() {
            this.parentElement.classList.toggle('open');
            const folderContents = this.nextElementSibling;
            if (folderContents.style.display === 'none' || !folderContents.style.display) {
                folderContents.style.display = 'block';
                this.querySelector('i').classList.replace('fa-folder', 'fa-folder-open');
            } else {
                folderContents.style.display = 'none';
                this.querySelector('i').classList.replace('fa-folder-open', 'fa-folder');
            }
        });
    });
    
    const files = document.querySelectorAll('.file');
    files.forEach(file => {
        file.addEventListener('click', function() {
            const filename = this.getAttribute('data-filename');
            openFile(filename);
            
            // Set active file
            files.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // File tabs
    const fileTabs = document.querySelectorAll('.file-tab');
    fileTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const filename = this.getAttribute('data-filename');
            if (filename) {
                openFile(filename);
                setActiveTab(this);
            }
        });
        
        const closeBtn = tab.querySelector('.close-tab');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                closeFile(tab);
            });
        }
    });
    
    // New tab button
    const newTabBtn = document.querySelector('.new-tab');
    if (newTabBtn) {
        newTabBtn.addEventListener('click', function() {
            createNewFile();
        });
    }
    
    // Settings panel event listeners
    const settingsSelects = document.querySelectorAll('#settings-panel select');
    settingsSelects.forEach(select => {
        select.addEventListener('change', function() {
            applySettings(this);
        });
    });
}

function updateLineNumbers(codeInput, lineNumbersContainer) {
    const lineCount = codeInput.value.split('\n').length;
    let lineNumbersHTML = '';
    
    for (let i = 1; i <= lineCount; i++) {
        lineNumbersHTML += `<div>${i}</div>`;
    }
    
    lineNumbersContainer.innerHTML = lineNumbersHTML;
}

function setActivePanel(panelId) {
    const panels = document.querySelectorAll('.content-panel');
    panels.forEach(panel => {
        panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

function setActiveNavItem(item) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(navItem => {
        navItem.classList.remove('active');
    });
    
    item.classList.add('active');
}

function setActiveTab(tab) {
    const fileTabs = document.querySelectorAll('.file-tab');
    fileTabs.forEach(fileTab => {
        fileTab.classList.remove('active');
    });
    
    tab.classList.add('active');
}

function openFile(filename) {
    // In a real app, this would load the file content
    // For demo purposes, we'll just update the editor
    const codeInput = document.getElementById('code-input');
    const lineNumbers = document.querySelector('.line-numbers');
    
    // Simulate loading file content
    let content = '';
    if (filename === 'index.html') {
        content = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n</body>\n</html>';
    } else if (filename === 'style.css') {
        content = 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 0;\n}\n\nh1 {\n    color: #333;\n}';
    } else if (filename === 'main.js') {
        content = 'document.addEventListener("DOMContentLoaded", function() {\n    console.log("Document ready!");\n});';
    }
    
    codeInput.value = content;
    updateLineNumbers(codeInput, lineNumbers);
    
    // Check if tab already exists, if not create it
    let tabExists = false;
    const fileTabs = document.querySelectorAll('.file-tab');
    fileTabs.forEach(tab => {
        if (tab.getAttribute('data-filename') === filename) {
            tabExists = true;
            setActiveTab(tab);
        }
    });
    
    if (!tabExists) {
        createNewTab(filename);
    }
}

function createNewTab(filename) {
    const fileTabsContainer = document.querySelector('.file-tabs');
    const newTabButton = document.querySelector('.new-tab');
    
    const newTab = document.createElement('div');
    newTab.className = 'file-tab';
    newTab.setAttribute('data-filename', filename);
    
    // Determine icon based on file extension
    let iconClass = 'fa-file';
    if (filename.endsWith('.html')) {
        iconClass = 'fa-html5';
    } else if (filename.endsWith('.css')) {
        iconClass = 'fa-css3-alt';
    } else if (filename.endsWith('.js')) {
        iconClass = 'fa-js';
    }
    
    newTab.innerHTML = `
        <i class="fab ${iconClass}"></i>
        <span>${filename}</span>
        <i class="fas fa-times close-tab"></i>
    `;
    
    // Insert before the new tab button
    fileTabsContainer.insertBefore(newTab, newTabButton);
    
    // Add event listeners
    newTab.addEventListener('click', function() {
        openFile(filename);
        setActiveTab(this);
    });
    
    const closeBtn = newTab.querySelector('.close-tab');
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeFile(newTab);
    });
    
    // Set as active
    setActiveTab(newTab);
}

function closeFile(tab) {
    // Remove tab
    tab.remove();
    
    // If no tabs left, clear editor
    const remainingTabs = document.querySelectorAll('.file-tab');
    if (remainingTabs.length === 0) {
        const codeInput = document.getElementById('code-input');
        codeInput.value = '';
        updateLineNumbers(codeInput, document.querySelector('.line-numbers'));
    } else {
        // Set the first remaining tab as active
        setActiveTab(remainingTabs[0]);
        openFile(remainingTabs[0].getAttribute('data-filename'));
    }
}

function createNewFile() {
    const filename = prompt('Enter filename:');
    if (filename) {
        openFile(filename);
    }
}

function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const messagesContainer = document.querySelector('.chat-messages');
    const message = chatInput.value.trim();
    
    if (message) {
        // Add user message
        const userMessageElement = document.createElement('div');
        userMessageElement.className = 'message message-user';
        userMessageElement.textContent = message;
        messagesContainer.appendChild(userMessageElement);
        
        // Clear input
        chatInput.value = '';
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Simulate AI response
        showLoadingOverlay();
        setTimeout(() => {
            hideLoadingOverlay();
            
            // Add AI response
            const aiMessageElement = document.createElement('div');
            aiMessageElement.className = 'message message-assistant';
            aiMessageElement.textContent = 'This is a sample response. In a real application, this would be generated by an AI model based on your query.';
            messagesContainer.appendChild(aiMessageElement);
            
            // Scroll to bottom again
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1500);
    }
}

function showOutput(message) {
    const outputContent = document.querySelector('.output-content');
    outputContent.textContent = message;
}

function showLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    overlay.classList.add('active');
}

function hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    overlay.classList.remove('active');
}

function applySettings(settingElement) {
    const settingId = settingElement.id;
    const value = settingElement.value;
    
    switch(settingId) {
        case 'font-size':
            document.getElementById('code-input').style.fontSize = value + 'px';
            break;
        case 'tab-size':
            document.getElementById('code-input').style.tabSize = value;
            break;
        case 'auto-save':
            // In a real app, implement auto-save functionality
            console.log('Auto-save setting changed to:', value);
            break;
        case 'ai-model':
            // In a real app, change AI model
            console.log('AI model changed to:', value);
            break;
        case 'response-length':
            // In a real app, change response length
            console.log('Response length changed to:', value);
            break;
    }
} 
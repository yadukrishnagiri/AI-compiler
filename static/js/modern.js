document.addEventListener('DOMContentLoaded', function() {
    // Notification functions for AI service fallbacks
    window.showBackupAINotification = function(backupName) {
        const notificationArea = document.querySelector('.chat-messages') || document.getElementById('chat-messages');
        if (!notificationArea) return;
        
        const notification = document.createElement('div');
        notification.className = 'ai-notification flex items-center p-2 mb-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md text-sm';
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <span>Using backup ${backupName} AI model as Gemini service is currently unavailable.</span>
        `;
        
        notificationArea.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    };
    
    window.showGroqFallbackNotification = function() {
        const notificationArea = document.querySelector('.chat-messages') || document.getElementById('chat-messages');
        if (!notificationArea) return;
        
        const notification = document.createElement('div');
        notification.className = 'ai-notification flex items-center p-2 mb-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm';
        notification.innerHTML = `
            <i class="fas fa-info-circle mr-2"></i>
            <span>Using Groq AI as a fallback since Gemini service is unavailable.</span>
        `;
        
        notificationArea.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    };
    
    window.showAllServicesFailedNotification = function() {
        const notificationArea = document.querySelector('.chat-messages') || document.getElementById('chat-messages');
        if (!notificationArea) return;
        
        const notification = document.createElement('div');
        notification.className = 'ai-notification flex items-center p-2 mb-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md text-sm';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span>All AI services are currently unavailable. Please try again later.</span>
        `;
        
        notificationArea.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    };

    // Initialize CodeMirror editors
    let originalEditor = CodeMirror.fromTextArea(document.getElementById('original-code'), {
        mode: "javascript",
        theme: "monokai",
        lineNumbers: true,
        matchBrackets: true,
        indentUnit: 2,
        smartIndent: true,
        tabSize: 2,
        indentWithTabs: false,
        lineWrapping: false,
        extraKeys: {"Ctrl-Space": "autocomplete"},
        gutters: ["CodeMirror-linenumbers"]
    });
    
    // Set initial height and refresh editor layout
    originalEditor.setSize(null, "100%");
    
    // Output editor will be initialized when content is received
    let outputEditor = null;
    
    // Function to detect language from code content
    function detectCodeLanguage(code) {
        // Simple heuristics to guess the language
        if (code.includes('def ') && code.includes(':') && !code.includes(';')) {
            return 'python';
        } else if (code.includes('import React') || code.includes('function(') || code.includes('=>') || 
                  code.includes('class ') && code.includes('extends ')) {
            return 'javascript';
        } else if (code.includes('public class') || code.includes('public static void main')) {
            return 'text/x-java';
        } else if (code.includes('#include') || code.includes('int main(')) {
            return 'text/x-c++src';
        } else {
            return 'javascript'; // Default to JavaScript
        }
    }
    
    // Update CodeMirror mode when language selector changes
    const languageSelector = document.getElementById('language');
    if (languageSelector) {
        languageSelector.addEventListener('change', function() {
            let mode = 'javascript'; // Default
            
            switch(this.value) {
                case 'python':
                    mode = 'python';
                    break;
                case 'javascript':
                    mode = 'javascript';
                    break;
                case 'java':
                    mode = 'text/x-java';
                    break;
                case 'csharp':
                    mode = 'text/x-csharp';
                    break;
                case 'cpp':
                    mode = 'text/x-c++src';
                    break;
                case 'html':
                    mode = 'htmlmixed';
                    break;
                case 'css':
                    mode = 'css';
                    break;
                default:
                    // Auto-detect from content
                    mode = detectCodeLanguage(originalEditor.getValue());
                    break;
            }
            
            originalEditor.setOption('mode', mode);
        });
    }
    
    // Navigation between panels
    const menuItems = document.querySelectorAll('.menu-item');
    const panels = document.querySelectorAll('.panel');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Get the panel name from data attribute
            const panelName = this.getAttribute('data-panel');
            
            // Remove active class from all menu items
            menuItems.forEach(item => {
                item.classList.remove('active');
                item.classList.remove('bg-primary-800');
                item.classList.add('text-gray-300');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
            this.classList.add('bg-primary-800');
            this.classList.remove('text-gray-300');
            this.classList.add('text-white');
            
            // Hide all panels and show selected
            panels.forEach(panel => {
                panel.classList.add('hidden');
                panel.classList.remove('flex');
            });
            
            const targetPanel = document.getElementById(panelName + '-panel');
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
                targetPanel.classList.add('flex');
                
                // Refresh CodeMirror instances when panel becomes visible
                if (panelName === 'code-editor') {
                    setTimeout(() => {
                        originalEditor.refresh();
                        if (outputEditor) outputEditor.refresh();
                    }, 100);
                }
            }
        });
    });
    
    // Prompt templates
    const promptTemplates = document.querySelectorAll('.prompt-template');
    const userPromptEl = document.getElementById('user-prompt');
    
    promptTemplates.forEach(template => {
        template.addEventListener('click', function() {
            const promptText = this.getAttribute('data-prompt');
            
            // If prompt is empty, just set it, otherwise append
            if (userPromptEl.value.trim() === '') {
                userPromptEl.value = promptText;
            } else {
                userPromptEl.value += '\n' + promptText;
            }
            
            // Focus the textarea and move cursor to end
            userPromptEl.focus();
            userPromptEl.setSelectionRange(userPromptEl.value.length, userPromptEl.value.length);
        });
    });
    
    // Optimization focus checkboxes to update prompt
    const focusCheckboxes = document.querySelectorAll('[id^="focus-"]');
    
    focusCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updatePromptFromFocus();
        });
    });
    
    function updatePromptFromFocus() {
        // Get all checked focus options
        const checkedFocus = Array.from(focusCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => {
                const focusId = cb.id.replace('focus-', '');
                
                // Map focus IDs to prompt texts
                const focusMap = {
                    'performance': 'Optimize for better performance and speed.',
                    'memory': 'Improve memory usage and reduce allocations.',
                    'readability': 'Enhance code readability and maintainability.',
                    'gamedev': 'Improve game physics calculations and stability.',
                    'bugs': 'Fix potential bugs and edge cases.',
                    'patterns': 'Apply proper design patterns and best practices.'
                };
                
                return focusMap[focusId] || '';
            })
            .filter(text => text !== '');
        
        // If there are checked options, build a combined prompt
        if (checkedFocus.length > 0) {
            // Start with a clear instruction
            let focusPrompt = 'Please improve this code with focus on the following aspects:\n';
            
            // Add each focus area as a bullet point
            checkedFocus.forEach(focus => {
                focusPrompt += `- ${focus}\n`;
            });
            
            // Update the prompt field, preserving any custom text
            const currentPrompt = userPromptEl.value.trim();
            
            // If there's existing custom text that doesn't match our previous focus text
            if (currentPrompt && !currentPrompt.startsWith('Please improve this code with focus on the following aspects:')) {
                userPromptEl.value = focusPrompt + '\nAdditional requests:\n' + currentPrompt;
            } else {
                userPromptEl.value = focusPrompt;
            }
        }
    }
    
    // Show diff legend when changes are visible
    const showDiffBtn = document.getElementById('show-diff-btn');
    const diffLegend = document.getElementById('diff-legend');
    
    if (showDiffBtn && diffLegend) {
        showDiffBtn.addEventListener('click', function() {
            diffLegend.classList.toggle('hidden');
            
            // Re-highlight the code if legend is shown
            if (!diffLegend.classList.contains('hidden') && originalEditor.getValue() && outputEditor.getValue()) {
                const highlightedCode = highlightCodeChanges(originalEditor.getValue(), outputEditor.getValue());
                outputEditor.setValue(highlightedCode);
                
                // Make sure highlights are visible
                const changedElements = outputEditor.getDoc().getAllMarks();
                changedElements.forEach(mark => {
                    // Remove any transition or reset that might be happening
                    mark.clear();
                });
            }
        });
    }
    
    // Download button for saving modified code
    const downloadBtn = document.getElementById('download-btn');
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const contentToDownload = outputEditor ? outputEditor.getValue() : modifiedCodeOutput.textContent;
            if (!contentToDownload.trim()) {
                alert('No modified code to download.');
                return;
            }
            
            // Create blob and trigger download
            const blob = new Blob([contentToDownload], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            // Detect language extension
            let extension = '.js';
            if (languageSelector) {
                const lang = languageSelector.value;
                const extMap = {
                    'python': '.py',
                    'javascript': '.js',
                    'java': '.java',
                    'csharp': '.cs',
                    'cpp': '.cpp',
                    'html': '.html',
                    'css': '.css'
                };
                extension = extMap[lang] || '.txt';
            }
            
            // Try to find a class name for the file name
            const classMatch = contentToDownload.match(/class\s+(\w+)/);
            const fileName = classMatch ? `${classMatch[1].toLowerCase()}${extension}` : `modified_code${extension}`;
            
            // Trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
    
    // Add line numbers to code textarea
    const originalCode = document.getElementById('original-code');
    const lineNumbers = document.querySelector('.line-numbers');
    
    function updateLineNumbers() {
        const lines = originalCode.value.split('\n');
        lineNumbers.innerHTML = '';
        
        for (let i = 1; i <= lines.length; i++) {
            const lineNumber = document.createElement('div');
            lineNumber.textContent = i;
            lineNumbers.appendChild(lineNumber);
        }
    }
    
    originalCode.addEventListener('input', updateLineNumbers);
    originalCode.addEventListener('scroll', function() {
        lineNumbers.scrollTop = originalCode.scrollTop;
    });
    
    // Initial line numbers
    updateLineNumbers();
    
    // Generate suggestions button
    const submitBtn = document.getElementById('submit-btn');
    const loadingOverlay = document.getElementById('loading');
    const userPrompt = document.getElementById('user-prompt');
    const modifiedCodeOutput = document.getElementById('modified-code');
    const explanationText = document.getElementById('explanation-text');
    
    // Create an AbortController for the fetch request
    let controller;
    
    // Function to highlight differences between original and modified code
    function highlightCodeChanges(originalCode, modifiedCode) {
        if (!originalCode || !modifiedCode) return modifiedCode;
        
        // Format the code with proper indentation first
        let formattedModifiedCode = formatCode(modifiedCode);
        const formattedOriginalCode = formatCode(originalCode);
        
        const originalLines = formattedOriginalCode.split('\n');
        const modifiedLines = formattedModifiedCode.split('\n');
        
        // Helper function to escape HTML special characters
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
        // For game development code, we want to be sensitive to small changes that could affect game logic
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
                    // Green background for added lines - game developers need to see new functionality
                    highlightedCode += `<div class="bg-green-100 dark:bg-green-900 block">${line}</div>`;
                } else if (changeType === 'modified') {
                    // Yellow background for modified lines - subtle changes matter in game physics/logic
                    highlightedCode += `<div class="bg-yellow-100 dark:bg-yellow-900 block">${line}</div>`;
                }
            } else {
                highlightedCode += `<div>${line}</div>`;
            }
        }
        
        return highlightedCode;
    }
    
    // Format code with proper indentation
    function formatCode(code) {
        if (!code) return '';
        
        // Basic formatter for JavaScript code
        // This is a simple version - for production, consider using a dedicated library
        let indentLevel = 0;
        const indentSize = 2;
        const lines = code.split('\n');
        const formattedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // Decrease indent for closing braces
            if (line.startsWith('}') || line.startsWith(']')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            // Add proper indentation
            if (line.length > 0) {
                const indent = ' '.repeat(indentLevel * indentSize);
                formattedLines.push(indent + line);
            } else {
                formattedLines.push('');  // Keep empty lines
            }
            
            // Increase indent for opening braces
            if (line.endsWith('{') || line.endsWith('[') || 
                (line.includes('{') && !line.includes('}') && !line.endsWith(';'))) {
                indentLevel++;
            }
        }
        
        return formattedLines.join('\n');
    }
    
    // Apply syntax highlighting for JavaScript code
    function applySyntaxHighlighting(code) {
        if (!code) return '';
        
        // You can replace this with a more sophisticated syntax highlighter
        // This is a very basic implementation
        let highlighted = code;
        
        // Replace keywords with styled spans
        const keywords = [
            'class', 'constructor', 'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 
            'this', 'new', 'null', 'undefined', 'true', 'false', 'instanceof', 'typeof'
        ];
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="text-blue-600 dark:text-blue-400">${keyword}</span>`);
        });
        
        // Highlight strings
        highlighted = highlighted.replace(/(["'`])(.*?)\1/g, 
            '<span class="text-green-600 dark:text-green-400">$&</span>');
        
        // Highlight numbers
        highlighted = highlighted.replace(/\b(\d+)\b/g, 
            '<span class="text-purple-600 dark:text-purple-400">$&</span>');
        
        // Highlight comments
        highlighted = highlighted.replace(/\/\/(.*)/g, 
            '<span class="text-gray-500 dark:text-gray-400">$&</span>');
        
        return highlighted;
    }
    
    // Advanced diff visualization with focus on game development concerns
    function analyzeDiffForGameDev(originalCode, modifiedCode) {
        // Look for common game development patterns in the changes
        const gamePatterns = {
            'performance': {
                regex: /\bperformance\b|\boptimiz(e|ation)\b|\bcache\b|\bfps\b|\bframe\s?rate\b/i,
                class: 'text-purple-600 dark:text-purple-400',
                icon: '⚡',
                label: 'Performance'
            },
            'physics': {
                regex: /\bphysics\b|\bcollision\b|\bvelocity\b|\bacceleration\b|\bgravity\b|\bforce\b|\bvector\b|\bmagnitude\b|\bnormalize\b/i,
                class: 'text-blue-600 dark:text-blue-400',
                icon: '🔄',
                label: 'Physics'
            },
            'memory': {
                regex: /\bmemory\b|\bleak\b|\bdispose\b|\bcleanup\b|\bgarbage\s?collect\b|\bcache\b|\bpool\b|\brecycle\b/i,
                class: 'text-red-600 dark:text-red-400',
                icon: '📊',
                label: 'Memory'
            },
            'input': {
                regex: /\binput\b|\bcontroller\b|\bkeyboard\b|\bmouse\b|\btouch\b|\bbutton\b|\bpress\b|\bclick\b/i,
                class: 'text-green-600 dark:text-green-400',
                icon: '🎮',
                label: 'Input'
            },
            'animation': {
                regex: /\banimation\b|\bsprite\b|\bframe\b|\btween\b|\btransition\b|\beasing\b|\binterpolat/i,
                class: 'text-amber-600 dark:text-amber-400',
                icon: '🎬',
                label: 'Animation'
            }
        };
        
        // Check for pattern matches in the modified code
        const detectedPatterns = [];
        const diffText = modifiedCode;
        
        for (const [patternKey, pattern] of Object.entries(gamePatterns)) {
            if (pattern.regex.test(diffText)) {
                detectedPatterns.push({
                    key: patternKey,
                    ...pattern
                });
            }
        }
        
        return detectedPatterns;
    }
    
    submitBtn.addEventListener('click', function() {
        if (!originalEditor.getValue().trim()) {
            alert('Please enter some code to iterate on.');
            return;
        }
        
        // Check code size before sending
        const codeSize = new Blob([originalEditor.getValue()]).size;
        const MAX_SIZE = 50 * 1024; // 50KB limit
        
        if (codeSize > MAX_SIZE) {
            // Show error directly in the explanation area
            explanationText.innerHTML = `<div class="text-red-600 dark:text-red-400 font-semibold">
                <i class="fas fa-exclamation-circle mr-2"></i>
                The code is too large (${Math.round(codeSize/1024)}KB). Please keep it under 50KB by breaking it into smaller sections.
            </div>`;
            
            // Show the output section
            const outputSection = document.getElementById('output-section');
            if (outputSection && outputSection.classList.contains('hidden')) {
                outputSection.classList.remove('hidden');
            }
            return;
        }
        
        // Cancel any ongoing request
        if (controller) {
            controller.abort();
        }
        
        // Create a new AbortController
        controller = new AbortController();
        
        // Show loading overlay
        loadingOverlay.classList.remove('hidden');
        
        // Get selected language
        const selectedLanguage = languageSelector ? languageSelector.value : 'auto';
        
        // Set a timeout for the fetch request (60 seconds - increased for larger models)
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 60000);
        
        // Send to backend with proper content type
        fetch('/iterate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: originalEditor.getValue(),
                prompt: userPrompt.value,
                language: selectedLanguage
            }),
            signal: controller.signal
        })
        .then(response => {
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || `Server returned ${response.status}: ${response.statusText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Hide loading overlay
            loadingOverlay.classList.add('hidden');
            
            // Check if there's an error message in the data
            if (data.error) {
                // Show error in the explanation area instead of an alert
                explanationText.innerHTML = `<div class="text-red-600 dark:text-red-400 font-semibold">${data.error}</div>`;
                
                // Clear output area
                if (outputEditor) {
                    outputEditor.setValue(data.modified_code || '');
                } else {
                    modifiedCodeOutput.textContent = data.modified_code || '';
                }
                
                // Show the output section if it's hidden
                const outputSection = document.getElementById('output-section');
                if (outputSection && outputSection.classList.contains('hidden')) {
                    outputSection.classList.remove('hidden');
                }
                return;
            }
            
            // Get the mode based on language
            let mode = 'javascript'; // Default
            switch(selectedLanguage) {
                case 'python':
                    mode = 'python';
                    break;
                case 'java':
                    mode = 'text/x-java';
                    break;
                case 'csharp':
                    mode = 'text/x-csharp';
                    break;
                case 'cpp':
                    mode = 'text/x-c++src';
                    break;
                case 'html':
                    mode = 'htmlmixed';
                    break;
                case 'css':
                    mode = 'css';
                    break;
                case 'auto':
                    // Try to detect from content
                    mode = detectCodeLanguage(data.modified_code);
                    break;
            }
            
            // Create or update output editor
            if (!outputEditor) {
                // First create a new textarea
                const outputContainer = document.getElementById('output-container');
                outputContainer.innerHTML = '';
                const textarea = document.createElement('textarea');
                textarea.id = 'output-editor';
                outputContainer.appendChild(textarea);
                
                // Then initialize CodeMirror on it
                outputEditor = CodeMirror.fromTextArea(textarea, {
                    mode: mode,
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
            } else {
                // Just update mode if already exists
                outputEditor.setOption('mode', mode);
            }
            
            // Set the content
            outputEditor.setValue(data.modified_code || '');
            
            // Process explanation with additional game development context if needed
            let explanationHTML = (data.explanation || 'No explanation provided.').replace(/\n/g, '<br>');
            
            // If this is game-related code, add gameplay and performance insights
            if (originalEditor.getValue().includes('game') || 
                originalEditor.getValue().includes('player') || 
                originalEditor.getValue().includes('physics') || 
                originalEditor.getValue().includes('collision') || 
                originalEditor.getValue().includes('Vector') || 
                data.modified_code.includes('game') || 
                data.modified_code.includes('player') || 
                data.modified_code.includes('physics')) {
                
                // Analyze diff for game dev patterns
                const gameDevPatterns = analyzeDiffForGameDev(originalEditor.getValue(), data.modified_code);
                
                // If we detected any game development patterns, show them
                if (gameDevPatterns.length > 0) {
                    const patternHTML = gameDevPatterns.map(pattern => 
                        `<div class="flex items-center gap-2 my-1">
                            <span class="text-lg">${pattern.icon}</span>
                            <span class="${pattern.class} font-medium">${pattern.label}</span>
                        </div>`
                    ).join('');
                    
                    explanationHTML = `
                        <div class="mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                            <h3 class="font-bold text-primary-600 dark:text-primary-400 mb-1">Game Development Impact:</h3>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">${patternHTML}</div>
                        </div>
                        <div>${explanationHTML}</div>
                    `;
                }
            }
            
            // Set the explanation HTML
            explanationText.innerHTML = explanationHTML;
            
            // Show notification about which service was used
            let serviceNote = '';
            if (data.using_backup) {
                serviceNote = '<div class="text-amber-600 dark:text-amber-400 text-sm mt-2 p-2 bg-amber-100 dark:bg-amber-900 rounded"><i class="fas fa-info-circle mr-1"></i> Using local AI model (Ollama) as a backup since the primary service is unavailable.</div>';
            } else if (data.using_groq) {
                serviceNote = '<div class="text-blue-600 dark:text-blue-400 text-sm mt-2 p-2 bg-blue-100 dark:bg-blue-900 rounded"><i class="fas fa-info-circle mr-1"></i> Using Groq AI as a fallback since Gemini service is unavailable.</div>';
            }
            
            if (serviceNote) {
                explanationText.insertAdjacentHTML('afterbegin', serviceNote);
            }
            
            // Show the output section if it's hidden
            const outputSection = document.getElementById('output-section');
            if (outputSection && outputSection.classList.contains('hidden')) {
                outputSection.classList.remove('hidden');
            }
            
            // Show the diff legend
            const diffLegend = document.getElementById('diff-legend');
            if (diffLegend) {
                diffLegend.classList.remove('hidden');
            }
        })
        .catch(error => {
            clearTimeout(timeoutId);
            
            // Hide loading overlay
            loadingOverlay.classList.add('hidden');
            
            console.error('Error:', error);
            
            // Display error in the explanation area instead of an alert
            explanationText.innerHTML = `<div class="text-red-600 dark:text-red-400 font-semibold">
                <i class="fas fa-exclamation-circle mr-2"></i>
                ${error.name === 'AbortError' 
                    ? 'The request was taking too long and was cancelled. Please try again with simpler code or breaking your code into smaller parts.'
                    : 'Error: ' + error.message}
            </div>`;
            
            // Show the output section if it's hidden
            const outputSection = document.getElementById('output-section');
            if (outputSection && outputSection.classList.contains('hidden')) {
                outputSection.classList.remove('hidden');
            }
        });
    });
    
    // Copy, clear buttons, etc.
    const clearCodeBtn = document.getElementById('clear-code-btn');
    const copyCodeBtn = document.getElementById('copy-code-btn');
    const copyOutputBtn = document.getElementById('copy-output-btn');
    const integrateBtn = document.getElementById('integrate-btn');
    
    if (clearCodeBtn) {
        clearCodeBtn.addEventListener('click', function() {
            originalEditor.setValue('');
            originalEditor.focus();
        });
    }
    
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', function() {
            navigator.clipboard.writeText(originalEditor.getValue())
                .then(() => {
                    // Visual feedback for copy
                    const originalIcon = copyCodeBtn.innerHTML;
                    copyCodeBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyCodeBtn.innerHTML = originalIcon;
                    }, 2000);
                })
                .catch(error => {
                    console.error('Error copying text: ', error);
                    alert('Failed to copy to clipboard');
                });
        });
    }
    
    if (copyOutputBtn) {
        copyOutputBtn.addEventListener('click', function() {
            const contentToCopy = outputEditor ? outputEditor.getValue() : modifiedCodeOutput.textContent;
            navigator.clipboard.writeText(contentToCopy)
                .then(() => {
                    // Visual feedback for copy
                    const originalIcon = copyOutputBtn.innerHTML;
                    copyOutputBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyOutputBtn.innerHTML = originalIcon;
                    }, 2000);
                })
                .catch(error => {
                    console.error('Error copying text: ', error);
                    alert('Failed to copy to clipboard');
                });
        });
    }
    
    if (integrateBtn) {
        integrateBtn.addEventListener('click', function() {
            const contentToIntegrate = outputEditor ? outputEditor.getValue() : modifiedCodeOutput.textContent;
            originalEditor.setValue(contentToIntegrate);
            originalEditor.focus();
        });
    }
    
    // Toggle explanation
    const toggleExplanationBtn = document.getElementById('toggle-explanation-btn');
    if (toggleExplanationBtn) {
        toggleExplanationBtn.addEventListener('click', function() {
            const explanationText = document.getElementById('explanation-text');
            explanationText.classList.toggle('hidden');
            
            // Change icon
            const icon = toggleExplanationBtn.querySelector('i');
            if (icon) {
                if (explanationText.classList.contains('hidden')) {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                } else {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            }
        });
    }
    
    // Chat functionality
    const chatMessagesContainer = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    
    function addMessageToChat(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message flex space-x-3 mb-4`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center';
        
        if (sender === 'user') {
            avatar.classList.add('bg-primary-500', 'text-white');
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        } else {
            avatar.classList.add('bg-primary-100', 'dark:bg-primary-900', 'text-primary-600', 'dark:text-primary-300');
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
        }
        
        const messageContent = document.createElement('div');
        messageContent.className = sender === 'user' 
            ? 'message-content bg-primary-500 text-white rounded-lg p-3 max-w-3xl'
            : 'message-content bg-primary-50 dark:bg-gray-700 rounded-lg p-3 max-w-3xl';
        
        // Check if content contains code blocks (```code```)
        if (content.includes('```')) {
            let formattedContent = '';
            let parts = content.split('```');
            
            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 0) {
                    // Regular text
                    formattedContent += parts[i];
                } else {
                    // Code block
                    formattedContent += `<pre class="mt-2 mb-2 bg-gray-800 text-gray-200 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">${parts[i]}</pre>`;
                }
            }
            
            messageContent.innerHTML = formattedContent;
        } else {
            // Regular text
            messageContent.innerHTML = content.replace(/\n/g, '<br>');
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        chatMessagesContainer.appendChild(messageDiv);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
    
    // Let's make sure we have a chat controller too
    let chatController;
    
    // Define sendChatMessage as a global function
    window.sendChatMessage = function() {
        const chatInput = document.getElementById('chat-input');
        const chatMessagesContainer = document.getElementById('chat-messages');
        
        if (!chatInput || !chatMessagesContainer) {
            console.error('Chat elements not found!');
            return;
        }
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessageToChat(message, 'user');
        
        // Clear input
        chatInput.value = '';
        
        // Cancel any ongoing request
        if (chatController) {
            chatController.abort();
        }
        
        // Create a new AbortController
        chatController = new AbortController();
        
        // Set a timeout for the fetch request (30 seconds)
        const timeoutId = setTimeout(() => {
            chatController.abort();
        }, 30000);
        
        // Show loading indicator in chat
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
        chatMessagesContainer.appendChild(loadingDiv);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        
        // Send to backend
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: message
            }),
            signal: chatController.signal
        })
        .then(response => {
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Remove loading message
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                chatMessagesContainer.removeChild(loadingElement);
            }
            
            // Add AI response to chat
            addMessageToChat(data.response, 'system');
            
            // Show notification about which service was used
            if (data.using_backup) {
                window.showBackupAINotification("Ollama");
            } else if (data.using_groq) {
                window.showGroqFallbackNotification();
            } else if (data.all_services_failed) {
                window.showAllServicesFailedNotification();
            }
        })
        .catch(error => {
            clearTimeout(timeoutId);
            
            console.error('Error:', error);
            
            // Remove loading message
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                chatMessagesContainer.removeChild(loadingElement);
            }
            
            // Add error message to chat
            let errorMessage = 'Sorry, an error occurred while processing your request.';
            if (error.name === 'AbortError') {
                errorMessage = 'The request was taking too long. Please try asking a simpler question.';
            }
            
            addMessageToChat(errorMessage, 'system');
        });
    };
    
    // Add system message when page loads
    if (chatMessagesContainer && chatMessagesContainer.children.length === 0) {
        addMessageToChat('Hello! I\'m your AI coding assistant. How can I help you today?', 'system');
    }
    
    // Fix for chat button - ensure all possible chat send buttons work
    const sendChatBtnNew = document.getElementById('send-chat-btn-new');
    
    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', function() {
            console.log('Send chat button clicked');
            sendChatMessage();
        });
    }
    
    if (sendChatBtnNew) {
        sendChatBtnNew.addEventListener('click', function() {
            console.log('New send chat button clicked');
            sendChatMessage();
        });
    }
    
    // Add global click handler for any dynamically added send buttons
    document.addEventListener('click', function(event) {
        const clickedElement = event.target.closest('#send-chat-btn, #send-chat-btn-new, [id^="send-chat-btn"]');
        if (clickedElement) {
            console.log('Send button clicked via delegation', clickedElement.id);
            clickedElement.classList.add('clicked-effect');
            setTimeout(() => clickedElement.classList.remove('clicked-effect'), 200);
            sendChatMessage();
        }
    });
    
    if (chatInput) {
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
        
        // Auto-grow chat input
        chatInput.addEventListener('input', function() {
            autoGrow(this);
        });
    }
    
    // Add auto-growing textarea
    function autoGrow(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }
    
    if (userPrompt) {
        userPrompt.addEventListener('input', function() {
            autoGrow(this);
        });
    }
    
    // Dark mode toggle - TODO: implement
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            document.documentElement.classList.toggle('dark', this.checked);
            localStorage.setItem('dark-mode', this.checked ? 'enabled' : 'disabled');
        });
        
        // Check saved preference
        if (localStorage.getItem('dark-mode') === 'enabled') {
            darkModeToggle.checked = true;
            document.documentElement.classList.add('dark');
        }
    }

    // Handle initial panel state
    // Ensure that panels have the correct display state on initial load
    panels.forEach(panel => {
        if (panel.classList.contains('active')) {
            panel.classList.remove('hidden');
            panel.classList.add('flex');
        } else {
            panel.classList.add('hidden');
            panel.classList.remove('flex');
        }
    });

    // Helper function to detect language from code snippet
    function detectLanguage(code) {
        // Simple language detection based on keywords and syntax
        if (!code) return "auto";
        
        // Check for Python indicators
        if (code.includes('def ') || code.includes('import ') && (code.includes(':') && !code.includes(';')) || 
            code.includes('print(') || code.includes('if __name__ == "__main__"')) {
            return "python";
        }
        
        // Check for JavaScript indicators
        if (code.includes('const ') || code.includes('let ') || code.includes('function ') || 
            code.includes('() =>') || code.includes('document.') || code.includes('console.log(')) {
            // Could be TypeScript if it has type annotations
            if (code.includes(': string') || code.includes(': number') || code.includes(': boolean') || 
                code.includes('interface ') || code.includes('<T>')) {
                return "typescript";
            }
            return "javascript";
        }
        
        // Check for Java/C# indicators
        if (code.includes('public class ') || code.includes('private ') || code.includes('protected ')) {
            if (code.includes('System.out.println') || code.includes('@Override')) {
                return "java";
            }
            if (code.includes('Console.WriteLine') || code.includes('namespace ') || code.includes('using System;')) {
                return "csharp";
            }
        }
        
        // Check for C/C++ indicators
        if (code.includes('#include <') || code.includes('int main(')) {
            if (code.includes('std::') || code.includes('namespace ') || code.includes('template<')) {
                return "cpp";
            }
            return "cpp"; // Default to C++ for C-like syntax
        }
        
        // Check for PHP
        if (code.includes('<?php') || code.includes('function ') && code.includes('$')) {
            return "php";
        }
        
        // Check for Ruby
        if (code.includes('def ') && code.includes('end') || code.includes('require ') || code.includes('puts ')) {
            return "ruby";
        }
        
        // Check for Go
        if (code.includes('func ') && code.includes('package ') || code.includes('import (')) {
            return "go";
        }
        
        // Check for Rust
        if (code.includes('fn ') && code.includes('let mut ') || code.includes('impl ') || code.includes('pub struct ')) {
            return "rust";
        }
        
        // Check for HTML
        if (code.includes('<html') || code.includes('<div') || code.includes('<body')) {
            return "html";
        }
        
        // Check for CSS
        if (code.includes('{') && code.includes('}') && 
            (code.includes('margin:') || code.includes('padding:') || code.includes('color:'))) {
            return "css";
        }
        
        // Check for SQL
        if (code.toUpperCase().includes('SELECT ') && code.toUpperCase().includes('FROM ') || 
            code.toUpperCase().includes('INSERT INTO') || code.toUpperCase().includes('CREATE TABLE')) {
            return "sql";
        }
        
        return "auto"; // Default to auto if we can't determine
    }

    // Add to the originalCode event listener to auto-detect language
    originalCode.addEventListener('input', function() {
        updateLineNumbers();
        
        // Auto-detect language if it's set to auto
        const languageSelector = document.getElementById('language');
        if (languageSelector && languageSelector.value === 'auto') {
            const detectedLanguage = detectLanguage(this.value);
            if (detectedLanguage !== 'auto') {
                // Visual feedback for detected language
                const infoElement = document.createElement('div');
                infoElement.className = 'language-detection-info text-xs text-primary-600 dark:text-primary-400 mt-1 ml-2 absolute bottom-1 left-1';
                infoElement.textContent = `Detected: ${detectedLanguage}`;
                infoElement.style.opacity = '0.7';
                
                // Remove any existing language detection info
                const existingInfo = document.querySelector('.language-detection-info');
                if (existingInfo) {
                    existingInfo.remove();
                }
                
                // Only show if we have a good amount of code
                if (this.value.length > 20) {
                    const container = this.parentElement;
                    container.appendChild(infoElement);
                    
                    // Fade out after 3 seconds
                    setTimeout(() => {
                        if (infoElement.parentElement) {
                            infoElement.style.transition = 'opacity 1s';
                            infoElement.style.opacity = '0';
                            setTimeout(() => {
                                if (infoElement.parentElement) {
                                    infoElement.remove();
                                }
                            }, 1000);
                        }
                    }, 3000);
                }
            }
        }
    });
}); 
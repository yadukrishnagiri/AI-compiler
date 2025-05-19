// Simple recovery script to help with page freezes
(function() {
    console.log("Recovery script loaded");
    
    // Check for responsiveness
    let lastResponseTime = Date.now();
    let checkInterval = 5000; // 5 seconds
    
    // Set up heartbeat to detect freezes
    function heartbeat() {
        lastResponseTime = Date.now();
    }
    
    // Set up periodic checking
    function setupRecovery() {
        // Monitor for page responsiveness
        setInterval(function() {
            const currentTime = Date.now();
            const timeSinceLastResponse = currentTime - lastResponseTime;
            
            // If page hasn't responded for over 8 seconds
            if (timeSinceLastResponse > 8000) {
                console.warn("Page may be unresponsive - attempting recovery");
                
                try {
                    // Try to stop any potentially problematic behaviors
                    const problematicIntervals = ["fixApplyChangesButton", "MutationObserver"];
                    
                    // Clear all intervals as a last resort
                    const highIntervalId = setInterval(function(){}, 100000);
                    for(let i = 1; i <= highIntervalId; i++) {
                        clearInterval(i);
                    }
                    
                    // Set up minimal recovery interval
                    setInterval(heartbeat, checkInterval);
                    
                    // Show recovery message
                    const recoveryMsg = document.createElement('div');
                    recoveryMsg.style.position = 'fixed';
                    recoveryMsg.style.bottom = '10px';
                    recoveryMsg.style.right = '10px';
                    recoveryMsg.style.padding = '10px';
                    recoveryMsg.style.background = '#4CAF50';
                    recoveryMsg.style.color = 'white';
                    recoveryMsg.style.borderRadius = '4px';
                    recoveryMsg.style.zIndex = '9999';
                    recoveryMsg.textContent = 'Recovered from freeze';
                    document.body.appendChild(recoveryMsg);
                    
                    // Remove after 5 seconds
                    setTimeout(function() {
                        if (recoveryMsg.parentNode) {
                            recoveryMsg.parentNode.removeChild(recoveryMsg);
                        }
                    }, 5000);
                    
                    // Try to fix apply button with simplified code
                    if (window.fixApplyButton) {
                        window.fixApplyButton();
                    }
                    
                } catch (e) {
                    console.error("Recovery failed:", e);
                }
                
                // Reset the timer
                heartbeat();
            }
        }, checkInterval);
    }
    
    // Start monitoring after page load
    window.addEventListener('load', function() {
        // Initial heartbeat
        heartbeat();
        
        // Set up recovery checks
        setTimeout(setupRecovery, 3000);
        
        // Also set up event listeners for user activity
        document.addEventListener('click', heartbeat);
        document.addEventListener('keydown', heartbeat);
        document.addEventListener('mousemove', heartbeat);
        document.addEventListener('scroll', heartbeat);
    });
})();

document.addEventListener('DOMContentLoaded', function() {
    // Function to add notification when a backup AI model is used
    window.showBackupAINotification = function(serviceName) {
        const backupNote = document.createElement('div');
        backupNote.className = 'message system-message flex space-x-3 mb-4';
        backupNote.innerHTML = `
            <div class="message-avatar flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <i class="fas fa-info-circle"></i>
            </div>
            <div class="message-content bg-amber-50 dark:bg-amber-900 text-amber-600 dark:text-amber-400 rounded-lg p-3 max-w-3xl">
                Using local AI model (${serviceName}) as a backup since the primary services are unavailable.
            </div>
        `;
        const chatMessagesContainer = document.getElementById('chat-messages');
        chatMessagesContainer.appendChild(backupNote);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    };

    // Function specifically for Groq fallback
    window.showGroqFallbackNotification = function() {
        const groqNote = document.createElement('div');
        groqNote.className = 'message system-message flex space-x-3 mb-4';
        groqNote.innerHTML = `
            <div class="message-avatar flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <i class="fas fa-info-circle"></i>
            </div>
            <div class="message-content bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg p-3 max-w-3xl">
                Using Groq AI as a fallback since Gemini service is unavailable.
            </div>
        `;
        const chatMessagesContainer = document.getElementById('chat-messages');
        chatMessagesContainer.appendChild(groqNote);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    };

    // Function for when all services fail
    window.showAllServicesFailedNotification = function() {
        const errorNote = document.createElement('div');
        errorNote.className = 'message system-message flex space-x-3 mb-4';
        errorNote.innerHTML = `
            <div class="message-avatar flex-shrink-0 h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-400">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="message-content bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg p-3 max-w-3xl">
                Unable to process your request. All AI services are currently unavailable. Please try again later.
            </div>
        `;
        const chatMessagesContainer = document.getElementById('chat-messages');
        chatMessagesContainer.appendChild(errorNote);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    };
}); 
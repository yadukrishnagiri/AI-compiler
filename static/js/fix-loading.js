// Fix for loading overlay getting stuck
document.addEventListener('DOMContentLoaded', function() {
    // Get the loading overlay element
    const loadingOverlay = document.getElementById('loading');
    
    if (loadingOverlay) {
        console.log('Loading fix script initialized');
        
        // Force hide loading overlay immediately if it's already visible
        // This helps with page refreshes where the loading state persists
        if (window.getComputedStyle(loadingOverlay).display !== 'none') {
            console.log('Found active loading overlay on page load - hiding it');
            loadingOverlay.classList.add('hidden');
        }
        
        // Set a more aggressive timeout to hide the loading overlay after 10 seconds
        // This is a safety mechanism in case API calls fail without triggering the catch block
        setTimeout(function() {
            if (!loadingOverlay.classList.contains('hidden')) {
                console.log('Loading overlay was stuck for 10 seconds - fixing it now');
                loadingOverlay.classList.add('hidden');
                alert('The request is taking too long. The page will refresh to fix the issue.');
                // Force a page refresh to clear any stuck state
                location.reload();
            }
        }, 10000); // 10 seconds timeout
        
        // Secondary backup timeout
        setTimeout(function() {
            const loadingMessage = document.querySelector('.loading-content p');
            if (loadingMessage && loadingMessage.textContent.includes('Generating amazing suggestions')) {
                console.log('Found stuck generating message after 15 seconds - forcing reset');
                loadingOverlay.classList.add('hidden');
                alert('The API seems to be unresponsive. Please try again with a simpler code sample.');
            }
        }, 15000); // 15 seconds timeout
        
        // Add a manual close button to the loading overlay that's more visible
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '× Cancel';
        closeButton.classList.add('absolute', 'top-3', 'right-3', 'bg-red-500', 'hover:bg-red-600', 'text-white', 'py-1', 'px-3', 'rounded', 'text-sm', 'font-medium', 'transition', 'focus:outline-none', 'focus:ring-2', 'focus:ring-red-400');
        
        closeButton.addEventListener('click', function() {
            console.log('Cancel button clicked');
            loadingOverlay.classList.add('hidden');
            // Optional: Abort any pending fetch requests
            // This would require modifying the API calls to use AbortController
        });
        
        // Add the button to the loading content div
        const loadingContent = loadingOverlay.querySelector('.loading-content');
        if (loadingContent) {
            loadingContent.appendChild(closeButton);
        }
        
        // Also monitor for network errors that might cause the loading to get stuck
        window.addEventListener('error', function(event) {
            if (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK') {
                console.log('Resource error detected - checking if loading is stuck');
                if (!loadingOverlay.classList.contains('hidden')) {
                    loadingOverlay.classList.add('hidden');
                    alert('A network error occurred. Please check your connection and try again.');
                }
            }
        }, true);
    }
}); 
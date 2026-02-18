/**
 * Welcome Hint Component
 * Shows contextual hint to users after first login
 */

/**
 * Show welcome hint after login
 */
function showWelcomeHint() {
    // Check if user just logged in
    if (localStorage.getItem('justLoggedIn') !== 'true') {
        return;
    }
    
    // Check if hint was already shown
    if (localStorage.getItem('welcomeHintShown') === 'true') {
        return;
    }
    
    // Create hint element
    const hint = document.createElement('div');
    hint.className = 'welcome-hint';
    hint.innerHTML = `
        <div class="welcome-hint-content">
            <i class="fa fa-info-circle"></i>
            <span>You're logged in! Click <strong>My Dashboard</strong> in the navigation bar to access your dashboard.</span>
            <button class="welcome-hint-close" onclick="closeWelcomeHint()">&times;</button>
        </div>
    `;
    
    document.body.appendChild(hint);
    
    // Mark as shown
    localStorage.setItem('welcomeHintShown', 'true');
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        closeWelcomeHint();
    }, 10000);
}

/**
 * Close welcome hint
 */
function closeWelcomeHint() {
    const hint = document.querySelector('.welcome-hint');
    if (hint) {
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), 300);
    }
}

// Export functions
export { showWelcomeHint, closeWelcomeHint };

// Expose globally
window.showWelcomeHint = showWelcomeHint;
window.closeWelcomeHint = closeWelcomeHint;

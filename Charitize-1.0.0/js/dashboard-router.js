/**
 * Dashboard Router
 * Routes users to appropriate dashboard based on their role
 */

import authManager from './auth-manager.js';

/**
 * Navigate to user's dashboard based on role
 */
function goToDashboard() {
    const user = authManager.getCurrentUser();
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Clear first-time login flag
    localStorage.removeItem('justLoggedIn');
    
    // Route based on role
    switch(user.role) {
        case 'admin':
            window.location.href = 'admin-dashboard.html';
            break;
        case 'mentor':
            window.location.href = 'mentor-dashboard.html';
            break;
        case 'innovator':
        default:
            window.location.href = 'innovator-dashboard.html';
            break;
    }
}

/**
 * Get dashboard URL for current user
 */
function getDashboardUrl() {
    const user = authManager.getCurrentUser();
    
    if (!user) return 'login.html';
    
    switch(user.role) {
        case 'admin':
            return 'admin-dashboard.html';
        case 'mentor':
            return 'mentor-dashboard.html';
        case 'innovator':
        default:
            return 'innovator-dashboard.html';
    }
}

// Export functions
export { goToDashboard, getDashboardUrl };

// Expose globally for non-module scripts
window.goToDashboard = goToDashboard;
window.getDashboardUrl = getDashboardUrl;

const api = {
    // Legacy API has been decommissioned in favor of direct Firebase/Supabase integration.
    // Helper for Supabase storage can be added here if needed, or used directly in innovate-hub.js.
    
    // Placeholder to prevent broken references if any script still imports 'api'
    logout: async () => {
        if (window.auth) {
            await window.auth.signOut();
        }
        localStorage.removeItem('token');
        localStorage.removeItem('innovateHubUser');
        window.location.href = 'index.html';
    },

    getCurrentUser: async () => {
        const user = localStorage.getItem('innovateHubUser');
        return user ? JSON.parse(user) : null;
    }
};

// Expose to window
window.api = api;

// Expose to window
window.api = api;

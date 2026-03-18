/**
 * Global Authentication Manager (Supabase Auth)
 * Manages authentication state using Supabase as the sole identity provider.
 * Firebase Auth has been fully removed.
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authCallbacks = [];
        this._initialized = false;
    }

    /**
     * Initialize auth manager and set up Supabase session listener.
     * Waits for window.supabase to be ready.
     */
    async init() {
        // Ensure supabase client is available
        if (!window.supabase) {
            console.warn('AuthManager: window.supabase not ready, retrying...');
            await new Promise(r => setTimeout(r, 300));
        }

        if (!window.supabase) {
            console.error('AuthManager: Supabase client unavailable.');
            return null;
        }

        // Try to restore session from existing Supabase session
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session) {
            await this._setUserFromSession(session);
        } else {
            this.currentUser = null;
            // Only remove if we haven't just performed a local signup/login that might be pending confirmation
            if (!localStorage.getItem('justLoggedIn')) {
                localStorage.removeItem('innovateHubUser');
            }
        }

        // Listen for future auth state changes (login, logout, token refresh)
        window.supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                await this._setUserFromSession(session);
            } else {
                this.currentUser = null;
                localStorage.removeItem('innovateHubUser');
            }
            this.authCallbacks.forEach(cb => cb(this.currentUser));
        });

        this._initialized = true;
        return this.currentUser;
    }

    /**
     * Hydrate currentUser from a Supabase session + profiles table.
     */
    async _setUserFromSession(session) {
        const supabaseUser = session.user;
        try {
            let profile = null;
            if (window.SupabaseService) {
                profile = await window.SupabaseService.getProfile(supabaseUser.id);
            }

            if (profile) {
                this.currentUser = {
                    uid: supabaseUser.id,
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    role: profile.role || 'innovator',
                    fullName: profile.full_name,
                    displayName: profile.full_name || supabaseUser.email.split('@')[0],
                    loggedIn: true, // Legacy compatibility
                    ...profile
                };
            } else {
                // Fallback: user exists in auth but has no profile row yet
                this.currentUser = {
                    uid: supabaseUser.id,
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
                    role: supabaseUser.user_metadata?.role || 'innovator'
                };
            }

            localStorage.setItem('innovateHubUser', JSON.stringify(this.currentUser));
        } catch (error) {
            console.error('AuthManager: Error fetching Supabase profile:', error);
            this.currentUser = {
                uid: supabaseUser.id,
                id: supabaseUser.id,
                email: supabaseUser.email,
                displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
                role: 'innovator'
            };
            localStorage.setItem('innovateHubUser', JSON.stringify(this.currentUser));
        }
    }

    /**
     * Get current user — tries memory first, then localStorage.
     */
    getCurrentUser() {
        if (!this.currentUser) {
            const stored = localStorage.getItem('innovateHubUser');
            if (stored) {
                try {
                    this.currentUser = JSON.parse(stored);
                } catch (e) {
                    console.error('AuthManager: Error parsing stored user:', e);
                }
            }
        }
        return this.currentUser;
    }

    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    }

    getUserName() {
        const user = this.getCurrentUser();
        return user ? (user.displayName || user.fullName || user.full_name || (user.email && user.email.split('@')[0])) : null;
    }

    /**
     * Sign out the user from Supabase and clear local state.
     */
    async logout() {
        try {
            if (window.supabase) {
                await window.supabase.auth.signOut();
            }
            this.currentUser = null;
            localStorage.removeItem('innovateHubUser');
            localStorage.removeItem('justLoggedIn');
            return true;
        } catch (error) {
            console.error('AuthManager: Logout error:', error);
            return false;
        }
    }

    onAuthChange(callback) {
        this.authCallbacks.push(callback);
    }

    requireAuth(redirectUrl = 'login.html') {
        if (!this.isLoggedIn()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    requireRole(requiredRole, redirectUrl = 'index.html') {
        const userRole = this.getUserRole();
        if (userRole !== requiredRole) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
}

// Singleton
const authManager = new AuthManager();
export default authManager;
window.AuthManager = authManager;

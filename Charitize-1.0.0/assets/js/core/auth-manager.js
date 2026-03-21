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
        // Wait for supabase client (up to 3s with retries)
        for (let i = 0; i < 10 && !window.supabase; i++) {
            await new Promise(r => setTimeout(r, 300));
        }

        if (!window.supabase || typeof window.supabase.auth?.getSession !== 'function') {
            console.error('AuthManager: Supabase client unavailable after retries.');
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
                    role: profile.role || (supabaseUser.user_metadata?.role) || null,
                    profileComplete: this._checkProfileComplete(profile, supabaseUser),
                    fullName: profile.full_name,
                    displayName: profile.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
                    loggedIn: true,
                    ...profile
                };
            } else {
                // Fallback: user exists in auth but has no profile row yet
                this.currentUser = {
                    uid: supabaseUser.id,
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    profileComplete: false,
                    displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
                    role: supabaseUser.user_metadata?.role || null
                };
            }

            localStorage.setItem('innovateHubUser', JSON.stringify(this.currentUser));
        } catch (error) {
            console.error('AuthManager: Error fetching Supabase profile:', error);
            // On error, do NOT assume innovator role. Stay neutral.
            this.currentUser = {
                uid: supabaseUser.id,
                id: supabaseUser.id,
                email: supabaseUser.email,
                displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
                role: supabaseUser.user_metadata?.role || null,
                profileComplete: false,
                error: true
            };
            localStorage.setItem('innovateHubUser', JSON.stringify(this.currentUser));
        }
    }

    /**
     * Logic shared between initial hydration and runtime checks.
     */
    _checkProfileComplete(profile, supabaseUser) {
        if (!profile) {
            console.log("AuthManager: No profile row found for completeness check.");
            return false;
        }
        
        // Admins are always considered complete
        const role = (profile.role || (supabaseUser?.user_metadata?.role) || profile.Role || "").toLowerCase();
        if (role === 'admin') return true;

        // Check both camelCase and snake_case
        const isComplete = profile.profile_complete === true || profile.profileComplete === true;
        
        console.log("AuthManager: Checking profile completeness...", {
            role,
            isComplete,
            profile_complete_raw: profile.profile_complete,
            profileComplete_raw: profile.profileComplete
        });

        return isComplete && !!role;
    }

    /**
     * Public method to check if the profile is complete.
     */
    isProfileComplete() {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        // NUCLEAR FIX: If they have ANY role, they are complete enough to see the dashboard.
        // This prevents the loop between index and signup for users who have finished Step 3.
        const hasRole = !!(user.role || (user.user_metadata?.role));
        const explicitComplete = !!(user.profile_complete || user.profileComplete || user.role === 'admin');
        
        const isComplete = hasRole || explicitComplete;
        
        console.log("AuthManager: isProfileComplete check:", isComplete, { email: user.email, hasRole, explicitComplete });
        return isComplete;
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
            sessionStorage.clear();
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

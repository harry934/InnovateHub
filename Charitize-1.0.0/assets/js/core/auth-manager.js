/**
 * Global Authentication Manager
 * Manages authentication state across the entire application
 */

import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// Supabase is loaded via CDN and configured in supabase-config.js


class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authCallbacks = [];
    }

    /**
     * Initialize auth manager and set up listener
     */
    async init() {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, async (firebaseUser) => {
                if (firebaseUser) {
                    // User is signed in
                    try {
                        let profile = null;
                        if (window.SupabaseService) {
                            profile = await window.SupabaseService.getProfile(firebaseUser.uid);
                        }
                        
                        if (profile) {
                            this.currentUser = {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                role: profile.role || 'innovator',
                                fullName: profile.full_name,
                                ...profile
                            };
                        } else {
                            // Fallback if no profile exists yet
                            this.currentUser = {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                                role: 'innovator' // Default role
                            };
                        }

                        // Store in localStorage for quick access
                        localStorage.setItem('innovateHubUser', JSON.stringify(this.currentUser));
                    } catch (error) {
                        console.error('Error fetching user data from Supabase:', error);
                        this.currentUser = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                            role: 'innovator'
                        };
                    }
                } else {
                    // User is signed out
                    this.currentUser = null;
                    localStorage.removeItem('innovateHubUser');
                }

                // Notify all callbacks
                this.authCallbacks.forEach(callback => callback(this.currentUser));
                resolve(this.currentUser);
            });
        });
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        // Try localStorage first for immediate access
        if (!this.currentUser) {
            const stored = localStorage.getItem('innovateHubUser');
            if (stored) {
                try {
                    this.currentUser = JSON.parse(stored);
                } catch (e) {
                    console.error('Error parsing stored user:', e);
                }
            }
        }
        return this.currentUser;
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    /**
     * Get user role
     */
    getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    }

    /**
     * Get user display name
     */
    getUserName() {
        const user = this.getCurrentUser();
        return user ? (user.displayName || user.fullName || user.email.split('@')[0]) : null;
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await signOut(auth);
            this.currentUser = null;
            localStorage.removeItem('innovateHubUser');
            localStorage.removeItem('justLoggedIn');
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }

    /**
     * Register callback for auth state changes
     */
    onAuthChange(callback) {
        this.authCallbacks.push(callback);
    }

    /**
     * Require authentication (redirect to login if not authenticated)
     */
    requireAuth(redirectUrl = 'login.html') {
        if (!this.isLoggedIn()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    /**
     * Require specific role
     */
    requireRole(requiredRole, redirectUrl = 'index.html') {
        const userRole = this.getUserRole();
        if (userRole !== requiredRole) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
}

// Create singleton instance
const authManager = new AuthManager();

// Export for use in other modules
export default authManager;

// Also expose globally for non-module scripts
window.AuthManager = authManager;

/**
 * InnovateHub API Client
 * Handles all communication with the backend API
 */

const API_URL = 'http://localhost:5000/api';

const api = {
    // Auth
    login: async (email, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            const user = { ...data.user, loggedIn: true };
            localStorage.setItem('token', data.token);
            localStorage.setItem('innovateHubUser', JSON.stringify(user));
        }
        return { ok: response.ok, data };
    },

    register: async (userData) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (response.ok) {
            const user = { ...data.user, loggedIn: true };
            localStorage.setItem('token', data.token);
            localStorage.setItem('innovateHubUser', JSON.stringify(user));
        }
        return { ok: response.ok, data };
    },
    
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('innovateHubUser');
        window.location.href = 'index.html';
    },

    getCurrentUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        try {
            const response = await fetch(`${API_URL}/auth/user`, {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                return await response.json();
            } else {
                // Token invalid
                localStorage.removeItem('token');
                return null;
            }
        } catch (e) {
            return null;
        }
    },

    // Projects
    getMyProjects: async () => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/projects/my-projects`, {
            headers: { 'x-auth-token': token }
        });
        return await response.json();
    },

    createProject: async (projectData) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(projectData)
        });
        return { ok: response.ok, data: await response.json() };
    },
    
    // Users (Mentors)
    getMentors: async (filters = {}) => {
        const token = localStorage.getItem('token');
        // Build query string
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/users/mentors?${queryParams}`, {
            headers: { 'x-auth-token': token }
        });
        return await response.json();
    },
    
    updateProfile: async (profileData) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(profileData)
        });
        return { ok: response.ok, data: await response.json() };
    }
};

// Expose to window
window.api = api;

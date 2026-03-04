/**
 * InnovateHub API Client
 * Handles all communication with the backend API
 */

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://innovatehub.up.railway.app/api'; 

const api = {
    // Auth
    login: async (firebaseUser, idToken) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firebaseUid: firebaseUser.uid })
            });
            
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error("Non-JSON API response:", text);
                data = { msg: `Server error: ${text || response.statusText}` };
            }

            if (response.ok) {
                const user = { ...data.user, loggedIn: true };
                localStorage.setItem('token', idToken);
                localStorage.setItem('innovateHubUser', JSON.stringify(user));
            }
            return { ok: response.ok, data };
        } catch (error) {
            console.error("API Login Error:", error);
            return { ok: false, data: { msg: "Network or Server Error" } };
        }
    },

    register: async (firebaseUser, idToken, userData) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...userData,
                    firebaseUid: firebaseUser.uid,
                    email: firebaseUser.email
                })
            });
            
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error("Non-JSON API response:", text);
                data = { msg: `Server error: ${text || response.statusText}` };
            }

            if (response.ok) {
                const user = { ...data.user, loggedIn: true };
                localStorage.setItem('token', idToken);
                localStorage.setItem('innovateHubUser', JSON.stringify(user));
            }
            return { ok: response.ok, data };
        } catch (error) {
            console.error("API Register Error:", error);
            return { ok: false, data: { msg: "Network or Server Error" } };
        }
    },
    
    logout: async () => {
        if (window.auth) {
            await window.auth.signOut();
        }
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
    },

    uploadProjectFile: async (file, projectId, innovatorId) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('innovatorId', innovatorId);

        const response = await fetch(`${API_URL}/projects/upload`, {
            method: 'POST',
            body: formData
        });
        return { ok: response.ok, data: await response.json() };
    },

    deleteProject: async (projectId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/projects/${projectId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        return { ok: response.ok, data: await response.json() };
    },
    API_URL: API_URL // Expose the URL for other scripts
};

// Expose to window
window.api = api;

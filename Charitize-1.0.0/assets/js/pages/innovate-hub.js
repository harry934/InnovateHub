import { auth, db, storage } from '../core/firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 1. UI INITIALIZATION HANDLED BY shared-ui.js
// (Splash screen, preloader, and navbar toggles are now in shared-ui.js)


/**
 * Real-time Firebase Auth Listener
 * Synchronizes Firebase auth state with LocalStorage and UI
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // 1. Fetch user profile from Firestore to get role and other metadata
            const userDoc = await getDoc(doc(db, "users", user.uid));
            let profileData = {};
            
            if (userDoc.exists()) {
                profileData = userDoc.data();
            } else {
                console.warn("No Firestore profile found for user:", user.uid);
                // Default role for new users if not found (shouldn't happen with correct signup)
                profileData = { role: 'innovator', fullName: user.displayName || user.email };
            }

            // 2. Prepare complete session data
            const sessionData = { 
                uid: user.uid, 
                email: user.email, 
                displayName: user.displayName,
                photoURL: user.photoURL,
                loggedIn: true,
                ...profileData // Merge Firestore data (role, fullName, etc.)
            };

            // 3. Save and move on (UI update handled by dashboards/landing)
            window.saveToLocalStorage("innovateHubUser", sessionData);
            if (typeof window.updateNavbarUI === 'function') window.updateNavbarUI(sessionData);
            if (typeof window.updateUIForRole === 'function') window.updateUIForRole(sessionData);
        } catch (error) {
            console.error("Error fetching user profile:", error);
            const basicSession = { uid: user.uid, email: user.email, loggedIn: true };
            window.saveToLocalStorage("innovateHubUser", basicSession);
        }
    } else {
        localStorage.removeItem("innovateHubUser");
        if (typeof window.updateNavbarUI === 'function') window.updateNavbarUI(null);
    }
});

// Helper for Auth Redirection handled in dashboard scripts
export function requireAuth() {
    const user = loadFromLocalStorage("innovateHubUser");
    if (!user || !user.loggedIn) {
        window.location.href = 'login.html';
    }
    return user;
}

// Global Exports for Module services
window.firebaseLogout = async function() {
    console.log("Firebase logout triggered from innovate-hub.js");
    try {
        await signOut(auth);
        localStorage.removeItem("innovateHubUser");
        if (typeof window.updateNavbarUI === 'function') window.updateNavbarUI(null);
        
        // Use window.location.replace to prevent back-button navigation to a session
        window.location.replace("login.html");
    } catch (error) {
        console.error("Logout error:", error);
        localStorage.removeItem("innovateHubUser");
        window.location.replace("login.html");
    }
};

// Re-sync global logout with firebase-aware logout
window.logout = window.firebaseLogout;

// ========================================
// 14. SERVICES
// ========================================

// SERVICES
// ========================================

export const ProjectService = {
    submitProject: async (formData, file) => {
        // 1. Create Firestore Doc Shell
        const projectRef = await addDoc(collection(db, "projects"), {
            ...formData,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // 2. Upload File to MongoDB (Replacement for Firebase Storage)
        if (file) {
            try {
                // Use the API helper to upload to MongoDB
                const response = await window.api.uploadProjectFile(file, projectRef.id, auth.currentUser.uid);
                
                if (response && response.ok) {
                    const baseUrl = window.api ? window.api.API_URL : 'https://innovatehub.up.railway.app/api';
                    // Update Firestore with the MongoDB file reference
                    await updateDoc(doc(db, "projects", projectRef.id), {
                        mongodbFileId: response.data.fileId,
                        fileName: file.name,
                        fileStorageType: 'mongodb',
                        fileUrl: `${baseUrl}/projects/file/${response.data.fileId}`
                    });
                } else {
                    // ATOMIC ROLLBACK: Delete the Firestore project if file upload fails
                    const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                    await deleteDoc(doc(db, "projects", projectRef.id));
                    
                    const errorMsg = response && response.data ? response.data.msg : "Failed to upload project document to MongoDB.";
                    console.error("MongoDB Upload Failed:", errorMsg);
                    throw new Error(errorMsg);
                }
            } catch (err) {
                // Also attempt rollback on unexpected errors
                try {
                    const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                    await deleteDoc(doc(db, "projects", projectRef.id));
                } catch (rollbackErr) {
                    console.error("Rollback failed:", rollbackErr);
                }
                
                console.error("Project File Upload Error:", err);
                throw new Error("Failed to upload project document. Project submission rolled back.");
            }
        }
        return projectRef;
    }
};

export const MentorshipService = {
    sendRequest: async (mentorId, projectId) => {
        return await addDoc(collection(db, "mentorshipRequests"), {
            mentorId,
            projectId,
            innovatorId: auth.currentUser.uid,
            status: 'pending',
            createdAt: serverTimestamp()
        });
    }
};

export const NotificationService = {
    send: async (userId, message, type = 'info') => {
        return await addDoc(collection(db, "notifications"), {
            userId,
            message,
            type,
            read: false,
            createdAt: serverTimestamp()
        });
    }
};

// Export Services to Window for non-module scripts
window.ProjectService = ProjectService;
window.MentorshipService = MentorshipService;
window.NotificationService = NotificationService;

// Log initialization message
console.log(
  "%cInnovate Hub Platform v2.0.1 (Fix)",
  "color: #667eea; font-size: 20px; font-weight: bold;",
);
console.log(
  "%cEmpowering Innovation Through Collaboration",
  "color: #764ba2; font-size: 14px;",
);
console.log("Platform services initialized successfully ✓");

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

        if (file) {
            try {
                // Generate a unique file path
                const fileExt = file.name.split('.').pop();
                const fileName = `${projectRef.id}-${Date.now()}.${fileExt}`;
                const filePath = `documents/${auth.currentUser.uid}/${fileName}`;

                // 2. Upload to Supabase Storage
                const { data, error } = await window.supabase.storage
                    .from('project-documents')
                    .upload(filePath, file);

                if (error) throw error;

                // 3. Get Public URL
                const { data: { publicUrl } } = window.supabase.storage
                    .from('project-documents')
                    .getPublicUrl(filePath);

                // 4. Update Firestore with Supabase metadata
                await updateDoc(doc(db, "projects", projectRef.id), {
                    fileUrl: publicUrl,
                    fileName: file.name,
                    fileStorageType: 'supabase',
                    supabasePath: filePath,
                    updatedAt: serverTimestamp()
                });

            } catch (err) {
                console.error("Supabase Upload Failed:", err);
                
                // ATOMIC ROLLBACK: Delete the Firestore project if upload fails
                try {
                    const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                    await deleteDoc(doc(db, "projects", projectRef.id));
                } catch (rollbackErr) {
                    console.error("Rollback failed:", rollbackErr);
                }
                
                throw new Error(`Failed to upload project document: ${err.message || 'Unknown storage error'}. Project submission rolled back.`);
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

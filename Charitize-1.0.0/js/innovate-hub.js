import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 1. SPLASH SCREEN CONTROL (PRELOADER)
(function() {
    const initPreloader = () => {
        const preloader = document.getElementById("logo-preloader");
        if (!preloader) return;
        const wasNavigated = sessionStorage.getItem("wasNavigated");
        sessionStorage.removeItem("wasNavigated");
        if (wasNavigated) {
            preloader.remove();
        } else {
            preloader.classList.add("active");
            const hidePreloader = () => {
                preloader.classList.remove("active");
                preloader.classList.add("fade-out");
                setTimeout(() => { if(preloader && preloader.parentNode) preloader.remove(); }, 1000);
            };
            setTimeout(hidePreloader, 2000);
            setTimeout(() => { if (preloader && preloader.parentNode) preloader.remove(); }, 4000);
        }
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initPreloader);
    } else {
        initPreloader();
    }
})();

// Navigation listener to set flag
document.addEventListener("click", function(e) {
    const link = e.target.closest("a");
    if (link && 
        link.href && 
        link.href.includes(window.location.origin) && 
        !link.href.includes("#") && 
        link.target !== "_blank") {
        sessionStorage.setItem("wasNavigated", "true");
    }
});

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
            if (typeof window.updateUIForRole === 'function') window.updateUIForRole(sessionData);
        } catch (error) {
            console.error("Error fetching user profile:", error);
            const basicSession = { uid: user.uid, email: user.email, loggedIn: true };
            window.saveToLocalStorage("innovateHubUser", basicSession);
        }
    } else {
        localStorage.removeItem("innovateHubUser");
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
window.logout = async function() {
    try {
        await signOut(auth);
        localStorage.removeItem("innovateHubUser");
        window.location.href = "login.html";
    } catch (error) {
        console.error("Logout error:", error);
        localStorage.removeItem("innovateHubUser");
        window.location.href = "login.html";
    }
};

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

        // 2. Upload File to Firebase Storage
        if (file) {
            const fileName = `projects/${projectRef.id}_${file.name}`;
            const fileRef = ref(storage, fileName);
            
            try {
                const uploadResult = await uploadBytes(fileRef, file);
                const fileUrl = await getDownloadURL(uploadResult.ref);
                
                // 3. Update Firestore with final URL
                await updateDoc(doc(db, "projects", projectRef.id), {
                    fileUrl: fileUrl,
                    fileName: file.name
                });
            } catch (err) {
                console.error("Firebase Storage Upload Error:", err);
                throw new Error("Failed to upload project document.");
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

export { requireAuth };

// Export Services to Window for non-module scripts
window.ProjectService = ProjectService;
window.MentorshipService = MentorshipService;
window.NotificationService = NotificationService;

// Log initialization message
console.log(
  "%cInnovate Hub Platform",
  "color: #667eea; font-size: 20px; font-weight: bold;",
);
console.log(
  "%cEmpowering Innovation Through Collaboration",
  "color: #764ba2; font-size: 14px;",
);
console.log("Platform services initialized successfully ✓");

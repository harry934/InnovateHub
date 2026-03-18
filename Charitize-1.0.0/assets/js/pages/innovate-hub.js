import { auth } from '../core/firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// Firestore imports removed

// 1. UI INITIALIZATION HANDLED BY shared-ui.js
// (Splash screen, preloader, and navbar toggles are now in shared-ui.js)


/**
 * Real-time Firebase Auth Listener
 * Synchronizes Firebase auth state with LocalStorage and UI
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // 1. Fetch user profile from Supabase to get role and other metadata
            let profileData = {};
            
            if (window.SupabaseService) {
                try {
                    const sbProfile = await window.SupabaseService.getProfile(user.uid);
                    if (sbProfile) {
                        profileData = {
                            role: sbProfile.role,
                            fullName: sbProfile.full_name || sbProfile.fullName,
                            status: sbProfile.status
                        };
                    }
                } catch (e) {
                    console.warn("Supabase profile fetch failed", e);
                }
            }
            
            if (!profileData.role) {
                console.warn("No profile found for user:", user.uid);
                profileData = { role: 'innovator', fullName: user.displayName || user.email };
            }

            // 2. Sync with Supabase
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.upsertProfile({
                        id: user.uid,
                        email: user.email,
                        full_name: profileData.fullName || profileData.full_name || user.displayName || user.email.split('@')[0],
                        role: profileData.role || 'innovator',
                        status: profileData.status || 'active',
                        updated_at: new Date().toISOString()
                    });
                    console.log("Supabase Auth Sync: Profile unified ✓");
                } catch (sbErr) {
                    console.error("Supabase Auth Sync: Failed", sbErr);
                }
            }

            // 3. Prepare complete session data
            const sessionData = { 
                uid: user.uid, 
                email: user.email, 
                displayName: user.displayName,
                photoURL: user.photoURL,
                loggedIn: true,
                ...profileData // Merge Firestore data (role, fullName, etc.)
            };

            // 4. Save and Update UI
            window.saveToLocalStorage("innovateHubUser", sessionData);
            if (typeof window.updateNavbarUI === 'function') window.updateNavbarUI(sessionData);
            if (typeof window.updateUIForRole === 'function') window.updateUIForRole(sessionData);
        } catch (error) {
            console.error("Error in auth listener:", error);
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
        let projectData = {
            innovator_id: auth.currentUser.uid,
            title: formData.title,
            problem_statement: formData.problemStatement,
            proposed_solution: formData.proposedSolution,
            objectives: formData.objectives,
            expected_impact: formData.expectedImpact,
            target_area: formData.targetArea || (formData.categories && formData.categories[0]) || 'General',
            status: 'pending'
        };

        // 1. Primary Sync: Supabase
        if (window.SupabaseService) {
            try {
                // Ensure Supabase client is initialized (shared from window)
                if (!window.supabase) {
                    throw new Error("Supabase client not initialized. Please check your configuration.");
                }

                const sbProject = await window.SupabaseService.createProject(projectData);
                console.log("Supabase Project Created ✓", sbProject.id);
                
                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${sbProject.id}-${Date.now()}.${fileExt}`;
                    const filePath = `documents/${auth.currentUser.uid}/${fileName}`;

                    // Check if bucket exists/is accessible by trying upload
                    const { error: uploadError } = await window.supabase.storage
                        .from('public-assets')
                        .upload(filePath, file);

                    if (!uploadError) {
                        const { data: { publicUrl } } = window.supabase.storage
                            .from('public-assets')
                            .getPublicUrl(filePath);

                        await window.supabase
                            .from('projects')
                            .update({ file_url: publicUrl, file_name: file.name })
                            .eq('id', sbProject.id);
                        console.log("Project Document Uploaded ✓");
                    } else {
                        console.error("Supabase Storage Error:", uploadError.message);
                        // Still return project ID, maybe show warning
                    }
                }
                return { id: sbProject.id };
            } catch (err) {
                console.error("Supabase Project Submission Failed:", err);
                throw err;
            }
        }
        throw new Error("Supabase service not available. Sync might still be in progress.");
    }
};

export const MentorshipService = {
    sendRequest: async (mentorId, projectId) => {
        const mentorshipData = {
            innovator_id: auth.currentUser.uid,
            mentor_id: mentorId,
            project_id: projectId,
            status: 'pending'
        };

        // Primary Sync: Supabase
        if (window.SupabaseService) {
            try {
                const sbMentorship = await window.SupabaseService.createMentorship(mentorshipData);
                console.log("Supabase Mentorship Request Created ✓");
                return { id: sbMentorship.id };
            } catch (err) {
                console.error("Supabase Mentorship Creation Failed:", err);
                throw err;
            }
        }
        throw new Error("Supabase service not available.");
    }
};

export const NotificationService = {
    send: async (userId, message, type = 'info') => {
        // 1. Primary Sync: Supabase
        if (window.SupabaseService) {
            await window.SupabaseService.createNotification({
                user_id: userId,
                message: message,
                type: type,
                is_read: false
            });
            console.log("Supabase Notification Created ✓");
        }

        // 2. Secondary Sync: Firestore (Background) - Removed
    }
};

export const MilestoneService = {
    report: async (projectId, milestoneTitle, content) => {
        const reportData = {
            project_id: projectId,
            milestone_title: milestoneTitle,
            content,
            reported_by: auth.currentUser.uid
        };

        // 1. Primary Sync: Supabase
        let sbReport;
        if (window.SupabaseService) {
            sbReport = await window.SupabaseService.createMilestoneReport(reportData);
        }

        const reportId = sbReport ? sbReport.id : `legacy-${Date.now()}`;

        // 2. Secondary Sync: Firestore (Background) - Removed

        return { id: reportId };
    }
};

export const CollaborationService = {
    addComment: async (projectId, content) => {
        const commentData = {
            project_id: projectId,
            content,
            author_id: auth.currentUser.uid
        };

        // 1. Primary Sync: Supabase
        let sbComment;
        if (window.SupabaseService) {
            sbComment = await window.SupabaseService.createCollaborationComment(commentData);
        }

        const commentId = sbComment ? sbComment.id : `legacy-${Date.now()}`;

        // 2. Secondary Sync: Firestore (Background) - Removed

        return { id: commentId };
    }
};

// Export Services to Window for non-module scripts
window.ProjectService = ProjectService;
window.MentorshipService = MentorshipService;
window.NotificationService = NotificationService;
window.MilestoneService = MilestoneService;
window.CollaborationService = CollaborationService;

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

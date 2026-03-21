import authManager from '../core/auth-manager.js';

// Initialize Auth on load
(async () => {
    try {
        // IMPORTANT: Must initialize auth or getCurrentUser() will be empty/stale
        await authManager.init();
        console.log("AuthManager initialized successfully ✓");
        
        const user = authManager.getCurrentUser();
        const path = window.location.pathname;
        const isAuthPage = path.includes('signup') || path.includes('login');
        const isDashboardPage = path.includes('dashboard') || path.includes('admin-dashboard');
        
        console.log("InnovateHub Guard: Path:", path, "User:", user?.email, "IsAuth:", isAuthPage, "IsDashboard:", isDashboardPage);

        if (user) {
            const isComplete = authManager.isProfileComplete();
            console.log("InnovateHub Guard: Profile Complete:", isComplete, "Role:", user.role);

            // ONLY force redirect to signup if we are on a PROTECTED page (like the dashboard)
            // or if we are not on an auth page and the profile is clearly missing a role.
            if (!isComplete && isDashboardPage) {
                console.log("InnovateHub Guard: Redirecting incomplete profile away from dashboard.");
                window.location.href = 'signup.html?reason=incomplete_profile';
                return;
            }
        }

        // Listen for auth changes to update UI
        authManager.onAuthChange((user) => {
            console.log("InnovateHub: Auth state changed:", user?.email);
            if (window.updateNavbarUI) window.updateNavbarUI(user);
        });
        
        // Initial UI update from confirmed auth state
        if (window.updateNavbarUI) window.updateNavbarUI(authManager.getCurrentUser());
    } catch (e) {
        console.error("AuthManager initialization failed:", e);
    }
})();

/**
 * innovate-hub.js
 * Core platform services and legacy service wrappers.
 * Fully migrated to Supabase Auth.
 */

// Helper: get current user (sync-safe via localStorage)
function getCurrentAuthUser() {
    return authManager.getCurrentUser();
}

// Helper for Auth Redirection handled in dashboard scripts
export function requireAuth() {
    const user = authManager.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
    }
    return user;
}

// Global Exports for Module services
window.supabaseLogout = async function() {
    console.log("Supabase logout triggered from innovate-hub.js");
    try {
        if (window.supabase) {
            await window.supabase.auth.signOut();
        }
        localStorage.removeItem("innovateHubUser");
        localStorage.removeItem("justLoggedIn");
        sessionStorage.clear();
        if (typeof window.updateNavbarUI === 'function') window.updateNavbarUI(null);
        
        // Redirect to homepage so user lands on main page, not login page
        // Use replace() to prevent back-button from returning to the dashboard
        window.location.replace("index.html");
    } catch (error) {
        console.error("Logout error:", error);
        localStorage.removeItem("innovateHubUser");
        localStorage.removeItem("justLoggedIn");
        sessionStorage.clear();
        window.location.replace("index.html");
    }
};

// Backward compatibility alias (do NOT overwrite window.logout as shared-ui.js owns the authoritative version)
window.firebaseLogout = window.supabaseLogout;

// ========================================
// 14. SERVICES
// ========================================

// SERVICES
// ========================================

export const ProjectService = {
    submitProject: async (formData, file) => {
        const user = getCurrentAuthUser();
        if (!user) throw new Error("No authenticated user found.");

        let projectData = {
            innovator_id: user.uid,
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
                if (!sbProject || !sbProject.id) {
                    throw new Error("Failed to create project record in database.");
                }
                console.log("Supabase Project Created ✓", sbProject.id);
                
                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${sbProject.id}-${Date.now()}.${fileExt}`;
                    const filePath = `documents/${user.uid}/${fileName}`;

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
        const user = getCurrentAuthUser();
        const mentorshipData = {
            innovator_id: user?.uid,
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
        const user = getCurrentAuthUser();
        const reportData = {
            project_id: projectId,
            milestone_title: milestoneTitle,
            content,
            reported_by: user?.uid
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
        const user = getCurrentAuthUser();
        const commentData = {
            project_id: projectId,
            content,
            author_id: user?.uid
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

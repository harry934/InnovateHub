import { auth, db } from '../core/firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    updateDoc, 
    onSnapshot,
    serverTimestamp,
    addDoc,
    getDoc,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            this.currentUser = user;
            
            // Basic UI Setup
            this.updateUserDisplay();
            this.setupNotifications();
            
            // Initial Data Load
            await this.loadStats();
            await this.loadProjectReviews();
            
            // Make instance globally available for onclick handlers
            window.adminDashboard = this;
        });
    }

    updateUserDisplay() {
        const userDisplayName = document.getElementById('userDisplayName');
        const name = this.currentUser.displayName || this.currentUser.email.split('@')[0];
        if (userDisplayName) {
            userDisplayName.textContent = name;
        }

        // Refresh Profile Circle Initials
        if (window.StaggeredMenu && window.StaggeredMenu.updateInitials) {
            window.StaggeredMenu.updateInitials(name);
        }
    }

    setupNotifications() {
        if (typeof NotificationSystem !== 'undefined') {
            const notificationSystem = new NotificationSystem(this.currentUser.uid);
            notificationSystem.init('notificationBell');
        }
    }

    async loadStats() {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const projectsSnapshot = await getDocs(collection(db, 'projects'));
            const mentorsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'mentor')));
            const rejectionSnapshot = await getDocs(query(collection(db, 'mentorshipRequests'), where('status', '==', 'pending_admin_rejection')));
            
            // Basic Counts
            document.getElementById('totalUsers').textContent = usersSnapshot.size;
            document.getElementById('totalProjects').textContent = projectsSnapshot.size;
            document.getElementById('totalMentors').textContent = mentorsSnapshot.size;
            
            // Badge: Pending Projects
            const pendingProjectsCount = projectsSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
            document.getElementById('pendingProjects').textContent = pendingProjectsCount;

            // Badge: Pending Mentors (assuming they have a status or isApproved field)
            // If they are only 'mentors' after approval, then we might need to check 'pending_mentor' role or isApproved=false
            const pendingMentorsCount = usersSnapshot.docs.filter(doc => doc.data().role === 'mentor' && doc.data().isApproved === false).length;
            const pendingMentorsDisplay = document.getElementById('pendingMentors');
            if (pendingMentorsDisplay) pendingMentorsDisplay.textContent = pendingMentorsCount;

            // Badge: Pending Rejections
            const pendingRejectionsCount = rejectionSnapshot.size;
            const pendingRejectionsDisplay = document.getElementById('pendingRejections');
            if (pendingRejectionsDisplay) pendingRejectionsDisplay.textContent = pendingRejectionsCount;
            
            // Update active mentorships
            const mentorshipsSnapshot = await getDocs(collection(db, 'mentorshipRequests'));
            const activeMentorshipsCount = mentorshipsSnapshot.docs.filter(doc => doc.data().status === 'accepted').length;
            const activeMentorshipsDisplay = document.getElementById('activeMentorships');
            if (activeMentorshipsDisplay) activeMentorshipsDisplay.textContent = activeMentorshipsCount;

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadProjectReviews() {
        const container = document.getElementById('projectReviewsContainer');
        if (!container) return;
        
        container.innerHTML = EmptyStates.templates.loadingState();
        
        try {
            const q = query(collection(db, 'projects'), where('status', '==', 'pending'));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                container.innerHTML = EmptyStates.templates.noProjects();
                return;
            }
            
            container.innerHTML = '';
            snapshot.forEach(doc => {
                const project = { id: doc.id, ...doc.data() };
                const card = StructuredProjectCard.render(project, {
                    showActions: false,
                    isExpanded: true
                });
                
                container.innerHTML += `
                    <div class="mb-4 dashboard-card p-3 shadow-sm border-0">
                        ${card}
                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-success px-4" onclick="adminDashboard.reviewProject('${project.id}', 'approved')">
                                <i class="fa fa-check me-2"></i>Approve
                            </button>
                            <button class="btn btn-danger px-4" onclick="adminDashboard.reviewProject('${project.id}', 'rejected')">
                                <i class="fa fa-times me-2"></i>Reject
                            </button>
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            console.error('Error loading projects:', error);
            container.innerHTML = EmptyStates.templates.errorState('Failed to load projects');
        }
    }

    async reviewProject(projectId, status) {
        try {
            await updateDoc(doc(db, 'projects', projectId), { 
                status: status,
                reviewedAt: serverTimestamp()
            });
            
            // Notify user
            const projectDoc = await getDoc(doc(db, 'projects', projectId));
            const projectData = projectDoc.data();
            
            if (projectData && projectData.ownerId) {
                await addDoc(collection(db, "notifications"), {
                    userId: projectData.ownerId,
                    type: "project_status",
                    projectId: projectId,
                    message: `Your project "${projectData.title}" has been ${status}.`,
                    status: "unread",
                    createdAt: serverTimestamp()
                });
            }

            alert(`Project ${status} successfully!`);
            await this.loadProjectReviews();
            await this.loadStats();
        } catch (error) {
            console.error('Error reviewing project:', error);
            alert('Failed to update project: ' + error.message);
        }
    }

    showSection(sectionName) {
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.style.display = 'none';
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const section = document.getElementById(sectionName + 'Section');
        if (section) {
            section.style.display = 'block';
            const activeLink = document.querySelector(`.nav-link[onclick*="'${sectionName}'"]`);
            if (activeLink) activeLink.classList.add('active');
        }
        
        // Trigger specific loads
        if (sectionName === 'rejectionRequests') this.loadRejectionRequests();
        if (sectionName === 'users') this.loadUsers();
        if (sectionName === 'eventsManagement') {
            if (typeof window.loadAdminEvents === 'function') {
                window.loadAdminEvents();
            }
        }
        if (sectionName === 'mentorshipPairings') {
            if (window.AdminPanel && window.AdminPanel.renderMentorshipsTable) {
                window.AdminPanel.renderMentorshipsTable();
            }
        }
    }

    async loadRejectionRequests() {
        const container = document.getElementById('rejectionRequestsContainer');
        if (!container) return;
        
        container.innerHTML = EmptyStates.templates.loadingState();
        
        try {
            const q = query(collection(db, 'mentorshipRequests'), where('status', '==', 'pending_admin_rejection'));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                container.innerHTML = `<div class="text-center p-5 text-muted"> <i class="fa fa-check-circle fa-3x mb-3 text-success d-block"></i> No pending rejection requests.</div>`;
                return;
            }
            
            container.innerHTML = '';
            for (const docSnapshot of snapshot.docs) {
                const req = { id: docSnapshot.id, ...docSnapshot.data() };
                
                // Fetch mentor and mentee details
                const mentorDoc = await getDoc(doc(db, "users", req.mentorId));
                const innovatorDoc = await getDoc(doc(db, "users", req.innovatorId));
                const projectDoc = await getDoc(doc(db, "projects", req.projectId));
                
                const mentorName = mentorDoc.exists() ? mentorDoc.data().fullName : 'Unknown Mentor';
                const innovatorName = innovatorDoc.exists() ? innovatorDoc.data().fullName : 'Unknown Innovator';
                const projectTitle = projectDoc.exists() ? projectDoc.data().title : 'Unknown Project';

                container.innerHTML += `
                    <div class="dashboard-card mb-3 p-4 border-start border-danger border-4">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="mb-1">Rejection Request: ${projectTitle}</h5>
                                <p class="mb-2 text-muted small">Requested by Mentor: <strong>${mentorName}</strong> | Mentee: <strong>${innovatorName}</strong></p>
                                <div class="bg-light p-3 rounded mb-3">
                                    <strong>Reason for Rejection:</strong><br>
                                    <span class="text-dark">${req.rejectionReason || 'No reason provided'}</span>
                                </div>
                            </div>
                            <span class="badge bg-danger">Pending Review</span>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-danger px-3" onclick="adminDashboard.handleRejectionApproval('${req.id}', true)">
                                <i class="fa fa-check-circle me-1"></i>Approve Rejection
                            </button>
                            <button class="btn btn-sm btn-outline-secondary px-3" onclick="adminDashboard.handleRejectionApproval('${req.id}', false)">
                                <i class="fa fa-times-circle me-1"></i>Deny & Resume
                            </button>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading rejection requests:', error);
            container.innerHTML = `<div class="alert alert-danger">Error loading requests: ${error.message}</div>`;
        }
    }

    async handleRejectionApproval(requestId, approved) {
        if (!confirm(`Are you sure you want to ${approved ? 'approve' : 'deny'} this rejection request?`)) return;

        try {
            const { updateDoc, doc, db, addDoc, collection, serverTimestamp, getDoc } = await import('../core/firebase-config.js');
            
            const reqRef = doc(db, "mentorshipRequests", requestId);
            const reqDoc = await getDoc(reqRef);
            const reqData = reqDoc.data();

            if (approved) {
                // Terminate mentorship
                await updateDoc(reqRef, {
                    status: "rejected",
                    adminAction: "approved_rejection",
                    adminActionAt: serverTimestamp()
                });

                // Notify both
                const msg = `The mentorship session for project "${requestId}" has been terminated by the mentor (Admin Approved).`;
                await this.sendNotification(reqData.mentorId, "mentorship_terminated", msg);
                await this.sendNotification(reqData.innovatorId, "mentorship_terminated", msg);
            } else {
                // Reset to active
                await updateDoc(reqRef, {
                    status: "accepted",
                    adminAction: "denied_rejection",
                    adminActionAt: serverTimestamp()
                });

                // Notify mentor
                await this.sendNotification(reqData.mentorId, "mentorship_rejection_denied", "Your request to stop mentorship was denied by the admin. Please continue the session.");
            }

            alert(`Rejection request ${approved ? 'approved' : 'denied'} successfully.`);
            this.loadRejectionRequests();
            this.loadStats();
        } catch (error) {
            console.error("Error handling rejection approval:", error);
            alert("Error: " + error.message);
        }
    }

    async sendNotification(userId, type, message) {
        await addDoc(collection(db, "notifications"), {
            userId: userId,
            type: type,
            message: message,
            status: "unread",
            createdAt: serverTimestamp()
        });
    }

    async loadUsers() {
        const container = document.getElementById('usersContainer');
        if (!container) return;
        
        container.innerHTML = EmptyStates.templates.loadingState();
        
        try {
            const snapshot = await getDocs(collection(db, 'users'));
            if (snapshot.empty) {
                container.innerHTML = 'No users found.';
                return;
            }
            
            let html = `
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="bg-light">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            snapshot.forEach(doc => {
                const user = { id: doc.id, ...doc.data() };
                const isRevoked = user.isRevoked || false;
                html += `
                    <tr>
                        <td>${user.fullName || 'No Name'}</td>
                        <td>${user.email}</td>
                        <td><span class="badge bg-info text-dark">${user.role}</span></td>
                        <td>
                            <span class="badge ${isRevoked ? 'bg-danger' : 'bg-success'}">
                                ${isRevoked ? 'Revoked' : 'Active'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm ${isRevoked ? 'btn-success' : 'btn-outline-danger'}" 
                                onclick="adminDashboard.toggleUserAccess('${user.id}', ${isRevoked})">
                                ${isRevoked ? 'Restore Access' : 'Revoke Access'}
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += `</tbody></table></div>`;
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading users:', error);
            container.innerHTML = 'Error loading users.';
        }
    }

    async toggleUserAccess(userId, currentlyRevoked) {
        const action = currentlyRevoked ? 'restore' : 'revoke';
        if (!confirm(`Are you sure you want to ${action} access for this user?`)) return;

        try {
            await updateDoc(doc(db, 'users', userId), {
                isRevoked: !currentlyRevoked,
                accessUpdatedAt: serverTimestamp()
            });
            alert(`User access ${action}d!`);
            this.loadUsers();
        } catch (error) {
            console.error(`Error ${action}ing user access:`, error);
            alert('Error updating user access.');
        }
    }

    async logout() {
        try {
            await auth.signOut();
            localStorage.removeItem('innovateHubUser');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'login.html';
        }
    }
}

// Global functions for onclick
window.logout = () => window.adminDashboard.logout();
window.showSection = (sectionName) => window.adminDashboard.showSection(sectionName);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});

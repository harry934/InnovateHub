// Auto-extracted from innovator-dashboard.html
import { auth, db } from '../core/firebase-config.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import NotificationSystem from '../components/notification-system.js';
import StructuredProjectCard from '../components/project-card-structured.js?v=8.0.0';
import MentorProfileCard from '../components/mentor-profile-card.js';
import EmptyStates from '../components/empty-states.js';
import AutoSaveManager from '../utils/auto-save-manager.js';
// Note: ProjectService is exposed via window.ProjectService by innovate-hub.js

// ─── Custom SVG icons per card ───────────────────────────────
const CARD_ICONS = {
    projects: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="10" width="32" height="24" rx="3" stroke="currentColor" stroke-width="2"/>
        <path d="M4 16h32" stroke="currentColor" stroke-width="2"/>
        <path d="M4 10l6-6h8l2 6" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M13 22h14M13 28h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    submit: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4C13.4 4 8 9.4 8 16c0 4.2 2.1 7.9 5.3 10.1V30h13.4v-3.9C29.9 23.9 32 20.2 32 16c0-6.6-5.4-12-12-12z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M14 34h12M16 37h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M20 10v8M16 14l4-4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    mentors: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="2"/>
        <circle cx="20" cy="20" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M20 5v4M20 31v4M5 20h4M31 20h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M9.4 9.4l2.8 2.8M27.8 27.8l2.8 2.8M9.4 30.6l2.8-2.8M27.8 12.2l2.8-2.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    myMentors: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="13" cy="13" r="6" stroke="currentColor" stroke-width="2"/>
        <path d="M3 34c0-6.6 4.5-11 10-11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="28" cy="13" r="6" stroke="currentColor" stroke-width="2"/>
        <path d="M37 34c0-6.6-4.5-11-10-11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M20 25c-3 0-7 2-7 6h14c0-4-4-6-7-6z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="20" cy="18" r="4" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    profile: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M20 4v4M20 32v4M4 20h4M32 20h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7.5 7.5l2.8 2.8M29.7 29.7l2.8 2.8M7.5 32.5l2.8-2.8M29.7 10.3l2.8-2.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="20" cy="20" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2"/>
    </svg>`
};

const dashboardCards = [
    { title: 'My Projects',      id: 'projects',  section: 'projects',  types: ['Manage', 'Track'], progress: 85, action: 'view' },
    { title: 'Submit Project',   id: 'submit',    section: 'submit',    types: ['Innovate', 'Launch'], progress: 0, action: 'plus' },
    { title: 'Find Mentors',     id: 'mentors',   section: 'mentors',   types: ['Connect', 'Experts'], progress: 40, action: 'search' },
    { title: 'My Mentors',       id: 'myMentors', section: 'myMentors', types: ['Assigned', 'Requests'], progress: 60, action: 'chat' },
    { title: 'Account Settings', id: 'profile',   section: 'profile',   types: ['Profile', 'Settings'], progress: 95, action: 'edit' }
];

function renderQuickAccessCards() {
    const container = document.getElementById('dashboardCardsGrid');
    if (!container) return;

    // Vibrant color accents for cards
    const cardColors = {
        projects: '#1a5e4f',
        submit: '#f3a813',
        mentors: '#4A90E2',
        myMentors: '#9B51E0',
        profile: '#121331'
    };

    container.innerHTML = dashboardCards.map(card => `
        <article class="dashboard-grid-card premium-card premium-card-large" onclick="window.showDashboardSection('${card.section}')" style="cursor: pointer;">
          <div class="card-glow" style="background: ${cardColors[card.id] || 'var(--brand-green)'};"></div>
          <div class="card-icon-wrapper" style="background: ${cardColors[card.id]}15; color: ${cardColors[card.id]};">
            ${CARD_ICONS[card.id] || ''}
          </div>
          <div class="card-content">
            <div class="card-header">
              <h3 class="card-title fw-bold" style="color: ${cardColors[card.id]};">${card.title}</h3>
              <div class="card-action-icon" style="background: ${cardColors[card.id]}20;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${cardColors[card.id]}" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
            <div class="card-tags mt-2">
              ${card.types.map(t => `<span class="badge rounded-pill px-3 py-2" style="background: ${cardColors[card.id]}10; color: ${cardColors[card.id]}; font-weight: 700; font-size: 0.75rem;">${t}</span>`).join('')}
            </div>
          </div>
        </article>
    `).join('');
}


        let currentUser = null;
        let autoSave = null;
        
        // Export init function for dashboard.html
        export async function initDashboard(user, userData) {
            console.log("Innovator Dashboard: Initializing with provided data...");
            currentUser = user;
            
            // Render cards immediately
            renderQuickAccessCards();
            
            try {
                await initializeDashboard(userData);
            } catch (err) {
                console.error("Critical Dashboard Init Error:", err);
                if(typeof window.showDashboardSection === 'function') window.showDashboardSection('projects');
            }
        }
        
        async function initializeDashboard(userData = null) {
            // UI elements
            const userDisplayName = document.getElementById('userDisplayName');
            const profileDisplayNameDisplay = document.getElementById('profileDisplayNameDisplay');
            const profilePreview = document.getElementById('profilePreview');

            // Default display name
            const initialName = currentUser.displayName || currentUser.email.split('@')[0];
            
            // If userData isn't provided, fetch it (fallback)
            let data = userData;
            if (!data) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) data = userDoc.data();
                } catch (err) {
                    console.error("Error fetching user doc in fallback:", err);
                }
            }

            // Sync UI with data
            const realName = (data && data.fullName) || initialName;
            const firstName = realName.split(' ')[0];
            
            if (document.getElementById('dashboardGreeting')) {
                document.getElementById('dashboardGreeting').textContent = `Welcome, ${firstName}!`;
            }

            if (userDisplayName) userDisplayName.textContent = realName;
            if (profileDisplayNameDisplay) profileDisplayNameDisplay.textContent = realName;

            // Refresh Profile Circle Initials
            if (window.StaggeredMenu && window.StaggeredMenu.updateInitials) {
                console.log(`Innovator Dashboard: Updating initials with name "${realName}"`);
                window.StaggeredMenu.updateInitials(realName);
            }

            if (data) {
                if (document.getElementById('profileName')) document.getElementById('profileName').value = data.fullName || '';
                if (document.getElementById('profileBio')) document.getElementById('profileBio').value = data.bio || '';
                if (document.getElementById('profileInstitution')) document.getElementById('profileInstitution').value = data.institution || '';
                if (document.getElementById('profileSkills')) document.getElementById('profileSkills').value = (data.skills || []).join(', ');
                if (document.getElementById('profileInterests')) document.getElementById('profileInterests').value = (data.interests || []).join(', ');
                
                if (data.photoURL && profilePreview) {
                    profilePreview.src = data.photoURL;
                    if (window.StaggeredMenu && window.StaggeredMenu.updatePhoto) {
                        window.StaggeredMenu.updatePhoto(data.photoURL);
                    }
                }

                // Render skills badges
                const skillsContainer = document.getElementById('skillsBadgeContainer');
                if (skillsContainer && data.skills) {
                    skillsContainer.innerHTML = data.skills.map(s => `<span class="badge bg-primary-soft text-primary p-2">${s}</span>`).join('');
                }
            }

            if (document.getElementById('profileEmail')) document.getElementById('profileEmail').value = currentUser.email;

            // Initialize notification system
            try {
                const notificationSystem = new NotificationSystem(currentUser.uid);
                notificationSystem.init('notificationBell');
                notificationSystem.bindFullList('notificationsPageList');
            } catch (err) {
                console.warn("Notification system init failed:", err);
            }
            
            // Load projects
            await loadProjects();
            
            // Mentors are loaded automatically by dashboard.html's showDashboardSection("mentors")
            // which calls MentorDiscovery.init() instead.

            // Initialize CardNav
            const navItems = [
                { 
                    label: 'Projects', 
                    bgColor: '#1a5e4f', 
                    textColor: '#fff', 
                    links: [
                        { label: 'My Projects', href: 'javascript:showDashboardSection("projects")' }, 
                        { label: 'Submit New', href: 'javascript:showDashboardSection("submit")' }
                    ] 
                },
                { 
                    label: 'Mentors', 
                    bgColor: '#f3a813', 
                    textColor: '#000', 
                    links: [
                        { label: 'Find Mentors', href: 'javascript:showDashboardSection("mentors")' }, 
                        { label: 'My Mentors', href: 'javascript:showDashboardSection("myMentors")' }
                    ] 
                },
                { 
                    label: 'Account', 
                    bgColor: '#121331', 
                    textColor: '#fff', 
                    links: [
                        { label: 'My Profile', href: 'javascript:showDashboardSection("profile")' }, 
                        { label: 'Notifications', href: 'javascript:showDashboardSection("notifications")' }
                    ] 
                }
            ];

            /* CardNav removed in favor of standard navbar + landing cards */

            // renderQuickAccessCards(); // Moved to top of script for immediate rendering
            
            // Initialize auto-save for project form
            try {
                autoSave = new AutoSaveManager('projectForm', currentUser.uid, 'project');
                await autoSave.init();
            } catch (err) {
                console.warn("AutoSave init failed:", err);
            }
            
            // Setup form submission
            const projectForm = document.getElementById('projectForm');
            if (projectForm) projectForm.addEventListener('submit', handleProjectSubmit);
            
            const profileForm = document.getElementById('profileForm');
            if (profileForm) profileForm.addEventListener('submit', handleProfileUpdate);
            
            // Filter Pills Handling & Search Input is handled exclusively by mentor-discovery.js

            // Profile Picture Upload Handling
            const profilePicInput = document.getElementById('profilePicInput');
            if (profilePicInput) {
                profilePicInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        const preview = document.getElementById('profilePreview');
                        if (preview) preview.src = re.target.result;
                    };
                    reader.readAsDataURL(file);
                    
                    const preview = document.getElementById('profilePreview');
                    if (preview) preview.style.opacity = '0.5';

                    try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${currentUser.uid}-${Date.now()}.${fileExt}`;
                        const filePath = `avatars/${fileName}`;

                        const { data, error } = await window.supabase.storage
                            .from('project-documents')
                            .upload(filePath, file);

                        if (error) throw error;

                        const { data: { publicUrl } } = window.supabase.storage
                            .from('project-documents')
                            .getPublicUrl(filePath);

                        const photoURL = publicUrl;
                        
                        const { updateProfile } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
                        await updateProfile(currentUser, { photoURL });
                        
                        await updateDoc(doc(db, "users", currentUser.uid), { 
                            photoURL, 
                            updatedAt: serverTimestamp() 
                        });
                        
                        alert('Profile picture updated!');
                    } catch (err) {
                        console.error("Profile pic upload failed:", err);
                        alert('Failed to update profile picture: ' + err.message);
                    } finally {
                        if (preview) preview.style.opacity = '1';
                    }
                });
            }
        }
        
        async function loadProjects() {
            const container = document.getElementById('projectsContainer');
            if (!container) return;
            container.innerHTML = EmptyStates.templates.loadingState();
            
            try {
                const q = query(collection(db, 'projects'), where('innovatorId', '==', currentUser.uid));
                const snapshot = await getDocs(q);
                
                if (snapshot.empty) {
                    container.innerHTML = EmptyStates.templates.noProjects();
                    return;
                }
                
                container.innerHTML = '';
                snapshot.forEach(doc => {
                    const project = { id: doc.id, ...doc.data() };
                    container.innerHTML += StructuredProjectCard.render(project, {
                        showActions: true,
                        isExpanded: false
                    });
                });
            } catch (error) {
                console.error('Error loading projects:', error);
                container.innerHTML = EmptyStates.templates.errorState('Failed to load projects');
            }
        }
        
        window.renderMyMentors = async function() {
            const container = document.getElementById('myMentorsContainer');
            if (!container) return;
            container.innerHTML = EmptyStates.templates.loadingState();
            
            try {
                const q = query(collection(db, 'mentorshipRequests'), where('innovatorId', '==', currentUser.uid), where('status', '==', 'accepted'));
                const snapshot = await getDocs(q);
                
                if (snapshot.empty) {
                    container.innerHTML = `
                        <div class="text-center py-5">
                            <div class="mb-3 opacity-25">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                            <h5>No active mentors yet</h5>
                            <p class="text-muted">Once your mentorship requests are accepted, they'll appear here.</p>
                            <button class="btn btn-primary rounded-pill px-4 mt-2" onclick="window.showDashboardSection('mentors')">Find a Mentor</button>
                        </div>
                    `;
                    return;
                }
                
                container.innerHTML = '<div class="row g-4"></div>';
                const row = container.querySelector('.row');
                
                for (const docSnap of snapshot.docs) {
                    const req = { id: docSnap.id, ...docSnap.data() };
                    
                    // Safety check for mentorId
                    if (!req.mentorId) {
                        console.warn(`Mentorship request ${req.id} is missing mentorId.`, req);
                        continue;
                    }

                    try {
                        const mentorDoc = await getDoc(doc(db, "users", req.mentorId));
                        const mentor = mentorDoc.exists() ? mentorDoc.data() : { fullName: 'Unknown Mentor' };
                        
                        let projectTitle = 'General Mentorship';
                        if (req.projectId) {
                            const projectDoc = await getDoc(doc(db, "projects", req.projectId));
                            projectTitle = projectDoc.exists() ? projectDoc.data().title : 'Unknown Project';
                        }
                        
                        const firstName = mentor.fullName ? mentor.fullName.split(' ')[0] : 'Mentor';
                        const mentorPhoto = mentor.photoURL || 'assets/img/default-avatar.png';
                        
                        row.innerHTML += `
                            <div class="col-md-6 col-lg-4">
                                <article class="dashboard-card premium-card hover-lift h-100 p-4 d-flex flex-column" onclick="window.CollaborationHub.init('${req.id}')" style="cursor: pointer;">
                                    <div class="card-glow" style="background: var(--brand-yellow);"></div>
                                    <div class="d-flex align-items-center gap-3 mb-4 position-relative z-1">
                                        <div class="position-relative">
                                            <img src="${mentorPhoto}" class="rounded-circle shadow-sm border border-2 border-white" style="width: 56px; height: 56px; object-fit: cover;">
                                            <div class="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white" style="width: 14px; height: 14px;"></div>
                                        </div>
                                        <div>
                                            <h6 class="fw-bold mb-0 text-dark">${firstName}</h6>
                                            <p class="text-muted smaller mb-0 fw-bold text-uppercase opacity-75" style="letter-spacing: 0.5px;">${mentor.profession || 'Expert'}</p>
                                        </div>
                                    </div>
                                    <div class="position-relative z-1 flex-grow-1">
                                        <div class="small text-muted mb-1 text-uppercase fw-bold opacity-75" style="font-size: 0.65rem;">Mentorship Focus</div>
                                        <h5 class="fw-bold text-primary mb-3" style="font-family: var(--font-head);">${projectTitle}</h5>
                                    </div>
                                    <div class="mt-auto pt-3 border-top position-relative z-1 d-flex justify-content-between align-items-center">
                                         <div class="small fw-bold text-muted d-flex align-items-center gap-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                            Active Hub
                                        </div>
                                        <button class="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-sm">
                                            Open Hub
                                        </button>
                                    </div>
                                </article>
                            </div>
                        `;
                    } catch (innerError) {
                        console.error(`Error rendering individual mentor card (${req.id}):`, innerError);
                    }
                }
            } catch (error) {
                console.error('Error loading my mentors:', error);
                container.innerHTML = EmptyStates.templates.errorState('Failed to load mentors');
            }
        };
        
        async function handleProjectSubmit(e) {
            e.preventDefault();
            const form = e.target;
            const submitBtn = form.querySelector('button[type="submit"]');
            
            const categories = Array.from(form.querySelectorAll('input[name="categories"]:checked'))
                .map(cb => cb.value);
            
            if (categories.length === 0) {
                alert('Please select at least one category.');
                return;
            }

            const fileInput = form.querySelector('input[name="document"]');
            const file = fileInput.files ? fileInput.files[0] : null;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i>Submitting...';

            const projectData = {
                innovatorId: currentUser.uid,
                userId: currentUser.uid,
                title: form.title.value,
                categories: categories,
                problemStatement: form.problemStatement.value,
                objectives: form.objectives.value,
                proposedSolution: form.proposedSolution.value,
                expectedImpact: form.expectedImpact.value
            };
            
            try {
                await (window.ProjectService || ProjectService).submitProject(projectData, file);
                alert('Project submitted successfully!');
                form.reset();
                if (autoSave) await autoSave.clearDraft();
                window.showDashboardSection('projects');
                await loadProjects();
            } catch (error) {
                console.error('Error submitting project:', error);
                alert('Failed to submit project: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Submit Project';
            }
        }

        async function handleProfileUpdate(e) {
            e.preventDefault();
            const form = e.target;
            const submitBtn = form.querySelector('button[type="submit"]');
            
            submitBtn.disabled = true;
            
            const skills = form.skills.value.split(',').map(s => s.trim()).filter(s => s !== '');
            const profileData = {
                fullName: form.fullName.value,
                bio: form.bio.value,
                institution: form.institution.value,
                skills: skills,
                interests: form.interests.value,
                updatedAt: serverTimestamp()
            };

            try {
                await updateDoc(doc(db, "users", currentUser.uid), profileData);
                
                // Update local storage if needed (optional, but keep consistent)
                const storedUser = JSON.parse(localStorage.getItem('innovateHubUser') || '{}');
                storedUser.fullName = profileData.fullName;
                localStorage.setItem('innovateHubUser', JSON.stringify(storedUser));

                alert('Profile updated!');
                await initializeDashboard();
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile.');
            } finally {
                submitBtn.disabled = false;
            }
        }

        window.confirmDeleteProject = async function(projectId) {
            if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return;

            try {
                // Fetch the project first to get the Supabase file path (if any)
                const { deleteDoc, doc: fsDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                const snap = await getDoc(fsDoc(db, "projects", projectId));
                const projectData = snap.exists() ? snap.data() : {};

                // 1. Delete file from Supabase Storage if applicable
                if (projectData.fileStoragePath && projectData.fileStorageType === 'supabase' && window.supabase) {
                    const { error } = await window.supabase.storage
                        .from('project-documents')
                        .remove([projectData.fileStoragePath]);
                    if (error) console.warn('Could not remove Supabase file:', error.message);
                }

                // 2. Delete Firestore document
                await deleteDoc(fsDoc(db, "projects", projectId));

                alert('Project deleted successfully.');
                await loadProjects();
            } catch (error) {
                console.error('Error deleting project:', error);
                alert('Failed to delete project: ' + error.message);
            }
        };

        // ── EDIT PROJECT ─────────────────────────────────────────────
        window.editProject = async function(projectId) {
            const { doc: fsDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const snap = await getDoc(fsDoc(db, "projects", projectId));
            if (!snap.exists()) return alert('Project not found.');
            const p = snap.data();

            const overlay = document.createElement('div');
            overlay.className = 'ihub-modal-overlay';
            overlay.id = 'editProjectModal';
            overlay.innerHTML = `
                <div class="ihub-modal">
                    <div class="ihub-modal__header">
                        <h3 class="ihub-modal__title">✏️ Edit Project</h3>
                        <button class="ihub-modal__close" onclick="document.getElementById('editProjectModal').remove()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <div class="ihub-form-group"><label>Project Title</label><input id="epTitle" value="${p.title || ''}"></div>
                    <div class="ihub-form-group"><label>Problem Statement</label><textarea id="epProblem" rows="3">${p.problemStatement || ''}</textarea></div>
                    <div class="ihub-form-group"><label>Objectives</label><textarea id="epObjectives" rows="3">${p.objectives || ''}</textarea></div>
                    <div class="ihub-form-group"><label>Proposed Solution</label><textarea id="epSolution" rows="3">${p.proposedSolution || ''}</textarea></div>
                    <div class="ihub-form-group"><label>Expected Impact</label><textarea id="epImpact" rows="3">${p.expectedImpact || ''}</textarea></div>
                    <button class="ihub-btn-primary" onclick="window._saveProjectEdit('${projectId}')">Save Changes</button>
                </div>`;
            document.body.appendChild(overlay);
        };

        window._saveProjectEdit = async function(projectId) {
            const btn = document.querySelector('#editProjectModal .ihub-btn-primary');
            btn.disabled = true; btn.textContent = 'Saving...';
            try {
                await updateDoc(doc(db, 'projects', projectId), {
                    title: document.getElementById('epTitle').value,
                    problemStatement: document.getElementById('epProblem').value,
                    objectives: document.getElementById('epObjectives').value,
                    proposedSolution: document.getElementById('epSolution').value,
                    expectedImpact: document.getElementById('epImpact').value,
                    updatedAt: serverTimestamp()
                });
                document.getElementById('editProjectModal').remove();
                alert('Project updated!');
                await loadProjects();
            } catch (e) {
                alert('Failed to update: ' + e.message);
                btn.disabled = false; btn.textContent = 'Save Changes';
            }
        };

        // ── ADD MILESTONE ────────────────────────────────────────────
        window.showAddMilestone = function(projectId) {
            const overlay = document.createElement('div');
            overlay.className = 'ihub-modal-overlay';
            overlay.id = 'addMilestoneModal';
            overlay.innerHTML = `
                <div class="ihub-modal">
                    <div class="ihub-modal__header">
                        <h3 class="ihub-modal__title">🏁 Add Milestone</h3>
                        <button class="ihub-modal__close" onclick="document.getElementById('addMilestoneModal').remove()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <div class="ihub-form-group"><label>Milestone Title</label><input id="msTitle" placeholder="e.g. Prototype Completed"></div>
                    <div class="ihub-form-group"><label>Description</label><textarea id="msDesc" rows="3" placeholder="What was achieved?"></textarea></div>
                    <div class="ihub-form-group"><label>Status</label>
                        <select id="msStatus">
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div class="ihub-form-group"><label>Target Date (optional)</label><input id="msDate" type="date"></div>
                    <button class="ihub-btn-primary" onclick="window._saveMilestone('${projectId}')">Add Milestone</button>
                </div>`;
            document.body.appendChild(overlay);
        };

        window._saveMilestone = async function(projectId) {
            const title = document.getElementById('msTitle').value.trim();
            if (!title) return alert('Please enter a milestone title.');
            const btn = document.querySelector('#addMilestoneModal .ihub-btn-primary');
            btn.disabled = true; btn.textContent = 'Saving...';
            try {
                await addDoc(collection(db, 'milestones'), {
                    projectId, title,
                    description: document.getElementById('msDesc').value,
                    status: document.getElementById('msStatus').value,
                    targetDate: document.getElementById('msDate').value || null,
                    innovatorId: currentUser.uid,
                    createdAt: serverTimestamp()
                });
                document.getElementById('addMilestoneModal').remove();
                alert('Milestone added!');
            } catch (e) {
                alert('Failed to save milestone: ' + e.message);
                btn.disabled = false; btn.textContent = 'Add Milestone';
            }
        };

        // ── VIEW MILESTONES ──────────────────────────────────────────
        window.viewMilestones = async function(projectId) {
            const overlay = document.createElement('div');
            overlay.className = 'ihub-modal-overlay';
            overlay.id = 'viewMilestonesModal';
            overlay.innerHTML = `
                <div class="ihub-modal">
                    <div class="ihub-modal__header">
                        <h3 class="ihub-modal__title">📋 Milestones</h3>
                        <button class="ihub-modal__close" onclick="document.getElementById('viewMilestonesModal').remove()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <div id="milestonesListContainer"><div class="text-center py-3"><i class="fa fa-spinner fa-spin"></i> Loading...</div></div>
                    <button class="ihub-btn-primary mt-3" onclick="document.getElementById('viewMilestonesModal').remove(); showAddMilestone('${projectId}')">+ Add New Milestone</button>
                </div>`;
            document.body.appendChild(overlay);

            try {
                const { getDocs: gd, collection: col, query: q, where: wh } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                const snap = await gd(q(col(db, 'milestones'), wh('projectId', '==', projectId)));
                const container = document.getElementById('milestonesListContainer');
                if (snap.empty) {
                    container.innerHTML = '<p class="text-muted text-center">No milestones yet. Add your first one!</p>';
                    return;
                }
                const statusClass = { completed: 'status-completed', 'in-progress': 'status-in-progress', pending: 'status-pending' };
                container.innerHTML = snap.docs.map(d => {
                    const m = d.data();
                    return `<div class="ihub-milestone-item">
                        <div>
                            <div class="ihub-milestone-item__title">${m.title}</div>
                            <div class="ihub-milestone-item__desc">${m.description || ''}</div>
                        </div>
                        <span class="ihub-milestone-item__status ${statusClass[m.status] || 'status-pending'}">${m.status}</span>
                    </div>`;
                }).join('');
            } catch (e) {
                document.getElementById('milestonesListContainer').innerHTML = '<p class="text-danger">Failed to load milestones.</p>';
            }
        };

        // ── ADD REPORT ───────────────────────────────────────────────
        window.showAddReport = function(projectId) {
            const overlay = document.createElement('div');
            overlay.className = 'ihub-modal-overlay';
            overlay.id = 'addReportModal';
            overlay.innerHTML = `
                <div class="ihub-modal">
                    <div class="ihub-modal__header">
                        <h3 class="ihub-modal__title">📝 Add Progress Report</h3>
                        <button class="ihub-modal__close" onclick="document.getElementById('addReportModal').remove()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <div class="ihub-form-group"><label>Report Title</label><input id="rpTitle" placeholder="e.g. Week 3 Progress Update"></div>
                    <div class="ihub-form-group"><label>Summary</label><textarea id="rpSummary" rows="4" placeholder="What progress have you made?"></textarea></div>
                    <div class="ihub-form-group"><label>Challenges Faced</label><textarea id="rpChallenges" rows="3" placeholder="Any blockers or issues?"></textarea></div>
                    <div class="ihub-form-group"><label>Next Steps</label><textarea id="rpNext" rows="3" placeholder="What's planned next?"></textarea></div>
                    <button class="ihub-btn-primary" onclick="window._saveReport('${projectId}')">Submit Report</button>
                </div>`;
            document.body.appendChild(overlay);
        };

        window._saveReport = async function(projectId) {
            const title = document.getElementById('rpTitle').value.trim();
            if (!title) return alert('Please enter a report title.');
            const btn = document.querySelector('#addReportModal .ihub-btn-primary');
            btn.disabled = true; btn.textContent = 'Submitting...';
            try {
                await addDoc(collection(db, 'reports'), {
                    projectId, title,
                    summary: document.getElementById('rpSummary').value,
                    challenges: document.getElementById('rpChallenges').value,
                    nextSteps: document.getElementById('rpNext').value,
                    innovatorId: currentUser.uid,
                    createdAt: serverTimestamp()
                });
                document.getElementById('addReportModal').remove();
                alert('Report submitted!');
            } catch (e) {
                alert('Failed to submit report: ' + e.message);
                btn.disabled = false; btn.textContent = 'Submit Report';
            }
        };

        function debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }
        
        window.requestMentorship = async function(mentorId) {
            try {
                // Fetch projects to select from
                const q = query(collection(db, 'projects'), where('innovatorId', '==', currentUser.uid));
                const snapshot = await getDocs(q);
                
                if (snapshot.empty) {
                    alert('Please submit a project first before requesting mentorship. Go to "Submit Project" section.');
                    if (typeof showSection === 'function') showSection('submit-project');
                    return;
                }
                
                let projectId = snapshot.docs[0].id;
                
                // If multiple projects, ask which one
                if (snapshot.size > 1) {
                    const projects = snapshot.docs.map(d => ({id: d.id, title: d.data().title}));
                    const projectList = projects.map((p, i) => `${i+1}. ${p.title}`).join('\n');
                    const choice = prompt(`Which project is this mentorship for?\n\n${projectList}\n\nEnter number (default 1):`, '1');
                    
                    if (choice === null) return; // User cancelled
                    
                    const index = parseInt(choice) - 1;
                    if (projects[index]) {
                        projectId = projects[index].id;
                    }
                }

                if (typeof MentorshipService !== 'undefined' && MentorshipService.sendRequest) {
                    await MentorshipService.sendRequest(mentorId, projectId);
                } else {
                    // Fallback for direct addDoc if service missing
                    await addDoc(collection(db, 'mentorshipRequests'), {
                        innovatorId: currentUser.uid,
                        mentorId: mentorId,
                        projectId: projectId,
                        status: 'pending',
                        createdAt: serverTimestamp()
                    });
                }
                
                alert('Mentorship request sent successfully!');
            } catch (error) {
                console.error('Error sending request:', error);
                alert('Failed to send request: ' + error.message);
            }
        };

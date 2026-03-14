// Auto-extracted from innovator-dashboard.html
import { auth, db } from '../core/firebase-config.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import NotificationSystem from '../components/notification-system.js';
import StructuredProjectCard from '../components/project-card-structured.js';
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

// ─── Card config: title, section, colour theme, icon, subtitle ─
const dashboardCards = [
    {
        title: 'My Projects',
        section: 'projects',
        subtitle: 'Manage and scale your projects',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
    },
    {
        title: 'Submit a Project',
        section: 'submit',
        subtitle: 'Submit your next big idea',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3"></path><path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5"></path></svg>`,
    },
    {
        title: 'Find Mentors',
        section: 'mentors',
        subtitle: 'Access the USIU-A Global Mentor Network',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>`,
    },
    {
        title: 'My Mentors',
        section: 'myMentors',
        subtitle: 'Collaborate with your advisors',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    },
    {
        title: 'Account Settings',
        section: 'profile',
        subtitle: 'System and account controls',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    }
];


// ─── Enhanced background symbol system ───────────────────────
function initBackgroundSymbols() {
    console.log("Legacy background symbols disabled in favor of LiveCanvas.");
}

function renderQuickAccessCards() {
    const container = document.getElementById('dashboardCardsGrid');
    if (!container) return;

    container.innerHTML = dashboardCards.map((card, i) => {
        // Add tags based on section
        let tags = [];
        if (card.section === 'projects') tags = ['Lab', 'Active'];
        else if (card.section === 'submit') tags = ['Launch', 'New'];
        else if (card.section === 'mentors') tags = ['Connect', 'Pro'];
        else if (card.section === 'myMentors') tags = ['Board', 'Me'];
        else if (card.section === 'profile') tags = ['Admin', 'Account'];

        return `
        <article
            class="dash-nav-card"
            style="animation-delay:${i * 0.1}s"
            onclick="window.showDashboardSection('${card.section}')"
            tabindex="0"
            role="button"
        >
            <div class="dnc-icon">
                ${card.icon}
            </div>
            <div class="dnc-content">
                <h3 class="dnc-title">${card.title}</h3>
                <p class="dnc-desc">${card.subtitle}</p>
                <div class="card-tags">
                    ${tags.map(t => `<span class="card-tag">• ${t}</span>`).join('')}
                </div>
            </div>
            <div class="dnc-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </div>
            <div class="dash-nav-card-bottom-line"></div>
        </article>
    `; }).join('');
}


        let currentUser = null;
        let autoSave = null;
        
        // Export init function for dashboard.html
        export async function initDashboard(user, userData) {
            console.log("Innovator Dashboard: Initializing with provided data...");
            currentUser = user;
            
            // Render cards immediately
            renderQuickAccessCards();
            
            // Initialize Dashboard Charts
            if (window.DashboardCharts) {
                window.DashboardCharts.init('innovator', user.uid);
            }
            
            // Expose renderMyMentors to window for dashboard.html hook
            window.renderMyMentors = renderMyMentors;
            
            try {
                const isReady = await initializeDashboard(userData);
                if (!isReady) {
                    console.log("Innovator Dashboard: Gating active, stopping init.");
                    return;
                }
                
                // Ensure dashboard content is visible
                const dashContent = document.getElementById("dashboard-content");
                if (dashContent) {
                    dashContent.style.display = "block";
                    dashContent.style.visibility = "visible";
                }
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
                        const { ref, uploadBytes, getDownloadURL } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js");
                        const storageRef = ref(storage, `profiles/${currentUser.uid}/${file.name}`);
                        const uploadResult = await uploadBytes(storageRef, file);
                        const photoURL = await getDownloadURL(uploadResult.ref);
                        
                        const { updateProfile } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
                        await updateProfile(currentUser, { photoURL });
                        
                        await updateDoc(doc(db, "users", currentUser.uid), { 
                            photoURL, 
                            updatedAt: serverTimestamp() 
                        });
                        
                        alert('Profile picture updated!');
                    } catch (err) {
                        console.error("Profile pic upload failed:", err);
                        alert('Failed to update profile picture.');
                    } finally {
                        if (preview) preview.style.opacity = '1';
                    }
                });
            }
            return true;
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

        async function renderMyMentors() {
            const container = document.getElementById('myMentorsContainer');
            if (!container) return;
            container.innerHTML = EmptyStates.templates.loadingState();

            try {
                const q = query(collection(db, 'mentorshipRequests'), where('innovatorId', '==', currentUser.uid));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    container.innerHTML = `<div class="text-center py-5"><p class="text-muted">You haven't requested any mentorship yet.</p><button class="btn btn-primary" onclick="window.showDashboardSection('mentors')">Find Mentors</button></div>`;
                    return;
                }

                container.innerHTML = '<div class="row g-4"></div>';
                const row = container.querySelector('.row');

                for (const docSnap of snapshot.docs) {
                    const request = { id: docSnap.id, ...docSnap.data() };
                    const mentorDoc = await getDoc(doc(db, "users", request.mentorId));
                    if (!mentorDoc.exists()) continue;

                    const mentor = mentorDoc.data();
                    const statusClass = request.status === 'accepted' ? 'success' : (request.status === 'pending' ? 'warning' : 'danger');

                    row.innerHTML += `
                        <div class="col-md-6">
                            <div class="dash-nav-card" style="background:white; border:1px solid #eee; cursor:default; box-shadow:none; padding:20px;">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="me-3 d-flex align-items-center justify-content-center overflow-hidden bg-primary-soft" style="width: 50px; height: 50px; border-radius: 12px;">
                                        ${mentor.photoURL || mentor.photoUrl ? 
                                            `<img src="${mentor.photoURL || mentor.photoUrl}" class="w-100 h-100 object-fit-cover" alt="${mentor.fullName}">` : 
                                            `<span class="text-primary fw-bold">${(mentor.fullName || 'M').charAt(0)}</span>`}
                                    </div>
                                    <div style="flex:1">
                                        <h5 class="mb-0" style="color:var(--brand-green)">${mentor.fullName || 'Mentor'}</h5>
                                        <small class="text-muted">${mentor.expertise || 'Expert'}</small>
                                    </div>
                                    <span class="badge bg-${statusClass}-soft text-${statusClass}">${request.status.toUpperCase()}</span>
                                </div>
                                <div class="p-2 rounded bg-light mb-3" style="font-size:0.85rem;">
                                    <strong>Contact:</strong> ${mentor.communicationPreference || 'Not set'}
                                </div>
                                ${request.status === 'accepted' ? `<button class="btn btn-sm btn-outline-primary w-100" onclick="window.location.href='mailto:${mentor.email}'"><i class="fa fa-envelope me-1"></i> Send Email</button>` : ''}
                            </div>
                        </div>
                    `;
                }
            } catch (err) {
                console.error("Error loading my mentors:", err);
                container.innerHTML = EmptyStates.templates.errorState("Failed to load your mentors");
            }
        }
        
        // loadMentors() removed: handled by mentor-discovery.js
        
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
            if (!confirm('Are you sure you want to delete this project? This will also remove any uploaded documents from MongoDB and cannot be undone.')) {
                return;
            }

            try {
                // 1. Delete from Firebase Firestore
                const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                await deleteDoc(doc(db, "projects", projectId));

                // 2. Delete from MongoDB via API
                if (window.api && window.api.deleteProject) {
                    await window.api.deleteProject(projectId);
                }

                alert('Project deleted successfully.');
                await loadProjects(); // Refresh the list
            } catch (error) {
                console.error('Error deleting project:', error);
                alert('Failed to delete project: ' + error.message);
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
                        status: 'pending_admin',
                        createdAt: serverTimestamp()
                    });
                }
                
                alert('Mentorship request sent successfully!');
            } catch (error) {
                console.error('Error sending request:', error);
                alert('Failed to send request: ' + error.message);
            }
        };

        function showPendingApprovalUI() {
            // Hide dashboard content
            const dashContent = document.getElementById("dashboard-content");
            const landingCards = document.getElementById("dashboardQuickAccess");
            if (dashContent) dashContent.style.display = "none";
            if (landingCards) landingCards.style.display = "none";

            // Show a premium "Awaiting Approval" message
            const welcomeContainer = document.querySelector('body');
            const pendingOverlay = document.createElement('div');
            pendingOverlay.id = "pendingApprovalOverlay";
            pendingOverlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(255,255,255,0.9);
                backdrop-filter: blur(10px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 2rem;
            `;
            
            pendingOverlay.innerHTML = `
                <div class="card border-0 shadow-lg p-5 rounded-4" style="max-width: 500px; background: white;">
                    <div class="mb-4">
                        <div class="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        </div>
                    </div>
                    <h2 class="fw-bold mb-3" style="color: #1a5e4f;">Innovator Account Pending Approval</h2>
                    <p class="text-muted mb-4">Welcome to Innovate Hub! Your application is currently being reviewed by our Admin team. You'll receive full access to the dashboard and project tools once approved.</p>
                    <div class="d-grid">
                        <button class="btn btn-outline-secondary py-3 rounded-pill fw-bold" onclick="logout()">Sign Out</button>
                    </div>
                </div>
            `;
            
            welcomeContainer.appendChild(pendingOverlay);
        }

// Auto-extracted from innovator-dashboard.html
// Supabase Auth — user data provided by dashboard.html via initDashboard()

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
        subtitle: 'Manage your innovation projects',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M16 4h2a2 2 0 0 1 2 2v1"/><path d="M8 4H6a2 2 0 0 0-2 2v1"/><path d="M12 4h.01"/></svg>`,
    },
    {
        title: 'Find Mentors',
        section: 'mentors',
        subtitle: 'Connect with experts',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    },
    {
        title: 'Collaboration Hub',
        section: 'collab',
        subtitle: 'Real-time mentorship chat',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
    },
    {
        title: 'Profile Settings',
        section: 'profile',
        subtitle: 'Update your details',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    }
];


// ─── Enhanced background symbol system ───────────────────────
function initBackgroundSymbols() {
    console.log("Legacy background symbols disabled in favor of LiveCanvas.");
}

function renderQuickAccessCards() {
    const container = document.getElementById('dashboardCardsGrid');
    if (!container) return;

    // Guard: Only render for innovators
    const user = JSON.parse(localStorage.getItem('innovateHubUser') || '{}');
    if (user.role !== 'innovator') {
        console.warn("InnovatorDashboard: Skipping card render for non-innovator.");
        return;
    }

    container.innerHTML = dashboardCards.map((card, i) => {
        // Add tags based on section
        let tags = [];
        if (card.section === 'collaboration') tags = ['Chat', 'Mentor'];
        else if (card.section === 'sessions') tags = ['Book', 'Sync'];
        else if (card.section === 'feedback') tags = ['Rating', 'Advice'];
        else if (card.section === 'reports') tags = ['Progress', 'Status'];

        return `
        <article
            class="dash-nav-card"
            style="animation-delay:${i * 0.1}s"
            onclick="window.handleCardClick('${card.section}')"
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

async function renderLandingStats() {
    const statsContainer = document.getElementById('landingStatsRow');
    if (!statsContainer) return;
    statsContainer.style.display = 'flex';
    statsContainer.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border text-primary spinner-border-sm"></div></div>';

    try {
        // 1. Fetch Projects from Supabase
        const projects = window.SupabaseService ? await window.SupabaseService.getProjects({ innovator_id: currentUser.uid }) : [];
        const projectsCount = projects ? projects.length : 0;

        // 2. Fetch Mentorships and Sessions from Supabase
        const mentorships = window.SupabaseService ? await window.SupabaseService.getMentorships(currentUser.uid, 'innovator') : [];
        const activeMentorships = mentorships ? mentorships.filter(m => m.status === 'accepted').length : 0;
        
        let sessionCount = 0;
        try {
            if (mentorships && window.SupabaseService.getSessions) {
                for (const m of mentorships) {
                    if (m.status !== 'accepted') continue;
                    const sess = await window.SupabaseService.getSessions(m.id);
                    sessionCount += sess ? sess.filter(s => {
                        const sDate = s.session_date || s.date;
                        return sDate && new Date(sDate) > new Date();
                    }).length : 0;
                }
            }
        } catch (sessErr) { console.warn("Innovator Dashboard: Session fetch failed", sessErr); }

        const stats = [
            { label: 'Innovation Projects', value: projectsCount, icon: 'fa-rocket', color: '#1a5e4f' },
            { label: 'Active Mentees', value: activeMentorships, icon: 'fa-user-tie', color: '#f3a813' },
            { label: 'Upcoming Sessions', value: sessionCount, icon: 'fa-calendar-check', color: '#1a5e4f' }
        ];

        statsContainer.innerHTML = stats.map(s => `
            <div class="col-md-4">
                <div class="card border-0 shadow-sm rounded-4 p-4 h-100" style="background: rgba(255,255,255,0.7); backdrop-filter: blur(10px);">
                    <div class="d-flex align-items-center gap-3">
                        <div class="rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; background: ${s.color}20; color: ${s.color}">
                            <i class="fa ${s.icon} fa-lg"></i>
                        </div>
                        <div>
                            <div class="h3 fw-bold mb-0" style="color: #121331">${s.value}</div>
                            <div class="text-muted small fw-bold text-uppercase">${s.label}</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error rendering landing stats:", error);
        statsContainer.innerHTML = ''; // Fail silently or show minimal
    }
}


        let currentUser = null;
        let autoSave = null;
        
        // Export init function for dashboard.html
        export async function initDashboard(user, userData) {
            console.log("Innovator Dashboard: Initializing with provided data...");
            currentUser = user; 
            
            try {
                // Supabase Sync: Upsert profile to Supabase (Maintain existing role)
                await window.SupabaseService.upsertProfile({
                    id: user.uid,
                    full_name: userData?.fullName || user.displayName || user.email.split('@')[0],
                    email: user.email,
                    // role removed to prevent overwrites
                    avatar_url: userData?.photoURL || user.photoURL || ''
                });

                // Initialize Dashboard Charts
                if (window.DashboardCharts) {
                    window.DashboardCharts.init('innovator', user.uid);
                }

                // Render Landing Stats
                renderLandingStats();
                
                // Expose loadProjects to window for dashboard.html hook
                window.loadProjects = loadProjects;
                
                // Expose renderMyMentors to window for dashboard.html hook
                window.renderMyMentors = renderMyMentors;

                // Initialize New Feature Modules
                if (window.SessionManager) window.SessionManager.init(user.uid, 'innovator');
                if (window.FeedbackService) window.FeedbackService.init(user.uid, 'innovator');
                if (window.ReportManager) window.ReportManager.init(user.uid, 'innovator');
                
                // Render cards after components init
                renderQuickAccessCards();

                // Unified Card Click Handler
                window.handleCardClick = function(section) {
                    console.log("Innovator Dashboard: Navigation to", section);
                    window.showDashboardSection(section);
                    if (section === 'collab') {
                        if (window.CollaborationHub) window.CollaborationHub.init();
                    } else if (section === 'projects') {
                        loadProjects();
                    }
                };

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

            // Fetch latest profile from Supabase
            let sbProfile = null;
            try {
                if (window.SupabaseService) {
                    sbProfile = await window.SupabaseService.getProfile(currentUser.uid);
                }
            } catch (sbErr) {
                console.warn("Innovator Dashboard: Supabase profile fetch skipped/failed:", sbErr);
            }

            const realName = sbProfile?.full_name || currentUser.displayName || (userData?.fullName) || currentUser.email.split('@')[0];
            const realAvatar = sbProfile?.avatar_url || currentUser.photoURL || '';

            // Sync UI with data
            if (userDisplayName) userDisplayName.textContent = realName;
            if (profileDisplayNameDisplay) profileDisplayNameDisplay.textContent = realName;

            // Refresh Profile Circle Initials (and now images too)
            if (window.StaggeredMenu && window.StaggeredMenu.updateInitials) {
                window.StaggeredMenu.updateInitials(realName, realAvatar);
            }

            populateProfileForms(sbProfile || userData);
            
            if (realAvatar && profilePreview) {
                profilePreview.src = realAvatar;
            }

            // Sync with profile header card (The one with USIU placeholder)
            const profileHeaderName = document.querySelector('.profile-header-premium h2');
            const profileHeaderOrg = document.querySelector('.profile-header-premium p');
            if (profileHeaderName) profileHeaderName.textContent = realName;
            if (profileHeaderOrg) profileHeaderOrg.textContent = sbProfile?.organization || 'Independent Innovator';

            if (document.getElementById('profileEmail')) document.getElementById('profileEmail').value = currentUser.email;

            // Initialize notification system
            try {
                const notificationSystem = new NotificationSystem(currentUser.uid);
                notificationSystem.init('notificationBell');
                notificationSystem.bindFullList('notificationsPageList');
            } catch (err) {
                console.warn("Notification system init failed:", err);
            }
            
            // Load relevant data
            await loadProjects();

            // Ensure we are on Home section to show cards
            if(window.showDashboardSection) window.showDashboardSection('home');
            
            // Mentors are loaded automatically by dashboard.html's showDashboardSection("mentors")
            // which calls MentorDiscovery.init() instead.

            /* CardNav removed in favor of standard landing cards */
            /*
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
            */

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
            
            // Profile Picture Upload Handling via Supabase
            const profilePicInput = document.getElementById('profilePicInput');
            if (profilePicInput) {
                profilePicInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const preview = document.getElementById('profilePreview');
                    if (preview) {
                        preview.src = URL.createObjectURL(file);
                        preview.style.opacity = '0.5';
                    }

                    try {
                        const publicUrl = await window.SupabaseService.uploadAvatar(currentUser.uid, file);
                        alert('Profile picture updated!');
                        // Refresh all profile circles
                        if (window.StaggeredMenu && window.StaggeredMenu.updateInitials) {
                            window.StaggeredMenu.updateInitials(realName, publicUrl);
                        }
                    } catch (err) {
                        console.error("Profile pic upload failed:", err);
                        alert('Failed to update profile picture. Ensure your Supabase Storage has a "public-assets" bucket and it is set to public.');
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
                let projects = [];
                // 1. Try Supabase First
                if (window.SupabaseService) {
                    const sbProjects = await window.SupabaseService.getProjects({ innovator_id: currentUser.uid });
                    if (sbProjects && sbProjects.length > 0) {
                        projects = sbProjects;
                        console.log("Innovator Dashboard: Loaded projects from Supabase");
                    }
                }

                // Removed Firestore fallback to ensure Supabase is the single source of truth
                
                if (projects.length === 0) {
                    container.innerHTML = EmptyStates.templates.noProjects();
                    return;
                }
                
                container.innerHTML = '';
                projects.forEach(project => {
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
                let requests = [];
                // 1. Try Supabase First
                if (window.SupabaseService) {
                    try {
                        const sbMentorships = await window.SupabaseService.getMentorships(currentUser.uid, 'innovator');
                        if (sbMentorships && sbMentorships.length > 0) {
                            requests = sbMentorships.map(m => ({
                                id: m.id,
                                mentorId: m.mentor_id,
                                status: m.status,
                                createdAt: m.created_at,
                                mentorData: m.mentor // Use the alias defined in SupabaseService
                            }));
                            console.log("Innovator Dashboard: Loaded mentors from Supabase");
                        }
                    } catch (sbErr) {
                        console.error("Innovator Dashboard: Supabase mentors fetch failed", sbErr);
                    }
                }

                // Removed Firestore fallback to ensure Supabase is the single source of truth

                if (requests.length === 0) {
                    container.innerHTML = `<div class="text-center py-5">
                        <div style="font-size:3rem;margin-bottom:16px;">🤝</div>
                        <h5 style="font-family:var(--font-head);color:var(--brand-green);">No mentors yet</h5>
                        <p style="color:#aaa;">Start by browsing available mentors and sending a request.</p>
                        <button class="btn btn-primary rounded-pill px-4" onclick="window.showDashboardSection('mentors')">Find Mentors</button>
                    </div>`;
                    return;
                }

                container.innerHTML = '<div class="row g-4"></div>';
                const row = container.querySelector('.row');

                for (const request of requests) {
                    const mentor = request.mentorData || {};
                    const mentorName = mentor.fullName || mentor.full_name || 'Mentor';
                    const mentorAvatar = mentor.photoURL || mentor.avatar_url || '';
                    const mentorExpertise = mentor.expertise || 'Expert';
                    
                    const statusClass = request.status === 'accepted' ? 'success' : (request.status === 'pending' || request.status === 'pending_admin' ? 'warning' : 'danger');

                    row.innerHTML += `
                        <div class="col-md-6 mb-4">
                            <div class="dashboard-card h-100 cursor-pointer hover-card" onclick="window.CollaborationHub ? window.CollaborationHub.init('${request.id}') : window.showDashboardSection('collab')">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="me-3 d-flex align-items-center justify-content-center overflow-hidden bg-primary-soft" style="width: 50px; height: 50px; border-radius: 12px;">
                                        ${mentorAvatar ? 
                                            `<img src="${mentorAvatar}" class="w-100 h-100 object-fit-cover" alt="${mentorName}">` : 
                                            `<span class="text-primary fw-bold">${mentorName.charAt(0)}</span>`}
                                    </div>
                                    <div style="flex:1">
                                        <h5 class="mb-0" style="color:var(--brand-green)">${mentorName}</h5>
                                        <small class="text-muted">${mentorExpertise}</small>
                                    </div>
                                    <span class="badge bg-${statusClass}-soft text-${statusClass}">${request.status.toUpperCase()}</span>
                                </div>
                                <div class="mb-3">
                                    <i class="fa fa-envelope-o me-2 text-muted"></i>
                                    <span class="small text-muted">${mentor.email || ''}</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mt-auto">
                                    <span class="badge bg-light text-dark border">Project Feedback Active</span>
                                    <button class="btn btn-sm btn-outline-primary rounded-pill px-3">
                                        Open Collaboration
                                    </button>
                                </div>
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
                // 1. Primary Sync: Supabase
                if (window.SupabaseService) {
                    await window.SupabaseService.upsertProfile({
                        id: currentUser.uid,
                        full_name: profileData.fullName,
                        bio: profileData.bio,
                        institution: profileData.institution,
                        expertise: skills.join(', '), 
                        updated_at: new Date()
                    });
                    console.log("Innovator Dashboard: Supabase Profile Updated ✓");
                }
                
                // Update local storage if needed (optional, but keep consistent)
                const storedUser = JSON.parse(localStorage.getItem('innovateHubUser') || '{}');
                storedUser.fullName = profileData.fullName;
                localStorage.setItem('innovateHubUser', JSON.stringify(storedUser));

                alert('Profile updated!');
                
                // Sync with navbar
                const avatarUrl = document.getElementById('profilePreview')?.src || "";
                if (window.StaggeredMenu && window.StaggeredMenu.updateInitials) {
                    window.StaggeredMenu.updateInitials(profileData.fullName, avatarUrl);
                }

                const userDisplayName = document.getElementById('userDisplayName');
                const profileDisplayNameDisplay = document.getElementById('profileDisplayNameDisplay');
                if (userDisplayName) userDisplayName.textContent = profileData.fullName;
                if (profileDisplayNameDisplay) profileDisplayNameDisplay.textContent = profileData.fullName;

                const profileHeaderName = document.querySelector('.profile-header-premium h2');
                if (profileHeaderName) profileHeaderName.textContent = profileData.fullName;

            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile.');
            } finally {
                submitBtn.disabled = false;
            }
        }

        window.confirmDeleteProject = async function(projectId) {
            if (!confirm('Are you sure you want to delete this project? This will also remove any uploaded documents from Supabase and cannot be undone.')) {
                return;
            }

            try {
                // 1. Primary Sync: Supabase
                if (window.supabase) {
                    const { error } = await window.supabase
                        .from('projects')
                        .delete()
                        .eq('id', projectId);
                    if (error) console.error("Supabase Project Delete Error:", error);
                    else console.log("Innovator Dashboard: Supabase Project Deleted ✓");
                }

                // 2. Delete from MongoDB via API (Legacy System)
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
        
        window.requestMentorship = async (mentorId, mentorName) => {
            console.log(`Innovator Dashboard: Requesting mentorship from ${mentorName} (${mentorId})...`);
            
            try {
                // Determine which project to link
                let projectId = null;
                const projects = await window.SupabaseService.getProjects({ innovator_id: currentUser.uid });
                
                if (!projects || projects.length === 0) {
                    const createNew = confirm("You don't have any projects yet. Would you like to create one first to link it to this mentorship?");
                    if (createNew) {
                        window.showDashboardSection('submit');
                        return;
                    }
                    // Proceed with null project if they insist (General Mentorship)
                } else if (projects.length === 1) {
                    projectId = projects[0].id;
                } else {
                    const projectList = projects.map((p, i) => `${i + 1}. ${p.title}`).join('\n');
                    const choice = prompt(`Which project is this mentorship for?\n\n${projectList}\n\nEnter number (default 1):`, '1');
                    
                    if (choice === null) return; // User cancelled
                    
                    const index = parseInt(choice) - 1;
                    if (projects[index]) {
                        projectId = projects[index].id;
                    }
                }

                if (window.SupabaseService && window.SupabaseService.createMentorship) {
                    await window.SupabaseService.createMentorship({
                        innovator_id: currentUser.uid,
                        mentor_id: mentorId,
                        project_id: projectId,
                        status: 'pending'
                    });
                    console.log("Innovator Dashboard: Mentorship request sent via Supabase ✓");
                } else {
                    throw new Error("Supabase Mentorship Service unavailable.");
                }
                
                alert(`Mentorship request sent to ${mentorName} successfully!`);
                if (window.renderMyMentors) window.renderMyMentors();
            } catch (error) {
                console.error('Error sending request:', error);
                alert('Failed to send request: ' + error.message);
            }
        };

        function populateProfileForms(data) {
            if (!data) return;
            console.log("Innovator Dashboard: Populating profile forms...");
            
            // Basic Info
            if (document.getElementById('profileName')) document.getElementById('profileName').value = data.fullName || data.full_name || '';
            if (document.getElementById('profileBio')) document.getElementById('profileBio').value = data.bio || '';
            if (document.getElementById('profileInstitution')) document.getElementById('profileInstitution').value = data.institution || data.organization || '';
            
            // Innovator Specific
            if (document.getElementById('profileSkills')) {
                const skills = Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || '');
                document.getElementById('profileSkills').value = skills;
            }
            if (document.getElementById('profileInterests')) {
                const interests = Array.isArray(data.interests) ? data.interests.join(', ') : (data.interests || '');
                document.getElementById('profileInterests').value = interests;
            }
        }

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

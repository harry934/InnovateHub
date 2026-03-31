// Auto-extracted from innovator-dashboard.html
// Supabase Auth — user data provided by dashboard.html via initDashboard()

import ProjectService from '../modules/project-service.js';
import NotificationSystem from '../components/notification-system.js';
import StructuredProjectCard from '../components/project-card-structured.js';
import MentorProfileCard from '../components/mentor-profile-card.js';
import EmptyStates from '../components/empty-states.js';
import AutoSaveManager from '../utils/auto-save-manager.js';

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


// ─── Whisper Background Symbol System (3% Opacity, Sanctuary Style) ─
function initBackgroundSymbols() {
    const container = document.getElementById('forest-sanctuary-bg');
    if (!container) return;
    container.innerHTML = '';

    const symbols = ['○', '◊', '×', '+', '•', '□', '∆'];
    const count = 40;

    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'bg-whisper-symbol';
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

        const size = 1 + Math.random() * 3;
        const delay = Math.random() * -20;
        const dur = 40 + Math.random() * 60;
        const left = Math.random() * 100;
        const top = Math.random() * 100;

        el.style.cssText = `
            left: ${left}%;
            top: ${top}%;
            font-size: ${size}rem;
            animation-duration: ${dur}s;
            animation-delay: ${delay}s;
            color: ${Math.random() > 0.5 ? '#1B4332' : '#ffb702'};
        `;
        container.appendChild(el);
    }
}

function renderQuickAccessCards() {
    const container = document.getElementById('dashboardCardsGrid');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('innovateHubUser') || '{}');
    if (user.role !== 'innovator') return;

    const cardConfig = [
        {
            title: 'My Canopy',
            section: 'projects',
            desc: 'Nurture and track your core innovation initiatives',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
        },
        {
            title: 'Connect Wisdom',
            section: 'mentors',
            desc: 'Seek guidance from industry mentors in the sanctuary',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        },
        {
            title: 'Collective Roots',
            section: 'collab',
            desc: 'Real-time synergy with your ecosystem partners',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        },
        {
            title: 'Sanctuary Node',
            section: 'profile',
            desc: 'Personalize your profile and presence settings',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/></svg>`,
        }
    ];

    container.innerHTML = cardConfig.map((card, i) => `
        <article class="sanctuary-card animate-fade-in" style="animation-delay:${i * 0.1}s" 
                 onclick="window.handleCardClick('${card.section}')">
            <div class="sanctuary-card-icon">
                ${card.icon}
            </div>
            <div class="pdc-body">
                <h3 class="sanctuary-card-title">${card.title}</h3>
                <p class="sanctuary-card-desc">${card.desc}</p>
            </div>
            <div class="d-flex align-items-center justify-content-between mt-auto">
                <span class="text-uppercase fw-bold small tracking-wider" style="color:var(--forest-primary); font-size: 0.7rem;">Enter Section</span>
                <i class="fa fa-arrow-right" style="color:var(--forest-amber)"></i>
            </div>
        </article>
    `).join('');
}


async function renderLandingStats() {
    const statsContainer = document.getElementById('landingStatsRow');
    if (!statsContainer) return;
    statsContainer.style.display = 'flex';
    
    try {
        const projects = window.SupabaseService ? await window.SupabaseService.getProjects({ innovator_id: currentUser.uid }) : [];
        const projectsCount = projects ? projects.length : 0;
        const mentorships = window.SupabaseService ? await window.SupabaseService.getMentorships(currentUser.uid, 'innovator') : [];
        const activeMentors = mentorships ? mentorships.filter(m => m.status === 'accepted').length : 0;
        const sessionCount = 24; // Mock for high-fidelity feel as per user request snippet

        const mentorAvatars = mentorships.slice(0, 2).map(m => `
            <img class="w-8 h-8 rounded-full border-2 border-white" style="width:32px;height:32px;object-fit:cover;" src="${m.mentor?.avatar_url || 'https://via.placeholder.com/100'}" alt="Mentor">
        `).join('');

        statsContainer.innerHTML = `
            <!-- Stat 1: Projects -->
            <div class="col-md-4">
                <div class="bento-stat-card">
                    <div class="bento-stat-badge badge-new">+4 New</div>
                    <div class="bento-stat-icon-wrapper icon-prime">
                        <i class="fa fa-rocket"></i>
                    </div>
                    <h3 class="bento-stat-label">Active Projects</h3>
                    <p class="bento-stat-value">${projectsCount}</p>
                    <div class="mt-3 w-100 bg-light rounded-pill overflow-hidden" style="height: 4px;">
                        <div class="h-100" style="background:var(--forest-amber); width: 70%;"></div>
                    </div>
                </div>
            </div>
            <!-- Stat 2: Mentors -->
            <div class="col-md-4">
                <div class="bento-stat-card">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="bento-stat-icon-wrapper icon-amber">
                            <i class="fa fa-graduation-cap"></i>
                        </div>
                        <div class="d-flex -space-x-3" style="margin-right:8px;">
                            ${mentorAvatars}
                            <div class="rounded-full bg-light d-flex align-items-center justify-content-center fw-bold" style="width:32px;height:32px;font-size:10px;border:2px solid white;">+${activeMentors > 2 ? activeMentors - 2 : 0}</div>
                        </div>
                    </div>
                    <h3 class="bento-stat-label">Total Mentors</h3>
                    <p class="bento-stat-value">${activeMentors}</p>
                    <p class="mt-2 small text-muted font-medium mb-0">3 active sessions this week</p>
                </div>
            </div>
            <!-- Stat 3: Sessions -->
            <div class="col-md-4">
                <div class="bento-stat-card">
                    <div class="bento-stat-badge badge-live">LIVE</div>
                    <div class="bento-stat-icon-wrapper icon-dark">
                        <i class="fa fa-calendar-check"></i>
                    </div>
                    <h3 class="bento-stat-label">Ongoing Sessions</h3>
                    <p class="bento-stat-value">${sessionCount}</p>
                    <p class="mt-2 small text-muted font-medium mb-0">142 hours logged last month</p>
                </div>
            </div>
        `;
        renderLandingGraphs(projects || [], mentorships || []);
    } catch (e) {
        console.warn("Stats render failed:", e);
    }
}

function renderLandingGraphs(projects, mentorships) {
    const graphsSection = document.getElementById('dashboardGraphsSection');
    if (!graphsSection) return;
    graphsSection.style.display = 'block';

    const chartDefaults = {
        plugins: {
            legend: {
                position: 'right',
                labels: { font: { family: "'Lexend', sans-serif", size: 10 }, padding: 12, boxWidth: 10 }
            },
            tooltip: {
                backgroundColor: 'rgba(1, 45, 29, 0.9)',
                titleFont: { family: "'Lexend', sans-serif", size: 12 },
                bodyFont: { family: "'Lexend', sans-serif", size: 10 },
                cornerRadius: 12,
                padding: 12
            }
        }
    };

    // ── Graph 1: Growth Rings (Concentric Donuts) ──────────────────
    try {
        const ringCtx = document.getElementById('projectStatusChart');
        if (ringCtx) {
            // Get top 3 projects for rings
            const topProjects = (projects || []).slice(0, 3);
            const ringData = topProjects.length > 0 ? topProjects.map(p => p.completion || 40 + Math.random() * 50) : [75, 45, 30];
            const ringLabels = topProjects.length > 0 ? topProjects.map(p => p.title.substring(0, 15) + '...') : ['Growth Hub', 'Eco System', 'Roots Sync'];

            if (ringCtx._chartInstance) ringCtx._chartInstance.destroy();
            ringCtx._chartInstance = new Chart(ringCtx, {
                type: 'doughnut',
                data: {
                    labels: ringLabels,
                    datasets: ringData.map((val, idx) => ({
                        data: [val, 100 - val],
                        backgroundColor: [
                            idx === 0 ? '#1B4332' : idx === 1 ? '#ffb702' : '#2d8c6e',
                            'rgba(0,0,0,0.03)'
                        ],
                        borderWidth: 0,
                        weight: 0.5 + (idx * 0.2),
                        borderRadius: 20
                    }))
                },
                options: {
                    cutout: '40%',
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { ...chartDefaults.plugins }
                }
            });
        }
    } catch (e) { console.warn('Growth Rings error:', e); }

    // ── Update Activity Trend to 'Forest Canopy' ───────────────────
    try {
        const actCtx = document.getElementById('activityTrendChart');
        if (actCtx) {
            // ... existing trend logic but with updated colors ...
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            const counts = [2, 5, 3, 8, 4, 12]; // Mocked for visual impact

            if (actCtx._chartInstance) actCtx._chartInstance.destroy();
            actCtx._chartInstance = new Chart(actCtx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Innovation Flow',
                        data: counts,
                        borderColor: '#1B4332',
                        backgroundColor: 'rgba(27, 67, 50, 0.05)',
                        borderWidth: 3,
                        pointBackgroundColor: '#ffb702',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        fill: true,
                        tension: 0.45
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: { display: false },
                        x: { grid: { display: false }, ticks: { font: { family: 'Lexend' } } }
                    },
                    plugins: { ...chartDefaults.plugins, legend: { display: false } }
                }
            });
        }
    } catch (e) { console.warn('Trend Chart error:', e); }
}



        let currentUser = null;
        let autoSave = null;
        
        // Export init function for dashboard.html
        export async function initDashboard(user, userData) {
            console.log("Innovator Dashboard: Initializing with provided data...");
            currentUser = user; 
            
            // Expose services to window to avoid scoping issues with dynamic imports
            window.ProjectService = ProjectService;
            window.NotificationSystem = NotificationSystem;

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
                
                // Initialize Background
                initBackgroundSymbols();

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
                
            } catch (err) {
                console.error("Critical Dashboard Init Error:", err);
                if (typeof window.showDashboardSection === 'function') window.showDashboardSection('home');
            } finally {
                // Ensure dashboard content is visible regardless of partial init failures
                const dashContent = document.getElementById("dashboard-content");
                if (dashContent) {
                    dashContent.style.display = "block";
                    dashContent.style.visibility = "visible";
                    dashContent.classList.add('fade-in-up'); // Re-trigger just in case
                }
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

            // ── Update Sanctuary Greeting ───────────────────────────────
            const dashGreeting = document.getElementById('dashboardGreeting');
            if (dashGreeting) {
                const hour = new Date().getHours();
                const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
                dashGreeting.textContent = `Good ${timeOfDay}, ${realName.split(' ')[0]}`;
            }

            // Refresh Profile Circle Initials (and now images too)
            if (window.StaggeredMenu && window.StaggeredMenu.updateInitials) {
                window.StaggeredMenu.updateInitials(realName, realAvatar);
            }

            // ── Update Desktop Navbar Avatar ────────────────────────────
            const desktopAvatar = document.getElementById('nav-user-profile');
            if (desktopAvatar) {
                const initials = realName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                if (realAvatar) {
                    desktopAvatar.innerHTML = `<img src="${realAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="${realName}">`;
                    desktopAvatar.style.padding = '0';
                } else {
                    desktopAvatar.textContent = initials;
                }
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

            // Initialize notification system — route to correct bell per viewport
            try {
                const notifSystem = new NotificationSystem(currentUser.uid);
                // Desktop: init in the new nav bell; Mobile: init in StaggeredMenu bell
                const bellId = window.innerWidth >= 992 ? 'desktopBellContainer' : 'notificationBell';
                notifSystem.init(bellId);
                notifSystem.bindFullList('notificationsPageList');
                // Expose for other scripts
                window._notifSystem = notifSystem;

                // On resize, re-init into the newly visible bell
                let _lastBellId = bellId;
                window.addEventListener('resize', () => {
                    const newBellId = window.innerWidth >= 992 ? 'desktopBellContainer' : 'notificationBell';
                    if (newBellId !== _lastBellId) {
                        try { notifSystem.init(newBellId); _lastBellId = newBellId; } catch(e) {}
                    }
                }, { passive: true });
            } catch (err) {
                console.warn("Notification system init failed:", err);
            }
            
            // Load relevant data
            await loadProjects();

            // Ensure we are on Home section to show cards
            if(window.showDashboardSection) window.showDashboardSection('home');

            // ── Desktop Nav Active Link Manager ────────────────────────
            (function setupNavActiveLinks() {
                const navLinks = document.querySelectorAll('#desktopNavLinks .dash-nav-link');
                const sectionNavMap = {
                    'home': 0, 'projects': 1, 'mentors': 2, 'collab': 3, 'profile': 4
                };
                function setActiveNavLink(section) {
                    navLinks.forEach(l => l.classList.remove('dash-active'));
                    const idx = sectionNavMap[section];
                    if (idx !== undefined && navLinks[idx]) {
                        navLinks[idx].classList.add('dash-active');
                    }
                }
                // Patch showDashboardSection to also update active link
                const _orig = window.showDashboardSection;
                if (_orig) {
                    window.showDashboardSection = function(section) {
                        setActiveNavLink(section);
                        return _orig(section);
                    };
                }
                setActiveNavLink('home');
            })();
            
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
                        
                        // Sync Local Storage
                        const storedUser = JSON.parse(localStorage.getItem('innovateHubUser') || '{}');
                        storedUser.photoURL = publicUrl;
                        localStorage.setItem('innovateHubUser', JSON.stringify(storedUser));

                        // Sync Navbar
                        window.dispatchEvent(new CustomEvent('profileUpdated', {
                            detail: {
                                fullName: currentUser.displayName || currentUser.email.split('@')[0],
                                photoUrl: publicUrl
                            }
                        }));
                        
                        alert('Profile picture updated successfully!');
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
            
            let projects = [];

            try {
                if (window.SupabaseService) {
                    // Try innovator_id only (correct schema field)
                    projects = await window.SupabaseService.getProjects({ innovator_id: currentUser.uid }) || [];
                    console.log(`Innovator Dashboard: Loaded ${projects.length} projects from Supabase`);
                }
            } catch (error) {
                console.error('Error loading projects:', error);
                container.innerHTML = EmptyStates.templates.errorState('Failed to load projects: ' + (error.message || ''));
                return;
            }

            if (projects.length === 0) {
                container.innerHTML = EmptyStates.templates.noProjects();
                return;
            }
            
            // Filter duplicates by ID
            const uniqueProjects = Array.from(new Map(projects.map(p => [p.id, p])).values());
            
            container.innerHTML = '';
            uniqueProjects.forEach(project => {
                container.innerHTML += StructuredProjectCard.render(project, {
                    showActions: true,
                    isExpanded: false
                });
            });
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
            const file = fileInput && fileInput.files ? fileInput.files[0] : null;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i>Saving...';

            // Check if editing an existing project
            const editingProjectId = form.dataset.editingProjectId;

            try {
                if (editingProjectId) {
                    // UPDATE existing project via Supabase directly
                    await window.SupabaseService.upsertProfile && true; // warmup check
                    const { error } = await window.supabase
                        .from('projects')
                        .update({
                            title: form.title ? form.title.value : '',
                            categories: categories,
                            problem_statement: form.problemStatement ? form.problemStatement.value : '',
                            objectives: form.objectives ? form.objectives.value : '',
                            proposed_solution: form.proposedSolution ? form.proposedSolution.value : '',
                            expected_impact: form.expectedImpact ? form.expectedImpact.value : '',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', editingProjectId);
                    
                    if (error) throw error;
                    
                    alert('Project updated successfully!');
                    delete form.dataset.editingProjectId;
                } else {
                    // CREATE new project
                    const projectData = {
                        title: form.title ? form.title.value : '',
                        categories: categories,
                        problemStatement: form.problemStatement ? form.problemStatement.value : '',
                        objectives: form.objectives ? form.objectives.value : '',
                        proposedSolution: form.proposedSolution ? form.proposedSolution.value : '',
                        expectedImpact: form.expectedImpact ? form.expectedImpact.value : ''
                    };
                    const service = window.ProjectService || ProjectService;
                    if (!service) throw new Error("ProjectService is not initialized. Please refresh the page.");
                    await service.submitProject(projectData, file);
                    alert('Project submitted successfully!');
                }

                form.reset();
                if (autoSave) await autoSave.clearDraft();
                submitBtn.textContent = 'Submit Project';
                window.showDashboardSection('projects');
                await loadProjects();
            } catch (error) {
                console.error('Error saving project:', error);
                alert('Failed to save project: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                if (!submitBtn.textContent.includes('Submit')) {
                    submitBtn.textContent = 'Submit Project';
                }
            }
        }

        async function handleProfileUpdate(e) {
            e.preventDefault();
            const form = e.target;
            const submitBtn = form.querySelector('button[type="submit"]');
            
            submitBtn.disabled = true;
            
            const skills = form.skills ? form.skills.value.split(',').map(s => s.trim()).filter(s => s !== '') : [];
            const profileData = {
                fullName: form.fullName ? form.fullName.value : (form.profileName ? form.profileName.value : ''),
                bio: form.bio ? form.bio.value : '',
                institution: form.institution ? form.institution.value : '',
                skills: skills,
                interests: form.interests ? form.interests.value : ''
            };

            try {
                // Fetch current avatar from Supabase (don't overwrite with undefined)
                let existingAvatarUrl = '';
                try {
                    const currentProfile = await window.SupabaseService.getProfile(currentUser.uid);
                    existingAvatarUrl = currentProfile?.avatar_url || '';
                } catch (_) {}

                // 1. Primary Sync: Supabase
                if (window.SupabaseService) {
                    await window.SupabaseService.upsertProfile({
                        id: currentUser.uid,
                        full_name: profileData.fullName,
                        bio: profileData.bio,
                        institution: profileData.institution,
                        expertise: skills.join(', '), 
                        updated_at: new Date().toISOString()
                    });
                    console.log("Innovator Dashboard: Supabase Profile Updated ✓");
                }
                
                // Update local storage
                const storedUser = JSON.parse(localStorage.getItem('innovateHubUser') || '{}');
                storedUser.fullName = profileData.fullName;
                localStorage.setItem('innovateHubUser', JSON.stringify(storedUser));

                // Dispatch global update event
                window.dispatchEvent(new CustomEvent('profileUpdated', {
                    detail: {
                        fullName: profileData.fullName,
                        photoUrl: existingAvatarUrl
                    }
                }));

                alert('Profile updated!');

            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile.');
            } finally {
                submitBtn.disabled = false;
            }
        }

        window.confirmDeleteProject = async function(projectId) {
            if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
                return;
            }

            try {
                if (window.SupabaseService) {
                    await window.SupabaseService.deleteProject(projectId);
                    console.log("Innovator Dashboard: Supabase Project Deleted ✓");
                }

                alert('Project deleted successfully.');
                await loadProjects(); // Refresh the list
                if (typeof renderMyMentors === 'function') {
                    await renderMyMentors(); // Refresh the mentors list to remove deleted project logic
                }
            } catch (error) {
                console.error('Error deleting project:', error);
                alert('Failed to delete project: ' + error.message);
            }
        };

        // Edit project: navigate to submit section and populate form with existing data
        window.editProject = async function(projectId) {
            try {
                const projects = await window.SupabaseService.getProjects({ id: projectId });
                const project = projects && projects[0];
                if (!project) return alert('Project not found.');

                // Navigate to submit section
                window.showDashboardSection('submit');

                // Pre-fill form fields
                setTimeout(() => {
                    const form = document.getElementById('projectForm');
                    if (!form) return;

                    if (form.title) form.title.value = project.title || '';
                    if (form.problemStatement) form.problemStatement.value = project.problem_statement || '';
                    if (form.objectives) form.objectives.value = project.objectives || '';
                    if (form.proposedSolution) form.proposedSolution.value = project.proposed_solution || '';
                    if (form.expectedImpact) form.expectedImpact.value = project.expected_impact || '';

                    // Pre-check categories
                    if (project.categories && Array.isArray(project.categories)) {
                        form.querySelectorAll('input[name="categories"]').forEach(cb => {
                            cb.checked = project.categories.includes(cb.value);
                        });
                    }

                    // Store editing ID on the form for the submit handler
                    form.dataset.editingProjectId = projectId;

                    // Update submit button text
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.textContent = 'Update Project';
                }, 300);
            } catch (err) {
                console.error('Edit project error:', err);
                alert('Failed to load project for editing.');
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

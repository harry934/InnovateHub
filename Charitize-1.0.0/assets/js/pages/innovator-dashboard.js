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

const dashboardCards = [
    { title: 'My Projects',      id: 'projects',  section: 'projects',  types: ['Manage', 'Track'], progress: 85, action: 'view' },
    { title: 'Submit Project',   id: 'submit',    section: 'submit',    types: ['Innovate', 'Launch'], progress: 0, action: 'plus' },
    { title: 'Find Mentors',     id: 'mentors',   section: 'mentors',   types: ['Connect', 'Experts'], progress: 40, action: 'search' },
    { title: 'My Mentors',       id: 'myMentors', section: 'myMentors', types: ['Assigned', 'Requests'], progress: 60, action: 'chat' },
    { title: 'Account Settings', id: 'profile',   section: 'profile',   types: ['Profile', 'Settings'], progress: 95, action: 'edit' }
];

// ─── Enhanced background symbol system ───────────────────────
// ─── Enhanced background symbol system ───────────────────────
function initBackgroundSymbols() {
    const container = document.getElementById('backgroundSymbols');
    if (!container) return;
    container.innerHTML = '';

    const symbols = [
        '+', '−', '×', '÷', '◇', '○', '△', '□', 
        '⟶', '⇌', '∞', '≈', '{ }', '< />', '[ ]', '#',
        '⚡', '⚛', '◈', '❖', '★', '⚙', '⌘'
    ];

    const count = 100; // Boosted density
    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'bg-symbol';
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

        const size = 0.8 + Math.random() * 2.2;         // 0.8–3.0rem (Larger)
        const opacity = 0.04 + Math.random() * 0.08;    // More visible
        const delay = Math.random() * 20;               
        const dur = 15 + Math.random() * 25;            
        const drift = (Math.random() - 0.5) * 150;      

        el.style.cssText = `
            position: absolute;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 140}%;
            font-size: ${size}rem;
            --sym-opacity: ${opacity};
            opacity: ${opacity};
            color: ${Math.random() > 0.6 ? '#1a5e4f' : '#f3a813'};
            font-family: 'Courier New', monospace;
            font-weight: 800;
            pointer-events: none;
            user-select: none;
            animation: floatSymbol ${dur}s ${delay}s ease-in-out infinite alternate;
            --drift: ${drift}px;
            filter: blur(${Math.random() * 1}px);
        `;
        container.appendChild(el);
    }
}

function renderQuickAccessCards() {
    const container = document.getElementById('dashboardCardsGrid');
    if (!container) return;

    container.innerHTML = dashboardCards.map(card => `
        <article class="premium-card" onclick="window.showDashboardSection('${card.section}')">
          <div class="premium-card-icon">
            ${CARD_ICONS[card.id] || ''}
          </div>
          <div class="tc-content">
            <div class="tc-header">
              <h3 class="tc-title" style="font-family:var(--font-head); font-weight:800; font-size:1.4rem; color:var(--brand-green);">${card.title}</h3>
              <div class="tc-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
            <div class="tc-tags" style="margin-top:8px; display:flex; gap:8px;">
              ${card.types.map(t => `<span class="badge" style="background:rgba(26, 94, 79, 0.05); color:var(--brand-green); font-size:0.7rem; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:20px;">${t}</span>`).join('')}
            </div>
          </div>
        </article>
    `).join('');

    initBackgroundSymbols();
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
            
            // Load mentors
            await loadMentors();

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
            
            // Filter Pills Handling
            document.querySelectorAll('.category-filter-pill').forEach(pill => {
                pill.addEventListener('click', () => {
                    pill.classList.toggle('bg-primary');
                    pill.classList.toggle('text-white');
                    pill.classList.toggle('bg-light');
                    pill.classList.toggle('text-dark');
                    loadMentors(); 
                });
            });

            // Search input handling
            const mentorSearchInput = document.getElementById('mentorSearchInput');
            if (mentorSearchInput) {
                mentorSearchInput.addEventListener('input', debounce(() => loadMentors(), 500));
            }

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
                        const response = await window.api.uploadProjectFile(file, 'profile', currentUser.uid);
                        if (response && response.ok) {
                            const baseUrl = window.api ? window.api.API_URL : 'https://innovatehub.up.railway.app/api';
                            const photoURL = `${baseUrl}/projects/file/${response.data.fileId}`;
                            
                            const { updateProfile } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
                            await updateProfile(currentUser, { photoURL });
                            
                            await updateDoc(doc(db, "users", currentUser.uid), { 
                                photoURL, 
                                updatedAt: serverTimestamp() 
                            });
                            
                            alert('Profile picture updated!');
                        } else {
                            throw new Error("Upload failed.");
                        }
                    } catch (err) {
                        console.error("Profile pic upload failed:", err);
                        alert('Failed to update profile picture.');
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
        
        async function loadMentors() {
            const container = document.getElementById('mentorsContainer');
            if (!container) return;
            container.innerHTML = EmptyStates.templates.loadingState();
            
            try {
                const selectedCategories = Array.from(document.querySelectorAll('.category-filter-pill.bg-primary'))
                    .map(pill => pill.dataset.value);
                
                const searchInput = document.getElementById('mentorSearchInput');
                const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

                const q = query(collection(db, 'users'), where('role', '==', 'mentor'));
                const snapshot = await getDocs(q);
                
                if (snapshot.empty) {
                    container.innerHTML = EmptyStates.templates.noMentors();
                    return;
                }
                
                let mentors = [];
                snapshot.forEach(doc => {
                    const mentor = { id: doc.id, ...doc.data() };
                    
                    // Business Rule: ONLY show approved and fully completed mentors
                    const isApproved = mentor.approvalStatus === 'approved' || mentor.status === 'approved';
                    const isComplete = mentor.profileComplete === true || mentor.isProfileComplete === true;
                    
                    if (!isApproved || !isComplete) return;

                    const matchesCategory = selectedCategories.length === 0 || 
                        selectedCategories.some(c => (mentor.categories || []).includes(c) || (mentor.expertise || '').toLowerCase().includes(c));
                    
                    const matchesSearch = !searchTerm || 
                        mentor.fullName?.toLowerCase().includes(searchTerm) || 
                        mentor.expertise?.toLowerCase().includes(searchTerm) ||
                        mentor.institution?.toLowerCase().includes(searchTerm);

                    if (matchesCategory && matchesSearch) mentors.push(mentor);
                });
                
                if (mentors.length === 0) {
                    container.innerHTML = EmptyStates.templates.noMentors();
                    return;
                }

                container.innerHTML = '';
                mentors.forEach(mentor => {
                    container.innerHTML += MentorProfileCard.render(mentor, {
                        showRequestButton: true,
                        showAvailability: true, 
                        cardClass: 'col-md-6 col-lg-4'
                    });
                });
            } catch (error) {
                console.error('Error loading mentors:', error);
                container.innerHTML = EmptyStates.templates.errorState('Failed to load mentors');
            }
        }
        
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

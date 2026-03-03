
// Auto-extracted from innovator-dashboard.html
import { auth, db } from '../core/firebase-config.js';
        import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
        import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        import NotificationSystem from '../components/notification-system.js';
        import StructuredProjectCard from '../components/project-card-structured.js';
        import MentorProfileCard from '../components/mentor-profile-card.js';
        import EmptyStates from '../components/empty-states.js';
        import AutoSaveManager from '../utils/auto-save-manager.js';
        import { ProjectService } from './innovate-hub.js';

        const dashboardCards = [
            { 
                title: 'My Projects', 
                icon: 'fa-project-diagram', 
                id: 'projects', 
                section: 'projects',
                types: ['Manage', 'Track']
            },
            { 
                title: 'Submit Project', 
                icon: 'fa-plus-circle', 
                id: 'submit', 
                section: 'submit',
                types: ['Innovate', 'Submit']
            },
            { 
                title: 'Find Mentors', 
                icon: 'fa-user-md', 
                id: 'mentors', 
                section: 'mentors',
                types: ['Connect', 'Experts']
            },
            { 
                title: 'My Mentors', 
                icon: 'fa-users', 
                id: 'myMentors', 
                section: 'myMentors',
                types: ['Assigned', 'Requests']
            },
            {
                title: 'Account Settings',
                icon: 'fa-user-cog',
                id: 'profile',
                section: 'profile',
                types: ['Profile', 'Settings']
            }
        ];

        function renderQuickAccessCards() {
            const container = document.getElementById('dashboardCardsGrid');
            if (!container) return;
            
            container.innerHTML = dashboardCards.map(card => `
                <article class="article-wrapper" onclick="showDashboardSection('${card.section}')">
                  <div class="rounded-lg container-project d-flex align-items-center justify-content-center" style="height: 100px;">
                    <i class="fa ${card.icon} fa-3x text-primary"></i>
                  </div>

                  <div class="project-info">
                    <div class="flex-pr">
                      <div class="project-title text-nowrap">${card.title}</div>
                      <div class="project-hover">
                        <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24" stroke-width="2" fill="none" stroke="currentColor">
                          <line y2="12" x2="19" y1="12" x1="5"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                    </div>

                    <div class="types">
                      ${card.types.map(t => `<span class="project-type">• ${t}</span>`).join('')}
                    </div>
                  </div>
                </article>
            `).join('');
        }

        // Logout - Global
        window.logout = async function() {
            try {
                await auth.signOut();
                localStorage.removeItem('innovateHubUser');
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = 'login.html';
            }
        };

        let currentUser = null;
        let autoSave = null;
        
        // Auth check
        onAuthStateChanged(auth, async (user) => {
            if (!user) return; // Login redirect handled globally by shared-ui
            
            currentUser = user;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const role = userDoc.exists() ? userDoc.data().role : 'innovator';
                
                if (role !== 'mentor' && role !== 'admin') {
                    await initializeDashboard();
                }
            } catch (err) {
                console.error("Critical Dashboard Init Error:", err);
                if(typeof window.showDashboardSection === 'function') window.showDashboardSection('projects');
            }
        });
        
        async function initializeDashboard() {
            // UI elements
            const userDisplayName = document.getElementById('userDisplayName');
            const profileDisplayNameDisplay = document.getElementById('profileDisplayNameDisplay');
            const profilePreview = document.getElementById('profilePreview');

            // Default display name
            const initialName = currentUser.displayName || currentUser.email.split('@')[0];
            if (userDisplayName) userDisplayName.textContent = initialName;
            if (profileDisplayNameDisplay) profileDisplayNameDisplay.textContent = initialName;

            // Load additional profile info from Firestore
            try {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    
                    const realName = data.fullName || initialName;
                    if (userDisplayName) userDisplayName.textContent = realName;
                    if (profileDisplayNameDisplay) profileDisplayNameDisplay.textContent = realName;

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

                    // Refresh Profile Circle Initials
                    if (window.StaggeredMenu && window.StaggeredMenu.updateInitials) {
                        window.StaggeredMenu.updateInitials(realName);
                    }
                }
            } catch (err) {
                console.error("Error loading profile from Firestore:", err);
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

            // Global section switcher enhancement is already handled in dashboard.html
            // We just need to make sure renderQuickAccessCards is called
            renderQuickAccessCards();
            
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
                await ProjectService.submitProject(projectData, file);
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

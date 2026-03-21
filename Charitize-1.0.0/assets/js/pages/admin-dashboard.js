// Supabase Auth — no Firebase dependency

class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.eventsLoaded = false;
        this.heatmapData = {};
        this.currentRoleFilter = 'all';
        this.init();
    }

    async init() {
        // Use Supabase session instead of Firebase onAuthStateChanged
        let supabaseUser = null;
        if (window.supabase) {
            const { data: { session } } = await window.supabase.auth.getSession();
            supabaseUser = session?.user || null;
        }

        if (!supabaseUser) {
            window.location.href = 'login.html';
            return;
        }

        // Role Guard: Verify admin status in Supabase
        if (window.SupabaseService) {
            try {
                const profile = await window.SupabaseService.getProfile(supabaseUser.id);
                const roleFromProfile = (profile?.role || "").toLowerCase();
                const roleFromMeta = (supabaseUser.user_metadata?.role || "").toLowerCase();
                
                if (roleFromProfile !== 'admin' && roleFromMeta !== 'admin') {
                    console.error("AdminDashboard: Unauthorized - Role from profile:", roleFromProfile, "Role from meta:", roleFromMeta);
                    window.location.href = 'dashboard.html';
                    return;
                }
            } catch (err) {
                console.error("AdminDashboard: Role verification failed:", err);
                window.location.href = 'dashboard.html';
                return;
            }
        }

        // Wrap user to match expected shape
        this.currentUser = {
            uid: supabaseUser.id,
            id: supabaseUser.id,
            email: supabaseUser.email,
            displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0]
        };

        // Basic UI Setup
        this.updateUserDisplay();
        this.setupNotifications();

        // Initial Data Load
        await this.loadStats();
        await this.loadProjectReviews();
        await this.renderActivityHeatmap();

        // Make instance globally available for onclick handlers
        window.adminDashboard = this;
        window.AdminPanel = this;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Fix: Use one-time binding
        if (this.listenersAttached) return;

        const eventForm = document.getElementById('adminEventForm');
        if (eventForm) {
            eventForm.addEventListener('submit', (e) => this.handleEventSubmit(e));
        }

        const projectForm = document.getElementById('adminProjectForm');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => this.handleProjectSubmit(e));
        }

        const manualMentorForm = document.getElementById('manualMentorForm');
        if (manualMentorForm) {
            manualMentorForm.addEventListener('submit', (e) => this.handleManualMentorRegistration(e));
        }

        this.listenersAttached = true;
    }

    // ============================================================
    //  ACTIVITY HEATMAP (GitHub Style)
    // ============================================================
    async renderActivityHeatmap() {
        const container = document.getElementById('activityHeatmapContainer');
        if (!container) return;

        try {
            // Fetch consolidation activity from Supabase
            if (!window.SupabaseService) return;
            
            const [projects, mentorships] = await Promise.all([
                window.SupabaseService.getProjects(),
                window.SupabaseService.getMentorships()
            ]);

            const activityMap = {};
            
            const process = (items) => {
                if (!items) return;
                items.forEach(item => {
                    const date = item.created_at ? new Date(item.created_at) : null;
                    if (date) {
                        const dateString = date.toISOString().split('T')[0];
                        activityMap[dateString] = (activityMap[dateString] || 0) + 1;
                    }
                });
            };

            process(projects);
            process(mentorships);

            this.heatmapData = activityMap;

            // Generate the Grid
            const today = new Date();
            const yearAgo = new Date();
            yearAgo.setFullYear(today.getFullYear() - 1);
            
            // Start from the beginning of the week yearAgo
            const startDay = new Date(yearAgo);
            startDay.setDate(startDay.getDate() - startDay.getDay());

            let html = '<div class="heatmap-grid" style="display:grid; grid-template-columns: repeat(53, 1fr); grid-auto-flow: column; gap:3px; overflow-x:auto; padding-bottom:10px;">';
            
            for (let i = 0; i < 53 * 7; i++) {
                const current = new Date(startDay);
                current.setDate(startDay.getDate() + i);
                const dateStr = current.toISOString().split('T')[0];
                const count = activityMap[dateStr] || 0;
                
                let level = 0;
                if (count > 0) level = 1;
                if (count > 3) level = 2;
                if (count > 6) level = 3;
                if (count > 10) level = 4;

                const colors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
                const color = colors[level];

                html += `<div class="heatmap-day" title="${dateStr}: ${count} actions" style="width:12px; height:12px; border-radius:3px; background:${color}; cursor:pointer;" onclick="adminDashboard.showDayActivity('${dateStr}')"></div>`;
            }
            html += '</div>';
            
            // Add Legend
            html += `
                <div class="d-flex align-items-center justify-content-end mt-2 gap-2" style="font-size:0.75rem; color:#666;">
                    <span>Less</span>
                    <div style="width:10px; height:10px; background:#ebedf0; border-radius:2px;"></div>
                    <div style="width:10px; height:10px; background:#9be9a8; border-radius:2px;"></div>
                    <div style="width:10px; height:10px; background:#40c463; border-radius:2px;"></div>
                    <div style="width:10px; height:10px; background:#30a14e; border-radius:2px;"></div>
                    <div style="width:10px; height:10px; background:#216e39; border-radius:2px;"></div>
                    <span>More</span>
                </div>
            `;

            container.innerHTML = html;
        } catch (e) {
            console.error("Heatmap Error:", e);
        }
    }

    showDayActivity(date) {
        const count = this.heatmapData[date] || 0;
        alert(`Activity on ${date}: ${count} actions logged.`);
    }

    // ============================================================
    //  CORE ADMIN METHODS
    // ============================================================
    updateUserDisplay() {
        const userDisplayName = document.getElementById('userDisplayName');
        const name = this.currentUser.displayName || this.currentUser.email.split('@')[0];
        if (userDisplayName) userDisplayName.textContent = name;
    }

    setupNotifications() {
        if (typeof NotificationSystem !== 'undefined') {
            const ns = new NotificationSystem(this.currentUser.uid);
            ns.init('notificationBell');
        }
    }

    async loadStats() {
        if (!window.SupabaseService) return;
        const container = document.getElementById('adminStatsGrid');
        if (!container) return;
        
        try {
            // Using Supabase as the single source for stats
            const [profiles, projects, mentorships] = await Promise.all([
                window.SupabaseService.getAllProfiles(),
                window.SupabaseService.getProjects(),
                window.SupabaseService.getMentorships()
            ]);

            const pMentors = (profiles || []).filter(u => u.role === 'mentor' && (u.status === 'pending' || u.status === 'pending_approval')).length;
            const pProjects = (projects || []).filter(p => p.status === 'pending').length;

            const stats = [
                { label: 'Total Members', value: (profiles || []).length, icon: 'fa-users', color: '#3b82f6' },
                { label: 'Innovators', value: (profiles || []).filter(u => u.role === 'innovator').length, icon: 'fa-lightbulb', color: '#10b981' },
                { label: 'Mentors', value: (profiles || []).filter(u => u.role === 'mentor').length, icon: 'fa-graduation-cap', color: '#f59e0b' },
                { label: 'Pending Mentors', value: pMentors, icon: 'fa-user-clock', color: '#f59e0b' },
                { label: 'Mentorship Pairs', value: (mentorships || []).filter(m => m.status === 'accepted').length, icon: 'fa-handshake', color: '#ec4899' },
                { label: 'Pending Reviews', value: pProjects + pMentors, icon: 'fa-clock', color: '#f43f5e' }
            ];

            container.innerHTML = stats.map(s => `
                <div class="premium-card">
                    <div class="premium-card-icon" style="background:rgba(0,0,0,0.03); color:${s.color};">
                        <i class="fa ${s.icon}"></i>
                    </div>
                    <div>
                        <div class="h3 fw-bold mb-0">${s.value}</div>
                        <div class="text-uppercase fw-bold text-muted small" style="font-size:0.65rem;">${s.label}</div>
                    </div>
                </div>
            `).join('');

            // Update Sidebar Badge
            const badge = document.getElementById('pendingMentorBadge');
            if (badge) {
                if (pMentors > 0) {
                    badge.textContent = pMentors;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }

        } catch (e) {
            console.error("Admin Stats: Supabase sync failed", e);
        }
    }

    showSection(sectionName) {
        document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        const section = document.getElementById(sectionName + 'Section');
        if (section) {
            section.style.display = 'block';
            const link = document.querySelector(`.nav-link[onclick*="'${sectionName}'"]`);
            if (link) link.classList.add('active');
        }

        // Section Specific Loads
        switch(sectionName) {
            case 'adminOverview': this.loadStats(); this.renderActivityHeatmap(); break;
            case 'projectApprovals': this.loadProjectReviews(); break;
            case 'mentorApprovals': this.loadMentorApprovals(); break;
            case 'users': this.loadUsers(); break;
            case 'eventsManagement': this.loadAdminEvents(); break;
            case 'mentorshipPairings': this.loadMentorships(); break;
        }
    }

    setRoleFilter(role) {
        console.log("Admin Dashboard: Setting role filter to", role);
        this.currentRoleFilter = role;
        
        // Update UI buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.getAttribute('onclick')?.includes(`'${role}'`)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.loadUsers();
    }

    // ============================================================
    //  PROJECT MANAGEMENT
    // ============================================================
    async loadProjectReviews() {
        const container = document.getElementById('projectApprovalList');
        if (!container) return;
        
        container.innerHTML = '<div class="text-center p-5"><span class="spinner-border"></span></div>';
        try {
            const projects = await window.SupabaseService.getProjects({ status: 'pending' });
            
            if (!projects || projects.length === 0) {
                container.innerHTML = '<div class="text-center p-5 text-muted">No projects pending review.</div>';
                return;
            }

            container.innerHTML = projects.map(p => {
                return `
                    <div class="dashboard-card mb-3 p-4">
                        <div class="d-flex justify-content-between">
                            <h5 class="fw-bold text-primary">${p.title}</h5>
                            <span class="badge bg-warning text-dark">Pending</span>
                        </div>
                        <p class="text-muted mt-2">${p.problem_statement ? p.problem_statement.substring(0, 150) + '...' : 'No description'}</p>
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn btn-sm btn-success px-3" onclick="adminDashboard.approveProject('${p.id}')">Approve</button>
                            <button class="btn btn-sm btn-outline-danger px-3" onclick="adminDashboard.rejectProject('${p.id}')">Reject</button>
                        </div>
                    </div>`;
            }).join('');
        } catch (e) {
            console.error(e);
            container.innerHTML = '<div class="alert alert-danger">Error loading projects.</div>';
        }
    }

    async approveProject(id) {
        try {
            if (window.SupabaseService) {
                await window.SupabaseService.updateProjectStatus(id, 'approved');
            }
            // Firestore background sync removed

            alert('Project approved!');
            this.loadProjectReviews();
        } catch(e) { alert(e.message); }
    }

    async rejectProject(id) {
        try {
            if (window.SupabaseService) {
                await window.SupabaseService.updateProjectStatus(id, 'rejected');
            }
            // Firestore background sync removed

            alert('Project rejected.');
            this.loadProjectReviews();
        } catch(e) { alert(e.message); }
    }

    // ============================================================
    //  USER & MENTOR MANAGEMENT
    // ============================================================
    async loadUsers() {
        const container = document.getElementById('usersCardGrid');
        if (!container) return;
        
        container.innerHTML = '<div class="text-center p-5 w-100"><span class="spinner-border"></span></div>';
        try {
            if (!window.SupabaseService) return;
            const filter = this.currentRoleFilter === 'all' ? null : this.currentRoleFilter;
            const profiles = await window.SupabaseService.getAllProfiles(filter);
            let users = (profiles || []).filter(u => u.role !== 'admin');

            console.group("Admin Dashboard: User Data Log");
            console.log("Current Filter:", this.currentRoleFilter);
            console.log("Total Profiles Fetched:", profiles?.length || 0);
            console.log("Innovators:", users.filter(u => u.role === 'innovator').length);
            console.log("Mentors:", users.filter(u => u.role === 'mentor').length);
            console.groupEnd();

            if (users.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-5 w-100">
                        <div class="mb-3"><i class="fa fa-users-slash display-4 text-muted"></i></div>
                        <h4 class="text-muted">No users found for this filter.</h4>
                        <p class="text-muted small">Try switching to 'All Members' or check if users have synced from Firebase.</p>
                    </div>`;
                return;
            }

            container.innerHTML = users.map(u => `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="premium-user-card p-4 h-100" style="background:#fff; border-radius:20px; box-shadow:0 8px 30px rgba(0,0,0,0.05); display:flex; flex-direction:column;">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <div style="width:50px; height:50px; background:#f1f5f9; border-radius:15px; display:flex; align-items:center; justify-content:center; font-weight:800; color:#1a5e4f; flex-shrink:0;">
                                ${(u.full_name || u.fullName || u.email || 'U').substring(0, 2).toUpperCase()}
                            </div>
                            <div style="min-width:0;">
                                <h6 class="mb-0 fw-bold text-truncate">${u.full_name || u.fullName || 'ID: ' + u.id.substring(0, 8)}</h6>
                                <p class="mb-0 small text-muted text-uppercase fw-bold" style="font-size:0.65rem;">${u.role}</p>
                            </div>
                        </div>
                        <div class="small text-muted mb-3 text-truncate"><i class="fa fa-envelope me-2"></i>${u.email || 'No email provided'}</div>
                        <div class="mb-3 small">
                            <span class="badge ${u.status === 'approved' || u.status === 'active' ? 'bg-success' : 'bg-warning'} text-white">
                                ${u.status || 'pending'}
                            </span>
                        </div>
                        <div class="mt-auto">
                            <button class="btn btn-sm btn-outline-danger w-100 rounded-pill" onclick="adminDashboard.deleteUser('${u.id}')">Block Account</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch(e) {
            console.error("Error loading users:", e);
            container.innerHTML = '<div class="alert alert-danger">Error loading users. Please check the console for details.</div>';
        }
    }

    async deleteUser(id) {
        if (!confirm('Permanently remove this user?')) return;
        try {
            if (window.SupabaseService) {
                await window.SupabaseService.updateProfileStatus(id, 'blocked');
            }
            alert('User blocked.');
            this.loadUsers();
        } catch(e) {}
    }

    async loadMentorApprovals() {
        const container = document.getElementById('mentorApprovalList');
        if (!container) return;
        
        container.innerHTML = '<div class="text-center p-5"><span class="spinner-border text-primary"></span></div>';

        try {
            let pendingMentors = [];

            // 1. Fetch from Supabase (Primary)
            if (window.SupabaseService) {
                const sbMentors = await window.SupabaseService.getProfilesByRole('mentor');
                if (sbMentors) {
                    pendingMentors = sbMentors
                        .filter(m => m.status === 'pending' || m.status === 'pending_approval')
                        .map(m => ({
                            id: m.id,
                            fullName: m.full_name,
                            institution: m.institution,
                            expertise: m.expertise,
                            bio: m.bio,
                            status: m.status
                        }));
                    console.log("Admin: Loaded pending mentors from Supabase ✓");
                }
            }

            if (pendingMentors.length === 0) {
                container.innerHTML = '<div class="text-center p-5 text-muted">No pending mentor applications.</div>';
                return;
            }

            container.innerHTML = pendingMentors.map(m => `
                <div class="dashboard-card mb-3 p-4 border-start border-warning border-4">
                    <h5 class="fw-bold">${m.fullName}</h5>
                    <div class="small text-muted mb-2">${m.institution || 'N/A'} | ${m.expertise || 'Expert'}</div>
                    <p class="small text-dark mb-3">${m.bio || 'No bio provided.'}</p>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-success px-4" onclick="adminDashboard.approveMentor('${m.id}')">Approve</button>
                        <button class="btn btn-sm btn-outline-danger px-4" onclick="adminDashboard.rejectMentor('${m.id}')">Reject</button>
                    </div>
                </div>`).join('');
        } catch (e) {
            console.error(e);
            container.innerHTML = '<div class="alert alert-danger">Error loading mentors.</div>';
        }
    }

    async approveMentor(id) {
        try {
            if (window.SupabaseService) {
                await window.SupabaseService.updateProfileStatus(id, 'approved');
                
                // Send Notification
                if (typeof NotificationSystem !== 'undefined') {
                    await NotificationSystem.send(id, "Your mentor application has been approved! Welcome to Innovate Hub.");
                }
            }
            
            alert('Mentor approved!');
            this.loadMentorApprovals();
        } catch(e) {
            console.error("Error approving mentor:", e);
        }
    }

    async rejectMentor(id) {
        try {
            if (window.SupabaseService) {
                await window.SupabaseService.updateProfileStatus(id, 'rejected');
                
                // Send Notification
                if (typeof NotificationSystem !== 'undefined') {
                    await NotificationSystem.send(id, "We regret to inform you that your mentor application was not approved at this time.");
                }
            }
            
            alert('Mentor rejected.');
            this.loadMentorApprovals();
        } catch(e) {
            console.error("Error rejecting mentor:", e);
        }
    }

    // ============================================================
    //  MENTORSHIP PAIRING APPROVALS
    // ============================================================
    // loadMentorshipApprovals, approvePairing, rejectPairing removed as mentors now handle these directly.

    // ============================================================
    //  EVENT MANAGEMENT
    // ============================================================
    async loadAdminEvents() {
        const container = document.getElementById('adminEventsGrid');
        if (!container) return;
        
        container.innerHTML = '<div class="col-12 text-center p-4"><span class="spinner-border"></span></div>';
        try {
            if (!window.SupabaseService) return;
            const events = await window.SupabaseService.getEvents();
            if (!events || events.length === 0) {
                container.innerHTML = '<div class="col-12 text-center text-muted">No events found.</div>';
                return;
            }

            container.innerHTML = events.map(ev => `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; margin-bottom:0.5rem; background:#fff; border-radius:12px; border:1px solid #e2e8f0; gap:1rem;">
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:700; font-size:0.85rem; color:#1a202c; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ev.title}</div>
                            <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">${ev.event_date || 'No Date'} &bull; ${ev.location}</div>
                        </div>
                        <div style="display:flex; gap:0.4rem; flex-shrink:0;">
                            <button onclick="adminDashboard.editEvent('${ev.id}')" title="Edit"
                                style="width:32px; height:32px; border-radius:8px; border:1px solid #c7d2fe; background:#eef2ff; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onclick="adminDashboard.deleteEvent('${ev.id}')" title="Delete"
                                style="width:32px; height:32px; border-radius:8px; border:1px solid #fecaca; background:#fef2f2; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                        </div>
                    </div>`
            ).join('');
        } catch(e) {
            console.error("Error loading events:", e);
            container.innerHTML = `<div class="col-12 text-center text-danger py-4">
                <i class="fa fa-exclamation-circle mb-2"></i><br>
                Failed to load events. Please check the console.
            </div>`;
        }
    }

    async handleEventSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const btn = document.getElementById('adminEventSubmitBtn');
        const id = document.getElementById('adminEventId').value;
        const existingImageURL = document.getElementById('existingImageURL').value;
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';
        
        let imageUrl = existingImageURL;
        const fileInput = form.eventImage;
        const file = fileInput.files[0];

        try {
            if (file) {
                if (!window.supabase) throw new Error("Supabase is not initialized. Please refresh the page.");
                
                const fileExt = file.name.split('.').pop();
                const fileName = `event-${Date.now()}.${fileExt}`;
                const filePath = `events/${fileName}`;

                const { data, error } = await window.supabase.storage
                    .from('project-documents')
                    .upload(filePath, file);

                if (error) throw error;

                const { data: { publicUrl } } = window.supabase.storage
                    .from('project-documents')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            const data = {
                title: form.title.value,
                description: form.description.value,
                date: form.date.value,
                time: form.time.value,
                location: form.location.value,
                imageLink: imageUrl
            };

            if (id) {
                // Supabase Sync: Update Existing Event
                if (window.SupabaseService) {
                    try {
                        await window.SupabaseService.upsertEvent({
                            id: id,
                            title: data.title,
                            description: data.description,
                            event_date: data.date,
                            event_time: data.time,
                            location: data.location,
                            image_url: data.imageLink
                        });
                        console.log("Supabase Event Sync: Updated");
                    } catch (sbErr) {
                        console.error("Supabase Event Sync Error", sbErr);
                        throw sbErr; // Rethrow to catch in the main block
                    }
                }
                alert('Event updated!');
            } else {
                // Supabase Sync: Create New Event (Omit ID to let DB generate UUID)
                if (window.SupabaseService) {
                    try {
                        await window.SupabaseService.upsertEvent({
                            title: data.title,
                            description: data.description,
                            event_date: data.date,
                            event_time: data.time,
                            location: data.location,
                            image_url: data.imageLink
                        });
                        console.log("Supabase Event Sync: Created");
                    } catch (sbErr) {
                        console.error("Supabase Event Sync Error", sbErr);
                        throw sbErr; // Rethrow to catch in the main block
                    }
                }
                alert('Event created!');
            }
            form.reset();
            document.getElementById('adminEventId').value = '';
            document.getElementById('existingImageURL').value = 'assets/img/event-default.jpg';
            btn.textContent = 'Publish Event';
            document.getElementById('adminEventCancelBtn').style.display = 'none';
            this.loadAdminEvents();
        } catch (err) { 
            alert(`Error saving event: ${err.message}`); 
            btn.textContent = id ? 'Update Event' : 'Publish Event';
        } finally { 
            btn.disabled = false; 
        }
    }

    async editEvent(id) {
        try {
            let ev = null;
            if (window.SupabaseService) {
                const sbEvent = await window.SupabaseService.getEventById(id);
                if (sbEvent) {
                    ev = {
                        title: sbEvent.title,
                        description: sbEvent.description,
                        date: sbEvent.event_date,
                        time: sbEvent.event_time,
                        location: sbEvent.location,
                        imageLink: sbEvent.image_url
                    };
                }
            }
            if (!ev) return;
            const form = document.getElementById('adminEventForm');
            form.title.value = ev.title;
            form.description.value = ev.description;
            form.date.value = ev.date;
            form.time.value = ev.time;
            form.location.value = ev.location;
            document.getElementById('existingImageURL').value = ev.imageLink;
            document.getElementById('adminEventId').value = id;
            document.getElementById('adminEventSubmitBtn').textContent = 'Update Event';
            document.getElementById('adminEventCancelBtn').style.display = 'block';
            form.scrollIntoView({ behavior: 'smooth' });
        } catch(e) {}
    }

    cancelEventEdit() {
        const form = document.getElementById('adminEventForm');
        form.reset();
        document.getElementById('adminEventId').value = '';
        document.getElementById('existingImageURL').value = 'assets/img/event-default.jpg';
        document.getElementById('adminEventSubmitBtn').textContent = 'Publish Event';
        document.getElementById('adminEventCancelBtn').style.display = 'none';
        form.scrollIntoView({ behavior: 'smooth' });
    }

    async deleteEvent(id) {
        if (!confirm('Delete this event?')) return;
        try {
            if (window.SupabaseService) {
                await window.SupabaseService.deleteEvent(id);
            }
            // Firestore delete removed
            this.loadAdminEvents();
        } catch(e) {}
    }

    // ============================================================
    //  MENTORSHIP PAIRINGS
    // ============================================================
    async loadMentorships() {
        const container = document.getElementById('mentorshipsTableBody');
        if (!container) return;
        
        container.innerHTML = '<tr><td colspan="5" class="text-center py-4"><span class="spinner-border text-primary"></span></td></tr>';
        try {
            let matches = [];

            // 1. Try Supabase First
            if (window.SupabaseService) {
                try {
                    const sbMatches = await window.SupabaseService.getMentorships();
                    if (sbMatches && sbMatches.length > 0) {
                        matches = sbMatches.map(m => ({
                            id: m.id,
                            innovatorName: m.innovator?.full_name || 'Unknown',
                            mentorName: m.mentor?.full_name || 'Unknown',
                            status: m.status,
                            createdAt: m.created_at
                        }));
                        console.log("Admin Pairings: Loaded from Supabase");
                    }
                } catch (sbErr) {
                    console.error("Admin Pairings: Supabase fetch failed", sbErr);
                }
            }

            // 2. Fallback removed
            if (matches.length === 0) {
                console.log("Admin Pairings: No records found in Supabase");
            }

            if (matches.length === 0) {
                container.innerHTML = '<tr><td colspan="5" class="text-center py-4">No pairings found.</td></tr>';
                return;
            }

            container.innerHTML = matches.map(m => `
                <tr>
                    <td><strong>${m.innovatorName}</strong></td>
                    <td><strong>${m.mentorName}</strong></td>
                    <td><span class="badge bg-light text-dark border">${m.status}</span></td>
                    <td>${m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td><button class="btn btn-sm btn-outline-danger" onclick="adminDashboard.terminateMentorship('${m.id}')">Dissolve</button></td>
                </tr>`).join('');
        } catch(e) {
            console.error(e);
            container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Error loading pairings</td></tr>';
        }
    }

    async terminateMentorship(id) {
        if (!confirm('Dissolve this mentorship link?')) return;
        try {
            // 1. Delete from Firestore - Removed

            // 2. Supabase Sync: Update Status to terminated (or delete)
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.updateMentorshipStatus(id, 'terminated');
                    console.log("Admin: Termination synced to Supabase");
                } catch (sbErr) {
                    console.error("Admin: Supabase termination sync failed", sbErr);
                }
            }

            showToast('Mentorship dissolved successfully.');
            this.loadMentorships();
        } catch(e) {
            console.error(e);
            showToast('Failed to dissolve mentorship.', 'error');
        }
    }

    // ============================================================
    //  MANUAL MENTOR REGISTRATION
    // ============================================================
    async handleManualMentorRegistration(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;

        const data = {
            fullName: form.fullName.value,
            email: form.email.value.toLowerCase(),
            role: 'mentor',
            status: 'approved',
            isApproved: true,
            approvalStatus: 'approved',
            mentorStatus: 'approved',
            institution: form.institution.value,
            expertise: form.expertise.value,
            expertise: form.expertise.value,
        };

        try {
            // 1. Add to Firestore - Removed
            const mockId = 'mentor_' + Date.now();

            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.upsertProfile({
                        id: mockId,
                        email: data.email,
                        full_name: data.fullName,
                        role: 'mentor',
                        status: 'approved',
                        approval_status: 'approved',
                        institution: data.institution,
                        expertise: data.expertise
                    });
                    console.log("Admin: Manual mentor sync to Supabase success");
                } catch (sbErr) {
                    console.error("Admin: Supabase manual mentor sync failed", sbErr);
                }
            }

            alert('Mentor registered successfully!');
            form.reset();
            this.loadUsers();
            this.loadStats();
        } catch(e) { 
            alert(e.message); 
        } finally { 
            btn.disabled = false; 
        }
    }

    async deleteUser(id) {
        if (!confirm('Permanently remove this user?')) return;
        try {
            // 1. Delete from Firestore - Removed

            // 2. Supabase Sync: Update Status to 'blocked' or 'deleted'
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.updateProfileStatus(id, 'blocked');
                    console.log("Admin: User block synced to Supabase");
                } catch (sbErr) {
                    console.error("Admin: Supabase user block sync failed", sbErr);
                }
            }

            alert('User removed.');
            this.loadUsers();
            this.loadStats();
        } catch(e) {
            console.error(e);
        }
    }

    async logout() {
        try {
            // Sign out from Supabase to invalidate the server session
            if (window.supabase) {
                await window.supabase.auth.signOut();
            }
            localStorage.removeItem('innovateHubUser');
            localStorage.removeItem('justLoggedIn');
            sessionStorage.clear();
            // Redirect to homepage using replace() so back-button can't return
            window.location.replace('index.html');
        } catch (e) {
            console.error('Admin logout error:', e);
            localStorage.removeItem('innovateHubUser');
            localStorage.removeItem('justLoggedIn');
            sessionStorage.clear();
            window.location.replace('index.html');
        }
    }
}

// Global Exports
window.AdminDashboard = AdminDashboard;
// NOTE: window.logout is intentionally NOT overridden here.
// The canonical logout is defined in shared-ui.js and handles Supabase signOut + redirect to index.html.
// The admin 'End Session' button calls window.logout() which uses that shared implementation.
window.showSection = (section) => window.adminDashboard?.showSection(section);

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

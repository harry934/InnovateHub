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
    orderBy,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.eventsLoaded = false;
        this.heatmapData = {};
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
            await this.renderActivityHeatmap();
            
            // Make instance globally available for onclick handlers
            window.adminDashboard = this;
            window.AdminPanel = this; // Backward compatibility for legacy handlers
            
            this.setupEventListeners();
        });
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
            // Fetch multiple collections to consolidate activity
            const [projects, reports, comments, pairings] = await Promise.all([
                getDocs(collection(db, 'projects')),
                getDocs(collection(db, 'milestoneReports')),
                getDocs(collection(db, 'collaborationComments')),
                getDocs(collection(db, 'mentorshipRequests'))
            ]);

            const activityMap = {};
            const process = (snap) => {
                snap.forEach(doc => {
                    const data = doc.data();
                    const date = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null);
                    if (date) {
                        const dateString = date.toISOString().split('T')[0];
                        activityMap[dateString] = (activityMap[dateString] || 0) + 1;
                    }
                });
            };

            process(projects);
            process(reports);
            process(comments);
            process(pairings);

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
        const container = document.getElementById('adminStatsGrid');
        if (!container) return;
        
        try {
            const [usersSnap, projectsSnap, pairsSnap] = await Promise.all([
                getDocs(collection(db, 'users')),
                getDocs(collection(db, 'projects')),
                getDocs(collection(db, 'mentorshipRequests'))
            ]);
            
            const users = usersSnap.docs.map(d => d.data());
            const projects = projectsSnap.docs.map(d => d.data());
            
            const stats = [
                { label: 'Total Members', value: users.length, icon: 'fa-users', color: '#3b82f6' },
                { label: 'Innovators', value: users.filter(u => u.role === 'innovator').length, icon: 'fa-lightbulb', color: '#10b981' },
                { label: 'Mentors', value: users.filter(u => u.role === 'mentor').length, icon: 'fa-graduation-cap', color: '#f59e0b' },
                { label: 'Active Projects', value: projects.filter(p => p.status === 'approved').length, icon: 'fa-project-diagram', color: '#6366f1' },
                { label: 'Mentorship Pairs', value: pairsSnap.docs.filter(d => d.data().status === 'accepted').length, icon: 'fa-handshake', color: '#ec4899' },
                { label: 'Pending Reviews', value: projects.filter(p => p.status === 'pending').length, icon: 'fa-clock', color: '#f43f5e' }
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

        } catch (e) {
            console.error(e);
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
            case 'mentorshipApprovals': this.loadMentorshipApprovals(); break;
            case 'users': this.loadUsers(); break;
            case 'eventsManagement': this.loadAdminEvents(); break;
            case 'mentorshipPairings': this.loadMentorships(); break;
            case 'rejectionRequests': this.loadRejectionRequests(); break;
        }
    }

    // ============================================================
    //  PROJECT MANAGEMENT
    // ============================================================
    async loadProjectReviews() {
        const container = document.getElementById('projectApprovalList');
        if (!container) return;
        
        container.innerHTML = '<div class="text-center p-5"><span class="spinner-border"></span></div>';
        try {
            const q = query(collection(db, 'projects'), where('status', '==', 'pending'));
            const snap = await getDocs(q);
            
            if (snap.empty) {
                container.innerHTML = '<div class="text-center p-5 text-muted">No projects pending review.</div>';
                return;
            }

            container.innerHTML = snap.docs.map(docSnap => {
                const p = { id: docSnap.id, ...docSnap.data() };
                return `
                    <div class="dashboard-card mb-3 p-4">
                        <div class="d-flex justify-content-between">
                            <h5 class="fw-bold text-primary">${p.title}</h5>
                            <span class="badge bg-warning text-dark">Pending</span>
                        </div>
                        <p class="text-muted mt-2">${p.problemStatement ? p.problemStatement.substring(0, 150) + '...' : 'No description'}</p>
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn btn-sm btn-success px-3" onclick="adminDashboard.approveProject('${p.id}')">Approve</button>
                            <button class="btn btn-sm btn-outline-danger px-3" onclick="adminDashboard.rejectProject('${p.id}')">Reject</button>
                        </div>
                    </div>`;
            }).join('');
        } catch (e) {}
    }

    async approveProject(id) {
        try {
            await updateDoc(doc(db, 'projects', id), { status: 'approved' });
            alert('Project approved!');
            this.loadProjectReviews();
        } catch(e) { alert(e.message); }
    }

    async rejectProject(id) {
        try {
            await updateDoc(doc(db, 'projects', id), { status: 'rejected' });
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
            const snap = await getDocs(collection(db, 'users'));
            let users = [];
            snap.forEach(d => { if (d.data().role !== 'admin') users.push({ id: d.id, ...d.data() }); });

            container.innerHTML = users.map(u => `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="premium-user-card p-4" style="background:#fff; border-radius:20px; box-shadow:0 8px 30px rgba(0,0,0,0.05);">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <div style="width:50px; height:50px; background:#f1f5f9; border-radius:15px; display:flex; align-items:center; justify-content:center; font-weight:800; color:#1a5e4f;">${(u.fullName || u.email).substring(0, 2).toUpperCase()}</div>
                            <div>
                                <h6 class="mb-0 fw-bold">${u.fullName || 'User'}</h6>
                                <p class="mb-0 small text-muted">${u.role}</p>
                            </div>
                        </div>
                        <div class="small text-muted mb-3"><i class="fa fa-envelope me-2"></i>${u.email}</div>
                        <button class="btn btn-sm btn-outline-danger w-100 rounded-pill" onclick="adminDashboard.deleteUser('${u.id}')">Block Account</button>
                    </div>
                </div>
            `).join('');
        } catch(e) {}
    }

    async deleteUser(id) {
        if (!confirm('Permanently remove this user?')) return;
        try {
            await deleteDoc(doc(db, 'users', id));
            alert('User removed.');
            this.loadUsers();
        } catch(e) {}
    }

    async loadMentorApprovals() {
        const container = document.getElementById('mentorApprovalList');
        if (!container) return;
        
        try {
            const q = query(collection(db, 'users'), where('role', '==', 'mentor'), where('status', '==', 'pending'));
            const snap = await getDocs(q);
            
            if (snap.empty) {
                container.innerHTML = '<div class="text-center p-5 text-muted">No pending mentor applications.</div>';
                return;
            }

            container.innerHTML = snap.docs.map(docSnap => {
                const m = { id: docSnap.id, ...docSnap.data() };
                return `
                    <div class="dashboard-card mb-3 p-4 border-start border-warning border-4">
                        <h5 class="fw-bold">${m.fullName}</h5>
                        <div class="small text-muted mb-2">${m.institution || 'N/A'} | ${m.expertise || 'Expert'}</div>
                        <p class="small text-dark mb-3">${m.bio || 'No bio provided.'}</p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-success px-4" onclick="adminDashboard.approveMentor('${m.id}')">Approve</button>
                            <button class="btn btn-sm btn-outline-danger px-4" onclick="adminDashboard.rejectMentor('${m.id}')">Reject</button>
                        </div>
                    </div>`;
            }).join('');
        } catch (e) {}
    }

    async approveMentor(id) {
        try {
            await updateDoc(doc(db, 'users', id), { status: 'approved', isApproved: true });
            alert('Mentor approved!');
            this.loadMentorApprovals();
        } catch(e) {}
    }

    async rejectMentor(id) {
        try {
            await updateDoc(doc(db, 'users', id), { status: 'rejected' });
            alert('Mentor rejected.');
            this.loadMentorApprovals();
        } catch(e) {}
    }

    // ============================================================
    //  MENTORSHIP PAIRING APPROVALS
    // ============================================================
    async loadMentorshipApprovals() {
        const container = document.getElementById('mentorshipApprovalList');
        if (!container) return;
        
        container.innerHTML = '<div class="text-center p-5"><span class="spinner-border"></span></div>';
        try {
            const q = query(collection(db, 'mentorshipRequests'), where('status', '==', 'pending_admin'));
            const snap = await getDocs(q);
            
            if (snap.empty) {
                container.innerHTML = '<div class="text-center p-5 text-muted">No pairings awaiting admin approval.</div>';
                return;
            }

            let html = '';
            for (const docSnap of snap.docs) {
                const r = { id: docSnap.id, ...docSnap.data() };
                const [iDoc, mDoc, pDoc] = await Promise.all([
                    getDoc(doc(db, 'users', r.innovatorId)),
                    getDoc(doc(db, 'users', r.mentorId)),
                    getDoc(doc(db, 'projects', r.projectId))
                ]);

                html += `
                    <div class="dashboard-card mb-3 p-4 border-start border-info border-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="fw-bold mb-0">Mentorship Pair Request</h5>
                            <span class="badge bg-info text-white">Pending Admin</span>
                        </div>
                        <div class="row g-3">
                            <div class="col-md-4">
                                <div class="small text-muted">Innovator</div>
                                <div class="fw-bold text-dark">${iDoc.exists() ? iDoc.data().fullName : 'Unknown'}</div>
                            </div>
                            <div class="col-md-4">
                                <div class="small text-muted">Mentor</div>
                                <div class="fw-bold text-dark">${mDoc.exists() ? mDoc.data().fullName : 'Unknown'}</div>
                            </div>
                            <div class="col-md-4">
                                <div class="small text-muted">Project</div>
                                <div class="fw-bold text-dark">${pDoc.exists() ? pDoc.data().title : 'General Mentorship'}</div>
                            </div>
                        </div>
                        <div class="d-flex gap-2 mt-4">
                            <button class="btn btn-sm btn-success px-4" onclick="adminDashboard.approvePairing('${r.id}')">Approve Pairing</button>
                            <button class="btn btn-sm btn-outline-danger px-4" onclick="adminDashboard.rejectPairing('${r.id}')">Reject Pairing</button>
                        </div>
                    </div>`;
            }
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<div class="alert alert-danger">Failed to load pairings: ' + e.message + '</div>';
        }
    }

    async approvePairing(id) {
        if (!confirm('Approve this mentor-mentee pairing? Both parties will gain access to the Collaboration Hub.')) return;
        try {
            await updateDoc(doc(db, 'mentorshipRequests', id), { 
                status: 'active',
                approvedAt: serverTimestamp()
            });
            alert('Pairing approved!');
            this.loadMentorshipApprovals();
        } catch(e) { alert(e.message); }
    }

    async rejectPairing(id) {
        if (!confirm('Reject this pairing request?')) return;
        try {
            await updateDoc(doc(db, 'mentorshipRequests', id), { status: 'rejected' });
            alert('Pairing rejected.');
            this.loadMentorshipApprovals();
        } catch(e) { alert(e.message); }
    }

    // ============================================================
    //  EVENT MANAGEMENT
    // ============================================================
    async loadAdminEvents() {
        const container = document.getElementById('adminEventsGrid');
        if (!container) return;
        
        container.innerHTML = '<div class="col-12 text-center p-4"><span class="spinner-border"></span></div>';
        try {
            const snap = await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')));
            if (snap.empty) {
                container.innerHTML = '<div class="col-12 text-center text-muted">No events found.</div>';
                return;
            }

            container.innerHTML = snap.docs.map(docSnap => {
                const ev = { id: docSnap.id, ...docSnap.data() };
                return `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; margin-bottom:0.5rem; background:#fff; border-radius:12px; border:1px solid #e2e8f0; gap:1rem;">
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:700; font-size:0.85rem; color:#1a202c; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ev.title}</div>
                            <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">${ev.date} &bull; ${ev.location}</div>
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
                    </div>`;
            }).join('');
        } catch(e) {}
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
                imageLink: imageUrl,
                updatedAt: serverTimestamp()
            };

            if (id) {
                await updateDoc(doc(db, 'events', id), data);
                alert('Event updated!');
            } else {
                data.createdAt = serverTimestamp();
                await addDoc(collection(db, 'events'), data);
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
            const snap = await getDoc(doc(db, 'events', id));
            if (!snap.exists()) return;
            const ev = snap.data();
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
            await deleteDoc(doc(db, 'events', id));
            this.loadAdminEvents();
        } catch(e) {}
    }

    // ============================================================
    //  MENTORSHIP PAIRINGS
    // ============================================================
    async loadMentorships() {
        const container = document.getElementById('mentorshipsTableBody');
        if (!container) return;
        
        container.innerHTML = '<tr><td colspan="5" class="text-center py-4"><span class="spinner-border"></span></td></tr>';
        try {
            const snap = await getDocs(collection(db, 'mentorshipRequests'));
            if (snap.empty) {
                container.innerHTML = '<tr><td colspan="5" class="text-center py-4">No pairings found.</td></tr>';
                return;
            }

            let html = '';
            for (let d of snap.docs) {
                const r = { id: d.id, ...d.data() };
                const iDoc = await getDoc(doc(db, 'users', r.innovatorId));
                const mDoc = await getDoc(doc(db, 'users', r.mentorId));
                
                html += `
                    <tr>
                        <td><strong>${iDoc.exists() ? iDoc.data().fullName : 'Unknown'}</strong></td>
                        <td><strong>${mDoc.exists() ? mDoc.data().fullName : 'Unknown'}</strong></td>
                        <td><span class="badge bg-light text-dark border">${r.status}</span></td>
                        <td>${r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                        <td><button class="btn btn-sm btn-outline-danger" onclick="adminDashboard.terminateMentorship('${r.id}')">Dissolve</button></td>
                    </tr>`;
            }
            container.innerHTML = html;
        } catch(e) {}
    }

    async terminateMentorship(id) {
        if (!confirm('Dissolve this mentorship link?')) return;
        try {
            await deleteDoc(doc(db, 'mentorshipRequests', id));
            this.loadMentorships();
        } catch(e) {}
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
            institution: form.institution.value,
            expertise: form.expertise.value,
            createdAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, 'users'), data);
            alert('Mentor registered successfully!');
            form.reset();
            this.loadUsers();
        } catch(e) { alert(e.message); }
        finally { btn.disabled = false; }
    }

    async logout() {
        try {
            await auth.signOut();
            localStorage.removeItem('innovateHubUser');
            window.location.href = 'login.html';
        } catch (e) {
            window.location.href = 'login.html';
        }
    }
}

// Global Exports
window.AdminDashboard = AdminDashboard;
window.logout = () => window.adminDashboard?.logout();
window.showSection = (section) => window.adminDashboard?.showSection(section);

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});

// Supabase Auth — auth state via window.supabase session or localStorage fallback

// Helper: get current Supabase user (sync-safe via localStorage)
function getCurrentAuthUser() {
    // 1. Try singleton manager first (Best source of truth)
    if (window.AuthManager && window.AuthManager.currentUser) {
        return window.AuthManager.currentUser;
    }
    // 2. Fallback to localStorage if AuthManager is not yet loaded
    const stored = localStorage.getItem('innovateHubUser');
    if (stored) {
        try { return JSON.parse(stored); } catch(e) {}
    }
    return null;
}

/**
 * CollaborationHub
 * Handles the shared mentorship workspace logic with a modern sidebar layout
 */
class CollaborationHub {
    constructor() {
        this.activeMentorshipId = null;
        this.mentorshipData = null;
        this.projectData = null;
        this.unsubscribeChat = null;
        this.milestones = [];
        this.allMentorships = [];
        this.isInnovator = false;
        this._partnerData = null;
        this._meetingLink = null;
        this._activeTab = 'feedback';
    }

    async init(mentorshipId) {
        console.log("CollaborationHub: Initializing...");
        
        try {
            // Use Supabase session / localStorage instead of Firebase auth
            const currentAuthUser = getCurrentAuthUser();
            if (!currentAuthUser || !currentAuthUser.uid) {
                console.warn("CollaborationHub: No user authenticated yet. Waiting for AuthManager...");
                // Don't redirect here, let dashboard.html handle auth guard
                setTimeout(() => this.init(mentorshipId), 1000);
                return;
            }

            if (!window.SupabaseService) {
                console.error("CollaborationHub: SupabaseService not found.");
                return;
            }

            const user = currentAuthUser;
            this.isInnovator = user.role === 'innovator';
            console.log(`CollaborationHub: User identity confirmed as ${this.isInnovator ? 'Innovator' : 'Mentor'}`);

            // Set role-based labels
            const roleBadge = document.getElementById('collabRoleBadge');
            if (roleBadge) {
                roleBadge.textContent = this.isInnovator ? 'Innovator View' : 'Mentor View';
                roleBadge.className = 'badge-role-view ' + (this.isInnovator ? 'bg-innovator' : 'bg-mentor');
            }

            const sidebarTitle = document.getElementById('collabSidebarTitle');
            if (sidebarTitle) sidebarTitle.textContent = this.isInnovator ? 'My Projects' : 'My Mentees';
            
            const toolsTitle = document.getElementById('toolsPanelTitle');
            if (toolsTitle) toolsTitle.textContent = this.isInnovator ? 'Growth & Progress' : 'Mentorship Tools';

            // 1. Fetch all accepted mentorships
            await this.loadAllMentorships();

            // 2. Set active mentorship
            let activeId = mentorshipId;
            if (!activeId && this.allMentorships.length > 0) {
                activeId = this.allMentorships[0].id;
            }

            if (activeId) {
                const session = this.allMentorships.find(m => m.id === activeId || m.project_id === activeId || m.id === `project_${activeId}`);
                if (session) activeId = session.id;
                await this.switchSession(activeId);
            } else { // If no id is provided or found, render empty state
                this.renderEmptyState();
            }
        } catch (error) {
            console.error("CollaborationHub Initialization Error:", error);
        }
    }

    async loadAllMentorships() {
        const currentAuthUser = getCurrentAuthUser();
        if (!currentAuthUser) return;
        const uid = currentAuthUser.uid;
        const role = this.isInnovator ? 'innovator' : 'mentor';
        
        console.log(`CollaborationHub: Loading data for ${role} ${uid}...`);
        
        try {
            // 1. Fetch data from Supabase
            const [projects, mentorships] = await Promise.all([
                this.isInnovator ? window.SupabaseService.getProjects({ innovator_id: uid }) : [],
                window.SupabaseService.getMentorships(uid, role)
            ]);

            this.allMentorships = [];

            if (this.isInnovator) {
                // If innovator, we want ALL projects, and then link mentorships to them
                this.allMentorships = await Promise.all((projects || []).map(async p => {
                    // Find an accepted mentorship for this project
                    const m = (mentorships || []).find(ms => ms.project_id === p.id && ms.status === 'accepted');
                    
                    let partner = m ? (m.mentor || m.profiles) : null;

                    // Manual fallback for partner if join failed but mentorship exists
                    if (m && !partner && m.mentor_id) {
                        console.log(`CollaborationHub: Manual fetch for mentor ${m.mentor_id}`);
                        partner = await window.SupabaseService.getProfile(m.mentor_id);
                    }

                    return {
                        id: m ? m.id : `project_${p.id}`,
                        project_id: p.id,
                        project: p,
                        partner: partner,
                        projectTitle: p.title || 'Untitled Project',
                        status: m ? m.status : 'unassigned',
                        pinned_guidance: m ? m.pinned_guidance : "No mentor assigned yet.",
                        isPlaceholder: !m,
                        created_at: m ? m.created_at : p.created_at
                    };
                }));
            } else {
                // If mentor, we only care about existing mentorships (Mentees)
                this.allMentorships = await Promise.all((mentorships || []).map(async m => {
                    let partner = m.innovator || m.profiles;
                    let project = m.project;

                    // Manual fallback for partner
                    if (!partner && m.innovator_id) {
                        console.log(`CollaborationHub: Manual fetch for innovator ${m.innovator_id}`);
                        partner = await window.SupabaseService.getProfile(m.innovator_id);
                    }

                    // Manual fallback for project
                    if (!project && m.project_id) {
                        console.log(`CollaborationHub: Manual fetch for project ${m.project_id}`);
                        const pData = await window.SupabaseService.getProjects({ id: m.project_id });
                        project = (pData && pData.length > 0) ? pData[0] : null;
                    }

                    return {
                        id: m.id,
                        project_id: m.project_id,
                        project: project || { title: 'General Mentorship' },
                        partner: partner,
                        projectTitle: project?.title || m.project_title || 'General Mentorship',
                        status: m.status,
                        pinned_guidance: m.pinned_guidance,
                        created_at: m.created_at
                    };
                }));
            }

            console.log(`CollaborationHub: Found ${this.allMentorships.length} total entries.`, this.allMentorships);
            this.renderSidebar();
            this.updateMentorSelector();
        } catch (err) {
            console.error("CollaborationHub: Error loading data", err);
        }
    }

    renderSidebar() {
        const container = document.getElementById('collabContactList');
        if (!container) return;

        if (this.allMentorships.length === 0) {
            container.innerHTML = '<div class="p-4 text-center text-muted small">No active mentorships found.</div>';
            return;
        }

        container.innerHTML = this.allMentorships.map(m => {
            const partner = m.partner || { full_name: 'Partner' };
            const isActive = m.id === this.activeMentorshipId;
            const statusLabel = m.id === 'demo_session' ? 'DEMO' : (m.status || 'Active').toUpperCase();
            
            // Status colors
            const statusColor = m.status === 'accepted' ? 'bg-success' : 'bg-warning text-dark';

            // Avatar logic
            const avatarHtml = partner.avatar_url 
                ? `<img src="${partner.avatar_url}" class="avatar-circle-sm" alt="${partner.full_name}">`
                : `<div class="avatar-circle-sm bg-teal text-white">${(partner.full_name || 'U').charAt(0)}</div>`;

            return `
                <div class="project-card-new ${isActive ? 'active' : ''}" onclick="window.CollaborationHub.switchSession('${m.id}')">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="fw-bold mb-0 text-dark" style="font-size: 0.95rem;">${m.projectTitle}</h6>
                        <span class="card-status-pill ${statusColor}">${statusLabel}</span>
                    </div>
                    <p class="small text-muted mb-2">
                        ${this.isInnovator ? `Mentor: ${partner.full_name || 'Assigned Mentor'}` : `Innovator: ${partner.full_name || 'Assigned Mentee'}`}
                    </p>
                    <div class="d-flex align-items-center justify-content-between mt-3 px-1">
                        <span class="small text-muted" style="font-size: 0.75rem;">
                            <i class="far fa-clock me-1"></i> ${m.created_at ? this.getRelativeTime(m.created_at) : 'Active now'}
                        </span>
                        <div class="partner-avatar-circles">
                            ${avatarHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Search logic
        const searchInput = document.getElementById('collabContactSearch');
        if (searchInput) {
            searchInput.oninput = (e) => {
                const term = e.target.value.toLowerCase();
                const cards = container.querySelectorAll('.project-card-new');
                cards.forEach((card, idx) => {
                    const m = this.allMentorships[idx];
                    const match = (m.projectTitle || '').toLowerCase().includes(term) || 
                                  (m.partner?.full_name || '').toLowerCase().includes(term);
                    card.style.display = match ? 'block' : 'none';
                });
            };
        }
        
        this.updateMentorSelector();
    }

    updateMentorSelector() {
        const selectorContainer = document.getElementById('collabMentorSelectorContainer');
        const selector = document.getElementById('collabMentorSelector');
        
        if (!selector || !selectorContainer) return;

        // Only show selector for innovators who have multiple mentors
        if (this.isInnovator && this.allMentorships.length > 0) {
            selectorContainer.style.display = 'block';
            
            // Clear and populate
            selector.innerHTML = '<option value="">Switch Mentorship...</option>';
            this.allMentorships.forEach(m => {
                const partnerName = m.partner?.full_name || 'Assigned Mentor';
                const isSelected = m.id === this.activeMentorshipId;
                const option = document.createElement('option');
                option.value = m.id;
                option.textContent = `${m.projectTitle} (with ${partnerName})`;
                if (isSelected) option.selected = true;
                selector.appendChild(option);
            });
        } else {
            selectorContainer.style.display = 'none';
        }
    }

    getRelativeTime(date) {
        const now = new Date();
        const past = new Date(date);
        if (isNaN(past.getTime())) return 'Active';
        const diffInMs = now - past;
        const diffInMins = Math.floor(diffInMs / 60000);
        
        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins} min ago`;
        
        const diffInHours = Math.floor(diffInMins / 60);
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        
        return past.toLocaleDateString();
    }

    async switchSession(mentorshipId) {
        console.log(`CollaborationHub: Switching to session ${mentorshipId}`);
        if (this.unsubscribeChat) {
            if (typeof this.unsubscribeChat === 'function') this.unsubscribeChat();
            else if (this.unsubscribeChat.unsubscribe) this.unsubscribeChat.unsubscribe();
        }
        this.activeMentorshipId = mentorshipId;
        
        // Update sidebar UI
        document.querySelectorAll('.project-card-new').forEach((card, idx) => {
            if (this.allMentorships[idx] && this.allMentorships[idx].id === mentorshipId) card.classList.add('active');
            else card.classList.remove('active');
        });

        // Update selector UI
        const selector = document.getElementById('collabMentorSelector');
        if (selector) selector.value = mentorshipId;

        if (mentorshipId === 'demo_session') {
            this.renderEmptyState();
            return;
        }

        const mentorship = this.allMentorships.find(m => m.id === mentorshipId);
        if (mentorship) {
            this.mentorshipData = mentorship;
            this._partnerData = mentorship.partner;
            // Ensure projectData is populated for the blueprint view
            this.projectData = mentorship.project || mentorship.projects || { title: mentorship.projectTitle };
            
            // Refresh full mentorship data to get latest reports_enabled status
            try {
                const refreshed = await window.SupabaseService.getMentorships(mentorshipId);
                if (refreshed && refreshed.length > 0) {
                    this.mentorshipData.reports_enabled = refreshed[0].reports_enabled;
                }
            } catch (e) {
                console.warn("Failed to refresh mentorship reports_enabled status", e);
            }
        }

        this.updateUI();
        this.startChatListener();
        this.renderToolsPanel();
        this.renderProjectDetails();
    }

    updateUI() {
        const m = this.mentorshipData;
        const partner = this._partnerData || { full_name: 'Partner' };
        
        // 1. Header Details
        const projectTitleEl = document.getElementById('collabProjectHeaderTitle');
        const partnerNameEl = document.getElementById('collabPartnerName');
        const roleBadgeEl = document.getElementById('collabRoleBadge');

        if (projectTitleEl) projectTitleEl.textContent = m.projectTitle || 'General Mentorship';
        if (partnerNameEl) partnerNameEl.textContent = partner.full_name;
        if (roleBadgeEl) roleBadgeEl.textContent = this.isInnovator ? 'Innovator View' : 'Mentor View';

        // 2. Progress Banner (Show for innovators or if mentor wants to see status)
        const progressContainer = document.getElementById('collabProgressContainer');
        if (progressContainer) {
            progressContainer.style.display = this.isInnovator ? 'block' : 'none';
            if (this.isInnovator) {
                this.updateProgressUI();
            }
        }

        // 3. Pinned Guidance
        const guidanceBox = document.getElementById('collabPinnedGuidance');
        const guidanceText = document.getElementById('pinnedGuidanceText');
        const editBtn = document.getElementById('editPinnedGuidance');

        if (guidanceText) {
            guidanceText.textContent = m.pinned_guidance || (this.isInnovator ? "No guidance pinned by mentor yet." : "Pin important notes or next steps here for the innovator.");
        }
        
        if (editBtn) {
            editBtn.style.display = this.isInnovator ? 'none' : 'block';
        }

        // 4. Meeting UI (Keep simple for now)
        this.updateMeetingUI();
    }

    async updateProgressUI() {
        // Calculate progress based on number of progress reports
        const reports = await window.SupabaseService.getProgressReports(this.activeMentorshipId);
        const feedbacks = await window.SupabaseService.getProjectFeedback(this.mentorshipData?.project_id);
        
        const reportCount = reports ? reports.length : 0;
        const feedbackCount = feedbacks ? feedbacks.length : 0;
        const percent = Math.min(reportCount * 20, 100); // 20% per report example
        
        const bar = document.getElementById('collabProgressBar');
        const percentText = document.getElementById('collabProgressPercent');
        const feedbackText = document.getElementById('collabFeedbackCount');
        const reportText = document.getElementById('collabReportCount');
        
        if (bar) bar.style.width = `${percent}%`;
        if (percentText) percentText.textContent = `${percent}% Complete`;
        if (feedbackText) feedbackText.textContent = feedbackCount;
        if (reportText) reportText.textContent = reportCount;
    }

    async updatePinnedGuidance() {
        if (this.isInnovator) return;
        
        const current = this.mentorshipData.pinned_guidance || "";
        const next = prompt("Edit Pinned Guidance for Mentee:", current);
        
        if (next !== null && next !== current) {
            try {
                await window.SupabaseService.updatePinnedGuidance(this.activeMentorshipId, next);
                this.mentorshipData.pinned_guidance = next;
                this.updateUI();
            } catch (err) {
                alert("Failed to update guidance. Check permissions.");
            }
        }
    }

    async renderToolsPanel() {
        const container = document.getElementById(this._activeTab === 'feedback' ? 'tab-feedback' : 'tab-reports');
        const otherContainer = document.getElementById(this._activeTab === 'feedback' ? 'tab-reports' : 'tab-feedback');
        if (!container) return;

        if (otherContainer) otherContainer.innerHTML = ''; // Clear other tab
        
        // Add Mentor Control Toggle for reports
        if (!this.isInnovator && this.activeMentorshipId !== 'demo_session') {
            const controlsHtml = `
                <div class="insight-card-premium mb-3 bg-light border-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="fw-bold mb-0" style="font-size: 0.85rem;">Allow Reports</h6>
                            <p class="extra-small text-muted mb-0">Let innovator submit progress updates</p>
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="allowReportsToggle" 
                                ${this.mentorshipData.reports_enabled ? 'checked' : ''} 
                                onchange="window.CollaborationHub.toggleReports(this.checked)">
                        </div>
                    </div>
                </div>
            `;
            // Prepend to the panel
            const panelHeader = document.querySelector('.tools-panel-header');
            if (panelHeader && !document.getElementById('allowReportsToggle')) {
                // Instead of prepending to panelHeader which might be shared, 
                // we'll add it above the tabs in the sidebar tools view if possible
            }
        }

        if (this._activeTab === 'feedback') {
            this.renderFeedbackTab(container);
        } else {
            this.renderReportsTab(container);
        }
    }

    switchToolsTab(tabId) {
        this._activeTab = tabId;
        document.querySelectorAll('#collabToolsTabs .nav-link').forEach(link => {
            if (link.dataset.tab === tabId) link.classList.add('active');
            else link.classList.remove('active');
        });
        this.renderToolsPanel();
    }

    async renderFeedbackTab(container) {
        let html = '';
        
        // Form for mentors
        if (!this.isInnovator && this.activeMentorshipId !== 'demo_session') {
            html += `
                <div class="insight-card-premium mb-4">
                    <h6 class="fw-bold mb-3"><i class="fas fa-plus-circle me-2 text-primary"></i>Give New Feedback</h6>
                    <textarea id="mentorFeedbackInput" class="form-control mb-3" rows="3" placeholder="Write your professional feedback..."></textarea>
                    <button class="btn btn-primary w-100 rounded-pill" onclick="window.CollaborationHub.submitGeneralFeedback()">
                        Post Feedback
                    </button>
                </div>
            `;
        }

        // List of feedbacks
        try {
            const feedbacks = await window.SupabaseService.getProjectFeedback(this.mentorshipData.project_id);
            if (feedbacks && feedbacks.length > 0) {
                html += feedbacks.map(f => `
                    <div class="insight-card-premium">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-light text-dark border">${new Date(f.created_at).toLocaleDateString()}</span>
                            <div class="text-warning small">
                                ${'<i class="fas fa-star"></i>'.repeat(f.stars || 5)}
                            </div>
                        </div>
                        <p class="small text-dark mb-0">${f.comment}</p>
                    </div>
                `).join('');
            } else {
                html += `<div class="text-center py-4 text-muted small">No feedback records yet.</div>`;
            }
        } catch (err) {
            html += `<div class="text-center py-4 text-danger small">Error loading feedback.</div>`;
        }
        
        container.innerHTML = `<div class="tools-pane-inner">${html}</div>`;
    }

    async renderReportsTab(container) {
        let html = '';
        
        // Form for innovators - gated by reports_enabled
        if (this.isInnovator && this.activeMentorshipId !== 'demo_session') {
            if (this.mentorshipData.reports_enabled) {
                html += `
                    <div class="insight-card-premium mb-4">
                        <h6 class="fw-bold mb-2"><i class="fas fa-file-upload me-2 text-orange"></i>Submit Progress</h6>
                        <p class="text-muted extra-small mb-3">Keep your mentor updated on your latest milestones.</p>
                        <input type="text" id="reportTitleInput" class="form-control mb-2" placeholder="Report Title (e.g., Week 2 Sync)">
                        <textarea id="reportSummaryInput" class="form-control mb-3" rows="3" placeholder="What have you achieved?"></textarea>
                        <button class="btn btn-orange w-100 text-white rounded-pill" onclick="window.CollaborationHub.submitReport()">
                            Submit Report
                        </button>
                    </div>
                `;
            } else {
                html += `
                    <div class="insight-card-premium mb-4 bg-light text-center border-dashed">
                        <div class="py-3">
                            <i class="fas fa-lock text-muted mb-2"></i>
                            <h6 class="fw-bold mb-1" style="font-size: 0.9rem;">Reports Locked</h6>
                            <p class="extra-small text-muted mb-0">Your mentor hasn't enabled progress reporting yet.</p>
                        </div>
                    </div>
                `;
            }
        }

        // List of reports
        try {
            const reports = await window.SupabaseService.getProgressReports(this.activeMentorshipId);
            if (reports && reports.length > 0) {
                html += reports.map(r => `
                    <div class="insight-card-premium">
                        <h6 class="fw-bold mb-1" style="font-size: 0.9rem;">${r.title || 'Progress Update'}</h6>
                        <span class="badge bg-light text-muted border mb-2" style="font-size: 0.65rem;">${new Date(r.created_at).toLocaleDateString()}</span>
                        <p class="small text-muted mb-0">${r.summary}</p>
                        ${r.next_steps ? `<div class="mt-2 pt-2 border-top extra-small text-dark"><strong>Next:</strong> ${r.next_steps}</div>` : ''}
                    </div>
                `).join('');
            } else {
                html += `<div class="text-center py-4 text-muted small">No progress reports found.</div>`;
            }
        } catch (err) {
            html += `<div class="text-center py-4 text-danger small">Error loading reports.</div>`;
        }

        container.innerHTML = `<div class="tools-pane-inner">${html}</div>`;
    }

    async submitGeneralFeedback() {
        const input = document.getElementById('mentorFeedbackInput');
        const comment = input.value.trim();
        if (!comment) return;

        const uid = getCurrentAuthUser()?.uid;
        try {
            await window.SupabaseService.submitFeedback({
                mentorship_id: this.activeMentorshipId,
                project_id: this.mentorshipData.project_id,
                mentor_id: uid,
                comment: comment,
                stars: 5
            });
            input.value = '';
            this.renderFeedbackTab(document.getElementById('tab-feedback'));
        } catch (err) {
            alert("Failed to post feedback.");
        }
    }

    async submitReport() {
        const titleInput = document.getElementById('reportTitleInput');
        const summaryInput = document.getElementById('reportSummaryInput');
        const title = titleInput.value.trim();
        const summary = summaryInput.value.trim();

        if (!title || !summary) {
            alert("Please provide a title and summary.");
            return;
        }

        const uid = getCurrentAuthUser()?.uid;
        try {
            await window.SupabaseService.submitProgressReport({
                mentorship_id: this.activeMentorshipId,
                project_id: this.mentorshipData.project_id,
                innovator_id: uid,
                title: title,
                summary: summary,
                status: 'submitted'
            });
            titleInput.value = '';
            summaryInput.value = '';
            this.renderReportsTab(document.getElementById('tab-reports'));
            this.updateProgressUI();
        } catch (err) {
            alert("Failed to submit report.");
        }
    }

    async startChatListener() {
        const chatForm = document.getElementById('collabChatForm');
        if (!chatForm) return;

        if (this.activeMentorshipId === 'demo_session') {
            return;
        }

        try {
            const messages = await window.SupabaseService.getMessages(this.activeMentorshipId);
            this.renderMessages(messages || []);
        } catch (err) { console.warn("Supabase Chat Load Error", err); }

        if (this.unsubscribeChat) {
            if (typeof this.unsubscribeChat === 'function') this.unsubscribeChat();
            else if (this.unsubscribeChat.unsubscribe) this.unsubscribeChat.unsubscribe();
        }
        this.unsubscribeChat = window.SupabaseService.subscribeToMessages(this.activeMentorshipId, (newMsg) => {
            this.appendMessage(newMsg);
        });

        chatForm.onsubmit = async (e) => {
            e.preventDefault();
            const input = chatForm.querySelector('input');
            const text = input.value.trim();
            if (!text) return;

            const uid = getCurrentAuthUser()?.uid;
            try {
                await window.SupabaseService.sendMessage({
                    mentorship_id: this.activeMentorshipId,
                    sender_id: uid,
                    message_text: text
                });
                input.value = '';
            } catch (err) {
                alert("Message failed to send.");
            }
        };
    }

    renderMessages(messages) {
        const chatBox = document.getElementById('collabChatBox');
        chatBox.innerHTML = '';
        if (messages.length === 0) {
            chatBox.innerHTML = `
                <div class="empty-chat-placeholder">
                    <i class="far fa-comments"></i>
                    <p>No messages here yet.<br>Start the conversation!</p>
                </div>
            `;
            return;
        }
        messages.forEach(msg => this.appendMessage(msg));
    }

    appendMessage(msg) {
        const chatBox = document.getElementById('collabChatBox');
        if (!chatBox) return;
        const uid = getCurrentAuthUser()?.uid;
        const isMe = msg.sender_id === uid;
        const partner = this._partnerData || { full_name: 'Partner' };
        
        const senderName = isMe ? 'You' : partner.full_name;
        const avatarUrl = isMe ? (JSON.parse(localStorage.getItem('innovateHubUser') || '{}').avatar_url) : partner.avatar_url;
        
        const msgGroup = document.createElement('div');
        msgGroup.className = `message-group ${isMe ? 'sent' : 'received'}`;
        
        const avatarHtml = avatarUrl 
            ? `<img src="${avatarUrl}" class="chat-avatar-sm" alt="${senderName}">`
            : `<div class="chat-avatar-sm-placeholder">${(senderName || 'U').charAt(0)}</div>`;

        msgGroup.innerHTML = `
            ${!isMe ? avatarHtml : ''}
            <div class="message-content-wrapper">
                <div class="message-header">
                    <span class="sender-name">${senderName}</span>
                    <span class="message-time">${new Date(msg.created_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="bubble-premium">
                    ${msg.text || msg.message_text || msg.content || ''}
                </div>
            </div>
            ${isMe ? avatarHtml : ''}
        `;
        
        chatBox.appendChild(msgGroup);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async renderProjectDetails() {
        const container = document.getElementById('collabProjectDetails');
        if (!container) return;

        // Strict mapping for blueprint sections
        const sections = [
            { id: 'problem_statement', title: 'Problem Statement', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V3a2.5 2.5 0 0 1 2.5-2.5H20v22H6.5a2.5 2.5 0 0 1-2.5-2.5z"/></svg>' },
            { id: 'objectives', title: 'Strategic Objectives', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>' },
            { id: 'proposed_solution', title: 'Proposed Solution', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' },
            { id: 'expected_impact', title: 'Expected Impact', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' }
        ];

        let html = '';
        if (!this.projectData || (!this.projectData.problem_statement && !this.projectData.title)) {
             html = '<div class="text-center p-5 text-muted">No project blueprints found for this mentorship.</div>';
        } else {
            for (const s of sections) {
                // Fetch feedback for this section
                let feedbackHtml = '';
                if (this.activeMentorshipId) {
                    try {
                        const feedbacks = await window.SupabaseService.getSectionFeedback(this.activeMentorshipId, s.id);
                        feedbackHtml = feedbacks.map(f => `
                            <div class="feedback-bubble-premium">
                                <div class="feedback-meta">MENTOR FEEDBACK • ${new Date(f.created_at).toLocaleDateString()}</div>
                                <div class="feedback-text">${f.comment}</div>
                            </div>
                        `).join('');
                    } catch (err) { console.warn("Feedback load failed", err); }
                }

                html += `
                    <div class="blueprint-card" id="section-${s.id}">
                        <div class="blueprint-header">
                            <div class="d-flex align-items-center gap-2">
                                <span class="text-success">${s.icon}</span>
                                <span class="blueprint-title">${s.title}</span>
                            </div>
                            ${!this.isInnovator ? `
                                <button class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="window.CollaborationHub.promptFeedback('${s.id}', '${s.title}')">
                                    + Add Review
                                </button>
                            ` : ''}
                        </div>
                        <div class="blueprint-content">
                            ${this.projectData[s.id] || (this.projectData[s.id.replace('_', '')]) || 'This section is currently empty.'}
                        </div>
                        <div class="feedback-pin-container" id="feedback-list-${s.id}">
                            ${feedbackHtml}
                        </div>
                    </div>
                `;
            }
        }
        container.innerHTML = html;
    }

    async promptFeedback(fieldId, fieldTitle) {
        const comment = prompt(`Mentor Review for ${fieldTitle}:\n\nPlease provide your professional feedback...`);
        if (!comment) return;

        const uid = getCurrentAuthUser()?.uid;
        try {
            const feedback = await window.SupabaseService.submitSectionFeedback({
                mentorship_id: this.activeMentorshipId,
                project_id: this.projectData.id,
                mentor_id: uid,
                field_id: fieldId,
                comment: comment,
                stars: 5 // Default for section reviews
            });

            // Refresh project details to show the new pin
            this.renderProjectDetails();
        } catch (err) {
            alert("Failed to submit feedback. Check database permissions.");
        }
    }

    async toggleReports(enabled) {
        if (this.isInnovator) return;
        try {
            await window.SupabaseService.updateMentorshipReportsStatus(this.activeMentorshipId, enabled);
            this.mentorshipData.reports_enabled = enabled;
            // No need to full refresh, just update internal state
            console.log(`CollaborationHub: Reports ${enabled ? 'enabled' : 'disabled'} for session ${this.activeMentorshipId}`);
        } catch (err) {
            alert("Failed to update report status.");
            // Revert checkbox
            const toggle = document.getElementById('allowReportsToggle');
            if (toggle) toggle.checked = !enabled;
        }
    }

    async loadMilestones() {
        // Milestone logic can be added here if needed for the hub view
    }

    renderEmptyState() {
        const workspace = document.querySelector('.collab-chat-workspace');
        if (workspace) {
            workspace.innerHTML = `
                <div class="h-100 d-flex flex-column align-items-center justify-content-center text-center p-5">
                    <div class="bg-light rounded-circle p-4 mb-4">
                        <i class="fas fa-project-diagram fa-3x text-muted"></i>
                    </div>
                    <h4 class="fw-bold" style="color:var(--brand-teal)">Collaborative Workspace</h4>
                    <p class="text-muted">Select a project or mentorship session from the sidebar to begin your journey.</p>
                </div>
            `;
        }
    }

    updateMeetingUI() {
        // Meeting UI placeholder
        // Feedback listener
        if (this.projectData && this.projectData.id) {
            this.unsubscribeFeedback = window.SupabaseService.subscribeToProjectFeedback(this.projectData.id, payload => {
                console.log("Real-time Feedback:", payload);
                if (this.activeTab === 'feedback') this.renderFeedbackTab();
                else this.renderProjectDetails();
            });
        }

        // Reports listener
        if (this.activeMentorshipId) {
            this.unsubscribeReports = window.SupabaseService.subscribeToProgressReports(this.activeMentorshipId, payload => {
                console.log("Real-time Report:", payload);
                if (this.activeTab === 'reports') this.renderReportsTab();
            });
        }
    }
}

// Global instance
window.CollaborationHub = new CollaborationHub();
// Bind switch functions to window for onclick handlers
window.switchSession = (id) => window.CollaborationHub.switchSession(id);
window.switchToolsTab = (tab) => window.CollaborationHub.switchToolsTab(tab);
window.updatePinnedGuidance = () => window.CollaborationHub.updatePinnedGuidance();
window.submitGeneralFeedback = () => window.CollaborationHub.submitGeneralFeedback();
window.submitReport = () => window.CollaborationHub.submitReport();

export default window.CollaborationHub;

/**
 * CollaborationHub - Final Design Merger
 * Integrates user-provided high-fidelity UI with Supabase real-time backend.
 */

class CollaborationHub {
    constructor() {
        this.activeMentorshipId = null;
        this.mentorshipData = null;
        this.projectData = null;
        this.unsubscribeChat = null;
        this.allSessions = [];
        this.isInnovator = false;
    }

    async init(mentorshipId = null) {
        console.log("CollaborationHub: Initializing Final Design Merger...");
        
        try {
            const user = this.getCurrentUser();
            if (!user) {
                console.warn("CollaborationHub: Auth not ready, waiting...");
                setTimeout(() => this.init(mentorshipId), 1000);
                return;
            }

            this.isInnovator = user.role === 'innovator';
            this.setupInitialVisibility();

            // Load all mentorship sessions
            await this.loadMentorships();

            // Default selection
            let targetId = mentorshipId;
            if (!targetId && this.allSessions.length > 0) {
                targetId = this.allSessions[0].id;
            }

            if (targetId) {
                console.log("CollaborationHub: Switching to initial session:", targetId);
                await this.switchSession(targetId);
            } else {
                console.log("CollaborationHub: No sessions found, rendering empty state.");
                this.renderEmptyState();
            }

            this.setupStaticListeners();
            this.setupTabListeners();
        } catch (error) {
            console.error("CollaborationHub Init Error:", error);
        }
    }

    getCurrentUser() {
        if (window.AuthManager && window.AuthManager.currentUser) return window.AuthManager.currentUser;
        const stored = localStorage.getItem('innovateHubUser');
        return stored ? JSON.parse(stored) : null;
    }

    setupInitialVisibility() {
        // Show correct view based on role
        const mentorView = document.getElementById('mentorHubView');
        const innovatorView = document.getElementById('innovatorHubView');
        if (mentorView) mentorView.style.display = !this.isInnovator ? 'flex' : 'none';
        if (innovatorView) innovatorView.style.display = this.isInnovator ? 'flex' : 'none';

        // Hide legacy global back button container as we're moving it into headers
        const backBtn = document.getElementById('collabBackButtonContainer');
        if (backBtn) {
            backBtn.style.display = 'none';
        }
    }

    async loadMentorships() {
        const user = this.getCurrentUser();
        const role = this.isInnovator ? 'innovator' : 'mentor';
        
        if (window.SupabaseService) {
            const data = await window.SupabaseService.getMentorships(user.uid, role);
            
            // Filter out ghost entries where the project was deleted in Supabase
            this.allSessions = (data || []).filter(session => session.project != null);
            
            this.renderProjectSidebar();
        }
    }

    renderProjectSidebar() {
        const listId = this.isInnovator ? 'innovatorProjectList' : 'mentorProjectList';
        const container = document.getElementById(listId);

        if (!container) return;

        if (this.allSessions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No active projects found.</p></div>';
            return;
        }

        container.innerHTML = '';
        this.allSessions.forEach(session => {
            const partner = this.isInnovator ? session.mentor : session.innovator;
            const project = session.project || { title: 'Untitled Project' };
            const isActive = session.id === this.activeMentorshipId;
            
            // Format status for user's badge
            let status = 'Active';
            if (session.status === 'pending_feedback') status = 'Feedback Pending';
            
            const lastActive = session.updated_at ? this.formatTimeAgo(session.updated_at) : 'Active';

            const cardData = {
                id: session.id,
                name: project.title,
                innovatorName: partner?.full_name || 'Anonymous',
                mentorName: partner?.full_name || 'Anonymous',
                status: status,
                lastActivity: lastActive,
                isActive: isActive
            };

            const card = this.createProjectCard(cardData);
            container.appendChild(card);
        });
    }

    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = `project-card ${project.isActive ? 'active' : ''}`;
        card.setAttribute('data-project-id', project.id);
        
        const label = this.isInnovator ? 'Mentor' : 'Innovator';
        const partnerName = this.isInnovator ? project.mentorName : project.innovatorName;
        
        card.innerHTML = `
            <h3>${project.name}</h3>
            <p class="partner-label">${label}: <strong>${partnerName}</strong></p>
            <div class="project-meta">
                <span class="badge badge-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
                <span class="project-time">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ${project.lastActivity}
                </span>
            </div>
        `;
        
        card.onclick = () => this.switchSession(project.id);
        return card;
    }

    formatTimeAgo(dateStr) {
        const now = new Date();
        const past = new Date(dateStr);
        const diffInMs = now - past;
        const diffInMins = Math.floor(diffInMs / (1000 * 60));
        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        const diffInHours = Math.floor(diffInMins / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    }

    async switchSession(mentorshipId) {
        if (this.activeMentorshipId === mentorshipId) return;
        
        // Cleanup existing subscription
        if (this.unsubscribeChat) {
            if (typeof this.unsubscribeChat === 'function') this.unsubscribeChat();
            else if (this.unsubscribeChat.unsubscribe) this.unsubscribeChat.unsubscribe();
        }

        this.activeMentorshipId = mentorshipId;
        this.mentorshipData = this.allSessions.find(s => s.id === mentorshipId);
        
        if (this.mentorshipData) {
            this.projectData = this.mentorshipData.project;
            this.renderProjectSidebar(); 
            this.updateUI();
            await this.loadMessages();
            this.setupRealtimeChat();
            
            // Render project brief for mentors
            if (!this.isInnovator) {
                this.renderProjectBrief();
            }
        }
    }

    updateUI() {
        const prefix = this.isInnovator ? 'innovator' : 'mentor';
        const partner = this.isInnovator ? this.mentorshipData.mentor : this.mentorshipData.innovator;
        
        const titleEl = document.getElementById(`${prefix}ProjectName`);
        const subTitleEl = document.getElementById(`${prefix}SubTitle`);
        const pinnedEl = document.getElementById(`${prefix}PinnedGuidanceText`);

        if (titleEl) titleEl.textContent = this.projectData?.title || 'Collaboration Hub';
        if (subTitleEl) subTitleEl.textContent = `${this.isInnovator ? 'Mentor' : 'Mentoring'}: ${partner?.full_name || 'Partner'}`;
        if (pinnedEl) pinnedEl.textContent = this.mentorshipData?.pinned_guidance || 'No specific guidance pinned yet.';

        if (this.isInnovator) {
            this.updateProgressUI();
            this.loadFeedbacks();
        } else {
            this.renderProjectBrief();
            this.loadFeedbacks();
            this.loadReports();
        }
    }

    updateProgressUI() {
        const bar = document.getElementById('projectProgressBar');
        const text = document.getElementById('projectProgressText');
        if (!bar || !text) return;

        const progress = this.mentorshipData?.progress || 0;
        bar.style.width = `${progress}%`;
        text.textContent = `${progress}% Complete`;
    }

    async loadMessages() {
        const prefix = this.isInnovator ? 'innovator' : 'mentor';
        const container = document.getElementById(`${prefix}ChatMessages`);
        if (!container) return;
        
        container.innerHTML = '<div class="empty-state text-center py-5"><div class="spinner-border text-teal opacity-25"></div></div>';
        
        try {
            const messages = await window.SupabaseService.getMessages(this.activeMentorshipId);
            container.innerHTML = '';
            if (messages && messages.length > 0) {
                messages.forEach(m => this.appendMessage(m));
            } else {
                container.innerHTML = '<div class="empty-state"><p>Start the conversation!</p></div>';
            }
        } catch (e) {
            console.error("Chat Load Error:", e);
            container.innerHTML = '<div class="p-4 text-center text-danger">Error loading history.</div>';
        }
    }

    setupRealtimeChat() {
        if (window.SupabaseService && this.activeMentorshipId) {
            this.unsubscribeChat = window.SupabaseService.subscribeToMessages(this.activeMentorshipId, (payload) => {
                this.appendMessage(payload);
            });
        }
    }

    appendMessage(msg) {
        const prefix = this.isInnovator ? 'innovator' : 'mentor';
        const container = document.getElementById(`${prefix}ChatMessages`);
        if (!container) return;

        // Remove empty state if present
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const user = this.getCurrentUser();
        const isMe = msg.sender_id === (user.id || user.uid);
        
        const senderRole = isMe ? (this.isInnovator ? 'innovator' : 'mentor') : (this.isInnovator ? 'mentor' : 'innovator');
        const content = msg.text || msg.message_text || msg.content || msg.comment || '';
        const timestamp = msg.created_at 
            ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const senderLabel = isMe ? 'You' : (senderRole === 'mentor' ? 'Mentor' : 'Innovator');

        const messageDiv = document.createElement('div');
        // WhatsApp-style: messages from 'me' go right, others go left
        messageDiv.className = `chat-msg-row ${isMe ? 'chat-msg-row--me' : 'chat-msg-row--other'}`;
        
        messageDiv.innerHTML = `
            <div class="chat-bubble ${isMe ? 'chat-bubble--me' : 'chat-bubble--other'} ${isMe ? (this.isInnovator ? 'bubble-innovator' : 'bubble-mentor') : ''}"> 
                ${!isMe ? `<span class="bubble-sender">${senderLabel}</span>` : ''}
                <p class="bubble-text">${content}</p>
                <span class="bubble-time">${timestamp}</span>
            </div>
        `;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    createMessage(message) {
        const container = document.createElement('div');
        container.className = `message-container ${message.sender === 'innovator' ? 'innovator-message' : 'mentor-message'}`;
        
        const avatarClass = message.sender === 'mentor' ? 'mentor-avatar' : 'innovator-avatar';
        const initials = message.senderName === 'You' ? 'ME' : (message.sender === 'mentor' ? 'MT' : 'IN');
        
        let attachmentsHTML = '';
        if (message.attachments && message.attachments.length > 0) {
            attachmentsHTML = `
                <div class="message-attachments">
                    ${message.attachments.map(att => `
                        <div class="attachment-item">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                            </svg>
                            <span>${att.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        container.innerHTML = `
            <div class="message-avatar ${avatarClass}">${initials}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${message.senderName}</span>
                    <span class="message-time">${message.timestamp}</span>
                </div>
                <div class="message-bubble">
                    <p class="message-text">${message.content}</p>
                    ${attachmentsHTML}
                </div>
            </div>
        `;
        
        return container;
    }

    async sendMessage(role) {
        const inputId = `${role}MessageInput`;
        const input = document.getElementById(inputId);
        if (!input || !input.value.trim()) return;

        const text = input.value.trim();
        const user = this.getCurrentUser();
        
        if (!this.activeMentorshipId) {
            alert('Please select a mentorship session first.');
            return;
        }
        
        if (!user) {
            alert('Authentication error. Please refresh the page.');
            return;
        }

        // Optimistically show the message immediately
        const optimisticMsg = {
            sender_id: user.id || user.uid,
            text: text,
            created_at: new Date().toISOString()
        };
        this.appendMessage(optimisticMsg);
        input.value = '';

        try {
            await window.SupabaseService.sendMessage({
                mentorship_id: this.activeMentorshipId,
                sender_id: user.id || user.uid,
                text: text
            });
        } catch (e) {
            console.error("Send Error:", e);
            // Show subtle error without removing the optimistic message
            const prefix = role;
            const container = document.getElementById(`${prefix}ChatMessages`);
            if (container) {
                const errDiv = document.createElement('div');
                errDiv.className = 'chat-msg-row chat-msg-row--me';
                errDiv.innerHTML = '<small class="text-danger me-2">⚠ Failed to deliver</small>';
                container.appendChild(errDiv);
            }
        }
    }

    async loadStats() {
        if (!this.activeMentorshipId) return;
        try {
            const feedbacks = await window.SupabaseService.getProjectFeedback(this.projectData?.id);
            const reports = await window.SupabaseService.getProgressReports(this.activeMentorshipId);
            
            const fCount = document.getElementById('feedbackCount');
            const rCount = document.getElementById('reportCount');
            
            if (fCount) fCount.textContent = feedbacks?.length || 0;
            if (rCount) rCount.textContent = reports?.length || 0;
        } catch (e) { console.warn("Stats load failed"); }
    }

    async loadFeedbacks() {
        const listId = this.isInnovator ? 'innovatorFeedbackList' : 'mentorFeedbackList';
        const container = document.getElementById(listId);
        if (!container) return;

        try {
            const feedbacks = await window.SupabaseService.getProjectFeedback(this.projectData?.id);
            if (!feedbacks || feedbacks.length === 0) {
                container.innerHTML = '<div class="empty-state text-center py-4"><p class="small text-muted">No feedback yet.</p></div>';
                return;
            }

            container.innerHTML = '';
            feedbacks.forEach(f => {
                // Supabase stores feedback content in 'comment' field, not 'content'
                const data = {
                    category: f.field_id || f.category || 'General Feedback',
                    rating: f.rating ? f.rating.toLowerCase().replace(/\s/g, '-') : (f.stars >= 4 ? 'positive' : f.stars >= 3 ? 'suggestion' : 'needs-work'),
                    content: f.comment || f.content || f.text || 'No content provided',
                    timestamp: new Date(f.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                };
                container.appendChild(this.createFeedbackCard(data));
            });
        } catch (e) { console.error("Feedback Load Error:", e); }
    }

    createFeedbackCard(feedback) {
        const card = document.createElement('div');
        card.className = 'feedback-card';
        
        const ratingText = {
            'positive': 'Strong',
            'strong': 'Strong',
            'needs-work': 'Needs Work',
            'suggestion': 'Suggestion'
        };
        
        const ratingClass = {
            'positive': 'badge-positive',
            'strong': 'badge-positive',
            'needs-work': 'badge-needs-work',
            'suggestion': 'badge-suggestion'
        };
        
        card.innerHTML = `
            <div class="feedback-header">
                <div class="feedback-category">
                    <div class="category-icon">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m15 14 5-5-5-5"></path>
                            <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"></path>
                        </svg>
                    </div>
                    <span class="category-name">${feedback.category}</span>
                </div>
                <span class="badge ${ratingClass[feedback.rating] || 'badge-primary'}">${ratingText[feedback.rating] || feedback.rating}</span>
            </div>
            <p class="feedback-text">${feedback.content}</p>
            <p class="feedback-time">${feedback.timestamp}</p>
        `;
        
        return card;
    }

    async submitFeedback() {
        const categoryEl = document.getElementById('feedbackCategory');
        const ratingEl = document.getElementById('feedbackRating');
        const contentEl = document.getElementById('feedbackText');
        
        if (!contentEl) return;
        const category = categoryEl ? categoryEl.value : 'General';
        const rating = ratingEl ? ratingEl.value : 'positive';
        const content = contentEl.value.trim();

        if (!content) return alert("Please enter feedback content.");
        if (!this.projectData?.id) return alert("No project selected for feedback.");

        try {
            const user = this.getCurrentUser();
            await window.SupabaseService.submitFeedback({
                mentorship_id: this.activeMentorshipId,
                project_id: this.projectData.id,
                mentor_id: user.id || user.uid,
                field_id: category,
                comment: content,   // Stored in 'comment' field per schema
                rating: rating,
                stars: rating === 'positive' ? 5 : (rating === 'needs-work' ? 3 : 4)
            });
            alert("Feedback submitted successfully!");
            contentEl.value = '';
            this.loadFeedbacks();
            this.loadStats();
        } catch (e) { 
            console.error("Feedback error:", e);
            alert("Failed to submit feedback: " + e.message); 
        }
    }

    async submitReport() {
        const title = document.getElementById('reportTitle').value.trim();
        const details = document.getElementById('reportDetails').value.trim();

        if (!title || !details) return alert("Please fill in all report fields.");

        try {
            const user = this.getCurrentUser();
            await window.SupabaseService.submitProgressReport({
                mentorship_id: this.activeMentorshipId,
                project_id: this.projectData.id,
                innovator_id: user.id || user.uid,
                title,
                summary: details,
                status: 'submitted'
            });
            alert("Report submitted successfully!");
            document.getElementById('reportTitle').value = '';
            document.getElementById('reportDetails').value = '';
            this.loadStats();
            
            // Reload reports if active
            this.loadReports();
        } catch (e) { 
            console.error("Report Error:", e);
            alert("Failed to submit report."); 
        }
    }

    async loadReports() {
        const prefix = this.isInnovator ? 'innovator' : 'mentor';
        const listEl = document.getElementById(`${prefix}ReportsList`);
        if (!listEl) return;

        try {
            const reports = await window.SupabaseService.getProgressReports(this.activeMentorshipId);
            if (!reports || reports.length === 0) {
                listEl.innerHTML = '<div class="empty-state text-center py-4"><p class="small text-muted">No reports yet.</p></div>';
                return;
            }

            listEl.innerHTML = '';
            reports.forEach(r => {
                const data = {
                    title: r.title || 'Weekly Update',
                    // Supabase stores report body in 'summary', not 'content'
                    content: r.summary || r.content || r.details || 'No details provided',
                    status: r.status || 'submitted',
                    timestamp: new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }),
                    attachments: r.file_url ? [{ name: 'Project Attachment' }] : []
                };
                listEl.appendChild(this.createReportCard(data));
            });
        } catch (e) { console.error("Reports Load Error:", e); }
    }

    createReportCard(report) {
        const card = document.createElement('div');
        card.className = 'report-card';
        
        const statusClass = report.status === 'reviewed' ? 'badge-positive' : 'badge-submitted';
        const statusText = report.status === 'reviewed' ? 'Reviewed' : 'Submitted';
        
        let attachmentsHTML = '';
        if (report.attachments && report.attachments.length > 0) {
            attachmentsHTML = `
                <div class="report-attachments">
                    ${report.attachments.map(att => `
                        <div class="report-attachment">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span>${att.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="report-header">
                <div class="report-category">
                    <div class="report-icon">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                    </div>
                    <span class="report-title">${report.title}</span>
                </div>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
            <p class="report-text">${report.content}</p>
            ${attachmentsHTML}
            <p class="report-time">${report.timestamp}</p>
        `;
        
        return card;
    }

    async editPinnedMessage(role) {
        const current = this.mentorshipData?.pinned_guidance || "";
        const next = prompt("Edit Pinned Guidance:", current);
        if (next !== null && next !== current) {
            try {
                await window.SupabaseService.updateMentorshipStatus(this.activeMentorshipId, 'active', { pinned_guidance: next });
                this.mentorshipData.pinned_guidance = next;
                document.getElementById(`${role}PinnedGuidanceText`).textContent = next;
            } catch (e) { console.error("Update failed:", e); }
        }
    }

    // UI Toggle Methods
    toggleSidebar(id) {
        const sidebar = document.getElementById(id);
        const overlayId = this.isInnovator ? 'innovatorOverlay' : 'mentorOverlay';
        const overlay = document.getElementById(overlayId);
        
        if (sidebar) sidebar.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
    }

    closeAllSidebars(role) {
        const leftId = `${role}LeftSidebar`;
        const rightId = `${role}RightSidebar`;
        const overlayId = `${role}Overlay`;

        document.getElementById(leftId)?.classList.remove('active');
        document.getElementById(rightId)?.classList.remove('active');
        document.getElementById(overlayId)?.classList.remove('active');
    }

    setupTabListeners() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.onclick = () => {
                const tabName = button.getAttribute('data-tab');
                const tabsContainer = button.closest('.tabs');
                
                // Active button
                button.parentElement.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Active content
                tabsContainer.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                const targetContent = document.getElementById(tabName);
                if (targetContent) {
                    targetContent.classList.add('active');
                    // Load reports if switched to reports tab
                    if (tabName.includes('reports')) this.loadReports();
                }
            };
        });
    }

    setupStaticListeners() {
        // Send buttons
        const mentorSend = document.getElementById('mentorSendBtn');
        const innovatorSend = document.getElementById('innovatorSendBtn');
        const mentorInput = document.getElementById('mentorMessageInput');
        const innovatorInput = document.getElementById('innovatorMessageInput');

        if (mentorSend) mentorSend.onclick = () => this.sendMessage('mentor');
        if (innovatorSend) innovatorSend.onclick = () => this.sendMessage('innovator');

        if (mentorInput) mentorInput.onkeypress = (e) => { if(e.key === 'Enter') this.sendMessage('mentor'); };
        if (innovatorInput) innovatorInput.onkeypress = (e) => { if(e.key === 'Enter') this.sendMessage('innovator'); };

        // Feedback/Report buttons
        const fbBtn = document.getElementById('submitFeedbackBtn');
        const repBtn = document.getElementById('submitReportBtn');

        if (fbBtn) fbBtn.onclick = () => this.submitFeedback();
        if (repBtn) repBtn.onclick = () => this.submitReport();
    }

    renderProjectBrief() {
        const mentorship = this.mentorshipData;
        const project = this.projectData;
        const container = document.getElementById('mentorProjectBriefContainer');

        if (!container || !project) return;

        container.innerHTML = `
            <div class="project-brief-content">
                <div class="card card-teal mb-3">
                    <h4 class="form-title"><i class="fa fa-info-circle"></i> Project Overview</h4>
                    <div class="mb-3">
                        <label class="fw-bold text-teal small uppercase">Target Area</label>
                        <p class="mb-0">${project.target_area || 'Not specified'}</p>
                    </div>
                    <div class="mb-3">
                        <label class="fw-bold text-teal small uppercase">Problem Statement</label>
                        <p class="mb-0 text-muted">${project.problem_statement || 'No details provided'}</p>
                    </div>
                </div>

                <div class="card card-teal mb-3">
                    <h4 class="form-title"><i class="fa fa-lightbulb-o"></i> Proposed Solution</h4>
                    <p class="mb-0 text-muted">${project.proposed_solution || 'No details provided'}</p>
                </div>

                <div class="card card-teal mb-3">
                    <h4 class="form-title"><i class="fa fa-bullseye"></i> Objectives</h4>
                    <p class="mb-0 text-muted">${project.objectives || 'No details provided'}</p>
                </div>

                <div class="card card-teal mb-0">
                    <h4 class="form-title"><i class="fa fa-line-chart"></i> Expected Impact</h4>
                    <p class="mb-0 text-muted">${project.expected_impact || 'No details provided'}</p>
                </div>
            </div>
        `;
    }

    renderProjectOverview() {
        // ... (this already handles empty state)
    }

    renderEmptyState() {
        const prefix = this.isInnovator ? 'innovator' : 'mentor';
        const container = document.getElementById(`${prefix}ChatMessages`);
        if (container) {
            container.innerHTML = `
                <div class="empty-state text-center py-5">
                    <p class="text-muted">Select a mentorship session from the left sidebar to start collaborating.</p>
                </div>
            `;
        }
    }
}

// Global scope attachment
window.CollaborationHub = new CollaborationHub();

document.addEventListener('DOMContentLoaded', () => {
    window.CollaborationHub.init();
});

export default window.CollaborationHub;

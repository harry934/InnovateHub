// Supabase Auth integration — session via localStorage/Supabase
function getCurrentAuthUser() {
    const stored = localStorage.getItem('innovateHubUser');
    if (stored) {
        try { return JSON.parse(stored); } catch(e) {}
    }
    return null;
}

console.log("Collab Screen Module Loading...");

// Global scope attachment (attached early to prevent race conditions)
window.showProjectCollaboration = (projectId) => {
    console.log("Opening Collaboration Hub for project:", projectId);
    if (window.showDashboardSection) {
        window.showDashboardSection('collab');
    }
    if (window.CollaborationHub) {
        window.CollaborationHub.init(projectId);
    } else {
        console.error("CollaborationHub not yet initialized");
    }
};

class CollaborationScreen {
    constructor() {
        this.currentProjectId = null;
        this.currentPartner = null; // { id, name, role }
        this.currentMentorshipId = null;
        this.chatSubscription = null;
        this.feedbackSubscription = null;
    }

    async init(projectId) {
        this.currentProjectId = projectId;
        const container = document.getElementById('collabScreenContainer');
        if (!container) return;

        container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

        try {
            if (!window.SupabaseService) {
                throw new Error("SupabaseService not found. Please refresh.");
            }

            const user = getCurrentAuthUser();
            const myId = user?.uid;
            
            if (!myId) {
                console.warn("Collab Screen: No user found. Redirecting...");
                window.location.href = 'login.html';
                return;
            }
            
            // 1. Fetch Mentorship Context (Enriched with project and profiles)
            const mentorship = await window.SupabaseService.getMentorshipByProject(projectId, myId);
            
            if (!mentorship) {
                container.innerHTML = `
                    <div class="alert alert-warning text-center">
                        <h5>No active mentorship found</h5>
                        <p>This project does not have an active mentor session or is not yet approved.</p>
                        <button class="btn btn-primary" onclick="window.showDashboardSection('home')">Back to Dashboard</button>
                    </div>`;
                return;
            }
            
            this.currentMentorshipId = mentorship.id;
            const project = mentorship.project;

            // 2. Determine Collaboration Partner
            const isMentor = mentorship.mentor_id === myId;
            const partner = isMentor ? mentorship.innovator : mentorship.mentor;
            
            this.currentPartner = {
                id: partner.id,
                name: partner.full_name || "Partner",
                photoURL: partner.avatar_url || null,
                role: mentorship.mentor_id === partner.id ? "Mentor" : "Innovator",
                isMentor: mentorship.mentor_id === partner.id
            };

            const amIMentor = isMentor;

            // 3. Render Main Interface
            this.render(project, mentorship, amIMentor);
            
            // 4. Start Real-time Listeners
            this.initChat();
            this.initFeedback();
            
        } catch (err) {
            console.error("Collab Screen Error:", err);
            container.innerHTML = `<div class="alert alert-danger">Error loading collaboration hub: ${err.message}</div>`;
        }
    }

    render(project, mentorship, amIMentor) {
        const container = document.getElementById('collabScreenContainer');
        
        container.innerHTML = `
            <!-- Dashboard-style Header Integration -->
            <div class="collab-header-main d-flex justify-content-between align-items-center mb-5 p-4 bg-white rounded shadow-sm border">
                <div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge bg-success-light text-success text-uppercase fw-bold" style="font-size:0.6rem; letter-spacing:1px;">Active Collaboration</span>
                        <span class="text-muted small">• Project ID: ${project.id || 'N/A'}</span>
                    </div>
                    <h2 class="display-6 fw-bold mb-0">${project.title}</h2>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-secondary rounded-pill" onclick="window.showDashboardSection('home')">
                        <i class="fa fa-arrow-left me-2"></i> Dashboard
                    </button>
                    <button class="btn btn-success rounded-pill px-4" onclick="CollaborationScreen.showTab('chat')">
                        <i class="fa fa-comments me-2"></i> Join Discussion
                    </button>
                </div>
            </div>

            <div class="collab-wrapper row g-4">
                <!-- Sidebar / Navigation -->
                <div class="collab-sidebar col-lg-3">
                    <div class="collab-nav card border-0 shadow-sm overflow-hidden" style="border-radius:20px;">
                        <button class="collab-nav-item active p-3 border-0 bg-transparent text-start" onclick="CollaborationScreen.showTab('chat')">
                            <i class="fa fa-comments me-2 text-success"></i> Discussion
                        </button>
                        <button class="collab-nav-item p-3 border-0 bg-transparent text-start" onclick="CollaborationScreen.showTab('reports')">
                            <i class="fa fa-file-alt me-2 text-success"></i> Progress Reports
                        </button>
                        <button class="collab-nav-item p-3 border-0 bg-transparent text-start" onclick="CollaborationScreen.showTab('meetings')">
                            <i class="fa fa-video me-2 text-success"></i> Virtual Meetings
                        </button>
                    </div>

                    <!-- Partner Info -->
                    <div class="collab-partner-card mt-4 p-3 bg-white rounded shadow-sm border">
                        <div class="small text-muted mb-2 uppercase fw-bold" style="letter-spacing:1px; font-size:0.6rem;">Collaborating With</div>
                        <div class="d-flex align-items-center gap-3">
                            <div class="partner-avatar-lg overflow-hidden" style="width:48px; height:48px; background: #e8f5e9; color: #2e7d32; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem;">
                                ${this.currentPartner.photoURL ? 
                                    `<img src="${this.currentPartner.photoURL}" class="w-100 h-100 object-fit-cover" alt="Partner">` : 
                                    this.currentPartner.name.charAt(0)}
                            </div>
                            <div>
                                <div class="fw-bold text-dark">${this.currentPartner.name}</div>
                                <small class="badge bg-success-light text-success">${this.currentPartner.role}</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Work Area -->
                <div class="collab-main-area col-lg-9">
                    <!-- Discussion Tab (Chat + Doc Feedback) -->
                    <div id="collab-tab-chat" class="collab-tab-content bg-white rounded shadow-sm border overflow-hidden" style="height: 600px; border-radius:24px;">
                        <div class="row h-100 g-0">
                            <!-- Project Documentation (Left) -->
                            <div class="col-md-7 collab-document-view border-end overflow-auto p-4">
                                <h5 class="mb-4 d-flex align-items-center gap-2">
                                    <i class="fa fa-book text-success"></i> 
                                    Project Blueprint
                                </h5>
                                <div class="review-section bg-light p-3 rounded mb-4" data-field="problem_statement">
                                    <div class="review-header small text-muted fw-bold mb-2 uppercase">Problem Statement</div>
                                    <div class="review-content position-relative p-3 bg-white rounded border" id="review-problem">
                                        ${project.problem_statement || project.problemStatement || "No content provided."}
                                        <div class="comment-trigger position-absolute top-0 end-0 m-2" onclick="window.CollaborationScreen.openCommentModal('problem_statement', 'Problem Statement')">
                                            <button class="btn btn-sm btn-success rounded-circle shadow-sm" style="width:24px; height:24px; padding:0;"><i class="fa fa-plus" style="font-size:0.7rem;"></i></button>
                                        </div>
                                    </div>
                                    <div class="active-comments mt-2" id="comments-problem_statement"></div>
                                </div>

                                <div class="review-section bg-light p-3 rounded" data-field="proposed_solution">
                                    <div class="review-header small text-muted fw-bold mb-2 uppercase">Proposed Solution</div>
                                    <div class="review-content position-relative p-3 bg-white rounded border" id="review-solution">
                                        ${project.proposed_solution || project.proposedSolution || "No content provided."}
                                        <div class="comment-trigger position-absolute top-0 end-0 m-2" onclick="window.CollaborationScreen.openCommentModal('proposed_solution', 'Proposed Solution')">
                                            <button class="btn btn-sm btn-success rounded-circle shadow-sm" style="width:24px; height:24px; padding:0;"><i class="fa fa-plus" style="font-size:0.7rem;"></i></button>
                                        </div>
                                    </div>
                                    <div class="active-comments mt-2" id="comments-proposed_solution"></div>
                                </div>
                            </div>

                            <!-- Team Chat (Right) -->
                            <div class="col-md-5 d-flex flex-column bg-light">
                                <div class="chat-header p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0 fw-bold">Team Chat</h6>
                                    <span class="badge bg-success bullet">Online</span>
                                </div>
                                <div class="chat-messages flex-grow-1 p-3 overflow-auto" id="chatMessages" style="background: #f8f9fa;"></div>
                                <form class="chat-input-area p-3 bg-white border-top" id="chatInputArea">
                                    <div class="input-group">
                                        <input type="text" id="chatMsgInput" class="form-control border-0 bg-light" placeholder="Message..." autocomplete="off" style="border-radius:12px 0 0 12px; padding: 12px 15px;">
                                        <button type="submit" class="btn btn-success px-4" style="border-radius:0 12px 12px 0;">
                                            <i class="fa fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Progress Reports Tab -->
                    <div id="collab-tab-reports" class="collab-tab-content p-4 bg-white rounded shadow-sm border" style="display:none; min-height: 500px; border-radius:24px;">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 class="fw-bold mb-1"><i class="fa fa-file-upload text-success me-2"></i> Progress Reports</h4>
                                <p class="text-muted small mb-0">Track project milestones and deliverables</p>
                            </div>
                            ${!amIMentor ? `<button class="btn btn-success rounded-pill px-4 py-2" onclick="CollaborationScreen.openReportModal()">
                                <i class="fa fa-plus me-1"></i> New Report
                            </button>` : ''}
                        </div>
                        <div id="reportsContainer" class="reports-grid mt-4">
                            <!-- Reports injected here -->
                        </div>
                    </div>

                    <!-- Meetings Tab -->
                    <div id="collab-tab-meetings" class="collab-tab-content p-5 text-center bg-white rounded shadow-sm border" style="display:none; min-height: 500px; border-radius:24px;">
                        <div class="meeting-hero">
                            <div class="meeting-icon-lg mb-4 mx-auto" style="width:80px; height:80px; background:#e8f5e9; color:#2e7d32; border-radius:20px; display:flex; align-items:center; justify-content:center;">
                                <i class="fa fa-video fa-2x"></i>
                            </div>
                            <h3 class="fw-bold">Virtual Workspace</h3>
                            <p class="text-muted mx-auto mb-5" style="max-width:400px;">High-fidelity video conferencing for your mentorship sessions. Present your progress, get live feedback, and brainstorm in real-time.</p>
                            
                            <div class="mt-4 p-4 bg-light rounded d-inline-block border text-start" style="min-width:300px; border-radius:15px;">
                                <span class="text-muted small d-block mb-2 text-uppercase fw-bold" style="letter-spacing:1px; font-size:0.6rem;">Active Meeting Link</span>
                                <div class="d-flex align-items-center gap-3">
                                    <div class="bg-white p-2 border rounded flex-grow-1 overflow-hidden" style="max-width:250px;">
                                        <strong id="meetingLinkDisplay" class="text-dark small text-truncate d-block">${mentorship.meeting_link || mentorship.meetingLink || 'No link scheduled yet'}</strong>
                                    </div>
                                    ${amIMentor ? `<button class="btn btn-sm btn-link text-success p-0" onclick="window.CollaborationScreen.showMeetingEdit()"><i class="fa fa-edit fa-lg"></i></button>` : ''}
                                </div>
                            </div>
                            
                            <div class="mt-5 d-flex justify-content-center gap-3">
                                <button class="btn btn-success btn-lg px-5 rounded-pill shadow-sm" onclick="window.open('${mentorship.meeting_link || mentorship.meetingLink || '#'}', '_blank')" ${!(mentorship.meeting_link || mentorship.meetingLink) ? 'disabled' : ''}>
                                    <i class="fa fa-play me-2"></i> Join Session Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modals -->
            <div class="modal fade" id="commentModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg" style="border-radius: 28px; overflow:hidden;">
                        <div class="modal-header border-0 bg-light p-4">
                            <h5 class="modal-title fw-bold" id="commentModalTitle">Add Feedback</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <form id="commentForm">
                                <input type="hidden" id="commentField">
                                <div class="mb-4">
                                    <label class="form-label small text-muted fw-bold">Your Suggestion / Question</label>
                                    <textarea class="form-control bg-light border-0" id="commentText" rows="4" placeholder="Be specific and constructive..." style="border-radius:18px; padding:15px;"></textarea>
                                </div>
                                <button type="submit" class="btn btn-success w-100 py-3 fw-bold shadow-sm" style="border-radius:18px;">Post Feedback</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal fade" id="meetingModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg" style="border-radius: 28px; overflow:hidden;">
                        <div class="modal-header border-0 bg-light p-4">
                            <h5 class="modal-title fw-bold">Update Meeting Link</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <p class="text-muted small mb-4">Provide a link for your next session (Zoom, Google Meet, Discord, etc.)</p>
                            <div class="input-group mb-4">
                                <span class="input-group-text bg-light border-0 px-3" style="border-radius: 12px 0 0 12px;"><i class="fa fa-link text-success"></i></span>
                                <input type="url" id="newMeetingLink" class="form-control bg-light border-0" placeholder="https://zoom.us/j/..." style="border-radius: 0 12px 12px 0; padding:12px;">
                            </div>
                            <button class="btn btn-success w-100 py-3 fw-bold shadow-sm" onclick="window.CollaborationScreen.updateMeetingLink()" style="border-radius:18px;">Save Workspace Link</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal fade" id="reportModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg" style="border-radius: 28px; overflow:hidden;">
                        <div class="modal-header border-0 bg-light p-4">
                            <h5 class="modal-title fw-bold">Submit Progress Report</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <form id="reportForm" onsubmit="window.CollaborationScreen.submitReport(event)">
                                <div class="mb-3">
                                    <label class="form-label small text-muted fw-bold">Report Title</label>
                                    <input type="text" class="form-control bg-light border-0" name="reportTitle" required placeholder="e.g. Week 4 - Backend Completion" style="border-radius:12px; padding:12px;">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small text-muted fw-bold">Summary Of Work</label>
                                    <textarea class="form-control bg-light border-0" name="reportContent" rows="4" required placeholder="Describe what you've accomplished..." style="border-radius:12px; padding:12px;"></textarea>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label small text-muted fw-bold">Supporting Document (PDF/Doc)</label>
                                    <input type="file" class="form-control bg-light border-0" name="reportFile" accept=".pdf,.doc,.docx" style="border-radius:12px; padding:12px;">
                                </div>
                                <button type="submit" class="btn btn-success w-100 py-3 fw-bold shadow-sm" style="border-radius:18px;">Submit Report</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('chatInputArea').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        document.getElementById('commentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitFeedback();
        });

        this.initReports();
    }

    static showTab(tabName) {
        // Toggle Buttons
        const buttons = document.querySelectorAll('.collab-nav-item');
        buttons.forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tabName)) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Toggle Content
        const contents = document.querySelectorAll('.collab-tab-content');
        contents.forEach(content => {
            if (content.id === `collab-tab-${tabName}`) content.style.display = 'block';
            else content.style.display = 'none';
        });
        
        // Specialized logic for certain tabs
        if (tabName === 'chat' && window.CollaborationScreen) {
             const chatContainer = document.getElementById('chatMessages');
             if(chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    /* REPORTS SYSTEM */

    static openReportModal() {
        if (!window.reportModal) {
            window.reportModal = new bootstrap.Modal(document.getElementById('reportModal'));
        }
        document.getElementById('reportForm').reset();
        window.reportModal.show();
    }

    async submitReport(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Uploading...';

        try {
            const title = form.reportTitle.value;
            const content = form.reportContent.value;
            const file = form.reportFile.files[0];
            
            let fileUrl = '';
            if (file) {
                 fileUrl = "doc_placeholder_" + Date.now(); 
            }

            if (window.SupabaseService) {
                await window.SupabaseService.submitProgressReport({
                    mentorship_id: this.currentMentorshipId,
                    file_url: fileUrl,
                    file_name: file ? file.name : '',
                    author_id: getCurrentAuthUser()?.uid
                });
            }

            window.reportModal.hide();
            if (window.adminToast) adminToast("✓ Progress report submitted successfully!");
            this.initReports(); // Refresh local list
        } catch (e) {
            console.error("Report Error:", e);
            alert("Failed to submit report.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Submit Report';
        }
    }

    async initReports() {
        const container = document.getElementById('reportsContainer');
        if (!container) return;

        if (window.SupabaseService) {
            try {
                const reports = await window.SupabaseService.getProgressReports(this.currentMentorshipId);
                
                if (!reports || reports.length === 0) {
                    container.innerHTML = `
                        <div class="text-center py-5 bg-light rounded border-dashed" style="border: 2px dashed #ddd;">
                            <i class="fa fa-folder-open fa-2x text-muted mb-3 d-block"></i>
                            <p class="text-muted mb-0">No progress reports submitted yet.</p>
                        </div>`;
                    return;
                }

                container.innerHTML = '';
                reports.forEach(report => {
                    const card = document.createElement('div');
                    card.className = 'report-card p-4 bg-white rounded shadow-sm border mb-3';
                    card.innerHTML = `
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="fw-bold mb-1">${report.title}</h5>
                                <small class="text-muted"><i class="fa fa-calendar me-1"></i> ${new Date(report.created_at).toLocaleDateString()}</small>
                            </div>
                            ${report.file_name ? `<div class="badge bg-light text-dark border"><i class="fa fa-paperclip me-1"></i> ${report.file_name}</div>` : ''}
                        </div>
                        <div class="report-text mb-4 text-muted small">${report.content.substring(0, 150)}${report.content.length > 150 ? '...' : ''}</div>
                    `;
                    container.appendChild(card);
                });
            } catch (err) {
                console.error("Supabase Reports Load Error:", err);
            }
        }
    }

    async initChat() {
        const chatContainer = document.getElementById('chatMessages');
        if (!chatContainer) return;

        if (this.chatSubscription) {
            this.chatSubscription.unsubscribe();
        }

        // 1. Initial Load from Supabase
        if (window.SupabaseService) {
            const user = getCurrentAuthUser();
            const messages = await window.SupabaseService.getMessages(this.currentMentorshipId);
            chatContainer.innerHTML = '';
            messages.forEach(msg => {
                const isMe = msg.author_id === user?.uid;
                chatContainer.innerHTML += `
                    <div class="msg ${isMe ? 'sent' : 'received'}">
                        ${msg.content}
                    </div>
                `;
            });
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // 2. Real-time Subscription
            this.chatSubscription = window.SupabaseService.subscribeToMessages(this.currentMentorshipId, (newMsg) => {
                const user = getCurrentAuthUser();
                const isMe = newMsg.author_id === user?.uid;
                chatContainer.innerHTML += `
                    <div class="msg ${isMe ? 'sent' : 'received'}">
                        ${newMsg.content}
                    </div>
                `;
                chatContainer.scrollTop = chatContainer.scrollHeight;
            });
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatMsgInput');
        const text = input.value.trim();
        if (!text) return;
        
        try {
            if (window.SupabaseService) {
                await window.SupabaseService.sendMessage({
                    mentorship_id: this.currentMentorshipId,
                    content: text,
                    author_id: getCurrentAuthUser()?.uid
                });
            }
            input.value = '';
        } catch (e) {
            console.error("Chat Error:", e);
        }
    }

    /* FEEDBACK / COMMENTING SYSTEM */

    async initFeedback() {
        const fields = ['problem_statement', 'proposed_solution', 'expected_impact'];
        
        if (this.feedbackSubscription) this.feedbackSubscription.unsubscribe();

        if (window.SupabaseService) {
            // 1. Initial Load
            for (const f of fields) {
                const el = document.getElementById(`comments-${f}`);
                if (!el) continue;
                
                const comments = await window.SupabaseService.getSectionFeedback(this.currentMentorshipId, f);
                el.innerHTML = '';
                const user = getCurrentAuthUser();
                comments.forEach(data => {
                    const isMe = data.author_id === user?.uid;
                    el.innerHTML += `
                        <div class="comment-bubble ${isMe ? 'my-comment' : 'partner-comment'}">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <span class="author">${data.author_name || (isMe ? "Me" : "Partner")}</span>
                                <span class="time">${new Date(data.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div class="text">${data.content}</div>
                        </div>
                    `;
                });
            }

            // 2. Real-time Subscription
            this.feedbackSubscription = window.SupabaseService.subscribeToProjectFeedback(this.currentProjectId, (payload) => {
                const data = payload.new;
                const user = getCurrentAuthUser();
                const el = document.getElementById(`comments-${data.field_id}`);
                if (el) {
                    const isMe = data.author_id === user?.uid;
                    el.innerHTML += `
                        <div class="comment-bubble ${isMe ? 'my-comment' : 'partner-comment'}">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <span class="author">${data.author_name || (isMe ? "Me" : "Partner")}</span>
                                <span class="time">${new Date(data.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div class="text">${data.content}</div>
                        </div>
                    `;
                }
            });
        }
    }

    openCommentModal(field, title) {
        document.getElementById('commentField').value = field;
        document.getElementById('commentModalTitle').textContent = `Feedback on: ${title}`;
        document.getElementById('commentText').value = '';
        const modal = new bootstrap.Modal(document.getElementById('commentModal'));
        modal.show();
    }

    async submitFeedback() {
        const field = document.getElementById('commentField').value;
        const text = document.getElementById('commentText').value.trim();
        if (!text) return;

        try {
            const modalEl = document.getElementById('commentModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            
            if (window.SupabaseService) {
                const user = getCurrentAuthUser();
                await window.SupabaseService.submitSectionFeedback({
                    mentorship_id: this.currentMentorshipId,
                    project_id: this.currentProjectId,
                    field_id: field,
                    content: text,
                    author_id: user?.uid,
                    author_name: user?.displayName || (this.currentPartner.isMentor ? "Mentor" : "Innovator")
                });
            }

            modal.hide();
        } catch (e) {
            console.error("Feedback Error:", e);
            alert("Failed to post feedback.");
        }
    }

    /* MEETING MANAGEMENT */

    showMeetingEdit() {
        const modal = new bootstrap.Modal(document.getElementById('meetingModal'));
        modal.show();
    }

    async updateMeetingLink() {
        const link = document.getElementById('newMeetingLink').value.trim();
        if (!link) return;

        try {
            if (window.SupabaseService) {
                await window.SupabaseService.updateMentorshipStatus(this.currentMentorshipId, "accepted", {
                    meeting_link: link
                });
            }

            if (document.getElementById('meetingLinkDisplay')) {
                document.getElementById('meetingLinkDisplay').textContent = link;
            }
            
            const modalEl = document.getElementById('meetingModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            
            if (window.adminToast) adminToast("✓ Meeting link updated!");
            else alert("Meeting link updated!");
        } catch (e) {
            console.error("Meeting Link Error:", e);
            alert("Failed to update link.");
        }
    }
}

// Global instance initialization
window.CollaborationScreen = new CollaborationScreen();
console.log("Collab Screen Module Loaded ✓");

export default window.CollaborationScreen;

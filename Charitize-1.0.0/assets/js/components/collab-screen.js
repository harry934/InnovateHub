/**
 * Shared Collaboration Screen component
 * High-end interface for Innovators and Mentors to interact
 */

import { auth, db } from '../core/firebase-config.js';
import { 
    collection, query, where, orderBy, onSnapshot, addDoc, 
    serverTimestamp, doc, getDoc, updateDoc, getDocs, or, and
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

console.log("Collab Screen Module Loading...");

// Global scope attachment (attached early to prevent race conditions)
window.showProjectCollaboration = (projectId) => {
    console.log("Opening Collaboration Hub for project:", projectId);
    if (window.showDashboardSection) {
        window.showDashboardSection('collab');
    }
    if (window.CollaborationScreen) {
        window.CollaborationScreen.init(projectId);
    } else {
        console.error("CollaborationScreen class not yet initialized");
    }
};

class CollaborationScreen {
    constructor() {
        this.currentProjectId = null;
        this.currentPartner = null; // { id, name, role }
        this.currentMentorshipId = null;
        this.unsubscribeChat = null;
        this.unsubscribeFeedback = null;
    }

    async init(projectId) {
        this.currentProjectId = projectId;
        const container = document.getElementById('collabScreenContainer');
        if (!container) return;

        container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

        try {
            // 1. Fetch Project Data
            const projectDoc = await getDoc(doc(db, "projects", projectId));
            if (!projectDoc.exists()) throw new Error("Project not found");
            const project = projectDoc.data();

            // 2. Fetch Mentorship Context
            const myId = auth.currentUser.uid;
            const mentorshipQ = query(
                collection(db, "mentorshipRequests"),
                and(
                    where("projectId", "==", projectId),
                    where("status", "==", "accepted"),
                    where("adminApproved", "==", true),
                    or(
                        where("innovatorId", "==", myId),
                        where("mentorId", "==", myId)
                    )
                )
            );
            const mentorshipSnap = await getDocs(mentorshipQ);
            if (mentorshipSnap.empty) {
                container.innerHTML = `
                    <div class="alert alert-warning text-center">
                        <h5>No active mentorship found</h5>
                        <p>This project does not have an active mentor session.</p>
                        <button class="btn btn-primary" onclick="window.showDashboardSection('home')">Back to Dashboard</button>
                    </div>`;
                return;
            }
            
            const mentorshipDoc = mentorshipSnap.docs[0];
            this.currentMentorshipId = mentorshipDoc.id;
            const mentorship = mentorshipDoc.data();

            // 3. Determine Collaboration Partner
            const partnerId = mentorship.mentorId === myId ? mentorship.innovatorId : mentorship.mentorId;
            const partnerDoc = await getDoc(doc(db, "users", partnerId));
            
            const partnerData = partnerDoc.exists() ? partnerDoc.data() : {};
            this.currentPartner = {
                id: partnerId,
                name: partnerData.fullName || "Partner",
                photoURL: partnerData.photoURL || partnerData.photoUrl || null,
                role: mentorship.mentorId === partnerId ? "Mentor" : "Innovator",
                isMentor: mentorship.mentorId === partnerId
            };

            const amIMentor = mentorship.mentorId === myId;

            // 4. Render Main Interface
            this.render(project, mentorship, amIMentor);
            
            // 5. Start Real-time Listeners
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
                                <div class="review-section bg-light p-3 rounded mb-4" data-field="problemStatement">
                                    <div class="review-header small text-muted fw-bold mb-2 uppercase">Problem Statement</div>
                                    <div class="review-content position-relative p-3 bg-white rounded border" id="review-problem">
                                        ${project.problemStatement || "No content provided."}
                                        <div class="comment-trigger position-absolute top-0 end-0 m-2" onclick="window.CollaborationScreen.openCommentModal('problemStatement', 'Problem Statement')">
                                            <button class="btn btn-sm btn-success rounded-circle shadow-sm" style="width:24px; height:24px; padding:0;"><i class="fa fa-plus" style="font-size:0.7rem;"></i></button>
                                        </div>
                                    </div>
                                    <div class="active-comments mt-2" id="comments-problemStatement"></div>
                                </div>

                                <div class="review-section bg-light p-3 rounded" data-field="proposedSolution">
                                    <div class="review-header small text-muted fw-bold mb-2 uppercase">Proposed Solution</div>
                                    <div class="review-content position-relative p-3 bg-white rounded border" id="review-solution">
                                        ${project.proposedSolution || "No content provided."}
                                        <div class="comment-trigger position-absolute top-0 end-0 m-2" onclick="window.CollaborationScreen.openCommentModal('proposedSolution', 'Proposed Solution')">
                                            <button class="btn btn-sm btn-success rounded-circle shadow-sm" style="width:24px; height:24px; padding:0;"><i class="fa fa-plus" style="font-size:0.7rem;"></i></button>
                                        </div>
                                    </div>
                                    <div class="active-comments mt-2" id="comments-proposedSolution"></div>
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
                                        <strong id="meetingLinkDisplay" class="text-dark small text-truncate d-block">${mentorship.meetingLink || 'No link scheduled yet'}</strong>
                                    </div>
                                    ${amIMentor ? `<button class="btn btn-sm btn-link text-success p-0" onclick="window.CollaborationScreen.showMeetingEdit()"><i class="fa fa-edit fa-lg"></i></button>` : ''}
                                </div>
                            </div>
                            
                            <div class="mt-5 d-flex justify-content-center gap-3">
                                <button class="btn btn-success btn-lg px-5 rounded-pill shadow-sm" onclick="window.open('${mentorship.meetingLink || '#'}', '_blank')" ${!mentorship.meetingLink ? 'disabled' : ''}>
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
                 // Simulate file upload or use placeholder
                 fileUrl = "doc_placeholder_" + Date.now(); 
            }

            await addDoc(collection(db, `mentorships/${this.currentMentorshipId}/reports`), {
                title,
                content,
                fileUrl,
                fileName: file ? file.name : '',
                authorId: auth.currentUser.uid,
                authorName: auth.currentUser.displayName || "Innovator",
                createdAt: serverTimestamp(),
                feedback: []
            });

            window.reportModal.hide();
            adminToast("✓ Progress report submitted successfully!");
        } catch (e) {
            console.error("Report Error:", e);
            alert("Failed to submit report.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Submit Report';
        }
    }

    initReports() {
        const container = document.getElementById('reportsContainer');
        if (!container) return;

        const q = query(
            collection(db, `mentorships/${this.currentMentorshipId}/reports`),
            orderBy("createdAt", "desc")
        );

        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="text-center py-5 bg-light rounded border-dashed" style="border: 2px dashed #ddd;">
                        <i class="fa fa-folder-open fa-2x text-muted mb-3 d-block"></i>
                        <p class="text-muted mb-0">No progress reports submitted yet.</p>
                    </div>`;
                return;
            }

            container.innerHTML = '';
            snapshot.forEach(docSnap => {
                const report = docSnap.data();
                const reportId = docSnap.id;
                const isMentor = this.currentPartner.role === 'Mentor'; // If partner is mentor, I am innovator
                
                const card = document.createElement('div');
                card.className = 'report-card p-4 bg-white rounded shadow-sm border mb-3';
                card.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="fw-bold mb-1">${report.title}</h5>
                            <small class="text-muted"><i class="fa fa-calendar me-1"></i> ${report.createdAt?.toDate().toLocaleDateString() || 'Just now'}</small>
                        </div>
                        ${report.fileName ? `<div class="badge bg-light text-dark border"><i class="fa fa-paperclip me-1"></i> ${report.fileName}</div>` : ''}
                    </div>
                    <div class="report-text mb-4 text-muted small">${report.content.substring(0, 150)}${report.content.length > 150 ? '...' : ''}</div>
                    
                    <div class="report-feedback-section border-top pt-3">
                        <div id="report-feedback-${reportId}" class="mb-3">
                            ${(report.feedback || []).map(fb => `
                                <div class="feedback-item mb-2 p-2 bg-light rounded small">
                                    <strong class="text-success">${fb.authorName}:</strong> ${fb.text}
                                </div>
                            `).join('')}
                        </div>
                        ${this.currentPartner.isMentor === false ? `
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control" id="fb-input-${reportId}" placeholder="Leave a comment...">
                                <button class="btn btn-success" onclick="window.CollaborationScreen.addReportFeedback('${reportId}')">
                                    <i class="fa fa-comment"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
                container.appendChild(card);
            });
        });
    }

    async addReportFeedback(reportId) {
        const input = document.getElementById(`fb-input-${reportId}`);
        const text = input.value.trim();
        if (!text) return;

        try {
            const reportRef = doc(db, `mentorships/${this.currentMentorshipId}/reports`, reportId);
            const reportSnap = await getDoc(reportRef);
            if (!reportSnap.exists()) return;

            const feedback = reportSnap.data().feedback || [];
            feedback.push({
                text,
                authorId: auth.currentUser.uid,
                authorName: auth.currentUser.displayName || (this.currentPartner.isMentor ? "Innovator" : "Mentor"),
                createdAt: new Date().toISOString()
            });

            await updateDoc(reportRef, { feedback });
            input.value = '';
        } catch (e) {
            console.error("Feedback Error:", e);
        }
    }

    initChat() {
        const chatContainer = document.getElementById('chatMessages');
        if (!chatContainer) return;

        const chatId = [auth.currentUser.uid, this.currentPartner.id].sort().join('_');
        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("timestamp", "asc")
        );

        if (this.unsubscribeChat) this.unsubscribeChat();

        this.unsubscribeChat = onSnapshot(q, (snapshot) => {
            chatContainer.innerHTML = '';
            snapshot.forEach((doc) => {
                const msg = doc.data();
                const isMe = msg.senderId === auth.currentUser.uid;
                chatContainer.innerHTML += `
                    <div class="msg ${isMe ? 'sent' : 'received'}">
                        ${msg.text}
                    </div>
                `;
            });
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
    }

    async sendMessage() {
        const input = document.getElementById('chatMsgInput');
        const text = input.value.trim();
        if (!text) return;

        const chatId = [auth.currentUser.uid, this.currentPartner.id].sort().join('_');
        
        try {
            await addDoc(collection(db, "chats", chatId, "messages"), {
                senderId: auth.currentUser.uid,
                text: text,
                timestamp: serverTimestamp()
            });
            input.value = '';
        } catch (e) {
            console.error("Chat Error:", e);
        }
    }

    /* FEEDBACK / COMMENTING SYSTEM */

    initFeedback() {
        const fields = ['problemStatement', 'proposedSolution', 'expectedImpact'];
        
        if (this.unsubscribeFeedback) this.unsubscribeFeedback();

        // One listener for all project feedback
        const q = query(
            collection(db, `projects/${this.currentProjectId}/feedback`),
            orderBy("createdAt", "asc")
        );

        this.unsubscribeFeedback = onSnapshot(q, (snapshot) => {
            // Clear current UI areas
            fields.forEach(f => {
                const el = document.getElementById(`comments-${f}`);
                if (el) el.innerHTML = '';
            });

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const el = document.getElementById(`comments-${data.field}`);
                if (el) {
                    const isMe = data.authorId === auth.currentUser.uid;
                    el.innerHTML += `
                        <div class="comment-bubble ${isMe ? 'my-comment' : 'partner-comment'}">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <span class="author">${data.authorName}</span>
                                <span class="time">${data.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'Just now'}</span>
                            </div>
                            <div class="text">${data.content}</div>
                        </div>
                    `;
                }
            });
        });
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
            
            await addDoc(collection(db, `projects/${this.currentProjectId}/feedback`), {
                field: field,
                content: text,
                authorId: auth.currentUser.uid,
                authorName: auth.currentUser.displayName || "Someone",
                createdAt: serverTimestamp()
            });

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
            await updateDoc(doc(db, "mentorshipRequests", this.currentMentorshipId), {
                meetingLink: link,
                updatedAt: serverTimestamp()
            });

            document.getElementById('meetingLinkDisplay').textContent = link;
            const modalEl = document.getElementById('meetingModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            
            alert("Meeting link updated! Your mentee can now see it.");
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

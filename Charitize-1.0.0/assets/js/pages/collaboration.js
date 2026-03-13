import { auth, db } from '../core/firebase-config.js';
import { 
    doc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * CollaborationHub
 * Handles the shared mentorship workspace logic
 */
class CollaborationHub {
    constructor() {
        this.activeMentorshipId = null;
        this.mentorshipData = null;
        this.projectData = null;
        this.unsubscribeChat = null;
        this.milestones = [];
    }

    async init(mentorshipId) {
        console.log("CollaborationHub: Initializing with ID:", mentorshipId);
        this.activeMentorshipId = mentorshipId;
        
        try {
            // 1. Fetch mentorship data
            const mDoc = await getDoc(doc(db, "mentorshipRequests", mentorshipId));
            if (!mDoc.exists()) throw new Error("Mentorship session not found");
            this.mentorshipData = { id: mDoc.id, ...mDoc.data() };

            // 2. Fetch project data (conditional)
            if (this.mentorshipData.projectId) {
                const pDoc = await getDoc(doc(db, "projects", this.mentorshipData.projectId));
                if (pDoc.exists()) {
                    this.projectData = { id: pDoc.id, ...pDoc.data() };
                } else {
                    console.warn("CollaborationHub: Project ID exists but doc not found.");
                    this.projectData = { title: "Deleted Project", id: "deleted" };
                }
            } else {
                this.projectData = { 
                    title: "General Mentorship", 
                    id: "general",
                    problemStatement: "Direct mentorship session.",
                    objectives: "Guidance and strategic advice.",
                    proposedSolution: "N/A",
                    expectedImpact: "Skill development and growth."
                };
            }

            // 3. Update UI Header
            this.updateHeader();

            // 4. Start Real-time Chat
            this.startChatListener();

            // 5. Render Project Details with Commenting
            this.renderProjectDetails();

            // 6. Load Milestones
            this.loadMilestones();

            // 7. Load Resources
            this.loadResources();

            // Ensure active tab is Overview on init
            const overviewTab = document.getElementById('v-pills-overview-tab');
            if (overviewTab) bootstrap.Tab.getOrCreateInstance(overviewTab).show();

            // Switch to the section
            window.showDashboardSection('collaboration');
        } catch (error) {
            console.error("CollaborationHub Error:", error);
            alert("Failed to join collaboration hub: " + error.message);
        }
    }

    async updateHeader() {
        const header = document.querySelector('.collaboration-header-card');
        if (header) {
            document.getElementById('collabProjectTitle').textContent = this.projectData.title;
            document.getElementById('collabSessionId').textContent = `#${this.activeMentorshipId.substring(0, 8).toUpperCase()}`;
        }

        try {
            const isInnovator = auth.currentUser.uid === this.mentorshipData.innovatorId;
            const targetId = isInnovator ? this.mentorshipData.mentorId : this.mentorshipData.innovatorId;
            
            const snap = await getDoc(doc(db, 'users', targetId));
            if (snap.exists()) {
                const data = snap.data();
                const avatar = document.getElementById('collaboratorAvatar');
                const name = document.getElementById('collaboratorName');
                
                if (name) name.textContent = data.fullName || 'Partner';
                if (avatar) {
                    if (data.photoURL) {
                        avatar.innerHTML = `<img src="${data.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
                    } else {
                        const initials = (data.fullName || 'P').split(' ').map(n => n[0]).join('').toUpperCase();
                        avatar.textContent = initials.substring(0, 2);
                    }
                }
                this._partnerData = data;
                this.updateMeetingUI();
            }
        } catch (err) {
            console.warn('CollaborationHub: Could not fetch partner details', err);
        }
    }

    updateMeetingUI() {
        const meetingUI = document.getElementById('meetingStatusUI');
        if (!meetingUI) return;

        const meetingLink = this.mentorshipData.meetingLink || this._partnerData?.meetingLink;
        if (meetingLink) {
            meetingUI.innerHTML = `
                <p class="small text-muted mb-2">Sync with your partner</p>
                <div class="fw-bold text-success mb-0">
                    <i class="fa fa-video me-1"></i> Meeting Link Ready
                </div>
            `;
            this._meetingLink = meetingLink;
        } else {
            meetingUI.innerHTML = `
                <p class="small text-muted mb-2">Sync with your partner</p>
                <div class="fw-bold text-muted mb-0">
                    <i class="fa fa-clock me-1"></i> No link available yet.
                </div>
            `;
        }
    }

    joinMeeting() {
        if (this._meetingLink) {
            window.open(this._meetingLink, '_blank');
        } else {
            alert("No meeting link has been shared yet. Please chat with your partner to coordinate.");
        }
    }

    startChatListener() {
        if (this.unsubscribeChat) this.unsubscribeChat();

        const chatBox = document.getElementById('collabChatBox');
        const chatForm = document.getElementById('collabChatForm');

        // Reset form
        chatForm.onsubmit = async (e) => {
            e.preventDefault();
            const input = chatForm.querySelector('input');
            const text = input.value.trim();
            if (!text) return;

            try {
                await addDoc(collection(db, `mentorshipRequests/${this.activeMentorshipId}/messages`), {
                    senderId: auth.currentUser.uid,
                    text: text,
                    createdAt: serverTimestamp()
                });

                // Notify counter-party
                const targetId = auth.currentUser.uid === this.mentorshipData.mentorId ? this.mentorshipData.innovatorId : this.mentorshipData.mentorId;
                const myRole = auth.currentUser.uid === this.mentorshipData.mentorId ? 'Mentor' : 'Innovator';
                
                if (window.NotificationSystem) {
                    await window.NotificationSystem.send(
                        targetId,
                        `New message from ${myRole} in ${this.mentorshipData.projectTitle || 'Project Hub'}`,
                        'info',
                        '#collaboration'
                    );
                }

                input.value = '';
            } catch (err) {
                console.error("Failed to send message:", err);
            }
        };

        const q = query(
            collection(db, `mentorshipRequests/${this.activeMentorshipId}/messages`),
            orderBy("createdAt", "asc")
        );

        this.unsubscribeChat = onSnapshot(q, (snapshot) => {
            chatBox.innerHTML = '';
            if (snapshot.empty) {
                chatBox.innerHTML = '<div class="text-center py-5 text-muted small">No messages yet. Start the conversation!</div>';
                return;
            }

            snapshot.forEach(doc => {
                const msg = doc.data();
                const isMe = msg.senderId === auth.currentUser.uid;
                
                const msgDiv = document.createElement('div');
                msgDiv.className = `d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'} mb-3`;
                msgDiv.innerHTML = `
                    <div class="message-bubble-saas shadow-sm ${isMe ? 'sent' : 'received'}">
                        <div class="small fw-bold mb-1" style="opacity: 0.8;">${isMe ? 'You' : 'Collaborator'}</div>
                        <div>${msg.text}</div>
                        <div class="mt-1" style="font-size: 0.65rem; opacity: 0.6; text-align: right;">
                            ${msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                        </div>
                    </div>
                `;
                chatBox.appendChild(msgDiv);
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }

    renderProjectDetails() {
        const container = document.getElementById('collabProjectDetails');
        const sections = [
            { id: 'problemStatement', title: 'Problem Statement' },
            { id: 'objectives', title: 'Objectives' },
            { id: 'proposedSolution', title: 'Proposed Solution' },
            { id: 'expectedImpact', title: 'Expected Impact' }
        ];

        container.innerHTML = sections.map(s => `
            <div class="review-section-premium mb-5">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="me-1"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                        ${s.title}
                    </h5>
                    <button class="btn btn-sm btn-light rounded-pill px-3 fw-bold" onclick="window.CollaborationHub.openCommentModal('${s.id}')" style="background:rgba(26,94,79,0.05); color:var(--brand-green); border:none;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="me-1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Feedback
                    </button>
                </div>
                <div class="review-content-box shadow-sm">
                    ${this.projectData[s.id] || 'Not specified.'}
                </div>
                <div id="comments-${s.id}" class="mt-3 space-y-2">
                    <!-- Section comments injected here -->
                </div>
            </div>
        `).join('');

        // Start real-time listener for comments
        this.startCommentListener();
    }

    startCommentListener() {
        const q = query(
            collection(db, `mentorshipRequests/${this.activeMentorshipId}/comments`),
            orderBy("createdAt", "asc")
        );

        onSnapshot(q, (snapshot) => {
            // Clear all comment containers
            const containers = document.querySelectorAll('[id^="comments-"]');
            containers.forEach(c => c.innerHTML = '');

            snapshot.forEach(docSnap => {
                const comment = docSnap.data();
                const container = document.getElementById(`comments-${comment.sectionId}`);
                if (container) {
                    const isMentor = comment.role === 'mentor';
                    const div = document.createElement('div');
                    div.className = `p-2 rounded-3 small mb-2 ${isMentor ? 'bg-primary-soft border-primary' : 'bg-light border'}`;
                    div.style.borderLeft = '3px solid ' + (isMentor ? 'var(--brand-green)' : '#ccc');
                    div.innerHTML = `
                        <div class="d-flex justify-content-between">
                            <span class="fw-bold">${isMentor ? 'Mentor' : 'Innovator'}</span>
                            <span class="opacity-50 text-xs">${comment.createdAt ? new Date(comment.createdAt.toDate()).toLocaleDateString() : '...'}</span>
                        </div>
                        <div>${comment.text}</div>
                    `;
                    container.appendChild(div);
                }
            });
        });
    }

    openCommentModal(sectionId) {
        // Remove any existing inline feedback panels
        document.querySelectorAll('.collab-inline-feedback').forEach(el => el.remove());

        const sectionEl = document.getElementById(`comments-${sectionId}`);
        if (!sectionEl) return;

        const panel = document.createElement('div');
        panel.className = 'collab-inline-feedback';
        panel.style.cssText = `
            margin-top: 14px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 14px;
            border: 1.5px solid rgba(26,94,79,0.15);
            animation: fadeInUp 0.2s ease;
        `;
        panel.innerHTML = `
            <div style="font-family:var(--font-head,sans-serif);font-weight:800;font-size:0.82rem;color:var(--brand-green,#1a5e4f);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                <span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Add Feedback
                </span>
                <button onclick="this.closest('.collab-inline-feedback').remove()" style="background:none;border:none;cursor:pointer;color:#aaa;font-size:1rem;line-height:1;">✕</button>
            </div>
            <textarea id="inline-feedback-text-${sectionId}" rows="3" placeholder="Write your feedback for this section..." style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:0.9rem;outline:none;resize:vertical;font-family:var(--font-main,sans-serif);"></textarea>
            <button id="inline-feedback-submit-${sectionId}" style="margin-top:10px;background:var(--brand-green,#1a5e4f);color:white;border:none;border-radius:10px;padding:10px 20px;font-weight:700;font-size:0.85rem;cursor:pointer;width:100%;transition:background 0.2s;" 
                onmouseover="this.style.background='#14493e'" onmouseout="this.style.background='var(--brand-green,#1a5e4f)'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px;"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Submit Feedback
            </button>
        `;
        sectionEl.parentNode.insertBefore(panel, sectionEl);

        // Bind submit
        document.getElementById(`inline-feedback-submit-${sectionId}`).addEventListener('click', async () => {
            const text = document.getElementById(`inline-feedback-text-${sectionId}`).value.trim();
            if (!text) return;
            const btn = document.getElementById(`inline-feedback-submit-${sectionId}`);
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

            const user = JSON.parse(localStorage.getItem('innovateHubUser') || '{}');
            try {
                await addDoc(collection(db, `mentorshipRequests/${this.activeMentorshipId}/comments`), {
                    sectionId: sectionId,
                    text: text,
                    senderId: auth.currentUser.uid,
                    role: user.role || 'innovator',
                    createdAt: serverTimestamp()
                });

                // Notify counter-party
                const targetId = auth.currentUser.uid === this.mentorshipData.mentorId ? this.mentorshipData.innovatorId : this.mentorshipData.mentorId;
                const myRoleLabel = auth.currentUser.uid === this.mentorshipData.mentorId ? 'Mentor' : 'Innovator';

                if (window.NotificationSystem) {
                    await window.NotificationSystem.send(
                        targetId,
                        `${myRoleLabel} added feedback to your project section: ${sectionId}`,
                        'success',
                        '#collaboration'
                    );
                }

                panel.remove();
            } catch (err) {
                console.error('Failed to add comment:', err);
                btn.disabled = false;
                btn.textContent = 'Retry';
            }
        });
    }

    async loadMilestones() {
        const container = document.getElementById('collabTimeline');
        // Re-use logic from innovator dashboard but scoped to this mentorship or project
        // For simplicity, we'll fetch all milestones for this project
        const q = query(collection(db, 'milestones'), where('projectId', '==', this.mentorshipData.projectId));
        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = '<div class="text-center py-5 text-muted">No milestones defined. Use "Manage Project" to add one.</div>';
                return;
            }

            this.milestones = snapshot.docs.map(d => d.data());
            this.updateProgress();

            container.innerHTML = snapshot.docs.map(docSnap => {
                const m = docSnap.data();
                const status = m.status || 'pending';
                const color = status === 'completed' ? 'success' : (status === 'in-progress' ? 'warning' : 'secondary');
                
                return `
                    <div class="milestone-item d-flex gap-3 mb-4 position-relative">
                        <div class="milestone-indicator">
                            <div class="rounded-circle bg-${color} shadow-sm" style="width: 14px; height: 14px; margin-top: 6px;"></div>
                            <div class="vr h-100 position-absolute start-0 ms-1 opacity-25" style="top: 20px;"></div>
                        </div>
                        <div class="flex-grow-1 p-3 rounded-4 bg-white border shadow-sm">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="fw-bold mb-0">${m.title}</h6>
                                <span class="badge rounded-pill bg-${color}-soft text-${color} small">${status}</span>
                            </div>
                            <p class="text-muted small mb-0">${m.description || ''}</p>
                        </div>
                    </div>
                `;
            }).join('');
        });
    }

    updateProgress() {
        if (!this.milestones.length) return;
        const completed = this.milestones.filter(m => m.status === 'completed').length;
        const percent = Math.round((completed / this.milestones.length) * 100);
        
        const header = document.querySelector('.collaboration-header-card');
        if (header) {
            let progressWrap = document.getElementById('collabProgressWrap');
            if (!progressWrap) {
                progressWrap = document.createElement('div');
                progressWrap.id = 'collabProgressWrap';
                progressWrap.className = 'mt-3 pt-3 border-top border-white border-opacity-10';
                progressWrap.style.width = '1000px';
                progressWrap.style.maxWidth = '100%';
                header.querySelector('.collab-project-info').appendChild(progressWrap);
            }
            
            progressWrap.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2 small fw-bold">
                    <span style="letter-spacing:1px; opacity:0.8;">PROJECT COMPLETION</span>
                    <span>${percent}%</span>
                </div>
                <div class="progress rounded-pill bg-white bg-opacity-10" style="height: 6px;">
                    <div class="progress-bar bg-warning rounded-pill shadow-sm" style="width: ${percent}%; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
                </div>
            `;
        }
    }

    loadResources() {
        // Resources are now handled more implicitly in the UI, but we can add secondary docs here if needed
        console.log("Resources loaded for hub.");
    }
}

// Global instance
window.CollaborationHub = new CollaborationHub();
export default window.CollaborationHub;

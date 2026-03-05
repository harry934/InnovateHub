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
    }

    async init(mentorshipId) {
        console.log("CollaborationHub: Initializing with ID:", mentorshipId);
        this.activeMentorshipId = mentorshipId;
        
        try {
            // 1. Fetch mentorship data
            const mDoc = await getDoc(doc(db, "mentorshipRequests", mentorshipId));
            if (!mDoc.exists()) throw new Error("Mentorship session not found");
            this.mentorshipData = { id: mDoc.id, ...mDoc.data() };

            // 2. Fetch project data
            const pDoc = await getDoc(doc(db, "projects", this.mentorshipData.projectId));
            if (!pDoc.exists()) throw new Error("Project not found");
            this.projectData = { id: pDoc.id, ...pDoc.data() };

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

            // Switch to the section
            window.showDashboardSection('collaboration');
        } catch (error) {
            console.error("CollaborationHub Error:", error);
            alert("Failed to join collaboration hub: " + error.message);
        }
    }

    updateHeader() {
        document.getElementById('collabProjectTitle').textContent = this.projectData.title;
        
        // Fetch names if not present (simplified for now, ideally fetch from users collection)
        document.getElementById('collabInnovatorName').textContent = "Innovator";
        document.getElementById('collabMentorName').textContent = "Mentor";
        
        // Try to find names in mentorship data if cached there
        if (this.mentorshipData.innovatorName) document.getElementById('collabInnovatorName').textContent = this.mentorshipData.innovatorName;
        if (this.mentorshipData.mentorName) document.getElementById('collabMentorName').textContent = this.mentorshipData.mentorName;
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
                    <div class="message-bubble p-3 rounded-4 shadow-sm" style="max-width: 80%; background: ${isMe ? 'var(--brand-green)' : 'white'}; color: ${isMe ? 'white' : 'inherit'}; border: ${isMe ? 'none' : '1px solid #eee'};">
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
            <div class="project-review-card p-4 rounded-4 bg-white border mb-4 shadow-sm">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="fw-bold mb-0 text-primary">${s.title}</h5>
                    <button class="btn btn-sm btn-light rounded-pill px-3" onclick="window.CollaborationHub.openCommentModal('${s.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Feedback
                    </button>
                </div>
                <div class="p-3 bg-light rounded-3" style="line-height: 1.6; border-left: 4px solid var(--brand-green);">
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

    async openCommentModal(sectionId) {
        const text = prompt("Enter your feedback for this section:");
        if (!text) return;

        const user = JSON.parse(localStorage.getItem('innovateHubUser') || '{}');
        
        try {
            await addDoc(collection(db, `mentorshipRequests/${this.activeMentorshipId}/comments`), {
                sectionId: sectionId,
                text: text,
                senderId: auth.currentUser.uid,
                role: user.role || 'innovator',
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to add comment:", err);
            alert("Error adding feedback.");
        }
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

    loadResources() {
        const linkBox = document.getElementById('collabMeetingLink');
        const docBox = document.getElementById('collabProjectDocs');

        // Meeting Link
        if (this.mentorshipData.meetingLink) {
            linkBox.innerHTML = `
                <a href="${this.mentorshipData.meetingLink}" target="_blank" class="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2 rounded-pill py-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                    Join Video Call
                </a>
            `;
        } else {
            linkBox.innerHTML = '<p class="text-muted small text-center italic">Mentor hasn\'t provided a persistent link yet.</p>';
        }

        // Project Document
        if (this.projectData.fileUrl) {
            docBox.innerHTML = `
                <a href="${this.projectData.fileUrl}" target="_blank" class="text-decoration-none p-3 border rounded-3 bg-white d-block hover-lift">
                    <div class="fw-bold text-dark small mb-1">${this.projectData.fileName || 'Project Document'}</div>
                    <div class="text-primary smaller">Download Original <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
                </a>
            `;
        }
    }
}

// Global instance
window.CollaborationHub = new CollaborationHub();
export default window.CollaborationHub;

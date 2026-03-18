/**
 * Session Manager Component
 * Handles virtual session scheduling, booking, and display.
 */

class SessionManager {
    constructor() {
        this.container = document.getElementById('sessionsContainer');
    }

    async init(userId, role) {
        if (!this.container) return;
        this.userId = userId;
        this.role = role;
        await this.loadSessions();
    }

    async loadSessions() {
        try {
            this.container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';
            
            // 1. Get mentorships first
            const mentorships = await window.SupabaseService.getMentorships(this.userId, this.role);
            if (!mentorships || mentorships.length === 0) {
                this.renderEmptyState();
                return;
            }

            // 2. Get sessions for all mentorships
            let allSessions = [];
            for (const m of mentorships) {
                const sessions = await window.SupabaseService.getSessions(m.id);
                allSessions = [...allSessions, ...sessions];
            }

            this.renderSessions(allSessions);
        } catch (error) {
            console.error("SessionManager: Load failed", error);
            this.container.innerHTML = `<div class="alert alert-danger">Error loading sessions: ${error.message}</div>`;
        }
    }

    renderSessions(sessions) {
        if (sessions.length === 0) {
            this.renderEmptyState();
            return;
        }

        const upcoming = sessions.filter(s => new Date(s.session_date) > new Date()).sort((a,b) => new Date(a.session_date) - new Date(b.session_date));
        const past = sessions.filter(s => new Date(s.session_date) <= new Date()).sort((a,b) => new Date(b.session_date) - new Date(a.session_date));

        let html = '';
        
        if (this.role === 'mentor') {
            html += `
                <div class="col-12 mb-4">
                    <button class="btn btn-orange rounded-pill px-4 fw-bold" onclick="window.SessionManager.showAddSessionModal()">
                        <i class="fa fa-plus me-2"></i> Schedule New Session
                    </button>
                </div>
            `;
        }

        if (upcoming.length > 0) {
            html += '<div class="col-12"><h5 class="fw-bold mb-3">Upcoming Sessions</h5></div>';
            upcoming.forEach(s => html += this.createSessionCard(s, true));
        }

        if (past.length > 0) {
            html += '<div class="col-12 mt-4"><h5 class="fw-bold mb-3 text-muted">Past Sessions</h5></div>';
            past.forEach(s => html += this.createSessionCard(s, false));
        }

        this.container.innerHTML = html;
    }

    createSessionCard(session, isUpcoming) {
        const date = new Date(session.session_date);
        const dateStr = date.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' });
        const timeStr = date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden" style="background: rgba(255,255,255,0.9); backdrop-filter: blur(10px);">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="bg-light p-2 rounded-3 text-center" style="min-width: 60px;">
                                <div class="small fw-bold text-uppercase">${date.toLocaleDateString('en-KE', { month: 'short' })}</div>
                                <div class="h4 mb-0 fw-bold">${date.getDate()}</div>
                            </div>
                            <span class="badge ${isUpcoming ? 'bg-success' : 'bg-secondary'} rounded-pill">${session.status}</span>
                        </div>
                        <h6 class="fw-bold mb-2">${session.title}</h6>
                        <p class="small text-muted mb-3"><i class="fa fa-clock me-1"></i> ${timeStr}</p>
                        ${session.meeting_link ? `
                            <a href="${session.meeting_link}" target="_blank" class="btn btn-sm btn-outline-primary w-100 rounded-pill">
                                <i class="fa fa-video me-1"></i> Join Meeting
                            </a>
                        ` : '<button class="btn btn-sm btn-light w-100 rounded-pill disabled">Link Pending</button>'}
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        this.container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="bg-light rounded-circle p-4 d-inline-block mb-3">
                    <i class="fa fa-calendar-times fa-3x text-muted"></i>
                </div>
                <h5>No sessions found</h5>
                <p class="text-muted">You haven't scheduled or joined any mentoring sessions yet.</p>
                ${this.role === 'mentor' ? `
                    <button class="btn btn-orange rounded-pill px-4" onclick="window.SessionManager.showAddSessionModal()">
                        Schedule First Session
                    </button>
                ` : ''}
            </div>
        `;
    }

    showAddSessionModal() {
        // Implementation for modal to add session
        alert("Scheduling modal coming soon (Needs Mentorship ID selection)");
    }
}

window.SessionManager = new SessionManager();
export default window.SessionManager;

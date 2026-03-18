/**
 * Feedback Service Component
 * Handles project reviews, star ratings, and mentor comments.
 */

class FeedbackService {
    constructor() {
        this.container = document.getElementById('feedbackContainer');
    }

    async init(userId, role) {
        if (!this.container) return;
        this.userId = userId;
        this.role = role;
        await this.loadFeedback();
    }

    async loadFeedback() {
        try {
            this.container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';
            
            // 1. Get mentorships
            const mentorships = await window.SupabaseService.getMentorships(this.userId, this.role);
            if (!mentorships || mentorships.length === 0) {
                this.renderEmptyState();
                return;
            }

            // 2. Get feedback for all mentorships/projects
            let allFeedback = [];
            for (const m of mentorships) {
                // If project_id exists on mentorship
                if (m.project_id) {
                    const feedback = await window.SupabaseService.getProjectFeedback(m.project_id);
                    allFeedback = [...allFeedback, ...feedback];
                }
            }

            this.renderFeedback(allFeedback);
        } catch (error) {
            console.error("FeedbackService: Load failed", error);
            this.container.innerHTML = `<div class="alert alert-danger">Error loading feedback: ${error.message}</div>`;
        }
    }

    renderFeedback(feedbackItems) {
        if (feedbackItems.length === 0) {
            this.renderEmptyState();
            return;
        }

        let html = '';
        if (this.role === 'mentor') {
            html += `
                <div class="col-12 mb-4">
                    <button class="btn btn-orange rounded-pill px-4 fw-bold" onclick="window.FeedbackService.showAddFeedbackModal()">
                        <i class="fa fa-star me-2"></i> Submit New Feedback
                    </button>
                </div>
            `;
        }

        feedbackItems.forEach(item => {
            const stars = '★'.repeat(item.stars) + '☆'.repeat(5 - item.stars);
            const date = new Date(item.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
            
            html += `
                <div class="col-12 mb-3">
                    <div class="card border-0 shadow-sm rounded-4" style="background: rgba(255,255,255,0.85); backdrop-filter: blur(10px);">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div class="text-warning h4 mb-0">${stars}</div>
                                <small class="text-muted">${date}</small>
                            </div>
                            <h6 class="fw-bold mb-2">Project Review</h6>
                            <p class="text-dark mb-0" style="white-space: pre-wrap;">${item.comment}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        this.container.innerHTML = html;
    }

    renderEmptyState() {
        this.container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="bg-light rounded-circle p-4 d-inline-block mb-3">
                    <i class="fa fa-comment-dots fa-3x text-muted"></i>
                </div>
                <h5>No feedback yet</h5>
                <p class="text-muted">Project reviews and ratings will appear here once submitted.</p>
                ${this.role === 'mentor' ? `
                    <button class="btn btn-orange rounded-pill px-4" onclick="window.FeedbackService.showAddFeedbackModal()">
                        Provide First Feedback
                    </button>
                ` : ''}
            </div>
        `;
    }

    showAddFeedbackModal() {
        alert("Feedback submission modal coming soon");
    }
}

window.FeedbackService = new FeedbackService();
export default window.FeedbackService;

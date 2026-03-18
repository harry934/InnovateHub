/**
 * Progress Report Manager
 * Handles milestone tracking, achievements, and challenges.
 */

class ReportManager {
    constructor() {
        this.container = document.getElementById('reportsContainer');
    }

    async init(userId, role) {
        if (!this.container) return;
        this.userId = userId;
        this.role = role;
        await this.loadReports();
    }

    async loadReports() {
        try {
            this.container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';
            
            const mentorships = await window.SupabaseService.getMentorships(this.userId, this.role);
            if (!mentorships || mentorships.length === 0) {
                this.renderEmptyState();
                return;
            }

            let allReports = [];
            for (const m of mentorships) {
                if (m.project_id) {
                    const reports = await window.SupabaseService.getProgressReports(m.project_id);
                    allReports = [...allReports, ...reports];
                }
            }

            this.renderReports(allReports);
        } catch (error) {
            console.error("ReportManager: Load failed", error);
            this.container.innerHTML = `<div class="alert alert-danger">Error loading reports: ${error.message}</div>`;
        }
    }

    renderReports(reports) {
        if (reports.length === 0) {
            this.renderEmptyState();
            return;
        }

        let html = '';
        if (this.role === 'innovator') {
            html += `
                <div class="col-12 mb-4">
                    <button class="btn btn-orange rounded-pill px-4 fw-bold" onclick="window.ReportManager.showAddReportModal()">
                        <i class="fa fa-plus me-2"></i> Submit New Report
                    </button>
                </div>
            `;
        }

        reports.forEach(report => {
            const date = new Date(report.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
            
            html += `
                <div class="col-12 mb-4">
                    <div class="card border-0 shadow-sm rounded-4 overflow-hidden" style="background: rgba(255,255,255,0.9); backdrop-filter: blur(10px);">
                        <div class="bg-primary p-3 text-white d-flex justify-content-between align-items-center">
                            <span class="fw-bold">${report.reporting_period}</span>
                            <span class="badge bg-warning text-dark rounded-pill">${report.progress_percentage}% Done</span>
                        </div>
                        <div class="card-body p-4">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <h6 class="fw-bold text-primary mb-2">Key Achievements</h6>
                                    <p class="small text-dark">${report.achievements || 'None reported'}</p>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <h6 class="fw-bold text-danger mb-2">Challenges</h6>
                                    <p class="small text-dark">${report.challenges || 'None reported'}</p>
                                </div>
                                <div class="col-12">
                                    <h6 class="fw-bold text-success mb-2">Next Steps</h6>
                                    <p class="small text-dark mb-0">${report.next_steps || 'Not specified'}</p>
                                </div>
                            </div>
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
                    <i class="fa fa-file-invoice fa-3x text-muted"></i>
                </div>
                <h5>No reports found</h5>
                <p class="text-muted">Progress reports detailing milestones and achievements will appear here.</p>
                ${this.role === 'innovator' ? `
                    <button class="btn btn-orange rounded-pill px-4" onclick="window.ReportManager.showAddReportModal()">
                        Create First Report
                    </button>
                ` : ''}
            </div>
        `;
    }

    showAddReportModal() {
        alert("Report submission modal coming soon");
    }
}

window.ReportManager = new ReportManager();
export default window.ReportManager;

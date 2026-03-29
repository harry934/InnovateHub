/**
 * Activity Timeline Component
 * Fetches and renders recent project activity for the dashboard.
 */

import SupabaseService from '../core/supabase-service.js?v=102.0.0';

const ActivityTimeline = {
    containerId: 'activityTimeline',

    async init(userId, role) {
        this.container = document.getElementById(this.containerId);
        if (!this.container) return;

        try {
            await this.refresh(userId, role);
        } catch (err) {
            console.warn("ActivityTimeline: Init failed", err);
        }
    },

    async refresh(userId, role) {
        if (!this.container) return;

        // 1. Loading State
        this.container.innerHTML = `
            <div class="text-center py-4 text-emerald-600/50 animate-pulse">
                <span class="material-symbols-outlined fs-2">pending</span>
                <p class="small">Fetching updates...</p>
            </div>
        `;

        try {
            // 2. Fetch Data
            // We get mentorships to find projects
            const mentorships = await SupabaseService.getMentorships(userId, role);
            if (!mentorships || mentorships.length === 0) {
                this.renderEmpty();
                return;
            }

            const projectIds = mentorships.map(m => m.project_id);
            const allActivity = [];

            // Fetch activity for each project
            // In a real app, we might have a single 'activity' table or a joined query
            for (const pid of projectIds) {
                const timeline = await SupabaseService.getProjectTimeline(pid);
                allActivity.push(...timeline);
            }

            // 3. Sort & Render
            if (allActivity.length === 0) {
                this.renderEmpty();
            } else {
                const sorted = allActivity.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
                this.render(sorted);
            }
        } catch (err) {
            console.error("ActivityTimeline: Refresh failed", err);
            this.container.innerHTML = `<p class="text-danger small p-3 text-center">Failed to load activity.</p>`;
        }
    },

    render(activities) {
        this.container.innerHTML = activities.map(item => {
            const date = new Date(item.date).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            
            let icon = 'info';
            let color = 'text-primary';
            let title = 'Activity';
            let action = '';

            if (item.type === 'feedback') {
                icon = 'star_half';
                color = 'text-amber-500';
                title = 'New Feedback';
                action = `Mentor provided ${item.stars || 5} stars on ${item.field_id || 'general'}`;
            } else if (item.type === 'report') {
                icon = 'assignment';
                color = 'text-emerald-500';
                title = 'Progress Report';
                action = 'Innovator submitted a new milestone report.';
            }

            return `
                <div class="d-flex gap-3 mb-4 last:mb-0 animate-fade-in px-1">
                    <div class="flex-shrink-0">
                        <div class="bg-light p-2 rounded-circle d-flex align-items-center justify-content-center border shadow-sm">
                            <span class="material-symbols-outlined ${color} fs-5">${icon}</span>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <h6 class="mb-0 fw-bold fs-14">${title}</h6>
                            <span class="fs-12 text-muted fw-500">${date}</span>
                        </div>
                        <p class="mb-0 text-muted fs-13 line-clamp-2">${action}</p>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderEmpty() {
        this.container.innerHTML = `
            <div class="text-center py-5 text-muted opacity-50">
                <span class="material-symbols-outlined fs-1 mb-2">inbox</span>
                <p class="small mb-0">No project activity found yet.</p>
            </div>
        `;
    }
};

window.InnovateActivityTimeline = ActivityTimeline;
export default ActivityTimeline;

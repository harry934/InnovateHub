// Firestore imports removed
import { ActivityTracker } from '../utils/activity-tracker.js';

/**
 * Dashboard Charts Module
 * Handles initialization and data binding for the analytics section.
 */
class DashboardCharts {
    constructor() {
        this.brandGreen = '#1a5e4f';
    }

    async init(userRole, userId) {
        console.log("Initializing Dashboard Analytics...");
        const analytics = document.getElementById('analyticsSection');
        if (analytics) analytics.style.display = 'flex';
        
        // Log daily activity first
        const tracker = new ActivityTracker(userId);
        await tracker.logDailyActivity();

        if (userRole === 'mentor') {
            await this.initMentorStats(userId, tracker);
        } else {
            await this.initInnovatorStats(userId, tracker);
        }
    }

    async initInnovatorStats(userId, tracker) {
        try {
            if (window.SupabaseService) {
                // 1. Fetch Projects Count
                const projects = await window.SupabaseService.getProjectsByInnovator(userId);
                const elProj = document.getElementById('atGlanceProjects');
                if (elProj) elProj.textContent = projects.length;

                // 2. Fetch Mentor Connections (Accepted Requests)
                const connections = await window.SupabaseService.getMentorships(userId, 'innovator');
                const acceptedCount = connections.filter(m => m.status === 'accepted').length;
                const elConn = document.getElementById('atGlanceConnections');
                if (elConn) elConn.textContent = acceptedCount;
                
                const elLabel = document.getElementById('atGlanceConnectionLabel');
                if (elLabel) elLabel.textContent = 'Mentor Connections';
            }

            // 3. Fetch Real Activity Data
            const activityData = await tracker.getActivityLastYear();
            this.renderHeatmap(activityData, 'contributions');
        } catch (err) {
            console.error("Error fetching innovator analytics:", err);
        }
    }

    async initMentorStats(userId, tracker) {
        try {
            if (window.SupabaseService) {
                const mentorships = await window.SupabaseService.getMentorships(userId, 'mentor');
                
                // 1. Active Mentees
                const activeCount = mentorships.filter(m => m.status === 'accepted').length;
                const elProj = document.getElementById('atGlanceProjects');
                if (elProj) elProj.textContent = activeCount;

                const elLabel1 = document.getElementById('atGlanceConnectionLabel');
                if (elLabel1) elLabel1.textContent = 'Active Mentees';

                // 2. Pending Requests
                const pendingCount = mentorships.filter(m => m.status === 'pending').length;
                const elConn = document.getElementById('atGlanceConnections');
                if (elConn) elConn.textContent = pendingCount;
            }

            // 3. Fetch Real Activity Data
            const activityData = await tracker.getActivityLastYear();
            this.renderHeatmap(activityData, 'mentorship activities');
        } catch (err) {
            console.error("Error fetching mentor analytics:", err);
        }
    }

    renderHeatmap(data, suffix) {
        const container = document.getElementById('heatmapContainer');
        if (!container) return;
        
        container.innerHTML = '<div id="activityHeatmap"></div>';

        if (window.ActivityHeatmap) {
            const heatmap = new window.ActivityHeatmap('activityHeatmap', {
                data: data,
                tooltipSuffix: suffix
            });
            heatmap.init();
        }
    }
}

export const charts = new DashboardCharts();
window.DashboardCharts = charts;

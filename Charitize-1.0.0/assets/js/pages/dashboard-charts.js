import { db } from '../core/firebase-config.js';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
            // 1. Fetch Projects Count
            const projectsSnap = await getDocs(query(collection(db, 'projects'), where('innovatorId', '==', userId)));
            const projectCount = projectsSnap.size;
            document.getElementById('atGlanceProjects').textContent = projectCount;

            // 2. Fetch Mentor Connections (Accepted Requests)
            const connectionsSnap = await getDocs(query(
                collection(db, 'mentorshipRequests'), 
                where('innovatorId', '==', userId),
                where('status', '==', 'accepted')
            ));
            document.getElementById('atGlanceConnections').textContent = connectionsSnap.size;
            document.getElementById('atGlanceConnectionLabel').textContent = 'Mentor Connections';

            // 3. Fetch Real Activity Data
            const activityData = await tracker.getActivityLastYear();
            this.renderHeatmap(activityData, 'contributions');
        } catch (err) {
            console.error("Error fetching innovator analytics:", err);
        }
    }

    async initMentorStats(userId, tracker) {
        try {
            // 1. Fetch Mentees Count (Accepted Requests)
            const menteesSnap = await getDocs(query(
                collection(db, 'mentorshipRequests'), 
                where('mentorId', '==', userId),
                where('status', '==', 'accepted')
            ));
            document.getElementById('atGlanceProjects').textContent = menteesSnap.size;
            document.getElementById('atGlanceConnectionLabel').textContent = 'Active Mentees';

            // 2. Fetch Pending Requests
            const pendingSnap = await getDocs(query(
                collection(db, 'mentorshipRequests'), 
                where('mentorId', '==', userId),
                where('status', '==', 'pending')
            ));
            document.getElementById('atGlanceConnections').textContent = pendingSnap.size;
            document.getElementById('atGlanceConnectionLabel').textContent = 'Pending Requests';

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

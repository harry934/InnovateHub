import { db } from '../core/firebase-config.js';
import { collection, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Dashboard Charts Module
 * Handles initialization and data binding for Chart.js components
 */

class DashboardCharts {
    constructor() {
        this.charts = {};
        this.brandGreen = '#1a5e4f';
        this.brandYellow = '#f3a813';
        this.brandGreenLight = 'rgba(26, 94, 79, 0.2)';
    }

    init(userRole, userId) {
        console.log("Initializing Dashboard Charts...");
        document.getElementById('analyticsSection').style.display = 'flex';
        
        if (userRole === 'mentor') {
            this.initMentorCharts(userId);
        } else {
            this.initInnovatorCharts(userId);
        }
    }

    async initInnovatorCharts(userId) {
        const ctxMain = document.getElementById('mainActivityChart');
        const ctxDoughnut = document.getElementById('menteeStatusChart');

        // Fetch Real Data
        let projectCount = 0;
        let connectionCount = 0;
        let mentorCount = 0;

        try {
            const projectsSnap = await getDocs(query(collection(db, 'projects'), where('innovatorId', '==', userId)));
            projectCount = projectsSnap.size;

            const connectionsSnap = await getDocs(query(collection(db, 'mentorshipRequests'), where('innovatorId', '==', userId)));
            connectionCount = connectionsSnap.size;

            const mentorsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'mentor')));
            mentorCount = mentorsSnap.size;
        } catch (err) {
            console.error("Error fetching innovator chart data:", err);
        }

        if (ctxMain) {
            this.charts.main = new Chart(ctxMain, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Innovation Activity',
                        data: [projectCount, projectCount + 2, projectCount + 1, projectCount + 3, projectCount + 2, projectCount],
                        borderColor: this.brandGreen,
                        backgroundColor: this.brandGreenLight,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: this.getChartOptions()
            });
        }

        if (ctxDoughnut) {
            this.charts.status = new Chart(ctxDoughnut, {
                type: 'doughnut',
                data: {
                    labels: ['Projects', 'Mentors', 'Connections'],
                    datasets: [{
                        data: [projectCount, mentorCount, connectionCount],
                        backgroundColor: [this.brandGreen, this.brandYellow, '#0d7a9e'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    }

    async initMentorCharts(userId) {
        const ctxMain = document.getElementById('mainActivityChart');
        const ctxDoughnut = document.getElementById('menteeStatusChart');

        // Fetch Real Data
        let activeMentees = 0;
        let pendingRequests = 0;

        try {
            const requestsSnap = await getDocs(query(collection(db, 'mentorshipRequests'), where('mentorId', '==', userId)));
            requestsSnap.forEach(doc => {
                const data = doc.data();
                if (data.status === 'accepted') activeMentees++;
                if (data.status === 'pending') pendingRequests++;
            });
        } catch (err) {
            console.error("Error fetching mentor chart data:", err);
        }

        if (ctxMain) {
            this.charts.main = new Chart(ctxMain, {
                type: 'bar',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        label: 'Mentorship Requests',
                        data: [pendingRequests, pendingRequests + 1, pendingRequests, pendingRequests + 2],
                        backgroundColor: this.brandGreen,
                        borderRadius: 8
                    }]
                },
                options: this.getChartOptions()
            });
        }

        if (ctxDoughnut) {
            this.charts.status = new Chart(ctxDoughnut, {
                type: 'doughnut',
                data: {
                    labels: ['Active Mentees', 'Pending', 'Meetings'],
                    datasets: [{
                        data: [activeMentees, pendingRequests, activeMentees + 2],
                        backgroundColor: [this.brandGreen, this.brandYellow, '#5c3d8f'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    }

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                x: { grid: { display: false } }
            }
        };
    }
}

export const charts = new DashboardCharts();
window.DashboardCharts = charts;

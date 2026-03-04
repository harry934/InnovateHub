/**
 * InnovateHub Mock Service
 * Version: 1.0.0
 * Purpose: Centralized mock data store for frontend logic simulation.
 *          Replace these functions with real API calls during backend integration.
 */

// ============================================================
//  MOCK DATA STORE
// ============================================================

const MOCK_STORE = {
    users: [
        {
            id: 'u1', fullName: 'Admin User', email: 'admin@innovatehub.com',
            role: 'admin', status: 'approved', joinDate: '2025-01-10'
        },
        {
            id: 'u2', fullName: 'Amara Okonkwo', email: 'amara@student.usiu.ac.ke',
            role: 'innovator', status: 'approved', joinDate: '2025-02-14',
            institution: 'USIU Africa', skills: ['IoT', 'Python'], interests: ['technology', 'agriculture']
        },
        {
            id: 'u3', fullName: 'Jabari Ndungu', email: 'jabari@student.usiu.ac.ke',
            role: 'innovator', status: 'approved', joinDate: '2025-03-01',
            institution: 'USIU Africa', skills: ['Mobile Dev', 'UI/UX'], interests: ['education', 'social']
        },
        {
            id: 'u4', fullName: 'Dr. Fatima Al-Rashid', email: 'fatima.mentor@example.com',
            role: 'mentor', status: 'approved', joinDate: '2025-01-20',
            institution: 'Tech Ventures Africa', expertise: 'AI, Machine Learning, Data Science',
            bio: 'PhD in Computer Science from UCT. 10+ years in AI research and startup advisory. Passionate about African tech innovation.',
            categories: ['ai', 'technology', 'robotics'], zoomLink: 'https://zoom.us/j/fatima123', availability: 'Mon/Wed 2pm-4pm EAT'
        },
        {
            id: 'u5', fullName: 'Prof. Samuel Kiprotich', email: 'sam.kiprotich@example.com',
            role: 'mentor', status: 'approved', joinDate: '2025-02-05',
            institution: 'Strathmore University', expertise: 'AgriTech, Sustainable Farming, Rural Innovation',
            bio: 'Professor of Agricultural Sciences. Founder of 3 successful agritech startups. Believes tech should serve the farmer first.',
            categories: ['agriculture', 'environment', 'social'], zoomLink: 'https://zoom.us/j/sam456', availability: 'Tue/Thu 10am-12pm EAT'
        },
        {
            id: 'u6', fullName: 'Ms. Ngozi Adeyemi', email: 'ngozi@example.com',
            role: 'mentor', status: 'pending', joinDate: '2025-03-02',
            institution: 'Lagos Business School', expertise: 'Business Development, Marketing, Social Enterprise',
            bio: 'Serial entrepreneur with 3 successful exits. MBA from LBS. Specializes in helping innovators turn ideas into scalable businesses.',
            categories: ['business', 'social', 'education'], zoomLink: '', availability: 'Fridays 9am-12pm EAT'
        },
        {
            id: 'u7', fullName: 'Eng. Hassan Mwangi', email: 'hassan.eng@example.com',
            role: 'mentor', status: 'rejected', rejectionReason: 'Incomplete profile — please update your bio and availability.',
            joinDate: '2025-02-28',
            institution: 'KRA', expertise: 'Civil Engineering, Infrastructure',
            bio: 'Structural engineer with 15 years experience.',
            categories: ['engineering'], zoomLink: '', availability: ''
        },
        {
            id: 'u8', fullName: 'Zawadi Omondi', email: 'zawadi@student.usiu.ac.ke',
            role: 'innovator', status: 'approved', joinDate: '2025-03-03',
            institution: 'USIU Africa', skills: ['Healthcare Tech', 'Biology'], interests: ['healthcare', 'social']
        },
    ],

    projects: [
        {
            id: 'p1', title: 'AquaSense — Smart Water Monitor', innovatorId: 'u2',
            categories: ['technology', 'agriculture', 'environment'],
            problemStatement: 'Rural communities lack affordable real-time water quality monitoring.',
            objectives: 'Deploy low-cost IoT sensors that send SMS alerts when water quality drops.',
            proposedSolution: 'Solar-powered ESP32 sensor nodes with GSM connectivity and a web dashboard.',
            expectedImpact: 'Protect 10,000+ people from waterborne diseases in 3 counties.',
            status: 'approved', submittedAt: '2025-02-20',
            files: [{ name: 'aquasense_proposal.pdf', size: '2.1 MB', type: 'application/pdf' }]
        },
        {
            id: 'p2', title: 'EduTrack — Student Attendance AI', innovatorId: 'u3',
            categories: ['education', 'ai', 'technology'],
            problemStatement: 'Manual attendance tracking is error-prone and teacher time is wasted.',
            objectives: 'Build a face-recognition attendance system for secondary schools.',
            proposedSolution: 'Python-based facial recognition with a React dashboard for teachers.',
            expectedImpact: 'Save 30 minutes per class daily, increase data accuracy to 99%.',
            status: 'pending', submittedAt: '2025-03-01', files: []
        },
        {
            id: 'p3', title: 'HandiHealth — Accessible Clinic App', innovatorId: 'u8',
            categories: ['healthcare', 'social', 'technology'],
            problemStatement: 'People with disabilities cannot access remote health consultations easily.',
            objectives: 'Build a fully accessible telemedicine app with voice navigation.',
            proposedSolution: 'React Native app with ARIA support, voice commands, and sign-language video call.',
            expectedImpact: 'Enable healthcare access for 500,000+ people with disabilities in East Africa.',
            status: 'pending', submittedAt: '2025-03-03', files: [
                { name: 'handihealth_wireframes.pdf', size: '4.5 MB', type: 'application/pdf' },
                { name: 'market_research.docx', size: '1.2 MB', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
            ]
        },
    ],

    mentorshipRequests: [
        {
            id: 'mr1', innovatorId: 'u2', mentorId: 'u4',
            projectId: 'p1', message: 'I would love your guidance on the AI components of my IoT project.',
            status: 'accepted', requestedAt: '2025-02-22', respondedAt: '2025-02-24',
            scheduledMeeting: { date: '2025-03-10', time: '14:00 EAT', zoomLink: 'https://zoom.us/j/fatima123' }
        },
        {
            id: 'mr2', innovatorId: 'u3', mentorId: 'u4',
            projectId: 'p2', message: 'Seeking advice on the machine learning model selection for our attendance system.',
            status: 'pending', requestedAt: '2025-03-02', respondedAt: null, scheduledMeeting: null
        },
        {
            id: 'mr3', innovatorId: 'u8', mentorId: 'u5',
            projectId: 'p3', message: 'Looking for mentorship on the social impact and go-to-market strategy.',
            status: 'rejected', rejectionReason: 'Your project aligns more with urban tech mentors. I recommend reaching out to Dr. Fatima.',
            requestedAt: '2025-03-04', respondedAt: '2025-03-04', scheduledMeeting: null
        },
    ],

    mentorshipRequests: [
        {
            id: 'mr1', innovatorId: 'u2', mentorId: 'u4',
            projectId: 'p1', message: 'I would love your guidance on the AI components of my IoT project.',
            status: 'accepted', requestedAt: '2025-02-22', respondedAt: '2025-02-24',
            scheduledMeeting: { date: '2025-03-10', time: '14:00 EAT', zoomLink: 'https://zoom.us/j/fatima123' }
        },
        {
            id: 'mr2', innovatorId: 'u3', mentorId: 'u4',
            projectId: 'p2', message: 'Seeking advice on the machine learning model selection for our attendance system.',
            status: 'pending', requestedAt: '2025-03-02', respondedAt: null, scheduledMeeting: null
        },
        {
            id: 'mr3', innovatorId: 'u8', mentorId: 'u5',
            projectId: 'p3', message: 'Looking for mentorship on the social impact and go-to-market strategy.',
            status: 'rejected', rejectionReason: 'Your project aligns more with urban tech mentors. I recommend reaching out to Dr. Fatima.',
            requestedAt: '2025-03-04', respondedAt: '2025-03-04', scheduledMeeting: null
        },
    ],

    notifications: {
        u2: [
            { id: 'n1', text: 'Dr. Fatima Al-Rashid accepted your mentorship request!', time: '2h ago', read: false, icon: 'fa-check-circle', color: 'success' },
            { id: 'n2', text: 'Your project AquaSense is now approved.', time: '1d ago', read: true, icon: 'fa-project-diagram', color: 'primary' },
        ],
        u3: [
            { id: 'n3', text: 'Your mentorship request to Dr. Fatima is pending review.', time: '1d ago', read: false, icon: 'fa-clock', color: 'warning' },
        ],
        u4: [
            { id: 'n4', text: 'New mentorship request from Jabari Ndungu.', time: '1d ago', read: false, icon: 'fa-user-plus', color: 'info' },
        ]
    }
};

// Add Profile completeness to existing mentors
MOCK_STORE.users.filter(u => u.role === 'mentor').forEach(m => {
    m.isProfileComplete = (m.status === 'approved'); // Existing approved mentors are complete
    m.isAccessRestricted = false;
});

// Add newly registered mentor (requested by user)
MOCK_STORE.users.push({
    id: 'u9', fullName: 'Dr. Marcus Holloway', email: 'marcus.h@example.com',
    role: 'mentor', status: 'pending', joinDate: '2025-03-04',
    institution: 'USIU Global Research', expertise: 'FinTech, Blockchain, Cybersecurity',
    bio: '', categories: ['technology', 'business'], zoomLink: '', availability: '',
    isProfileComplete: false, isAccessRestricted: false
});

// ============================================================
//  HELPER / QUERY FUNCTIONS
// ============================================================

const MockService = {
    // ── Users ────────────────────────────────────────────────
    getAllUsers: () => [...MOCK_STORE.users],
    getUserById: (id) => MOCK_STORE.users.find(u => u.id === id) || null,
    getUsersByRole: (role) => MOCK_STORE.users.filter(u => u.role === role),
    getPendingMentors: () => MOCK_STORE.users.filter(u => u.role === 'mentor' && u.status === 'pending'),
    
    // Updated: Only return approved AND complete profiles for discovery
    getApprovedMentors: () => MOCK_STORE.users.filter(u => 
        u.role === 'mentor' && 
        u.status === 'approved' && 
        u.isProfileComplete &&
        !u.isAccessRestricted
    ),

    getMentorsByCategory: (category) => MockService.getApprovedMentors().filter(u =>
        u.categories && u.categories.includes(category)
    ),

    searchMentors: (query, categories = []) => {
        const q = query.toLowerCase();
        let results = MockService.getApprovedMentors();
        if (q) {
            results = results.filter(u =>
                u.fullName.toLowerCase().includes(q) ||
                (u.expertise || '').toLowerCase().includes(q) ||
                (u.institution || '').toLowerCase().includes(q)
            );
        }
        if (categories.length > 0) {
            results = results.filter(u =>
                u.categories && categories.some(c => u.categories.includes(c))
            );
        }
        return results;
    },

    // ── User Status & Admin Actions ──────────────────────────────────
    updateUserStatus: (userId, status, reason = '') => {
        const u = MOCK_STORE.users.find(u => u.id === userId);
        if (!u) return false;
        u.status = status;
        if (status === 'rejected' && reason) u.rejectionReason = reason;
        return true;
    },

    toggleUserAccess: (userId) => {
        const u = MOCK_STORE.users.find(u => u.id === userId);
        if (!u) return false;
        u.isAccessRestricted = !u.isAccessRestricted;
        return { success: true, restricted: u.isAccessRestricted };
    },

    deleteUser: (userId) => {
        const index = MOCK_STORE.users.findIndex(u => u.id === userId);
        if (index === -1) return false;
        MOCK_STORE.users.splice(index, 1);
        return true;
    },

    updateMentorProfile: (userId, data) => {
        const u = MOCK_STORE.users.find(u => u.id === userId && u.role === 'mentor');
        if (!u) return false;
        Object.assign(u, data);
        // Check if now complete
        if (u.bio && u.expertise && u.availability && u.zoomLink) {
            u.isProfileComplete = true;
        }
        return true;
    },

    // ── Projects ─────────────────────────────────────────────
    getAllProjects: () => [...MOCK_STORE.projects],
    getProjectById: (id) => MOCK_STORE.projects.find(p => p.id === id) || null,
    getProjectsByInnovator: (innovatorId) => MOCK_STORE.projects.filter(p => p.innovatorId === innovatorId),
    getPendingProjects: () => MOCK_STORE.projects.filter(p => p.status === 'pending'),
    updateProjectStatus: (projectId, status) => {
        const p = MOCK_STORE.projects.find(p => p.id === projectId);
        if (!p) return false;
        p.status = status;
        return true;
    },

    // ── Mentorship Requests & Relationships ──────────────────
    getAllRequests: () => [...MOCK_STORE.mentorshipRequests],
    getRequestsByMentor: (mentorId) => MOCK_STORE.mentorshipRequests.filter(r => r.mentorId === mentorId),
    getRequestsByInnovator: (innovatorId) => MOCK_STORE.mentorshipRequests.filter(r => r.innovatorId === innovatorId),
    getPendingRequestsForMentor: (mentorId) => MOCK_STORE.mentorshipRequests.filter(r => r.mentorId === mentorId && r.status === 'pending'),

    revokeMentorship: (requestId, reason = '') => {
        const r = MOCK_STORE.mentorshipRequests.find(r => r.id === requestId);
        if (!r) return false;
        r.status = 'revoked';
        r.revocationReason = reason;
        r.revokedAt = new Date().toISOString();
        return true;
    },

    sendMentorshipRequest: (innovatorId, mentorId, projectId, message) => {
        const existing = MOCK_STORE.mentorshipRequests.find(r =>
            r.innovatorId === innovatorId && r.mentorId === mentorId && (r.status === 'pending' || r.status === 'accepted')
        );
        if (existing) return { success: false, message: 'Relationship already exists or is pending.' };
        const newReq = {
            id: 'mr' + Date.now(), innovatorId, mentorId, projectId, message,
            status: 'pending', requestedAt: new Date().toISOString(), respondedAt: null, scheduledMeeting: null
        };
        MOCK_STORE.mentorshipRequests.push(newReq);
        return { success: true, message: 'Mentorship request sent successfully!', request: newReq };
    },

    respondToRequest: (requestId, status, reason = '') => {
        const r = MOCK_STORE.mentorshipRequests.find(r => r.id === requestId);
        if (!r) return false;
        r.status = status;
        r.respondedAt = new Date().toISOString();
        if (status === 'rejected' && reason) r.rejectionReason = reason;
        return true;
    },

    scheduleMeeting: (requestId, meetingData) => {
        const r = MOCK_STORE.mentorshipRequests.find(r => r.id === requestId);
        if (!r) return false;
        r.scheduledMeeting = meetingData;
        return true;
    },

    // ── Nuru Mentor Suggestions ──────────────────────────────
    suggestMentorsForCategories: (categories = []) => {
        const candidates = MockService.getApprovedMentors();
        if (!categories || categories.length === 0) return candidates.slice(0, 3);
        const scored = candidates.map(m => {
            const overlap = (m.categories || []).filter(c => categories.includes(c)).length;
            return { mentor: m, score: overlap };
        });
        return scored.filter(s => s.score > 0)
                     .sort((a, b) => b.score - a.score)
                     .map(s => s.mentor)
                     .slice(0, 3);
    },

    // ── Notifications ────────────────────────────────────────
    getNotifications: (userId) => MOCK_STORE.notifications[userId] || [],

    // ── Admin Stats ──────────────────────────────────────────
    getAdminStats: () => ({
        totalUsers: MOCK_STORE.users.filter(u => u.role !== 'admin').length,
        totalInnovators: MOCK_STORE.users.filter(u => u.role === 'innovator').length,
        totalMentors: MOCK_STORE.users.filter(u => u.role === 'mentor').length,
        pendingMentors: MOCK_STORE.users.filter(u => u.role === 'mentor' && u.status === 'pending').length,
        pendingProjects: MOCK_STORE.projects.filter(p => p.status === 'pending').length,
        totalProjects: MOCK_STORE.projects.length,
        activeMentorships: MOCK_STORE.mentorshipRequests.filter(r => r.status === 'accepted').length,
    }),

    // ── Simulate current logged-in user ───
    getCurrentUser: () => {
        try {
            const stored = JSON.parse(localStorage.getItem('innovateHubUser'));
            if (stored && stored.id) {
                return MOCK_STORE.users.find(u => u.id === stored.id) || stored;
            }
        } catch (e) {}
        return null;
    },
};

// Expose globally
window.MockService = MockService;

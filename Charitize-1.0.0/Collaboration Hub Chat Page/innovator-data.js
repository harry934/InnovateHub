// Innovator View - Mock Data and Initialization

const innovatorProjects = [
    {
        id: '1',
        name: 'AI-Powered Learning Platform',
        mentorName: 'Dr. Michael Johnson',
        status: 'Active',
        lastActivity: '5 min ago',
        isActive: true
    },
    {
        id: '2',
        name: 'Sustainable Energy Dashboard',
        mentorName: 'Dr. Michael Johnson',
        status: 'Feedback Pending',
        lastActivity: '2 hours ago',
        isActive: false
    },
    {
        id: '3',
        name: 'Healthcare Analytics Tool',
        mentorName: 'Dr. Michael Johnson',
        status: 'Revision Submitted',
        lastActivity: '1 day ago',
        isActive: false
    }
];

const innovatorMessages = [
    {
        id: '1',
        sender: 'mentor',
        senderName: 'Dr. Michael Johnson',
        content: "Hi Sarah! I've reviewed your latest prototype. The user interface is looking great!",
        timestamp: '10:30 AM'
    },
    {
        id: '2',
        sender: 'innovator',
        senderName: 'Sarah Chen',
        content: 'Thank you! I implemented the changes you suggested regarding the navigation flow.',
        timestamp: '10:32 AM'
    },
    {
        id: '3',
        sender: 'mentor',
        senderName: 'Dr. Michael Johnson',
        content: 'Excellent work. I have some feedback on the technical implementation. Please check the feedback section.',
        timestamp: '10:35 AM'
    },
    {
        id: '4',
        sender: 'innovator',
        senderName: 'Sarah Chen',
        content: "I've uploaded the revised architecture documentation based on your recommendations.",
        timestamp: '11:15 AM',
        attachments: [
            { name: 'architecture-v2.pdf', type: 'PDF' }
        ]
    }
];

const innovatorFeedback = [
    {
        id: '1',
        category: 'Project Concept',
        content: 'The core idea of personalized AI-driven learning paths is strong and addresses a real market need. Consider expanding on how you differentiate from existing platforms.',
        rating: 'positive',
        timestamp: 'March 16, 2026 at 9:30 AM'
    },
    {
        id: '2',
        category: 'Technical Implementation',
        content: 'The current architecture is solid, but I recommend implementing a microservices approach for better scalability. Also, consider adding caching layers for the recommendation engine.',
        rating: 'needs-work',
        timestamp: 'March 16, 2026 at 9:45 AM'
    },
    {
        id: '3',
        category: 'Market Viability',
        content: 'Your target market analysis is comprehensive. I suggest focusing on the K-12 segment initially before expanding to enterprise training.',
        rating: 'suggestion',
        timestamp: 'March 16, 2026 at 10:00 AM'
    }
];

const innovatorReports = [
    {
        id: '1',
        title: 'Week 3 Progress Report',
        content: 'Completed user authentication module and integrated the AI recommendation system. Currently working on the dashboard analytics.',
        attachments: [{ name: 'progress-report-week3.pdf' }],
        timestamp: 'March 15, 2026 at 4:30 PM',
        status: 'reviewed'
    },
    {
        id: '2',
        title: 'Architecture Revision',
        content: 'Updated the system architecture based on your feedback. Implemented microservices for the core modules and added Redis caching.',
        attachments: [
            { name: 'architecture-v2.pdf' },
            { name: 'api-documentation.pdf' }
        ],
        timestamp: 'March 16, 2026 at 11:15 AM',
        status: 'submitted'
    }
];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load projects
    const projectList = document.getElementById('projectList');
    if (projectList) {
        innovatorProjects.forEach(project => {
            projectList.appendChild(window.CollaborationHub.createProjectCard(project));
        });
    }

    // Load messages
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        innovatorMessages.forEach(message => {
            chatMessages.appendChild(window.CollaborationHub.createMessage(message));
        });
        window.CollaborationHub.scrollToBottom();
    }

    // Load feedback
    const feedbackList = document.getElementById('feedbackList');
    if (feedbackList) {
        innovatorFeedback.forEach(feedback => {
            feedbackList.appendChild(window.CollaborationHub.createFeedbackCard(feedback));
        });
    }

    // Load reports
    const reportsList = document.getElementById('reportsList');
    if (reportsList) {
        innovatorReports.forEach(report => {
            reportsList.appendChild(window.CollaborationHub.createReportCard(report));
        });
    }
});

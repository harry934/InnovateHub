// Mentor View - Mock Data and Initialization

const mentorProjects = [
    {
        id: '1',
        name: 'AI-Powered Learning Platform',
        innovatorName: 'Sarah Chen',
        status: 'Active',
        lastActivity: '5 min ago',
        isActive: true
    },
    {
        id: '2',
        name: 'Sustainable Energy Dashboard',
        innovatorName: 'James Rodriguez',
        status: 'Feedback Pending',
        lastActivity: '2 hours ago',
        isActive: false
    },
    {
        id: '3',
        name: 'Healthcare Analytics Tool',
        innovatorName: 'Maya Patel',
        status: 'Revision Submitted',
        lastActivity: '1 day ago',
        isActive: false
    }
];

const mentorMessages = [
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
    },
    {
        id: '5',
        sender: 'mentor',
        senderName: 'Dr. Michael Johnson',
        content: "Perfect! This addresses all my concerns. Let's schedule a call to discuss market strategy.",
        timestamp: '11:45 AM'
    }
];

const mentorFeedback = [
    {
        id: '1',
        category: 'Project Concept',
        content: 'The core idea of personalized AI-driven learning paths is strong and addresses a real market need.',
        rating: 'positive',
        timestamp: 'March 16, 2026 at 9:30 AM'
    },
    {
        id: '2',
        category: 'Technical Implementation',
        content: 'Consider implementing a microservices approach for better scalability. Also, add caching layers for the recommendation engine.',
        rating: 'needs-work',
        timestamp: 'March 16, 2026 at 9:45 AM'
    }
];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load projects
    const projectList = document.getElementById('projectList');
    if (projectList) {
        mentorProjects.forEach(project => {
            projectList.appendChild(window.CollaborationHub.createProjectCard(project));
        });
    }

    // Load messages
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        mentorMessages.forEach(message => {
            chatMessages.appendChild(window.CollaborationHub.createMessage(message));
        });
        window.CollaborationHub.scrollToBottom();
    }

    // Load feedback
    const feedbackList = document.getElementById('feedbackList');
    if (feedbackList) {
        mentorFeedback.forEach(feedback => {
            feedbackList.appendChild(window.CollaborationHub.createFeedbackCard(feedback));
        });
    }
});

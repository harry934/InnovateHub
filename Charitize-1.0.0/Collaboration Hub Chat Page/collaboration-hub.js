// Collaboration Hub Main JavaScript

// Mobile Menu Toggles
document.addEventListener('DOMContentLoaded', function() {
    const leftMenuToggle = document.getElementById('leftMenuToggle');
    const rightMenuToggle = document.getElementById('rightMenuToggle');
    const leftSidebar = document.getElementById('leftSidebar');
    const rightSidebar = document.getElementById('rightSidebar');
    const overlay = document.getElementById('overlay');

    // Toggle left sidebar
    if (leftMenuToggle) {
        leftMenuToggle.addEventListener('click', function() {
            leftSidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }

    // Toggle right sidebar
    if (rightMenuToggle) {
        rightMenuToggle.addEventListener('click', function() {
            rightSidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }

    // Close sidebars when overlay is clicked
    if (overlay) {
        overlay.addEventListener('click', function() {
            leftSidebar.classList.remove('active');
            rightSidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            const tabList = this.closest('.tab-list');
            const tabsContainer = this.closest('.tabs');
            
            // Remove active class from all tabs and buttons in this container
            tabList.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            tabsContainer.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(tabName);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Message sending
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (sendBtn && messageInput) {
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            console.log('Sending message:', message);
            // Add your message sending logic here
            messageInput.value = '';
        }
    }
});

// Utility function to create project cards
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = `project-card ${project.isActive ? 'active' : ''}`;
    card.setAttribute('data-project-id', project.id);
    
    card.innerHTML = `
        <h3>${project.name}</h3>
        <p class="innovator-name">${project.innovatorName || project.mentorName || 'N/A'}</p>
        <div class="project-meta">
            <span class="badge badge-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
            <span class="project-time">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${project.lastActivity}
            </span>
        </div>
    `;
    
    card.addEventListener('click', function() {
        selectProject(project);
    });
    
    return card;
}

// Utility function to create message elements
function createMessage(message) {
    const container = document.createElement('div');
    container.className = `message-container ${message.sender === 'innovator' ? 'innovator-message' : 'mentor-message'}`;
    
    const avatarClass = message.sender === 'mentor' ? 'mentor-avatar' : 'innovator-avatar';
    const initials = message.senderName.split(' ').map(n => n[0]).join('');
    
    let attachmentsHTML = '';
    if (message.attachments && message.attachments.length > 0) {
        attachmentsHTML = `
            <div class="message-attachments">
                ${message.attachments.map(att => `
                    <div class="attachment-item">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                        <span>${att.name}</span>
                        ${att.type ? `<span style="color: #9ca3af;">(${att.type})</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="message-avatar ${avatarClass}">${initials}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-sender">${message.senderName}</span>
                <span class="message-time">${message.timestamp}</span>
            </div>
            <div class="message-bubble">
                <p class="message-text">${message.content}</p>
                ${attachmentsHTML}
            </div>
        </div>
    `;
    
    return container;
}

// Utility function to create feedback cards
function createFeedbackCard(feedback) {
    const card = document.createElement('div');
    card.className = 'feedback-card';
    
    const ratingText = {
        'positive': 'Strong',
        'needs-work': 'Needs Work',
        'suggestion': 'Suggestion'
    };
    
    const ratingClass = {
        'positive': 'badge-positive',
        'needs-work': 'badge-needs-work',
        'suggestion': 'badge-suggestion'
    };
    
    card.innerHTML = `
        <div class="feedback-header">
            <div class="feedback-category">
                <div class="category-icon">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m15 14 5-5-5-5"></path>
                        <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"></path>
                    </svg>
                </div>
                <span class="category-name">${feedback.category}</span>
            </div>
            ${feedback.rating ? `<span class="badge ${ratingClass[feedback.rating]}">${ratingText[feedback.rating]}</span>` : ''}
        </div>
        <p class="feedback-text">${feedback.content}</p>
        <p class="feedback-time">${feedback.timestamp}</p>
    `;
    
    return card;
}

// Utility function to create report cards
function createReportCard(report) {
    const card = document.createElement('div');
    card.className = 'report-card';
    
    const statusClass = report.status === 'reviewed' ? 'badge-positive' : 'badge-submitted';
    const statusText = report.status === 'reviewed' ? 'Reviewed' : 'Submitted';
    
    let attachmentsHTML = '';
    if (report.attachments && report.attachments.length > 0) {
        attachmentsHTML = `
            <div class="report-attachments">
                ${report.attachments.map(att => `
                    <div class="report-attachment">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                        <span>${att.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="report-header">
            <div class="report-category">
                <div class="report-icon">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                </div>
                <span class="report-title">${report.title}</span>
            </div>
            <span class="badge ${statusClass}">${statusText}</span>
        </div>
        <p class="report-text">${report.content}</p>
        ${attachmentsHTML}
        <p class="report-time">${report.timestamp}</p>
    `;
    
    return card;
}

// Function to select a project
function selectProject(project) {
    // Update active state in project list
    document.querySelectorAll('.project-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`[data-project-id="${project.id}"]`)?.classList.add('active');
    
    // Update header
    const projectNameEl = document.getElementById('currentProjectName');
    if (projectNameEl) {
        projectNameEl.textContent = project.name;
    }
    
    const innovatorEl = document.getElementById('currentInnovator');
    if (innovatorEl) {
        innovatorEl.textContent = `Mentoring: ${project.innovatorName}`;
    }
    
    const mentorEl = document.getElementById('currentMentor');
    if (mentorEl) {
        mentorEl.textContent = `Mentor: ${project.mentorName || 'Dr. Michael Johnson'}`;
    }
    
    // Close mobile sidebar
    document.getElementById('leftSidebar')?.classList.remove('active');
    document.getElementById('overlay')?.classList.remove('active');
    
    // Load project-specific data
    // Add your logic here to load messages, feedback, reports for this project
}

// Scroll to bottom of messages
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Export functions for use in data files
window.CollaborationHub = {
    createProjectCard,
    createMessage,
    createFeedbackCard,
    createReportCard,
    selectProject,
    scrollToBottom
};

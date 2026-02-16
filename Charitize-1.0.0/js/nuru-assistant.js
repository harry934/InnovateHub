/**
 * Nuru Assistant - Intelligent Chat Widget Logic
 * Features: Auto-greeting, Knowledge-based responses, UI interactions.
 */

// Knowledge base for Nuru
const NURU_KNOWLEDGE = {
    greetings: ["Hello! I'm Nuru, your Innovate Hub guide. How can I help you today?", "Jambo! I'm here to assist you with everything on Innovate Hub.", "Hi there! Looking to innovate? I'm Nuru, let's get started!"],
    fallback: "I'm not quite sure about that, but I'd love to help! You can try asking about 'How to join', 'Mentorship', or 'Project submission'.",
    triggers: [
        {
            keywords: ['join', 'signup', 'register', 'account'],
            response: "Joining is easy! Just click 'Get Started' at the top right. You can join as an 'Innovator' (for students with ideas) or a 'Mentor' (for professionals)."
        },
        {
            keywords: ['mentor', 'mentorship'],
            response: "Our mentors are industry experts who guide student projects. If you're an expert, sign up as a Mentor. If you're a student, you'll be assigned a mentor once your project is approved!"
        },
        {
            keywords: ['project', 'submit', 'idea'],
            response: "Innovators can submit projects through their dashboard. Just sign up, go to 'My Projects', and fill out the submission form!"
        },
        {
            keywords: ['cost', 'price', 'free'],
            response: "Innovate Hub is completely free for students! Our goal is to support your innovation journey without barriers."
        },
        {
            keywords: ['contact', 'email', 'support', 'help'],
            response: "You're chatting with me! But if you need more help, you can email us at InnovateHub@gmail.com or visit our 'Contact Us' page."
        }
    ]
};

class NuruAssistant {
    constructor() {
        this.isOpen = false;
        this.chatHistory = JSON.parse(localStorage.getItem('nuru_history')) || [];
        this.initUI();
        this.addEventListeners();
        
        // Auto-greet if no history
        if (this.chatHistory.length === 0) {
            setTimeout(() => this.greet(), 2000);
        } else {
            this.renderHistory();
        }
    }

    initUI() {
        // Create widget HTML and append to body
        const widgetHTML = `
            <button class="nuru-assistant-toggle" id="nuruToggle">
                <i class="fa fa-comment-dots"></i>
            </button>
            <div class="nuru-chat-window" id="nuruWindow">
                <div class="nuru-chat-header">
                    <div class="nuru-avatar">
                        <i class="fa fa-robot"></i>
                    </div>
                    <div class="nuru-info">
                        <h5>Nuru Assistant</h5>
                        <div class="nuru-status">Online • Ready to help</div>
                    </div>
                    <button class="nuru-close" id="nuruClose">&times;</button>
                </div>
                <div class="nuru-messages" id="nuruMessages"></div>
                <div class="nuru-input-area">
                    <input type="text" id="nuruInput" placeholder="Ask me something...">
                    <button class="nuru-send-btn" id="nuruSend">
                        <i class="fa fa-paper-plane"></i>
                    </button>
                </div>
                <div id="recaptcha-container"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        this.toggleBtn = document.getElementById('nuruToggle');
        this.chatWindow = document.getElementById('nuruWindow');
        this.closeBtn = document.getElementById('nuruClose');
        this.messagesContainer = document.getElementById('nuruMessages');
        this.inputField = document.getElementById('nuruInput');
        this.sendBtn = document.getElementById('nuruSend');
    }

    addEventListeners() {
        this.toggleBtn.onclick = () => this.toggleChat();
        this.closeBtn.onclick = () => this.toggleChat();
        this.sendBtn.onclick = () => this.handleSendMessage();
        this.inputField.onkeypress = (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        };
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.chatWindow.classList.toggle('active', this.isOpen);
        if (this.isOpen) {
            this.inputField.focus();
            this.scrollToBottom();
        }
    }

    greet() {
        const randomGreeting = NURU_KNOWLEDGE.greetings[Math.floor(Math.random() * NURU_KNOWLEDGE.greetings.length)];
        this.addMessage(randomGreeting, 'bot');
    }

    handleSendMessage() {
        const text = this.inputField.value.trim();
        if (!text) return;

        this.addMessage(text, 'user');
        this.inputField.value = '';
        
        // Show typing indicator
        this.showTyping();

        setTimeout(() => {
            this.removeTyping();
            const response = this.getResponse(text);
            this.addMessage(response, 'bot');
        }, 1500);
    }

    getResponse(text) {
        const query = text.toLowerCase();
        for (const trigger of NURU_KNOWLEDGE.triggers) {
            if (trigger.keywords.some(k => query.includes(k))) {
                return trigger.response;
            }
        }
        return NURU_KNOWLEDGE.fallback;
    }

    addMessage(text, sender) {
        const msg = { text, sender, time: new Date().toISOString() };
        this.chatHistory.push(msg);
        this.saveHistory();
        this.renderMsg(msg);
        this.scrollToBottom();
    }

    renderMsg(msg) {
        const div = document.createElement('div');
        div.className = `nuru-msg nuru-msg-${msg.sender}`;
        div.textContent = msg.text;
        this.messagesContainer.appendChild(div);
    }

    renderHistory() {
        this.chatHistory.forEach(msg => this.renderMsg(msg));
        this.scrollToBottom();
    }

    saveHistory() {
        localStorage.setItem('nuru_history', JSON.stringify(this.chatHistory));
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showTyping() {
        const div = document.createElement('div');
        div.id = 'nuruTyping';
        div.className = 'typing-indicator';
        div.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        this.messagesContainer.appendChild(div);
        this.scrollToBottom();
    }

    removeTyping() {
        const el = document.getElementById('nuruTyping');
        if (el) el.remove();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.nuru = new NuruAssistant();
});

/**
 * Nuru Assistant - Intelligent Chat Widget Logic
 * Features: Auto-greeting, Knowledge-based responses, UI interactions.
 */

// Knowledge base for Nuru
const NURU_KNOWLEDGE = {
    greetings: [
        "Jambo! I'm Nuru, your friendly Innovate Hub guide. It's such a pleasure to meet you! How can I make your day better?", 
        "Hello there! I'm Nuru. I'm here to help you navigate our wonderful community. What's on your mind today?", 
        "Welcome to Innovate Hub! I'm Nuru, and I'd be absolutely delighted to assist you with any questions you might have."
    ],
    fallback: "I'm so sorry, but I don't quite have the answer to that specific question yet. 😔 However, I've noted this down and I'll contact the admin to let them know so we can get back to you! Is there anything else I can try to help you with in the meantime?",
    triggers: [
        {
            keywords: ['join', 'signup', 'register', 'account', 'create'],
            response: "We'd love to have you! You can join as an Innovator if you have a brilliant idea, or as a Mentor if you'd like to guide others. Just click the button below to start your journey!",
            links: [{ label: "🚀 Start Registration", url: "signup.html" }]
        },
        {
            keywords: ['mentor', 'mentorship'],
            response: "Our mentorship program is the heart of Innovate Hub! Experts can apply to guide projects, while students get paired with industry leaders. Would you like to see more details?",
            links: [{ label: "🤝 Join as Mentor", url: "signup.html" }]
        },
        {
            keywords: ['project', 'submit', 'idea'],
            response: "Ready to share your innovation with the world? Once you're signed up as an Innovator, you can submit your project directly from your dashboard!",
            links: [{ label: "💡 Submit Project", url: "innovator-dashboard.html" }]
        },
        {
            keywords: ['cost', 'price', 'free'],
            response: "Good news! Innovate Hub is completely free for all students. We are here to support your growth and innovation without any financial barriers. 🌟"
        },
        {
            keywords: ['contact', 'email', 'support', 'help'],
            response: "You're chatting with me right now, and I'm happy to help! But if you'd like to reach our physical office or see our location, click below.",
            links: [{ label: "📍 Contact Info", url: "contact.html" }]
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
                <img src="img/nuru-avatar.svg" alt="Nuru Avatar">
            </button>
            <div class="nuru-chat-window" id="nuruWindow">
                <div class="nuru-chat-header">
                    <div class="nuru-avatar">
                        <img src="img/nuru-avatar.svg" alt="Nuru Avatar">
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
            const result = this.getResponse(text);
            this.addMessage(result.response, 'bot', result.links);
        }, 1500);
    }

    getResponse(text) {
        const query = text.toLowerCase();
        for (const trigger of NURU_KNOWLEDGE.triggers) {
            if (trigger.keywords.some(k => query.includes(k))) {
                return { response: trigger.response, links: trigger.links };
            }
        }
        return { response: NURU_KNOWLEDGE.fallback };
    }

    addMessage(text, sender, links = []) {
        const msg = { text, sender, links, time: new Date().toISOString() };
        this.chatHistory.push(msg);
        this.saveHistory();
        this.renderMsg(msg);
        this.scrollToBottom();
    }

    renderMsg(msg) {
        const msgWrapper = document.createElement('div');
        msgWrapper.className = `nuru-msg-wrapper nuru-msg-${msg.sender}`;

        if (msg.sender === 'bot') {
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'nuru-msg-avatar';
            avatarDiv.innerHTML = '<img src="img/nuru-avatar.svg" alt="Nuru">';
            msgWrapper.appendChild(avatarDiv);
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'nuru-msg-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'nuru-msg-text';
        textDiv.textContent = msg.text;
        contentDiv.appendChild(textDiv);

        if (msg.links && msg.links.length > 0) {
            const btnGroup = document.createElement('div');
            btnGroup.className = 'nuru-btn-group';
            
            msg.links.forEach(link => {
                const btn = document.createElement('a');
                btn.className = 'nuru-action-btn';
                btn.href = link.url;
                btn.textContent = link.label;
                btnGroup.appendChild(btn);
            });
            contentDiv.appendChild(btnGroup);
        }

        msgWrapper.appendChild(contentDiv);
        this.messagesContainer.appendChild(msgWrapper);
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

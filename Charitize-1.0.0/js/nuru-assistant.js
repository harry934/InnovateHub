/**
 * Nuru Assistant - Intelligent Chat Widget Logic
 * Features: Auto-greeting, Knowledge-based responses, UI interactions.
 */

// Knowledge base for Nuru
const NURU_KNOWLEDGE = {
    greetings: [
        "Jambo! I'm Nuru, your Innovate Hub guide. How can I help you today?", 
        "Hello! I'm Nuru. I'm here to answer your questions and help you navigate our community.", 
        "Welcome to Innovate Hub! I'm Nuru, and I'd be delighted to assist you."
    ],
    fallback: "I'm sorry, I don't have a specific answer for that yet. However, I've noted your question and will notify the admin. Is there anything else I can assist you with?",
    triggers: [
        {
            keywords: ['join', 'signup', 'register', 'account', 'create'],
            response: "We'd love to have you. You can join as an Innovator to share ideas, or as a Mentor to guide others. Click the button below to start.",
            links: [{ label: "Start Registration", url: "signup.html" }]
        },
        {
            keywords: ['mentor', 'mentorship'],
            response: "Our mentorship program connects students with industry experts. Would you like to see the details?",
            links: [{ label: "Join as Mentor", url: "signup.html" }]
        },
        {
            keywords: ['project', 'submit', 'idea'],
            response: "Ready to share your innovation? Once you're signed up as an Innovator, you can submit projects from your dashboard.",
            links: [{ label: "Submit Project", url: "innovator-dashboard.html" }]
        },
        {
            keywords: ['cost', 'price', 'free'],
            response: "Innovate Hub is completely free for all students. We're here to support your growth without financial barriers. ✨"
        },
        {
            keywords: ['contact', 'email', 'support', 'help'],
            response: "You're chatting with me now and I'm happy to help. If you'd like to see our physical location or contact info, click below.",
            links: [{ label: "Contact Info", url: "contact.html" }]
        }
    ]
};

class NuruAssistant {
    constructor() {
        this.isOpen = false;
        this.isHidden = false;
        this.lastInteraction = Date.now();
        this.chatHistory = JSON.parse(localStorage.getItem('nuru_history')) || [];
        this.initUI();
        this.addEventListeners();
        this.startAnimationEngine();
        
        // Auto-greet if no history
        if (this.chatHistory.length === 0) {
            setTimeout(() => {
                this.playAnimation('wave');
                this.greet();
            }, 2000);
        } else {
            this.renderHistory();
        }
    }

    initUI() {
        const widgetHTML = `
            <button class="nuru-assistant-toggle" id="nuruToggle">
                <span class="nuru-name-tag">Nuru Assistant</span>
                <img src="img/nuru-avatar.svg" alt="Nuru Avatar">
            </button>
            <div class="nuru-chat-window" id="nuruWindow">
                <div class="nuru-chat-header">
                    <div class="nuru-header-avatar">
                        <img src="img/nuru-avatar.svg" alt="Nuru Avatar">
                    </div>
                    <div class="nuru-header-info">
                        <h5>Nuru Assistant</h5>
                        <div class="nuru-header-status">Online • Ready to help</div>
                    </div>
                    <button class="nuru-close" id="nuruClose">&times;</button>
                </div>
                <div class="nuru-messages" id="nuruMessages"></div>
                <div class="nuru-input-area">
                    <div class="nuru-input-container">
                        <input type="text" id="nuruInput" placeholder="Ask me something...">
                    </div>
                    <button class="nuru-send-btn" id="nuruSend">
                        <i class="fa fa-paper-plane"></i>
                    </button>
                </div>
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
            this.lastInteraction = Date.now();
        };
        
        // Peek and show logic
        window.addEventListener('scroll', () => {
            this.lastInteraction = Date.now();
            if (this.isHidden && window.scrollY > 300) {
                this.showAssistant();
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.chatWindow.classList.toggle('active', this.isOpen);
        this.toggleBtn.classList.remove('nuru-peek');
        if (this.isOpen) {
            this.inputField.focus();
            this.scrollToBottom();
            this.playAnimation('attention');
        }
        this.lastInteraction = Date.now();
    }

    hideAssistant() {
        this.isOpen = false;
        this.chatWindow.classList.remove('active');
        this.toggleBtn.classList.add('nuru-hide');
        this.isHidden = true;
        this.lastInteraction = Date.now();
    }

    showAssistant() {
        this.toggleBtn.classList.remove('nuru-hide');
        this.toggleBtn.classList.add('nuru-reappear');
        this.isHidden = false;
        setTimeout(() => this.toggleBtn.classList.remove('nuru-reappear'), 600);
    }

    playAnimation(type) {
        this.toggleBtn.classList.add(`nuru-${type}`);
        setTimeout(() => this.toggleBtn.classList.remove(`nuru-${type}`), 1500);
    }

    startAnimationEngine() {
        setInterval(() => {
            const timeSinceLastAction = Date.now() - this.lastInteraction;
            if (!this.isOpen && !this.isHidden) {
                if (timeSinceLastAction > 20000) {
                    // Enter peek state if inactive
                    this.toggleBtn.classList.add('nuru-peek-corner');
                } else {
                    this.toggleBtn.classList.remove('nuru-peek-corner');
                    const rand = Math.random();
                    if (rand > 0.8) this.playAnimation('attention');
                }
            }
        }, 5000);
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
        this.lastInteraction = Date.now();
        
        this.showTyping();

        setTimeout(() => {
            this.removeTyping();
            const result = this.getResponse(text);
            this.addMessage(result.response, 'bot', result.links);
            this.playAnimation('wave'); // Happy she found an answer
        }, 1500);
    }

    // ... getResponse stays same ...

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
                
                if (link.url === '#') {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        this.inputField.value = link.label.replace('👉 About ', '');
                        this.handleSendMessage();
                    };
                }
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

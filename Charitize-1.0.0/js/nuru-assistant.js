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
                    <div class="nuru-header-actions">
                        <button class="nuru-btn-icon" id="nuruMinimize" title="Minimize">
                            <i class="fa fa-minus"></i>
                        </button>
                        <button class="nuru-btn-icon" id="nuruHide" title="Hide Nuru">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="nuru-messages" id="nuruMessages"></div>
                <div class="nuru-input-area">
                    <input type="text" id="nuruInput" placeholder="Ask me something...">
                    <button class="nuru-send-btn" id="nuruSend">
                        <i class="fa fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        this.toggleBtn = document.getElementById('nuruToggle');
        this.chatWindow = document.getElementById('nuruWindow');
        this.minimizeBtn = document.getElementById('nuruMinimize');
        this.hideBtn = document.getElementById('nuruHide');
        this.messagesContainer = document.getElementById('nuruMessages');
        this.inputField = document.getElementById('nuruInput');
        this.sendBtn = document.getElementById('nuruSend');
    }

    addEventListeners() {
        this.toggleBtn.onclick = () => this.toggleChat();
        this.minimizeBtn.onclick = () => this.toggleChat();
        this.hideBtn.onclick = () => this.hideAssistant();
        this.sendBtn.onclick = () => this.handleSendMessage();
        this.inputField.onkeypress = (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
            this.lastInteraction = Date.now();
        };
        
        // Reappear logic if hidden
        window.addEventListener('scroll', () => {
            if (this.isHidden && window.scrollY > 300) {
                this.showAssistant();
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.chatWindow.classList.toggle('active', this.isOpen);
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
            if (!this.isOpen && !this.isHidden && timeSinceLastAction > 10000) {
                // Random idle animation
                const rand = Math.random();
                if (rand > 0.7) this.playAnimation('attention');
                else if (rand > 0.4) this.playAnimation('wave');
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
        }, 1500);
    }

    getResponse(text) {
        const query = text.toLowerCase().replace(/[^\w\s]/gi, '');
        const words = query.split(' ');
        
        let bestMatch = null;
        let highestScore = 0;
        let suggestions = [];

        for (const trigger of NURU_KNOWLEDGE.triggers) {
            let score = 0;
            trigger.keywords.forEach(keyword => {
                // Exact match
                if (query.includes(keyword)) score += 2;
                // Fuzzy/Partial match
                words.forEach(word => {
                    if (word.length > 3 && (keyword.includes(word) || word.includes(keyword))) {
                        score += 1;
                    }
                });
            });

            if (score > 0) {
                suggestions.push({ trigger, score });
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = trigger;
            }
        }

        // Handle case for website overview (as requested)
        const overviewKeywords = ['website', 'about', 'what', 'do', 'purpose', 'hub'];
        const overviewScore = overviewKeywords.filter(k => query.includes(k)).length;
        
        if (overviewScore >= 2 || query.includes('what is this website about') || query.includes('what do you do')) {
            return {
                response: "Innovate Hub is your launchpad for creativity! We connect brilliant student innovators with experienced mentors to turn ideas into reality. Whether you have a project or want to guide others, you're in the right place! 🚀",
                links: [{ label: "📖 Our Story", url: "about.html" }]
            };
        }

        if (highestScore >= 2) {
            return { response: bestMatch.response, links: bestMatch.links };
        } else if (suggestions.length > 0) {
            // Clarification Logic
            const suggestionLabels = suggestions.slice(0, 2).map(s => s.trigger.keywords[0]);
            return {
                response: `Hmm, I'm not 100% sure, but are you asking about ${suggestionLabels.join(' or ')}?`,
                links: suggestions.slice(0, 2).map(s => ({
                    label: `👉 About ${s.trigger.keywords[0]}`,
                    url: s.trigger.links ? s.trigger.links[0].url : '#'
                }))
            };
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

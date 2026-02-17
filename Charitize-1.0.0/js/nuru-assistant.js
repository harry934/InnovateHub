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
    clarify_prefix: "I'm not entirely sure I caught that, but I can help you with: ",
    fallback_suggest: "I want to make sure I give you the best guidance. Would you like to know about our projects, how to join, or maybe speak with a mentor?",
    out_of_scope: "That’s a great question! For the most accurate and up-to-date information, please submit it through our Contact section so our team can assist you directly.",
    triggers: [
        {
            id: 'about',
            keywords: ['about', 'what', 'website', 'websitge', 'purpose', 'do', 'hub', 'innovate'],
            response: "Innovate Hub is a premier platform for all innovators. We turn ideas into reality by connecting people of all ages with mentors, project partners, and essential resources. We're excited to see what you build!",
            links: [{ label: "Learn More", url: "/about" }]
        },
        {
            id: 'join',
            keywords: ['join', 'signup', 'register', 'account', 'create', 'start', 'regster'],
            response: "We'd love to have you! You can sign up as an Innovator to share your projects, or as a Mentor to guide others. It's a supportive universal community for everyone and we're here to help you get started.",
            links: [{ label: "Start Registration", url: "/signup" }]
        },
        {
            id: 'mentor',
            keywords: ['mentor', 'mentorship', 'guide', 'expert', 'help me'],
            response: "Our mentorship program connects people with industry experts. Mentors provide guidance on project scaling, technical hurdles, and personal growth. That sounds like a great way to start your journey!",
            links: [{ label: "Join as Mentor", url: "/signup" }]
        },
        {
            id: 'project',
            keywords: ['project', 'submit', 'idea', 'innovation', 'share', 'list', 'work on', 'suggest'],
            response: "Looking for inspiration? Based on our community interests, you could work on ideas like: \n• Community Sustainability Tracker\n• Global Peer-to-Peer Learning Hub\n• Innovation Event Platform\nThat sounds like it could be a game-changer!",
            links: [{ label: "Submit Your Project", url: "/innovator-dashboard" }]
        },
        {
            id: 'navigation',
            keywords: ['where', 'pages', 'go', 'contact', 'home', 'services'],
            response: "I can guide you anywhere! You can check our 'About Us' to see our story, or visit 'Contact Us' if you need directions. Let me know if you need help finding anything else.",
            links: [
                { label: "About Us", url: "/about" },
                { label: "Contact Us", url: "/contact" }
            ]
        },
        {
            id: 'cost',
            keywords: ['cost', 'price', 'free', 'pay', 'money'],
            response: "Innovation should be accessible! Innovate Hub is completely free for all community members and mentors. We're here to support your growth without any financial barriers."
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

        // Initial state: hide behind corner
        this.toggleBtn.classList.add('nuru-pos-br', 'nuru-peek-active');
        
        // Start the greeting sequence after a short delay
        setTimeout(() => this.triggerGreetingSequence(), 1000);
    }

    triggerGreetingSequence() {
        const toggle = this.toggleBtn;
        const nameTag = document.querySelector('.nuru-name-tag');
        
        // Step 1: Stationery Greeting
        toggle.classList.remove('nuru-peek-active');
        toggle.classList.add('nuru-say-hi');
        if (nameTag) nameTag.textContent = "Hi I'm Nuru";
        
        setTimeout(() => {
            // Step 2: Hide (Peek)
            toggle.classList.remove('nuru-say-hi');
            if (nameTag) nameTag.textContent = "Nuru Assistant";
            toggle.classList.add('nuru-peek-active');
            
            setTimeout(() => {
                // Step 3: Reveal Smoothly
                toggle.classList.remove('nuru-peek-active');
            }, 3000);
        }, 3000);
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
                if (timeSinceLastAction > 8000) {
                    // Enter peek state if inactive
                    this.toggleBtn.classList.add('nuru-peek-active');
                } else {
                    this.toggleBtn.classList.remove('nuru-peek-active');
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

    getResponse(input) {
        const text = input.toLowerCase().trim();
        
        // Handle specific requested mapping: "what is this websitge about"
        if (text.includes('websitge') || (text.includes('website') && text.includes('about'))) {
            return NURU_KNOWLEDGE.triggers.find(t => t.id === 'about');
        }

        // Fuzzy Scoring System
        let scores = NURU_KNOWLEDGE.triggers.map(trigger => {
            let score = 0;
            trigger.keywords.forEach(keyword => {
                // Direct include
                if (text.includes(keyword)) score += 2;
                // Partial word match (slang/typos)
                else if (keyword.length > 3 && text.split(' ').some(word => word.includes(keyword.substring(0, 4)))) score += 1;
            });
            return { trigger, score };
        });

        // Filter and sort by score
        const matches = scores.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

        if (matches.length > 0 && matches[0].score >= 2) {
            return matches[0].trigger;
        }

        // Proactive Suggestion Logic (No "I don't understand")
        if (matches.length > 0) {
            const suggestions = matches.slice(0, 2).map(m => m.trigger.id);
            return {
                response: `${NURU_KNOWLEDGE.clarify_prefix} ${suggestions.join(' or ')}. Is it one of those?`,
                links: matches.slice(0, 2).map(m => ({ label: `About ${m.trigger.id.charAt(0).toUpperCase() + m.trigger.id.slice(1)}`, url: "#" }))
            };
        }

        // Final fallback: proactive guidance instead of generic refusal
        return { 
            response: NURU_KNOWLEDGE.fallback_suggest,
            links: [
                { label: "Tell me about Hub", url: "#" },
                { label: "Show me Pages", url: "#" }
            ]
        };
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
                btn.textContent = `👉 ${link.label}`;
                btnGroup.appendChild(btn);
                
                if (link.url === '#') {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        this.inputField.value = link.label.replace('About ', '');
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

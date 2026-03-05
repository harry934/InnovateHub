/**
 * Nuru Assistant - AI-Powered Chat Widget
 * Version: 2.0.0
 * Features: Context-aware responses, role-based knowledge, multi-turn conversation,
 *           smart intent detection, proactive suggestions, persistent history.
 */

// ============================================================
//  CONTEXT DETECTION — auto-detect user role for role-aware responses
// ============================================================
const NURU_PAGE_CONTEXT = (() => {
  try {
    const user = JSON.parse(localStorage.getItem("innovateHubUser"));
    if (user && user.role) {
      return user.role; // 'innovator' or 'mentor' or 'admin'
    }
  } catch (e) {
    /* ignore parse errors */
  }
  return "public"; // fallback for logged-out users
})();

// ============================================================
//  ENHANCED KNOWLEDGE BASE
// ============================================================
const NURU_KNOWLEDGE = {
  // ── Greetings (context-aware) ─────────────────────────
  greetings: {
    public: [
      "Jambo! I'm Nuru Assistant, your Innovate Hub guide. How can I help you today?",
      "Hello! I'm Nuru Assistant. Whether you're new or returning, I'm here to help you navigate our platform.",
      "Welcome to Innovate Hub! I'm Nuru Assistant — your AI assistant for all things innovation. Ask me anything!",
    ],
    innovator: [
      "Hey there, innovator! I'm Nuru Assistant. Need help submitting a project, finding a mentor, or understanding how our platform works?",
      "Welcome to your dashboard! I'm Nuru Assistant — ask me tips on writing a strong project proposal or how to get matched with a mentor.",
      "Hi! I'm Nuru Assistant. I'm here to guide you through your innovation journey. What are you working on today?",
    ],
    mentor: [
      "Hello, Mentor! I'm Nuru Assistant. I can help you navigate requests, give feedback tips, or answer any platform questions.",
      "Welcome back! I'm Nuru Assistant — your guide for managing mentees, scheduling sessions, and making the most of your impact.",
      "Hi! I'm Nuru Assistant. Need help reviewing a mentorship request or structuring your feedback? I'm here for you.",
    ],
    admin: [
      "Hello, Admin! I'm Nuru Assistant. Need help managing users, approving mentors, or checking system metrics?",
      "Welcome to the command center! I'm Nuru Assistant — here to help you keep Innovate Hub running smoothly.",
      "Hi Admin! I'm Nuru Assistant. How can I assist you with platform management today?",
    ],
  },

  clarify_prefix:
    "I'm not entirely sure I caught that — but here's what I can help with: ",
  fallback_suggest:
    "Great question! I'd love to help. Try asking me about submitting projects, finding mentors, events, or how our platform works.",
  out_of_scope:
    "That's a great question! For the most accurate info, please reach out through our Contact section and our team will assist you directly.",

  // ── Universal triggers (all contexts) ────────────────
  triggers: [
    {
      id: "hi",
      keywords: [
        "hi",
        "hello",
        "hey",
        "jambo",
        "greetings",
        "morning",
        "afternoon",
        "evening",
        "yo",
      ],
      contexts: ["public", "innovator", "mentor"],
      response:
        "Jambo! It's great to hear from you. I'm Nuru Assistant, and I'm here to help you navigate Innovate Hub. What are you looking to do today? \n\nI can help with project submissions, finding mentors, or even just showing you around!",
      links: [],
    },
    {
      id: "thanks",
      keywords: [
        "thanks",
        "thank you",
        "asante",
        "merci",
        "cool",
        "awesome",
        "great",
      ],
      contexts: ["public", "innovator", "mentor"],
      response:
        "You're very welcome! I'm always happy to help. Is there anything else you'd like to explore?",
      links: [],
    },
    {
      id: "about",
      keywords: [
        "what is",
        "about",
        "who are you",
        "tell me about",
        "overview",
        "info",
      ],
      contexts: ["public", "innovator", "mentor"],
      response:
        "Innovate Hub is a premier platform for all innovators — whether you're a student, self-taught creator, or professional. We connect innovators with experienced mentors, provide project submission tools, and host innovation events — all to turn ideas into real-world impact.",
      links: [{ label: "Our Story", url: "about.html" }],
    },
    {
      id: "join",
      keywords: [
        "join",
        "signup",
        "sign up",
        "register",
        "create account",
        "get started",
        "how to join",
      ],
      contexts: ["public"],
      response:
        "Joining is free! You can register as an **Innovator** to submit your project ideas and get matched with mentors, or as a **Mentor** to guide the next generation of innovators.",
      links: [
        { label: "Register Now", url: "signup.html" },
        { label: "Learn More", url: "about.html" },
      ],
    },
    {
      id: "submit_project",
      keywords: [
        "submit",
        "project",
        "idea",
        "upload",
        "new project",
        "add project",
        "proposal",
      ],
      contexts: ["public", "innovator"],
      response:
        "To submit a project:\n• Go to your Dashboard\n• Click 'Submit Project' in the sidebar\n• Fill in the title, problem statement, objectives, proposed solution, and expected impact\n• Attach any supporting documents (optional)\n• Hit Submit!\n\nOur team reviews all submissions within 48 hours.",
      links: [{ label: "Go to Dashboard", url: "dashboard.html" }],
    },
    {
      id: "mentor",
      keywords: [
        "mentor",
        "mentorship",
        "find mentor",
        "get mentored",
        "expert",
        "guidance",
        "coach",
      ],
      contexts: ["public", "innovator"],
      response:
        "Our mentorship program pairs innovators with industry experts across technology, healthcare, agriculture, robotics, and more!\n\n• Browse mentors by expertise in your dashboard\n• Send a mentorship request linked to your project\n• Wait for the mentor to accept and schedule a session\n\nTip: A strong project submission increases your chances of getting matched!",
      links: [{ label: "Go to Dashboard", url: "dashboard.html" }],
    },
    {
      id: "mentorship_request",
      keywords: [
        "request",
        "pending request",
        "how to accept",
        "approve",
        "reject request",
        "mentee request",
      ],
      contexts: ["mentor"],
      response:
        "To manage mentorship requests:\n• Go to **Requests** in your sidebar\n• Review each innovator's project details\n• Click **Accept** to begin mentoring, or **Reject** with a reason\n\nAccepted mentees will appear under 'My Mentees'. You can track their progress and give structured feedback from there.",
      links: [],
    },
    {
      id: "mentees",
      keywords: [
        "mentee",
        "my mentees",
        "mentees list",
        "assigned",
        "who am i mentoring",
        "students",
        "learners",
      ],
      contexts: ["mentor"],
      response:
        "Your active mentees are listed under the **My Mentees** section. Here you can:\n• View each mentee's project\n• Track progress and milestones\n• Leave structured feedback\n• Schedule sessions via the Schedule section\n\nNeed to give feedback? Head to the Feedback Center!",
      links: [],
    },
    {
      id: "feedback",
      keywords: [
        "feedback",
        "review project",
        "comment",
        "evaluate",
        "assess",
        "grade",
        "rate project",
      ],
      contexts: ["mentor"],
      response:
        "The **Feedback Center** lets you leave structured feedback on mentee projects. Good feedback should:\n• Acknowledge what's strong in the idea\n• Identify specific areas for improvement\n• Suggest concrete next steps\n• Be encouraging and constructive\n\nGreat feedback helps innovators grow faster!",
      links: [],
    },
    {
      id: "admin_users",
      keywords: ["users", "manage users", "accounts", "ban", "approve"],
      contexts: ["admin"],
      response: "To manage users, navigate to the **All Users** section from your sidebar. Here you can view user details, change roles, and handle account status.",
      links: []
    },
    {
      id: "admin_mentors",
      keywords: ["mentor approvals", "review mentors", "pending mentors", "applications"],
      contexts: ["admin"],
      response: "Mentor applications can be reviewed in the **Mentor Reviews** section. You can accept or reject applications. If rejecting, be sure to provide a constructive reason.",
      links: []
    },
    {
      id: "admin_events",
      keywords: ["events", "create event", "manage events", "delete event", "edit event"],
      contexts: ["admin"],
      response: "You can manage all public events from the **Events Management** section. Create new events, edit details, or delete past ones to keep the community updated.",
      links: []
    },
    {
      id: "schedule",
      keywords: [
        "schedule",
        "availability",
        "meeting",
        "session",
        "zoom",
        "calendar",
        "book",
        "appointment",
      ],
      contexts: ["mentor"],
      response:
        "To set your availability:\n• Go to **Schedule** in your sidebar\n• Enter your weekly availability (e.g. 'Mondays 10am–12pm')\n• Add your Zoom or meeting link\n• Save — mentees will see your schedule when requesting sessions.",
      links: [],
    },
    {
      id: "profile",
      keywords: [
        "profile",
        "update profile",
        "edit profile",
        "bio",
        "skills",
        "picture",
        "photo",
        "name",
      ],
      contexts: ["public", "innovator", "mentor"],
      response:
        "You can update your profile from the **My Profile** section in your dashboard sidebar. You can set:\n• Full name & bio\n• Institution/organization\n• Skills and interests\n• Profile photo\n\nA complete profile helps mentors find and trust you!",
      links: [],
    },
    {
      id: "events",
      keywords: [
        "event",
        "events",
        "bootcamp",
        "exhibition",
        "stem",
        "demo",
        "workshop",
        "competition",
      ],
      contexts: ["public", "innovator", "mentor"],
      response:
        "Innovate Hub hosts exciting innovation events throughout the year:\n• **STEM Exhibition** — August 12–15 at Kenyatta University\n• **Innovation Bootcamp** — September 5–10 at Innovate Hub HQ\n• **Tech Outreach Demos** — October 20–22 at Regional STEM Centers\n\nCheck our Events page for registration details!",
      links: [{ label: "View Events", url: "event.html" }],
    },
    {
      id: "cost",
      keywords: ["cost", "price", "fee", "free", "pay", "money", "charges"],
      contexts: ["public", "innovator", "mentor"],
      response:
        "Innovate Hub is completely **free** for all community members — innovators, mentors, and partners. We believe innovation support should be accessible to every aspiring changemaker.",
      links: [],
    },
    {
      id: "contact",
      keywords: [
        "contact",
        "reach",
        "email",
        "phone",
        "support",
        "help desk",
        "talk to someone",
      ],
      contexts: ["public", "innovator", "mentor"],
      response:
        "You can reach the Innovate Hub team via:\n• 📧 InnovateHub@gmail.com\n• 📞 +254 700 000000\n• 📍 Nairobi, Kenya\n\nOr use our Contact page to send us a message directly.",
      links: [{ label: "Contact Us", url: "contact.html" }],
    },
    {
      id: "notifications",
      keywords: [
        "notification",
        "alert",
        "update",
        "bell",
        "unread",
        "messages",
      ],
      contexts: ["innovator", "mentor"],
      response:
        "Your notifications are in the **Notifications** section on the sidebar. You'll receive alerts for:\n• New mentorship request updates\n• Feedback on your projects (innovators)\n• New mentee requests (mentors)\n• Platform announcements",
      links: [],
    },
    {
      id: "login",
      keywords: [
        "login",
        "log in",
        "sign in",
        "password",
        "forgot password",
        "cant login",
        "access",
      ],
      contexts: ["public"],
      response:
        "To log in, visit our Login page. If you've forgotten your password, use the 'Forgot Password' option on the login form.\n\nStill having issues? Contact our support team at InnovateHub@gmail.com.",
      links: [{ label: "Go to Login", url: "login.html" }],
    },
    {
      id: "tips_innovator",
      keywords: [
        "tip",
        "advice",
        "improve",
        "better project",
        "how to succeed",
        "best practice",
        "recommendation",
      ],
      contexts: ["innovator"],
      response:
        "Here are some tips to succeed as an innovator on our platform:\n\n✅ **Write a clear problem statement** — explain the exact problem you're solving\n✅ **Set measurable objectives** — be specific about what success looks like\n✅ **Explain your proposed solution** step by step\n✅ **Attach supporting documents** — diagrams, research, or prototypes go a long way\n✅ **Request a mentor** early — their guidance will shape your project positively\n\nGood luck! 🚀",
      links: [],
    },
    {
      id: "tips_mentor",
      keywords: [
        "tip",
        "advice",
        "how to mentor",
        "effective",
        "guide mentee",
        "best mentor",
        "help innovator",
      ],
      contexts: ["mentor"],
      response:
        "Tips for being an effective mentor:\n\n✅ **Respond to requests promptly** — innovators are eager to start\n✅ **Read the full project before giving feedback**\n✅ **Give specific, actionable feedback** (not just 'good job')\n✅ **Set clear session expectations** — agenda, duration, follow-up\n✅ **Encourage, don't overwhelm** — guide one step at a time\n\nYour expertise changes lives! 🌟",
      links: [],
    },
    {
      id: "navigation",
      keywords: [
        "where",
        "find",
        "go to",
        "navigate",
        "page",
        "section",
        "how do i get to",
      ],
      contexts: ["public", "innovator", "mentor"],
      response:
        "I can guide you anywhere! What section are you looking for?\n\n• **Home** — index.html\n• **About Us** — about.html\n• **Events** — event.html\n• **Contact Us** — contact.html\n• **Your Dashboard** — index.html?dashboard=true",
      links: [
        { label: "Home", url: "index.html" },
        { label: "About Us", url: "about.html" },
        { label: "Contact Us", url: "contact.html" },
      ],
    },
  ],
};

// ============================================================
//  NURU ASSISTANT CLASS
// ============================================================
class NuruAssistant {
  constructor() {
    this.isOpen = false;
    this.isHidden = false;
    this.context = NURU_PAGE_CONTEXT;
    this.lastInteraction = Date.now();
    this.conversationHistory = []; // Track conversation for multi-turn
    this.chatHistory =
      JSON.parse(localStorage.getItem("nuru_history_v2")) || [];
    this.initUI();
    this.addEventListeners();
    this.startAnimationEngine();

    // Auto-greet if no history, else restore
    if (this.chatHistory.length === 0) {
      setTimeout(() => {
        this.playAnimation("wave");
        this.greet();
      }, 2000);
    } else {
      this.renderHistory();
    }
  }

  // ── UI Initialization ──────────────────────────────────
  initUI() {
    const widgetHTML = `
            <button class="nuru-assistant-toggle" id="nuruToggle" aria-label="Open Nuru Assistant AI" aria-expanded="false">
                <span class="nuru-name-tag">Nuru Assistant</span>
                <img src="assets/img/nuru-avatar.svg" alt="Nuru Assistant Avatar">
            </button>
            <div class="nuru-chat-window" id="nuruWindow" role="dialog" aria-label="Nuru AI Chat" aria-hidden="true">
                <div class="nuru-chat-header">
                    <div class="nuru-header-avatar" aria-hidden="true">
                        <img src="assets/img/nuru-avatar.svg" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:contain;">
                    </div>
                    <div class="nuru-header-info">
                        <h5>Nuru Assistant</h5>
                        <div class="nuru-header-status">✦ AI Assistant &bull; Always here to help</div>
                    </div>
                    <button class="nuru-close" id="nuruClose" aria-label="Close chat">&times;</button>
                </div>
                <div class="nuru-messages" id="nuruMessages" aria-live="polite" aria-atomic="false"></div>
                <div class="nuru-input-area">
                    <div class="nuru-input-container">
                        <input type="text" id="nuruInput" placeholder="Ask me anything…" autocomplete="off" aria-label="Type your message">
                    </div>
                    <button class="nuru-send-btn" id="nuruSend" aria-label="Send message">
                        <i class="fa fa-paper-plane" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", widgetHTML);

    this.toggleBtn = document.getElementById("nuruToggle");
    this.chatWindow = document.getElementById("nuruWindow");
    this.closeBtn = document.getElementById("nuruClose");
    this.messagesContainer = document.getElementById("nuruMessages");
    this.inputField = document.getElementById("nuruInput");
    this.sendBtn = document.getElementById("nuruSend");

    // Initial state
    this.toggleBtn.classList.add("nuru-pos-br", "nuru-peek-active");

    // Greeting sequence
    setTimeout(() => this.triggerGreetingSequence(), 1000);
  }

  // ── Greeting sequence animation ──────────────────────
  triggerGreetingSequence() {
    const toggle = this.toggleBtn;
    const nameTag = toggle.querySelector(".nuru-name-tag");

    toggle.classList.remove("nuru-peek-active");
    toggle.classList.add("nuru-say-hi");
    if (nameTag) nameTag.textContent = "Hi, I'm Nuru Assistant!";

    setTimeout(() => {
      toggle.classList.remove("nuru-say-hi");
      if (nameTag) nameTag.textContent = "Nuru Assistant";
      toggle.classList.add("nuru-peek-active");

      setTimeout(() => {
        toggle.classList.remove("nuru-peek-active");
      }, 3000);
    }, 3500);
  }

  // ── Event Listeners ───────────────────────────────────
  addEventListeners() {
    this.toggleBtn.onclick = () => this.toggleChat();
    this.closeBtn.onclick = () => this.toggleChat();
    this.sendBtn.onclick = () => this.handleSendMessage();
    this.inputField.onkeypress = (e) => {
      if (e.key === "Enter") this.handleSendMessage();
      this.lastInteraction = Date.now();
    };

    // Re-appear on scroll
    window.addEventListener("scroll", () => {
      this.lastInteraction = Date.now();
      if (this.isHidden && window.scrollY > 300) {
        this.showAssistant();
      }
    });

    // Close on click outside
    document.addEventListener("mousedown", (e) => {
      if (
        this.isOpen &&
        !this.chatWindow.contains(e.target) &&
        !this.toggleBtn.contains(e.target)
      ) {
        this.toggleChat();
      }
    });
  }

  // ── Toggle Chat Window ────────────────────────────────
  toggleChat() {
    this.isOpen = !this.isOpen;
    this.chatWindow.classList.toggle("active", this.isOpen);
    this.toggleBtn.setAttribute("aria-expanded", this.isOpen);
    this.chatWindow.setAttribute("aria-hidden", !this.isOpen);

    if (this.isOpen) {
      this.inputField.focus();
      this.scrollToBottom();
      this.playAnimation("attention");
    }
    this.lastInteraction = Date.now();
  }

  hideAssistant() {
    this.isOpen = false;
    this.chatWindow.classList.remove("active");
    this.toggleBtn.style.opacity = "0";
    this.toggleBtn.style.pointerEvents = "none";
    this.isHidden = true;
  }

  showAssistant() {
    this.toggleBtn.style.opacity = "1";
    this.toggleBtn.style.pointerEvents = "auto";
    this.isHidden = false;
  }

  playAnimation(type) {
    this.toggleBtn.classList.add(`nuru-${type}`);
    setTimeout(() => this.toggleBtn.classList.remove(`nuru-${type}`), 1500);
  }

  // ── Animation Engine (idle behaviours) ───────────────
  startAnimationEngine() {
    setInterval(() => {
      const timeSince = Date.now() - this.lastInteraction;
      if (!this.isOpen && !this.isHidden) {
        if (timeSince > 10000) {
          this.toggleBtn.classList.add("nuru-peek-active");
        } else {
          this.toggleBtn.classList.remove("nuru-peek-active");
          if (Math.random() > 0.85) this.playAnimation("attention");
        }
      }
    }, 5000);
  }

  // ── Greeting ──────────────────────────────────────────
  greet() {
    const greetings = NURU_KNOWLEDGE.greetings[this.context];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    // Add context-specific quick actions
    const quickLinks = this.getQuickActions();
    this.addMessage(greeting, "bot", quickLinks);
  }

  // Quick-action buttons based on context
  getQuickActions() {
    if (this.context === "innovator") {
      return [
        { label: "Submit a Project", url: "#", action: "submit project" },
        { label: "Find a Mentor", url: "#", action: "find mentor" },
        { label: "Get Tips", url: "#", action: "tips for innovators" },
      ];
    }
    if (this.context === "mentor") {
      return [
        { label: "View Requests", url: "#", action: "mentorship requests" },
        { label: "Feedback Tips", url: "#", action: "feedback tips" },
        { label: "Set Schedule", url: "#", action: "schedule" },
      ];
    }
    return [
      { label: "About the Hub", url: "#", action: "about" },
      { label: "Events", url: "#", action: "events" },
      { label: "Join as Innovator", url: "#", action: "join" },
    ];
  }

  // ── Message Handling ──────────────────────────────────
  handleSendMessage() {
    const text = this.inputField.value.trim();
    if (!text) return;

    this.addMessage(text, "user");
    this.inputField.value = "";
    this.lastInteraction = Date.now();

    // Track conversation for multi-turn context
    this.conversationHistory.push({ role: "user", text });

    this.showTyping();

    // Simulate intelligent processing delay
    const delay = 800 + Math.random() * 700;
    setTimeout(async () => {
      this.removeTyping();
      
      let result;
      // Dynamic logic for mentor discovery
      if (this.context === 'innovator' && (text.includes('mentor') || text.includes('who can help') || text.includes('find someone'))) {
          result = await this.getMentorDiscoveryResponse(text);
      } else {
          result = this.getResponse(text);
      }

      this.addMessage(result.response, "bot", result.links || []);
      this.conversationHistory.push({ role: "bot", text: result.response });
      this.playAnimation("wave");
    }, delay);
  }

  async getMentorDiscoveryResponse(text) {
    try {
        // Import Firestore utils if not globally available, but here we assume it's a module or has access
        // Since this is a component, we might need to import db from a core config or use a global
        // However, this script is currently structured as a non-module in dashboard.html or similar?
        // Let's check imports in nuru-assistant.js (none found).
        // It relies on being loaded in a page where Firebase is initialized.
        
        const { db } = await import('../core/firebase-config.js');
        const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        const q = query(collection(db, 'users'), where('role', '==', 'mentor'));
        const snap = await getDocs(q);
        
        let mentors = [];
        snap.forEach(d => {
            const data = d.data();
            if (data.isApproved || data.status === 'approved') mentors.push({ id: d.id, ...data });
        });

        if (mentors.length === 0) return this.getResponse(text);

        // Simple scoring based on categories
        const scored = mentors.map(m => {
            let score = 0;
            const mCats = (m.categories || []).map(c => c.toLowerCase());
            const mExp = (m.expertise || "").toLowerCase();
            
            const words = text.split(' ');
            words.forEach(w => {
                if (w.length < 3) return;
                if (mCats.includes(w) || mExp.includes(w)) score += 5;
            });
            return { ...m, score };
        }).sort((a, b) => b.score - a.score);

        const top = scored.slice(0, 2);
        if (top[0].score > 0) {
            const names = top.map(m => m.fullName).join(' and ');
            return {
                response: `Based on your request, I found some mentors who might be a great fit: **${names}**. They specialize in areas related to your query!`,
                links: top.map(m => ({ label: `View ${m.fullName.split(' ')[0]}`, url: '#', action: `view mentor ${m.id}` }))
            };
        }
    } catch (e) { console.error("Nuru mentor discovery error:", e); }
    
    return this.getResponse(text);
  }

  // ── Response Engine ───────────────────────────────────
  getResponse(input) {
    const text = input.toLowerCase().trim();

    // Filter triggers valid for current context
    const contextTriggers = NURU_KNOWLEDGE.triggers.filter(
      (t) => t.contexts.includes(this.context) || t.contexts.includes("public"),
    );

    // Weighted fuzzy scoring
    let scores = contextTriggers.map((trigger) => {
      let score = 0;
      trigger.keywords.forEach((keyword) => {
        if (text.includes(keyword)) {
          score += keyword.split(" ").length > 1 ? 4 : 2; // multi-word = stronger match
        } else if (
          keyword.length > 3 &&
          text.split(" ").some((w) => w.startsWith(keyword.substring(0, 4)))
        ) {
          score += 1; // partial/typo match
        }
      });
      return { trigger, score };
    });

    const matches = scores
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    // Strong match
    if (matches.length > 0 && matches[0].score >= 2) {
      return {
        response: matches[0].trigger.response,
        links: matches[0].trigger.links || [],
      };
    }

    // Weak match — suggest options
    if (matches.length > 0) {
      const topIds = matches.slice(0, 2).map((m) => m.trigger.id);
      return {
        response: `${NURU_KNOWLEDGE.clarify_prefix}${topIds.join(" or ")}. Which sounds right?`,
        links: matches.slice(0, 2).map((m) => ({
          label: m.trigger.id.replace(/_/g, " "),
          url: "#",
          action: m.trigger.keywords[0],
        })),
      };
    }

    // Fallback
    return {
      response: NURU_KNOWLEDGE.fallback_suggest,
      links: this.getQuickActions().slice(0, 2),
    };
  }

  // ── Message Rendering ─────────────────────────────────
  addMessage(text, sender, links = []) {
    const msg = { text, sender, links, time: new Date().toISOString() };
    this.chatHistory.push(msg);
    this.saveHistory();
    this.renderMsg(msg);
    this.scrollToBottom();
  }

  renderMsg(msg) {
    const wrapper = document.createElement("div");
    wrapper.className = `nuru-msg-wrapper nuru-msg-${msg.sender}`;

    const content = document.createElement("div");

    const bubble = document.createElement("div");
    bubble.className = "nuru-msg-text";
    // Support newlines from knowledge base responses
    bubble.innerHTML = msg.text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // bold **text**
      .replace(/\n/g, "<br>"); // line breaks

    content.appendChild(bubble);

    if (msg.links && msg.links.length > 0) {
      const btnGroup = document.createElement("div");
      btnGroup.className = "nuru-btn-group";

      msg.links.forEach((link) => {
        const btn = document.createElement("a");
        btn.className = "nuru-action-btn";
        btn.href = link.url === "#" ? "javascript:void(0)" : link.url;
        btn.textContent = `→ ${link.label}`;

        if (link.url === "#" || link.action) {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            const queryText = link.action || link.label;
            
            // Handle specific AI actions
            if (queryText.startsWith('view mentor ')) {
                const mentorId = queryText.replace('view mentor ', '');
                if (window.MentorDiscovery) {
                    window.MentorDiscovery.openProfile(mentorId);
                }
                return;
            }

            this.inputField.value = queryText;
            this.handleSendMessage();
          });
        }
        btnGroup.appendChild(btn);
      });
      content.appendChild(btnGroup);
    }

    wrapper.appendChild(content);
    this.messagesContainer.appendChild(wrapper);
  }

  renderHistory() {
    this.chatHistory.forEach((msg) => this.renderMsg(msg));
    this.scrollToBottom();
  }

  saveHistory() {
    // Keep only last 30 messages to prevent local storage bloat
    if (this.chatHistory.length > 30) {
      this.chatHistory = this.chatHistory.slice(-30);
    }
    try {
      localStorage.setItem("nuru_history_v2", JSON.stringify(this.chatHistory));
    } catch (e) {
      console.warn("Nuru Assistant: Could not save history", e);
    }
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  showTyping() {
    const div = document.createElement("div");
    div.id = "nuruTyping";
    div.className = "typing-indicator";
    div.setAttribute("aria-label", "Nuru Assistant is typing");
    div.innerHTML =
      '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    this.messagesContainer.appendChild(div);
    this.scrollToBottom();
  }

  removeTyping() {
    const el = document.getElementById("nuruTyping");
    if (el) el.remove();
  }
}

// ── Initialize Nuru ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  window.nuru = new NuruAssistant();
});

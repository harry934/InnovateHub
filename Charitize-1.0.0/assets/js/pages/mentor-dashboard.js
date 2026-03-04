import { auth, db, storage } from '../core/firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import StatusBadge from "../components/status-badges.js";
import EmptyStates from "../components/empty-states.js";
import NotificationSystem from "../components/notification-system.js";

// ─── Custom SVG icons per card ───────────────────────────────
const CARD_ICONS = {
    overview: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
        <rect x="22" y="6" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
        <rect x="6" y="22" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
        <rect x="22" y="22" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    requests: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 12c0-2.2 1.8-4 4-4h24c2.2 0 4 1.8 4 4v16c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V12z" stroke="currentColor" stroke-width="2"/>
        <path d="M4 12l16 10 16-10" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M14 24h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    mentees: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 16l16-8 16 8-16 8-16-8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M8 18v8c0 4 6 6 12 6s12-2 12-6v-8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M36 16v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="20" cy="16" r="3" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    schedule: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="14" stroke="currentColor" stroke-width="2"/>
        <path d="M20 10v10l6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 20h2M33 20h2M20 5v2M20 33v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    profile: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M20 4v4M20 32v4M4 20h4M32 20h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7.5 7.5l2.8 2.8M29.7 29.7l2.8 2.8M7.5 32.5l2.8-2.8M29.7 10.3l2.8-2.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="20" cy="20" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2"/>
    </svg>`
};

const dashboardCards = [
    { title: 'Overview',         id: 'overview', section: 'overview',      types: ['Stats', 'Metrics'], progress: 100, action: 'view' },
    { title: 'Requests',         id: 'requests', section: 'requests',      types: ['New', 'Review'],    progress: 25,  action: 'search' },
    { title: 'My Mentees',       id: 'mentees',  section: 'mentees',       types: ['Manage', 'Active'], progress: 75,  action: 'chat' },
    { title: 'Schedule',         id: 'schedule', section: 'schedule',      types: ['Time', 'Meetings'], progress: 50,  action: 'plus' },
    { title: 'Account Settings', id: 'profile',  section: 'profile', types: ['Profile', 'Settings'], progress: 90, action: 'edit' }
];

// ─── Enhanced background symbol system ───────────────────────
function initBackgroundSymbols() {
    const container = document.getElementById('backgroundSymbols');
    if (!container) return;
    container.innerHTML = '';

    const symbols = [
        '+', '−', '×', '÷', '◇', '○', '△', '□', 
        '⟶', '⇌', '∞', '≈', '{ }', '< />', '[ ]', '#',
        '⚡', '⚛', '◈', '❖', '★', '⚙', '⌘'
    ];
    const count = 100; // Boosted density

    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'bg-symbol';
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

        const size = 0.8 + Math.random() * 2.2;
        const opacity = 0.04 + Math.random() * 0.08;
        const delay = Math.random() * 20;
        const dur = 15 + Math.random() * 25;
        const drift = (Math.random() - 0.5) * 150;

        el.style.cssText = `
            position: absolute;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 140}%;
            font-size: ${size}rem;
            --sym-opacity: ${opacity};
            opacity: ${opacity};
            color: ${Math.random() > 0.6 ? '#1a5e4f' : '#f3a813'};
            font-family: 'Courier New', monospace;
            font-weight: 800;
            pointer-events: none;
            user-select: none;
            animation: floatSymbol ${dur}s ${delay}s ease-in-out infinite alternate;
            --drift: ${drift}px;
            filter: blur(${Math.random() * 1}px);
        `;
        container.appendChild(el);
    }
}

function renderQuickAccessCards() {
    const container = document.getElementById('dashboardCardsGrid');
    if (!container) return;

    container.innerHTML = dashboardCards.map(card => `
        <article class="premium-card" onclick="window.showDashboardSection('${card.section}')">
          <div class="premium-card-icon">
            ${CARD_ICONS[card.id] || ''}
          </div>
          <div class="tc-content">
            <div class="tc-header">
              <h3 class="tc-title" style="font-family:var(--font-head); font-weight:800; font-size:1.4rem; color:var(--brand-green);">${card.title}</h3>
              <div class="tc-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
            <div class="tc-tags" style="margin-top:8px; display:flex; gap:8px;">
              ${card.types.map(t => `<span class="badge" style="background:rgba(26, 94, 79, 0.05); color:var(--brand-green); font-size:0.7rem; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:20px;">${t}</span>`).join('')}
            </div>
          </div>
        </article>
    `).join('');

    initBackgroundSymbols();
}


class MentorDashboard {
  constructor() {
    this.currentUser = null;
    this.onboardingStep = 1;
    this.totalSteps = 5;
    this.onboardingData = {};
  }

  async init(user, userData) {
    console.log("Mentor Dashboard: Initializing with provided data...");
    this.currentUser = user;
    
    try {
        await this.checkProfileCompletion(userData);
        await this.initializeUI();
        this.updateProfileCompleteness(userData);
        this.loadDashboardData();
    } catch (err) {
        console.error("Error initializing mentor dashboard:", err);
    }
  }

  async checkProfileCompletion(providedData = null) {
    try {
      let userData = providedData;
      if (!userData) {
          const userDoc = await getDoc(doc(db, "users", this.currentUser.uid));
          if (userDoc.exists()) userData = userDoc.data();
      }

      if (userData) {
        if (!userData.profileComplete) {
          this.showOnboardingModal();
        } else {
          document.getElementById("dashboard-content").style.display = "block";
        }

        // Update User Identity in Sidebar
        this.updateUserIdentity(
          userData.fullName || this.currentUser.displayName || this.currentUser.email.split('@')[0],
        );
        
        // Populate Profile Forms with existing data
        this.populateProfileForms(userData);
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  }

  updateProfileCompleteness(userData) {
    if (!userData) return;
    
    document.getElementById("mentorCompleteness").style.display = "block";
    
    let filledFields = 0;
    const totalFields = 5;
    
    if (userData.fullName) filledFields++;
    if (userData.bio) filledFields++;
    if (userData.profession) filledFields++;
    if (userData.expertise && userData.expertise.length > 0) filledFields++;
    if (userData.availability || userData.meetingLink) filledFields++;
    if (userData.experience) filledFields++; // Added experience
    if (userData.communicationPreference) filledFields++; // Added communication preference
    
    const totalFieldsCount = 7;
    const percentage = Math.round((filledFields / totalFieldsCount) * 100);
    
    const fill = document.getElementById("completenessFill");
    const text = document.getElementById("completenessText");
    
    if (fill) fill.style.width = percentage + "%";
    if (text) text.textContent = percentage + "%";
    
    // Update profileComplete status in DB if reached 100%
    if (percentage === 100 && !userData.profileComplete) {
        updateDoc(doc(db, "users", this.currentUser.uid), { profileComplete: true });
    }
  }

  updateUserIdentity(name) {
    const el = document.getElementById("userDisplayName");
    if (el) el.textContent = name;
    
    // Refresh Profile Circle Initials
    if (window.StaggeredMenu && window.StaggeredMenu.updateInitials) {
        window.StaggeredMenu.updateInitials(name);
    }
  }
  
  populateProfileForms(data) {
      // Profile Form
      if(document.getElementById('profileName')) document.getElementById('profileName').value = data.fullName || '';
      if(document.getElementById('profileProfession')) document.getElementById('profileProfession').value = data.profession || '';
      if(document.getElementById('profileExpertise')) document.getElementById('profileExpertise').value = (data.expertise || []).join(', ');
      if(document.getElementById('profileBio')) document.getElementById('profileBio').value = data.bio || '';
      if(document.getElementById('profileExperience')) document.getElementById('profileExperience').value = data.experience || '';
      if(document.getElementById('profileCommunication')) document.getElementById('profileCommunication').value = data.communicationPreference || '';
      if(document.getElementById('availabilityToggle')) document.getElementById('availabilityToggle').checked = data.isAvailable !== false;
      
      // Schedule Form
      if(document.getElementById('weeklyAvailability')) document.getElementById('weeklyAvailability').value = data.availability || '';
      if(document.getElementById('meetingLink')) document.getElementById('meetingLink').value = data.meetingLink || '';
  }

  // ==========================================
  // ONBOARDING WIZARD
  // ==========================================

  showOnboardingModal() {
    const modal = new bootstrap.Modal(
      document.getElementById("onboardingModal"),
      {
        backdrop: "static",
        keyboard: false,
      },
    );
    modal.show();
    this.renderOnboardingStep();

    // Bind Next/Back buttons - Check if listeners already added
    const nextBtn = document.getElementById("nextStepBtn");
    const prevBtn = document.getElementById("prevStepBtn");
    
    // Remove old listeners to avoid duplicates if re-init
    const newNextBtn = nextBtn.cloneNode(true);
    const newPrevBtn = prevBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    
    newNextBtn.addEventListener("click", () => this.nextStep());
    newPrevBtn.addEventListener("click", () => this.prevStep());
  }

  renderOnboardingStep() {
    const container = document.getElementById("onboardingStepContainer");
    const progressBar = document.getElementById("onboardingProgress");
    const title = document.getElementById("onboardingTitle");

    // Update Progress
    const percent = ((this.onboardingStep - 1) / this.totalSteps) * 100;
    progressBar.style.width = `${percent}%`;

    let html = "";

    switch (this.onboardingStep) {
      case 1:
        title.textContent = "Step 1: Areas of Expertise";
        html = `
                    <div class="mb-3">
                        <label class="form-label">Select your areas of expertise (Multi-select)</label>
                        <div class="d-flex flex-wrap gap-2">
                            ${this.renderCheckbox("expertise", "Technology")}
                            ${this.renderCheckbox("expertise", "Healthcare")}
                            ${this.renderCheckbox("expertise", "Education")}
                            ${this.renderCheckbox("expertise", "Environment")}
                            ${this.renderCheckbox("expertise", "Business")}
                            ${this.renderCheckbox("expertise", "Marketing")}
                        </div>
                    </div>
                `;
        break;
      case 2:
        title.textContent = "Step 2: Experience Level";
        html = `
                    <div class="mb-3">
                        <label class="form-label">Years of Experience</label>
                        <select class="form-select" id="experienceSelect">
                            <option value="1-3">1-3 Years</option>
                            <option value="4-7">4-7 Years</option>
                            <option value="8-10">8-10 Years</option>
                            <option value="10+">10+ Years</option>
                        </select>
                    </div>
                `;
        break;
      case 3:
        title.textContent = "Step 3: Mentoring Style";
        html = `
                    <div class="mb-3">
                        <label class="form-label">How do you prefer to mentor?</label>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="style" value="Hands-on" id="style1">
                            <label class="form-check-label" for="style1">Hands-on (Code reviews, direct guidance)</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="style" value="Strategic" id="style2">
                            <label class="form-check-label" for="style2">Strategic (High-level advice, career growth)</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="style" value="Hybrid" id="style3" checked>
                            <label class="form-check-label" for="style3">Hybrid</label>
                        </div>
                    </div>
                `;
        break;
      case 4:
        title.textContent = "Step 4: Availability";
        html = `
                    <div class="mb-3">
                        <label class="form-label">Weekly Availability</label>
                        <select class="form-select" id="availabilitySelect">
                            <option value="1-2 hours">1-2 hours/week</option>
                            <option value="3-5 hours">3-5 hours/week</option>
                            <option value="5+ hours">5+ hours/week</option>
                        </select>
                    </div>
                `;
        break;
      case 5:
        title.textContent = "Step 5: Industries of Interest";
        html = `
                    <div class="mb-3">
                        <label class="form-label">Industries you are interested in mentoring</label>
                        <div class="d-flex flex-wrap gap-2">
                            ${this.renderCheckbox("industries", "FinTech")}
                            ${this.renderCheckbox("industries", "HealthTech")}
                            ${this.renderCheckbox("industries", "EdTech")}
                            ${this.renderCheckbox("industries", "Clean Energy")}
                            ${this.renderCheckbox("industries", "Social Enterprise")}
                        </div>
                    </div>
                `;
        break;
    }

    container.innerHTML = html;
    this.restoreStepData();
  }

  renderCheckbox(name, value) {
    return `
            <input type="checkbox" class="btn-check" name="${name}" id="${name}-${value}" value="${value}" autocomplete="off">
            <label class="btn btn-outline-primary" for="${name}-${value}">${value}</label>
        `;
  }

  saveStepData() {
    // Capture data from current step
    if (this.onboardingStep === 1) {
      this.onboardingData.expertise = this.getMultiSelectValues("expertise");
    } else if (this.onboardingStep === 2) {
      this.onboardingData.experience =
        document.getElementById("experienceSelect").value;
    } else if (this.onboardingStep === 3) {
      const el = document.querySelector('input[name="style"]:checked');
      if (el) this.onboardingData.style = el.value;
    } else if (this.onboardingStep === 4) {
      this.onboardingData.availability =
        document.getElementById("availabilitySelect").value;
    } else if (this.onboardingStep === 5) {
      this.onboardingData.industries = this.getMultiSelectValues("industries");
    }
  }

  restoreStepData() {
    // Restore previous selections if backing up
    // (Simplified for this version - complex restoration can be added)
  }

  getMultiSelectValues(name) {
    return Array.from(
      document.querySelectorAll(`input[name="${name}"]:checked`),
    ).map((cb) => cb.value);
  }

  nextStep() {
    this.saveStepData();

    if (this.onboardingStep < this.totalSteps) {
      this.onboardingStep++;
      this.renderOnboardingStep();
    } else {
      this.completeOnboarding();
    }

    // Update buttons
    document.getElementById("prevStepBtn").disabled = this.onboardingStep === 1;
    document.getElementById("nextStepBtn").textContent =
      this.onboardingStep === this.totalSteps ? "Finish" : "Next";
  }

  prevStep() {
    if (this.onboardingStep > 1) {
      this.onboardingStep--;
      this.renderOnboardingStep();
    }
    document.getElementById("prevStepBtn").disabled = this.onboardingStep === 1;
    document.getElementById("nextStepBtn").textContent = "Next";
  }

  async completeOnboarding() {
    try {
      const btn = document.getElementById("nextStepBtn");
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm"></span> Saving...';
      btn.disabled = true;

      await updateDoc(doc(db, "users", this.currentUser.uid), {
        ...this.onboardingData,
        profileComplete: true,
        updatedAt: serverTimestamp(),
      });

      location.reload(); // Reload to clear modal and show dashboard
    } catch (error) {
      console.error("Onboarding failed:", error);
      alert("Failed to save profile. Please try again.");
      document.getElementById("nextStepBtn").innerHTML = "Finish";
      document.getElementById("nextStepBtn").disabled = false;
    }
  }

  // ==========================================
  // DASHBOARD CORE
  // ==========================================

  async initializeUI() {
    if (this.uiInitialized) return;
    this.uiInitialized = true;

    // Navigation Logic handled in dashboard.html
    // We just need to make sure renderQuickAccessCards is called
    renderQuickAccessCards();

    // Initialize CardNav for Mentor
    const navItems = [
        { 
            label: 'Mentorship', 
            bgColor: '#1a5e4f', 
            textColor: '#fff', 
            links: [
                { label: 'Overview', href: 'javascript:showDashboardSection("overview")' }, 
                { label: 'Requests', href: 'javascript:showDashboardSection("requests")' }
            ] 
        },
        { 
            label: 'Management', 
            bgColor: '#f3a813', 
            textColor: '#000', 
            links: [
                { label: 'My Mentees', href: 'javascript:showDashboardSection("mentees")' }, 
                { label: 'Schedule', href: 'javascript:showDashboardSection("schedule")' }
            ] 
        },
        { 
            label: 'Account', 
            bgColor: '#121331', 
            textColor: '#fff', 
            links: [
                { label: 'Profile', href: 'javascript:showDashboardSection("profile")' }, 
                { label: 'Notifications', href: 'javascript:showDashboardSection("notifications")' }
            ] 
        }
    ];

    /* CardNav removed in favor of standard navbar + landing cards */
    /*
    new CardNav({
        user: { name: this.currentUser.displayName || this.currentUser.email.split('@')[0] },
        items: navItems,
        baseColor: '#1a5e4f',
        buttonBgColor: '#f3a813',
        buttonTextColor: '#000'
    });
    */

    // Render Quick Access Cards
    renderQuickAccessCards();
    
    // Attach Event Listeners for Forms
    const scheduleForm = document.getElementById('scheduleForm');
    if(scheduleForm) scheduleForm.addEventListener('submit', (e) => this.handleScheduleUpdate(e));
    
    const profileForm = document.getElementById('profileForm');
    if(profileForm) profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
    
    // Toggle handling
    const toggle = document.getElementById('availabilityToggle');
    if(toggle) {
        toggle.addEventListener('change', (e) => {
            document.getElementById('availabilityText').textContent = e.target.checked ? 'Available for new mentees' : 'Not available';
            updateDoc(doc(db, "users", this.currentUser.uid), { 
                isAvailable: e.target.checked 
            });
        });
    }
  }

  async loadDashboardData() {
    console.log("Loading dashboard data...");
    
    // Initialize notification system
    try {
        const notificationSystem = new NotificationSystem(this.currentUser.uid);
        notificationSystem.init('notificationBell');
        notificationSystem.bindFullList('notificationsPageList');
        console.log("Mentor Dashboard: Notification system initialized.");
    } catch (err) {
        console.warn("Mentor Dashboard: Notification system init failed:", err);
    }

    await Promise.all([
      this.loadStats(),
      this.loadRequests(),
      this.loadMentees(),
      this.loadNotifications()
    ]);
  }

  async loadStats() {
    try {
      const q = query(
        collection(db, "mentorshipRequests"),
        where("mentorId", "==", this.currentUser.uid),
      );
      const snapshot = await getDocs(q);

      const pending = snapshot.docs.filter(
        (doc) => doc.data().status === "pending",
      ).length;
      const accepted = snapshot.docs.filter(
        (doc) => doc.data().status === "accepted",
      ).length;

      const totalMenteesEl = document.getElementById("totalMentees");
      const pendingRequestsEl = document.getElementById("pendingRequests");
      const completedProjectsEl = document.getElementById("completedProjects"); // Placeholder
      const requestCountEl = document.getElementById("requestCount");

      if (totalMenteesEl) totalMenteesEl.textContent = accepted;
      if (pendingRequestsEl) pendingRequestsEl.textContent = pending;
      if (requestCountEl) {
        requestCountEl.textContent = pending;
        requestCountEl.style.display = pending > 0 ? "inline-block" : "none";
      }
      if (completedProjectsEl) completedProjectsEl.textContent = 0; // To be implemented with project status check
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  async loadRequests() {
    const container = document.getElementById("requestsContainer");
    if (!container) return;

    container.innerHTML = EmptyStates.templates.loadingState();

    try {
      const q = query(
        collection(db, "mentorshipRequests"),
        where("mentorId", "==", this.currentUser.uid),
        where("status", "==", "pending"),
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        container.innerHTML = EmptyStates.templates.noRequests();
        return;
      }

      container.innerHTML = "";

      for (const docSnap of snapshot.docs) {
        const requestId = docSnap.id;
        const requestData = docSnap.data();
        const request = { id: requestId, ...requestData };

        try {
            const invId = request.innovatorId;
            const projId = request.projectId;

            let innovatorName = "Unknown Innovator";
            let projectTitle = "General Mentorship (No Project Specified)";
            let category = "General";
            let dateStr = request.createdAt?.toDate().toLocaleDateString() || "Recently";

            const fetchPromises = [];
            
            // Fetch Innovator
            if (invId && typeof invId === 'string') {
                fetchPromises.push(getDoc(doc(db, "users", invId)));
            } else {
                fetchPromises.push(Promise.resolve({ exists: () => false }));
            }

            // Fetch Project
            if (projId && typeof projId === 'string') {
                fetchPromises.push(getDoc(doc(db, "projects", projId)));
            } else {
                fetchPromises.push(Promise.resolve({ exists: () => false }));
            }

            const [innovatorDoc, projectDoc] = await Promise.all(fetchPromises);

            if (innovatorDoc.exists()) {
              innovatorName = innovatorDoc.data().fullName || "Innovator";
            }
            
            if (projectDoc.exists()) {
              const pData = projectDoc.data();
              projectTitle = pData.title || "Untitled Project";
              category = pData.categories?.[0] || "General";
            }

            container.innerHTML += `
                    <div class="dashboard-card mb-3">
                        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
                            <div>
                                <div class="d-flex align-items-center gap-2 mb-2">
                                    <h5 class="mb-0">${innovatorName}</h5>
                                    <span class="badge bg-light text-dark border">${category}</span>
                                </div>
                                <p class="mb-1"><strong>Project:</strong> ${projectTitle}</p>
                                <p class="text-muted small mb-0">Requested: ${dateStr}</p>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-success btn-sm" onclick="window.dashboard.handleRequest('${requestId}', 'accepted')">
                                    <i class="fa fa-check me-1"></i> Accept
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="window.dashboard.handleRequest('${requestId}', 'rejected')">
                                    <i class="fa fa-times me-1"></i> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                `;
        } catch (err) {
            console.error("Error loading details for request " + requestId, err);
        }
      }
    } catch (error) {
      console.error("Error loading requests:", error);
      container.innerHTML =
        EmptyStates.templates.errorState("Failed to load requests");
    }
  }

  async handleRequest(requestId, status) {
    try {
      if (status === "rejected") {
          this.openRejectionModal(requestId);
          return;
      }

      if (
        !confirm(
          `Are you sure you want to accept this request?`,
        )
      )
        return;

      await updateDoc(doc(db, "mentorshipRequests", requestId), {
        status: status,
        updatedAt: serverTimestamp(),
      });
      
      // If accepted, could send a notification to innovator here
      
      alert(`Request ${status}!`);
      this.loadStats();
      this.loadRequests();
      if (status === "accepted") this.loadMentees();
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Failed to update request");
    }
  }

  async loadMentees() {
    const container = document.getElementById("menteesContainer");
    if (!container) return;

    container.innerHTML = EmptyStates.templates.loadingState();

    try {
      const q = query(
        collection(db, "mentorshipRequests"),
        where("mentorId", "==", this.currentUser.uid),
        where("status", "==", "accepted"),
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        container.innerHTML = `<div class="text-center py-5"><p class="text-muted">No mentees yet.</p></div>`;
        return;
      }

      container.innerHTML = '<div class="row g-4"></div>';
      const row = container.querySelector(".row");

      for (const docSnap of snapshot.docs) {
        const requestId = docSnap.id;
        const requestData = docSnap.data();
        const request = { id: requestId, ...requestData };

        try {
            const invId = request.innovatorId;
            const projId = request.projectId;

            let innovator = { fullName: "Unknown Innovator" };
            let project = { title: "General Mentorship", problemStatement: "Direct mentorship request without specific project attachment.", categories: ["General"], status: "active" };
            let hasProject = false;

            const fetchPromises = [];
            
            // Fetch Innovator
            if (invId && typeof invId === 'string') {
                fetchPromises.push(getDoc(doc(db, "users", invId)));
            } else {
                fetchPromises.push(Promise.resolve({ exists: () => false }));
            }

            // Fetch Project
            if (projId && typeof projId === 'string') {
                fetchPromises.push(getDoc(doc(db, "projects", projId)));
            } else {
                fetchPromises.push(Promise.resolve({ exists: () => false }));
            }

            const [innovatorDoc, projectDoc] = await Promise.all(fetchPromises);

            if (innovatorDoc.exists()) {
                innovator = { ...innovatorDoc.data(), id: innovatorDoc.id };
            }
            
            if (projectDoc.exists()) {
                project = { id: projectDoc.id, ...projectDoc.data() };
                hasProject = true;
            }

            const onclickAttr = hasProject ? `window.dashboard.viewMenteeProject('${project.id}')` : `alert('This mentee joined via direct request without a specific project.')`;

            row.innerHTML += `
                    <div class="col-md-6 col-lg-4">
                        <div class="dashboard-card h-100 cursor-pointer hover-card" onclick="${onclickAttr}">
                            <div class="d-flex align-items-center mb-3">
                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px; font-size: 1.2rem;">
                                    ${(innovator.fullName || "U").charAt(0)}
                                </div>
                                <div>
                                    <h5 class="mb-0">${innovator.fullName || "Innovator"}</h5>
                                    <small class="text-muted">Innovator</small>
                                </div>
                            </div>
                            <hr class="my-2">
                            <h6 class="text-primary mb-2">${project.title}</h6>
                            <p class="text-muted small mb-2 line-clamp-2">${project.problemStatement || "No description"}</p>
                            
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <div class="small fw-bold text-dark">Category</div>
                                    <span class="badge bg-light text-dark border">${project.categories?.[0] || "General"}</span>
                                </div>
                                <div class="col-6">
                                    <div class="small fw-bold text-dark">Comm. Method</div>
                                    <div class="small text-muted">${innovator.communicationPreference || 'Any'}</div>
                                </div>
                                <div class="col-6">
                                    <div class="small fw-bold text-dark">Status</div>
                                    ${StatusBadge.render(project.status || 'active')}
                                </div>
                                <div class="col-6">
                                    <div class="small fw-bold text-dark">Next Meeting</div>
                                    <div class="small text-muted">${request.nextMeetingDate || 'Not scheduled'}</div>
                                </div>
                            </div>

                            <button class="btn btn-sm btn-outline-danger w-100 mt-2" onclick="event.stopPropagation(); window.dashboard.openRejectionModal('${requestId}')">
                                <i class="fa fa-times-circle me-1"></i>Request to Stop Mentorship
                            </button>
                        </div>
                    </div>
                `;
        } catch (err) {
            console.error("Error loading mentee details for " + requestId, err);
        }
      }
    } catch (error) {
      console.error("Error loading mentees:", error);
      container.innerHTML =
        EmptyStates.templates.errorState("Failed to load mentees");
    }
  }
  
  async loadNotifications() {
      // General notifications logic
      const container = document.getElementById("notificationsPageList");
      if(!container) return;
      
      try {
          const q = query(
              collection(db, "notifications"),
              where("userId", "==", this.currentUser.uid),
               // orderBy('createdAt', 'desc') // Needs index
          );
          const snapshot = await getDocs(q);
          
          if(snapshot.empty) {
               container.innerHTML = `<div class="text-center py-5"><i class="fa fa-bell-slash fa-3x text-light mb-3"></i><p class="text-muted">No notifications yet</p></div>`;
               return;
          }
          
          container.innerHTML = '';
          const docs = snapshot.docs.map(d => d.data()).sort((a,b) => b.createdAt - a.createdAt);
          
          docs.forEach(notif => {
              container.innerHTML += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-1">${notif.message}</h6>
                        <small class="text-muted">${notif.createdAt?.toDate().toLocaleDateString()}</small>
                    </div>
                </div>
              `;
          });
          
      } catch (err) {
          console.warn("Notifications load error:", err);
      }
  }

  async viewMenteeProject(projectId) {
    try {
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (!projectDoc.exists()) return;

      const project = projectDoc.data();

      // Check if project is approved (requirement)
      if (project.status !== "approved") {
        alert(
          "This project is awaiting admin approval. Full details will be available once approved.",
        );
        return;
      }

      window.showSection("feedback");
      this.loadProjectForFeedback(projectId, project);
    } catch (error) {
      console.error("Error viewing project:", error);
    }
  }

  loadProjectForFeedback(projectId, project) {
    const container = document.getElementById("feedbackContainer");
    if (!container) return;

    container.innerHTML = `
            <div class="mb-4">
                <button class="btn btn-outline-secondary btn-sm mb-3" onclick="window.showSection('mentees')">
                    <i class="fa fa-arrow-left me-2"></i>Back to Mentees
                </button>
                <h3>${project.title}</h3>
                <p class="text-muted">By Innovator</p>
            </div>
            
            <div class="row">
                <div class="col-lg-8">
                    <!-- Project Sections for Commenting -->
                    ${this.renderProjectSection("Problem Statement", project.problemStatement, projectId, "problemStatement")}
                    ${this.renderProjectSection("Objectives", project.objectives, projectId, "objectives")}
                    ${this.renderProjectSection("Proposed Solution", project.proposedSolution, projectId, "proposedSolution")}
                    ${this.renderProjectSection("Expected Impact", project.expectedImpact, projectId, "expectedImpact")}
                </div>
                <div class="col-lg-4">
                    <div class="dashboard-card bg-light">
                         <h5>Feedback History</h5>
                         <div id="projectFeedbackHistory">
                            <p class="text-muted small">Select a section to view or add comments.</p>
                         </div>
                    </div>
                </div>
            </div>
        `;
  }

  renderProjectSection(title, content, projectId, fieldName) {
    return `
            <div class="dashboard-card mb-4 position-relative group-comment-section">
                <button class="btn btn-sm btn-light position-absolute top-0 end-0 m-3" 
                        onclick="window.dashboard.openCommentBox('${projectId}', '${fieldName}')">
                    <i class="fa fa-comment text-primary"></i>
                </button>
                <h5 class="text-primary">${title}</h5>
                <p>${content || "No content provided."}</p>
            </div>
        `;
  }

  openCommentBox(projectId, fieldName) {
    const historyContainer = document.getElementById("projectFeedbackHistory");
    historyContainer.innerHTML = `
            <h6>Comments for: ${fieldName}</h6>
            <div id="commentsList" class="mb-3" style="max-height: 300px; overflow-y: auto;">
                <div class="spinner-border spinner-border-sm text-primary"></div> Loading comments...
            </div>
            <form onsubmit="window.dashboard.submitComment(event, '${projectId}', '${fieldName}')">
                <div class="mb-2">
                    <textarea class="form-control" name="comment" rows="3" placeholder="Write your feedback..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-sm">Send Feedback</button>
            </form>
        `;

    this.loadComments(projectId, fieldName);
  }

  async loadComments(projectId, fieldName) {
    try {
      const q = query(
        collection(db, `projects/${projectId}/feedback`),
        where("field", "==", fieldName),
        // orderBy('createdAt', 'asc') // Requires index
      );
      const snapshot = await getDocs(q);
      const list = document.getElementById("commentsList");

      if (snapshot.empty) {
        list.innerHTML = '<p class="text-muted small">No comments yet.</p>';
        return;
      }

      list.innerHTML = "";
      // Sort in memory for now to avoid index creation delay
      const docs = snapshot.docs.map(d => d.data()).sort((a,b) => a.createdAt - b.createdAt);
      
      docs.forEach((data) => {
        const isMe = data.authorId === this.currentUser.uid;
        list.innerHTML += `
                    <div class="mb-2 p-2 rounded ${isMe ? "bg-primary-soft ms-4" : "bg-light me-4"}">
                        <small class="fw-bold d-block">${data.authorName}</small>
                        <p class="mb-0 small">${data.content}</p>
                        <small class="text-muted" style="font-size: 0.7rem;">${data.createdAt?.toDate().toLocaleDateString()}</small>
                    </div>
                `;
      });
    } catch (error) {
      console.error("Error loading comments:", error);
      document.getElementById("commentsList").innerHTML =
        '<p class="text-danger small">Error loading comments</p>';
    }
  }

  async submitComment(e, projectId, fieldName) {
    e.preventDefault();
    const content = e.target.comment.value;
    const btn = e.target.querySelector("button");
    btn.disabled = true;

    try {
      await addDoc(collection(db, `projects/${projectId}/feedback`), {
        projectId,
        field: fieldName,
        content,
        authorId: this.currentUser.uid,
        authorName: this.currentUser.displayName || "Mentor",
        role: "mentor",
        createdAt: serverTimestamp(),
      });

      e.target.reset();
      this.loadComments(projectId, fieldName); // Reload to show new comment
    } catch (error) {
      console.error("Error sending comment:", error);
      alert("Failed to send comment");
    } finally {
      btn.disabled = false;
    }
  }
  
  async handleScheduleUpdate(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      btn.disabled = true;
      btn.innerHTML = 'Saving...';
      
      try {
          const availability = document.getElementById('weeklyAvailability').value;
          const meetingLink = document.getElementById('meetingLink').value;
          
          await updateDoc(doc(db, "users", this.currentUser.uid), {
             availability,
             meetingLink,
             updatedAt: serverTimestamp()
          });
          
          alert('Schedule updated successfully!');
      } catch (err) {
          console.error("Schedule update error:", err);
          alert("Failed to update schedule.");
      } finally {
          btn.disabled = false;
          btn.innerHTML = 'Update Schedule';
      }
  }
  
  async handleProfileUpdate(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      btn.disabled = true;
      btn.innerHTML = 'Saving...';
      
      try {
          const form = e.target;
          const availabilityToggle = document.getElementById('availabilityToggle').checked;
          
          const profileData = {
              fullName: form.fullName.value,
              profession: form.profession.value,
              expertise: form.expertise.value.split(',').map(s => s.trim()),
              bio: form.bio.value,
              isAvailable: availabilityToggle, // Sync toggle here too
              updatedAt: serverTimestamp()
          };
          
          await updateDoc(doc(db, "users", this.currentUser.uid), profileData);
          alert('Profile updated successfully!');
          this.updateUserIdentity(profileData.fullName);
      } catch (err) {
           console.error("Profile update error:", err);
          alert("Failed to update profile.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Update Profile';
        }
    }

    // --- MENTORSHIP REJECTION FLOW ---

    openRejectionModal(requestId) {
        this.currentRejectionRequestId = requestId;
        const modalElement = document.getElementById('rejectionModal');
        const modal = new bootstrap.Modal(modalElement);
        document.getElementById('rejectionReason').value = '';
        modal.show();

        // Attach click handler once
        const confirmBtn = document.getElementById('confirmRejectionBtn');
        confirmBtn.onclick = () => this.handleRejectionSubmit(modal);
    }

    async handleRejectionSubmit(modalInstance) {
        const reason = document.getElementById('rejectionReason').value.trim();
        if (!reason) {
            alert('Please provide a reason for rejection.');
            return;
        }

        const confirmBtn = document.getElementById('confirmRejectionBtn');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';

        try {
            const requestId = this.currentRejectionRequestId;
            
            // 1. Update mentorship request status to pending_admin_rejection
            const { updateDoc, doc, db, serverTimestamp, addDoc, collection } = await import('../core/firebase-config.js');
            
            await updateDoc(doc(db, "mentorshipRequests", requestId), {
                status: "pending_admin_rejection",
                rejectionReason: reason,
                rejectionRequestedAt: serverTimestamp()
            });

            // 2. Create notification for admin
            await addDoc(collection(db, "notifications"), {
                userId: "admin", // Special ID for universal admin notifications
                type: "mentorship_rejection_request",
                requestId: requestId,
                mentorId: this.currentUser.uid,
                message: `Mentor ${this.currentUser.fullName || 'someone'} requested to stop a mentorship session.`,
                reason: reason,
                status: "unread",
                createdAt: serverTimestamp()
            });

            modalInstance.hide();
            alert('Your rejection request has been submitted for admin approval.');
            
            // Reload UI
            this.loadRequests();
            this.loadMentees();
            this.loadStats();

        } catch (error) {
            console.error("Error submitting rejection request:", error);
            alert("Failed to submit rejection request: " + error.message);
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = 'Submit Rejection Request';
        }
    }
}

// Export init function for dashboard.html
export async function initDashboard(user, userData) {
    if (!window.dashboard) window.dashboard = new MentorDashboard();
    await window.dashboard.init(user, userData);
}

// Initial instance for window access
window.dashboard = window.dashboard || new MentorDashboard();

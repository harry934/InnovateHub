// Supabase Auth — user data provided by dashboard.html via initDashboard()

// Firestore imports removed
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
    {
        title: 'Mentorship Requests',
        section: 'requests',
        subtitle: 'Review incoming requests',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
    },
    {
        title: 'My Mentees',
        section: 'myMentors', 
        subtitle: 'Manage your active mentees',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    },
    {
        title: 'Collaboration Hub',
        section: 'collab',
        subtitle: 'Real-time mentee workspace',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
    },
    {
        title: 'Profile Settings',
        section: 'profile',
        subtitle: 'Update expertise and bio',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    }
];

// ─── Enhanced background symbol system ───────────────────────
// ─── Whisper Background Symbol System (3% Opacity, Sanctuary Style) ─
function initBackgroundSymbols() {
    const container = document.getElementById('forest-sanctuary-bg');
    if (!container) return;
    container.innerHTML = '';

    const symbols = ['○', '◊', '×', '+', '•', '□', '∆'];
    const count = 40;

    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'bg-whisper-symbol';
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

        const size = 1 + Math.random() * 3;
        const delay = Math.random() * -20;
        const dur = 40 + Math.random() * 60;
        const left = Math.random() * 100;
        const top = Math.random() * 100;

        el.style.cssText = `
            left: ${left}%;
            top: ${top}%;
            font-size: ${size}rem;
            animation-duration: ${dur}s;
            animation-delay: ${delay}s;
            color: ${Math.random() > 0.5 ? '#1B4332' : '#ffb702'};
        `;
        container.appendChild(el);
    }
}

function renderQuickAccessCards(userData = null) {
    const container = document.getElementById('dashboardCardsGrid');
    if (!container) return;

    const userRole = (userData && userData.role) || JSON.parse(localStorage.getItem('innovateHubUser') || '{}').role;
    if (userRole !== 'mentor') return;

    const cardConfig = [
        {
            title: 'Incoming Requests',
            section: 'requests',
            desc: 'Review and approve new mentorship seeker requests',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8l2 2-2 2M17 10h5"/></svg>`,
        },
        {
            title: 'Active Mentees',
            section: 'myMentors', 
            desc: 'Foster growth in your current mentee ecosystem',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        },
        {
            title: 'Wisdom Room',
            section: 'collab',
            desc: 'Deep collaboration in your private mentorship hub',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        },
        {
            title: 'Expert Profile',
            section: 'profile',
            desc: 'Refine your expertise tokens and presence',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/></svg>`,
        }
    ];

    container.innerHTML = cardConfig.map((card, i) => `
        <article class="sanctuary-card animate-fade-in" style="animation-delay:${i * 0.1}s" 
                 onclick="window.handleCardClick('${card.section}')">
            <div class="sanctuary-card-icon">
                ${card.icon}
            </div>
            <div class="pdc-body">
                <h3 class="sanctuary-card-title">${card.title}</h3>
                <p class="sanctuary-card-desc">${card.desc}</p>
            </div>
            <div class="d-flex align-items-center justify-content-between mt-auto">
                <span class="text-uppercase fw-bold small tracking-wider" style="color:var(--forest-primary); font-size: 0.7rem;">Enter Section</span>
                <i class="fa fa-arrow-right" style="color:var(--forest-amber)"></i>
            </div>
        </article>
    `).join('');

    window.handleCardClick = function(section) {
        console.log("Mentor Dashboard: Navigation to", section);
        window.showDashboardSection(section);
        if (section === 'collab') {
            if (window.CollaborationHub) window.CollaborationHub.init();
        } else if (section === 'requests') {
            // Fixed typo: was fetchMentorshipRequests
            if (window.dashboard && typeof window.dashboard.loadRequests === 'function') {
                window.dashboard.loadRequests();
            }
        }
    };
}


class MentorDashboard {
  constructor() {
    this.currentUser = null;
    this.onboardingStep = 1;
    this.totalSteps = 6; // Increased from 5
    this.onboardingData = {};
  }

  async init(user, userData) {
    console.log("Mentor Dashboard: Initializing with provided data...");
    this.currentUser = user;
    
    // Attempt Supabase sync but don't let it block the whole dashboard if it fails
    try {
        if (window.SupabaseService) {
            // Fetch first to avoid overwriting existing completion status with false
            const existingProfile = await window.SupabaseService.getProfile(user.uid);
            const isComplete = existingProfile?.profile_complete || userData?.profileComplete || userData?.profile_complete || false;
            
            await window.SupabaseService.upsertProfile({
                id: user.uid,
                full_name: userData?.fullName || user.displayName || user.email.split('@')[0],
                email: user.email,
                // role removed to prevent overwrites
                status: existingProfile?.status || userData?.status || 'active',
                profile_complete: isComplete,
                avatar_url: userData?.photoUrl || userData?.photoURL || user.photoURL || ''
            });
        }
    } catch (sbErr) { console.warn("Mentor Dashboard: Supabase profile sync skipped:", sbErr); }

    try {
        const isReady = await this.checkProfileCompletion(userData);
        if (!isReady) {
            console.log("Mentor Dashboard: Profile not ready (pending or onboarding), stopping further init.");
            return;
        }

            await this.initializeUI(userData);

        // Forest Sanctuary Background
        initBackgroundSymbols();

        this.updateProfileCompleteness(userData);
        this.loadDashboardData();
    } catch (err) {
        console.error("Error initializing mentor dashboard:", err);
        // Fallback: try to initialize UI anyway if we have some data
        if (userData) {
            await this.initializeUI();
            this.loadDashboardData();
        }
    }
  }

  async checkProfileCompletion(providedData = null) {
    try {
      // Fetch latest from Supabase
      const sbProfile = await window.SupabaseService.getProfile(this.currentUser.uid);
      const userData = sbProfile || providedData;

      if (userData) {
        const status = userData.status || userData.mentorStatus || userData.approvalStatus || "";
        const isApproved = userData.isApproved === true || status === "approved" || status === "active";
        const isComplete = userData.profile_complete === true || userData.profileComplete === true;
        
        const onboardingContainer = document.getElementById('onboarding-content');
        const dashContent = document.getElementById('dashboard-content');
        const landingCards = document.getElementById("dashboardQuickAccess");

        // Gating Logic: If NOT approved OR NOT complete, lock the dashboard
        if (!isApproved || !isComplete) {
            console.log("MentorDashboard: Gating active. Approved:", isApproved, "Complete:", isComplete);
            
            // 1. Show dashboard but prepare for locking
            if (dashContent) {
                dashContent.style.display = 'block';
                dashContent.style.visibility = 'visible';
                dashContent.style.opacity = '1';
            }
            if (landingCards) landingCards.style.display = 'block';
            
            // 2. Render the lock UI and Progress Bar
            this.renderProfileCompletion(userData, isApproved, isComplete);
            
            // 3. Apply locking to specific cards (except Profile and Nuru)
            this.applyDashboardLocking();
            
            // 4. If not approved, show a small "Awaiting Approval" banner if they ARE complete
            if (isApproved && !isComplete) {
                // They are approved but haven't finished the wizard
                // We could show the wizard inline or just let them use the Profile section
            }
            
            return true; // Return true to allow init to continue (but locked)
        }

        // Fully approved and complete
        console.log("Mentor Dashboard: Access granted.");
        const lockBar = document.getElementById('mentorProfileCompletion');
        if (lockBar) lockBar.style.display = 'none';
        
        if (dashContent) {
            dashContent.style.display = 'block';
            dashContent.style.visibility = 'visible';
        }
        
        this.unlockDashboard();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error in checkProfileCompletion:", err);
      return false;
    }
  }

  renderProfileCompletion(data, isApproved, isComplete) {
    const container = document.getElementById('mentorProfileCompletion');
    if (!container) return;
    container.style.display = 'block';

    // Calculate completion
    let filledFields = 0;
    const fields = [
        { key: 'full_name', label: 'Basic Info' },
        { key: 'bio', label: 'Bio' },
        { key: 'profession', label: 'Profession' },
        { key: 'expertise', label: 'Expertise' },
        { key: 'experience', label: 'Experience' },
        { key: 'availability', label: 'Availability' },
        { key: 'avatar_url', label: 'Photo' },
        { key: 'status', label: 'Approval' }
    ];

    if (data.full_name || data.fullName) filledFields++;
    if (data.bio) filledFields++;
    if (data.profession) filledFields++;
    if (data.expertise && (Array.isArray(data.expertise) ? data.expertise.length > 0 : data.expertise.length > 5)) filledFields++;
    if (data.experience) filledFields++;
    if (data.availability || data.meeting_link) filledFields++;
    if (data.avatar_url || data.photoUrl) filledFields++;
    if (isApproved) filledFields++;

    const percentage = Math.round((filledFields / fields.length) * 100);
    
    let statusMessage = "";
    if (!isComplete) {
        statusMessage = "Please complete your profile to unlock all features.";
    } else if (!isApproved) {
        statusMessage = "Profile complete! Awaiting admin approval (usually 24-48h).";
    }

    container.innerHTML = `
        <div class="profile-completion-wrapper">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="completion-status-text">
                    <i class="fa ${isComplete ? 'fa-check-circle' : 'fa-info-circle'} me-2"></i>
                    ${statusMessage}
                </div>
                <div class="fw-bold" style="color:var(--brand-green)">${percentage}%</div>
            </div>
            <div class="progress-container">
                <div class="progress-bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="step-indicator">
                ${fields.map((f, i) => {
                    const isStepFilled = i < filledFields;
                    const isCurrent = i === filledFields;
                    return `
                        <div class="step-item ${isStepFilled ? 'completed' : ''} ${isCurrent ? 'active' : ''}">
                            <div class="step-dot"></div>
                            <span>${f.label}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
  }

  applyDashboardLocking() {
    // Select all dashboard cards except Profile and empty/placeholder ones
    const cards = document.querySelectorAll('.dashboard-card, .dash-nav-card');
    cards.forEach(card => {
        // Skip Profile card and Nuru (nuru is usually a floating button or fixed)
        const text = card.textContent.toLowerCase();
        if (text.includes('profile') || text.includes('settings') || card.id === 'nuruControl') {
            return;
        }

        card.classList.add('is-locked');
        
        // Add overlay if not present
        if (!card.querySelector('.dashboard-locked-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'dashboard-locked-overlay';
            overlay.innerHTML = `
                <div class="lock-message">
                    <i class="fa fa-lock fa-2x mb-2" style="color:var(--brand-yellow)"></i>
                    <div class="small fw-bold">Section Locked</div>
                </div>
            `;
            card.appendChild(overlay);
        }
    });
  }

  unlockDashboard() {
    const cards = document.querySelectorAll('.is-locked');
    cards.forEach(card => {
        card.classList.remove('is-locked');
        const overlay = card.querySelector('.dashboard-locked-overlay');
        if (overlay) overlay.remove();
    });
  }

  syncProfileHeaderUI(data) {
    const realName = data.full_name || data.fullName || 'Mentor';
    const realAvatar = data.avatar_url || data.photoUrl || '';
    
    // Sync with profile header card (The one with USIU placeholder)
    const profileHeaderName = document.querySelector('.profile-header-premium h2');
    const profileHeaderOrg = document.querySelector('.profile-header-premium p');
    if (profileHeaderName) profileHeaderName.textContent = realName;
    if (profileHeaderOrg) profileHeaderOrg.textContent = data.profession || data.expertise?.join(', ') || 'Professional Mentor';

    const profilePreview = document.getElementById('profilePreview');
    if (profilePreview && realAvatar) profilePreview.src = realAvatar;
  }

  updateProfileCompleteness(userData) {
    if (!userData) return;
    
    document.getElementById("mentorCompleteness").style.display = "block";
    
    let filledFields = 0;
    const data = userData;
    if (data.full_name || data.fullName) filledFields++;
    if (data.bio) filledFields++;
    if (data.profession) filledFields++;
    if ((data.expertise && data.expertise.length > 0)) filledFields++;
    if (data.availability || data.meetingLink) filledFields++;
    if (data.experience) filledFields++;
    if (data.communication_preference || data.communicationPreference) filledFields++;
    if (data.avatar_url || data.photoUrl) filledFields++; 
    
    const totalFieldsCount = 8; 
    const percentage = Math.round((filledFields / totalFieldsCount) * 100);
    
    const fill = document.getElementById("completenessFill");
    const text = document.getElementById("completenessText");
    
    if (fill) fill.style.width = percentage + "%";
    if (text) text.textContent = percentage + "%";
    
    if (percentage === 100 && !data.profileComplete && !data.profile_complete) {
        window.SupabaseService.upsertProfile({ id: this.currentUser.uid, profile_complete: true });
    }
  }

  updateUserIdentity(name, avatar) {
    const el = document.getElementById("userDisplayName");
    if (el) el.textContent = name;
    
    // ── Update Sanctuary Greeting ───────────────────────────────
    const dashGreeting = document.getElementById('dashboardGreeting');
    if (dashGreeting) {
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
        dashGreeting.textContent = `Good ${timeOfDay}, ${name.split(' ')[0]}`;
    }

    // Refresh Profile Circle Initials
    if (window.StaggeredMenu && window.StaggeredMenu.updateInitials) {
        window.StaggeredMenu.updateInitials(name, avatar);
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

  showOnboardingInline() {
    const onboardingEl = document.getElementById("onboarding-content");
    if (!onboardingEl) {
        console.error("MentorDashboard: onboarding-content element not found!");
        return;
    }

    onboardingEl.style.display = "block";
    onboardingEl.style.zIndex = "100"; // Top of the stack on the dashboard
    
    // Removed window.StaggeredMenu.hide() to keep the navbar accessible during onboarding
    
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
        title.textContent = "Step 1: Profile Photo";
        html = `
                    <div class="mb-3">
                        <label class="form-label">Professional Profile Photo</label>
                        <p class="text-muted small">A professional photo helps innovators build trust with you.</p>
                        <div id="photoUploadContainer" class="p-3 border rounded-3 bg-light text-center">
                            <!-- FileUploadComponent will be mounted here -->
                        </div>
                    </div>
                `;
        // We'll initialize the component after mounting HTML
        setTimeout(() => {
            window._mentorPhotoUpload = new FileUploadComponent("photoUploadContainer", {
                maxFiles: 1,
                maxSizeMB: 2,
                acceptedTypes: ['jpg', 'jpeg', 'png'],
                onFilesChanged: (meta) => {
                    this.onboardingData.photoMeta = meta[0];
                }
            });
        }, 0);
        break;
      case 2:
        title.textContent = "Step 2: Areas of Expertise";
        html = `
                    <div class="mb-3">
                        <label class="form-label">Select your areas of expertise (Multi-select)</label>
                        <div class="expertise-grid">
                            ${this.renderCheckbox("expertise", "Technology")}
                            ${this.renderCheckbox("expertise", "Healthcare")}
                            ${this.renderCheckbox("expertise", "Education")}
                            ${this.renderCheckbox("expertise", "Environment")}
                            ${this.renderCheckbox("expertise", "Business")}
                            ${this.renderCheckbox("expertise", "Marketing")}
                            ${this.renderCheckbox("expertise", "Design")}
                        </div>
                    </div>
                    <style>
                        .expertise-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                            gap: 10px;
                        }
                    </style>
                `;
        break;
      case 3:
        title.textContent = "Step 3: Experience Level";
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
      case 4:
        title.textContent = "Step 4: Mentoring Style";
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
      case 5:
        title.textContent = "Step 5: Availability";
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
      case 6:
        title.textContent = "Step 6: Industries of Interest";
        html = `
                    <div class="mb-3">
                        <label class="form-label">Industries you are interested in mentoring</label>
                        <div class="expertise-grid">
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
        // Photo handled by component - data already in this.onboardingData.photoMeta
    } else if (this.onboardingStep === 2) {
      this.onboardingData.expertise = this.getMultiSelectValues("expertise");
    } else if (this.onboardingStep === 3) {
      this.onboardingData.experience =
        document.getElementById("experienceSelect").value;
    } else if (this.onboardingStep === 4) {
      const el = document.querySelector('input[name="style"]:checked');
      if (el) this.onboardingData.style = el.value;
    } else if (this.onboardingStep === 5) {
      this.onboardingData.availability =
        document.getElementById("availabilitySelect").value;
    } else if (this.onboardingStep === 6) {
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
        '<span class="spinner-border spinner-border-sm"></span> Finalizing Profile...';
      btn.disabled = true;

      let photoUrl = null;

      // 1. Upload Photo to Supabase if provided
      if (window._mentorPhotoUpload && window._mentorPhotoUpload.files.length > 0) {
          try {
              const fileObj = window._mentorPhotoUpload.files[0].file;
              const fileName = `${this.currentUser.uid}_${Date.now()}.${fileObj.name.split('.').pop()}`;
              
              const { data, error } = await window.supabase.storage
                  .from('profiles')
                  .upload(`mentors/${fileName}`, fileObj);
              
              if (error) {
                  console.warn("Notice: Could not upload photo. Is the 'profiles' bucket created in Supabase?", error);
              } else {
                  // Get Public URL
                  const { data: publicUrlData } = window.supabase.storage
                      .from('profiles')
                      .getPublicUrl(`mentors/${fileName}`);
                  
                  photoUrl = publicUrlData.publicUrl;
              }
          } catch (e) {
              console.warn("File upload threw an exception:", e);
          }
      }

      // 2. Primary Sync: Supabase Profile
      if (window.SupabaseService) {
          const profileData = {
            id: this.currentUser.uid,
            status: "active",
            profile_complete: true,
            avatar_url: photoUrl || this.currentUser.photoURL || "",
            expertise: this.onboardingData.expertise?.join(', '),
            experience: this.onboardingData.experience,
            mentoring_style: this.onboardingData.style,
            industries_of_interest: this.onboardingData.industries?.join(', ')
          };

          if (this.onboardingData.availability) profileData.availability = this.onboardingData.availability;

          try {
              await window.SupabaseService.upsertProfile(profileData);
          } catch (err) {
              if (err.message && err.message.includes('schema cache')) {
                  console.warn("MentorDashboard: Schema cache mismatch detected. Retrying with minimal profile...");
                  // Essential fields only to bypass stale cache columns
                  await window.SupabaseService.upsertProfile({
                      id: this.currentUser.uid,
                      status: "active",
                      profile_complete: true
                  });
              } else {
                  throw err;
              }
          }
          console.log("Mentor Dashboard: Supabase Onboarding Synced ✓");
      }

      // 3. Secondary Sync: Firestore (Background) - Removed

      location.reload(); // Reload to clear modal and show dashboard
    } catch (error) {
      console.error("Onboarding failed:", error);
      alert("Failed to save profile: " + error.message);
      document.getElementById("nextStepBtn").innerHTML = "Finish";
      document.getElementById("nextStepBtn").disabled = false;
    }
  }

  // ==========================================
  // DASHBOARD CORE
  // ==========================================

  async initializeUI(userData) {
    if (this.uiInitialized) return;
    this.uiInitialized = true;

    if (userData) this.populateProfileForms(userData);

    // Navigation Logic handled in dashboard.html
    // We just need to make sure renderQuickAccessCards is called
    renderQuickAccessCards(userData);
    this.renderLandingStats();

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
    renderQuickAccessCards(userData);
    
    // Attach Event Listeners for Forms
    const scheduleForm = document.getElementById('scheduleForm');
    if(scheduleForm) scheduleForm.addEventListener('submit', (e) => this.handleScheduleUpdate(e));
    
    const profileForm = document.getElementById('profileForm');
    if(profileForm) profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
    
    // Show Preview Button for Mentors
    const previewBtn = document.getElementById('mentorPublicPreviewBtn');
    if(previewBtn) previewBtn.style.display = 'block';

    // Toggle handling
    const toggle = document.getElementById('availabilityToggle');
    if(toggle) {
        toggle.addEventListener('change', (e) => {
            const statusText = document.getElementById('availabilityText');
            if(statusText) statusText.textContent = e.target.checked ? 'Available for new mentees' : 'Not available';
            if (window.SupabaseService) {
                window.SupabaseService.upsertProfile({ id: this.currentUser.uid, is_available: e.target.checked });
            }
        });
    }

    // Profile Picture Upload Handling
    const profilePicInput = document.getElementById('profilePicInput');
    if (profilePicInput) {
        profilePicInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const preview = document.getElementById('profilePreview');
            if (preview) {
                preview.src = URL.createObjectURL(file);
                preview.style.opacity = '0.5';
            }

            try {
                const publicUrl = await window.SupabaseService.uploadAvatar(this.currentUser.uid, file);
                
                // Update Firestore - Removed

                // Sync Navbar
                window.dispatchEvent(new CustomEvent('profileUpdated', {
                    detail: {
                        fullName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
                        photoUrl: publicUrl
                    }
                }));
                
                alert('Profile picture updated successfully!');
            } catch (err) {
                console.error("Profile pic upload failed:", err);
                alert('Failed to update profile picture. Ensure your Supabase Storage has a "public-assets" bucket and it is set to public.');
            } finally {
                if (preview) preview.style.opacity = '1';
            }
        });
    }
  }

  async renderLandingStats() {
    const statsContainer = document.getElementById('landingStatsRow');
    if (!statsContainer) return;
    statsContainer.style.display = 'flex';

    try {
        // 1. Fetch Mentorships from Supabase
        const mentorships = await window.SupabaseService.getMentorships(this.currentUser.uid, 'mentor');
        const activeMentees = mentorships ? mentorships.filter(m => m.status === 'accepted').length : 0;
        const pendingRequests = mentorships ? mentorships.filter(m => m.status === 'pending_mentor').length : 0;
        const sessionCount = 24; // Mock for consistency in bento

        const menteeAvatars = mentorships.slice(0, 2).map(m => `
            <img class="w-8 h-8 rounded-full border-2 border-white" style="width:32px;height:32px;object-fit:cover;" src="${m.innovator?.avatar_url || 'https://via.placeholder.com/100'}" alt="Mentee">
        `).join('');

        statsContainer.innerHTML = `
            <!-- Stat 1: Active Mentees -->
            <div class="col-md-4">
                <div class="bento-stat-card">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="bento-stat-icon-wrapper icon-prime">
                            <i class="fa fa-user-graduate"></i>
                        </div>
                        <div class="d-flex -space-x-3" style="margin-right:8px;">
                            ${menteeAvatars}
                            <div class="rounded-full bg-light d-flex align-items-center justify-content-center fw-bold" style="width:32px;height:32px;font-size:10px;border:2px solid white;">+${activeMentees > 2 ? activeMentees - 2 : 0}</div>
                        </div>
                    </div>
                    <h3 class="bento-stat-label">Active Mentees</h3>
                    <p class="bento-stat-value">${activeMentees}</p>
                    <div class="mt-3 w-100 bg-light rounded-pill overflow-hidden" style="height: 4px;">
                        <div class="h-100" style="background:var(--forest-amber); width: 60%;"></div>
                    </div>
                </div>
            </div>
            <!-- Stat 2: Pending Requests -->
            <div class="col-md-4">
                <div class="bento-stat-card">
                    <div class="bento-stat-badge badge-new">${pendingRequests} Pending</div>
                    <div class="bento-stat-icon-wrapper icon-amber">
                        <i class="fa fa-envelope-open-text"></i>
                    </div>
                    <h3 class="bento-stat-label">Requests</h3>
                    <p class="bento-stat-value">${pendingRequests}</p>
                    <p class="mt-2 small text-muted font-medium mb-0">${pendingRequests > 0 ? 'Action required in requests tab' : 'No new requests'}</p>
                </div>
            </div>
            <!-- Stat 3: Sessions -->
            <div class="col-md-4">
                <div class="bento-stat-card">
                    <div class="bento-stat-badge badge-live">ALIVE</div>
                    <div class="bento-stat-icon-wrapper icon-dark">
                        <i class="fa fa-clock"></i>
                    </div>
                    <h3 class="bento-stat-label">Sessions Logged</h3>
                    <p class="bento-stat-value">${sessionCount}</p>
                    <p class="mt-2 small text-muted font-medium mb-0">142 total impact hours</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error rendering landing stats:", error);
        statsContainer.innerHTML = ''; 
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
      // Only load modular requirements
      this.initFeatureModules()
    ]);
    
    // Ensure we are on the Home section with cards visible
    if (window.showDashboardSection) {
        window.showDashboardSection('home');
    }
  }

  async initFeatureModules() {
    if (window.SessionManager) window.SessionManager.init(this.currentUser.uid, 'mentor');
    if (window.FeedbackService) window.FeedbackService.init(this.currentUser.uid, 'mentor');
    if (window.ReportManager) window.ReportManager.init(this.currentUser.uid, 'mentor');
  }

  async initializeOverview() {
    // Ensure Overview is the default landing section for mentors
    if (window.showDashboardSection) {
        window.showDashboardSection('overview');
    }
  }

  async loadStats() {
    try {
      let pending = 0;
      let accepted = 0;

      // 1. Fetch from Supabase (Single Source of Truth)
      if (window.SupabaseService) {
          const mentorships = await window.SupabaseService.getMentorships(this.currentUser.uid, 'mentor');
          if (mentorships) {
              pending = mentorships.filter(m => m.status === 'pending' || m.status === 'pending_mentor').length;
              accepted = mentorships.filter(m => m.status === 'accepted').length;
              console.log("Mentor Dashboard: Stats loaded from Supabase ✓");
          }
      }

      const totalMenteesEl = document.getElementById("totalMentees");
      const pendingRequestsEl = document.getElementById("pendingRequests");
      const requestCountEl = document.getElementById("requestCount");

      if (totalMenteesEl) totalMenteesEl.textContent = accepted;
      if (pendingRequestsEl) pendingRequestsEl.textContent = pending;
      if (requestCountEl) {
        requestCountEl.textContent = pending;
        requestCountEl.style.display = pending > 0 ? "inline-block" : "none";
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  async loadRequests() {
    const container = document.getElementById("requestsContainer");
    if (!container) return;

    container.innerHTML = EmptyStates.templates.loadingState();

    try {
      let requests = [];

      // 1. Try Supabase First
      if (window.SupabaseService) {
          const sbRequests = await window.SupabaseService.getMentorships(this.currentUser.uid, 'mentor');
          if (sbRequests && sbRequests.length > 0) {
              const pendingOnly = sbRequests.filter(m => m.status === 'pending' || m.status === 'pending_mentor');
              requests = pendingOnly.map(r => ({
                  id: r.id,
                  innovatorId: r.innovator_id,
                  projectId: r.project_id,
                  status: r.status,
                  createdAt: r.created_at,
                  innovatorData: r.innovator, // Use the alias defined in SupabaseService
                  projectData: r.project      // Use the alias defined in SupabaseService
              }));
              console.log("Mentor Dashboard: Requests loaded from Supabase");
          }
      }

      // Removed Firestore fallback to ensure Supabase is the single source of truth

      if (requests.length === 0) {
        container.innerHTML = EmptyStates.templates.noRequests();
        return;
      }

      container.innerHTML = "";

      for (const request of requests) {
        try {
            let innovatorName = request.innovatorData?.full_name || request.innovatorData?.fullName || "Unknown Innovator";
            let projectTitle = request.projectData?.title || "General Mentorship";
            let category = request.projectData?.target_area || "General";
            let dateStr = request.createdAt ? (typeof request.createdAt === 'string' ? new Date(request.createdAt).toLocaleDateString() : request.createdAt.toDate().toLocaleDateString()) : "Recently";
            let avatarUrl = request.innovatorData?.avatar_url || "";

            // Firestore fallback removed

            container.innerHTML += `
                    <div class="dashboard-card mb-3">
                        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
                            <div>
                                <div class="d-flex align-items-center gap-3 mb-2">
                                    <div class="rounded-circle overflow-hidden bg-light" style="width: 40px; height: 40px; border: 1px solid #eee;">
                                        ${avatarUrl ? 
                                            `<img src="${avatarUrl}" class="w-100 h-100 object-fit-cover" alt="Avatar">` : 
                                            `<div class="w-100 h-100 d-flex align-items-center justify-content-center text-success fw-bold">${innovatorName.charAt(0)}</div>`}
                                    </div>
                                    <div>
                                        <h5 class="mb-0">${innovatorName}</h5>
                                        <span class="badge bg-light text-dark border">${category}</span>
                                    </div>
                                </div>
                                <p class="mb-1"><strong>Project:</strong> ${projectTitle}</p>
                                <p class="text-muted small mb-0">Requested: ${dateStr}</p>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-success btn-sm" onclick="window.dashboard.handleRequest('${request.id}', 'accepted')">
                                    <i class="fa fa-check me-1"></i> Accept
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="window.dashboard.handleRequest('${request.id}', 'rejected')">
                                    <i class="fa fa-times me-1"></i> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                `;
        } catch (err) {
            console.error("Error rendering request " + request.id, err);
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

      if (status === "accepted") {
        // Count current mentees via Supabase
        const mentorships = await window.SupabaseService.getMentorships(this.currentUser.uid, 'mentor');
        const acceptedCount = mentorships.filter(m => m.status === 'accepted').length;
        
        if (acceptedCount >= 2) {
          alert("You are already at your maximum capacity (2 mentees). Please reject or finish other mentorships first.");
          return;
        }
      }

      if (
        !confirm(
          `Are you sure you want to ${status} this request?`,
        )
      )
        return;

      // 1. Supabase Update (Primary)
      if (window.SupabaseService) {
          await window.SupabaseService.updateMentorshipStatus(requestId, status);
          console.log("Mentor Dashboard: Mentorship status updated in Supabase ✓");
          
          // Background sync to Firestore for legacy compatibility (Silent failure) - Removed
      }
      
      alert(`Request ${status}!`);
      this.loadStats();
      this.loadRequests();
      if (status === "accepted") {
          this.loadMentees();
          // Optional: Open Collaboration Hub automatically after a success message
          setTimeout(() => {
              if (window.CollaborationHub) {
                  window.showDashboardSection('collab');
                  window.CollaborationHub.init(requestId);
              }
          }, 1500);
      }
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
      let mentees = [];

      // 1. Try Supabase First
      if (window.SupabaseService) {
          const sbMentorships = await window.SupabaseService.getMentorships(this.currentUser.uid, 'mentor');
          if (sbMentorships && sbMentorships.length > 0) {
              const acceptedOnly = sbMentorships.filter(m => m.status === 'accepted');
              mentees = acceptedOnly.map(m => ({
                  id: m.id,
                  innovatorId: m.innovator_id,
                  projectId: m.project_id,
                  status: m.status,
                  createdAt: m.created_at,
                  innovatorData: m.innovator, // Use the alias defined in SupabaseService
                  projectData: m.project      // Use the alias defined in SupabaseService
              }));
              console.log("Mentor Dashboard: Mentees loaded from Supabase");
          }
      }

      // Removed Firestore fallback to ensure Supabase is the single source of truth

      if (mentees.length === 0) {
        container.innerHTML = `<div class="text-center py-5"><p class="text-muted">No mentees yet.</p></div>`;
        return;
      }

      container.innerHTML = '<div class="row g-4"></div>';
      const row = container.querySelector(".row");

      for (const mentee of mentees) {
        try {
            let innovator = mentee.innovatorData || { fullName: "Unknown Innovator", full_name: "Unknown Innovator" };
            let project = mentee.projectData || { 
                title: "General Mentorship", 
                problem_statement: "Direct mentorship request.", 
                target_area: "General", 
                status: "active" 
            };
            // Firestore fallbacks removed to ensure pure Supabase usage

            const innovName = innovator.fullName || innovator.full_name || "Innovator";
            const innovAvatar = innovator.photoURL || innovator.avatar_url || "";
            const projTitle = project.title || "Untitled Project";
            const projProb = project.problemStatement || project.problem_statement || "No description";
            const projCat = (project.categories && project.categories[0]) || project.target_area || "General";

            row.innerHTML += `
                    <div class="col-md-6 col-lg-4">
                        <div class="dashboard-card h-100 cursor-pointer hover-card" onclick="window.CollaborationHub.init('${mentee.id}')">
                            <div class="d-flex align-items-center mb-3">
                                <div class="me-3 d-flex align-items-center justify-content-center overflow-hidden bg-primary-soft" style="width: 50px; height: 50px; border-radius: 12px;">
                                    ${innovAvatar ? 
                                        `<img src="${innovAvatar}" class="w-100 h-100 object-fit-cover" alt="${innovName}">` : 
                                        `<span class="text-primary fw-bold">${innovName.charAt(0)}</span>`}
                                </div>
                                <div>
                                    <h5 class="mb-0">${innovName}</h5>
                                    <small class="text-muted">Innovator</small>
                                </div>
                            </div>
                            <hr class="my-2">
                            <h6 class="text-primary mb-2">${projTitle}</h6>
                            <p class="text-muted small mb-2 line-clamp-2">${projProb}</p>
                            
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <div class="small fw-bold text-dark">Category</div>
                                    <span class="badge bg-light text-dark border">${projCat}</span>
                                </div>
                                <div class="col-6">
                                    <div class="small fw-bold text-dark">Comm. Method</div>
                                    <div class="small text-muted">${innovator.communicationPreference || innovator.communication_preference || 'Any'}</div>
                                </div>
                                <div class="col-6">
                                    <div class="small fw-bold text-dark">Status</div>
                                    ${StatusBadge.render(project.status || 'active')}
                                </div>
                                <div class="col-6">
                                    <div class="small fw-bold text-dark">Next Meeting</div>
                                    <div class="small text-muted">${mentee.nextMeetingDate || mentee.next_meeting_date || 'Not scheduled'}</div>
                                </div>
                            </div>
 
                            <div class="d-grid gap-2">
                                <button class="btn btn-sm btn-primary rounded-pill mb-1">
                                    Open Collaboration Hub
                                </button>
                                <button class="btn btn-sm btn-outline-danger w-100 rounded-pill" onclick="event.stopPropagation(); window.dashboard.openRejectionModal('${mentee.id}')">
                                    <i class="fa fa-times-circle me-1"></i>Request to Stop
                                </button>
                            </div>
                        </div>
                    </div>
                `;
        } catch (err) {
            console.error("Error rendering mentee details for " + mentee.id, err);
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
          // Notifications should also be migrated to Supabase. 
          // For now, if Supabase has a 'notifications' table, we use it.
          // Otherwise, we keep a minimal placeholder to avoid crashes.
          const { data: notifications, error } = await window.supabase
              .from('notifications')
              .select('*')
              .eq('user_id', this.currentUser.uid)
              .order('created_at', { ascending: false });
          
          if (error || !notifications || notifications.length === 0) {
               container.innerHTML = `<div class="text-center py-5"><i class="fa fa-bell-slash fa-3x text-light mb-3"></i><p class="text-muted">No notifications yet</p></div>`;
               return;
          }
          
          container.innerHTML = '';
          notifications.forEach(notif => {
              container.innerHTML += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-1">${notif.message}</h6>
                        <small class="text-muted">${new Date(notif.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
              `;
          });
          
      } catch (err) {
          console.warn("Notifications load error:", err);
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
          
          // 1. Primary Sync: Supabase
          if (window.SupabaseService) {
              await window.SupabaseService.upsertProfile({
                  id: this.currentUser.uid,
                  availability: availability,
                  meeting_link: meetingLink,
                  updated_at: new Date()
              });
              console.log("Mentor Dashboard: Supabase Schedule Updated ✓");
          }
          
          // 2. Secondary/Legacy Sync: Firestore (Silent) - Removed
          
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
          const expertise = form.expertise.value.split(',').map(s => s.trim());
          
          const profileData = {
              fullName: form.fullName.value,
              profession: form.profession.value,
              expertise: expertise,
              bio: form.bio.value,
              isAvailable: availabilityToggle, // Sync toggle here too
              updatedAt: serverTimestamp()
          };
          
          // 1. Primary Sync: Supabase
          if (window.SupabaseService) {
              await window.SupabaseService.upsertProfile({
                  id: this.currentUser.uid,
                  full_name: profileData.fullName,
                  profession: profileData.profession,
                  expertise: expertise.join(', '),
                  bio: profileData.bio,
                  is_available: profileData.isAvailable,
                  updated_at: new Date()
              });
              console.log("Mentor Dashboard: Supabase Profile Updated ✓");
          }
          
          // 2. Secondary Sync: Firestore (Silent) - Removed

            alert('Profile updated successfully!');
            // Sync with navbar & dashboard
            window.dispatchEvent(new CustomEvent('profileUpdated', {
                detail: {
                    fullName: profileData.fullName,
                    photoUrl: avatarUrl
                }
            }));
      } catch (err) {
           console.error("Profile update error:", err);
          alert("Failed to update profile.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Update Profile';
        }
    }

    openPublicProfilePreview() {
        if (window.MentorDiscovery && window.MentorDiscovery.openProfile) {
            window.MentorDiscovery.openProfile(this.currentUser.uid);
        } else {
            console.error("MentorDiscovery module not found for preview");
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
            
            // Check if this is an INITIAL rejection or an ACTIVE mentorship termination
            // We can check the status of the request first
            const mentorships = await window.SupabaseService.getMentorships();
            const currentReq = mentorships.find(m => m.id === requestId);
            
            let targetStatus = "rejected"; // Default for new requests
            if (currentReq && currentReq.status === 'accepted') {
                targetStatus = "pending_admin_rejection"; // Admin must dissolve active ones
            }

            // 1. Update Supabase
            if (window.SupabaseService) {
                await window.SupabaseService.updateMentorshipStatus(requestId, targetStatus, {
                    rejection_reason: reason,
                    rejection_requested_at: new Date().toISOString()
                });
            }

            modalInstance.hide();
            
            if (targetStatus === "rejected") {
                alert('Request rejected successfully.');
            } else {
                alert('Your request to stop mentorship has been submitted for admin review.');
            }
            
            // Reload UI
            this.loadRequests();
            this.loadMentees();
            this.loadStats();

        } catch (error) {
            console.error("Error submitting rejection:", error);
            alert("Failed to submit rejection: " + error.message);
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = 'Submit Rejection Request';
        }
    }

    showPendingApprovalUI() {
        // Hide dashboard content
        const dashContent = document.getElementById("dashboard-content");
        const landingCards = document.getElementById("dashboardQuickAccess");
        if (dashContent) dashContent.style.display = "none";
        if (landingCards) landingCards.style.display = "none";

        // Show a premium "Awaiting Approval" message
        const welcomeContainer = document.querySelector('body');
        const pendingOverlay = document.createElement('div');
        pendingOverlay.id = "pendingApprovalOverlay";
        pendingOverlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(10px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
        `;
        
        pendingOverlay.innerHTML = `
            <div class="card border-0 shadow-lg p-5 rounded-4" style="max-width: 500px; background: white;">
                <div class="mb-4">
                    <div class="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                </div>
                <h2 class="fw-bold mb-3" style="color: #1a5e4f;">Account Pending Approval</h2>
                <p class="text-muted mb-4">Welcome to Innovate Hub! Your application is currently being reviewed by our Admin team. You'll receive full access to the dashboard once approved.</p>
                <div class="d-grid">
                    <button class="btn btn-outline-secondary py-3 rounded-pill fw-bold" onclick="logout()">Sign Out</button>
                </div>
                <div class="mt-4 small text-muted">
                    Usually takes 24-48 hours. Thank you for your patience!
                </div>
            </div>
        `;
        
        welcomeContainer.appendChild(pendingOverlay);
    }
}

// Export init function for dashboard.html
export async function initDashboard(user, userData) {
    if (!window.dashboard) window.dashboard = new MentorDashboard();
    await window.dashboard.init(user, userData);
    
    // Initialize Dashboard Charts
    if (window.DashboardCharts) {
        window.DashboardCharts.init('mentor', user.uid);
    }

    // Initialize New Feature Modules
    if (window.SessionManager) window.SessionManager.init(user.uid, 'mentor');
    if (window.FeedbackService) window.FeedbackService.init(user.uid, 'mentor');
    if (window.ReportManager) window.ReportManager.init(user.uid, 'mentor');

    // Render Landing Stats
    if (window.dashboard && window.dashboard.renderLandingStats) {
        await window.dashboard.renderLandingStats();
    }

    // Render Quick Access Cards
    if (typeof renderQuickAccessCards === 'function') {
        renderQuickAccessCards(userData);
    }

    // Expose My Mentees loader (using same ID as innovator for dashboard-switch symmetry)
    window.renderMyMentors = () => {
        if (window.dashboard && window.dashboard.loadMentees) {
            window.dashboard.loadMentees();
        }
    };
}


// Initial instance for window access (legacy)
window.dashboard = window.dashboard || new MentorDashboard();

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
    { title: 'Requests',         id: 'requests', section: 'requests',      types: ['New', 'Review'],    icon: 'requests' },
    { title: 'My Mentees',       id: 'mentees',  section: 'mentees',       types: ['Manage', 'Active'], icon: 'mentees'  },
    { title: 'Schedule',         id: 'schedule', section: 'schedule',      types: ['Time', 'Meetings'], icon: 'schedule' },
    { title: 'Account Settings', id: 'profile',  section: 'profile',       types: ['Profile', 'Settings'], icon: 'profile'  }
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

function renderQuickAccessCards(profileComplete = false) {
    const container = document.getElementById('dashboardCardsGrid');
    if (!container) return;

    // ── Inline Stats Row (replaces hidden overviewSection) ────────
    const statsHtml = `
        <div class="mentor-inline-stats" id="mentorInlineStats" style="
            background: linear-gradient(135deg, var(--brand-green) 0%, var(--brand-green-2, #14493e) 100%);
            border-radius: 20px;
            padding: 28px 32px;
            color: white;
            display: flex;
            gap: 0;
            align-items: center;
            margin-bottom: 0;
            box-shadow: 0 10px 40px rgba(26,94,79,0.2);
            position: relative;
            overflow: hidden;
        ">
            <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:rgba(255,255,255,0.04);border-radius:50%;pointer-events:none;"></div>
            <div style="flex:1;text-align:center;padding:0 20px;border-right:1px solid rgba(255,255,255,0.15);">
                <div id="totalMentees" style="font-family:var(--font-head);font-size:2.5rem;font-weight:900;color:var(--brand-yellow,#f3a813);line-height:1;">—</div>
                <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:0.8;margin-top:6px;">Active Mentees</div>
            </div>
            <div style="flex:1;text-align:center;padding:0 20px;border-right:1px solid rgba(255,255,255,0.15);">
                <div id="pendingRequests" style="font-family:var(--font-head);font-size:2.5rem;font-weight:900;color:var(--brand-yellow,#f3a813);line-height:1;">—</div>
                <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:0.8;margin-top:6px;">Pending Requests</div>
            </div>
            <div style="flex:1;text-align:center;padding:0 20px;">
                <div id="completedProjects" style="font-family:var(--font-head);font-size:2.5rem;font-weight:900;color:var(--brand-yellow,#f3a813);line-height:1;">0</div>
                <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:0.8;margin-top:6px;">Impact Created</div>
            </div>
        </div>
    `;

    // ── Lock gate ────────────────────────────────────────────────
    const locked = !profileComplete;

    const cardsHtml = dashboardCards.map(card => {
        const lockOverlay = locked ? `
            <div style="
                position:absolute;inset:0;border-radius:20px;
                background:rgba(255,255,255,0.85);
                backdrop-filter:blur(4px);
                display:flex;flex-direction:column;
                align-items:center;justify-content:center;
                z-index:10;gap:8px;
            ">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a5e4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style="font-family:var(--font-head);font-weight:800;font-size:0.78rem;text-transform:uppercase;letter-spacing:1px;color:#1a5e4f;text-align:center;padding:0 16px;">Complete your profile to unlock</span>
            </div>` : '';

        const clickAction = locked
            ? `window.dashboard && window.dashboard.showOnboardingModal()`
            : `window.showDashboardSection('${card.section}')`;

        return `
            <article class="premium-card" style="cursor:pointer;" onclick="${clickAction}">
                ${lockOverlay}
                <div class="premium-card-icon">
                    ${CARD_ICONS[card.id] || CARD_ICONS['profile']}
                </div>
                <div class="tc-content">
                    <div class="tc-header">
                        <h3 class="tc-title" style="font-family:var(--font-head);font-weight:800;font-size:1.4rem;color:var(--brand-green);">${card.title}</h3>
                        <div class="tc-arrow">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                                <polyline points="12 5 19 12 12 19"/>
                            </svg>
                        </div>
                    </div>
                    <div class="tc-tags" style="margin-top:8px;display:flex;gap:8px;">
                        ${card.types.map(t => `<span class="badge" style="background:rgba(26,94,79,0.05);color:var(--brand-green);font-size:0.7rem;font-weight:700;text-transform:uppercase;padding:4px 10px;border-radius:20px;">${t}</span>`).join('')}
                    </div>
                    ${locked ? '<div style="margin-top:12px;font-size:0.78rem;color:#aaa;display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Locked</div>' : ''}
                </div>
            </article>
        `;
    }).join('');

    // Put stats in first grid column spanning all cols, then cards
    container.innerHTML = `
        <div style="grid-column:1/-1;">${statsHtml}</div>
        ${cardsHtml}
    `;

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

      let mStatus = userData.status || userData.mentorStatus || userData.approvalStatus || null;
      let isApproved = userData.isApproved === true || mStatus === 'approved';

      if (!isApproved) {
        // Inject global "Kill Switch" CSS to ensure NO leakage even if other scripts run
        if (!document.getElementById("mentorApprovalKillSwitch")) {
            const killStyle = document.createElement('style');
            killStyle.id = "mentorApprovalKillSwitch";
            killStyle.innerHTML = `
                #dashboardQuickAccess, #activeSectionContainer, #dashboard-content, #mentorCompleteness, .dashboard-grid-container {
                    display: none !important;
                }
                body::after {
                    content: '';
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: white;
                    z-index: 1; /* Below the gate but above content */
                }
            `;
            document.head.appendChild(killStyle);
        }

        // Show Admin Approval Gate
        if (document.getElementById("adminApprovalGate")) {
            document.getElementById("adminApprovalGate").style.setProperty("display", "block", "important");
            document.getElementById("adminApprovalGate").style.zIndex = "10";
        }

        console.warn("Mentor Dashboard: Access blocked - Account pending approval.");
        return; 
      }
      
      // If we reach here, user IS approved - remove kill switch if it exists
      document.getElementById("mentorApprovalKillSwitch")?.remove();

      this.profileComplete = userData.profileComplete === true;

      // Always show dashboard quick access for approved mentors so they see locked cards
      if (document.getElementById("dashboardQuickAccess")) {
          document.getElementById("dashboardQuickAccess").style.display = "block";
      }

      if (!userData.profileComplete) {
        this.showOnboardingModal();
      } else {
        // Only show main content (sections) if profile complete
        if (document.getElementById("dashboard-content")) document.getElementById("dashboard-content").style.display = "block";
      }

      // Update User Identity in Sidebar
      this.updateUserIdentity(
        userData.fullName || this.currentUser.displayName || this.currentUser.email.split('@')[0],
      );
      
      // Populate Profile Forms with existing data
      this.populateProfileForms(userData);

    } catch (err) {
      console.error("Error checking profile completion:", err);
    }
  }

  updateProfileCompleteness(userData) {
    if (!userData) return;
    
    // Show both trackers if they exist
    const heroTracker = document.getElementById("mentorCompleteness");
    const profileTracker = document.getElementById("mentorCompletenessProfile");
    if (heroTracker) heroTracker.style.display = "block";
    if (profileTracker) profileTracker.style.display = "block";
    
    let filledFields = 0;
    const fields = [
        userData.fullName,
        userData.bio,
        userData.institution,
        (userData.categories && userData.categories.length > 0),
        userData.experience,
        userData.style,
        userData.availability,
        userData.meetingLink
    ];
    
    filledFields = fields.filter(f => !!f).length;
    const totalFieldsCount = fields.length;
    const percentage = Math.round((filledFields / totalFieldsCount) * 100);
    
    // Update Hero Tracker
    const fillHero = document.getElementById("completenessFillHero");
    const textHero = document.getElementById("completenessTextHero");
    const statusText = document.getElementById("completenessStatusText");
    
    if (fillHero) fillHero.style.width = percentage + "%";
    if (textHero) textHero.textContent = percentage + "%";
    if (statusText) {
        if (percentage < 100) {
            statusText.innerHTML = `
                <div class="d-flex align-items-center justify-content-between mt-2">
                    <span class="text-white-50">Profile incomplete</span>
                    <button class="btn btn-sm btn-warning fw-bold px-3 py-1 rounded-pill pulsate-button" 
                            style="font-size: 0.7rem;" 
                            onclick="window.dashboard.showOnboardingModal()">
                        CLICK TO COMPLETE
                    </button>
                </div>
            `;
            // Add pulsate animation if not exists
            if (!document.getElementById('pulsateStyle')) {
                const s = document.createElement('style');
                s.id = 'pulsateStyle';
                s.innerHTML = `
                    @keyframes pulsate-b {
                        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(243, 168, 19, 0.4); }
                        50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(243, 168, 19, 0); }
                        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(243, 168, 19, 0); }
                    }
                    .pulsate-button { animation: pulsate-b 2s infinite ease-in-out; }
                    .completeness-card { transition: all 0.3s ease; }
                    .completeness-card:hover { transform: translateY(-3px); border: 1px solid var(--brand-yellow); }
                `;
                document.head.appendChild(s);
            }
        } else {
            statusText.textContent = "Your profile is 100% complete and discoverable.";
        }
    }

    // Update Profile Section Tracker
    const fillProfile = document.getElementById("completenessFillProfile");
    const textProfile = document.getElementById("completenessTextProfile");
    
    if (fillProfile) fillProfile.style.width = percentage + "%";
    if (textProfile) textProfile.textContent = percentage + "%";
    
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
      if (data.photoURL) {
          const preview = document.getElementById('profilePreview');
          if (preview) preview.src = data.photoURL;
      }
      
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
    const bootstrapRef = window.bootstrap || (typeof bootstrap !== 'undefined' ? bootstrap : null);
    if (!bootstrapRef) {
        console.error("Mentor Dashboard: Bootstrap library not found! Ensure bootstrap.bundle.min.js is loaded in dashboard.html head.");
        alert("System Error: Required libraries not loaded. Please refresh the page.");
        return;
    }
    
    setTimeout(() => {
        const modal = new bootstrapRef.Modal(
          document.getElementById("onboardingModal"),
          {
            backdrop: "static",
            keyboard: false,
          },
        );
        
        // Hide navbar to reduce distraction during onboarding
        if (window.StaggeredMenu) window.StaggeredMenu.hide();
        
        modal.show();
        this.renderOnboardingStep();
    }, 0);

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
    const stepNum = document.getElementById("currentStepNum");
    const title = document.getElementById("onboardingTitle");

    // Update Progress UI
    const percent = (this.onboardingStep / this.totalSteps) * 100;
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (stepNum) stepNum.textContent = this.onboardingStep;

    let html = "";

    switch (this.onboardingStep) {
      case 1:
        title.textContent = "Tell us about yourself";
        html = `
            <div class="mb-4">
                <label class="form-label fw-bold">Full Name</label>
                <input type="text" class="form-control form-control-lg" id="ob-fullName" value="${this.onboardingData.fullName || this.currentUser.displayName || ''}" placeholder="Enter your full name">
            </div>
            <div class="mb-4">
                <label class="form-label fw-bold">Professional Bio</label>
                <textarea class="form-control" id="ob-bio" rows="3" placeholder="A brief summary of your background and what you offer to mentees...">${this.onboardingData.bio || ''}</textarea>
            </div>
            <div class="mb-0">
                <label class="form-label fw-bold">Institution / Workplace</label>
                <input type="text" class="form-control" id="ob-institution" value="${this.onboardingData.institution || ''}" placeholder="Where do you currently work or study?">
            </div>
        `;
        break;
      case 2:
        title.textContent = "Select your specialization";
        const cats = ['AI', 'Software', 'Agriculture', 'Healthcare', 'Business', 'Education', 'Finance', 'Marketing', 'Strategy', 'Legal', 'Operations', 'Social', 'Sustainability'];
        html = `
            <p class="text-muted small mb-4">Choose the primary categories you can mentor in. This helps innovators find you.</p>
            <div class="d-flex flex-wrap gap-2">
                ${cats.map(c => `
                    <input type="checkbox" class="btn-check" name="ob-categories" id="ob-cat-${c}" value="${c}" ${ (this.onboardingData.categories || []).includes(c) ? 'checked' : '' }>
                    <label class="btn btn-outline-primary rounded-pill px-3" for="ob-cat-${c}">${c}</label>
                `).join('')}
            </div>
        `;
        break;
      case 3:
        title.textContent = "Expertise & Style";
        html = `
            <div class="mb-4">
                <label class="form-label fw-bold">Years of Experience</label>
                <select class="form-select form-select-lg" id="ob-experience">
                    <option value="1-3" ${this.onboardingData.experience === '1-3' ? 'selected' : ''}>1-3 Years</option>
                    <option value="4-7" ${this.onboardingData.experience === '4-7' ? 'selected' : ''}>4-7 Years</option>
                    <option value="8-10" ${this.onboardingData.experience === '8-10' ? 'selected' : ''}>8-10 Years</option>
                    <option value="10+" ${this.onboardingData.experience === '10+' ? 'selected' : ''}>10+ Years</option>
                </select>
            </div>
            <div class="mb-0">
                <label class="form-label fw-bold">Preferred Mentoring Style</label>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="ob-style" value="Hands-on" id="style1" ${this.onboardingData.style === 'Hands-on' ? 'checked' : ''}>
                    <label class="form-check-label" for="style1"><strong>Hands-on</strong>: Code reviews, technical debugging, direct guidance</label>
                </div>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="ob-style" value="Strategic" id="style2" ${this.onboardingData.style === 'Strategic' ? 'checked' : ''}>
                    <label class="form-check-label" for="style2"><strong>Strategic</strong>: High-level advice, business strategy, career growth</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="ob-style" value="Hybrid" id="style3" ${(!this.onboardingData.style || this.onboardingData.style === 'Hybrid') ? 'checked' : ''}>
                    <label class="form-check-label" for="style3"><strong>Hybrid</strong>: A mix of both technical and strategic support</label>
                </div>
            </div>
        `;
        break;
      case 4:
        title.textContent = "Scheduling & Availability";
        html = `
            <div class="mb-4">
                <label class="form-label fw-bold">Weekly Slots</label>
                <textarea class="form-control" id="ob-availability" rows="2" placeholder="e.g. Mon, Wed: 4 PM - 6 PM (EAT)">${this.onboardingData.availability || ''}</textarea>
            </div>
            <div class="mb-0">
                <label class="form-label fw-bold">Default Meeting Link (Zoom/Meet)</label>
                <input type="url" class="form-control" id="ob-meetingLink" value="${this.onboardingData.meetingLink || ''}" placeholder="https://zoom.us/j/...">
                <p class="text-muted small mt-2">This link will be automatically shared with innovators who request your mentorship.</p>
            </div>
        `;
        break;
      case 5:
        title.textContent = "Profile Photo & Review";
        html = `
            <!-- Photo Upload -->
            <div class="mb-4">
                <label class="form-label fw-bold">Profile Photo <span class="text-muted fw-normal">(optional but recommended)</span></label>
                <div class="d-flex align-items-center gap-4">
                    <div id="ob-photoPreviewWrap" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--brand-green,#1a5e4f),#f3a813);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">
                        ${this.onboardingData.photoURL
                            ? `<img src="${this.onboardingData.photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
                            : `<span style="font-family:var(--font-head,sans-serif);font-weight:800;font-size:1.5rem;color:white;">${(this.onboardingData.fullName||'M')[0]}</span>`
                        }
                    </div>
                    <div style="flex:1;">
                        <input type="file" id="ob-photoInput" accept="image/*" class="form-control mb-2" />
                        <p class="text-muted small mb-0">Stored securely in Supabase. Visible to innovators on your mentor profile.</p>
                        <div id="ob-photo-status" class="small mt-1" style="color:var(--brand-green);"></div>
                    </div>
                </div>
            </div>
            <hr/>
            <!-- Review Summary -->
            <div class="review-box p-4 bg-light rounded-4 border">
                <div class="d-flex align-items-center gap-3 mb-4">
                    <div style="width:50px;height:50px;border-radius:50%;background:var(--brand-green,#1a5e4f);color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.2rem;flex-shrink:0;">
                        ${(this.onboardingData.fullName||'M')[0]}
                    </div>
                    <div>
                        <h6 class="mb-0 fw-bold">${this.onboardingData.fullName || '—'}</h6>
                        <p class="text-muted small mb-0">${this.onboardingData.institution || '—'}</p>
                    </div>
                </div>
                <div class="row g-3 small">
                    <div class="col-6"><strong>Categories:</strong><br>${(this.onboardingData.categories || []).join(', ') || '—'}</div>
                    <div class="col-6"><strong>Experience:</strong><br>${this.onboardingData.experience || '—'} Years</div>
                    <div class="col-12 border-top pt-2"><strong>Mentoring Style:</strong><br>${this.onboardingData.style || '—'}</div>
                    <div class="col-12 border-top pt-2"><strong>Availability:</strong><br>${this.onboardingData.availability || '—'}</div>
                    <div class="col-12 border-top pt-2"><strong>Meeting Link:</strong><br>${this.onboardingData.meetingLink || 'Not set'}</div>
                </div>
            </div>
            <p class="text-center mt-4 small text-muted">By clicking <strong>Finish</strong>, your profile becomes discoverable by the InnovateHub community.</p>
        `;
        break;
    }

    container.innerHTML = html;
  }

  renderCheckbox(name, value) {
    return `
            <input type="checkbox" class="btn-check" name="${name}" id="${name}-${value}" value="${value}" autocomplete="off">
            <label class="btn btn-outline-primary" for="${name}-${value}">${value}</label>
        `;
  }

  saveStepData() {
    if (this.onboardingStep === 1) {
      this.onboardingData.fullName = document.getElementById("ob-fullName").value;
      this.onboardingData.bio = document.getElementById("ob-bio").value;
      this.onboardingData.institution = document.getElementById("ob-institution").value;
    } else if (this.onboardingStep === 2) {
      this.onboardingData.categories = Array.from(document.querySelectorAll('input[name="ob-categories"]:checked')).map(cb => cb.value);
    } else if (this.onboardingStep === 3) {
      this.onboardingData.experience = document.getElementById("ob-experience").value;
      const styleEl = document.querySelector('input[name="ob-style"]:checked');
      if (styleEl) this.onboardingData.style = styleEl.value;
    } else if (this.onboardingStep === 4) {
      this.onboardingData.availability = document.getElementById("ob-availability").value;
      this.onboardingData.meetingLink = document.getElementById("ob-meetingLink").value;
    } else if (this.onboardingStep === 5) {
      // Photo upload is handled async inline — photoURL stored in this.onboardingData.photoURL
      // Nothing to read synchronously here
    }
  }

  // Called from step 5 photo input change
  async handleWizardPhotoUpload(file) {
    if (!file) return;
    const statusEl = document.getElementById('ob-photo-status');
    const previewWrap = document.getElementById('ob-photoPreviewWrap');
    if (statusEl) statusEl.textContent = 'Uploading...';

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${this.currentUser.uid}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data, error } = await window.supabase.storage
          .from('project-documents')
          .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = window.supabase.storage
          .from('project-documents')
          .getPublicUrl(filePath);

      this.onboardingData.photoURL = publicUrl;

      if (previewWrap) {
          previewWrap.innerHTML = `<img src="${publicUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
      }
      if (statusEl) statusEl.textContent = '✓ Photo uploaded successfully!';
    } catch (err) {
      console.error('Wizard photo upload failed:', err);
      if (statusEl) statusEl.style.color = '#dc3545';
      if (statusEl) statusEl.textContent = '⚠ Upload failed: ' + err.message;
    }
  }

  validateCurrentStep() {
    if (this.onboardingStep === 1) {
        if (!document.getElementById("ob-fullName").value.trim()) return "Please enter your full name.";
        if (document.getElementById("ob-bio").value.trim().length < 20) return "Please provide a bio of at least 20 characters.";
        if (!document.getElementById("ob-institution").value.trim()) return "Please enter your institution.";
    } else if (this.onboardingStep === 2) {
        const checked = document.querySelectorAll('input[name="ob-categories"]:checked');
        if (checked.length === 0) return "Please select at least one category.";
    } else if (this.onboardingStep === 4) {
        if (!document.getElementById("ob-availability").value.trim()) return "Please specify your availability.";
        const link = document.getElementById("ob-meetingLink").value.trim();
        if (link && !link.startsWith('http')) return "Please enter a valid URL for your meeting link.";
    }
    return null;
  }

  async nextStep() {
    const error = this.validateCurrentStep();
    if (error) {
        alert(error);
        return;
    }

    this.saveStepData();

    if (this.onboardingStep < this.totalSteps) {
      this.onboardingStep++;
      this.renderOnboardingStep();

      // Bind photo input on step 5 after render
      if (this.onboardingStep === 5) {
          setTimeout(() => {
              const photoInput = document.getElementById('ob-photoInput');
              if (photoInput) {
                  photoInput.addEventListener('change', (e) => {
                      const file = e.target.files[0];
                      if (file) this.handleWizardPhotoUpload(file);
                  });
              }
          }, 100);
      }
    } else {
      this.completeOnboarding();
    }

    // Update buttons
    const prevBtn = document.getElementById("prevStepBtn");
    if (prevBtn) prevBtn.style.display = this.onboardingStep === 1 ? 'none' : 'block';
    
    const nextBtn = document.getElementById("nextStepBtn");
    if (nextBtn) {
        nextBtn.innerHTML = this.onboardingStep === this.totalSteps 
            ? 'Finish <svg class="ms-1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>'
            : 'Next Step <svg class="ms-1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    }
  }

  prevStep() {
    if (this.onboardingStep > 1) {
      this.onboardingStep--;
      this.renderOnboardingStep();
    }
    const prevBtn = document.getElementById("prevStepBtn");
    if (prevBtn) prevBtn.style.display = this.onboardingStep === 1 ? 'none' : 'block';
    
    const nextBtn = document.getElementById("nextStepBtn");
    if (nextBtn) {
        nextBtn.innerHTML = 'Next Step <svg class="ms-1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    }
  }

  async completeOnboarding() {
    try {
      const btn = document.getElementById("nextStepBtn");
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
      btn.disabled = true;

      const saveData = {
          ...this.onboardingData,
          profileComplete: true,
          updatedAt: serverTimestamp(),
      };

      // If photo was uploaded in step 5, also update Firebase Auth profile
      if (this.onboardingData.photoURL) {
          try {
              const { updateProfile } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
              await updateProfile(this.currentUser, { photoURL: this.onboardingData.photoURL });
          } catch (photoErr) {
              console.warn('Could not update auth profile photo:', photoErr);
          }
      }

      await updateDoc(doc(db, "users", this.currentUser.uid), saveData);

      location.reload(); // Reload to clear modal and show unlocked dashboard
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

    // Render Quick Access Cards with profile lock state
    renderQuickAccessCards(this.profileComplete);
    
    // Attach Event Listeners for Forms
    const scheduleForm = document.getElementById('scheduleForm');
    if(scheduleForm) scheduleForm.addEventListener('submit', (e) => this.handleScheduleUpdate(e));
    
    const profileForm = document.getElementById('profileForm');
    if(profileForm) profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
    
    // Profile Picture Upload in Account Settings (post-onboarding update)
    const profilePicInput = document.getElementById('profilePicInput');
    if (profilePicInput) {
        profilePicInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const preview = document.getElementById('profilePreview');
            if (preview) preview.style.opacity = '0.5';
            try {
                const fileExt = file.name.split('.').pop();
                const filePath = `avatars/${this.currentUser.uid}-${Date.now()}.${fileExt}`;
                const { data, error } = await window.supabase.storage.from('project-documents').upload(filePath, file);
                if (error) throw error;
                const { data: { publicUrl } } = window.supabase.storage.from('project-documents').getPublicUrl(filePath);
                const { updateProfile } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
                await updateProfile(this.currentUser, { photoURL: publicUrl });
                await updateDoc(doc(db, "users", this.currentUser.uid), { photoURL: publicUrl, updatedAt: serverTimestamp() });
                if (preview) { preview.src = publicUrl; preview.style.opacity = '1'; }
                alert('Profile picture updated!');
            } catch (err) {
                console.error("Profile pic upload failed:", err);
                alert('Failed to update profile picture: ' + err.message);
                if (preview) preview.style.opacity = '1';
            }
        });
    }
    
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
                                    <h5 class="mb-0 text-primary fw-bold">${innovatorName}</h5>
                                    <span class="badge bg-light text-dark border">${category}</span>
                                </div>
                                <p class="mb-1"><strong>Project:</strong> ${projectTitle}</p>
                                <p class="text-muted small mb-0">Requested: ${dateStr}</p>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-success btn-sm rounded-pill px-3" onclick="window.dashboard.handleRequest('${requestId}', 'accepted')">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><polyline points="20 6 9 17 4 12"/></svg> Accept
                                </button>
                                <button class="btn btn-outline-danger btn-sm rounded-pill px-3" onclick="window.dashboard.handleRequest('${requestId}', 'rejected')">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject
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

            const onclickAttr = `window.CollaborationHub.init('${requestId}')`;
            const firstName = (innovator.fullName || "Innovator").split(' ')[0];
            const innovatorPhoto = innovator.photoURL || 'assets/img/default-avatar.png';

            row.innerHTML += `
                    <div class="col-md-6 col-lg-4">
                        <div class="dashboard-card premium-card hover-lift h-100 p-4 d-flex flex-column" onclick="${onclickAttr}" style="cursor: pointer;">
                            <div class="card-glow" style="background: var(--brand-green);"></div>
                            <div class="d-flex align-items-center gap-3 mb-4 position-relative z-1">
                                <div class="position-relative">
                                    <img src="${innovatorPhoto}" class="rounded-circle shadow-sm border border-2 border-white" style="width: 56px; height: 56px; object-fit: cover;">
                                    <div class="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white" style="width: 14px; height: 14px;"></div>
                                </div>
                                <div>
                                    <h6 class="fw-bold mb-0 text-dark">${firstName}</h6>
                                    <p class="text-muted smaller mb-0 fw-bold text-uppercase opacity-75" style="letter-spacing: 0.5px;">${project.categories?.[0] || 'Innovation'}</p>
                                </div>
                            </div>
                            <div class="position-relative z-1 flex-grow-1">
                                <h5 class="fw-bold mb-2 text-primary" style="font-family: var(--font-head);">${project.title}</h5>
                                <p class="text-muted small mb-4" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.6;">
                                    ${project.problemStatement || "No description provided."}
                                </p>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top position-relative z-1">
                                <div class="d-flex align-items-center gap-2 small text-muted fw-bold">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    ${request.nextMeetingDate || 'Schedule Meeting'}
                                </div>
                                <button class="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-sm">
                                    Open Hub
                                </button>
                            </div>
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

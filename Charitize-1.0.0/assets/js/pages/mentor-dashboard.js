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
    {
        title: 'Dashboard Overview',
        section: 'overview',
        subtitle: 'Performance stats & metrics',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`
    },
    {
        title: 'Mentorship Requests',
        section: 'requests',
        subtitle: 'Review USIU-A mentorship applications',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`
    },
    {
        title: 'My Mentees',
        section: 'mentees',
        subtitle: 'Manage active university innovators',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
    },
    {
        title: 'My Schedule',
        section: 'schedule',
        subtitle: 'Manage your sessions',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
    },
    {
        title: 'Account Settings',
        section: 'profile',
        subtitle: 'Profile and security',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
    }
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

    container.innerHTML = dashboardCards.map((card, i) => {
        // Add tags based on section
        let tags = [];
        if (card.section === 'requests') tags = ['Review', 'New'];
        else if (card.section === 'mentees') tags = ['Active', 'Teams'];
        else if (card.section === 'profile') tags = ['Board', 'Expert'];
        else if (card.section === 'notifications') tags = ['Alerts', 'Inbox'];

        return `
        <article
            class="dash-nav-card"
            style="animation-delay:${i * 0.1}s"
            onclick="window.showDashboardSection('${card.section}')"
            tabindex="0"
            role="button"
        >
            <div class="dnc-icon">
                ${card.icon}
            </div>
            <div class="dnc-content">
                <h3 class="dnc-title">${card.title}</h3>
                <p class="dnc-desc">${card.subtitle}</p>
                <div class="card-tags">
                    ${tags.map(t => `<span class="card-tag">• ${t}</span>`).join('')}
                </div>
            </div>
            <div class="dnc-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </div>
        </article>
    `; }).join('');
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
          console.log("MentorDashboard: Profile incomplete, gating access...");
          this.showOnboardingModal();
          
          // Strictly hide main content until complete
          const dashContent = document.getElementById("dashboard-content");
          const landingCards = document.getElementById("dashboardQuickAccess");
          if (dashContent) dashContent.style.display = "none";
          if (landingCards) landingCards.style.display = "none";
          
          // Disable background interactions
          document.body.style.overflow = 'hidden';
        } else {
          console.log("MentorDashboard: Profile complete, showing dashboard.");
          const dashContent = document.getElementById("dashboard-content");
          const landingCards = document.getElementById("dashboardQuickAccess");
          if (dashContent) {
              dashContent.style.display = "block";
              dashContent.style.visibility = "visible";
          }
          if (landingCards) landingCards.style.display = "block";
          document.body.style.overflow = 'auto';
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
    
    if (userData.fullName) filledFields++;
    if (userData.bio) filledFields++;
    if (userData.profession) filledFields++;
    if (userData.expertise && userData.expertise.length > 0) filledFields++;
    if (userData.availability || userData.meetingLink) filledFields++;
    if (userData.experience) filledFields++;
    if (userData.communicationPreference) filledFields++;
    if (userData.photoUrl) filledFields++; // Added photoUrl requirement
    
    const totalFieldsCount = 8; // Increased from 7
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
                        <div class="d-flex flex-wrap gap-2">
                            ${this.renderCheckbox("expertise", "Technology")}
                            ${this.renderCheckbox("expertise", "Healthcare")}
                            ${this.renderCheckbox("expertise", "Education")}
                            ${this.renderCheckbox("expertise", "Environment")}
                            ${this.renderCheckbox("expertise", "Business")}
                            ${this.renderCheckbox("expertise", "Marketing")}
                            ${this.renderCheckbox("expertise", "Design")}
                        </div>
                    </div>
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
          const fileObj = window._mentorPhotoUpload.files[0].file;
          const fileName = `${this.currentUser.uid}_${Date.now()}.${fileObj.name.split('.').pop()}`;
          
          const { data, error } = await window.supabase.storage
              .from('profiles')
              .upload(`mentors/${fileName}`, fileObj);
          
          if (error) throw error;
          
          // Get Public URL
          const { data: publicUrlData } = window.supabase.storage
              .from('profiles')
              .getPublicUrl(`mentors/${fileName}`);
          
          photoUrl = publicUrlData.publicUrl;
      }

      // 2. Update Firestore User Profile
      await updateDoc(doc(db, "users", this.currentUser.uid), {
        ...this.onboardingData,
        photoUrl: photoUrl || "",
        status: "pending",
        profileComplete: true,
        updatedAt: serverTimestamp(),
      });

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
      this.loadNotifications(),
      this.initializeOverview()
    ]);
  }

  async initializeOverview() {
    // Ensure Overview is the default landing section for mentors
    if (window.showDashboardSection) {
        window.showDashboardSection('overview');
    }
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
      // Impact Created (completedProjectsEl) removed as per user request
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
                                <div class="d-flex align-items-center gap-3 mb-2">
                                    <div class="rounded-circle overflow-hidden bg-light" style="width: 40px; height: 40px; border: 1px solid #eee;">
                                        ${innovatorDoc.exists() && (innovatorDoc.data().photoURL || innovatorDoc.data().photoUrl) ? 
                                            `<img src="${innovatorDoc.data().photoURL || innovatorDoc.data().photoUrl}" class="w-100 h-100 object-fit-cover" alt="Avatar">` : 
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
      
      // If accepted, link the mentor to the project doc for Firestore rule permissions
      if (status === "accepted") {
        try {
          const reqSnap = await getDoc(doc(db, "mentorshipRequests", requestId));
          if (reqSnap.exists()) {
            const reqData = reqSnap.data();
            if (reqData.projectId) {
              await updateDoc(doc(db, "projects", reqData.projectId), {
                mentorId: auth.currentUser.uid
              });
              console.log("Successfully linked mentor to project doc");
            }
          }
        } catch (linkErr) {
          console.error("Failed to link mentor to project:", linkErr);
        }
      }
      
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
      // Use single-field query to avoid index issues
      const q = query(
        collection(db, "mentorshipRequests"),
        where("mentorId", "==", this.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      
      // Filter by status in JS
      const acceptedRequests = snapshot.docs.filter(d => d.data().status === 'accepted');

      if (acceptedRequests.length === 0) {
        container.innerHTML = `<div class="text-center py-5"><p class="text-muted">No mentees yet.</p></div>`;
        return;
      }

      container.innerHTML = '<div class="row g-4"></div>';
      const row = container.querySelector(".row");

      for (const docSnap of acceptedRequests) {
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
                                <div class="me-3 d-flex align-items-center justify-content-center overflow-hidden bg-primary-soft" style="width: 50px; height: 50px; border-radius: 12px;">
                                    ${innovator.photoURL || innovator.photoUrl ? 
                                        `<img src="${innovator.photoURL || innovator.photoUrl}" class="w-100 h-100 object-fit-cover" alt="${innovator.fullName}">` : 
                                        `<span class="text-primary fw-bold">${(innovator.fullName || "U").charAt(0)}</span>`}
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

      // Redirect to the new high-end collaboration screen
      if (window.showProjectCollaboration) {
        window.showProjectCollaboration(projectId);
      } else {
        console.error("CollaborationScreen component not loaded.");
      }
    } catch (error) {
      console.error("Error viewing project:", error);
    }
  }

  openCommentBox(projectId) {
      // Delegated to the new Collaboration Hub
      if (window.showProjectCollaboration) {
          window.showProjectCollaboration(projectId);
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
    
    // Initialize Dashboard Charts
    if (window.DashboardCharts) {
        window.DashboardCharts.init('mentor', user.uid);
    }
}

// Initial instance for window access
window.dashboard = window.dashboard || new MentorDashboard();

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import NotificationSystem from "./components/notification-system.js";
import StatusBadge from "./components/status-badges.js";
import EmptyStates from "./components/empty-states.js";

class MentorDashboard {
  constructor() {
    this.currentUser = null;
    this.onboardingStep = 1;
    this.totalSteps = 5;
    this.onboardingData = {};

    this.init();
  }

  init() {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return; // Redirects handled by global scripts
      
      try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === 'mentor') {
              this.currentUser = user;
              await this.checkProfileCompletion();
              await this.initializeUI(); // Wait for UI init to attach listeners
              this.loadDashboardData();
          }
      } catch (err) {
          console.error("Error verifying mentor role:", err);
      }
    });
  }

  async checkProfileCompletion() {
    try {
      const userDoc = await getDoc(doc(db, "users", this.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData.profileComplete) {
          this.showOnboardingModal();
        } else {
          document.getElementById("dashboard-content").style.display = "block";
        }

        // Update User Identity in Sidebar
        this.updateUserIdentity(
          userData.fullName || this.currentUser.displayName,
        );
        
        // Populate Profile Forms with existing data
        this.populateProfileForms(userData);
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  }

  updateUserIdentity(name) {
    const el = document.getElementById("userDisplayName");
    if (el) el.textContent = name;
  }
  
  populateProfileForms(data) {
      // Profile Form
      if(document.getElementById('profileName')) document.getElementById('profileName').value = data.fullName || '';
      if(document.getElementById('profileProfession')) document.getElementById('profileProfession').value = data.profession || '';
      if(document.getElementById('profileExpertise')) document.getElementById('profileExpertise').value = (data.expertise || []).join(', ');
      if(document.getElementById('profileBio')) document.getElementById('profileBio').value = data.bio || '';
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

    // Navigation Logic
    window.showSection = (sectionName) => {
      document
        .querySelectorAll(".dashboard-section")
        .forEach((s) => (s.style.display = "none"));
      const target = document.getElementById(`${sectionName}Section`);
      if (target) target.style.display = "block";

      document
        .querySelectorAll(".nav-link")
        .forEach((l) => l.classList.remove("active"));
      // Try to find the link that calls this section
      const link = document.querySelector(
        `.nav-link[onclick*="${sectionName}"]`,
      );
      if (link) link.classList.add("active");

      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Global Logout - Use existing window.logout if present to avoid duplication
    if (!window.logout) {
        window.logout = async () => {
          const { signOut } =
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
          await signOut(auth);
          localStorage.removeItem("innovateHubUser");
          window.location.href = "login.html";
        };
    }
    
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
      if (
        !confirm(
          `Are you sure you want to ${status === "accepted" ? "accept" : "reject"} this request?`,
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
                            <hr>
                            <h6 class="text-primary mb-2">${project.title}</h6>
                            <p class="text-muted small mb-3 line-clamp-2">${project.problemStatement || "No description"}</p>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="badge bg-light text-dark border">${project.categories?.[0] || "General"}</span>
                                ${StatusBadge.render(project.status || 'active')}
                            </div>
                            <button class="btn btn-sm btn-outline-danger w-100" onclick="event.stopPropagation(); window.dashboard.openRejectionModal('${requestId}')">
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
            const { updateDoc, doc, db, serverTimestamp, addDoc, collection } = await import('./firebase-config.js');
            
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

// Initialize
window.dashboard = new MentorDashboard();

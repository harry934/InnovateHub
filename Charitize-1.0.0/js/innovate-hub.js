// ========================================
// 1. SPLASH SCREEN CONTROL (PRELOADER)
// ========================================

(function() {
    // Run immediately
    const initPreloader = () => {
        const preloader = document.getElementById("logo-preloader");
        if (!preloader) return;

        // Check Navigation Type
        const wasNavigated = sessionStorage.getItem("wasNavigated");
        
        // Clear flag immediately
        sessionStorage.removeItem("wasNavigated");

        if (wasNavigated) {
            // It was a navigation click -> DO NOTHING
            // Preloader is hidden by default in CSS
            preloader.remove();
        } else {
            // It was a Refresh or Initial Load -> SHOW PRELOADER
            preloader.classList.add("active");
            
            // Remove after animation
            setTimeout(() => {
                preloader.classList.remove("active");
                preloader.classList.add("fade-out");
                setTimeout(() => {
                    if(preloader && preloader.parentNode) preloader.remove();
                }, 1200);
            }, 2200);
        }
    };

    // Initialize as soon as DOM is ready or Script runs
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initPreloader);
    } else {
        initPreloader();
    }
})();

// Navigation listener to set flag
document.addEventListener("click", function(e) {
    const link = e.target.closest("a");
    if (link && 
        link.href && 
        link.href.includes(window.location.origin) && 
        !link.href.includes("#") && 
        link.target !== "_blank") {
        sessionStorage.setItem("wasNavigated", "true");
    }
});

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, getDoc, getDocs, collection, addDoc, updateDoc, 
    query, where, orderBy, limit, serverTimestamp, increment,
    onSnapshot, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Real-time Firebase Auth Listener
 * Synchronizes Firebase auth state with LocalStorage and UI
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is logged in
        let userData = loadFromLocalStorage("innovateHubUser");
        
        // If local data is missing or out of sync, fetch from Firestore
        if (!userData || userData.uid !== user.uid) {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    userData = { ...userDoc.data(), loggedIn: true };
                    
                    // Update lastLogin for inactivity tracking
                    await updateDoc(doc(db, "users", user.uid), {
                        lastLogin: serverTimestamp()
                    });
                    
                    saveToLocalStorage("innovateHubUser", userData);
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
            }
        }
        
        if (userData) {
            updateUIForRole(userData);
            
            // Run system checks if admin or mentor
            if (userData.role === 'admin' || userData.role === 'mentor') {
                AutomationService.checkExpirations();
                AutomationService.checkMentorInactivity();
            }
        }
    } else {
        // User is logged out
        sessionStorage.removeItem("innovateHubUser");
        resetUI();
    }
});

/**
 * Reset UI to Guest State
 */
function resetUI() {
    const guestButtons = document.getElementById("guestButtons");
    const userProfile = document.getElementById("userProfile");
    const navDashboardLink = document.getElementById("navDashboardLink");

    if (guestButtons) guestButtons.classList.remove("d-none");
    if (userProfile) userProfile.classList.add("d-none");
    if (navDashboardLink) navDashboardLink.classList.add("d-none");
}

// ========================================
// 2. SMOOTH SCROLLING FOR ANCHOR LINKS
// ========================================

/**
 * Enable smooth scrolling when clicking anchor links
 * Example: clicking a link to #about will smoothly scroll to that section
 */
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener("click", function (e) {
    // Prevent default jump behavior
    e.preventDefault();

    // Get the target element
    const targetId = this.getAttribute("href");
    const targetElement = document.querySelector(targetId);

    // Scroll smoothly to target
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth", // Smooth scroll animation
        block: "start", // Align to top of viewport
      });
    }
  });
});

// ========================================
// 3. NAVBAR SCROLL EFFECT
// ========================================

/**
 * Add shadow to navbar when scrolling down
 * Provides visual feedback that user has scrolled
 */
window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");

  // If scrolled more than 50 pixels
  if (window.scrollY > 50) {
    navbar.classList.add("shadow");
  } else {
    navbar.classList.remove("shadow");
  }
});

// ========================================
// 4. FORM VALIDATION HELPER
// ========================================

/**
 * Validate form fields before submission
 * @param {HTMLFormElement} form - The form to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateForm(form) {
  // Get all required fields
  const requiredFields = form.querySelectorAll("[required]");
  let isValid = true;

  // Check each required field
  requiredFields.forEach(function (field) {
    if (!field.value.trim()) {
      // Field is empty
      isValid = false;
      // Add error styling
      field.classList.add("is-invalid");
    } else {
      // Field has value, remove error styling
      field.classList.remove("is-invalid");
    }
  });

  return isValid;
}

// Global Exports for legacy scripts
window.showSuccessMessage = showSuccessMessage;
window.showErrorMessage = showErrorMessage;
window.validateForm = validateForm;
window.validateEmail = validateEmail;
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromLocalStorage = loadFromLocalStorage;
window.generateUniqueId = generateUniqueId;
window.formatDate = formatDate;
window.truncateText = truncateText;
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
window.showDashboardSection = showDashboardSection;

// ========================================
// 5. EMAIL VALIDATION
// ========================================

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
function validateEmail(email) {
  // Regular expression for email validation
  // Checks for: text@text.text format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ========================================
// 6. SHOW SUCCESS MESSAGE
// ========================================

/**
 * Display a success message to user
 * @param {string} message - Message to display
 */
function showSuccessMessage(message) {
  // Create alert element
  const alert = document.createElement("div");
  alert.className =
    "alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3";
  alert.style.zIndex = "9999";
  alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  // Add to page
  document.body.appendChild(alert);

  // Auto-remove after 5 seconds
  setTimeout(function () {
    alert.remove();
  }, 5000);
}

// ========================================
// 7. SHOW ERROR MESSAGE
// ========================================

/**
 * Display an error message to user
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  // Create alert element
  const alert = document.createElement("div");
  alert.className =
    "alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3";
  alert.style.zIndex = "9999";
  alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  // Add to page
  document.body.appendChild(alert);

  // Auto-remove after 5 seconds
  setTimeout(function () {
    alert.remove();
  }, 5000);
}

// ========================================
// 8. LOCAL STORAGE HELPERS
// ========================================

/**
 * Save data to sessionStorage
 * @param {string} key - Storage key
 * @param {any} data - Data to store (will be converted to JSON)
 */
function saveToLocalStorage(key, data) {
  try {
    // Convert data to JSON string
    const jsonData = JSON.stringify(data);
    // Save to sessionStorage
    sessionStorage.setItem(key, jsonData);
    return true;
  } catch (error) {
    console.error("Error saving to sessionStorage:", error);
    return false;
  }
}

/**
 * Load data from sessionStorage
 * @param {string} key - Storage key
 * @returns {any} - Retrieved data (parsed from JSON)
 */
function loadFromLocalStorage(key) {
  try {
    // Get JSON string from sessionStorage
    const jsonData = sessionStorage.getItem(key);
    // Parse and return data
    return jsonData ? JSON.parse(jsonData) : null;
  } catch (error) {
    console.error("Error loading from sessionStorage:", error);
    return null;
  }
}

// ========================================
// 9. GENERATE UNIQUE ID
// ========================================

/**
 * Generate a unique ID for projects, events, etc.
 * Format: PREFIX-TIMESTAMP-RANDOM
 * Example: PROJ-1234567890-ABC123
 * @param {string} prefix - Prefix for the ID (e.g., 'PROJ', 'EVENT')
 * @returns {string} - Unique ID
 */
function generateUniqueId(prefix) {
  // Get current timestamp
  const timestamp = Date.now();
  // Generate random string
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  // Combine into unique ID
  return `${prefix}-${timestamp}-${random}`;
}

// ========================================
// 10. FORMAT DATE
// ========================================

/**
 * Format date to readable string
 * @param {Date} date - Date object to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("en-US", options);
}

// ========================================
// 11. TRUNCATE TEXT
// ========================================

/**
 * Truncate long text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncating
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
}

// ========================================
// 12. DEBOUNCE FUNCTION
// ========================================

/**
 * Debounce function - delays execution until user stops typing/clicking
 * Useful for search inputs, resize events, etc.
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    // Clear previous timeout
    clearTimeout(timeoutId);
    // Set new timeout
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// ========================================
// 13. CHECK USER AUTHENTICATION
// ========================================

/**
 * Check if user is logged in
 * Used by dashboard pages to verify access
 * @returns {object|null} - User data if logged in, null otherwise
 */
function checkAuth() {
  const userData = loadFromLocalStorage("innovateHubUser");
  return userData;
}

/**
 * Redirect to login if not authenticated
 * Call this at the top of dashboard pages
 */
/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
  const user = checkAuth();
  if (!user || !user.loggedIn) {
    window.location.href = "login.html";
  }
  return user;
}

/**
 * Update UI based on user role
 * @param {object} user - User data object
 */
function updateUIForRole(user) {
  if (!user || !user.loggedIn) return;

  // Show user profile area
  const guestButtons = document.getElementById("guestButtons");
  const userProfile = document.getElementById("userProfile");
  const userNameSpan = document.getElementById("userName");
  const navDashboardLink = document.getElementById("navDashboardLink");

  if (guestButtons) guestButtons.classList.add("d-none");
  if (userProfile) userProfile.classList.remove("d-none");
  if (userProfile) userProfile.classList.add("d-flex");
  if (userNameSpan) userNameSpan.textContent = user.name || user.email;
  // Show "My Dashboard" link in main nav
  if (navDashboardLink) navDashboardLink.classList.remove("d-none");

  // Show role-specific navigation
  // Role-specific sidebar navigation elements
  const innovatorSidebarNav = document.getElementById("innovatorSidebarNav");
  const mentorSidebarNav = document.getElementById("mentorSidebarNav");
  const adminSidebarNav = document.getElementById("adminSidebarNav");
  const dashboardWrapper = document.getElementById("dashboardWrapper");

  // Hide main sections when dashboard is active (optional, based on preference)
  // For a true SPA dashboard, we might want to hide the hero carousel etc.
  const mainElements = [
    document.querySelector('.carousel'),
    document.querySelector('.video'),
    document.querySelector('.about'),
    document.querySelector('.service'),
    document.querySelector('.event'),
    document.querySelector('.team'),
    document.querySelector('.testimonial'),
    document.getElementById('contact')
  ];

  if (dashboardWrapper) {
    dashboardWrapper.classList.remove("d-none");
    
    // Hide standard marketing content to focus on dashboard
    mainElements.forEach(el => {
      if (el) el.classList.add("d-none");
    });

    // Show specific role sidebar
    if (user.role === "innovator") {
      if (innovatorSidebarNav) innovatorSidebarNav.classList.remove("d-none");
      showDashboardSection('myProjects'); // Default to My Projects
    } else if (user.role === "mentor") {
      if (mentorSidebarNav) mentorSidebarNav.classList.remove("d-none");
      showDashboardSection('mentorOverview');
    } else if (user.role === "admin") {
      if (adminSidebarNav) adminSidebarNav.classList.remove("d-none");
      showDashboardSection('adminOverview');
    }
  }
}

/**
 * Toggle dashboard sub-sections
 * @param {string} sectionId - ID of the section to show
 */
function showDashboardSection(sectionId) {
  const sections = [
    'innovatorOverview', 'myProjects', 'submitIdea', 'notifications',
    'mentorOverview', 'assignedProjects',
    'adminOverview', 'userManagement', 'dashboardNotificationsArea'
  ];

  // Specific mapping for 'notifications' to the global dashboardNotificationsArea
  let targetId = sectionId;
  if (sectionId === 'notifications') targetId = 'dashboardNotificationsArea';

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('d-dashboard-block');
      el.classList.add('d-dashboard-none');
    }
  });

  const target = document.getElementById(targetId);
  if (target) {
    target.classList.remove('d-dashboard-none');
    target.classList.add('d-dashboard-block');
  }

  // Update active state in sidebar
  const navLinks = document.querySelectorAll('.dashboard-sidebar-nav .nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    // Simple check if the link's onclick contains the sectionId
    if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(sectionId)) {
      link.classList.add('active');
    }
  });
}

/**
 * Logout user
 * Clears user data and redirects to homepage
 */
window.logout = async function logout() {
    try {
        await signOut(auth);
        // sessionStorage is cleared by the onAuthStateChanged listener
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout error:", error);
        sessionStorage.removeItem("innovateHubUser");
        window.location.href = "index.html";
    }
}

// ========================================
// 14. INNOVATION CATEGORIES
// ========================================

/**
 * List of innovation categories with professional icons
 * Used in forms and filters throughout the platform
 */
const INNOVATION_CATEGORIES = [
  { value: "agriculture", label: "Agricultural Technology", class: "text-success", icon: "fa-leaf" },
  { value: "robotics", label: "Robotics", class: "text-secondary", icon: "fa-robot" },
  { value: "ai", label: "Artificial Intelligence", class: "text-primary", icon: "fa-brain" },
  { value: "engineering", label: "Engineering", class: "text-dark", icon: "fa-cogs" },
  { value: "business", label: "Business Innovation", class: "text-info", icon: "fa-briefcase" },
  { value: "technology", label: "Technology", class: "text-primary", icon: "fa-laptop" },
  { value: "healthcare", label: "Healthcare", class: "text-danger", icon: "fa-heartbeat" },
  { value: "education", label: "Education", class: "text-warning", icon: "fa-graduation-cap" },
  { value: "environment", label: "Environment", class: "text-success", icon: "fa-tree" },
  { value: "social", label: "Social Impact", class: "text-danger", icon: "fa-hands-helping" }
];

/**
 * Get category badge HTML with professional icon
 * @param {string} category - Category value
 * @returns {string} - HTML for category badge with icon
 */
function getCategoryBadge(category) {
  const cat = INNOVATION_CATEGORIES.find((c) => c.value === category);
  if (!cat) return "";

  return `<span class="category-badge ${cat.class}">
    <i class="fa ${cat.icon} me-1"></i>${cat.label}
  </span>`;
}

// ========================================
// 15. PROJECT STATUS
// ========================================

/**
 * Get status badge HTML
 * @param {string} status - Status value (pending, progress, completed, rejected)
 * @returns {string} - HTML for status badge
 */
function getStatusBadge(status) {
  const statusMap = {
    pending: { label: "Pending Review", class: "status-pending" },
    progress: { label: "In Progress", class: "status-progress" },
    completed: { label: "Completed", class: "status-completed" },
    rejected: { label: "Rejected", class: "status-rejected" },
  };

  const statusInfo = statusMap[status] || statusMap["pending"];
  return `<span class="${statusInfo.class}">${statusInfo.label}</span>`;
}

// ========================================
// 16. CORE SERVICES
// ========================================

/**
 * PROJECT SERVICE
 */
export const ProjectService = {
    async submitProject(projectData) {
        const user = checkAuth();
        if (!user || user.role !== 'innovator') throw new Error("Unauthorized");

        const project = {
            ...projectData,
            innovatorId: user.uid,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            completionPercentage: 0,
            version: 1,
            visibility: projectData.visibility || 'public'
        };

        const docRef = await addDoc(collection(db, "projects"), project);
        
        // Log Initial Version
        await addDoc(collection(db, `projects/${docRef.id}/history`), {
            version: 1,
            data: project,
            timestamp: serverTimestamp(),
            changedBy: user.uid
        });

        return docRef.id;
    },

    async updateProject(projectId, updates) {
        const user = checkAuth();
        if (!user) throw new Error("Unauthorized");

        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (!projectDoc.exists()) throw new Error("Project not found");
        
        const currentData = projectDoc.data();
        const newVersion = (currentData.version || 1) + 1;

        await updateDoc(projectRef, {
            ...updates,
            version: newVersion,
            updatedAt: serverTimestamp()
        });

        // Log Version History
        await addDoc(collection(db, `projects/${projectId}/history`), {
            version: newVersion,
            changes: updates,
            timestamp: serverTimestamp(),
            changedBy: user.uid
        });
    },

    async addMilestone(projectId, milestone) {
        return await addDoc(collection(db, "milestones"), {
            ...milestone,
            projectId: projectId,
            status: 'pending',
            createdAt: serverTimestamp()
        });
    }
};

/**
 * MENTORSHIP SERVICE
 */
export const MentorshipService = {
    async sendRequest(mentorId, projectId) {
        const user = checkAuth();
        return await addDoc(collection(db, "mentorshipRequests"), {
            innovatorId: user.uid,
            mentorId: mentorId,
            projectId: projectId,
            status: 'pending',
            createdAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
    },

    async respondToRequest(requestId, status, reason = "") {
        const requestRef = doc(db, "mentorshipRequests", requestId);
        await updateDoc(requestRef, { 
            status: status,
            reason: reason,
            respondedAt: serverTimestamp() 
        });

        if (status === 'accepted') {
            const requestDoc = await getDoc(requestRef);
            const data = requestDoc.data();
            // Link mentor to project
            await updateDoc(doc(db, "projects", data.projectId), {
                mentorId: data.mentorId,
                status: 'in-progress'
            });
        }
    },

    async scheduleMeeting(meetingData) {
        return await addDoc(collection(db, "meetings"), {
            ...meetingData,
            createdAt: serverTimestamp()
        });
    }
};

/**
 * AUTOMATION SERVICE
 * Background checks for inactivity and expirations
 */
export const AutomationService = {
    async checkExpirations() {
        const q = query(
            collection(db, "mentorshipRequests"), 
            where("status", "==", "pending"),
            where("expiresAt", "<=", new Date())
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(async (d) => {
            await updateDoc(doc(db, "mentorshipRequests", d.id), { status: 'expired' });
        });
    },

    async checkMentorInactivity() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const q = query(
            collection(db, "users"), 
            where("role", "==", "mentor"),
            where("lastLogin", "<=", thirtyDaysAgo)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(async (d) => {
            await updateDoc(doc(db, "users", d.id), { autoFlagged: 'inactive_30d' });
            // Alert Admin usually via Notification
            await addDoc(collection(db, "notifications"), {
                userId: 'admin', // Placeholder or broadcast
                message: `Mentor ${d.data().fullName} flagged for 30-day inactivity.`,
                type: 'alert',
                createdAt: serverTimestamp()
            });
        });
    }
};

/**
 * NOTIFICATION SERVICE
 */
export const NotificationService = {
    async send(userId, message, type = 'info', link = '#') {
        return await addDoc(collection(db, "notifications"), {
            userId, message, type, link,
            read: false,
            createdAt: serverTimestamp()
        });
    }
};

// ========================================
// GLOBAL EXPORTS
// ========================================

window.ProjectService = ProjectService;
window.MentorshipService = MentorshipService;
window.AutomationService = AutomationService;
window.NotificationService = NotificationService;

// Log initialization message
console.log(
  "%cInnovate Hub Platform",
  "color: #667eea; font-size: 20px; font-weight: bold;",
);
console.log(
  "%cEmpowering Innovation Through Collaboration",
  "color: #764ba2; font-size: 14px;",
);
console.log("Platform services initialized successfully ✓");

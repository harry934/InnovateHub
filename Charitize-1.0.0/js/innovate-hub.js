/**
 * ========================================
 * INNOVATE HUB - MAIN JAVASCRIPT FILE
 * Handles splash screen, navigation, and core functionality
 * ========================================
 */

// ========================================
// 1. SPLASH SCREEN CONTROL
// ========================================

/**
 * Run on page load
 */
window.addEventListener("load", async function () {
    // Check authentication and update UI immediately
    // Note: api object is available from api.js
    if (window.api) {
        const user = await window.api.getCurrentUser();
        if (user) {
            updateUIForRole(user);
        }
    }
});

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
    if (targetId === '#') return; // Ignore empty links
    
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
  if (!navbar) return;

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
// 8. LOCAL STORAGE HELPERS (DEPRECATED but kept for non-critical ephemeral data)
// Core business data now uses API
// ========================================

function saveToLocalStorage(key, data) {
  try {
    const jsonData = JSON.stringify(data);
    localStorage.setItem(key, jsonData);
    return true;
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    return false;
  }
}

function loadFromLocalStorage(key) {
  try {
    const jsonData = localStorage.getItem(key);
    return jsonData ? JSON.parse(jsonData) : null;
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return null;
  }
}

// ========================================
// 9. GENERATE UNIQUE ID (Client-side helper)
// ========================================

function generateUniqueId(prefix) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ========================================
// 10. FORMAT DATE
// ========================================

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return d.toLocaleDateString("en-US", options);
}

// ========================================
// 11. TRUNCATE TEXT
// ========================================

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
}

// ========================================
// 12. DEBOUNCE FUNCTION
// ========================================

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// ========================================
// 13. CHECK USER AUTHENTICATION
// ========================================

/**
 * Update UI based on user role
 * @param {object} user - User data object
 */
function updateUIForRole(user) {
  if (!user) return;

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

  // Show role-specific navigation and dashboard elements
  const innovatorSidebarNav = document.getElementById("innovatorSidebarNav");
  const mentorSidebarNav = document.getElementById("mentorSidebarNav");
  const adminSidebarNav = document.getElementById("adminSidebarNav");
  const dashboardWrapper = document.getElementById("dashboardWrapper");

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
    'adminOverview', 'userManagement', 'dashboardNotificationsArea',
    'mentorsSection', 'submitSection', 'projectsSection', 'reportSection', 'profileSection', 'settingsSection'
  ];

  // Map simplified names to IDs
  const sectionMap = {
      'submit': 'submitSection',
      'projects': 'projectsSection',
      'mentors': 'mentorsSection',
      'report': 'reportSection',
      'notifications': 'notificationsSection',
      'profile': 'profileSection',
      'settings': 'settingsSection'
  };

  let targetId = sectionMap[sectionId] || sectionId;

  // Hide all potential sections
  const allSections = document.querySelectorAll('.dashboard-section');
  allSections.forEach(section => {
      section.style.display = 'none';
  });

  const target = document.getElementById(targetId);
  if (target) {
    target.style.display = 'block';
  }

  // Update active state in sidebar
  const navLinks = document.querySelectorAll('.dashboard-sidebar-nav .nav-link, .dashboard-sidebar .nav-link');
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
 */
function logout() {
  if (window.api) {
      window.api.logout();
  } else {
      // Fallback
      localStorage.removeItem("token");
      localStorage.removeItem("innovateHubUser");
      window.location.href = "index.html";
  }
}

// ========================================
// 14. INNOVATION CATEGORIES
// ========================================

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

function getCategoryBadge(category) {
  const cat = INNOVATION_CATEGORIES.find((c) => c.value === category);
  if (!cat) return `<span class="category-badge text-secondary">${category}</span>`;

  return `<span class="category-badge ${cat.class}">
    <i class="fa ${cat.icon} me-1"></i>${cat.label}
  </span>`;
}

// ========================================
// 15. PROJECT STATUS
// ========================================

function getStatusBadge(status) {
  // Added new statuses as per requirements
  const statusMap = {
    pending: { label: "Pending Review", class: "status-pending bg-warning text-dark badge" },
    progress: { label: "In Progress", class: "status-progress bg-info text-dark badge" },
    completed: { label: "Completed", class: "status-completed bg-success text-white badge" },
    rejected: { label: "Rejected", class: "status-rejected bg-danger text-white badge" },
    draft: { label: "Draft", class: "status-draft bg-secondary text-white badge" },
    expired: { label: "Expired", class: "status-expired bg-orange text-dark badge" },
    approved: { label: "Approved", class: "status-approved bg-success text-white badge" }
  };

  const statusInfo = statusMap[status] || statusMap["pending"];
  return `<span class="${statusInfo.class}">${statusInfo.label}</span>`;
}

// ========================================
// CONSOLE MESSAGE
// ========================================

console.log(
  "%cInnovate Hub Platform",
  "color: #667eea; font-size: 20px; font-weight: bold;",
);
console.log("Platform initialized successfully ✓");

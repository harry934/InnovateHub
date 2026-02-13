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
 * Hide splash screen after page loads
 * Uses window.addEventListener to wait for page to fully load
 */
window.addEventListener("load", function () {
  // Get splash screen element
  const splashScreen = document.getElementById("splash-screen");

  // Wait 1.0 second (optimized timing for professional feel)
  setTimeout(function () {
    if (splashScreen) {
      splashScreen.classList.add("hidden");
      setTimeout(function () {
        splashScreen.style.display = "none";
      }, 500);
    }
    
    // Check authentication and update UI immediately after splash
    const user = checkAuth();
    if (user && user.loggedIn) {
      updateUIForRole(user);
    }
  }, 1000);
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
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {any} data - Data to store (will be converted to JSON)
 */
function saveToLocalStorage(key, data) {
  try {
    // Convert data to JSON string
    const jsonData = JSON.stringify(data);
    // Save to localStorage
    localStorage.setItem(key, jsonData);
    return true;
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    return false;
  }
}

/**
 * Load data from localStorage
 * @param {string} key - Storage key
 * @returns {any} - Retrieved data (parsed from JSON)
 */
function loadFromLocalStorage(key) {
  try {
    // Get JSON string from localStorage
    const jsonData = localStorage.getItem(key);
    // Parse and return data
    return jsonData ? JSON.parse(jsonData) : null;
  } catch (error) {
    console.error("Error loading from localStorage:", error);
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
function logout() {
  // Clear user data
  localStorage.removeItem("innovateHubUser");
  // Redirect to homepage
  window.location.href = "index.html";
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
// CONSOLE MESSAGE
// ========================================

// Log initialization message
console.log(
  "%cInnovate Hub Platform",
  "color: #667eea; font-size: 20px; font-weight: bold;",
);
console.log(
  "%cEmpowering Innovation Through Collaboration",
  "color: #764ba2; font-size: 14px;",
);
console.log("Platform initialized successfully ✓");

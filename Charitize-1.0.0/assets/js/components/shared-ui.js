/**
 * Innovate Hub Shared UI Logic
 * Standardizes navbar behavior and preloader across all pages.
 */

(function () {
  "use strict";

  // 1. PRELOADER LOGIC
  window.handlePreloader = () => {
    const preloader = document.getElementById("logo-preloader");
    if (!preloader) return;

    // Detect if the page was reloaded (refreshed) or a direct entry
    const navEntries = performance.getEntriesByType("navigation");
    const isReload = navEntries.length > 0 && navEntries[0].type === "reload";
    const isInitial =
      navEntries.length > 0 &&
      navEntries[0].type === "navigate" &&
      !document.referrer.includes(window.location.origin);

    // Show preloader ONLY on refresh or direct entry from outside the platform
    if (isReload || isInitial) {
      preloader.classList.add("active");

      const hidePreloader = () => {
        preloader.classList.add("fade-out");
        setTimeout(() => {
          if (preloader) preloader.style.display = "none";
        }, 1200);
      };

      // Hide after 2 seconds
      setTimeout(hidePreloader, 2000);

      // Fail-safe
      setTimeout(() => {
        if (preloader) preloader.style.display = "none";
      }, 5000);
    } else {
      // Internal navigation: hide immediately
      preloader.style.display = "none";
    }
  };

  // 2. NAVIGATION CLICK LISTENER (Kept for other potential uses, though preloader now uses Performance API)
  window.initNavigationListener = () => {
    document.addEventListener("click", function (e) {
      const link = e.target.closest("a");
      if (
        link &&
        link.href &&
        link.href.includes(window.location.origin) &&
        !link.href.includes("#") &&
        link.target !== "_blank" &&
        !link.getAttribute("onclick")
      ) {
        // We could still use this flag if needed for other UI states
      }
    });
  };

  // 3. NAVBAR AUTH STATE TOGGLE
  window.updateNavbarUI = function (user) {
    // Fallback to localStorage if user object not provided
    if (!user) {
      user = window.loadFromLocalStorage("innovateHubUser");
    }
    const guestButtons = document.getElementById("guestButtons");
    const navDashboardBtn = document.getElementById("navDashboardBtn");
    const logoutLink = document.querySelector(".logout-link");

    if (user && user.loggedIn === true) {
      document.body.classList.add("user-logged-in");
      if (guestButtons) guestButtons.classList.add("d-none");
      if (navDashboardBtn) navDashboardBtn.classList.remove("d-none");
      if (logoutLink) logoutLink.classList.remove("d-none");
    } else {
      document.body.classList.remove("user-logged-in");
      if (guestButtons) guestButtons.classList.remove("d-none");
      if (navDashboardBtn) navDashboardBtn.classList.add("d-none");
      if (logoutLink) logoutLink.classList.add("d-none");
      // Clear potentially stale localStorage if no loggedIn flag
      if (!user || user.loggedIn !== true) {
        localStorage.removeItem("innovateHubUser");
      }
    }
  };
})();

// 4. GLOBAL UI ACTIONS - Moved outside IIFE for reliability
window.logout = function () {
  console.log("Global logout triggered.");

  // Clear local session immediately for UI updates
  localStorage.removeItem("innovateHubUser");

  // If the specialized logout in innovate-hub.js or dashboard scripts is ready, call it
  if (typeof window.firebaseLogout === "function") {
    window.firebaseLogout();
  } else {
    // Fallback: direct redirect to login.html if firebase modules aren't loaded
    window.location.href = "login.html";
  }
};

(function () {
  "use strict";

  window.goToDashboard = function () {
    const user = window.loadFromLocalStorage("innovateHubUser");
    if (!user || !user.role) {
      window.location.href = "login.html";
      return;
    }

    if (user.role === "admin") {
      window.location.href = "admin-dashboard.html";
      return;
    }

    // Redirect to the dedicated dashboard page
    window.location.href = "dashboard.html";
  };

  // Check URL for dashboard flag on load
  window.checkDashboardFlag = function () {
    // Only redirect if NOT already on the dashboard page
    if (window.location.pathname.endsWith("dashboard.html")) return;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("dashboard") === "true") {
      // Clean URL and redirect to the new dedicated dashboard page
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.href = "dashboard.html";
    }
  };



  // Initialization
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.handlePreloader();
      window.initNavigationListener();
      window.updateNavbarUI();
      window.checkDashboardFlag();
      if (typeof window.initBackgroundSymbols === 'function') {
        window.initBackgroundSymbols();
      }
    });
  } else {
    window.handlePreloader();
    window.initNavigationListener();
    window.updateNavbarUI();
    window.checkDashboardFlag();
    if (typeof window.initBackgroundSymbols === 'function') {
      window.initBackgroundSymbols();
    }
  }
})();

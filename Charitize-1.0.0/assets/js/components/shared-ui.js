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
  // Apply the logged-in/guest state based on a user object
  function applyNavbarState(user) {
    const isLoggedIn = user && (user.uid || user.id);
    const guestButtons = document.getElementById("guestButtons");
    const navDashboardBtn = document.getElementById("navDashboardBtn");
    const logoutLink = document.querySelector(".logout-link");

    if (isLoggedIn) {
      document.body.classList.add("user-logged-in");
      if (guestButtons) guestButtons.classList.add("d-none");
      if (navDashboardBtn) navDashboardBtn.classList.remove("d-none");
      if (logoutLink) logoutLink.classList.remove("d-none");
    } else {
      document.body.classList.remove("user-logged-in");
      if (guestButtons) guestButtons.classList.remove("d-none");
      if (navDashboardBtn) navDashboardBtn.classList.add("d-none");
      if (logoutLink) logoutLink.classList.add("d-none");
      // Always clear stale localStorage when no real session
      localStorage.removeItem("innovateHubUser");
    }
  }

  // updateNavbarUI: checks live Supabase session — never trusts localStorage alone
  window.updateNavbarUI = async function (userOverride) {
    // If an explicit user object is passed in (e.g. from onAuthStateChange), use it directly
    if (userOverride !== undefined) {
      applyNavbarState(userOverride);
      return;
    }

    // Otherwise: check the live Supabase session to get the real auth state
    if (window.supabase) {
      try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session && session.user) {
          // Valid session — show "MY DASHBOARD"
          const cachedUser = window.loadFromLocalStorage
            ? window.loadFromLocalStorage("innovateHubUser")
            : JSON.parse(localStorage.getItem("innovateHubUser") || "null");
          applyNavbarState(cachedUser || session.user);
        } else {
          // No live session — show "GET STARTED" and clear stale data
          applyNavbarState(null);
        }
      } catch (e) {
        console.warn("updateNavbarUI: Supabase session check failed", e);
        applyNavbarState(null);
      }
    } else {
      // Supabase not ready yet — use localStorage as temporary fallback
      const cached = window.loadFromLocalStorage
        ? window.loadFromLocalStorage("innovateHubUser")
        : JSON.parse(localStorage.getItem("innovateHubUser") || "null");
      applyNavbarState(cached);
    }
  };
})();

// 4. GLOBAL UI ACTIONS - Moved outside IIFE for reliability
window.logout = async function () {
  console.log("Global logout triggered.");

  // 1. Terminate session via AuthManager (handles Supabase + Local Storage)
  if (window.AuthManager) {
    try {
      await window.AuthManager.logout();
    } catch (e) {
      console.warn("AuthManager logout error:", e);
    }
  } else if (window.supabase) {
    // Fallback if AuthManager not yet loaded
    try {
      await window.supabase.auth.signOut();
      localStorage.removeItem("innovateHubUser");
      localStorage.removeItem("justLoggedIn");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Supabase signOut fallback error:", e);
    }
  }

  // 2. Update the navbar UI immediately to show "GET STARTED"
  if (typeof window.updateNavbarUI === "function") window.updateNavbarUI(null);

  // 3. Redirect to homepage using replace() so back-button cannot return to dashboard
  window.location.replace("index.html");
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

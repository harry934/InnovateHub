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

      // Hide after 500ms for a snappier feel
      setTimeout(hidePreloader, 500);

      // Fail-safe
      setTimeout(() => {
        if (preloader) preloader.style.display = "none";
      }, 3000);
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
    }
  }

  // updateNavbarUI: checks live Supabase session — never trusts localStorage alone
  window.updateNavbarUI = async function (userOverride) {
    // 1. FAST PATH: Check localStorage immediately (synchronous)
    const cachedUser = window.loadFromLocalStorage
      ? window.loadFromLocalStorage("innovateHubUser")
      : JSON.parse(localStorage.getItem("innovateHubUser") || "null");

    if (userOverride !== undefined) {
      applyNavbarState(userOverride || cachedUser);
      return;
    }

    // Apply cached state immediately to prevent "GET STARTED" flash
    if (cachedUser) {
      applyNavbarState(cachedUser);
    }

    // 2. LIVE CHECK: Verify with Supabase session
    if (window.supabase && typeof window.supabase.auth?.getSession === 'function') {
      try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session && session.user) {
          // Valid live session confirmed
          applyNavbarState(cachedUser || session.user);
        } else {
          // No live session — clear cache and show guest state
          if (cachedUser) {
              localStorage.removeItem("innovateHubUser");
              localStorage.removeItem("justLoggedIn");
          }
          applyNavbarState(null);
        }
      } catch (e) {
        console.warn("updateNavbarUI: session check failed", e);
        if (!cachedUser) applyNavbarState(null);
      }
    }
  };
})();

// 4. GLOBAL UI ACTIONS - Moved outside IIFE for reliability
window.logout = async function () {
  console.log("Global logout triggered: Clearing state and redirecting.");

  // 1. FAST PATH: Clear all local identifying data immediately
  localStorage.removeItem("innovateHubUser");
  localStorage.removeItem("justLoggedIn");
  sessionStorage.clear();

  // 2. Update navbar state to guest immediately
  if (typeof window.applyNavbarState === "function") {
    window.applyNavbarState(null);
  } else if (typeof window.updateNavbarUI === "function") {
    window.updateNavbarUI(null);
  }

  // 3. BACKGROUND: Sign out from Supabase/AuthManager
  // 3. BACKGROUND: Sign out from Supabase/AuthManager
  try {
    if (window.AuthManager && typeof window.AuthManager.logout === 'function') {
      await window.AuthManager.logout();
    } else if (window.supabase) {
      await window.supabase.auth.signOut();
    }
  } catch (e) {
    console.warn("Logout background task error:", e);
  }

  // 4. FINAL STEP: Redirect after cache is clear
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
    const path = window.location.pathname;
    if (path.includes("dashboard") || path.includes("admin-dashboard")) return;

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

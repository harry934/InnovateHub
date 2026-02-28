/**
 * Innovate Hub Shared UI Logic
 * Standardizes navbar behavior and preloader across all pages.
 */

(function() {
    "use strict";

    // 1. PRELOADER LOGIC
    const handlePreloader = () => {
        const preloader = document.getElementById("logo-preloader");
        if (!preloader) return;

        // Detect if the page was reloaded (refreshed) or a direct entry
        const navEntries = performance.getEntriesByType("navigation");
        const isReload = navEntries.length > 0 && navEntries[0].type === "reload";
        const isInitial = navEntries.length > 0 && navEntries[0].type === "navigate" && !document.referrer.includes(window.location.origin);
        
        // Show preloader ONLY on refresh or direct entry from outside the platform
        if (isReload || isInitial) {
            preloader.classList.add("active");
            
            const hidePreloader = () => {
                preloader.classList.add("fade-out");
                setTimeout(() => { 
                    if(preloader) preloader.style.display = 'none';
                }, 1200);
            };
            
            // Hide after 2 seconds
            setTimeout(hidePreloader, 2000);
            
            // Fail-safe
            setTimeout(() => {
                if (preloader) preloader.style.display = 'none';
            }, 5000);
        } else {
            // Internal navigation: hide immediately
            preloader.style.display = 'none';
        }
    };

    // 2. NAVIGATION CLICK LISTENER (Kept for other potential uses, though preloader now uses Performance API)
    const initNavigationListener = () => {
        document.addEventListener("click", function(e) {
            const link = e.target.closest("a");
            if (link && 
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
    window.updateNavbarUI = function(user) {
        // Fallback to localStorage if user object not provided
        if (!user) {
            user = window.loadFromLocalStorage("innovateHubUser");
        }

        const guestButtons = document.getElementById("guestButtons");
        const navDashboardBtn = document.getElementById("navDashboardBtn");
        const logoutLink = document.querySelector(".logout-link");
        const navDashboardLink = document.getElementById("navDashboardLink");

        if (user && user.loggedIn === true) {
            document.body.classList.add("user-logged-in");
            if (guestButtons) guestButtons.classList.add("d-none");
            if (navDashboardBtn) navDashboardBtn.classList.remove("d-none");
            if (logoutLink) logoutLink.classList.remove("d-none");
            if (navDashboardLink) navDashboardLink.classList.remove("d-none");
        } else {
            document.body.classList.remove("user-logged-in");
            if (guestButtons) guestButtons.classList.remove("d-none");
            if (navDashboardBtn) navDashboardBtn.classList.add("d-none");
            if (logoutLink) logoutLink.classList.add("d-none");
            if (navDashboardLink) navDashboardLink.classList.add("d-none");
            // Clear potentially stale localStorage if no loggedIn flag
            if (!user || user.loggedIn !== true) {
                localStorage.removeItem("innovateHubUser");
            }
        }
    };

    // 4. GLOBAL UI ACTIONS
    window.goToDashboard = function() {
        const user = window.loadFromLocalStorage("innovateHubUser");
        if (!user || !user.role) {
            window.location.href = 'login.html';
            return;
        }
        
        if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
            return;
        }
        
        // If not on index.html, redirect there with a flag
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html?dashboard=true';
            return;
        }
        
        // We are on index.html: Hide main content, show dashboard
        const mainContent = document.getElementById('main-website-content');
        const dashboardContainer = document.getElementById('unified-dashboard-container');
        
        if (mainContent && dashboardContainer) {
            mainContent.classList.add('d-none');
            dashboardContainer.classList.remove('d-none');
            
            // Set role class for CSS display toggles in sidebar
            document.body.classList.remove('role-innovator', 'role-mentor');
            document.body.classList.add(`role-${user.role}`);
            
            // Show default section based on role
            if (user.role === 'mentor') {
                if(typeof window.showDashboardSection === 'function') window.showDashboardSection('overview');
            } else {
                if(typeof window.showDashboardSection === 'function') window.showDashboardSection('projects');
            }
            
            // Scroll to top
            window.scrollTo(0, 0);
        }
    };
    
    // Check URL for dashboard flag on load
    window.checkDashboardFlag = function() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('dashboard') === 'true') {
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Delay slightly to ensure auth finishes
            setTimeout(() => {
                if(window.loadFromLocalStorage("innovateHubUser")) {
                    window.goToDashboard();
                }
            }, 500);
        }
    };

    // Initialization
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            handlePreloader();
            initNavigationListener();
            window.updateNavbarUI();
            window.checkDashboardFlag();
        });
    } else {
        handlePreloader();
        initNavigationListener();
        window.updateNavbarUI();
        window.checkDashboardFlag();
    }

})();

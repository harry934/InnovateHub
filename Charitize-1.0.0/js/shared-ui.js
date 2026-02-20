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

        // Check if this is a navigation from within the site
        const wasNavigated = sessionStorage.getItem("wasNavigated") === "true";
        
        if (wasNavigated) {
            // Immediately hide if it was a navigation (ignoring clicks)
            preloader.style.display = 'none';
            sessionStorage.removeItem("wasNavigated");
        } else {
            // Show animation for full refreshes or initial entry
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
        }
    };

    // 2. NAVIGATION CLICK LISTENER
    const initNavigationListener = () => {
        document.addEventListener("click", function(e) {
            const link = e.target.closest("a");
            if (link && 
                link.href && 
                link.href.includes(window.location.origin) && 
                !link.href.includes("#") && 
                link.target !== "_blank" &&
                !link.getAttribute("onclick") // Don't flag JS-based actions like logout
            ) {
                sessionStorage.setItem("wasNavigated", "true");
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

        if (user && user.loggedIn) {
            if (guestButtons) guestButtons.classList.add("d-none");
            if (navDashboardBtn) navDashboardBtn.classList.remove("d-none");
            if (logoutLink) logoutLink.classList.remove("d-none");
            if (navDashboardLink) navDashboardLink.classList.remove("d-none");
        } else {
            if (guestButtons) guestButtons.classList.remove("d-none");
            if (navDashboardBtn) navDashboardBtn.classList.add("d-none");
            if (logoutLink) logoutLink.classList.add("d-none");
            if (navDashboardLink) navDashboardLink.classList.add("d-none");
        }
    };

    // 4. GLOBAL UI ACTIONS
    window.goToDashboard = function() {
        const user = window.loadFromLocalStorage("innovateHubUser");
        if (user && user.role) {
            if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (user.role === 'mentor') {
                window.location.href = 'mentor-dashboard.html';
            } else {
                window.location.href = 'innovator-dashboard.html';
            }
        } else {
            window.location.href = 'innovator-dashboard.html';
        }
    };

    // Initialization
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            handlePreloader();
            initNavigationListener();
            window.updateNavbarUI();
        });
    } else {
        handlePreloader();
        initNavigationListener();
        window.updateNavbarUI();
    }

})();

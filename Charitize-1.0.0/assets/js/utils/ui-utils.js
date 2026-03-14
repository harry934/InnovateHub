/**
 * Innovate Hub UI Utilities
 * Non-module script for critical UI functions available immediately block-free.
 */

// 1. Success Message
function showSuccessMessage(message) {
    const alert = document.createElement("div");
    alert.className = "alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3";
    alert.style.zIndex = "9999";
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

// 2. Error Message
function showErrorMessage(message) {
    const alert = document.createElement("div");
    alert.className = "alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3";
    alert.style.zIndex = "9999";
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

// 3. Storage Helpers
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error("Storage save error:", e);
        return false;
    }
}

function loadFromLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Storage load error:", e);
        return null;
    }
}

// 4. Form Validation
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(form) {
    const required = form.querySelectorAll("[required]");
    let valid = true;
    required.forEach(f => {
        if (!f.value.trim()) {
            valid = false;
            f.classList.add("is-invalid");
        } else {
            f.classList.remove("is-invalid");
        }
    });
    return valid;
}

// 5. Helpers
function generateUniqueId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    });
}

function truncateText(text, max) {
    if (!text || text.length <= max) return text || '';
    return text.substring(0, max) + "...";
}

// 6. Initials Helper
function getInitials(name) {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'US';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function showConnectionErrorUI() {
    const existing = document.getElementById('connection-error-overlay');
    if (existing) return;

    const overlay = document.createElement('div');
    overlay.id = 'connection-error-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(135deg, #1a5e4f 0%, #0d2a23 100%);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        text-align: center;
        padding: 30px;
        font-family: 'Josefin Sans', sans-serif;
    `;
    
    overlay.innerHTML = `
        <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 24px; backdrop-filter: blur(10px); max-width: 500px; border: 1px solid rgba(255,168,19,0.2);">
            <div style="font-size: 5rem; margin-bottom: 2rem;">📡</div>
            <h2 style="font-weight: 800; margin-bottom: 15px; color: #f3a813;">Connection Issue</h2>
            <p style="opacity: 0.9; margin-bottom: 30px; font-size: 1.1rem; line-height: 1.6;">We're having trouble reaching our servers. This could be due to a slow network or temporary service interruption.</p>
            <button onclick="location.reload()" class="btn shadow-lg" style="background: #f3a813; color: #1a5e4f; font-weight: 800; padding: 15px 40px; border-radius: 50px; border: none; font-size: 1.1rem; transition: transform 0.2s ease;">
                Try Reconnecting
            </button>
            <p style="margin-top: 25px; font-size: 0.85rem; opacity: 0.6;">Error: Firestore Connection Failed (502)</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

// Expose to window explicitly
window.showSuccessMessage = showSuccessMessage;
window.showErrorMessage = showErrorMessage;
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromLocalStorage = loadFromLocalStorage;
window.validateEmail = validateEmail;
window.validateForm = validateForm;
window.generateUniqueId = generateUniqueId;
window.formatDate = formatDate;
window.truncateText = truncateText;
window.getInitials = getInitials;
window.showConnectionErrorUI = showConnectionErrorUI;

console.log("UI Utilities initialized ✓");

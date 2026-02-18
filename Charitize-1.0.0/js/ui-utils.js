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

console.log("UI Utilities initialized ✓");

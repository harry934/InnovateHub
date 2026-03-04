/**
 * Status Badge System
 * Centralized status badge rendering with consistent styling
 */

export const StatusBadge = {
    /**
     * Status color mapping
     */
    colors: {
        pending: { bg: '#ffc107', text: '#000' },
        accepted: { bg: '#198754', text: '#fff' },
        rejected: { bg: '#dc3545', text: '#fff' },
        draft: { bg: '#6c757d', text: '#fff' },
        expired: { bg: '#fd7e14', text: '#fff' },
        approved: { bg: '#198754', text: '#fff' },
        active: { bg: '#0dcaf0', text: '#000' }
    },

    /**
     * Render a status badge
     * @param {string} status - Status type (pending, accepted, rejected, draft, expired)
     * @param {string} customText - Optional custom text (defaults to capitalized status)
     * @returns {string} HTML string for the badge
     */
    render(status, customText = null) {
        const normalizedStatus = status.toLowerCase();
        const displayText = customText || this.formatStatus(status);
        const icon = this.getIcon(status);

        return `
            <span class="badge-premium badge-premium-${normalizedStatus}">
                <i class="fa ${icon} fs-8"></i>
                ${displayText}
            </span>
        `;
    },

    /**
     * Format status text for display
     * @param {string} status - Raw status string
     * @returns {string} Formatted status text
     */
    formatStatus(status) {
        return status
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    },

    /**
     * Get status icon
     * @param {string} status - Status type
     */
    getIcon(status) {
        const icons = {
            pending: 'fa-history',
            accepted: 'fa-check-double',
            rejected: 'fa-times-circle',
            draft: 'fa-edit',
            expired: 'fa-exclamation-circle',
            approved: 'fa-verified',
            active: 'fa-bolt'
        };
        return icons[status.toLowerCase()] || 'fa-circle';
    },

    /**
     * Render badge with icon (Same as render now since we want icons everywhere)
     */
    renderWithIcon(status, customText = null) {
        return this.render(status, customText);
    }
};

// Export to window for non-module scripts
window.StatusBadge = StatusBadge;

export default StatusBadge;

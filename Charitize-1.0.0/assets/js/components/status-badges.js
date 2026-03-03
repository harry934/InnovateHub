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
        const colors = this.colors[normalizedStatus] || { bg: '#6c757d', text: '#fff' };
        const displayText = customText || this.formatStatus(status);

        return `
            <span class="badge-status badge-${normalizedStatus}" 
                  style="background-color: ${colors.bg}; color: ${colors.text}; 
                         padding: 0.35rem 0.75rem; border-radius: 15px; 
                         font-size: 0.875rem; font-weight: 600; 
                         text-transform: capitalize; display: inline-block;">
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
     * @returns {string} Font Awesome icon class
     */
    getIcon(status) {
        const icons = {
            pending: 'fa-clock',
            accepted: 'fa-check-circle',
            rejected: 'fa-times-circle',
            draft: 'fa-file-alt',
            expired: 'fa-hourglass-end',
            approved: 'fa-check-circle',
            active: 'fa-play-circle'
        };
        return icons[status.toLowerCase()] || 'fa-circle';
    },

    /**
     * Render badge with icon
     * @param {string} status - Status type
     * @param {string} customText - Optional custom text
     * @returns {string} HTML string for badge with icon
     */
    renderWithIcon(status, customText = null) {
        const normalizedStatus = status.toLowerCase();
        const colors = this.colors[normalizedStatus] || { bg: '#6c757d', text: '#fff' };
        const displayText = customText || this.formatStatus(status);
        const icon = this.getIcon(status);

        return `
            <span class="badge-status badge-${normalizedStatus}" 
                  style="background-color: ${colors.bg}; color: ${colors.text}; 
                         padding: 0.35rem 0.75rem; border-radius: 15px; 
                         font-size: 0.875rem; font-weight: 600; 
                         text-transform: capitalize; display: inline-flex; 
                         align-items: center; gap: 0.4rem;">
                <i class="fa ${icon}"></i>
                ${displayText}
            </span>
        `;
    }
};

// Export to window for non-module scripts
window.StatusBadge = StatusBadge;

export default StatusBadge;

/**
 * Empty State Components
 * Friendly empty state screens for various scenarios
 */

export const EmptyStates = {
    /**
     * Render an empty state
     * @param {Object} options - Configuration options
     * @param {string} options.icon - Font Awesome icon class
     * @param {string} options.message - Main message
     * @param {string} options.hint - Optional hint text
     * @param {string} options.actionText - Optional button text
     * @param {Function} options.actionHandler - Optional button click handler
     * @returns {string} HTML string for empty state
     */
    render(options) {
        const {
            icon = 'fa-inbox',
            message = 'Nothing here yet',
            hint = '',
            actionText = '',
            actionHandler = null
        } = options;

        const actionButton = actionText && actionHandler ? `
            <button class="btn btn-primary mt-4 px-5 py-2 fw-bold shadow-sm" style="border-radius: 12px; font-family: 'Josefin Sans', sans-serif;" onclick="(${actionHandler.toString()})()">
                ${actionText}
            </button>
        ` : '';

        return `
            <div class="empty-state-card" style="
                text-align: center;
                padding: 60px 40px;
                background: #ffffff;
                border-radius: 24px;
                box-shadow: 0 15px 45px rgba(0,0,0,0.06);
                border: 1px solid rgba(0,0,0,0.05);
                max-width: 550px;
                margin: 50px auto;
                transition: transform 0.3s ease;
            ">
                <div class="empty-state-icon-bg" style="
                    width: 90px;
                    height: 90px;
                    background: rgba(26, 94, 79, 0.08); /* Matches brand green */
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 25px;
                ">
                    <i class="fa ${icon}" style="font-size: 2.8rem; color: #1a5e4f;"></i>
                </div>
                <h2 style="font-family: 'Josefin Sans', sans-serif; color: #1a5e4f; font-weight: 700; margin-bottom: 12px; font-size: 1.75rem;">${message}</h2>
                <p style="color: #6c757d; font-size: 1.1rem; line-height: 1.6; margin-bottom: 0;">${hint}</p>
                ${actionButton}
            </div>
        `;
    },

    /**
     * Predefined empty states for common scenarios
     */
    templates: {
        noProjects: () => EmptyStates.render({
            icon: 'fa-lightbulb',
            message: 'No projects yet',
            hint: 'Submit your first innovative project to get started!',
            actionText: 'Submit Project',
            actionHandler: () => window.showSection('submit')
        }),

        noMentors: () => EmptyStates.render({
            icon: 'fa-users',
            message: 'No mentors found',
            hint: 'Try adjusting your filters or check back later'
        }),

        noMentees: () => EmptyStates.render({
            icon: 'fa-user-graduate',
            message: 'No active mentees yet',
            hint: 'Accept mentorship requests to start guiding innovators'
        }),

        noRequests: () => EmptyStates.render({
            icon: 'fa-check-circle',
            message: 'No pending requests',
            hint: 'You\'re all caught up!'
        }),

        noNotifications: () => EmptyStates.render({
            icon: 'fa-bell-slash',
            message: 'No notifications',
            hint: 'We\'ll notify you when something important happens'
        }),

        noEvents: () => EmptyStates.render({
            icon: 'fa-calendar-alt',
            message: 'No events planned yet',
            hint: 'Check back soon for upcoming events and workshops'
        }),

        noResults: (searchTerm = '') => EmptyStates.render({
            icon: 'fa-search',
            message: 'No results found',
            hint: searchTerm ? `No matches for "${searchTerm}"` : 'Try a different search term'
        }),

        noCategories: () => EmptyStates.render({
            icon: 'fa-folder-open',
            message: 'No categories available',
            hint: 'Categories will appear here once mentors are registered'
        }),

        noDrafts: () => EmptyStates.render({
            icon: 'fa-file-alt',
            message: 'No saved drafts',
            hint: 'Your work will be auto-saved as you type'
        }),

        errorState: (msg) => `
        <div class="text-center py-5 text-danger">
            <i class="fa fa-exclamation-circle fa-3x mb-3"></i>
            <h3>Failed to load</h3>
            <p>${msg || 'Something went wrong. Please try again later.'}</p>
        </div>
    `,

        loadingState: () => `
            <div class="premium-loader-container">
                <div class="premium-loader-dot"></div>
                <div class="premium-loader-dot"></div>
                <div class="premium-loader-dot"></div>
            </div>
            <p class="text-center" style="font-family: 'Josefin Sans', sans-serif; color: #1a5e4f; font-weight: 600; margin-top: -10px;">Loading Innovation...</p>
        `
    }
};

// Export to window for non-module scripts
window.EmptyStates = EmptyStates;

export default EmptyStates;

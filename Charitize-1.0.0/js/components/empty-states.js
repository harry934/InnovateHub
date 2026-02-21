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
            <button class="btn btn-custom-signup mt-3" onclick="(${actionHandler.toString()})()">
                ${actionText}
            </button>
        ` : '';

        return `
            <div class="empty-state" style="
                text-align: center;
                padding: 60px 20px;
                color: #6c757d;
            ">
                <i class="fa ${icon} empty-state-icon" style="
                    font-size: 4rem;
                    color: #dee2e6;
                    margin-bottom: 1rem;
                    display: block;
                "></i>
                <p class="empty-state-message" style="
                    font-size: 1.1rem;
                    margin-bottom: 0.5rem;
                    color: #495057;
                    font-weight: 500;
                ">
                    ${message}
                </p>
                ${hint ? `
                    <p class="empty-state-hint" style="
                        font-size: 0.9rem;
                        color: #adb5bd;
                        margin-bottom: 0;
                    ">
                        ${hint}
                    </p>
                ` : ''}
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
            <div class="loading-state" style="
                text-align: center;
                padding: 60px 20px;
                color: #6c757d;
            ">
                <i class="fa fa-spinner fa-spin" style="
                    font-size: 3rem;
                    color: #1a5e4f;
                    margin-bottom: 1rem;
                    display: block;
                "></i>
                <p style="font-size: 1rem; color: #6c757d;">
                    Loading...
                </p>
            </div>
        `
    }
};

// Export to window for non-module scripts
window.EmptyStates = EmptyStates;

export default EmptyStates;

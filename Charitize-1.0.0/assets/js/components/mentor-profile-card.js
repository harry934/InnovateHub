/**
 * Mentor Profile Card Component
 * Reusable mentor profile card with default avatar, status, and actions
 */

import StatusBadge from './status-badges.js';

export class MentorProfileCard {
    /**
     * Default avatar SVG (neutral human figure)
     */
    static defaultAvatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231a5e4f'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E`;

    /**
     * Render a mentor profile card
     * @param {Object} mentor - Mentor data object
     * @param {Object} options - Rendering options
     * @returns {string} HTML string for the card
     */
    static render(mentor, options = {}) {
        const {
            showRequestButton = true,
            showAvailability = true,
            cardClass = 'col-md-6 col-lg-4 mb-4',
            onRequestClick = null
        } = options;

        const photoURL = mentor.photoURL || this.defaultAvatar;
        const fullName = mentor.fullName || 'Anonymous Mentor';
        const profession = mentor.profession || 'Expert';
        const expertise = mentor.expertise || 'Various fields';
        const bio = mentor.bio || 'No bio available';
        const experience = mentor.experience || 'Not specified';
        const rating = mentor.rating || 0;
        const isAvailable = mentor.available !== false;

        // Icons
        const icons = {
            briefcase: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;"><path d="M16 7V5a2 2 0 00-2-2H10a2 2 0 00-2 2v2m11 0h-3M5 7h3m0 0v11a2 2 0 002 2h4a2 2 0 002-2V7m-6 0h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            paperPlane: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        };

        return `
            <div class="${cardClass}">
                <div class="theme-mentor-card h-100 d-flex flex-column text-center ${!isAvailable ? 'opacity-75' : ''}">
                    <!-- Profile Image -->
                    <div class="theme-mentor-avatar">
                        <img src="${photoURL}" 
                             alt="${fullName}" 
                             onerror="this.src='${this.defaultAvatar}'">
                    </div>

                    <!-- Name & Title -->
                    <h5 class="fw-800 mb-1" style="color: #1a5e4f; font-family: var(--font-head);">
                        ${fullName}
                    </h5>
                    <p class="mb-3 fs-7 text-uppercase" style="color: #f3a813; font-weight: 700; letter-spacing: 0.5px;">
                        ${profession}
                    </p>

                    <!-- Availability & Rating -->
                    <div class="d-flex flex-column align-items-center mb-3">
                        ${showAvailability ? `
                            <div class="mb-2">
                                ${isAvailable ? 
                                    StatusBadge.render('active', 'Available') : 
                                    StatusBadge.render('expired', 'Away')
                                }
                            </div>
                        ` : ''}
                        ${rating > 0 ? `
                            <div class="mentor-rating" style="color: #ffc107;">
                                ${this.renderStars(rating)}
                                <small class="text-muted ms-1 fw-bold">(${rating.toFixed(1)})</small>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Expertise Tags -->
                    <div class="mentor-expertise mb-3">
                        </small>
                        <p class="text-muted mb-0" style="font-size: 0.9rem;">
                            ${this.formatExpertise(expertise)}
                        </p>
                    </div>

                    <!-- Bio (truncated) -->
                    <div class="mentor-bio mb-3" style="flex: 1;">
                        <small class="text-muted d-block mb-1" style="font-weight: 600; text-transform: uppercase; font-size: 0.75rem;">
                            About
                        </small>
                        <p class="text-muted mb-0" style="font-size: 0.85rem; line-height: 1.4;">
                            ${this.truncateText(bio, 100)}
                        </p>
                    </div>

                    <!-- Experience -->
                    ${experience !== 'Not specified' ? `
                        <div class="mentor-experience mb-3">
                            <small class="d-flex align-items-center justify-content-center gap-1" style="font-size: 0.8rem; color: #1a5e4f; font-weight: 600;">
                                ${icons.briefcase}
                                ${experience}
                            </small>
                        </div>
                    ` : ''}

                    <!-- Action Button -->
                    ${requestButton}
                </div>
            </div>
        `;
    }

    /**
     * Render detailed mentor profile (expanded view)
     */
    static renderDetailed(mentor, options = {}) {
        const photoURL = mentor.photoURL || this.defaultAvatar;
        const fullName = mentor.fullName || 'Anonymous Mentor';
        const profession = mentor.profession || 'Expert';
        const expertise = mentor.expertise || 'Various fields';
        const bio = mentor.bio || 'No bio available';
        const experience = mentor.experience || 'Not specified';
        const rating = mentor.rating || 0;
        const isAvailable = mentor.available !== false;
        const categories = mentor.categories || [];

        return `
            <div class="mentor-profile-detailed">
                <div class="row">
                    <div class="col-md-4 text-center">
                        <!-- Profile Image -->
                        <div class="mentor-avatar-large mb-3" style="
                            width: 200px;
                            height: 200px;
                            margin: 0 auto;
                            border-radius: 50%;
                            overflow: hidden;
                            border: 6px solid #1a5e4f;
                            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
                        ">
                            <img src="${photoURL}" 
                                 alt="${fullName}" 
                                 style="width: 100%; height: 100%; object-fit: cover;"
                                 onerror="this.src='${this.defaultAvatar}'">
                        </div>

                        <!-- Availability -->
                        <div class="mb-3">
                            ${isAvailable ? 
                                StatusBadge.renderWithIcon('active', 'Available for Mentorship') : 
                                StatusBadge.renderWithIcon('expired', 'Not Accepting Requests')
                            }
                        </div>

                        <!-- Rating -->
                        ${rating > 0 ? `
                            <div class="mentor-rating mb-3" style="color: #ffc107; font-size: 1.2rem;">
                                ${this.renderStars(rating)}
                                <div style="color: #6c757d; font-size: 0.9rem; margin-top: 0.5rem;">
                                    ${rating.toFixed(1)} out of 5
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <div class="col-md-8">
                        <!-- Name & Title -->
                        <h3 class="mb-2" style="color: #1a5e4f; font-weight: 700;">
                            ${fullName}
                        </h3>
                        <h5 class="text-primary mb-3">
                            ${profession}
                        </h5>

                        <!-- Experience -->
                        ${experience !== 'Not specified' ? `
                            <div class="mb-3">
                                <h6 class="text-muted mb-1 d-flex align-items-center gap-2">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;"><path d="M16 7V5a2 2 0 00-2-2H10a2 2 0 00-2 2v2m11 0h-3M5 7h3m0 0v11a2 2 0 002 2h4a2 2 0 002-2V7m-6 0h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    Experience
                                </h6>
                                <p>${experience}</p>
                            </div>
                        ` : ''}

                        <!-- Expertise -->
                        <div class="mb-3">
                            <h6 class="text-muted mb-2 d-flex align-items-center gap-2">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                Expertise
                            </h6>
                            <p>${this.formatExpertise(expertise)}</p>
                        </div>

                        <!-- Categories -->
                        ${categories.length > 0 ? `
                            <div class="mb-3">
                                <h6 class="text-muted mb-2 d-flex align-items-center gap-2">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;"><path d="M7 7h.01M7 3h5c.53 0 1.039.211 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    Categories
                                </h6>
                                <div class="d-flex flex-wrap gap-2">
                                    ${categories.map(cat => `
                                        <span class="badge bg-primary">${cat}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Bio -->
                        <div class="mb-3">
                            <h6 class="text-muted mb-2 d-flex align-items-center gap-2">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                About
                            </h6>
                            <p style="line-height: 1.6;">${bio}</p>
                        </div>

                        <!-- Action Button -->
                        <button 
                            class="btn btn-custom-signup btn-lg d-flex align-items-center gap-2 ${!isAvailable ? 'disabled' : ''}" 
                            onclick="requestMentorship('${mentor.id}')"
                            ${!isAvailable ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:20px;height:20px;"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            ${isAvailable ? 'Send Mentorship Request' : 'Not Available'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render rating stars
     */
    static renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        const starIcon = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:2px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
        const starHalfIcon = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:2px;"><path d="M22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>`;
        const starEmptyIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:2px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

        for (let i = 0; i < fullStars; i++) {
            stars += starIcon;
        }
        if (hasHalfStar) {
            stars += starHalfIcon;
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += starEmptyIcon;
        }
        return stars;
    }

    /**
     * Format expertise string
     */
    static formatExpertise(expertise) {
        if (typeof expertise === 'string') {
            return expertise.split(',').map(e => e.trim()).join(' • ');
        }
        if (Array.isArray(expertise)) {
            return expertise.join(' • ');
        }
        return expertise;
    }

    /**
     * Truncate text with ellipsis
     */
    static truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
}

// Export to window for non-module scripts
window.MentorProfileCard = MentorProfileCard;

export default MentorProfileCard;

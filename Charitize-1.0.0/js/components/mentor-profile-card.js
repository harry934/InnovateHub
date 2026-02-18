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
            cardClass = 'col-md-4',
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

        // Availability badge
        const availabilityBadge = showAvailability ? `
            <div class="availability-status mb-2">
                ${isAvailable ? 
                    StatusBadge.render('active', 'Available') : 
                    StatusBadge.render('expired', 'Unavailable')
                }
            </div>
        ` : '';

        // Request button
        const requestButton = showRequestButton ? `
            <button 
                class="btn btn-custom-signup w-100 ${!isAvailable ? 'disabled' : ''}" 
                onclick="${onRequestClick ? `(${onRequestClick.toString()})('${mentor.id}')` : `requestMentorship('${mentor.id}')`}"
                ${!isAvailable ? 'disabled' : ''}
                style="margin-top: auto;">
                ${isAvailable ? 'Request Mentorship' : 'Not Available'}
            </button>
        ` : '';

        // Rating stars (future-ready)
        const ratingStars = rating > 0 ? `
            <div class="mentor-rating mb-2" style="color: #ffc107;">
                ${this.renderStars(rating)}
                <span style="color: #6c757d; font-size: 0.85rem; margin-left: 0.5rem;">
                    (${rating.toFixed(1)})
                </span>
            </div>
        ` : '';

        return `
            <div class="${cardClass}">
                <div class="dashboard-card mentor-profile-card h-100" style="
                    display: flex;
                    flex-direction: column;
                    text-align: center;
                    transition: all 0.3s ease;
                    ${!isAvailable ? 'opacity: 0.7;' : ''}
                ">
                    <!-- Profile Image -->
                    <div class="mentor-avatar mb-3" style="
                        width: 100px;
                        height: 100px;
                        margin: 0 auto;
                        border-radius: 50%;
                        overflow: hidden;
                        border: 4px solid #1a5e4f;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    ">
                        <img src="${photoURL}" 
                             alt="${fullName}" 
                             style="width: 100%; height: 100%; object-fit: cover;"
                             onerror="this.src='${this.defaultAvatar}'">
                    </div>

                    <!-- Name & Title -->
                    <h5 class="mentor-name mb-1" style="color: #1a5e4f; font-weight: 700;">
                        ${fullName}
                    </h5>
                    <p class="mentor-profession text-primary mb-2" style="font-size: 0.95rem; font-weight: 500;">
                        ${profession}
                    </p>

                    <!-- Rating -->
                    ${ratingStars}

                    <!-- Availability -->
                    ${availabilityBadge}

                    <!-- Expertise -->
                    <div class="mentor-expertise mb-3">
                        <small class="text-muted d-block mb-1" style="font-weight: 600; text-transform: uppercase; font-size: 0.75rem;">
                            Expertise
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
                            <small class="text-muted" style="font-size: 0.8rem;">
                                <i class="fa fa-briefcase me-1"></i>
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
                                <h6 class="text-muted mb-1">
                                    <i class="fa fa-briefcase me-2"></i>Experience
                                </h6>
                                <p>${experience}</p>
                            </div>
                        ` : ''}

                        <!-- Expertise -->
                        <div class="mb-3">
                            <h6 class="text-muted mb-2">
                                <i class="fa fa-star me-2"></i>Expertise
                            </h6>
                            <p>${this.formatExpertise(expertise)}</p>
                        </div>

                        <!-- Categories -->
                        ${categories.length > 0 ? `
                            <div class="mb-3">
                                <h6 class="text-muted mb-2">
                                    <i class="fa fa-tags me-2"></i>Categories
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
                            <h6 class="text-muted mb-2">
                                <i class="fa fa-user me-2"></i>About
                            </h6>
                            <p style="line-height: 1.6;">${bio}</p>
                        </div>

                        <!-- Action Button -->
                        <button 
                            class="btn btn-custom-signup btn-lg ${!isAvailable ? 'disabled' : ''}" 
                            onclick="requestMentorship('${mentor.id}')"
                            ${!isAvailable ? 'disabled' : ''}>
                            <i class="fa fa-paper-plane me-2"></i>
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
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fa fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fa fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
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

/**
 * Structured Project Card Component v2.0
 * Premium individual card design with expandable details and full action suite.
 */

import StatusBadge from './status-badges.js';

export class StructuredProjectCard {
    static render(project, options = {}) {
        const { showActions = true, cardClass = 'mb-4' } = options;
        const cardId = `project-card-${project.id}`;
        const sections = this.extractSections(project);
        const statusColor = this.getStatusColor(project.status);
        const categoryList = (project.categories || (project.category ? [project.category] : []));

        return `
        <div class="ihub-project-card ${cardClass}" id="${cardId}">
            <!-- Card Top Strip (status color accent) -->
            <div class="ihub-project-card__strip" style="background: ${statusColor};"></div>

            <!-- Card Body -->
            <div class="ihub-project-card__body">
                <!-- Header row -->
                <div class="ihub-project-card__header">
                    <div class="ihub-project-card__meta">
                        <div class="ihub-project-card__categories">
                            ${categoryList.map(c => `<span class="ihub-cat-pill">${this.formatCategory(c)}</span>`).join('')}
                        </div>
                        ${StatusBadge.render(project.status || 'pending')}
                    </div>
                    <h3 class="ihub-project-card__title">${project.title || 'Untitled Project'}</h3>
                    <p class="ihub-project-card__summary">
                        ${this.truncateText(sections.problemStatement || project.description || 'No description provided.', 160)}
                    </p>
                    <div class="ihub-project-card__date">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Submitted ${this.formatDate(project.createdAt)}
                    </div>
                </div>

                <!-- Expandable Details -->
                <div class="ihub-project-card__details" id="${cardId}-details" style="display:none;">
                    <div class="ihub-details-grid">
                        ${sections.problemStatement ? this.renderDetailBlock('🔍 Problem Statement', sections.problemStatement, '#dc3545') : ''}
                        ${sections.objectives ? this.renderDetailBlock('🎯 Objectives', sections.objectives, '#1a5e4f') : ''}
                        ${sections.proposedSolution ? this.renderDetailBlock('💡 Proposed Solution', sections.proposedSolution, '#f3a813') : ''}
                        ${sections.expectedImpact ? this.renderDetailBlock('📈 Expected Impact', sections.expectedImpact, '#0d6efd') : ''}
                    </div>

                    ${project.fileUrl ? `
                    <div class="ihub-file-attachment">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span>${project.fileName || 'Attached Document'}</span>
                        <a href="${project.fileUrl}" target="_blank" rel="noopener" class="ihub-file-download-btn">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download
                        </a>
                    </div>` : ''}

                    ${project.adminFeedback ? `
                    <div class="ihub-admin-feedback">
                        <div class="ihub-admin-feedback__label">💬 Official Feedback</div>
                        <p>${project.adminFeedback}</p>
                    </div>` : ''}
                </div>

                <!-- Action Bar -->
                <div class="ihub-project-card__actions">
                    <!-- Left: Toggle Details -->
                    <button class="ihub-action-btn ihub-action-btn--ghost" onclick="toggleProjectCard('${project.id}')" id="${cardId}-toggle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        View Details
                    </button>

                    <!-- Right: Actions -->
                    ${showActions ? `
                    <div class="ihub-project-card__action-group">
                        <button class="ihub-action-btn ihub-action-btn--milestone" onclick="showAddMilestone('${project.id}')" title="Add Milestone">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                            Milestone
                        </button>
                        <button class="ihub-action-btn ihub-action-btn--view" onclick="viewMilestones('${project.id}')" title="View Milestones">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                            Milestones
                        </button>
                        <button class="ihub-action-btn ihub-action-btn--report" onclick="showAddReport('${project.id}')" title="Add Report">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            Report
                        </button>
                        ${(project.status === 'draft' || project.status === 'pending') ? `
                        <button class="ihub-action-btn ihub-action-btn--edit" onclick="editProject('${project.id}')" title="Edit Project">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
                        </button>` : ''}
                        <button class="ihub-action-btn ihub-action-btn--delete" onclick="window.confirmDeleteProject('${project.id}')" title="Delete Project">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                            Delete
                        </button>
                    </div>` : ''}
                </div>
            </div>
        </div>`;
    }

    static renderDetailBlock(title, content, accentColor) {
        return `
        <div class="ihub-detail-block" style="border-left-color: ${accentColor};">
            <div class="ihub-detail-block__title">${title}</div>
            <p class="ihub-detail-block__content">${content}</p>
        </div>`;
    }

    static extractSections(project) {
        if (project.problemStatement || project.objectives) {
            return {
                problemStatement: project.problemStatement || '',
                objectives: project.objectives || '',
                proposedSolution: project.proposedSolution || project.solution || '',
                expectedImpact: project.expectedImpact || project.impact || '',
            };
        }
        const description = project.description || '';
        return {
            problemStatement: description,
            objectives: '',
            proposedSolution: '',
            expectedImpact: '',
        };
    }

    static getStatusColor(status) {
        const map = {
            approved: '#1a5e4f',
            pending: '#f3a813',
            rejected: '#dc3545',
            draft: '#6c757d',
            completed: '#0d6efd',
        };
        return map[status] || '#6c757d';
    }

    static formatCategory(category) {
        if (!category) return '';
        return category.replace(/_/g, ' ').split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    static formatDate(date) {
        if (!date) return 'Unknown date';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    static truncateText(text, maxLength) {
        if (!text) return '';
        return text.length <= maxLength ? text : text.substring(0, maxLength).trim() + '...';
    }
}

/** Toggle card details open/close */
window.toggleProjectCard = function(projectId) {
    const cardId = `project-card-${projectId}`;
    const details = document.getElementById(`${cardId}-details`);
    const toggle = document.getElementById(`${cardId}-toggle`);
    if (!details || !toggle) return;

    const isOpen = details.style.display !== 'none';
    details.style.display = isOpen ? 'none' : 'block';
    toggle.innerHTML = isOpen
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg> View Details`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg> Close Details`;
};

window.StructuredProjectCard = StructuredProjectCard;
export default StructuredProjectCard;

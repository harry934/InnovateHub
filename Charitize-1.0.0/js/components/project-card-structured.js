/**
 * Structured Project Card Component
 * Displays projects in expandable sections (Problem/Objectives/Solution/Impact)
 */

import StatusBadge from './status-badges.js';

export class StructuredProjectCard {
    /**
     * Render a structured project card
     * @param {Object} project - Project data
     * @param {Object} options - Rendering options
     * @returns {string} HTML string for the card
     */
    static render(project, options = {}) {
        const {
            showActions = true,
            isExpanded = false,
            cardClass = 'mb-3'
        } = options;

        const cardId = `project-card-${project.id}`;
        const sections = this.extractSections(project);

        return `
            <div class="dashboard-card project-card-structured ${cardClass}" id="${cardId}">
                <!-- Card Header -->
                <div class="project-card-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                    margin-bottom: 1rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #f8f9fa;
                ">
                    <div style="flex: 1;">
                        <h4 class="mb-2" style="color: #1a5e4f; font-weight: 700;">
                            ${project.title || 'Untitled Project'}
                        </h4>
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                            ${project.category ? `
                                <span class="badge bg-info text-dark">
                                    ${this.formatCategory(project.category)}
                                </span>
                            ` : ''}
                            ${StatusBadge.render(project.status || 'pending')}
                            ${project.createdAt ? `
                                <small class="text-muted">
                                    <i class="fa fa-calendar me-1"></i>
                                    ${this.formatDate(project.createdAt)}
                                </small>
                            ` : ''}
                        </div>
                    </div>
                    <button 
                        class="btn btn-sm btn-outline-secondary toggle-expand-btn"
                        onclick="toggleProjectCard('${project.id}')"
                        style="white-space: nowrap;">
                        <i class="fa fa-chevron-down"></i>
                        ${isExpanded ? 'Collapse' : 'Expand'}
                    </button>
                </div>

                <!-- Brief Summary (Collapsed View) -->
                <div class="project-summary ${isExpanded ? 'd-none' : ''}" id="${cardId}-summary">
                    <p class="text-muted mb-0" style="line-height: 1.6;">
                        ${this.truncateText(project.description || sections.problemStatement || 'No description available', 150)}
                    </p>
                </div>

                <!-- Detailed Sections (Expanded View) -->
                <div class="project-sections ${isExpanded ? '' : 'd-none'}" id="${cardId}-sections">
                    ${this.renderSection('Problem Statement', sections.problemStatement, 'fa-exclamation-circle', 'danger')}
                    ${this.renderSection('Objectives', sections.objectives, 'fa-bullseye', 'primary')}
                    ${this.renderSection('Proposed Solution', sections.proposedSolution, 'fa-lightbulb', 'warning')}
                    ${this.renderSection('Expected Impact', sections.expectedImpact, 'fa-chart-line', 'success')}
                    ${sections.additionalNotes ? this.renderSection('Additional Notes', sections.additionalNotes, 'fa-sticky-note', 'info') : ''}
                    
                    <!-- File Attachment -->
                    ${project.fileUrl ? `
                        <div class="project-section mt-3">
                            <a href="${project.fileUrl}" target="_blank" class="btn btn-outline-info btn-sm">
                                <i class="fa fa-file-word me-2"></i>
                                View Document (${project.fileName || 'Download'})
                            </a>
                        </div>
                    ` : ''}

                    <!-- Admin Feedback -->
                    ${project.adminFeedback ? `
                        <div class="alert alert-secondary mt-3" style="border-left: 4px solid #6c757d;">
                            <h6 class="mb-2">
                                <i class="fa fa-comment-dots me-2"></i>
                                Admin Feedback
                            </h6>
                            <p class="mb-0">${project.adminFeedback}</p>
                        </div>
                    ` : ''}
                </div>

                <!-- Actions -->
                ${showActions ? `
                    <div class="project-actions mt-3 pt-3" style="border-top: 1px solid #e9ecef;">
                        <div class="d-flex gap-2 flex-wrap">
                            ${this.renderActions(project)}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render a project section
     */
    static renderSection(title, content, icon, colorClass) {
        if (!content) return '';

        return `
            <div class="project-section mb-3" style="
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid var(--bs-${colorClass});
            ">
                <h6 class="mb-2 text-${colorClass}" style="font-weight: 700;">
                    <i class="fa ${icon} me-2"></i>
                    ${title}
                </h6>
                <p class="mb-0" style="line-height: 1.6; white-space: pre-wrap;">
                    ${content}
                </p>
            </div>
        `;
    }

    /**
     * Extract sections from project data
     * Handles both structured and unstructured data
     */
    static extractSections(project) {
        // If project has structured sections, use them
        if (project.problemStatement || project.objectives) {
            return {
                problemStatement: project.problemStatement || '',
                objectives: project.objectives || '',
                proposedSolution: project.proposedSolution || project.solution || '',
                expectedImpact: project.expectedImpact || project.impact || '',
                additionalNotes: project.additionalNotes || project.notes || ''
            };
        }

        // Otherwise, try to parse from description
        const description = project.description || '';
        return {
            problemStatement: this.extractFromDescription(description, 'problem'),
            objectives: this.extractFromDescription(description, 'objectives'),
            proposedSolution: this.extractFromDescription(description, 'solution'),
            expectedImpact: this.extractFromDescription(description, 'impact'),
            additionalNotes: ''
        };
    }

    /**
     * Extract section from description text
     */
    static extractFromDescription(text, section) {
        // Simple extraction - can be enhanced with better parsing
        const patterns = {
            problem: /problem[:\s]+(.*?)(?=objectives?|solution|impact|$)/is,
            objectives: /objectives?[:\s]+(.*?)(?=solution|impact|$)/is,
            solution: /solution[:\s]+(.*?)(?=impact|$)/is,
            impact: /impact[:\s]+(.*?)$/is
        };

        const match = text.match(patterns[section]);
        return match ? match[1].trim() : text;
    }

    /**
     * Render action buttons based on project status and user role
     */
    static renderActions(project) {
        const actions = [];

        // Add milestone button
        actions.push(`
            <button class="btn btn-sm btn-outline-primary" onclick="showAddMilestone('${project.id}')">
                <i class="fa fa-plus me-1"></i>
                Add Milestone
            </button>
        `);

        // View milestones
        actions.push(`
            <button class="btn btn-sm btn-outline-secondary" onclick="viewMilestones('${project.id}')">
                <i class="fa fa-tasks me-1"></i>
                View Milestones
            </button>
        `);

        // Edit (if draft or pending)
        if (project.status === 'draft' || project.status === 'pending') {
            actions.push(`
                <button class="btn btn-sm btn-outline-warning" onclick="editProject('${project.id}')">
                    <i class="fa fa-edit me-1"></i>
                    Edit
                </button>
            `);
        }

        return actions.join('');
    }

    /**
     * Format category for display
     */
    static formatCategory(category) {
        return category
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Format date for display
     */
    static formatDate(date) {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
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

/**
 * Toggle project card expansion
 */
window.toggleProjectCard = function(projectId) {
    const cardId = `project-card-${projectId}`;
    const summary = document.getElementById(`${cardId}-summary`);
    const sections = document.getElementById(`${cardId}-sections`);
    const button = document.querySelector(`#${cardId} .toggle-expand-btn`);

    if (summary && sections && button) {
        const isExpanded = !summary.classList.contains('d-none');
        
        if (isExpanded) {
            // Collapse
            summary.classList.add('d-none');
            sections.classList.remove('d-none');
            button.innerHTML = '<i class="fa fa-chevron-up"></i> Collapse';
        } else {
            // Expand
            summary.classList.remove('d-none');
            sections.classList.add('d-none');
            button.innerHTML = '<i class="fa fa-chevron-down"></i> Expand';
        }
    }
};

// Export to window for non-module scripts
window.StructuredProjectCard = StructuredProjectCard;

export default StructuredProjectCard;

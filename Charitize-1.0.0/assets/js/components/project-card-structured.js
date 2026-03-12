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
            cardClass = 'mb-4'
        } = options;

        const cardId = `project-card-${project.id}`;
        const sections = this.extractSections(project);

        // Icons
        const icons = {
            calendar: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            expand: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;"><path d="M19 9l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            collapse: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;"><path d="M5 15l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        };

        return `
            <div class="theme-section-card ${cardClass}" id="${cardId}">
                <!-- Card Header -->
                <div class="project-card-header d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
                    <div style="flex: 1;">
                        <h4 class="mb-2 fw-800" style="color: #1a5e4f; font-family: var(--font-head);">
                            ${project.title || 'Untitled Project'}
                        </h4>
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                            ${project.category ? `
                                <span class="badge bg-light text-dark border" style="color: #1a5e4f !important;">
                                    ${this.formatCategory(project.category)}
                                </span>
                            ` : ''}
                            ${StatusBadge.render(project.status || 'pending')}
                            ${project.createdAt ? `
                                <small class="text-muted d-flex align-items-center gap-1 ms-2">
                                    ${icons.calendar}
                                    ${this.formatDate(project.createdAt)}
                                </small>
                            ` : ''}
                        </div>
                    </div>
                    <button 
                        class="btn btn-sm rounded-pill toggle-expand-btn d-flex align-items-center gap-2 px-3"
                        style="border: 1px solid #1a5e4f; color: #1a5e4f; background: transparent; transition: all 0.3s ease;"
                        onmouseover="this.style.background='#1a5e4f'; this.style.color='#fff';"
                        onmouseout="this.style.background='transparent'; this.style.color='#1a5e4f';"
                        onclick="toggleProjectCard('${project.id}')">
                        ${isExpanded ? icons.collapse : icons.expand}
                        <span class="fw-bold fs-7">${isExpanded ? 'Collapse' : 'Expand'}</span>
                    </button>
                </div>

                <!-- Brief Summary (Collapsed View) -->
                <div class="project-summary ${isExpanded ? 'd-none' : ''}" id="${cardId}-summary">
                    <p class="text-muted mb-0" style="line-height: 1.7;">
                        ${this.truncateText(project.description || sections.problemStatement || 'No description available', 180)}
                    </p>
                </div>

                <!-- Detailed Sections (Expanded View) -->
                <div class="project-sections ${isExpanded ? '' : 'd-none'}" id="${cardId}-sections">
                    ${this.renderSection('Problem Statement', sections.problemStatement, 'problem', 'danger')}
                    ${this.renderSection('Objectives', sections.objectives, 'objectives', 'primary')}
                    ${this.renderSection('Proposed Solution', sections.proposedSolution, 'solution', 'warning')}
                    ${this.renderSection('Expected Impact', sections.expectedImpact, 'impact', 'success')}
                    ${sections.additionalNotes ? this.renderSection('Additional Notes', sections.additionalNotes, 'notes', 'info') : ''}
                    
                    <!-- File Attachment -->
                    ${project.fileUrl ? `
                        <div class="project-section-improved mt-3" style="border-left-color: #0dcaf0;">
                            <a href="${project.fileUrl}" target="_blank" class="btn btn-link p-0 text-decoration-none d-inline-flex align-items-center gap-2 fw-bold text-dark">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:20px;height:20px;"><path d="M7 21h10a2 2 0 002-2V9l-5-5H7a2 2 0 00-2 2v14a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 4v5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                ${project.fileName || 'View Attached Case Study'}
                            </a>
                        </div>
                    ` : ''}

                    <!-- Admin Feedback -->
                    ${project.adminFeedback ? `
                        <div class="alert mt-4 border-0 shadow-sm" style="background: rgba(26, 94, 79, 0.05); border-left: 4px solid #f3a813 !important;">
                            <h6 class="mb-2 fw-800 d-flex align-items-center gap-2" style="color: #1a5e4f;">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                Official Response
                            </h6>
                            <p class="mb-0 fs-7" style="color: #475569;">${project.adminFeedback}</p>
                        </div>
                    ` : ''}
                </div>

                <!-- Actions -->
                ${showActions ? `
                    <div class="project-actions mt-4 pt-3 border-top">
                        <div class="d-flex gap-3 flex-wrap">
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
    static renderSection(title, content, iconKey, colorClass) {
        if (!content) return '';

        const iconMap = {
            problem: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            objectives: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;"><path d="M12 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            solution: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;"><path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l.707.707M6.586 17H6a2 2 0 01-2-2V9a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2h-.586" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            impact: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            notes: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        };

        return `
            <div class="project-section-improved mb-3">
                <h6 class="mb-2 d-flex align-items-center gap-2 fw-800" style="color: #475569;">
                    ${iconMap[iconKey] || ''}
                    ${title}
                </h6>
                <p class="mb-0 text-muted" style="line-height: 1.6; white-space: pre-wrap; font-size: 0.9rem;">
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
        const plusIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;"><path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        const taskIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        const editIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

        // Add milestone button
        actions.push(`
            <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-2" onclick="showAddMilestone('${project.id}')">
                ${plusIcon}
                Add Milestone
            </button>
        `);

        // View milestones
        actions.push(`
            <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2" onclick="viewMilestones('${project.id}')">
                ${taskIcon}
                View Milestones
            </button>
        `);

        // Edit (if draft or pending)
        if (project.status === 'draft' || project.status === 'pending') {
            actions.push(`
                <button class="btn btn-sm btn-outline-warning d-flex align-items-center gap-2" onclick="editProject('${project.id}')">
                    ${editIcon}
                    Edit
                </button>
            `);
        }

        // Delete button
        const trashIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        actions.push(`
            <button class="btn btn-sm btn-outline-danger d-flex align-items-center gap-2" onclick="window.confirmDeleteProject('${project.id}')">
                ${trashIcon}
                Delete
            </button>
        `);

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
        const isCurrentlyExpanded = summary.classList.contains('d-none');
        
        if (isCurrentlyExpanded) {
            // Collapse it
            summary.classList.remove('d-none');
            sections.classList.add('d-none');
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;"><path d="M19 9l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Expand
            `;
        } else {
            // Expand it
            summary.classList.add('d-none');
            sections.classList.remove('d-none');
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;"><path d="M5 15l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Collapse
            `;
        }
    }
};

// Export to window for non-module scripts
window.StructuredProjectCard = StructuredProjectCard;

export default StructuredProjectCard;

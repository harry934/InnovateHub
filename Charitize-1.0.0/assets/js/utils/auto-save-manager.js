/**
 * Auto-Save Manager
 * Automatically saves form data to localStorage drafts
 */

export class AutoSaveManager {
    constructor(formId, userId, draftType = 'project') {
        this.formId = formId;
        this.userId = userId;
        this.draftType = draftType;
        this.form = null;
        this.saveInterval = null;
        this.lastSaveTime = null;
        this.isDirty = false;
        this.saveIntervalMs = 15000; // 15 seconds
        this.storageKey = `draft_${this.userId}_${this.draftType}`;
    }

    /**
     * Initialize auto-save
     */
    async init() {
        this.form = document.getElementById(this.formId);
        if (!this.form) {
            console.error('Form not found:', this.formId);
            return;
        }

        // Add save indicator
        this.addSaveIndicator();

        // Listen for form changes
        this.form.addEventListener('input', () => {
            this.isDirty = true;
        });

        // Start auto-save interval
        this.startAutoSave();

        // Load existing draft
        await this.loadDraft();

        // Save on page unload
        window.addEventListener('beforeunload', () => {
            if (this.isDirty) {
                this.saveDraft();
            }
        });
    }

    /**
     * Add save indicator to form
     */
    addSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'autoSaveIndicator';
        indicator.className = 'auto-save-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 0.5rem 1rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-size: 0.85rem;
            color: #6c757d;
            display: none;
            align-items: center;
            gap: 0.5rem;
            z-index: 1000;
        `;
        indicator.innerHTML = `
            <i class="fa fa-circle-notch fa-spin" style="display: none;"></i>
            <i class="fa fa-check-circle" style="color: #198754; display: none;"></i>
            <span class="save-text">Draft saved</span>
        `;
        document.body.appendChild(indicator);
    }

    /**
     * Show save indicator
     */
    showSaveIndicator(status = 'saving') {
        const indicator = document.getElementById('autoSaveIndicator');
        if (!indicator) return;

        const spinner = indicator.querySelector('.fa-spin');
        const checkmark = indicator.querySelector('.fa-check-circle');
        const text = indicator.querySelector('.save-text');

        indicator.style.display = 'flex';

        if (status === 'saving') {
            spinner.style.display = 'inline-block';
            checkmark.style.display = 'none';
            text.textContent = 'Saving draft...';
        } else if (status === 'saved') {
            spinner.style.display = 'none';
            checkmark.style.display = 'inline-block';
            text.textContent = `Draft saved at ${this.formatTime(new Date())}`;
            
            // Hide after 3 seconds
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Start auto-save interval
     */
    startAutoSave() {
        this.saveInterval = setInterval(async () => {
            if (this.isDirty) {
                await this.saveDraft();
            }
        }, this.saveIntervalMs);
    }

    /**
     * Stop auto-save interval
     */
    stopAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }

    /**
     * Save draft to localStorage
     */
    async saveDraft() {
        if (!this.form || !this.userId) return;

        this.showSaveIndicator('saving');

        try {
            const formData = new FormData(this.form);
            const draftData = {};

            // Convert FormData to object
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) continue;
                draftData[key] = value;
            }

            // Capture input values directly
            const inputs = this.form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.type !== 'file' && input.id) {
                    draftData[input.id] = input.value;
                }
            });

            // Save to localStorage
            const payload = {
                ...draftData,
                draftType: this.draftType,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(payload));

            this.isDirty = false;
            this.lastSaveTime = new Date();
            this.showSaveIndicator('saved');

        } catch (error) {
            console.error('Error saving draft locally:', error);
        }
    }

    /**
     * Load draft from localStorage
     */
    async loadDraft() {
        if (!this.userId) return;

        try {
            const draftJson = localStorage.getItem(this.storageKey);
            if (!draftJson) return;

            const draftData = JSON.parse(draftJson);
            // Auto-restore without prompt for seamless UX as per earlier revision logic
            this.restoreDraft(draftData);
            
        } catch (error) {
            console.error('Error loading draft locally:', error);
        }
    }

    /**
     * Restore draft data to form
     */
    restoreDraft(draftData) {
        if (!this.form) return;

        Object.keys(draftData).forEach(key => {
            if (key === 'draftType' || key === 'updatedAt') return;

            const field = this.form.querySelector(`#${key}, [name="${key}"]`);
            if (field && field.type !== 'file') {
                field.value = draftData[key];
            }
        });

        if (window.showSuccessMessage) {
            window.showSuccessMessage('Draft restored from local session.');
        }
    }

    /**
     * Clear draft from localStorage
     */
    async clearDraft() {
        if (!this.userId) return;
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Format time for display
     */
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Clean up
     */
    destroy() {
        this.stopAutoSave();
    }
}

// Export to window for non-module scripts
window.AutoSaveManager = AutoSaveManager;

export default AutoSaveManager;

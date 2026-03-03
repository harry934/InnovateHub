/**
 * Auto-Save Manager
 * Automatically saves form data to Firestore drafts collection
 */

import { db } from '../core/firebase-config.js';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
     * Save draft to Firestore
     */
    async saveDraft() {
        if (!this.form || !this.userId) return;

        this.showSaveIndicator('saving');

        try {
            const formData = new FormData(this.form);
            const draftData = {};

            // Convert FormData to object
            for (let [key, value] of formData.entries()) {
                // Skip file inputs for now (handle separately if needed)
                if (value instanceof File) continue;
                draftData[key] = value;
            }

            // Also capture input values directly (for fields not in FormData)
            const inputs = this.form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.type !== 'file' && input.id) {
                    draftData[input.id] = input.value;
                }
            });

            // Save to Firestore
            const draftRef = doc(db, 'projectDrafts', this.userId);
            await setDoc(draftRef, {
                ...draftData,
                draftType: this.draftType,
                updatedAt: serverTimestamp()
            });

            this.isDirty = false;
            this.lastSaveTime = new Date();
            this.showSaveIndicator('saved');

        } catch (error) {
            console.error('Error saving draft:', error);
        }
    }

    /**
     * Load draft from Firestore
     */
    async loadDraft() {
        if (!this.userId) return;

        try {
            const draftRef = doc(db, 'projectDrafts', this.userId);
            const draftSnap = await getDoc(draftRef);

            if (draftSnap.exists()) {
                const draftData = draftSnap.data();
                
                // Show restore prompt
                const shouldRestore = confirm(
                    'We found a saved draft from your last session. Would you like to restore it?'
                );

                if (shouldRestore) {
                    this.restoreDraft(draftData);
                } else {
                    // Delete the draft if user doesn't want it
                    await this.clearDraft();
                }
            }
        } catch (error) {
            console.error('Error loading draft:', error);
        }
    }

    /**
     * Restore draft data to form
     */
    restoreDraft(draftData) {
        if (!this.form) return;

        // Populate form fields
        Object.keys(draftData).forEach(key => {
            if (key === 'draftType' || key === 'updatedAt') return;

            const field = this.form.querySelector(`#${key}, [name="${key}"]`);
            if (field && field.type !== 'file') {
                field.value = draftData[key];
            }
        });

        // Show notification
        if (window.showSuccessMessage) {
            window.showSuccessMessage('Draft restored successfully!');
        }
    }

    /**
     * Clear draft from Firestore
     */
    async clearDraft() {
        if (!this.userId) return;

        try {
            const draftRef = doc(db, 'projectDrafts', this.userId);
            await deleteDoc(draftRef);
        } catch (error) {
            console.error('Error clearing draft:', error);
        }
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

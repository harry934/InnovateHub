/**
 * Notification System
 * Global notification bell with dropdown panel and real-time updates
 */

import { db } from '../firebase-config.js';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export class NotificationSystem {
    constructor(userId) {
        this.userId = userId;
        this.notifications = [];
        this.unreadCount = 0;
        this.bellElement = null;
        this.dropdownElement = null;
        this.unsubscribe = null;
    }

    /**
     * Initialize the notification system
     * @param {string} containerId - ID of the container element for the bell icon
     */
    init(containerId = 'notificationBell') {
        this.createBellIcon(containerId);
        this.createDropdown();
        this.startListening();
    }

    /**
     * Create the notification bell icon
     */
    createBellIcon(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Notification container not found:', containerId);
            return;
        }

        container.innerHTML = `
            <div class="notification-bell-wrapper" style="position: relative; cursor: pointer;">
                <i class="fa fa-bell" style="font-size: 1.5rem; color: rgba(255,255,255,0.9);"></i>
                <span class="notification-badge" style="
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #dc3545;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 700;
                    display: none;
                ">0</span>
            </div>
        `;

        this.bellElement = container.querySelector('.notification-bell-wrapper');
        this.bellElement.addEventListener('click', () => this.toggleDropdown());
    }

    /**
     * Create the notification dropdown panel
     */
    createDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'notification-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 10px;
            width: 350px;
            max-height: 400px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            z-index: 1000;
            overflow: hidden;
        `;

        dropdown.innerHTML = `
            <div class="notification-header" style="
                padding: 1rem;
                border-bottom: 1px solid #e9ecef;
                background: #f8f9fa;
                font-weight: 700;
                color: #1a5e4f;
            ">
                Notifications
            </div>
            <div class="notification-list" style="
                overflow-y: auto;
                max-height: 320px;
            ">
                <div class="notification-empty" style="
                    padding: 2rem;
                    text-align: center;
                    color: #6c757d;
                ">
                    <i class="fa fa-bell-slash fa-2x mb-2" style="color: #dee2e6;"></i>
                    <p>No notifications yet</p>
                </div>
            </div>
        `;

        // Append to the bell's parent container
        if (this.bellElement && this.bellElement.parentElement) {
            this.bellElement.parentElement.style.position = 'relative';
            this.bellElement.parentElement.appendChild(dropdown);
        }

        this.dropdownElement = dropdown;

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.bellElement?.contains(e.target) && !this.dropdownElement?.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    /**
     * Toggle dropdown visibility
     */
    toggleDropdown() {
        if (this.dropdownElement.style.display === 'flex') {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    /**
     * Open dropdown
     */
    openDropdown() {
        if (this.dropdownElement) {
            this.dropdownElement.style.display = 'flex';
        }
    }

    /**
     * Close dropdown
     */
    closeDropdown() {
        if (this.dropdownElement) {
            this.dropdownElement.style.display = 'none';
        }
    }

    /**
     * Start listening for notifications
     */
    startListening() {
        if (!this.userId) {
            console.error('User ID required for notifications');
            return;
        }

        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', this.userId),
            orderBy('createdAt', 'desc')
        );

        this.unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            this.notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.updateUI();
        });
    }

    /**
     * Update UI with current notifications
     */
    updateUI() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.updateBadge();
        this.updateDropdownList();
        
        // Update list if container exists
        if (this.listContainerId) {
            this.updateFullList();
        }
    }

    /**
     * Bind a container for full list view
     * @param {string} containerId 
     */
    bindFullList(containerId) {
        this.listContainerId = containerId;
        this.updateFullList();
    }

    /**
     * Update the full notification list view
     */
    updateFullList() {
        const listContainer = document.getElementById(this.listContainerId);
        if (!listContainer) return;

        if (this.notifications.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="fa fa-bell-slash fa-3x text-light mb-3"></i>
                    <p class="text-muted">No notifications yet</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = this.notifications.map(notif => `
            <div class="list-group-item list-group-item-action p-3 border-bottom mb-2 rounded shadow-sm notification-page-item" 
                 data-notif-id="${notif.id}"
                 style="border-left: 5px solid ${this.getTypeColor(notif.type)}; background: ${notif.read ? '#fff' : '#f0f7f5'}; cursor: pointer;">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1 ${notif.read ? 'fw-normal' : 'fw-bold'}">${notif.message}</h6>
                        <small class="text-muted"><i class="fa fa-clock me-1"></i>${this.formatTimestamp(notif.createdAt?.toDate ? notif.createdAt.toDate() : new Date())}</small>
                    </div>
                    ${!notif.read ? '<span class="badge bg-success rounded-pill">New</span>' : ''}
                </div>
            </div>
        `).join('');

        // Add click handlers for full list
        listContainer.querySelectorAll('.notification-page-item').forEach(item => {
            item.addEventListener('click', () => {
                this.markAsRead(item.dataset.notifId);
            });
        });
    }

    getTypeColor(type) {
        const typeColors = {
            success: '#1a5e4f',
            error: '#dc3545',
            warning: '#f3a813',
            info: '#0dcaf0'
        };
        return typeColors[type] || '#6c757d';
    }

    /**
     * Update notification badge
     */
    updateBadge() {
        const badge = this.bellElement?.querySelector('.notification-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    /**
     * Update dropdown notification list
     */
    updateDropdownList() {
        const listContainer = this.dropdownElement?.querySelector('.notification-list');
        if (!listContainer) return;

        if (this.notifications.length === 0) {
            listContainer.innerHTML = `
                <div class="notification-empty" style="
                    padding: 2rem;
                    text-align: center;
                    color: #6c757d;
                ">
                    <i class="fa fa-bell-slash fa-2x mb-2" style="color: #dee2e6;"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = this.notifications.map(notif => this.renderNotification(notif)).join('');

        // Add click handlers
        listContainer.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const notifId = item.dataset.notifId;
                this.markAsRead(notifId);
                if (item.dataset.actionUrl) {
                    window.location.href = item.dataset.actionUrl;
                }
            });
        });
    }

    /**
     * Render a single notification
     */
    renderNotification(notif) {
        const typeColors = {
            success: '#198754',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#0dcaf0'
        };

        const color = typeColors[notif.type] || '#6c757d';
        const timestamp = notif.createdAt?.toDate ? 
            this.formatTimestamp(notif.createdAt.toDate()) : 
            'Just now';

        return `
            <div class="notification-item" 
                 data-notif-id="${notif.id}"
                 data-action-url="${notif.actionUrl || ''}"
                 style="
                     padding: 1rem;
                     border-bottom: 1px solid #e9ecef;
                     cursor: pointer;
                     transition: background 0.2s ease;
                     background: ${notif.read ? 'white' : '#f8f9fa'};
                     border-left: 4px solid ${color};
                 "
                 onmouseover="this.style.background='#f8f9fa'"
                 onmouseout="this.style.background='${notif.read ? 'white' : '#f8f9fa'}'">
                <div style="display: flex; align-items: start; gap: 0.75rem;">
                    <i class="fa fa-circle" style="
                        font-size: 0.5rem; 
                        color: ${color}; 
                        margin-top: 0.4rem;
                        ${notif.read ? 'opacity: 0.3;' : ''}
                    "></i>
                    <div style="flex: 1;">
                        <p style="margin: 0; font-size: 0.9rem; color: #2c3e50; font-weight: ${notif.read ? '400' : '600'};">
                            ${notif.message}
                        </p>
                        <small style="color: #6c757d; font-size: 0.75rem;">
                            ${timestamp}
                        </small>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notifId) {
        try {
            await updateDoc(doc(db, 'notifications', notifId), {
                read: true
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    /**
     * Clean up listeners
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Export to window for non-module scripts
window.NotificationSystem = NotificationSystem;

export default NotificationSystem;

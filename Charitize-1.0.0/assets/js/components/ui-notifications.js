/**
 * UI Notifications Utility
 * Provides professional toast notifications for user interactions.
 */

const Notifications = {
    container: null,

    init() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'fixed bottom-6 right-6 z-[2000] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(this.container);

        const style = document.createElement('style');
        style.textContent = `
            .toast-enter { transform: translateX(100%); opacity: 0; }
            .toast-enter-active { transform: translateX(0); opacity: 1; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            .toast-exit { transform: scale(0.9); opacity: 0; transition: all 0.3s ease; }
        `;
        document.head.appendChild(style);
    },

    show(message, type = 'success', duration = 4000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast-enter flex items-center gap-3 px-5 py-4 rounded-2xl shadow-elevated text-sm font-bold pointer-events-auto min-w-[300px] border-l-4 ${
            type === 'success' ? 'bg-emerald-900 text-white border-emerald-400' : 
            type === 'error' ? 'bg-red-900 text-white border-red-400' : 
            'bg-amber-900 text-white border-amber-400'
        }`;

        const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
        
        toast.innerHTML = `
            <span class="material-symbols-outlined fs-5">${icon}</span>
            <div class="flex-grow">${message}</div>
            <button class="opacity-50 hover:opacity-100 transition-opacity" onclick="this.parentElement.remove()">
                <span class="material-symbols-outlined fs-6">close</span>
            </button>
        `;

        this.container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('toast-enter-active');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    info(msg) { this.show(msg, 'info'); }
};

window.InnovateNotifications = Notifications;
export default Notifications;

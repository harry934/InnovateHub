/**
 * Request Expiration Service
 * Handles automatic expiration of mentorship requests
 */

export class RequestExpirationService {
    static EXPIRATION_DAYS = 7; // Configurable expiration period

    /**
     * Check and expire old requests
     * This should be called periodically (e.g., on dashboard load)
     */
    static async checkExpiredRequests() {
        try {
            if (!window.SupabaseService) return;

            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() - this.EXPIRATION_DAYS);

            // Fetch pending requests from Supabase
            const allRequests = await window.SupabaseService.getMentorships();
            const pendingRequests = allRequests.filter(r => 
                r.status === 'pending' && 
                new Date(r.created_at) < expirationDate
            );
            
            const expirationPromises = pendingRequests.map(async (r) => {
                await this.expireRequest(r.id, r);
            });

            await Promise.all(expirationPromises);

            if (pendingRequests.length > 0) {
                console.log(`Expired ${pendingRequests.length} old mentorship requests`);
            }

        } catch (error) {
            console.error('Error checking expired requests:', error);
        }
    }

    /**
     * Expire a single request
     */
    static async expireRequest(requestId, requestData) {
        try {
            if (!window.SupabaseService) return;

            // Update request status in Supabase
            await window.SupabaseService.updateMentorshipStatus(requestId, 'expired', {
                expired_at: new Date().toISOString()
            });

            // Notify the requester (innovator)
            if (requestData.innovator_id || requestData.innovatorId) {
                const targetId = requestData.innovator_id || requestData.innovatorId;
                if (window.NotificationSystem) {
                    await window.NotificationSystem.send(
                        targetId,
                        'Your mentorship request has expired due to no response. You can send a new request.',
                        'warning'
                    );
                }
            }

            // Optionally notify the mentor
            if (requestData.mentor_id || requestData.mentorId) {
                const targetId = requestData.mentor_id || requestData.mentorId;
                if (window.NotificationSystem) {
                    await window.NotificationSystem.send(
                        targetId,
                        'A mentorship request has expired.',
                        'info'
                    );
                }
            }

        } catch (error) {
            console.error('Error expiring request:', error);
        }
    }

    /**
     * Get days until expiration for a request
     */
    static getDaysUntilExpiration(createdAt) {
        if (!createdAt) return 0;

        const createdDate = new Date(createdAt);
        const expirationDate = new Date(createdDate);
        expirationDate.setDate(expirationDate.getDate() + this.EXPIRATION_DAYS);

        const now = new Date();
        const daysLeft = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

        return Math.max(0, daysLeft);
    }

    /**
     * Check if a request is about to expire (within 2 days)
     */
    static isExpiringSoon(createdAt) {
        const daysLeft = this.getDaysUntilExpiration(createdAt);
        return daysLeft > 0 && daysLeft <= 2;
    }

    /**
     * Render expiration warning badge
     */
    static renderExpirationWarning(createdAt) {
        const daysLeft = this.getDaysUntilExpiration(createdAt);
        
        if (daysLeft === 0) {
            return `<span class="badge bg-danger">Expiring Today</span>`;
        } else if (daysLeft <= 2) {
            return `<span class="badge bg-warning text-dark">Expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}</span>`;
        }
        return '';
    }
}

// Export to window for non-module scripts
window.RequestExpirationService = RequestExpirationService;

export default RequestExpirationService;

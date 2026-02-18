/**
 * Request Expiration Service
 * Handles automatic expiration of mentorship requests
 */

import { db } from '../firebase-config.js';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { NotificationService } from '../innovate-hub.js';

export class RequestExpirationService {
    static EXPIRATION_DAYS = 7; // Configurable expiration period

    /**
     * Check and expire old requests
     * This should be called periodically (e.g., on dashboard load)
     */
    static async checkExpiredRequests() {
        try {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() - this.EXPIRATION_DAYS);

            // Query pending requests older than expiration date
            const requestsQuery = query(
                collection(db, 'mentorshipRequests'),
                where('status', '==', 'pending'),
                where('createdAt', '<', Timestamp.fromDate(expirationDate))
            );

            const snapshot = await getDocs(requestsQuery);
            
            const expirationPromises = snapshot.docs.map(async (docSnap) => {
                const requestData = docSnap.data();
                await this.expireRequest(docSnap.id, requestData);
            });

            await Promise.all(expirationPromises);

            if (snapshot.docs.length > 0) {
                console.log(`Expired ${snapshot.docs.length} old mentorship requests`);
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
            // Update request status
            await updateDoc(doc(db, 'mentorshipRequests', requestId), {
                status: 'expired',
                expiredAt: Timestamp.now()
            });

            // Notify the requester (innovator)
            if (requestData.innovatorId) {
                await NotificationService.send(
                    requestData.innovatorId,
                    'Your mentorship request has expired due to no response. You can send a new request.',
                    'warning'
                );
            }

            // Optionally notify the mentor
            if (requestData.mentorId) {
                await NotificationService.send(
                    requestData.mentorId,
                    'A mentorship request has expired.',
                    'info'
                );
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

        const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
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

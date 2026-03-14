import { db } from '../core/firebase-config.js';
import { 
    collection, query, where, getDocs, addDoc, serverTimestamp, 
    limit, orderBy, doc, setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * ActivityTracker handles logging daily user interactions.
 * It ensures only one activity record per user per day is created.
 */
export class ActivityTracker {
    constructor(uid) {
        this.uid = uid;
        this.collectionRef = collection(db, 'userActivity');
    }

    /**
     * Logs activity for the current day.
     * Uses a document ID based on the date to ensure idempotency.
     */
    async logDailyActivity() {
        if (!this.uid) return;

        const now = new Date();
        const dateId = `${this.uid}_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        
        try {
            const activityDoc = doc(db, 'userActivity', dateId);
            await setDoc(activityDoc, {
                uid: this.uid,
                timestamp: serverTimestamp(),
                date: now.toISOString().split('T')[0],
                type: 'login_activity'
            }, { merge: true });
            
            console.log("Activity tracked for today:", dateId);
        } catch (err) {
            console.warn("Failed to log activity:", err);
        }
    }

    /**
     * Fetches activity data for the last 365 days.
     */
    async getActivityLastYear() {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const q = query(
            this.collectionRef,
            where('uid', '==', this.uid)
        );

        try {
            const snapshot = await getDocs(q);
            const activityMap = {};
            const oneYearAgoMs = oneYearAgo.getTime();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const ts = data.timestamp?.toDate ? data.timestamp.toDate().getTime() : 0;
                
                if (ts >= oneYearAgoMs) {
                    const date = data.date;
                    activityMap[date] = (activityMap[date] || 0) + 1;
                }
            });
            
            return activityMap;
        } catch (err) {
            console.error("Error fetching activity data:", err);
            return {};
        }
    }
}

window.ActivityTracker = ActivityTracker;

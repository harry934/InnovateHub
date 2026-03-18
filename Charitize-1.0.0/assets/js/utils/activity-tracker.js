// Firestore imports removed
// ActivityTracker handles logging daily user interactions.

export class ActivityTracker {
    constructor(uid) {
        this.uid = uid;
    }

    /**
     * Logs activity for the current day.
     * Uses a document ID based on the date to ensure idempotency.
     */
    async logDailyActivity() {
        if (!this.uid || !window.SupabaseService) return;

        try {
            await window.SupabaseService.logActivity(this.uid);
            console.log("Activity tracked for today in Supabase ✓");
        } catch (err) {
            console.warn("Failed to log activity in Supabase:", err);
        }
    }

    /**
     * Fetches activity data for the last 365 days.
     */
    async getActivityLastYear() {
        if (!this.uid || !window.SupabaseService) return {};

        try {
            const data = await window.SupabaseService.getActivityLastYear(this.uid);
            const activityMap = {};
            
            data.forEach(row => {
                const date = row.activity_date;
                activityMap[date] = (activityMap[date] || 0) + 1;
            });
            
            return activityMap;
        } catch (err) {
            console.error("Error fetching activity data from Supabase:", err);
            return {};
        }
    }
}

window.ActivityTracker = ActivityTracker;

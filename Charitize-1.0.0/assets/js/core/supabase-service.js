/**
 * Supabase Service Layer (Refactored)
 * Handles all data operations for the InnovateHub platform.
 * Single source of truth for Supabase interactions.
 */

const SupabaseService = {
    // â”€â”€â”€ Profile Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    async upsertProfile(profile) {
        try {
            const { data, error } = await window.supabase
                .from('profiles')
                .upsert([profile])
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'upsertProfile');
        }
    },

    async getProfile(userId) {
        try {
            const { data, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            if (error) throw error;
            return data;
        } catch (error) {
            return this.handleSupabaseError(error, 'getProfile');
        }
    },

    async getProfilesByRole(role = 'all') {
        try {
            let query = window.supabase.from('profiles').select('*');
            if (role !== 'all') {
                query = query.eq('role', role);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) {
            return this.handleSupabaseError(error, 'getProfilesByRole');
        }
    },

    async getAllProfiles(role = null) {
        return this.getProfilesByRole(role || 'all');
    },

    async updateProfileStatus(userId, status) {
        try {
            const { data, error } = await window.supabase
                .from('profiles')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', userId)
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'updateProfileStatus');
        }
    },

    // â”€â”€â”€ Projects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    async getProjects(filter = {}) {
        try {
            let query = window.supabase
                .from('projects')
                .select('*, innovator:profiles!fk_project_innovator(full_name, email)');
            
            if (filter.innovator_id) query = query.eq('innovator_id', filter.innovator_id);
            if (filter.user_id) query = query.eq('innovator_id', filter.user_id); // fallback alias
            if (filter.status) query = query.eq('status', filter.status);
            if (filter.id) query = query.eq('id', filter.id);
            
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            
            if (data.length === 0 && (filter.innovator_id || filter.user_id)) {
                console.log(`SupabaseService: No projects found for innovator ${filter.innovator_id || filter.user_id}.`);
            }
            return data;
        } catch (error) {
            return this.handleSupabaseError(error, 'getProjects');
        }
    },

    async getProjectsByInnovator(innovatorId) {
        return this.getProjects({ innovator_id: innovatorId });
    },

    async createProject(projectData) {
        try {
            const { data, error } = await window.supabase
                .from('projects')
                .insert([projectData])
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'createProject');
        }
    },

    async updateProjectStatus(projectId, status) {
        try {
            const { data, error } = await window.supabase
                .from('projects')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', projectId)
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'updateProjectStatus');
        }
    },

    async deleteProject(projectId) {
        try {
            // Manually delete related records first to prevent orphaned UI state in Collaboration Hub
            await window.supabase.from('mentorships').delete().eq('project_id', projectId);
            await window.supabase.from('section_feedback').delete().eq('project_id', projectId);

            const { error } = await window.supabase
                .from('projects')
                .delete()
                .eq('id', projectId);
            if (error) throw error;
            return true;
        } catch (error) {
            return this.handleSupabaseError(error, 'deleteProject');
        }
    },

    async getMentorships(userId = null, role = null) {
        try {
            let query = window.supabase
                .from('mentorships')
                .select(`
                    *,
                    mentor:profiles!fk_mentorship_mentor(id, full_name, email, avatar_url, role),
                    innovator:profiles!fk_mentorship_innovator(id, full_name, email, avatar_url, role),
                    project:projects!fk_mentorship_project(
                        id, title, problem_statement, target_area, 
                        proposed_solution, objectives, expected_impact
                    )
                `);
            
            if (userId && role) {
                const column = role === 'mentor' ? 'mentor_id' : 'innovator_id';
                query = query.eq(column, userId);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            return this.handleSupabaseError(error, 'getMentorships');
        }
    },

    async getPendingAdminMentorships() {
        try {
            const { data, error } = await window.supabase
                .from('mentorships')
                .select(`
                    *,
                    innovator:profiles!fk_mentorship_innovator(full_name, email),
                    mentor:profiles!fk_mentorship_mentor(full_name, email),
                    project:projects!fk_mentorship_project(title)
                `)
                .eq('status', 'pending');
            if (error) throw error;
            return data;
        } catch (error) {
            return this.handleSupabaseError(error, 'getPendingAdminMentorships');
        }
    },

    async createMentorship(mentorshipData) {
        try {
            const { data, error } = await window.supabase
                .from('mentorships')
                .insert([mentorshipData])
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'createMentorship');
        }
    },

    async updateMentorshipStatus(id, status, metadata = {}) {
        try {
            const payload = { 
                status, 
                updated_at: new Date().toISOString(),
                ...metadata 
            };
            const { data, error } = await window.supabase
                .from('mentorships')
                .update(payload)
                .eq('id', id)
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'updateMentorshipStatus');
        }
    },

    async updatePinnedGuidance(mentorshipId, pinned_guidance) {
        try {
            const { data, error } = await window.supabase
                .from('mentorships')
                .update({ pinned_guidance, updated_at: new Date().toISOString() })
                .eq('id', mentorshipId)
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'updatePinnedGuidance');
        }
    },

    async updateMentorshipReportsStatus(mentorshipId, enabled) {
        try {
            const { data, error } = await window.supabase
                .from('mentorships')
                .update({ 
                    reports_enabled: enabled,
                    updated_at: new Date().toISOString()
                })
                .eq('id', mentorshipId)
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'updateMentorshipReportsStatus');
        }
    },

    async getMentorshipByProject(projectId, userId) {
        try {
            const { data, error } = await window.supabase
                .from('mentorships')
                .select(`
                    *,
                    mentor:profiles!fk_mentorship_mentor(id, full_name, email, avatar_url, role),
                    innovator:profiles!fk_mentorship_innovator(id, full_name, email, avatar_url, role),
                    project:projects!fk_mentorship_project(
                        id, title, problem_statement, proposed_solution, target_area,
                        objectives, expected_impact
                    )
                `)
                .eq('project_id', projectId)
                .eq('status', 'accepted')
                .or(`mentor_id.eq.${userId},innovator_id.eq.${userId}`)
                .maybeSingle();
            
            if (error) throw error;
            return data;
        } catch (error) {
            return this.handleSupabaseError(error, 'getMentorshipByProject');
        }
    },

    // â”€â”€â”€ Sessions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    async getSessions(mentorshipId) {
        if (!mentorshipId) return [];
        try {
            const { data, error } = await window.supabase
                .from('mentorship_sessions')
                .select('*')
                .eq('mentorship_id', mentorshipId)
                .order('session_date', { ascending: true });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("SupabaseService: getSessions failed", error);
            return [];
        }
    },

    async createSession(sessionData) {
        try {
            const { data, error } = await window.supabase
                .from('mentorship_sessions')
                .insert([sessionData])
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'createSession');
        }
    },

    async getUpcomingSessionsCount(userId, role) {
        try {
            const mentorships = await this.getMentorships(userId, role);
            if (!mentorships || mentorships.length === 0) return 0;

            let total = 0;
            const now = new Date();
            for (const m of mentorships) {
                const sessions = await this.getSessions(m.id);
                total += sessions.filter(s => new Date(s.session_date) > now).length;
            }
            return total;
        } catch (e) { return 0; }
    },

    // â”€â”€â”€ Events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    async getEvents() {
        try {
            const { data, error } = await window.supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) {
            return this.handleSupabaseError(error, 'getEvents');
        }
    },

    async upsertEvent(eventData) {
        try {
            const { data, error } = await window.supabase
                .from('events')
                .upsert([eventData])
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'upsertEvent');
        }
    },

    async getEventById(id) {
        try {
            const { data, error } = await window.supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            if (error) throw error;
            return data;
        } catch (error) {
            return this.handleSupabaseError(error, 'getEventById');
        }
    },

    async deleteEvent(id) {
        try {
            const { error } = await window.supabase
                .from('events')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (error) {
            return this.handleSupabaseError(error, 'deleteEvent');
        }
    },

    // â”€â”€â”€ Storage Operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    async uploadAvatar(userId, file) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await window.supabase.storage
                .from('public-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = window.supabase.storage
                .from('public-assets')
                .getPublicUrl(filePath);

            await this.upsertProfile({ 
                id: userId, 
                avatar_url: data.publicUrl,
                updated_at: new Date().toISOString()
            });
            return data.publicUrl;
        } catch (error) {
            return this.handleSupabaseError(error, 'uploadAvatar');
        }
    },

    async updatePinnedGuidance(mentorshipId, guidance) {
        try {
            const { data, error } = await window.supabase
                .from('mentorships')
                .update({ pinned_guidance: guidance, updated_at: new Date().toISOString() })
                .eq('id', mentorshipId)
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'updatePinnedGuidance');
        }
    },

    // â”€â”€â”€ Activity & Analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    async logActivity(userId, type = 'login') {
        const now = new Date();
        const dateId = `${userId}_${now.toISOString().split('T')[0]}`;
        try {
            await window.supabase
                .from('user_activity')
                .upsert({
                    id: dateId,
                    user_id: userId,
                    activity_date: now.toISOString().split('T')[0],
                    activity_type: type
                });
        } catch (e) {
            console.warn("Supabase: Activity log skipped", e.message);
        }
    },

    async getActivityLastYear(userId) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        try {
            const { data, error } = await window.supabase
                .from('user_activity')
                .select('*')
                .eq('user_id', userId)
                .gte('activity_date', oneYearAgo.toISOString().split('T')[0]);
            if (error) throw error;
            return data;
        } catch (error) {
            return [];
        }
    },

    // â”€â”€â”€ Chat & Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    async getMessages(mentorshipId) {
        try {
            const { data, error } = await window.supabase
                .from('chat_messages')
                .select('*')
                .eq('mentorship_id', mentorshipId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data;
        } catch (error) {
            return [];
        }
    },

    async sendMessage(messageData) {
        try {
            const { data, error } = await window.supabase
                .from('chat_messages')
                .insert([{
                    mentorship_id: messageData.mentorship_id,
                    sender_id: messageData.sender_id,
                    text: messageData.text || messageData.message_text
                }])
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'sendMessage');
        }
    },

    subscribeToMessages(mentorshipId, callback) {
        return window.supabase
            .channel(`public:chat_messages:mentorship_id=eq.${mentorshipId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'chat_messages', 
                filter: `mentorship_id=eq.${mentorshipId}` 
            }, payload => {
                callback(payload.new);
            })
            .subscribe();
    },

    async createNotification(notif) {
        try {
            const { data, error } = await window.supabase
                .from('notifications')
                .insert([notif])
                .select();
            if (error) throw error;
            return data[0];
        } catch (e) { return null; }
    },

    async getNotifications(userId) {
        try {
            const { data, error } = await window.supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("SupabaseService: getNotifications failed", error);
            return [];
        }
    },

    async markNotificationAsRead(notifId) {
        try {
            const { data, error } = await window.supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notifId)
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error("SupabaseService: markNotificationAsRead failed", error);
            return null;
        }
    },

    async createSession(sessionData) {
        try {
            const { data, error } = await window.supabase
                .from('mentorship_sessions')
                .insert([{
                    mentorship_id: sessionData.mentorship_id,
                    title: sessionData.title || 'Mentorship Session',
                    description: sessionData.description || '',
                    session_date: sessionData.session_date || new Date().toISOString().split('T')[0],
                    session_time: sessionData.session_time || '10:00:00',
                    meeting_link: sessionData.meeting_link || sessionData.zoom_link || '',
                    status: 'scheduled'
                }])
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'createSession');
        }
    },

    subscribeToNotifications(userId, callback) {
        return window.supabase
            .channel(`public:notifications:user_id=eq.${userId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'notifications', 
                filter: `user_id=eq.${userId}` 
            }, payload => {
                callback(payload);
            })
            .subscribe();
    },

    // â”€â”€â”€ Feedback & Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    async submitFeedback(feedback) {
        try {
            // Ensure compatibility with potentially older schema or specific field names
            const payload = {
                mentorship_id: feedback.mentorship_id,
                project_id: feedback.project_id,
                mentor_id: feedback.mentor_id,
                field_id: feedback.field_id || 'general',
                comment: feedback.comment || feedback.text || feedback.content || '',
                stars: feedback.stars || 5,
                rating: feedback.rating || (feedback.stars >= 4 ? 'positive' : 'needs-work'),
                created_at: new Date().toISOString()
            };

            const { data, error } = await window.supabase
                .from('section_feedback')
                .insert([payload])
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'submitFeedback');
        }
    },

    async getProjectTimeline(projectId) {
        try {
            // Fetch everything related to project activity
            const [feedback, reports, messages] = await Promise.all([
                this.getProjectFeedback(projectId),
                window.supabase.from('progress_reports').select('*').eq('project_id', projectId),
                window.supabase.from('chat_messages').select('*').eq('mentorship_id', projectId) // This might need a mentorship_id lookup
            ]);

            const timeline = [
                ...(feedback || []).map(f => ({ ...f, type: 'feedback', date: f.created_at })),
                ...(reports.data || []).map(r => ({ ...r, type: 'report', date: r.created_at })),
                // Add more event types as needed
            ];

            return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (e) {
            console.warn("Timeline fetch error:", e);
            return [];
        }
    },

    async getProjectFeedback(projectId) {
        try {
            const { data, error } = await window.supabase
                .from('section_feedback')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) { return []; }
    },

    async submitProgressReport(report) {
        try {
            const { data, error } = await window.supabase
                .from('progress_reports')
                .insert([report])
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) {
            return this.handleSupabaseError(error, 'submitProgressReport');
        }
    },

    async getProgressReports(mentorshipId) {
        try {
            const { data, error } = await window.supabase
                .from('progress_reports')
                .select('*')
                .eq('mentorship_id', mentorshipId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) { return []; }
    },

    async getSectionFeedback(mentorshipId, fieldId) {
        try {
            const { data, error } = await window.supabase
                .from('section_feedback')
                .select('*')
                .eq('mentorship_id', mentorshipId)
                .eq('field_id', fieldId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) { return []; }
    },

    subscribeToProjectFeedback(projectId, callback) {
        return window.supabase
            .channel(`public:section_feedback:project_id=eq.${projectId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'section_feedback', 
                filter: `project_id=eq.${projectId}` 
            }, payload => {
                callback(payload);
            })
            .subscribe();
    },

    subscribeToProgressReports(mentorshipId, callback) {
        return window.supabase
            .channel(`public:progress_reports:mentorship_id=eq.${mentorshipId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'progress_reports', 
                filter: `mentorship_id=eq.${mentorshipId}` 
            }, payload => {
                callback(payload);
            })
            .subscribe();
    },
    
    async submitSectionFeedback(feedback) {
        return this.submitFeedback(feedback);
    },

    async createMilestoneReport(report) {
        try {
            const { data, error } = await window.supabase
                .from('milestone_reports')
                .insert([report])
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) { return null; }
    },

    async createCollaborationComment(comment) {
        try {
            const { data, error } = await window.supabase
                .from('collaboration_comments')
                .insert([comment])
                .select();
            if (error) throw error;
            return data[0];
        } catch (error) { return null; }
    },

    // ─── Chat Messaging ───────────────────────────────────────
    // sendMessage and subscribing moved up to Chat & Notifications section

    async getMessages(mentorshipId) {
        try {
            const { data, error } = await window.supabase
                .from('chat_messages')
                .select('*')
                .eq('mentorship_id', mentorshipId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data;
        } catch (error) { return []; }
    },

    subscribeToMessages(mentorshipId, callback) {
        return window.supabase
            .channel(`public:chat_messages:mentorship_id=eq.${mentorshipId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'chat_messages', 
                filter: `mentorship_id=eq.${mentorshipId}` 
            }, payload => {
                callback(payload.new);
            })
            .subscribe();
    },

    // â”€â”€â”€ Error Handling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    handleSupabaseError(error, context) {
        console.error(`Supabase Error [${context}]:`, error.message || error);
        throw error;
    }
};

window.SupabaseService = SupabaseService;
export default SupabaseService;


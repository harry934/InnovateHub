// Firestore imports removed

// ============================================================
//  HELPERS
// ============================================================
function getInitials(name = '') {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
}

function timeAgo(date) {
    if (!date) return 'Unknown';
    // Handle Firestore Timestamp
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    const diff = (Date.now() - dateObj.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function statusBadge(status) {
    status = status || 'active';
    const map = {
        approved: '<span class="badge-premium badge-premium-approved">✓ Approved</span>',
        active: '<span class="badge-premium badge-premium-approved">✓ Active</span>',
        pending:  '<span class="badge-premium badge-premium-pending">⏳ Pending</span>',
        rejected: '<span class="badge-premium badge-premium-rejected">✕ Rejected</span>',
    };
    return map[status] || `<span class="badge-premium">${status}</span>`;
}

// ============================================================
//  TOAST NOTIFICATION
// ============================================================
function adminToast(message, type = 'success') {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:30px;right:30px;z-index:99999;padding:14px 24px;border-radius:14px;font-weight:700;font-size:0.9rem;box-shadow:0 8px 24px rgba(0,0,0,0.15);animation:slideup 0.3s ease;color:#fff;background:${type==='success'?'#1a5e4f':type==='error'?'#dc3545':'#f3a813'};`;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ============================================================
//  ADMIN STATS
// ============================================================
async function renderAdminStats() {
    const container = document.getElementById('adminStatsGrid');
    if (!container) return;
    
    try {
        let stats = {
            totalMembers: 0,
            innovators: 0,
            activeMentors: 0,
            pendingMentors: 0,
            reviewQueue: 0,
            activePairs: 0
        };

        // 1. Try Supabase First
        if (window.SupabaseService) {
            try {
                const sbProfiles = await window.SupabaseService.getProfilesByRole('all');
                if (sbProfiles && sbProfiles.length > 0) {
                    stats.totalMembers = sbProfiles.length;
                    stats.innovators = sbProfiles.filter(u => u.role === 'innovator').length;
                    stats.activeMentors = sbProfiles.filter(u => u.role === 'mentor' && u.status !== 'pending' && u.status !== 'rejected').length;
                    stats.pendingMentors = sbProfiles.filter(u => u.role === 'mentor' && (u.status === 'pending' || u.approval_status === 'pending')).length;
                }

                const sbProjects = await window.SupabaseService.getProjects();
                if (sbProjects) {
                    stats.reviewQueue = sbProjects.filter(p => p.status === 'pending').length;
                }

                const sbMentorships = await window.SupabaseService.getMentorships();
                if (sbMentorships) {
                    stats.activePairs = sbMentorships.filter(m => m.status === 'accepted').length;
                }
                console.log("Admin Panel Stats: Loaded from Supabase");
            } catch (sbErr) {
                console.error("Admin Panel Stats: Supabase fetch failed", sbErr);
            }
        }

        // 2. Fallback removed - Supabase is the single source of truth

        const statConfig = [
            { label: 'Total Members', value: stats.totalMembers, color: 'blue', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
            { label: 'Innovators', value: stats.innovators, color: 'green', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' },
            { label: 'Active Mentors', value: stats.activeMentors, color: 'yellow', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16,11 18,13 22,9"/></svg>' },
            { label: 'Pending Mentors', value: stats.pendingMentors, color: 'blue', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
            { label: 'Review Queue', value: stats.reviewQueue, color: 'green', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>' },
            { label: 'Active Pairs', value: stats.activePairs, color: 'yellow', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' }
        ];

        container.innerHTML = statConfig.map(s => `
            <div class="premium-card">
                <div class="premium-card-icon" style="background:rgba(26, 94, 79, 0.05); color:var(--brand-green);">
                    ${s.icon}
                </div>
                <div class="ms-1">
                    <div class="h3 fw-bold mb-0" style="color:var(--brand-green); line-height: 1.1;">${s.value}</div>
                    <div class="text-uppercase fw-bold text-muted" style="font-size: 0.65rem; letter-spacing: 0.8px; margin-top: 4px;">${s.label}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("Admin Panel Stats Error:", e);
    }
}

// ============================================================
//  USERS & MENTORS CARDS (Redesigned from logic)
// ============================================================
window.currentRoleFilter = 'all';

window.setRoleFilter = function(role) {
    window.currentRoleFilter = role;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderUsersCards();
};

async function renderUsersCards() {
    const container = document.getElementById('usersCardGrid');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-5 w-100"><i class="fa fa-spinner fa-spin text-primary fa-2x"></i></div>';
    
    try {
        let users = [];

        // 1. Try Supabase First
        if (window.SupabaseService) {
            try {
                const sbProfiles = await window.SupabaseService.getProfilesByRole(window.currentRoleFilter === 'all' ? 'all' : window.currentRoleFilter);
                if (sbProfiles && sbProfiles.length > 0) {
                    users = sbProfiles.filter(u => u.role !== 'admin').map(u => ({
                        id: u.id,
                        fullName: u.full_name,
                        email: u.email,
                        role: u.role,
                        status: u.status,
                        institution: u.institution,
                        expertise: u.expertise
                    }));
                    console.log("Admin Panel Users: Loaded from Supabase");
                }
            } catch (sbErr) {
                console.error("Admin Panel Users: Supabase fetch failed", sbErr);
            }
        }

        // 2. Fallback removed

        if (users.length === 0) {
            container.innerHTML = '<div class="w-100 text-center text-muted py-5">No users found.</div>';
            return;
        }

        container.innerHTML = users.map(u => {
            const isMentor = u.role === 'mentor';
            const roleColor = isMentor ? 'var(--brand-yellow)' : 'var(--brand-green)';
            const roleBadge = isMentor ? '🎓 Mentor' : '💡 Innovator';
            
            return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="premium-user-card" style="background:#fff; border-radius:16px; box-shadow:0 8px 30px rgba(0,0,0,0.06); overflow:hidden; border:1px solid rgba(0,0,0,0.04); height:100%; display:flex; flex-direction:column; position:relative;">
                    <div style="height:60px; background:${isMentor ? 'rgba(243, 168, 19, 0.1)' : 'rgba(26, 94, 79, 0.05)'};"></div>
                    <div style="padding: 0 24px 24px 24px; position:relative; flex:1; display:flex; flex-direction:column;">
                        <div class="d-flex justify-content-between align-items-end" style="margin-top:-30px; margin-bottom:12px;">
                            <div class="user-avatar-lg d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width:70px; height:70px; border-radius:50%; background:#fff; border:3px solid #fff; color:${roleColor}; font-size:1.4rem; box-shadow:0 4px 10px rgba(0,0,0,0.1) !important;">
                                ${getInitials(u.fullName || u.email)}
                            </div>
                            <div>${statusBadge(u.status)}</div>
                        </div>
                        
                        <h4 style="font-family:var(--font-head); font-weight:800; margin-bottom:4px; font-size:1.2rem;">${u.fullName || 'Unnamed'}</h4>
                        <div style="color:#777; font-size:0.85rem; margin-bottom:12px; display:flex; align-items:center;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            ${u.email}
                        </div>
                        
                        <div style="background:#f8fafb; padding:12px; border-radius:8px; margin-bottom:16px; font-size:0.85rem;">
                            <div style="margin-bottom:6px;"><strong>Role:</strong> <span style="color:${roleColor}; font-weight:700;">${roleBadge}</span></div>
                            <div style="margin-bottom:6px;"><strong>Institution:</strong> ${u.institution || 'Not provided'}</div>
                            ${u.expertise ? `<div style="margin-bottom:6px;"><strong>Expertise:</strong> ${u.expertise}</div>` : ''}
                            ${u.categories ? `<div class="d-flex flex-wrap gap-1 mt-2">${u.categories.map(c => `<span class="badge bg-light text-dark border">${c}</span>`).join('')}</div>` : ''}
                        </div>
                        
                        <div class="mt-auto pt-3 border-top d-flex gap-2 justify-content-end">
                            <button class="btn btn-sm text-danger border border-danger" onclick="AdminPanel.deleteUser('${u.id}')" style="border-radius:8px;">Block Account</button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error("Error loading users:", error);
        container.innerHTML = '<div class="w-100 text-center text-danger py-5">Failed to fetch data.</div>';
    }
}

async function renderMentorApprovals() {
    const container = document.getElementById('mentorApprovalList');
    if (!container) return;
    container.innerHTML = '<div class="text-center py-5"><i class="fa fa-spinner fa-spin text-primary fa-2x"></i></div>';
    
    try {
        let mentors = [];

        // 1. Try Supabase First
        if (window.SupabaseService) {
            try {
                const sbMentors = await window.SupabaseService.getProfilesByRole('mentor');
                if (sbMentors) {
                    mentors = sbMentors.filter(m => m.status === 'pending' || m.approval_status === 'pending').map(m => ({
                        id: m.id,
                        fullName: m.full_name,
                        email: m.email,
                        status: m.status,
                        institution: m.institution,
                        expertise: m.expertise,
                        bio: m.bio,
                        createdAt: m.created_at
                    }));
                }
            } catch (sbErr) {
                 console.error("Admin Panel: Supabase mentor approvals fetch failed", sbErr);
            }
        }

        // 2. Fallback removed
        
        if (mentors.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div style="font-size:3rem;margin-bottom:16px;">🎉</div>
                    <h5 style="font-family:var(--font-head);color:var(--brand-green);">All caught up!</h5>
                    <p style="color:#aaa;">No pending mentor applications right now.</p>
                </div>`;
            return;
        }

        container.innerHTML = mentors.map(m => {
            return `
            <div class="mentor-approval-card" id="mac-${m.id}" style="padding:24px; border-radius:16px; background:#fff; box-shadow:0 8px 30px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.04); margin-bottom:20px; display:flex; gap:20px;">
                <div class="mac-avatar d-flex align-items-center justify-content-center text-white fw-bold" style="width:80px; height:80px; border-radius:50%; background:var(--brand-yellow); font-size:1.6rem; flex-shrink:0;">
                    ${getInitials(m.fullName)}
                </div>
                <div class="mac-body flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="mac-name" style="font-family:var(--font-head); font-weight:800; font-size:1.3rem;">${m.fullName}</div>
                        <span class="badge bg-warning text-dark">Review Required</span>
                    </div>
                    
                    <div class="mac-meta d-flex gap-3 text-muted mb-3" style="font-size:0.85rem;">
                        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>${m.institution || 'N/A'}</span>
                        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>Applied: ${timeAgo(m.createdAt || m.joinDate)}</span>
                    </div>
                    
                    <div style="background:#f8fafb; padding:16px; border-radius:12px; margin-bottom:16px; font-size:0.9rem; border-left:4px solid var(--brand-green);">
                        <div style="margin-bottom:8px;"><strong>Bio:</strong> ${m.bio || 'No bio provided.'}</div>
                        <div style="margin-bottom:8px;"><strong>Expertise:</strong> ${m.expertise || 'Not listed'}</div>
                        ${m.availability ? `<div><strong>Availability:</strong> ${m.availability}</div>` : ''}
                    </div>
                    
                    <div class="mac-categories mb-4">
                        ${(m.categories || []).map(c => `<span class="badge bg-light text-dark border me-1">${c}</span>`).join('')}
                    </div>
                    
                    <div class="mac-actions d-flex gap-3">
                        <button class="btn btn-success" style="border-radius:10px; padding:10px 24px; font-weight:700;" onclick="AdminPanel.approveMentor('${m.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><polyline points="20 6 9 17 4 12"/></svg>Approve Mentor
                        </button>
                        <button class="btn btn-outline-danger" style="border-radius:10px; padding:10px 24px; font-weight:700;" onclick="AdminPanel.rejectMentor('${m.id}', '${m.fullName}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Reject
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error("Error loading pending mentors:", e);
    }
}

async function renderProjectApprovals() {
    const container = document.getElementById('projectApprovalList');
    if (!container) return;
    
    try {
        let projects = [];

        // 1. Try Supabase
        if (window.SupabaseService) {
            try {
                const sbProjects = await window.SupabaseService.getProjects();
                if (sbProjects) {
                    projects = sbProjects.filter(p => p.status === 'pending').map(p => ({
                        id: p.id,
                        title: p.title,
                        problemStatement: p.problem_statement,
                        createdAt: p.created_at,
                        categories: [] // Categories might need mapping
                    }));
                    console.log("Admin Panel Projects: Loaded from Supabase");
                }
            } catch (sbErr) {
                console.error("Admin Panel: Supabase projects fetch failed", sbErr);
            }
        }

        // 2. Fallback removed
        
        if (projects.length === 0) {
            container.innerHTML = `<div class="text-center py-5"><div style="font-size:3rem;margin-bottom:16px;">✅</div><h5 style="font-family:var(--font-head);color:var(--brand-green);">No pending projects!</h5><p style="color:#aaa;">All project submissions have been reviewed.</p></div>`;
            return;
        }
        
        container.innerHTML = projects.map(p => {
            return `
            <div class="request-card" id="pcard-${p.id}" style="padding:24px; border-radius:16px; background:#fff; box-shadow:0 8px 30px rgba(0,0,0,0.06); margin-bottom:20px;">
                <h4 style="font-family:var(--font-head); font-weight:800; color:var(--brand-green);">${p.title}</h4>
                <div class="text-muted mb-3" style="font-size:0.85rem;">Submitted ${timeAgo(p.createdAt)}</div>
                <div class="mb-3">
                    <strong>Problem Statement:</strong>
                    <p class="text-muted">${p.problemStatement || 'N/A'}</p>
                </div>
                <div class="mb-4">
                    <strong>Categories:</strong>
                    ${(p.categories || []).map(c => `<span class="badge bg-light text-dark border ms-1">${c}</span>`).join('')}
                </div>
                <div class="d-flex gap-3">
                    <button class="btn btn-success" style="border-radius:10px; padding:10px 24px; font-weight:700;" onclick="AdminPanel.approveProject('${p.id}')">Approve Project</button>
                    <button class="btn btn-outline-danger" style="border-radius:10px; padding:10px 24px; font-weight:700;" onclick="AdminPanel.rejectProject('${p.id}')">Reject</button>
                </div>
            </div>`;
        }).join('');
    } catch(e) { console.error("Error loading projects", e); }
}

async function renderMentorshipsTable() {
    const container = document.getElementById('mentorshipsTableBody');
    if (!container) return;

    container.innerHTML = '<tr><td colspan="5" class="text-center py-4"><i class="fa fa-spinner fa-spin text-primary"></i> Loading pairings...</td></tr>';

    try {
        let matches = [];

        // 1. Try Supabase First
        if (window.SupabaseService) {
            try {
                const sbMatches = await window.SupabaseService.getMentorships();
                if (sbMatches && sbMatches.length > 0) {
                    matches = sbMatches.map(m => ({
                        id: m.id,
                        innovatorName: m.innovator?.full_name || 'Unknown',
                        mentorName: m.mentor?.full_name || 'Unknown',
                        status: m.status,
                        createdAt: m.created_at,
                        adminApproved: m.status === 'accepted' // Map correctly
                    }));
                    console.log("Admin Panel Mentorships: Loaded from Supabase");
                }
            } catch (sbErr) {
                console.error("Admin Panel Mentorships: Supabase fetch failed", sbErr);
            }
        }

        // 2. Fallback removed

        if (matches.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No mentorship requests found.</td></tr>';
            return;
        }

        let html = '';
        for (const m of matches) {
            html += `
            <tr>
                <td>
                    <div class="fw-bold" style="color:var(--brand-green);">${m.innovatorName}</div>
                    <div class="text-muted" style="font-size:0.75rem;">Innovator</div>
                </td>
                <td>
                    <div class="fw-bold" style="color:var(--brand-yellow);">${m.mentorName}</div>
                    <div class="text-muted" style="font-size:0.75rem;">Mentor</div>
                </td>
                <td>${timeAgo(m.createdAt)}</td>
                <td>
                    ${statusBadge(m.status)}
                    ${(m.status === 'accepted' && !m.adminApproved) || m.status === 'pending_admin' ? '<div class="text-warning fw-bold mt-1" style="font-size:0.7rem;"><i class="fa fa-clock"></i> Awaiting Admin</div>' : ''}
                    ${m.hasTermReq ? '<div class="text-danger fw-bold mt-1" style="font-size:0.7rem;"><i class="fa fa-exclamation-triangle"></i> Termination Requested</div>' : ''}
                </td>
                <td>
                    <div class="d-flex gap-2">
                        ${((m.status === 'accepted' && !m.adminApproved) || m.status === 'pending_admin') ? `
                            <button class="btn btn-sm btn-success" onclick="AdminPanel.approvePairing('${m.id}')">
                                Approve Pair
                            </button>
                        ` : ''}
                        ${m.hasTermReq ? `
                            <button class="btn btn-sm btn-danger" onclick="AdminPanel.handleTermination('${m.id}', '${m.hasTermReq.id}', true)">
                                Approve Stop
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-danger" onclick="AdminPanel.terminateMentorship('${m.id}')">
                            ${m.status === 'accepted' ? 'Terminate' : 'Delete'}
                        </button>
                    </div>
                </td>
            </tr>`;
            
            if (m.hasTermReq) {
                html += `
                <tr style="background:rgba(220, 53, 69, 0.03);">
                    <td colspan="5" style="padding:10px 24px;">
                        <div class="p-3 border-start border-danger border-4 rounded bg-white shadow-sm">
                            <strong class="text-danger">Termination Reason:</strong> "${m.hasTermReq.reason}"
                            <div class="mt-2 text-muted" style="font-size:0.8rem;">Submitted ${timeAgo(m.hasTermReq.requestedAt)}</div>
                        </div>
                    </td>
                </tr>`;
            }
        }
        container.innerHTML = html;
        
    } catch (e) {
        console.error("Error loading mentorships", e);
        container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Failed to load data.</td></tr>';
    }
}

// ============================================================
//  ADMIN PANEL API (exposed globally)
// ============================================================
window.AdminPanel = {
    async approveMentor(userId) {
        try {
            // 1. Update Firestore - Removed

            // 2. Supabase Sync: Update Profile Status
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.updateProfileStatus(userId, 'approved');
                    console.log("Admin Panel: Mentor approval synced to Supabase");
                } catch (sbErr) {
                    console.error("Admin Panel: Supabase mentor approval sync failed", sbErr);
                }
            }
            
            adminToast('✓ Mentor approved successfully!');
            renderMentorApprovals();
            renderUsersCards();
            renderAdminStats();
        } catch (e) {
            console.error(e);
            adminToast('Error approving mentor', 'error');
        }
    },
    async rejectMentor(userId, name) {
        if(confirm(`Reject application for ${name}?`)) {
            try {
                // 1. Update Firestore - Removed
                
                // 2. Supabase Sync: Update Profile Status
                if (window.SupabaseService) {
                    try {
                        await window.SupabaseService.updateProfileStatus(userId, 'rejected');
                        console.log("Admin Panel: Mentor rejection synced to Supabase");
                    } catch (sbErr) {
                        console.error("Admin Panel: Supabase mentor rejection sync failed", sbErr);
                    }
                }
                
                adminToast('✕ Mentor application rejected.', 'error');
                renderMentorApprovals();
                renderUsersCards();
                renderAdminStats();
            } catch (e) {
                 console.error(e);
            }
        }
    },
    async deleteUser(userId) {
        if (!confirm('Are you certain you want to permanently block this user? Action cannot be undone.')) return;
        try {
            // 1. Delete from Firestore (or update to blocked) - Removed

            // 2. Supabase Sync: Update Status
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.updateProfileStatus(userId, 'blocked');
                    console.log("Admin Panel: User block synced to Supabase");
                } catch (sbErr) {
                    console.error("Admin Panel: Supabase user block sync failed", sbErr);
                }
            }

            adminToast('User blocked successfully.', 'error');
            renderUsersCards();
            renderAdminStats();
        } catch (e) {
             console.error(e);
        }
    },
    async approveProject(projectId) {
        try {
            // 1. Update Firestore - Removed
            
            // 2. Supabase Sync: Update Project Status
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.updateProjectStatus(projectId, 'approved');
                    console.log("Admin Panel: Project approval synced to Supabase");
                } catch (sbErr) {
                    console.error("Admin Panel: Supabase project approval sync failed", sbErr);
                }
            }

            adminToast('✓ Project approved!');
            renderProjectApprovals();
            renderAdminStats();
        } catch (e) {
             console.error(e);
        }
    },
    async rejectProject(projectId) {
        try {
            // 1. Update Firestore - Removed
            
            // 2. Supabase Sync: Update Project Status
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.updateProjectStatus(projectId, 'rejected');
                    console.log("Admin Panel: Project rejection synced to Supabase");
                } catch (sbErr) {
                    console.error("Admin Panel: Supabase project rejection sync failed", sbErr);
                }
            }

            adminToast('Project rejected.', 'error');
            renderProjectApprovals();
            renderAdminStats();
        } catch (e) {
             console.error(e);
        }
    },
    async terminateMentorship(requestId) {
        if (!confirm('Are you sure you want to permanently dissolve this mentorship link?')) return;
        try {
            // 1. Delete from Firestore - Removed

            // 2. Supabase Sync: Update Status
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.updateMentorshipStatus(requestId, 'terminated');
                    console.log("Admin Panel: Mentorship termination synced to Supabase");
                } catch (sbErr) {
                    console.error("Admin Panel: Supabase mentorship termination sync failed", sbErr);
                }
            }

            adminToast('Mentorship link removed.', 'error');
            renderMentorshipsTable();
            renderAdminStats();
        } catch (e) {
            console.error(e);
            adminToast('Failed to terminate.', 'error');
        }
    },
    async approvePairing(requestId) {
        try {
            // 1. Update Firestore - Removed

            // 2. Supabase Sync: Update Status
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.updateMentorshipStatus(requestId, 'accepted');
                    console.log("Admin Panel: Pairing approval synced to Supabase");
                } catch (sbErr) {
                    console.error("Admin Panel: Supabase pairing approval sync failed", sbErr);
                }
            }

            adminToast('✓ Mentorship pairing approved!');
            renderMentorshipsTable();
            renderAdminStats();
        } catch (e) {
            console.error(e);
            adminToast('Failed to approve pairing.', 'error');
        }
    },
    async handleTermination(requestId, termReqId, approve) {
        if (!confirm(approve ? 'Approve this termination request and dissolve the link?' : 'Reject this termination request?')) return;
        try {
            if (approve) {
                // 1. Delete from Firestore - Removed
                
                // 2. Supabase Sync
                if (window.SupabaseService) {
                    try {
                        await window.SupabaseService.updateMentorshipStatus(requestId, 'terminated');
                        console.log("Admin Panel: Mentorship termination synced to Supabase");
                    } catch (sbErr) {
                        console.error("Admin Panel: Supabase mentorship termination sync failed", sbErr);
                    }
                }

                adminToast('✓ Mentorship terminated as requested.');
            } else {
                // Removed Firestore update
                // await updateDoc(doc(db, 'mentorshipTerminations', termReqId), { status: 'rejected', processedAt: serverTimestamp() });
                // await updateDoc(doc(db, 'mentorshipRequests', requestId), { terminationRequested: false });
                adminToast('Termination request rejected.', 'warning');
            }
            renderMentorshipsTable();
            renderAdminStats();
        } catch (e) {
             console.error(e);
            adminToast('Action failed.', 'error');
        }
    },

    // ══ EVENT MANAGEMENT ══
    async handleEventSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const btn = document.getElementById('adminEventSubmitBtn');
        const eventId = document.getElementById('adminEventId').value;
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';

        const eventData = {
            title: form.title.value,
            description: form.description.value,
            date: form.date.value,
            time: form.time.value,
            location: form.location.value,
            imageLink: form.imageLink.value
        };

        try {
            if (eventId) {
                // 1. Supabase Sync: Upsert Event
                if (window.SupabaseService) {
                    try {
                        await window.SupabaseService.upsertEvent({
                            id: eventId,
                            title: eventData.title,
                            description: eventData.description,
                            event_date: eventData.date,
                            event_time: eventData.time,
                            location: eventData.location,
                            image_url: eventData.imageLink
                        });
                        console.log("Admin Panel: Event update synced to Supabase");
                    } catch (sbErr) { console.error("Admin Panel: Supabase event sync failed", sbErr); }
                }
                adminToast('✓ Event updated successfully!');
            } else {
                // 1. Supabase Sync: Upsert Event
                if (window.SupabaseService) {
                    try {
                        const newId = 'event_' + Date.now();
                        await window.SupabaseService.upsertEvent({
                            id: newId,
                            title: eventData.title,
                            description: eventData.description,
                            event_date: eventData.date,
                            event_time: eventData.time,
                            location: eventData.location,
                            image_url: eventData.imageLink
                        });
                        console.log("Admin Panel: Event creation synced to Supabase");
                    } catch (sbErr) { console.error("Admin Panel: Supabase event sync failed", sbErr); }
                }
                adminToast('✓ Event created successfully!');
            }
            form.reset();
            document.getElementById('adminEventId').value = '';
            document.getElementById('adminEventSubmitBtn').textContent = 'Create Event';
            document.getElementById('adminEventCancelBtn').style.display = 'none';
            await this.loadAdminEvents();
        } catch (error) {
            console.error(error);
            adminToast('Failed to save event.', 'error');
        } finally {
            btn.disabled = false;
        }
    },

    async loadAdminEvents() {
        const container = document.getElementById('adminEventsGrid');
        if (!container) return;
        
        container.innerHTML = '<div class="col-12 text-center py-4"><i class="fa fa-spinner fa-spin"></i> Loading...</div>';

        try {
            let events = [];
            // 1. Try Supabase
            if (window.SupabaseService) {
                try {
                    const sbEvents = await window.SupabaseService.getEvents();
                    if (sbEvents) {
                        events = sbEvents.map(ev => ({
                            id: ev.id,
                            title: ev.title,
                            description: ev.description,
                            date: ev.event_date,
                            time: ev.event_time,
                            location: ev.location,
                            imageLink: ev.image_url
                        }));
                        console.log("Admin Panel Events: Loaded from Supabase");
                    }
                } catch (sbErr) { console.error("Admin Panel Events: Supabase fetch failed", sbErr); }
            }

            // 2. Fallback removed
            if (events.length === 0) {
                console.log("Admin Panel Events: No records found in Supabase");
            }

            if (events.length === 0) {
                container.innerHTML = '<div class="col-12 text-center py-4 text-muted">No events found.</div>';
                return;
            }

            container.innerHTML = events.map(ev => {
                return `
                <div class="col-md-6 mb-3">
                    <div class="card h-100 shadow-sm border-0">
                        <img src="${ev.imageLink || 'assets/img/placeholder.jpg'}" class="card-img-top" style="height:120px; object-fit:cover;">
                        <div class="card-body p-3">
                            <h6 class="fw-bold mb-1">${ev.title}</h6>
                            <p class="small text-muted mb-2">${ev.date || 'No Date'} | ${ev.time || 'No Time'}</p>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-outline-primary" onclick="AdminPanel.editEvent('${ev.id}')">Edit</button>
                                <button class="btn btn-sm btn-outline-danger" onclick="AdminPanel.deleteEvent('${ev.id}')">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } catch (e) {
            console.error("Admin Panel Events Error:", e);
            container.innerHTML = '<div class="col-12 text-center py-4 text-danger">Failed to load events. Please try again.</div>';
        }
    },

    async editEvent(id) {
        try {
            let ev = null;
            // Try Supabase first
            if (window.SupabaseService) {
                try {
                    const sbEvent = await window.SupabaseService.getEventById(id);
                    if (sbEvent) {
                        ev = {
                            title: sbEvent.title,
                            description: sbEvent.description,
                            date: sbEvent.event_date,
                            time: sbEvent.event_time,
                            location: sbEvent.location,
                            imageLink: sbEvent.image_url
                        };
                    }
                } catch (sbErr) { console.error("Admin Panel: Supabase event fetch for edit failed", sbErr); }
            }

            // Fallback removed
            
            const form = document.getElementById('adminEventForm');
            form.title.value = ev.title;
            form.description.value = ev.description;
            form.date.value = ev.date;
            form.time.value = ev.time;
            form.location.value = ev.location;
            form.imageLink.value = ev.imageLink;
            document.getElementById('adminEventId').value = id;
            
            document.getElementById('adminEventSubmitBtn').textContent = 'Update Event';
            document.getElementById('adminEventCancelBtn').style.display = 'block';
            form.scrollIntoView({ behavior: 'smooth' });
        } catch(e) {
            console.error(e);
        }
    },

    async deleteEvent(id) {
        if (!confirm('Delete this event?')) return;
        try {
            // 1. Delete from Firestore - Removed

            // 2. Supabase Sync: Delete Event
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.deleteEvent(id);
                    console.log("Admin Panel: Event deletion synced to Supabase");
                } catch (sbErr) {
                    console.error("Admin Panel: Supabase event deletion sync failed", sbErr);
                }
            }
            
            adminToast('Event deleted.');
            await this.loadAdminEvents();
        } catch (e) {
             console.error(e);
        }
    },

    // ══ MANUAL MENTOR REGISTRATION ══
    async handleManualMentorRegistration(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');

        btn.disabled = true;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> registering...';

        const mentorData = {
            fullName: form.fullName.value,
            email: form.email.value.toLowerCase(),
            role: 'mentor',
            status: 'approved',
            isApproved: true,
            approvalStatus: 'approved',
            mentorStatus: 'approved',
            institution: form.institution.value,
            expertise: form.expertise.value,
            manualEntry: true
        };

        try {
            // 1. Add to Firestore - Removed
            const mockId = 'mentor_' + Date.now();

            // 2. Supabase Sync: Upsert Profile
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.upsertProfile({
                        id: mockId,
                        email: mentorData.email,
                        full_name: mentorData.fullName,
                        role: 'mentor',
                        status: 'approved',
                        approval_status: 'approved',
                        institution: mentorData.institution,
                        expertise: mentorData.expertise
                    });
                    console.log("Admin Panel: Manual mentor sync to Supabase success");
                } catch (sbErr) {
                    console.error("Admin Panel: Supabase manual mentor sync failed", sbErr);
                }
            }

            adminToast('✓ Mentor registered manually and approved.');
            form.reset();
            renderUsersCards();
            renderAdminStats();
        } catch (error) {
             console.error(error);
            adminToast('Failed to register mentor.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Register Mentor';
        }
    },

    init() {
        renderAdminStats();
        renderUsersCards();
        renderMentorApprovals();
        renderProjectApprovals();
        renderMentorshipsTable();
        this.loadAdminEvents();
        
        // Bind forms
        const eventForm = document.getElementById('adminEventForm');
        if (eventForm) eventForm.addEventListener('submit', (e) => this.handleEventSubmit(e));
        
        const manualMentorForm = document.getElementById('manualMentorForm');
        if (manualMentorForm) manualMentorForm.addEventListener('submit', (e) => this.handleManualMentorRegistration(e));
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.AdminPanel.init());
} else {
    window.AdminPanel.init();
}

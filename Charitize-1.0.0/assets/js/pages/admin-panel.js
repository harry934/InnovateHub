/**
 * Admin Panel Controller
 * Version: 1.0.0
 * Depends on: mock-service.js
 * Purpose: Frontend-only admin dashboard logic using mock data.
 *           Replace MockService calls with real API calls during backend integration.
 */

// ============================================================
//  HELPERS
// ============================================================
function getInitials(name = '') {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
}

function timeAgo(dateStr) {
    if (!dateStr) return 'Unknown';
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function statusBadge(status) {
    const map = {
        approved: '<span class="badge-premium badge-premium-approved">✓ Approved</span>',
        pending:  '<span class="badge-premium badge-premium-pending">⏳ Pending</span>',
        rejected: '<span class="badge-premium badge-premium-rejected">✕ Rejected</span>',
    };
    return map[status] || `<span class="badge-premium">${status}</span>`;
}

// ============================================================
//  ADMIN STATS
// ============================================================
function renderAdminStats() {
    const container = document.getElementById('adminStatsGrid');
    if (!container || !window.MockService) return;
    const stats = MockService.getAdminStats();
    
    const statConfig = [
        { label: 'Total Members', value: stats.totalUsers, color: 'green', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
        { label: 'Innovators', value: stats.totalInnovators, color: 'blue', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>' },
        { label: 'Mentors', value: stats.totalMentors, color: 'green', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16,11 18,13 22,9"/></svg>' },
        { label: 'Pending Mentors', value: stats.pendingMentors, color: 'yellow', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>' },
        { label: 'Pending Projects', value: stats.pendingProjects, color: 'yellow', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>' },
        { label: 'Active Mentorships', value: stats.activeMentorships, color: 'green', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M7 22l5-3 5 3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2z"/></svg>' }
    ];

    container.innerHTML = statConfig.map(s => `
        <div class="admin-stat-card">
            <div class="admin-stat-icon ${s.color}">${s.icon}</div>
            <div class="admin-stat-value">${s.value}</div>
            <div class="admin-stat-label">${s.label}</div>
        </div>
    `).join('');
}

// ============================================================
//  ALL USERS TABLE
// ============================================================
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody || !window.MockService) return;
    const users = MockService.getAllUsers().filter(u => u.role !== 'admin');
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;">
                    <span class="user-avatar-mini">${getInitials(u.fullName)}</span>
                    <div>
                        <div style="font-weight:700;font-size:0.9rem;">${u.fullName}</div>
                        <div style="font-size:0.76rem;color:#aaa;">${u.email}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge-premium ${u.role === 'mentor' ? 'badge-premium-active' : 'badge-premium-approved'}">${u.role === 'mentor' ? '🎓 Mentor' : '💡 Innovator'}</span></td>
            <td>${u.institution || '—'}</td>
            <td>${statusBadge(u.status)}</td>
            <td>${u.joinDate || '—'}</td>
            <td>
                ${u.role === 'mentor' && u.status === 'approved' ? `<button class="btn-reject-soft" onclick="AdminPanel.revokeAccess('${u.id}')">Revoke</button>` : ''}
                ${u.role === 'mentor' && u.status === 'pending' ? `<button class="btn-approve" onclick="AdminPanel.approveMentor('${u.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><polyline points="20 6 9 17 4 12"/></svg>Approve
                </button>` : ''}
            </td>
        </tr>
    `).join('');
}

// ============================================================
//  PENDING MENTOR APPROVALS
// ============================================================
function renderMentorApprovals() {
    const container = document.getElementById('mentorApprovalList');
    if (!container || !window.MockService) return;
    const pending = MockService.getPendingMentors();

    if (pending.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div style="font-size:3rem;margin-bottom:16px;">🎉</div>
                <h5 style="font-family:var(--font-head);color:var(--brand-green);">All caught up!</h5>
                <p style="color:#aaa;">No pending mentor applications right now.</p>
            </div>`;
        return;
    }

    container.innerHTML = pending.map(m => `
        <div class="mentor-approval-card" id="mac-${m.id}">
            <div class="mac-avatar">${getInitials(m.fullName)}</div>
            <div class="mac-body">
                <div class="mac-name">${m.fullName}</div>
                <div class="mac-meta">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>${m.institution || 'N/A'} &nbsp;·&nbsp;
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>Applied ${timeAgo(m.joinDate)}
                </div>
                <div class="mac-bio">${m.bio || 'No bio provided.'}</div>
                <div class="mac-categories">
                    ${(m.categories || []).map(c => `<span class="category-chip">${c}</span>`).join('')}
                </div>
                <div style="font-size:0.82rem;color:#777;margin-bottom:14px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg><strong>Expertise:</strong> ${m.expertise || 'Not listed'}
                </div>
                ${m.availability ? `<div style="font-size:0.82rem;color:#777;margin-bottom:14px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><strong>Availability:</strong> ${m.availability}</div>` : ''}
                <div class="mac-actions">
                    <button class="btn-approve" onclick="AdminPanel.approveMentor('${m.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><polyline points="20 6 9 17 4 12"/></svg>Approve
                    </button>
                    <button class="btn-reject-soft" onclick="AdminPanel.promptRejectMentor('${m.id}', '${m.fullName}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Reject
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================================
//  PROJECT APPROVALS
// ============================================================
function renderProjectApprovals() {
    const container = document.getElementById('projectApprovalList');
    if (!container || !window.MockService) return;
    const pending = MockService.getPendingProjects();

    if (pending.length === 0) {
        container.innerHTML = `<div class="text-center py-5"><div style="font-size:3rem;margin-bottom:16px;">✅</div><h5 style="font-family:var(--font-head);color:var(--brand-green);">No pending projects!</h5><p style="color:#aaa;">All project submissions have been reviewed.</p></div>`;
        return;
    }

    container.innerHTML = pending.map(p => {
        const innovator = MockService.getUserById(p.innovatorId);
        return `
        <div class="request-card" id="pcard-${p.id}">
            <div class="request-card-header">
                <div class="user-avatar-mini" style="border-radius:12px;width:48px;height:48px;font-size:1rem;flex-shrink:0;">${innovator ? getInitials(innovator.fullName) : '??'}</div>
                <div style="flex:1;">
                    <div class="request-card-title">${p.title}</div>
                    <div class="request-card-meta">
                        by ${innovator ? innovator.fullName : 'Unknown'} &nbsp;·&nbsp; Submitted ${timeAgo(p.submittedAt)}
                        &nbsp;·&nbsp; ${(p.categories || []).map(c => `<span class="category-chip">${c}</span>`).join(' ')}
                    </div>
                </div>
                ${statusBadge(p.status)}
            </div>
            <div class="request-card-message">${p.problemStatement}</div>
            ${p.files && p.files.length > 0 ? `
            <div style="margin-bottom:14px;">
                <small style="font-weight:700;color:#8a9aaa;text-transform:uppercase;letter-spacing:.6px;">Attached Files</small>
                <div class="file-preview-list" style="margin-top:8px;">
                    ${p.files.map(f => `
                        <div class="file-preview-item">
                            <div class="file-preview-icon"><i class="fa fa-file-alt"></i></div>
                            <div class="file-preview-info">
                                <div class="file-preview-name">${f.name}</div>
                                <div class="file-preview-size">${f.size}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
            <div class="request-card-actions">
                <button class="btn-approve" onclick="AdminPanel.approveProject('${p.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><polyline points="20 6 9 17 4 12"/></svg>Approve Project
                </button>
                <button class="btn-reject-soft" onclick="AdminPanel.rejectProject('${p.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Reject
                </button>
            </div>
        </div>`;
    }).join('');
}

// ============================================================
//  REJECTION MODAL
// ============================================================
function showRejectionModal(title, subtitle, onConfirm) {
    const existing = document.getElementById('adminRejectionModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'rejection-modal-overlay';
    modal.id = 'adminRejectionModal';
    modal.innerHTML = `
        <div class="rejection-modal-box">
            <h4><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>${title}</h4>
            <p>${subtitle}</p>
            <textarea id="rejectionReasonInput" rows="4" placeholder="Provide a clear reason for rejection..."></textarea>
            <div class="rejection-modal-actions">
                <button class="btn-approve" style="background:#6c757d;" onclick="document.getElementById('adminRejectionModal').remove()">Cancel</button>
                <button class="btn-reject-soft" id="confirmRejectBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Confirm Rejection
                </button>
            </div>
        </div>`;
    document.body.appendChild(modal);

    document.getElementById('confirmRejectBtn').onclick = () => {
        const reason = document.getElementById('rejectionReasonInput').value.trim();
        if (!reason) {
            document.getElementById('rejectionReasonInput').style.borderColor = '#dc3545';
            return;
        }
        modal.remove();
        onConfirm(reason);
    };
}

// ============================================================
//  TOAST NOTIFICATION
// ============================================================
function adminToast(message, type = 'success') {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:30px;right:30px;z-index:99999;padding:14px 24px;border-radius:14px;font-weight:700;font-size:0.9rem;box-shadow:0 8px 24px rgba(0,0,0,0.15);animation:slideup 0.3s ease;color:#fff;background:${type==='success'?'#1a5e4f':type==='error'?'#dc3545':'#b47b00'};`;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ============================================================
//  ADMIN PANEL API (exposed globally)
// ============================================================
const AdminPanel = {
    approveMentor(userId) {
        MockService.updateUserStatus(userId, 'approved');
        const card = document.getElementById('mac-' + userId);
        if (card) {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '0';
            card.style.transform = 'translateX(20px)';
            setTimeout(() => { card.remove(); renderMentorApprovals(); }, 400);
        }
        renderUsersTable();
        renderAdminStats();
        adminToast('✓ Mentor approved successfully!');
    },

    promptRejectMentor(userId, name) {
        showRejectionModal(
            'Reject Mentor Application',
            `You are about to reject <strong>${name}</strong>'s application. Please provide a reason that will be shown to them.`,
            (reason) => {
                MockService.updateUserStatus(userId, 'rejected', reason);
                const card = document.getElementById('mac-' + userId);
                if (card) {
                    card.style.transition = 'all 0.4s ease';
                    card.style.opacity = '0';
                    setTimeout(() => { card.remove(); renderMentorApprovals(); }, 400);
                }
                renderUsersTable();
                renderAdminStats();
                adminToast('✕ Mentor application rejected.', 'error');
            }
        );
    },

    revokeAccess(userId) {
        if (!confirm('Are you sure you want to revoke this mentor\'s access?')) return;
        MockService.updateUserStatus(userId, 'rejected', 'Access revoked by administrator.');
        renderUsersTable();
        renderAdminStats();
        adminToast('Access revoked.', 'warning');
    },

    approveProject(projectId) {
        MockService.updateProjectStatus(projectId, 'approved');
        const card = document.getElementById('pcard-' + projectId);
        if (card) {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '0';
            setTimeout(() => { card.remove(); renderProjectApprovals(); }, 400);
        }
        renderAdminStats();
        adminToast('✓ Project approved!');
    },

    rejectProject(projectId) {
        MockService.updateProjectStatus(projectId, 'rejected');
        const card = document.getElementById('pcard-' + projectId);
        if (card) {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '0';
            setTimeout(() => { card.remove(); renderProjectApprovals(); }, 400);
        }
        renderAdminStats();
        adminToast('Project rejected.', 'error');
    },

    removeMentorshipRelationship(requestId) {
        showRejectionModal(
            'Remove Mentorship',
            'Please provide the reason for removing this mentorship relationship.',
            (reason) => {
                MockService.respondToRequest(requestId, 'rejected', reason);
                adminToast('Mentorship relationship removed.', 'warning');
            }
        );
    },

    init() {
        renderAdminStats();
        renderUsersTable();
        renderMentorApprovals();
        renderProjectApprovals();
    }
};

window.AdminPanel = AdminPanel;

// Auto-init on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdminPanel.init());
} else {
    AdminPanel.init();
}

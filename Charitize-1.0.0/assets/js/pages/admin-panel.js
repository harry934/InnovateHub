import { db, auth } from "../core/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
        const usersSnap = await getDocs(collection(db, 'users'));
        const projectsSnap = await getDocs(collection(db, 'projects'));
        const pairsSnap = await getDocs(collection(db, 'mentorshipRequests'));
        
        const users = usersSnap.docs.map(d => d.data());
        const activePairs = pairsSnap.docs.filter(d => d.data().status === 'accepted').length;
        const pendingMentors = users.filter(u => u.role === 'mentor' && u.status === 'pending').length;
        const pendingProjects = projectsSnap.docs.filter(d => d.data().status === 'pending').length;

        const statConfig = [
            { label: 'Total Members', value: users.length, color: 'blue', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
            { label: 'Innovators', value: users.filter(u => u.role === 'innovator').length, color: 'green', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' },
            { label: 'Active Mentors', value: users.filter(u => u.role === 'mentor' && u.status !== 'pending').length, color: 'yellow', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16,11 18,13 22,9"/></svg>' },
            { label: 'Pending Mentors', value: pendingMentors, color: 'blue', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
            { label: 'Review Queue', value: pendingProjects, color: 'green', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>' },
            { label: 'Active Pairs', value: activePairs, color: 'yellow', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' }
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

        // Update Sidebar Badge
        const badge = document.getElementById('pendingMentorBadge');
        if (badge) {
            if (pendingMentors > 0) {
                badge.textContent = pendingMentors;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (e) {}
}

// ============================================================
//  USERS & MENTORS CARDS (Redesigned from logic)
// ============================================================
window.currentRoleFilter = 'all';
window.currentProjectFilter = 'pending';

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
        const usersSnap = await getDocs(collection(db, 'users'));
        let users = [];
        usersSnap.forEach(d => {
            if (d.data().role !== 'admin') {
                users.push({ id: d.id, ...d.data() });
            }
        });
        
        if (window.currentRoleFilter !== 'all') {
            users = users.filter(u => u.role === window.currentRoleFilter);
        }

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
                        
                        <div class="mt-auto pt-3 border-top d-flex gap-2 justify-content-end flex-wrap">
                            ${isMentor && u.status === 'pending' ? `
                                <button class="btn btn-sm btn-success" onclick="AdminPanel.approveMentor('${u.id}')" style="border-radius:8px;">Approve</button>
                                <button class="btn btn-sm btn-outline-danger" onclick="AdminPanel.rejectMentor('${u.id}', '${u.fullName}')" style="border-radius:8px;">Reject</button>
                            ` : ''}
                            ${isMentor && u.status === 'approved' ? `<button class="btn btn-sm btn-outline-warning" onclick="AdminPanel.discontinueMentor('${u.id}', '${u.fullName}')" style="border-radius:8px;">Discontinue</button>` : ''}
                            <button class="btn btn-sm text-danger border border-danger" onclick="AdminPanel.deleteUser('${u.id}')" style="border-radius:8px;">Delete Account</button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error("Error loading users:", error);
        container.innerHTML = '<div class="w-100 text-center text-danger py-5">Failed to fetch data from Firebase.</div>';
    }
}

// ============================================================
//  PENDING MENTOR APPROVALS
// ============================================================
async function renderMentorApprovals() {
    const container = document.getElementById('mentorApprovalList');
    if (!container) return;
    container.innerHTML = '<div class="text-center py-5"><i class="fa fa-spinner fa-spin text-primary fa-2x"></i></div>';
    
    try {
        // Fetch all mentors and filter locally to avoid index errors
        const qSnap = await getDocs(collection(db, 'users'));
        console.log(`Admin Debug: Fetched ${qSnap.size} total users`);
        
        const allMentors = qSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(u => {
                const isMentor = u.role === 'mentor';
                // Check multiple status fields for backward compatibility
                const status = (u.status || u.mentorStatus || u.approvalStatus || 'pending').toLowerCase();
                const isApproved = u.isApproved === true || status === 'approved';
                
                // Show ALL mentors (approved, pending, or even rejected) but NOT discontinued
                return isMentor && status !== 'discontinued';
            });
        
        console.log(`Admin Debug: ${allMentors.length} mentors found in total (approved + pending)`);
        
        if (allMentors.length === 0) {
            container.innerHTML = '<div class="text-center py-5 text-muted">No mentors found.</div>';
            return;
        }

        container.innerHTML = allMentors.map(m => {
            const status = (m.status || 'pending').toLowerCase();
            const isApproved = m.isApproved === true || status === 'approved';
            
            // Professional Status Config
            let statusConfig = {
                text: 'Pending Review',
                color: '#f3a813',
                bg: 'rgba(243, 168, 19, 0.1)',
                border: 'rgba(243, 168, 19, 0.2)'
            };
            
            if (status === 'approved' || isApproved) {
                statusConfig = { text: 'Approved', color: '#1a5e4f', bg: 'rgba(26, 94, 79, 0.1)', border: 'rgba(26, 94, 79, 0.2)' };
            } else if (status === 'rejected') {
                statusConfig = { text: 'Rejected', color: '#dc3545', bg: 'rgba(220, 53, 69, 0.1)', border: 'rgba(220, 53, 69, 0.2)' };
            }

            return `
            <div class="mentor-approval-card" id="mac-${m.id}" style="padding:28px; border-radius:18px; background:#fff; box-shadow:0 10px 40px rgba(0,0,0,0.04); border:1px solid #edf2f7; margin-bottom:24px; display:flex; gap:24px; position:relative; overflow:hidden;">
                <!-- Professional Status Indicator Strip -->
                <div style="position:absolute; left:0; top:0; bottom:0; width:6px; background:${statusConfig.color}; opacity:0.8;"></div>
                
                <div class="mac-avatar d-flex align-items-center justify-content-center text-white fw-bold" style="width:72px; height:72px; border-radius:16px; background:linear-gradient(135deg, #1a5e4f 0%, #2a8a75 100%); font-size:1.4rem; flex-shrink:0;">
                    ${getInitials(m.fullName)}
                </div>
                
                <div class="mac-body flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <div class="mac-name" style="font-family:var(--font-head); font-weight:800; font-size:1.4rem; color:#1a202c;">${m.fullName}</div>
                            <div class="d-flex align-items-center gap-2 mt-1">
                                <span style="background:${statusConfig.bg}; color:${statusConfig.color}; border:1px solid ${statusConfig.border}; padding:4px 12px; border-radius:6px; font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
                                    ${statusConfig.text}
                                </span>
                                <span class="text-muted small d-flex align-items-center">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                    ${m.role.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mac-meta d-flex flex-wrap gap-4 text-muted mt-3 mb-4" style="font-size:0.85rem;">
                        <span class="d-flex align-items-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2 text-primary"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            ${m.institution || 'Individual Mentor'}
                        </span>
                        <span class="d-flex align-items-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2 text-primary"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Joined: ${timeAgo(m.createdAt || m.joinDate)}
                        </span>
                        ${m.experience ? `
                        <span class="d-flex align-items-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2 text-primary"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            Exp: ${m.experience} Years
                        </span>` : ''}
                    </div>
                    
                    <div style="background:#f7fafc; padding:20px; border-radius:14px; margin-bottom:20px; font-size:0.95rem; border:1px solid #edf2f7; color:#4a5568;">
                        <div style="margin-bottom:12px; line-height:1.6;"><strong>Professional Overview:</strong><br>${m.bio || 'Detailed profile information has not been provided yet.'}</div>
                        <div class="d-flex flex-wrap gap-2 mt-3">
                            ${(m.categories || []).map(c => `<span style="background:#e2e8f0; color:#47566a; padding:4px 12px; border-radius:6px; font-size:0.75rem; font-weight:700;">${c}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="mac-actions d-flex gap-2">
                        ${!isApproved ? `
                            <button class="btn btn-primary d-flex align-items-center" style="border-radius:10px; padding:10px 28px; font-weight:700; background:#1a5e4f; border:none;" onclick="AdminPanel.approveMentor('${m.id}')">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><polyline points="20 6 9 17 4 12"/></svg>
                                <span>Approve Mentor</span>
                            </button>
                        ` : `
                            <div class="d-flex align-items-center text-success fw-bold px-3 py-2 bg-light rounded-3 small">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><polyline points="20 6 9 17 4 12"/></svg>
                                Access Granted
                            </div>
                        `}
                        <button class="btn btn-outline-danger d-flex align-items-center" style="border-radius:10px; padding:10px 24px; font-weight:700;" onclick="AdminPanel.rejectMentor('${m.id}', '${m.fullName}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            <span>Reject</span>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error("Error loading pending mentors:", e);
        container.innerHTML = '<div class="alert alert-danger mx-4">Critical Error: Unable to sync with mentor database.</div>';
    }
}

// ============================================================
//  PROJECT APPROVALS
// ============================================================
async function renderProjectApprovals() {
    const container = document.getElementById('projectApprovalList');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-5"><i class="fa fa-spinner fa-spin text-primary fa-2x"></i></div>';
    
    try {
        // Fetch all and filter locally
        const qSnap = await getDocs(collection(db, 'projects'));
        const projects = qSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => p.status === window.currentProjectFilter);
            
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div style="font-size:3rem;margin-bottom:16px;">${window.currentProjectFilter === 'pending' ? '✅' : '📁'}</div>
                    <h5 style="font-family:var(--font-head);color:var(--brand-green);">No ${window.currentProjectFilter} projects!</h5>
                    <p style="color:#aaa;">${window.currentProjectFilter === 'pending' ? 'All submissions have been reviewed.' : 'Nothing to show here yet.'}</p>
                </div>`;
            return;
        }
        
        container.innerHTML = projects.map(p => {
            const isPending = p.status === 'pending';

            // Build file download button
            const fileSection = p.fileUrl
                ? `<div class="mb-4 p-3" style="background:rgba(26,94,79,0.05); border-radius:12px; border-left:4px solid var(--brand-green);">
                        <div class="fw-bold mb-2" style="color:var(--brand-green); font-size:0.9rem; text-transform:uppercase; letter-spacing:0.5px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            Attached Document: ${p.fileName || 'View File'}
                        </div>
                        <a href="${p.fileUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-primary" style="border-radius:8px; font-weight:700;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download Document
                        </a>
                   </div>`
                : `<div class="mb-4 p-3 text-muted" style="background:#f8fafb; border-radius:12px; font-size:0.85rem;">
                        <i class="fa fa-info-circle me-1"></i> No document uploaded.
                   </div>`;

            return `
            <div class="request-card" id="pcard-${p.id}" style="padding:28px; border-radius:16px; background:#fff; box-shadow:0 8px 30px rgba(0,0,0,0.06); margin-bottom:20px; border: 1px solid rgba(0,0,0,0.03);">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <h4 style="font-family:var(--font-head); font-weight:800; color:var(--brand-green); margin:0">${p.title}</h4>
                    <div>${statusBadge(p.status)}</div>
                </div>
                <div class="text-muted mb-4" style="font-size:0.85rem;">Submitted ${timeAgo(p.createdAt)}</div>

                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <div style="background:#f8fafb; padding:16px; border-radius:12px; height:100%;">
                            <div class="fw-bold mb-1" style="font-size:0.8rem; text-transform:uppercase; color:#888; letter-spacing:0.5px;">Problem</div>
                            <p class="mb-0" style="font-size:0.9rem;">${p.problemStatement || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div style="background:#f8fafb; padding:16px; border-radius:12px; height:100%;">
                            <div class="fw-bold mb-1" style="font-size:0.8rem; text-transform:uppercase; color:#888; letter-spacing:0.5px;">Objectives</div>
                            <p class="mb-0" style="font-size:0.9rem;">${p.objectives || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <strong style="font-size:0.85rem;">Categories:</strong>
                    <span class="ms-2">${(p.categories || []).map(c => `<span class="badge bg-light text-dark border ms-1">${c}</span>`).join('')}</span>
                </div>

                ${fileSection}

                <div class="d-flex gap-2">
                    ${isPending ? `
                        <button class="btn btn-success px-4" style="border-radius:10px; font-weight:700;" onclick="AdminPanel.approveProject('${p.id}')">
                            <i class="fa fa-check me-2"></i> Approve
                        </button>
                        <button class="btn btn-outline-danger px-4" style="border-radius:10px; font-weight:700;" onclick="AdminPanel.rejectProject('${p.id}')">
                            <i class="fa fa-times me-2"></i> Reject
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-outline-danger" style="border-radius:8px;" onclick="AdminPanel.deleteProject('${p.id}')">
                            <i class="fa fa-trash me-1"></i> Delete Permanent
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" style="border-radius:8px;" onclick="AdminPanel.revertProjectStatus('${p.id}')">
                            <i class="fa fa-undo me-1"></i> Revert to Pending
                        </button>
                    `}
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
        // Fetch ALL mentorship requests and filter locally (more robust against index issues)
        const snap = await getDocs(collection(db, 'mentorshipRequests'));
        console.log(`Admin Debug: Fetched ${snap.size} mentorship requests`);

        const requests = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(r => ['accepted', 'pending', 'rejected'].includes(r.status));
        
        console.log(`Admin Debug: ${requests.length} valid mentorship requests after filter`);
        
        // Also fetch termination requests
        const termSnap = await getDocs(collection(db, 'mentorshipTerminations'));
        const terminations = {};
        termSnap.forEach(d => {
            const data = d.data();
            terminations[data.requestId] = { id: d.id, ...data };
        });

        if (snap.empty) {
            container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No mentorship requests found.</td></tr>';
            return;
        }

        let html = '';
        for (let docSnap of snap.docs) {
            const req = { id: docSnap.id, ...docSnap.data() };
            
            // Refactor: Use getDoc direct reference for participant names
            let innovator = 'Unknown Participant';
            let mentor = 'Unknown Participant';
            
            try {
                if (req.innovatorId) {
                    const iDoc = await getDoc(doc(db, 'users', req.innovatorId));
                    if (iDoc.exists()) innovator = iDoc.data().fullName || 'No Name';
                }
                
                if (req.mentorId) {
                    const mDoc = await getDoc(doc(db, 'users', req.mentorId));
                    if (mDoc.exists()) mentor = mDoc.data().fullName || 'No Name';
                }
            } catch (err) {
                console.warn(`Admin Debug: Participant fetch error for request ${req.id}:`, err);
            }
            
            const hasTermReq = terminations[req.id];
            const statusStyle = req.status === 'accepted' ? 'color:#1a5e4f;font-weight:700;' : '';
            
            html += `
            <tr>
                <td>
                    <div class="fw-bold" style="color:var(--brand-green);">${innovator}</div>
                    <div class="text-muted" style="font-size:0.75rem;">Innovator</div>
                </td>
                <td>
                    <div class="fw-bold" style="color:var(--brand-yellow);">${mentor}</div>
                    <div class="text-muted" style="font-size:0.75rem;">Mentor</div>
                </td>
                <td>${timeAgo(req.requestedAt)}</td>
                <td>
                    ${statusBadge(req.status)}
                    ${hasTermReq ? '<div class="text-danger fw-bold mt-1" style="font-size:0.7rem;"><i class="fa fa-exclamation-triangle"></i> Termination Requested</div>' : ''}
                </td>
                <td>
                    <div class="d-flex gap-2">
                        ${hasTermReq ? `
                            <button class="btn btn-sm btn-danger" onclick="AdminPanel.handleTermination('${req.id}', '${hasTermReq.id}', true)">
                                Approve Stop
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-danger" onclick="AdminPanel.terminateMentorship('${req.id}')">
                            ${req.status === 'accepted' ? 'Terminate' : 'Delete'}
                        </button>
                    </div>
                </td>
            </tr>`;
            
            if (hasTermReq) {
                html += `
                <tr style="background:rgba(220, 53, 69, 0.03);">
                    <td colspan="5" style="padding:10px 24px;">
                        <div class="p-3 border-start border-danger border-4 rounded bg-white shadow-sm">
                            <strong class="text-danger">Termination Reason:</strong> "${hasTermReq.reason}"
                            <div class="mt-2 text-muted" style="font-size:0.8rem;">Submitted ${timeAgo(hasTermReq.requestedAt)}</div>
                        </div>
                    </td>
                </tr>`;
            }
        }
        
        container.innerHTML = html;
        
    } catch (e) {
        console.error("Critical error in renderMentorshipsTable:", e);
        if (e.code === 'permission-denied') {
            container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-warning"><i class="fa fa-lock me-2"></i> Permission Denied. Are you logged in as Admin?</td></tr>';
        } else {
            container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Failed to load data. See console for details.</td></tr>';
        }
    }
}

// ============================================================
//  ADMIN PANEL API (exposed globally)
// ============================================================
window.AdminPanel = {
    async approveMentor(userId) {
        try {
            await updateDoc(doc(db, 'users', userId), { 
                status: 'approved',
                isApproved: true,
                approvalDate: serverTimestamp()
            });
            adminToast('✓ Mentor approved successfully!');
            renderMentorApprovals();
            renderUsersCards();
            renderAdminStats();
        } catch (e) {
            adminToast('Error approving mentor', 'error');
        }
    },
    async rejectMentor(userId, name) {
        if(confirm(`Reject application for ${name}?`)) {
            try {
                await updateDoc(doc(db, 'users', userId), { 
                    status: 'rejected',
                    isApproved: false 
                });
                adminToast('✕ Mentor application rejected.', 'error');
                renderMentorApprovals();
                renderUsersCards();
                renderAdminStats();
            } catch (e) {}
        }
    },
    async deleteUser(userId) {
        if (!confirm('Are you certain you want to permanently delete this user? Action cannot be undone.')) return;
        try {
            await deleteDoc(doc(db, 'users', userId));
            adminToast('User deleted permanently.', 'error');
            renderMentorApprovals();
            renderUsersCards();
            renderAdminStats();
        } catch (e) {}
    },
    async discontinueMentor(userId, name) {
        if(confirm(`Discontinue mentor account for ${name}? User will lose dashboard access but data will be preserved.`)) {
            try {
                await updateDoc(doc(db, 'users', userId), { 
                    status: 'discontinued',
                    isApproved: false 
                });
                adminToast('✕ Mentor account discontinued.', 'warning');
                renderMentorApprovals();
                renderUsersCards();
                renderAdminStats();
            } catch (e) {}
        }
    },
    async approveProject(projectId) {
        try {
            await updateDoc(doc(db, 'projects', projectId), { status: 'approved' });
            adminToast('✓ Project approved!');
            renderProjectApprovals();
            renderAdminStats();
        } catch (e) {}
    },
    async rejectProject(projectId) {
        try {
            await updateDoc(doc(db, 'projects', projectId), { status: 'rejected' });
            adminToast('Project rejected.', 'error');
            renderProjectApprovals();
        } catch (e) {}
    },
    async deleteProject(projectId) {
        if (!confirm('Permanently delete this project? This cannot be undone.')) return;
        try {
            await deleteDoc(doc(db, 'projects', projectId));
            adminToast('Project deleted.', 'error');
            renderProjectApprovals();
            renderAdminStats();
        } catch (e) {}
    },
    async revertProjectStatus(projectId) {
        try {
            await updateDoc(doc(db, 'projects', projectId), { status: 'pending' });
            adminToast('Project reverted to pending.');
            renderProjectApprovals();
        } catch (e) {}
    },
    setProjectFilter(status) {
        window.currentProjectFilter = status;
        document.querySelectorAll('#projectApprovalsSection .filter-btn').forEach(b => b.classList.remove('active'));
        const btnId = status === 'pending' ? 'filterProjPending' : status === 'approved' ? 'filterProjApproved' : 'filterProjRejected';
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.add('active');
        renderProjectApprovals();
    },
    async terminateMentorship(requestId) {
        if (!confirm('Are you sure you want to permanently dissolve this mentorship link?')) return;
        try {
            await deleteDoc(doc(db, 'mentorshipRequests', requestId));
            adminToast('Mentorship link removed.', 'error');
            renderMentorshipsTable();
            renderAdminStats();
        } catch (e) {
            adminToast('Failed to terminate.', 'error');
        }
    },
    async handleTermination(requestId, termReqId, approve) {
        if (!confirm(approve ? 'Approve this termination request and dissolve the link?' : 'Reject this termination request?')) return;
        try {
            if (approve) {
                await deleteDoc(doc(db, 'mentorshipRequests', requestId));
                await updateDoc(doc(db, 'mentorshipTerminations', termReqId), { status: 'approved', processedAt: serverTimestamp() });
                adminToast('✓ Mentorship terminated as requested.');
            } else {
                await updateDoc(doc(db, 'mentorshipTerminations', termReqId), { status: 'rejected', processedAt: serverTimestamp() });
                await updateDoc(doc(db, 'mentorshipRequests', requestId), { terminationRequested: false });
                adminToast('Termination request rejected.', 'warning');
            }
            renderMentorshipsTable();
            renderAdminStats();
        } catch (e) {
            adminToast('Action failed.', 'error');
        }
    },

    // ══ EVENT MANAGEMENT ══
    async handleEventSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const btn = document.getElementById('adminEventSubmitBtn');
        const eventId = document.getElementById('adminEventId').value;
        const fileInput = document.getElementById('eventImageInput');
        const file = fileInput ? fileInput.files[0] : null;
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i>Processing...';

        let imageLink = form.imageLink.value || 'assets/img/event-default.jpg';

        try {
            // Handle file upload if present
            if (file) {
                btn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i>Uploading Image...';
                if (window.api && window.api.uploadProjectFile) {
                    const response = await window.api.uploadProjectFile(file, 'events', 'admin');
                    if (response && response.ok) {
                        const baseUrl = window.api.API_URL || 'https://innovatehub.up.railway.app/api';
                        imageLink = `${baseUrl}/projects/file/${response.data.fileId}`;
                    }
                }
            }

            const eventData = {
                title: form.title.value,
                description: form.description.value,
                date: form.date.value,
                time: form.time.value,
                location: form.location.value,
                imageLink: imageLink,
                updatedAt: serverTimestamp()
            };

            if (eventId) {
                await updateDoc(doc(db, 'events', eventId), eventData);
                adminToast('✓ Event updated successfully!');
            } else {
                eventData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'events'), eventData);
                adminToast('✓ Event created successfully!');
            }
            this.cancelEventEdit();
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
        
        container.innerHTML = '<div class="col-12 text-center py-5"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></div>';

        try {
            const snap = await getDocs(collection(db, 'events'));
            if (snap.empty) {
                container.innerHTML = '<div class="col-12 text-center py-4 text-muted">No events found.</div>';
                return;
            }

            container.innerHTML = snap.docs.map(docSnap => {
                const ev = { id: docSnap.id, ...docSnap.data() };
                return `
                <div class="col-md-6 mb-4">
                    <div class="premium-card h-100 p-0 overflow-hidden border-0 shadow-lg" style="transition: all 0.3s ease; background: #fff; border-radius: 20px;">
                        <div style="position: relative; height: 180px; overflow: hidden;">
                            <img src="${ev.imageLink}" class="w-100 h-100" style="object-fit: cover; transition: transform 0.5s ease;">
                            <div style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.9); padding: 5px 12px; border-radius: 10px; font-weight: 800; font-size: 0.7rem; color: var(--brand-green); box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-transform: uppercase; letter-spacing: 0.5px;">
                                ${ev.date.split(',')[1] || 'Upcoming'}
                            </div>
                        </div>
                        <div class="p-4">
                            <h5 class="fw-bold mb-3" style="color:var(--brand-green); font-family: var(--font-head); font-size: 1.25rem;">${ev.title}</h5>
                            
                            <div class="d-grid gap-2 mb-4" style="grid-template-columns: 1fr 1fr;">
                                <div class="d-flex align-items-center text-muted small">
                                    <div style="width: 32px; height: 32px; background: rgba(26, 94, 79, 0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px; color: var(--brand-green);">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    </div>
                                    <span class="text-truncate">${ev.date}</span>
                                </div>
                                <div class="d-flex align-items-center text-muted small">
                                    <div style="width: 32px; height: 32px; background: rgba(243, 168, 19, 0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px; color: var(--brand-yellow);">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    </div>
                                    <span class="text-truncate">${ev.time}</span>
                                </div>
                                <div class="d-flex align-items-center text-muted small" style="grid-column: span 2;">
                                    <div style="width: 32px; height: 32px; background: rgba(26, 94, 79, 0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px; color: var(--brand-green);">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    </div>
                                    <span class="text-truncate">${ev.location}</span>
                                </div>
                            </div>
                            
                            <p class="small text-muted mb-4 line-clamp-2" style="height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${ev.description}</p>
                            
                            <div class="d-flex gap-2 pt-3 border-top">
                                <button class="btn btn-sm btn-outline-primary flex-fill fw-bold d-flex align-items-center justify-content-center gap-2" style="border-radius: 12px; padding: 8px;" onclick="AdminPanel.editEvent('${ev.id}')">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    Edit
                                </button>
                                <button class="btn btn-sm btn-outline-danger flex-fill fw-bold d-flex align-items-center justify-content-center gap-2" style="border-radius: 12px; padding: 8px;" onclick="AdminPanel.deleteEvent('${ev.id}')">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } catch (e) {
            console.error(e);
            container.innerHTML = '<div class="col-12 text-center py-4 text-danger">Error loading events.</div>';
        }
    },

    async editEvent(id) {
        try {
            const snap = await getDocs(query(collection(db, 'events'), where('__name__', '==', id)));
            if (snap.empty) return;
            const ev = snap.docs[0].data();
            
            const form = document.getElementById('adminEventForm');
            form.title.value = ev.title || '';
            form.description.value = ev.description || '';
            form.date.value = ev.date || '';
            form.time.value = ev.time || '';
            form.location.value = ev.location || '';
            form.imageLink.value = ev.imageLink || '';
            document.getElementById('adminEventId').value = id;
            
            document.getElementById('adminEventSubmitBtn').textContent = 'Update Event';
            document.getElementById('adminEventCancelBtn').style.display = 'block';
            form.scrollIntoView({ behavior: 'smooth' });
        } catch(e) {
            console.error("Error editing event:", e);
        }
    },

    cancelEventEdit() {
        const form = document.getElementById('adminEventForm');
        if (form) form.reset();
        document.getElementById('adminEventId').value = '';
        document.getElementById('adminEventSubmitBtn').textContent = 'Create Event';
        document.getElementById('adminEventCancelBtn').style.display = 'none';
        const fileInput = document.getElementById('eventImageInput');
        if (fileInput) fileInput.value = '';
    },

    async deleteEvent(id) {
        if (!confirm('Delete this event?')) return;
        try {
            await deleteDoc(doc(db, 'events', id));
            adminToast('Event deleted.');
            await this.loadAdminEvents();
        } catch (e) {}
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
            institution: form.institution.value,
            expertise: form.expertise.value,
            createdAt: serverTimestamp(),
            manualEntry: true
        };

        try {
            // Note: This only creates the Firestore record. 
            // The mentor will still need to 'signup' or 'invite' them.
            // For now, we just create the record so they are visible.
            await addDoc(collection(db, 'users'), mentorData);
            adminToast('✓ Mentor registered manually and approved.');
            form.reset();
            renderUsersCards();
            renderAdminStats();
        } catch (error) {
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
    document.addEventListener('DOMContentLoaded', () => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("Admin Debug: Auth detected for", user.uid);
                window.AdminPanel.init();
            } else {
                console.warn("Admin Debug: No auth found. Redirecting?");
            }
        });
    });
} else {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Admin Debug: Auth detected for", user.uid);
            window.AdminPanel.init();
        } else {
            console.warn("Admin Debug: No auth found.");
        }
    });
}

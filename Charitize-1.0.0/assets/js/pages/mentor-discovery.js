/**
 * Innovator Dashboard — Mentor Discovery & Mentorship Flow
 * Version: 1.0.0
 * Depends on: mock-service.js
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

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

const ALL_CATEGORIES = ['ai', 'technology', 'agriculture', 'healthcare', 'education', 'environment', 'business', 'social', 'robotics', 'engineering'];

let selectedCategories = [];
let currentMentorForRequest = null;

// ============================================================
//  MENTOR DISCOVERY
// ============================================================
function renderMentorDiscovery() {
    const container = document.getElementById('mentorsContainer');
    if (!container || !window.MockService) return;

    const searchVal = (document.getElementById('mentorSearchInput') || {}).value || '';
    const mentors = MockService.searchMentors(searchVal, selectedCategories);

    if (mentors.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5">
            <div style="font-size:3rem;margin-bottom:16px;">🔍</div>
            <h5 style="font-family:var(--font-head);color:var(--brand-green);">No mentors found</h5>
            <p style="color:#aaa;">Try adjusting your filters or search term.</p></div>`;
        return;
    }

    // Build Nuru suggestion banner based on selected project categories
    const nuruSuggested = selectedCategories.length > 0 ? MockService.suggestMentorsForCategories(selectedCategories) : [];
    const nuruBanner = nuruSuggested.length > 0 ? `
        <div class="col-12">
            <div class="nuru-suggestion-banner">
                <div class="nuru-sug-icon">🤖</div>
                <div>
                    <div class="nuru-sug-title">Nuru Recommends</div>
                    <div class="nuru-sug-sub">Based on your selected categories, these mentors are a great fit: <strong>${nuruSuggested.map(m => m.fullName.split(' ')[0]).join(', ')}</strong></div>
                </div>
            </div>
        </div>` : '';

    const isNuruSuggested = (id) => nuruSuggested.some(m => m.id === id);

    container.innerHTML = nuruBanner + mentors.map(m => `
        <div class="col-md-6 col-lg-4">
            <div class="mentor-disco-card${isNuruSuggested(m.id) ? ' nuru-highlight' : ''}" onclick="MentorDiscovery.openProfile('${m.id}')">
                ${isNuruSuggested(m.id) ? '<div style="position:absolute;top:12px;right:12px;background:var(--brand-yellow);color:#000;font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.8px;padding:3px 8px;border-radius:6px;">⭐ Nuru Pick</div>' : ''}
                <div class="mdc-avatar">${getInitials(m.fullName)}</div>
                <div class="mdc-name">${m.fullName}</div>
                <div class="mdc-expertise">${m.expertise || 'Expert Mentor'}</div>
                <div class="mdc-institution">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>${m.institution || 'N/A'}
                </div>
                <div class="mdc-categories">
                    ${(m.categories || []).slice(0, 3).map(c => `<span class="category-chip">${c}</span>`).join('')}
                </div>
                <button class="btn-premium-action" onClick="event.stopPropagation();MentorDiscovery.openProfile('${m.id}')">
                    View Profile
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================================
//  CATEGORY FILTER BAR
// ============================================================
function renderCategoryFilters() {
    const container = document.getElementById('mentorCategoryCheckboxes');
    if (!container) return;
    container.innerHTML = `<div class="category-filter-bar">
        ${ALL_CATEGORIES.map(c => `
            <button class="cat-filter-pill ${selectedCategories.includes(c) ? 'active' : ''}" onclick="MentorDiscovery.toggleCategory('${c}')">
                ${c}
            </button>`).join('')}
    </div>`;
}

// ============================================================
//  INSTAGRAM-STYLE MENTOR PROFILE MODAL
// ============================================================
function openMentorProfileModal(mentorId) {
    const m = MockService.getUserById(mentorId);
    if (!m) return;
    currentMentorForRequest = m;

    // Check if innovator already has a request with this mentor
    let currentUser = null;
    try { currentUser = JSON.parse(localStorage.getItem('innovateHubUser')); } catch(e) {}
    const existingReq = currentUser
        ? MockService.getRequestsByInnovator(currentUser.id || 'u2').find(r => r.mentorId === mentorId && ['pending','accepted'].includes(r.status))
        : null;

    // Count accepted mentees
    const menteeCount = MockService.getAllRequests().filter(r => r.mentorId === mentorId && r.status === 'accepted').length;

    const existing = document.getElementById('mentorProfileModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'mentor-profile-modal-overlay';
    overlay.id = 'mentorProfileModalOverlay';
    overlay.innerHTML = `
        <div class="mentor-profile-modal">
            <div class="mpm-header">
                <button class="mpm-close" onclick="document.getElementById('mentorProfileModalOverlay').remove()">✕</button>
                <div class="mpm-avatar-wrap"><span>${getInitials(m.fullName)}</span></div>
                <div class="mpm-name">${m.fullName}</div>
                <div class="mpm-role">Expert Mentor &nbsp;·&nbsp; ${(m.categories || []).slice(0,2).join(', ')}</div>
            </div>
            <div class="mpm-body">
                <div class="mpm-stats">
                    <div class="mpm-stat">
                        <div class="mpm-stat-value">${menteeCount}</div>
                        <div class="mpm-stat-label">Mentees</div>
                    </div>
                    <div class="mpm-stat">
                        <div class="mpm-stat-value">${(m.categories || []).length}</div>
                        <div class="mpm-stat-label">Fields</div>
                    </div>
                    <div class="mpm-stat">
                        <div class="mpm-stat-value">${m.availability ? '✓' : '—'}</div>
                        <div class="mpm-stat-label">Available</div>
                    </div>
                </div>

                <div class="mpm-section-label">About</div>
                <div class="mpm-bio">${m.bio || 'This mentor has not added a bio yet.'}</div>

                <div class="mpm-section-label">Expertise & Fields</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;">
                    ${(m.categories || []).map(c => `<span class="category-chip">${c}</span>`).join('')}
                </div>

                <div class="mpm-info-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>${m.institution || 'N/A'}</span>
                </div>
                <div class="mpm-info-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                    <span>${m.expertise || 'General Mentorship'}</span>
                </div>
                ${m.availability ? `<div class="mpm-info-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>${m.availability}</span></div>` : ''}

                ${existingReq
                    ? `<button class="mpm-request-btn" disabled style="background:${existingReq.status==='accepted'?'#1a5e4f':'#b47b00'}">
                        ${existingReq.status === 'accepted' ? '✓ Currently your Mentor' : '⏳ Request Pending'}
                    </button>`
                    : `<button class="mpm-request-btn" onclick="MentorDiscovery.openRequestFlow('${mentorId}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>Request Mentorship
                    </button>`
                }
            </div>
        </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ============================================================
//  MENTORSHIP REQUEST FLOW
// ============================================================
function openRequestFlow(mentorId) {
    const m = MockService.getUserById(mentorId);
    if (!m) return;
    document.getElementById('mentorProfileModalOverlay')?.remove();

    let currentUser = null;
    try { currentUser = JSON.parse(localStorage.getItem('innovateHubUser')); } catch(e) {}
    const innovatorId = currentUser?.id || 'u2';  // fallback for mock
    const myProjects = MockService.getProjectsByInnovator(innovatorId);

    const overlay = document.createElement('div');
    overlay.className = 'rejection-modal-overlay';
    overlay.id = 'requestFlowModal';
    overlay.innerHTML = `
        <div class="rejection-modal-box" style="max-width:520px;">
            <h4 style="color:var(--brand-green); display: flex; align-items: center; gap: 10px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Request Mentorship
            </h4>
            <p>You are requesting mentorship from <strong>${m.fullName}</strong>. Choose a project and write a brief introduction.</p>

            ${myProjects.length > 0 ? `
            <label style="font-size:0.82rem;font-weight:700;color:#8a9aaa;text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:6px;">Link a Project</label>
            <select id="requestProjectSelect" style="width:100%;border:1.5px solid #e0e0e0;border-radius:12px;padding:12px 14px;font-size:0.9rem;margin-bottom:14px;outline:none;">
                <option value="">— Select a project (optional) —</option>
                ${myProjects.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
            </select>` : ''}

            <label style="font-size:0.82rem;font-weight:700;color:#8a9aaa;text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:6px;">Your Message</label>
            <textarea id="requestMessage" rows="4" placeholder="Introduce yourself and explain what kind of guidance you're looking for..."></textarea>

            <div class="rejection-modal-actions">
                <button class="btn-approve" style="background:#6c757d;" onclick="document.getElementById('requestFlowModal').remove()">Cancel</button>
                <button class="btn-approve" onclick="MentorDiscovery.submitRequest('${mentorId}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>Send Request
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
}

function submitRequest(mentorId) {
    let currentUser = null;
    try { currentUser = JSON.parse(localStorage.getItem('innovateHubUser')); } catch(e) {}
    const innovatorId = currentUser?.id || 'u2';
    const projectId = (document.getElementById('requestProjectSelect') || {}).value || null;
    const message = (document.getElementById('requestMessage') || {}).value?.trim();

    if (!message) {
        document.getElementById('requestMessage').style.borderColor = '#dc3545';
        return;
    }

    const result = MockService.sendMentorshipRequest(innovatorId, mentorId, projectId, message);
    document.getElementById('requestFlowModal')?.remove();

    showToast(result.success ? `✓ ${result.message}` : `⚠ ${result.message}`, result.success ? 'success' : 'warning');

    if (result.success) renderMentorDiscovery();
}

// ============================================================
//  MY MENTORS (Innovator View)
// ============================================================
function renderMyMentors() {
    const container = document.getElementById('myMentorsContainer');
    if (!container || !window.MockService) return;

    let currentUser = null;
    try { currentUser = JSON.parse(localStorage.getItem('innovateHubUser')); } catch(e) {}
    const innovatorId = currentUser?.id || 'u2';
    const requests = MockService.getRequestsByInnovator(innovatorId);

    if (requests.length === 0) {
        container.innerHTML = `<div class="text-center py-5">
            <div style="font-size:3rem;margin-bottom:16px;">🤝</div>
            <h5 style="font-family:var(--font-head);color:var(--brand-green);">No mentors yet</h5>
            <p style="color:#aaa;">Start by browsing available mentors and sending a request.</p>
            <button class="btn-approve" onclick="window.showDashboardSection && window.showDashboardSection('mentors')">Browse Mentors</button></div>`;
        return;
    }

    const statusColors = { accepted: '#1a5e4f', pending: '#b47b00', rejected: '#dc3545' };

    container.innerHTML = requests.map(req => {
        const mentor = MockService.getUserById(req.mentorId);
        if (!mentor) return '';
        const project = req.projectId ? MockService.getProjectById(req.projectId) : null;

        return `
        <div class="my-mentor-item">
            <div class="my-mentor-avatar">${getInitials(mentor.fullName)}</div>
            <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                    <div>
                        <div style="font-family:var(--font-head);font-weight:800;font-size:1rem;color:var(--brand-green);">${mentor.fullName}</div>
                        <div style="font-size:0.8rem;color:#8a9aaa;">${mentor.expertise || 'Mentor'} &nbsp;·&nbsp; ${mentor.institution || ''}</div>
                    </div>
                    <span class="badge-premium" style="background:rgba(${req.status==='accepted'?'26,94,79':'req.status==="pending"?"243,168,19":"220,53,69"'},0.1);color:${statusColors[req.status]||'#666'};border:1px solid;border-color:${statusColors[req.status]||'#ccc'}22;">
                        ${req.status === 'accepted' ? '✓ Active' : req.status === 'pending' ? '⏳ Pending' : '✕ Rejected'}
                    </span>
                </div>

                ${project ? `<div style="margin-top:10px;font-size:0.82rem;color:#777;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Linked to: <strong>${project.title}</strong></div>` : ''}
                ${req.status === 'rejected' && req.rejectionReason ? `
                    <div class="rejection-reason-box" style="margin-top:12px;padding:12px 16px;">
                        <strong>Reason for rejection</strong>
                        <p>${req.rejectionReason}</p>
                    </div>` : ''}

                ${req.scheduledMeeting ? `
                    <div class="meeting-card" style="margin-top:14px;padding:16px;">
                        <div style="font-family:var(--font-head);font-weight:800;font-size:0.9rem;color:var(--brand-green);margin-bottom:10px;display:flex;align-items:center;gap:6px;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                            Scheduled Meeting
                        </div>
                        <div class="meeting-info-row"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>${formatDate(req.scheduledMeeting.date)} at ${req.scheduledMeeting.time}</span></div>
                        <a class="meeting-zoom-btn" href="${req.scheduledMeeting.zoomLink}" target="_blank">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>Join Zoom Meeting
                        </a>
                    </div>` : (req.status === 'accepted' ? `<div style="margin-top:10px;font-size:0.82rem;color:#aaa;display:flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>Waiting for mentor to schedule a meeting.</div>` : '')}
            </div>
        </div>`;
    }).join('');
}

// ============================================================
//  TOAST
// ============================================================
function showToast(message, type = 'success') {
    const colors = { success: '#1a5e4f', warning: '#b47b00', error: '#dc3545' };
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:30px;right:30px;z-index:99999;padding:14px 24px;border-radius:14px;font-weight:700;font-size:0.9rem;box-shadow:0 8px 24px rgba(0,0,0,0.15);animation:slideup 0.3s ease;color:#fff;background:${colors[type]||colors.success};`;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ============================================================
//  MENTOR REQUESTS (Mentor Side — Accept / Reject / Schedule)
// ============================================================
function renderMentorRequests() {
    const container = document.getElementById('requestsContainer');
    if (!container || !window.MockService) return;

    let currentUser = null;
    try { currentUser = JSON.parse(localStorage.getItem('innovateHubUser')); } catch(e) {}
    const mentorId = currentUser?.id || 'u4';
    const requests = MockService.getRequestsByMentor(mentorId);

    if (requests.length === 0) {
        container.innerHTML = `<div class="text-center py-5"><div style="font-size:3rem;margin-bottom:16px;">📭</div><h5 style="font-family:var(--font-head);color:var(--brand-green);">No requests yet</h5><p style="color:#aaa;">Mentorship requests from innovators will appear here.</p></div>`;
        return;
    }

    container.innerHTML = requests.map(req => {
        const innovator = MockService.getUserById(req.innovatorId);
        const project = req.projectId ? MockService.getProjectById(req.projectId) : null;

        const actionButtons = req.status === 'pending'
            ? `<button class="btn-approve" onclick="MentorView.acceptRequest('${req.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><polyline points="20 6 9 17 4 12"/></svg>Accept
               </button>
               <button class="btn-reject-soft" onclick="MentorView.promptRejectRequest('${req.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Reject
               </button>`
            : req.status === 'accepted'
            ? `<span class="badge-premium badge-premium-approved">✓ Accepted</span>
               <button class="btn-approve" style="margin-left:8px;" onclick="MentorView.openScheduler('${req.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Schedule Meeting
               </button>`
            : `<span class="badge-premium badge-premium-rejected">✕ Rejected</span>`;

        return `
        <div class="request-card" id="req-${req.id}">
            <div class="request-card-header">
                <div class="user-avatar-mini" style="border-radius:12px;width:48px;height:48px;font-size:1rem;flex-shrink:0;">${innovator ? getInitials(innovator.fullName) : '??'}</div>
                <div style="flex:1;">
                    <div class="request-card-title">${innovator ? innovator.fullName : 'Unknown Innovator'}</div>
                    <div class="request-card-meta">${innovator?.institution || ''} &nbsp;·&nbsp; ${formatDate(req.requestedAt)}</div>
                    ${project ? `<div style="margin-top:4px;font-size:0.78rem;"><i class="fa fa-folder me-1" style="color:var(--brand-green);"></i>${project.title}</div>` : ''}
                </div>
            </div>
            <div class="request-card-message">"${req.message}"</div>
            ${req.scheduledMeeting ? `
                <div class="meeting-card" style="margin-bottom:14px;">
                    <div class="meeting-info-row"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>${formatDate(req.scheduledMeeting.date)} at ${req.scheduledMeeting.time}</span></div>
                    <a class="meeting-zoom-btn" href="${req.scheduledMeeting.zoomLink || '#'}" target="_blank">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>Join Zoom
                    </a>
                </div>` : ''}
            <div class="request-card-actions">${actionButtons}</div>
        </div>`;
    }).join('');
}

// ============================================================
//  MENTOR VIEW CONTROLLERS
// ============================================================
const MentorView = {
    acceptRequest(requestId) {
        MockService.respondToRequest(requestId, 'accepted');
        renderMentorRequests();
        // Update mentor stats if visible
        const totalEl = document.getElementById('totalMentees');
        const pendingEl = document.getElementById('pendingRequests');
        if (totalEl) {
            let currentUser = null;
            try { currentUser = JSON.parse(localStorage.getItem('innovateHubUser')); } catch(e) {}
            const mid = currentUser?.id || 'u4';
            totalEl.textContent = MockService.getRequestsByMentor(mid).filter(r => r.status === 'accepted').length;
            if (pendingEl) pendingEl.textContent = MockService.getPendingRequestsForMentor(mid).length;
        }
        showToast('✓ Request accepted! You can now schedule a meeting.');
    },

    promptRejectRequest(requestId) {
        const overlay = document.createElement('div');
        overlay.className = 'rejection-modal-overlay';
        overlay.id = 'requestRejectModal';
        overlay.innerHTML = `
            <div class="rejection-modal-box">
                <h4><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Decline Request</h4>
                <p>Let the innovator know why you are declining. This helps them find a better-matched mentor.</p>
                <textarea id="mentorRejectReason" rows="4" placeholder="e.g. Your project is outside my area of expertise, but I recommend..."></textarea>
                <div class="rejection-modal-actions">
                    <button class="btn-approve" style="background:#6c757d;" onclick="document.getElementById('requestRejectModal').remove()">Cancel</button>
                    <button class="btn-reject-soft" onclick="MentorView.confirmRejectRequest('${requestId}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Decline Request
                    </button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    confirmRejectRequest(requestId) {
        const reason = document.getElementById('mentorRejectReason')?.value?.trim();
        if (!reason) {
            document.getElementById('mentorRejectReason').style.borderColor = '#dc3545';
            return;
        }
        MockService.respondToRequest(requestId, 'rejected', reason);
        document.getElementById('requestRejectModal')?.remove();
        renderMentorRequests();
        showToast('Request declined.', 'warning');
    },

    openScheduler(requestId) {
        const overlay = document.createElement('div');
        overlay.className = 'rejection-modal-overlay';
        overlay.id = 'schedulerModal';
        overlay.innerHTML = `
            <div class="rejection-modal-box" style="max-width:480px;">
                <h4 style="color:var(--brand-green); display: flex; align-items: center; gap: 10px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Schedule a Meeting
                </h4>
                <p>Set a date and time for your Zoom session with the innovator.</p>
                <label style="font-size:0.82rem;font-weight:700;color:#8a9aaa;display:block;margin-bottom:4px;">Date</label>
                <input id="meetDate" type="date" style="width:100%;border:1.5px solid #e0e0e0;border-radius:12px;padding:12px;margin-bottom:12px;font-size:0.9rem;outline:none;" />
                <label style="font-size:0.82rem;font-weight:700;color:#8a9aaa;display:block;margin-bottom:4px;">Time (EAT)</label>
                <input id="meetTime" type="time" style="width:100%;border:1.5px solid #e0e0e0;border-radius:12px;padding:12px;margin-bottom:12px;font-size:0.9rem;outline:none;" />
                <label style="font-size:0.82rem;font-weight:700;color:#8a9aaa;display:block;margin-bottom:4px;">Zoom Link</label>
                <input id="meetZoom" type="url" placeholder="https://zoom.us/j/..." style="width:100%;border:1.5px solid #e0e0e0;border-radius:12px;padding:12px;font-size:0.9rem;outline:none;" />
                <div class="rejection-modal-actions">
                    <button class="btn-approve" style="background:#6c757d;" onclick="document.getElementById('schedulerModal').remove()">Cancel</button>
                    <button class="btn-approve" onclick="MentorView.confirmSchedule('${requestId}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>Schedule
                    </button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    confirmSchedule(requestId) {
        const date = document.getElementById('meetDate')?.value;
        const time = document.getElementById('meetTime')?.value;
        const zoom = document.getElementById('meetZoom')?.value?.trim();
        if (!date || !time) {
            showToast('Please fill in date and time.', 'error');
            return;
        }
        MockService.scheduleMeeting(requestId, { date, time: time + ' EAT', zoomLink: zoom || '#' });
        document.getElementById('schedulerModal')?.remove();
        renderMentorRequests();
        showToast('✓ Meeting scheduled! The innovator will see the details.');
    }
};

// ============================================================
//  PUBLIC API
// ============================================================
const MentorDiscovery = {
    init() {
        renderCategoryFilters();
        renderMentorDiscovery();
        const searchInput = document.getElementById('mentorSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => renderMentorDiscovery());
        }
    },

    toggleCategory(cat) {
        const idx = selectedCategories.indexOf(cat);
        if (idx > -1) selectedCategories.splice(idx, 1);
        else selectedCategories.push(cat);
        renderCategoryFilters();
        renderMentorDiscovery();
    },

    openProfile: openMentorProfileModal,
    openRequestFlow: openRequestFlow,
    submitRequest: submitRequest,
};

window.MentorDiscovery = MentorDiscovery;
window.MentorView = MentorView;
window.renderMyMentors = renderMyMentors;
window.renderMentorRequests = renderMentorRequests;

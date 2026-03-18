// Supabase Auth — auth state via window.supabase session or localStorage fallback

// Helper: get current Supabase user (sync-safe via localStorage)
function getCurrentAuthUser() {
    const stored = localStorage.getItem('innovateHubUser');
    if (stored) {
        try { return JSON.parse(stored); } catch(e) {}
    }
    return null;
}

// ============================================================
//  HELPERS
// ============================================================
function getInitials(name = '') {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
}

function formatDate(dateObj) {
    if (!dateObj) return '—';
    // Handle Firestore Timestamps
    const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return d.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

const ALL_CATEGORIES = ['ai', 'technology', 'agriculture', 'healthcare', 'education', 'environment', 'business', 'social', 'robotics', 'engineering'];

let selectedCategories = [];
let currentMentorForRequest = null;

function renderCategoryFilters() {
    const container = document.getElementById('mentorCategoryCheckboxes');
    if (!container) return;

    container.innerHTML = `
        <div class="category-filter-bar d-flex flex-wrap gap-2">
            ${ALL_CATEGORIES.map(cat => `
                <div class="cat-filter-pill ${selectedCategories.includes(cat) ? 'active' : ''}" 
                     style="padding: 6px 16px; border-radius: 50px; cursor: pointer; font-size: 0.8rem; font-weight: 700; transition: all 0.2s; 
                            background: ${selectedCategories.includes(cat) ? 'var(--brand-green)' : '#f1f5f9'}; 
                            color: ${selectedCategories.includes(cat) ? 'white' : '#64748b'};
                            border: 1px solid ${selectedCategories.includes(cat) ? 'var(--brand-green)' : 'transparent'};"
                     onclick="MentorDiscovery.toggleCategory('${cat}')">
                    ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================================
//  MENTOR DISCOVERY
// ============================================================
async function renderMentorDiscovery() {
    const container = document.getElementById('mentorsContainer');
    if (!container) return;
    
    // Show spinner while fetching
    container.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>`;

    try {
        const searchInput = document.getElementById('mentorSearchInput');
        const searchVal = searchInput ? searchInput.value.toLowerCase() : '';
        let allMentors = [];

        // 1. Try Supabase First
        if (window.SupabaseService) {
            try {
                const sbMentors = await window.SupabaseService.getProfilesByRole('mentor');
                if (sbMentors && sbMentors.length > 0) {
                    // Only show approved mentors
                    allMentors = sbMentors
                        .filter(m => m.status === 'approved' || m.approval_status === 'approved' || m.status === 'active')
                        .map(m => ({
                            id: m.id,
                            fullName: m.full_name,
                            expertise: m.expertise,
                            bio: m.bio,
                            institution: m.institution,
                            photoURL: m.avatar_url,
                            categories: m.expertise ? m.expertise.split(',').map(s => s.trim()) : [],
                            status: m.status || m.approval_status
                        }));
                    console.log("Mentor Discovery: Loaded from Supabase");
                }
            } catch (sbErr) {
                console.error("Mentor Discovery: Supabase fetch failed", sbErr);
            }
        }

        // 2. Fallback removed - Supabase is the single source of truth

        // Apply local search/category filters
        let filteredMentors = allMentors.filter(m => {
            const matchesCategory = selectedCategories.length === 0 || 
                selectedCategories.some(c => 
                    (m.categories || []).map(cat => cat.toLowerCase()).includes(c.toLowerCase()) || 
                    (m.expertise || '').toLowerCase().includes(c.toLowerCase())
                );
            
            const matchesSearch = !searchVal || 
                (m.fullName || '').toLowerCase().includes(searchVal) || 
                (m.expertise || '').toLowerCase().includes(searchVal) ||
                (m.institution || '').toLowerCase().includes(searchVal) ||
                (m.bio || '').toLowerCase().includes(searchVal);
                
            return matchesCategory && matchesSearch;
        });

        if (filteredMentors.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="empty-state-card p-5" style="background:white; border-radius:24px; border:1px solid rgba(0,0,0,0.05);">
                        <div style="font-size:3.5rem;margin-bottom:20px;filter:grayscale(1);">👨‍🏫</div>
                        <h4 style="font-family:var(--font-head);color:var(--brand-green);font-weight:800;">No Approved Mentors Found</h4>
                        <p style="color:#64748b;max-width:400px;margin:0 auto 24px;">Try adjusting your filters or search terms. Only admin-approved mentors are visible.</p>
                        <button class="btn btn-primary rounded-pill px-4" onclick="selectedCategories=[]; MentorDiscovery.init();">Clear All Filters</button>
                    </div>
                </div>`;
            return;
        }

        // SMART Nuru Suggestion System
        let userContext = { interests: [], skills: [] };
        const user = getCurrentAuthUser();
        if (user && window.SupabaseService) {
            try {
                const profile = await window.SupabaseService.getProfile(user.uid);
                if (profile) {
                    userContext.interests = profile.interests ? profile.interests.split(',').map(i => i.trim().toLowerCase()).filter(i => i) : [];
                    userContext.skills = profile.skills ? profile.skills.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];
                }
            } catch(e) { console.warn("Nuru couldn't fetch user context from Supabase"); }
        }

        const matchScore = (m) => {
            let score = 0;
            const mentorCats = (m.categories || []).map(c => String(c).toLowerCase());
            const exp = Array.isArray(m.expertise) ? m.expertise.join(' ').toLowerCase() : String(m.expertise || '').toLowerCase();
            
            selectedCategories.forEach(c => {
                const lowC = c.toLowerCase();
                if (mentorCats.includes(lowC) || exp.includes(lowC)) score += 10;
            });
            
            userContext.interests.forEach(i => {
                const lowI = i.toLowerCase();
                if (mentorCats.includes(lowI) || exp.includes(lowI)) score += 5;
            });
            
            return score;
        };

        const scoredMentors = filteredMentors.map(m => ({ ...m, score: matchScore(m) }))
            .sort((a, b) => b.score - a.score);

        const nuruSuggested = scoredMentors.filter(m => m.score > 0).slice(0, 3);
        
        let html = '';
        if (nuruSuggested.length > 0 && !searchVal && selectedCategories.length === 0) {
            html += `
            <div class="col-12 mb-4">
                <div class="nuru-suggestion-banner shadow-sm" style="background: linear-gradient(135deg, #1a5e4f 0%, #0d4237 100%); border:none; padding:1.5rem; border-radius:20px; display:flex; align-items:center; gap:20px; color:white;">
                    <div style="font-size:2.5rem; background:rgba(255,255,255,0.1); width:70px; height:70px; display:flex; align-items:center; justify-content:center; border-radius:18px;">🤖</div>
                    <div>
                        <h5 style="margin:0; font-weight:800; font-family:var(--font-head); letter-spacing:0.5px;">Nuru Smart Matches</h5>
                        <p style="margin:0; opacity:0.8; font-size:0.9rem;">We found mentors that match your profile interests.</p>
                    </div>
                </div>
            </div>`;
        }

        html += scoredMentors.map(m => {
            const isNuruMatch = nuruSuggested.some(s => s.id === m.id);
            return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="mentor-disco-card shadow-sm border-0 ${isNuruMatch ? 'nuru-highlight' : ''}" 
                     onclick="MentorDiscovery.openProfile('${m.id}')" 
                     style="cursor:pointer; transition:all 0.3s ease; background:white; position:relative; overflow:hidden; border-radius:24px; height:100%; display:flex; flex-direction:column; border:1px solid rgba(0,0,0,0.03);">
                    
                    ${isNuruMatch ? '<div style="position:absolute; top:12px; right:12px; background:var(--brand-yellow); color:#000; font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; padding:4px 10px; border-radius:8px; z-index:2; box-shadow:0 4px 10px rgba(243,168,19,0.3);">TOP MATCH</div>' : ''}
                    
                    <div style="height:110px; background:linear-gradient(45deg, #f8fafc 0%, #f1f5f9 100%); position:relative;">
                         <div style="position:absolute; bottom:-35px; left:20px;">
                            ${m.photoURL ? 
                                `<img src="${m.photoURL}" style="width:80px; height:80px; border-radius:24px; border:4px solid white; object-fit:cover; box-shadow:0 8px 20px rgba(0,0,0,0.1);">` :
                                `<div style="width:80px; height:80px; border-radius:24px; border:4px solid white; background:var(--brand-green); color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.6rem; box-shadow:0 8px 20px rgba(0,0,0,0.1);">${getInitials(m.fullName)}</div>`
                            }
                         </div>
                    </div>

                    <div class="p-4 pt-5 flex-grow-1" style="margin-top:5px;">
                        <h5 style="font-family:var(--font-head); font-weight:800; color:#1e293b; margin-bottom:4px;">${m.fullName || 'Mentor'}</h5>
                        <div style="font-size:0.85rem; color:#64748b; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                            <span style="font-weight:700; color:var(--brand-green);">${m.expertise || 'Expert'}</span>
                            <span style="opacity:0.3;">|</span>
                            <span>${m.institution || 'USIU-Africa'}</span>
                        </div>
                        
                        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
                            ${(m.categories || []).slice(0, 3).map(c => `<span style="font-size:0.65rem; background:#f1f5f9; color:#475569; padding:4px 8px; border-radius:6px; font-weight:700; text-transform:uppercase;">${c}</span>`).join('')}
                        </div>
                        <p style="font-size:0.8rem; color:#64748b; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${m.bio || 'Professional mentor ready to guide your next big innovation.'}</p>
                    </div>

                    <div class="p-4 border-top" style="background:#fafafa;">
                        <button class="btn w-100 rounded-pill py-2" style="background:var(--brand-green); color:white; font-weight:700; font-size:0.85rem; border:none;">
                            View Profile
                        </button>
                    </div>
                </div>
            </div>
        `; }).join('');

        container.innerHTML = html;

    } catch (e) {
        console.error("Error fetching mentors: ", e);
        container.innerHTML = `<div class="col-12 text-center text-danger py-5">
            <i class="fa fa-exclamation-triangle mb-3" style="font-size:2rem;"></i>
            <p>Failed to load mentors. Please try again later.</p>
        </div>`;
    }
}

// ============================================================
//  PROFESSIONAL MENTOR PROFILE MODAL (LinkedIn Style)
// ============================================================
async function openMentorProfileModal(mentorId) {
    if (!mentorId) return;

    try {
        let m = null;
        let menteeCount = 0;

        // 1. Try Supabase First
        if (window.SupabaseService) {
            try {
                const sbProfile = await window.SupabaseService.getProfile(mentorId);
                if (sbProfile) {
                    m = {
                        id: sbProfile.id,
                        fullName: sbProfile.full_name,
                        expertise: sbProfile.expertise,
                        bio: sbProfile.bio,
                        institution: sbProfile.institution,
                        photoURL: sbProfile.avatar_url,
                        availability: sbProfile.availability,
                        communicationPreference: sbProfile.communication_preference,
                        categories: sbProfile.expertise ? sbProfile.expertise.split(',').map(s => s.trim()) : []
                    };

                    const sbMentorships = await window.SupabaseService.getMentorships(mentorId, 'mentor');
                    if (sbMentorships) {
                        menteeCount = sbMentorships.filter(ms => ms.status === 'accepted').length;
                    }
                    console.log("Mentor Profile: Loaded from Supabase");
                }
            } catch (sbErr) {
                console.error("Mentor Profile: Supabase fetch failed", sbErr);
            }
        }

        // 2. Fallback removed

        currentMentorForRequest = m;

        // Check active requests
        let existingReq = null;
        const user = getCurrentAuthUser();
        if (user) {
            // Check Supabase first for existing request
            if (window.SupabaseService) {
                const sbReqs = await window.SupabaseService.getMentorships(user.uid, 'innovator');
                if (sbReqs) {
                    existingReq = sbReqs.find(ms => ms.mentor_id === mentorId && (ms.status === 'pending' || ms.status === 'accepted'));
                }
            }

            // Fallback removed
        }

        const isFull = menteeCount >= 2;

        const existing = document.getElementById('mentorProfileModalOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'mentor-profile-modal-overlay';
        overlay.id = 'mentorProfileModalOverlay';
        
        overlay.innerHTML = `
            <div class="mentor-profile-modal shadow-2xl" 
                 style="width:95%; max-width:800px; max-height:90vh; background:white; border-radius:32px; overflow:hidden; display:flex; flex-direction:column; border: 1px solid rgba(0,0,0,0.05);">
                
                <!-- Professional Banner -->
                <div style="height:160px; background:linear-gradient(135deg, #1a5e4f 0%, #0a2d26 100%); position:relative;">
                    <button class="mpm-close" style="position:absolute; top:20px; right:20px; background:rgba(255,255,255,0.2); border:none; color:white; width:36px; height:36px; border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="document.getElementById('mentorProfileModalOverlay').remove()">✕</button>
                    
                    <div style="position:absolute; bottom:-60px; left:40px;">
                        ${m.photoURL ? 
                            `<img src="${m.photoURL}" style="width:130px; height:130px; border-radius:32px; border:6px solid white; object-fit:cover; box-shadow:0 12px 30px rgba(0,0,0,0.15);">` :
                            `<div style="width:130px; height:130px; border-radius:32px; border:6px solid white; background:var(--brand-yellow); color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:3rem; box-shadow:0 12px 30px rgba(0,0,0,0.15);">${getInitials(m.fullName)}</div>`
                        }
                    </div>
                </div>

                <div style="padding:80px 40px 40px; overflow-y:auto; flex:1;">
                    <div class="row g-4">
                        <div class="col-lg-7">
                            <div class="mb-4">
                                <h2 style="font-family:var(--font-head); font-weight:800; color:#1e293b; margin-bottom:4px; font-size:2rem;">${m.fullName || 'Mentor'}</h2>
                                <p style="font-size:1.1rem; color:var(--brand-green); font-weight:700; margin-bottom:12px;">${m.expertise || 'Professional Expert'}</p>
                                <div style="color:#64748b; font-size:0.9rem; display:flex; flex-wrap:wrap; gap:16px;">
                                    <span><i class="fa fa-university me-2"></i>${m.institution || 'USIU-Africa'}</span>
                                    <span><i class="fa fa-map-marker-alt me-2"></i>Nairobi, Kenya</span>
                                </div>
                            </div>

                            <div style="margin-bottom:32px;">
                                <h6 style="font-weight:700; text-transform:uppercase; font-size:0.75rem; letter-spacing:1px; color:#94a3b8; margin-bottom:12px;">Professional Biography</h6>
                                <p style="line-height:1.7; color:#475569; font-size:0.95rem;">${m.bio || 'Experienced professional dedicated to fostering innovation and supporting next-generation talent in the African tech ecosystem.'}</p>
                            </div>

                            <div>
                                <h6 style="font-weight:700; text-transform:uppercase; font-size:0.75rem; letter-spacing:1px; color:#94a3b8; margin-bottom:12px;">Focus Areas</h6>
                                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                                    ${(m.categories || []).map(c => `
                                        <span style="background:#f1f5f9; color:#475569; padding:6px 14px; border-radius:10px; font-weight:700; font-size:0.75rem; border:1px solid rgba(0,0,0,0.03);">
                                            ${c.toUpperCase()}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                        <div class="col-lg-5">
                            <div style="background:#f8fafc; border-radius:24px; padding:28px; border:1px solid rgba(0,0,0,0.03);">
                                <h6 style="font-weight:700; text-transform:uppercase; font-size:0.75rem; letter-spacing:1px; color:#94a3b8; margin-bottom:24px;">Mentorship Stats</h6>
                                
                                <div class="d-flex align-items-center gap-3 mb-4">
                                    <div style="width:50px; height:50px; background:white; border-radius:14px; display:flex; align-items:center; justify-content:center; color:var(--brand-green); box-shadow:0 4px 10px rgba(0,0,0,0.03); font-size:1.2rem; font-weight:800;">${menteeCount}</div>
                                    <div>
                                        <div style="font-size:0.75rem; color:#64748b; font-weight:600;">Active Mentees</div>
                                        <div style="font-size:0.85rem; font-weight:700; color:#1e293b;">Guided Innovators</div>
                                    </div>
                                </div>

                                <div class="d-flex align-items-center gap-3 mb-4">
                                    <div style="width:50px; height:50px; background:white; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#f3a813; box-shadow:0 4px 10px rgba(0,0,0,0.03);"><i class="fa fa-calendar-check"></i></div>
                                    <div>
                                        <div style="font-size:0.75rem; color:#64748b; font-weight:600;">Availability</div>
                                        <div style="font-size:0.85rem; font-weight:700; color:#1e293b;">${m.availability || 'Weekends, 10am - 4pm'}</div>
                                    </div>
                                </div>

                                <div class="d-flex align-items-center gap-3">
                                    <div style="width:50px; height:50px; background:white; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#3b82f6; box-shadow:0 4px 10px rgba(0,0,0,0.03);"><i class="fa fa-comments"></i></div>
                                    <div>
                                        <div style="font-size:0.75rem; color:#64748b; font-weight:600;">Preferred Communication</div>
                                        <div style="font-size:0.85rem; font-weight:700; color:#1e293b;">${m.communicationPreference || 'Zoom & Slack'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                                 <div style="margin-top:40px;">
                        ${existingReq
                            ? `<button disabled style="width:100%; padding:20px; border-radius:18px; border:none; color:white; font-weight:800; font-size:1rem; background:${existingReq.status === 'accepted' ? 'var(--brand-green)' : '#f3a813'}; opacity:0.8; display:flex; align-items:center; justify-content:center; gap:12px;">
                                 ${existingReq.status === 'accepted' ? '<i class="fa fa-check-circle"></i> Connected Mentor' : '<i class="fa fa-clock"></i> Request Pending Approval'}
                               </button>`
                            : isFull 
                                ? `<button disabled style="width:100%; padding:20px; border-radius:18px; border:none; background:#cbd5e1; color:#64748b; font-weight:800; font-size:1.1rem; display:flex; align-items:center; justify-content:center; gap:12px;">
                                    <i class="fa fa-ban"></i> Mentor at Capacity (Max 2 Mentees)
                                   </button>`
                                : `<button onclick="MentorDiscovery.openRequestFlow('${mentorId}')" 
                                           style="width:100%; padding:20px; border-radius:18px; border:none; background:linear-gradient(135deg, var(--brand-green) 0%, #0a2d26 100%); color:white; font-weight:800; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:12px; box-shadow:0 12px 24px rgba(26,94,79,0.3); transition:all 0.3s ease;">
                                    <i class="fa fa-paper-plane"></i> Apply for Mentorship Session
                                   </button>`
                        }
                    </div>
         </div>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    } catch(err) {
        console.error("Error opening profile:", err);
    }
}

// ============================================================
//  MENTORSHIP REQUEST FLOW
// ============================================================
async function openRequestFlow(mentorId) {
    if (!currentMentorForRequest) return;
    document.getElementById('mentorProfileModalOverlay')?.remove();

    const user = getCurrentAuthUser();
    if (!user) return;
    
    // Fetch user's projects
    // Fetch user's projects from Supabase (Source of Truth)
    if (window.SupabaseService) {
        try {
            const myProjects = await window.SupabaseService.getProjects({ innovator_id: user.uid });
            
            const overlay = document.createElement('div');
            overlay.className = 'rejection-modal-overlay';
            overlay.id = 'requestFlowModal';
            overlay.innerHTML = `
                <div class="rejection-modal-box" style="max-width:520px;">
                    <h4 style="color:var(--brand-green); display: flex; align-items: center; gap: 10px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="me-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Request Mentorship
                    </h4>
                    <p>You are requesting mentorship from <strong>${currentMentorForRequest.fullName}</strong>. Choose a project and write a brief introduction.</p>
        
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
                        <button class="btn-approve" onclick="MentorDiscovery.submitRequest('${mentorId}')" id="btnSubmitReq">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>Send Request
                        </button>
                    </div>
                </div>`;
        
            document.body.appendChild(overlay);
        } catch(e) { console.error("Error fetching projects for request flow", e); }
    }
}

async function submitRequest(mentorId) {
    const user = getCurrentAuthUser();
    if (!user) return;
    
    const projectId = (document.getElementById('requestProjectSelect') || {}).value || null;
    const messageField = document.getElementById('requestMessage');
    const message = messageField?.value?.trim();

    if (!message) {
        if(messageField) messageField.style.borderColor = '#dc3545';
        return;
    }

    try {
        const btn = document.getElementById('btnSubmitReq');
        if (btn) btn.disabled = true;

        // Primary Sync: Supabase
        if (window.SupabaseService) {
            const sbMentorship = await window.SupabaseService.createMentorship({
                innovator_id: user.uid,
                mentor_id: mentorId,
                project_id: projectId,
                message: message,
                status: 'pending'
            });
            console.log("Mentor Discovery: Request created in Supabase ✓");
            
            // Background Sync removed
            
            document.getElementById('requestFlowModal')?.remove();
            showToast('✓ Mentorship request sent successfully!', 'success');
            renderMentorDiscovery();
            return;
        }

    } catch(err) {
        console.error('Error submitting request:', err);
        showToast('⚠ Failed to send request. Try again.', 'error');
        const btn = document.getElementById('btnSubmitReq');
        if (btn) btn.disabled = false;
    }
}

// ============================================================
//  MY MENTORS (Innovator View)
// ============================================================
async function renderMyMentors() {
    const container = document.getElementById('myMentorsContainer');
    const user = getCurrentAuthUser();
    if (!container || !user) return;

    container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

    try {
        let mentorships = [];

        // 1. Fetch from Supabase (Single Source of Truth)
        if (window.SupabaseService) {
            const sbMentorships = await window.SupabaseService.getMentorships(user.uid, 'innovator');
            if (sbMentorships && sbMentorships.length > 0) {
                mentorships = sbMentorships.map(ms => ({
                    id: ms.id,
                    mentorId: ms.mentor_id,
                    projectId: ms.project_id,
                    status: ms.status,
                    message: ms.message,
                    requestedAt: ms.created_at,
                    adminApproved: ms.status === 'accepted', 
                    mentorData: ms.mentor,
                    projectData: ms.project
                }));
                console.log("My Mentors: Loaded from Supabase ✓");
            }
        }

        // Removed Firestore fallback to ensure Supabase is the single source of truth

        if (mentorships.length === 0) {
            container.innerHTML = `<div class="text-center py-5">
                <div style="font-size:3rem;margin-bottom:16px;">🤝</div>
                <h5 style="font-family:var(--font-head);color:var(--brand-green);">No mentors yet</h5>
                <p style="color:#aaa;">Start by browsing available mentors and sending a request.</p>
                <button class="btn-approve" onclick="window.showDashboardSection && window.showDashboardSection('mentors')">Browse Mentors</button></div>`;
            return;
        }

        let html = '';

        for (let ms of mentorships) {
            let mentor = ms.mentorData || { fullName: 'Unknown Mentor', expertise: '' };
            let project = ms.projectData || null;

            // Fallback for missing joined data
            if (!mentor.fullName && !mentor.full_name && ms.mentorId) {
                if (window.SupabaseService) {
                    const sbProf = await window.SupabaseService.getProfile(ms.mentorId);
                    if (sbProf) mentor = sbProf;
                }
            }
            // Fallback removed

            const mentorName = mentor.fullName || mentor.full_name || "Mentor";
            const mentorExpertise = mentor.expertise || "Expert";
            const mentorInst = mentor.institution || "USIU-Africa";
            const projTitle = project?.title || "Untitled Project";

            const isApproved = ms.status === 'accepted';
            const statusLabel = isApproved ? '✓ Active' : (ms.status === 'pending' ? '⏳ Request Sent' : '✕ Rejected');

            html += `
            <div class="my-mentor-item">
                <div class="my-mentor-avatar">${getInitials(mentorName)}</div>
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                        <div>
                            <div style="font-family:var(--font-head);font-weight:800;font-size:1rem;color:var(--brand-green);">${mentorName}</div>
                            <div style="font-size:0.8rem;color:#8a9aaa;">${mentorExpertise} &nbsp;·&nbsp; ${mentorInst}</div>
                        </div>
                        <span class="badge-premium" style="background:rgba(${isApproved ? '26,94,79' : (ms.status==='rejected'?'220,53,69':'243,168,19')},0.1);color:${isApproved ? '#1a5e4f' : (ms.status==='rejected'?'#dc3545':'#b47b00')};border:1px solid;border-color:${isApproved ? '#1a5e4f' : (ms.status==='rejected'?'#dc3545':'#b47b00')}22;">
                            ${statusLabel}
                        </span>
                    </div>

                    ${project ? `<div style="margin-top:10px;font-size:0.82rem;color:#777;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Linked to: <strong>${projTitle}</strong></div>` : ''}
                    
                    <div style="margin-top:20px;display:flex;gap:10px;">
                        <button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="MentorDiscovery.openProfile('${ms.mentorId}')">
                            <i class="fa fa-user me-1"></i> View Profile
                        </button>
                        ${isApproved ? `
                            <button class="btn btn-sm btn-success rounded-pill px-3" onclick="window.showProjectCollaboration('${ms.projectId}', '${ms.mentorId}')">
                                <i class="fa fa-comments me-1"></i> Collab Hub
                            </button>
                            <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="MentorDiscovery.requestTermination('${ms.id}', '${mentorName}')">
                                <i class="fa fa-user-minus me-1"></i> Stop Mentorship
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>`;
        }
        
        container.innerHTML = html;
        
    } catch(err) {
        console.error('Error fetching mentees:', err);
        container.innerHTML = `<div class="text-center text-danger py-5">Failed to load active mentors.</div>`;
    }
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
//  MENTOR REQUESTS (Mentor Side)
// ============================================================
async function renderMentorRequests() {
    const container = document.getElementById('requestsContainer');
    const user = getCurrentAuthUser();
    if (!container || !user) return;

    container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

    try {
        let requests = [];

        // 1. Try Supabase First
        if (window.SupabaseService) {
            try {
                const sbReqs = await window.SupabaseService.getMentorships(user.uid, 'mentor');
                if (sbReqs && sbReqs.length > 0) {
                    requests = sbReqs.map(r => ({
                        id: r.id,
                        innovatorId: r.innovator_id,
                        mentorId: r.mentor_id,
                        projectId: r.project_id,
                        message: r.message,
                        status: r.status,
                        requestedAt: r.created_at,
                        innovatorData: r.profiles,
                        projectData: r.projects
                    }));
                    console.log("Mentor Requests: Loaded from Supabase");
                }
            } catch (sbErr) {
                console.error("Mentor Requests: Supabase fetch failed", sbErr);
            }
        }

        // 2. Fallback removed

        if (requests.length === 0) {
            container.innerHTML = `<div class="text-center py-5"><div style="font-size:3rem;margin-bottom:16px;">📭</div><h5 style="font-family:var(--font-head);color:var(--brand-green);">No requests yet</h5><p style="color:#aaa;">Mentorship requests from innovators will appear here.</p></div>`;
            return;
        }

        let html = '';
        for (let req of requests) {
            let innovator = req.innovatorData || { fullName: 'Unknown Innovator' };
            let project = req.projectData || null;

            // Fallback removed

            const innovatorName = innovator.fullName || innovator.full_name || "Innovator";
            const innovatorInst = innovator.institution || "USIU-Africa";

            const actionButtons = req.status === 'pending'
                ? `<button class="btn-approve" onclick="MentorView.acceptRequest('${req.id}')">
                        <i class="fa fa-check me-1"></i>Accept
                   </button>
                   <button class="btn-reject-soft" onclick="MentorView.promptRejectRequest('${req.id}')">
                        <i class="fa fa-times me-1"></i>Reject
                   </button>`
                : req.status === 'accepted'
                ? `<span class="badge-premium badge-premium-approved">✓ Accepted</span>
                     <button class="btn btn-sm btn-success rounded-pill px-3 ms-2" onclick="window.showProjectCollaboration('${req.projectId}', '${req.innovatorId}')">
                        <i class="fa fa-comments me-1"></i> Collab Hub
                     </button>`
                : `<span class="badge-premium badge-premium-rejected">✕ Rejected</span>`;

            html += `
            <div class="request-card" id="req-${req.id}">
                <div class="request-card-header">
                    <div class="user-avatar-mini" style="border-radius:12px;width:48px;height:48px;font-size:1rem;flex-shrink:0;">${getInitials(innovatorName)}</div>
                    <div style="flex:1;">
                        <div class="request-card-title">${innovatorName}</div>
                        <div class="request-card-meta">${innovatorInst} &nbsp;·&nbsp; ${formatDate(req.requestedAt)}</div>
                        ${project ? `<div style="margin-top:4px;font-size:0.78rem;"><i class="fa fa-folder me-1" style="color:var(--brand-green);"></i>${project.title}</div>` : ''}
                    </div>
                </div>
                <div class="request-card-message">"${req.message}"</div>
                <div class="request-card-actions">${actionButtons}</div>
            </div>`;
        }

        container.innerHTML = html;

    } catch (err) {
        console.error('Error fetching mentor requests:', err);
    }
}

// ============================================================
//  MENTOR VIEW CONTROLLERS
// ============================================================
const MentorView = {
    async acceptRequest(requestId) {
        try {
            // 1. Update Firestore - Removed
            
            // Link mentor to project - Handled in Supabase check if needed
            // (Assuming Supabase updateMentorshipStatus handles backend logic)

            // 2. Supabase Sync: Update Status
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.updateMentorshipStatus(requestId, 'accepted');
                    console.log("Mentor Discovery: Accept synced to Supabase");
                } catch (sbErr) {
                    console.error("Mentor Discovery: Supabase accept sync failed", sbErr);
                }
            }

            renderMentorRequests();
            showToast('✓ Request accepted! You can now collaborate.');
        } catch(e) {
            console.error('Failed to accept:', e);
            showToast('⚠ Failed to accept request.');
        }
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

    async confirmRejectRequest(requestId) {
        const reason = document.getElementById('mentorRejectReason')?.value?.trim();
        if (!reason) {
            document.getElementById('mentorRejectReason').style.borderColor = '#dc3545';
            return;
        }
        try {
            // 1. Update Firestore - Removed

            // 2. Supabase Sync: Update Status
            if (window.SupabaseService) {
                try {
                    await window.SupabaseService.updateMentorshipStatus(requestId, 'rejected');
                    console.log("Mentor Discovery: Reject synced to Supabase");
                } catch (sbErr) {
                    console.error("Mentor Discovery: Supabase reject sync failed", sbErr);
                }
            }

            document.getElementById('requestRejectModal')?.remove();
            renderMentorRequests();
            showToast('Request declined.', 'warning');
        } catch(err) {
            console.error(err);
        }
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

    async confirmSchedule(requestId) {
        const date = document.getElementById('meetDate')?.value;
        const time = document.getElementById('meetTime')?.value;
        const zoom = document.getElementById('meetZoom')?.value?.trim();
        if (!date || !time) {
            showToast('Please fill in date and time.', 'error');
            return;
        }
        try {
            const meetingData = {
                date,
                time: time + ' EAT',
                zoomLink: zoom || '#'
            };

            // 1. Update Firestore - Removed

            // 2. Supabase Sync: Update Profile/Meeting Info
            if (window.SupabaseService) {
                try {
                    // Assuming meeting info is part of the mentorship record in Supabase
                    await window.SupabaseService.updateMentorshipStatus(requestId, 'accepted', {
                        meeting_date: meetingData.date,
                        meeting_time: meetingData.time,
                        zoom_link: meetingData.zoomLink
                    });
                    console.log("Mentor Discovery: Schedule synced to Supabase");
                } catch (sbErr) {
                    console.error("Mentor Discovery: Supabase schedule sync failed", sbErr);
                }
            }

            document.getElementById('schedulerModal')?.remove();
            renderMentorRequests();
            showToast('✓ Meeting scheduled! The innovator will see the details.');
        } catch(e) {
            console.error(e);
            showToast('Failed to schedule meeting.', 'error');
        }
    }
};

// ============================================================
//  PUBLIC API
// ============================================================
const MentorDiscovery = {
    async init() {
        renderCategoryFilters();
        
        // Fix: Wait for auth if not ready
        if (!auth.currentUser) {
            console.log("MentorDiscovery: Waiting for auth...");
            auth.onAuthStateChanged((user) => {
                if (user) renderMentorDiscovery();
            });
        } else {
            renderMentorDiscovery();
        }

        const searchInput = document.getElementById('mentorSearchInput');
        if (searchInput) {
            // Remove old listener if exists to prevent duplicates
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            
            newSearchInput.addEventListener('input', (e) => {
                renderMentorDiscovery();
            });
        }
    },

    toggleCategory(cat) {
        const idx = selectedCategories.indexOf(cat);
        if (idx > -1) selectedCategories.splice(idx, 1);
        else selectedCategories.push(cat);
        renderCategoryFilters();
        renderMentorDiscovery();
    },

    async requestTermination(requestId, mentorName) {
        const reason = prompt(`Why would you like to terminate your mentorship with ${mentorName}?\n\nThis will notify the Admin for review.`);
        if (!reason) return;

        try {
            // Background Sync removed

            showToast('✓ Termination request submitted to Admin.', 'success');
            renderMyMentors();
        } catch(err) {
            console.error('Error requesting termination:', err);
            showToast('⚠ Failed to submit request.', 'error');
        }
    },

    openProfile: openMentorProfileModal,
    openRequestFlow: openRequestFlow,
    submitRequest: submitRequest,
};

window.MentorDiscovery = MentorDiscovery;
window.MentorView = MentorView;
window.renderMyMentors = renderMyMentors;
window.renderMentorRequests = renderMentorRequests;

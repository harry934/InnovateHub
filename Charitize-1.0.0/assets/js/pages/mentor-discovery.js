/**
 * Innovator Dashboard — Mentor Discovery & Mentorship Flow
 * Version: 2.0.0
 * Fully integrated with Firebase Firestore
 */

import { auth, db } from "../core/firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ============================================================
//  HELPERS
// ============================================================
function getInitials(name = "") {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

function formatDate(dateObj) {
  if (!dateObj) return "—";
  // Handle Firestore Timestamps
  const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
  return d.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const ALL_CATEGORIES = [
  "AI",
  "Software",
  "Agriculture",
  "Healthcare",
  "Business",
  "Education",
  "Finance",
  "Marketing",
  "Strategy",
  "Legal",
  "Operations",
  "Social",
  "Sustainability",
];

// Safely coerce any value to a lowercase string for comparisons
function safeStr(val) {
  if (!val) return "";
  if (Array.isArray(val)) return val.join(" ").toLowerCase();
  return String(val).toLowerCase();
}

let selectedCategories = [];
let currentMentorForRequest = null;

// ============================================================
//  MENTOR DISCOVERY
// ============================================================
async function renderMentorDiscovery() {
  const container = document.getElementById("mentorsContainer");
  if (!container) return;

  // Show spinner while fetching
  container.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>`;

  try {
    const searchInput = document.getElementById("mentorSearchInput");
    const searchVal = searchInput ? searchInput.value.toLowerCase() : "";

    // Robust Fetching Strategy: Fetch all users and filter locally
    // This avoids "The query requires an index" errors which often break discovery
    let allUsersSnapshot;
    try {
      allUsersSnapshot = await getDocs(collection(db, "users"));
    } catch (fetchErr) {
      console.error("Firestore Fetch Error in discovery:", fetchErr);
      container.innerHTML = `<div class="col-12 text-center py-5">
                <div style="font-size:3rem;margin-bottom:16px;">🌐</div>
                <h5 style="color:#dc3545;">Connection Error</h5>
                <p style="color:#aaa;">We couldn't reach the mentor database. Please check your internet connection.</p></div>`;
      return;
    }

    let allMentors = [];
    allUsersSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const isMentor = data.role === "mentor";
      const isApproved =
        data.isApproved === true ||
        (data.status || "").toLowerCase() === "approved";
      const isProfileComplete = data.profileComplete === true; // Only show mentors who finished onboarding

      if (isMentor && isApproved) {
        allMentors.push({ id: docSnap.id, ...data });
      }
    });

    // Apply local search/category filters
    let filteredMentors = allMentors.filter((m) => {
      const mentorCats = Array.isArray(m.categories)
        ? m.categories.map((c) => String(c).toLowerCase())
        : [];
      const mentorExp = safeStr(m.expertise);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((c) => {
          return (
            mentorCats.includes(c.toLowerCase()) ||
            mentorExp.includes(c.toLowerCase())
          );
        });

      const matchesSearch =
        !searchVal ||
        (m.fullName || "").toLowerCase().includes(searchVal) ||
        mentorExp.includes(searchVal) ||
        (m.institution || "").toLowerCase().includes(searchVal) ||
        mentorCats.some((cat) => cat.includes(searchVal));

      return matchesCategory && matchesSearch;
    });

    if (filteredMentors.length === 0) {
      container.innerHTML = `<div class="col-12 text-center py-5">
                <div style="font-size:3rem;margin-bottom:16px;">🔍</div>
                <h5 style="font-family:var(--font-head);color:var(--brand-green);">No mentors found</h5>
                <p style="color:#aaa;">Try adjusting your filters or search term.</p></div>`;
      return;
    }

    // SMART Nuru Suggestion System
    let userInterests = [];
    let userSkills = [];
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const ud = userDoc.data();
          userInterests = (ud.interests || "")
            .split(",")
            .map((i) => i.trim().toLowerCase())
            .filter((i) => i);
          userSkills = ud.skills || [];
        }
      } catch (e) {
        console.warn("Nuru couldn't fetch user context for suggestions");
      }
    }

    const matchScore = (m) => {
      let score = 0;
      const mentorCats = Array.isArray(m.categories)
        ? m.categories.map((c) => String(c).toLowerCase())
        : [];
      const exp = safeStr(m.expertise);

      // Match against selected categories (High weight)
      selectedCategories.forEach((c) => {
        if (
          mentorCats.includes(c.toLowerCase()) ||
          exp.includes(c.toLowerCase())
        )
          score += 10;
      });

      // Match against user interests (Medium weight)
      userInterests.forEach((i) => {
        if (mentorCats.includes(i) || exp.includes(i)) score += 5;
      });

      // Match against user skills (Low weight)
      userSkills.forEach((s) => {
        if (
          mentorCats.includes(s.toLowerCase()) ||
          exp.includes(s.toLowerCase())
        )
          score += 2;
      });

      return score;
    };

    // Rank mentors by score
    const scoredMentors = filteredMentors
      .map((m) => ({ ...m, score: matchScore(m) }))
      .sort((a, b) => b.score - a.score);

    const nuruSuggested = scoredMentors.filter((m) => m.score > 0).slice(0, 3);

    const nuruBanner =
      nuruSuggested.length > 0
        ? `
            <div class="col-12">
                <div class="nuru-suggestion-banner">
                    <div class="nuru-sug-icon">🤖</div>
                    <div>
                        <div class="nuru-sug-title">Nuru AI Suggestions</div>
                        <div class="nuru-sug-sub">Matched based on your ${selectedCategories.length > 0 ? "selections" : "profile interests"}: <strong>${nuruSuggested.map((m) => (m.fullName || "").split(" ")[0]).join(", ")}</strong></div>
                    </div>
                </div>
            </div>`
        : "";

    const isNuruSuggested = (id) => nuruSuggested.some((m) => m.id === id);

    container.innerHTML =
      nuruBanner +
      filteredMentors
        .map(
          (m) => `
            <div class="col-md-6 col-lg-4">
                <div class="mentor-disco-card${isNuruSuggested(m.id) ? " nuru-highlight" : ""}" onclick="MentorDiscovery.openProfile('${m.id}')">
                    ${isNuruSuggested(m.id) ? '<div style="position:absolute;top:12px;right:12px;background:var(--brand-yellow);color:#000;font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.8px;padding:3px 8px;border-radius:6px;">⭐ Nuru Pick</div>' : ""}
                    ${m.photoURL ? 
                        `<div class="mdc-avatar-img"><img src="${m.photoURL}" class="rounded-circle" style="width: 58px; height: 58px; object-fit: cover; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></div>` : 
                        `<div class="mdc-avatar">${getInitials(m.fullName || "User")}</div>`
                    }
                    <div class="mdc-name">${m.fullName || "Mentor"}</div>
                    <div class="mdc-expertise">${Array.isArray(m.expertise) ? m.expertise.join(", ") : m.expertise || "Expert Mentor"}</div>
                    <div class="mdc-institution">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="me-1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>${m.institution || "N/A"}
                    </div>
                    <div class="mdc-categories">
                        ${(m.categories || [])
                          .slice(0, 3)
                          .map((c) => `<span class="category-chip">${c}</span>`)
                          .join("")}
                    </div>
                    <button class="btn-premium-action" onclick="event.stopPropagation(); MentorDiscovery.openProfile('${m.id}')">
                        View Profile
                    </button>
                </div>
            </div>
        `,
        )
        .join("");
  } catch (e) {
    console.error("Error fetching mentors: ", e);
    container.innerHTML = `<div class="col-12 text-center text-danger py-5">Failed to load mentors.</div>`;
  }
}

// ============================================================
//  CATEGORY FILTER BAR
// ============================================================
function renderCategoryFilters() {
  const container = document.getElementById("mentorCategoryCheckboxes");
  if (!container) return;
  container.innerHTML = `<div class="category-filter-bar">
        ${ALL_CATEGORIES.map(
          (c) => `
            <button class="cat-filter-pill ${selectedCategories.includes(c) ? "active" : ""}" onclick="MentorDiscovery.toggleCategory('${c}')">
                ${c}
            </button>`,
        ).join("")}
    </div>`;
}

// ============================================================
//  INSTAGRAM-STYLE MENTOR PROFILE MODAL
// ============================================================
async function openMentorProfileModal(mentorId) {
  if (!mentorId) return;

  try {
    const docRef = doc(db, "users", mentorId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const m = { id: docSnap.id, ...docSnap.data() };
    currentMentorForRequest = m;

    // Check active requests and count mentees
    let existingReq = null;
    let menteeCount = 0;

    if (auth.currentUser) {
      try {
        const reqQArr = [
          collection(db, "mentorshipRequests"),
          where("innovatorId", "==", auth.currentUser.uid),
          where("mentorId", "==", mentorId),
        ];
        const reqSnap = await getDocs(query(...reqQArr));
        reqSnap.forEach((r) => {
          const data = r.data();
          if (["pending", "accepted"].includes(data.status)) existingReq = data;
        });
      } catch (reqErr) {
        console.warn("Could not fetch specific request with index, skipping filter:", reqErr);
      }

      try {
        const countQ = query(
          collection(db, "mentorshipRequests"),
          where("mentorId", "==", mentorId),
          where("status", "==", "accepted"),
        );
        const countSnap = await getDocs(countQ);
        menteeCount = countSnap.size;
      } catch (countErr) {
        console.warn("Count query failed (likely missing index), using 0:", countErr);
      }
    }

    const existing = document.getElementById("mentorProfileModalOverlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "mentor-profile-modal-overlay";
    overlay.id = "mentorProfileModalOverlay";
    overlay.innerHTML = `
            <div class="mentor-profile-modal">
                <div class="mpm-header">
                    <button class="mpm-close" onclick="document.getElementById('mentorProfileModalOverlay').remove()">✕</button>
                    <div class="mpm-avatar-wrap"><span>${getInitials(m.fullName || "User")}</span></div>
                    <div class="mpm-name">${m.fullName || "Mentor"}</div>
                    <div class="mpm-role">Expert Mentor &nbsp;·&nbsp; ${(m.categories || []).slice(0, 2).join(", ")}</div>
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
                            <div class="mpm-stat-value">${m.availability ? "✓" : "—"}</div>
                            <div class="mpm-stat-label">Available</div>
                        </div>
                    </div>

                    <div class="mpm-section-label">About</div>
                    <div class="mpm-bio">${m.bio || "This mentor has not added a bio yet."}</div>

                    <div class="mpm-section-label">Expertise & Fields</div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;">
                        ${(m.categories || []).map((c) => `<span class="category-chip">${c}</span>`).join("")}
                    </div>

                    <div class="mpm-info-row">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <span>${m.institution || "N/A"}</span>
                    </div>
                    <div class="mpm-info-row">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                        <span>${m.expertise || "General Mentorship"}</span>
                    </div>
                    ${m.experience ? `<div class="mpm-info-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>${m.experience} Years of Experience</span></div>` : ""}
                    <div class="mpm-info-row">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span>Communication: ${m.communicationPreference || "Zoom/Slack"}</span>
                    </div>
                    ${m.availability ? `<div class="mpm-info-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>Availability: ${m.availability}</span></div>` : ""}
                    
                    <div class="mpm-info-row text-warning">
                        <i class="fa fa-star me-2"></i>
                        <span>Rating: ${m.rating || "4.8"} / 5.0</span>
                    </div>

                    ${
                      existingReq
                        ? `<button class="mpm-request-btn" disabled style="background:${existingReq.status === "accepted" ? "#1a5e4f" : "#b47b00"}">
                            ${existingReq.status === "accepted" ? "✓ Currently your Mentor" : "⏳ Request Pending"}
                        </button>`
                        : `<button class="mpm-request-btn" onclick="MentorDiscovery.openRequestFlow('${mentorId}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>Request Mentorship
                        </button>`
                    }
                </div>
            </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
  } catch (err) {
    console.error("Error opening profile:", err);
  }
}

// ============================================================
//  MENTORSHIP REQUEST FLOW
// ============================================================
async function openRequestFlow(mentorId) {
  if (!currentMentorForRequest) return;
  document.getElementById("mentorProfileModalOverlay")?.remove();

  if (!auth.currentUser) return;

  // Fetch user's projects
  let myProjects = [];
  try {
    const q = query(
      collection(db, "projects"),
      where("userId", "==", auth.currentUser.uid),
    );
    const snap = await getDocs(q);
    snap.forEach((d) => myProjects.push({ id: d.id, ...d.data() }));
  } catch (e) {}

  const overlay = document.createElement("div");
  overlay.className = "rejection-modal-overlay";
  overlay.id = "requestFlowModal";
  overlay.innerHTML = `
        <div class="rejection-modal-box" style="max-width:520px;">
            <h4 style="color:var(--brand-green); display: flex; align-items: center; gap: 10px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="me-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Request Mentorship
            </h4>
            <p>You are requesting mentorship from <strong>${currentMentorForRequest.fullName}</strong>. Choose a project and write a brief introduction.</p>

            ${
              myProjects.length > 0
                ? `
            <label style="font-size:0.82rem;font-weight:700;color:#8a9aaa;text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:6px;">Link a Project</label>
            <select id="requestProjectSelect" style="width:100%;border:1.5px solid #e0e0e0;border-radius:12px;padding:12px 14px;font-size:0.9rem;margin-bottom:14px;outline:none;">
                <option value="">— Select a project (optional) —</option>
                ${myProjects.map((p) => `<option value="${p.id}">${p.title}</option>`).join("")}
            </select>`
                : ""
            }

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
}

async function submitRequest(mentorId) {
  if (!auth.currentUser) return;

  const projectId =
    (document.getElementById("requestProjectSelect") || {}).value || null;
  const messageField = document.getElementById("requestMessage");
  const message = messageField?.value?.trim();

  if (!message) {
    if (messageField) messageField.style.borderColor = "#dc3545";
    return;
  }

  try {
    const btn = document.getElementById("btnSubmitReq");
    if (btn) btn.disabled = true;

    await addDoc(collection(db, "mentorshipRequests"), {
      innovatorId: auth.currentUser.uid,
      mentorId: mentorId,
      projectId: projectId,
      message: message,
      status: "pending",
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    document.getElementById("requestFlowModal")?.remove();
    showToast("✓ Mentorship request sent successfully!", "success");
    renderMentorDiscovery();
  } catch (err) {
    console.error("Error submitting request:", err);
    showToast("⚠ Failed to send request. Try again.", "error");
    const btn = document.getElementById("btnSubmitReq");
    if (btn) btn.disabled = false;
  }
}

// ============================================================
//  MY MENTORS (Innovator View)
// ============================================================
async function renderMyMentors() {
  const container = document.getElementById("myMentorsContainer");
  if (!container || !auth.currentUser) return;

  container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

  try {
    const q = query(
      collection(db, "mentorshipRequests"),
      where("innovatorId", "==", auth.currentUser.uid),
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `<div class="text-center py-5">
                <div style="font-size:3rem;margin-bottom:16px;">🤝</div>
                <h5 style="font-family:var(--font-head);color:var(--brand-green);">No mentors yet</h5>
                <p style="color:#aaa;">Start by browsing available mentors and sending a request.</p>
                <button class="btn-approve" onclick="window.showDashboardSection && window.showDashboardSection('mentors')">Browse Mentors</button></div>`;
      return;
    }

    const statusColors = {
      accepted: "#1a5e4f",
      pending: "#b47b00",
      rejected: "#dc3545",
    };
    let html = "";

    // Iterate and fetch mentor + project data for each request
    for (let docSnap of snap.docs) {
      const req = { id: docSnap.id, ...docSnap.data() };

      // Fetch mentor doc
      const mSnap = await getDoc(doc(db, "users", req.mentorId));
      const mentor = mSnap.exists()
        ? mSnap.data()
        : { fullName: "Unknown Mentor", expertise: "" };

      // Fetch project doc if exists
      let project = null;
      if (req.projectId) {
        const pSnap = await getDoc(doc(db, "projects", req.projectId));
        if (pSnap.exists()) project = pSnap.data();
      }

      html += `
            <div class="my-mentor-item">
                <div class="my-mentor-avatar">${getInitials(mentor.fullName)}</div>
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                        <div>
                            <div style="font-family:var(--font-head);font-weight:800;font-size:1rem;color:var(--brand-green);">${mentor.fullName}</div>
                            <div style="font-size:0.8rem;color:#8a9aaa;">${mentor.expertise || "Mentor"} &nbsp;·&nbsp; ${mentor.institution || ""}</div>
                        </div>
                        <span class="badge-premium" style="background:rgba(${req.status === "accepted" ? "26,94,79" : req.status === "pending" ? "243,168,19" : "220,53,69"},0.1);color:${statusColors[req.status] || "#666"};border:1px solid;border-color:${statusColors[req.status] || "#ccc"}22;">
                            ${req.status === "accepted" ? "✓ Active" : req.status === "pending" ? "⏳ Pending" : "✕ Rejected"}
                        </span>
                    </div>

                    ${project ? `<div style="margin-top:10px;font-size:0.82rem;color:#777;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Linked to: <strong>${project.title}</strong></div>` : ""}
                    ${
                      req.status === "rejected" && req.rejectionReason
                        ? `
                        <div class="rejection-reason-box" style="margin-top:12px;padding:12px 16px;">
                            <strong>Reason for rejection</strong>
                            <p>${req.rejectionReason}</p>
                        </div>`
                        : ""
                    }

                    ${
                      req.scheduledMeeting
                        ? `
                        <div class="meeting-card" style="margin-top:14px;padding:16px;">
                            <div style="font-family:var(--font-head);font-weight:800;font-size:0.9rem;color:var(--brand-green);margin-bottom:10px;display:flex;align-items:center;gap:6px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                Scheduled Meeting
                            </div>
                            <div class="meeting-info-row"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>${formatDate(req.scheduledMeeting.date)} at ${req.scheduledMeeting.time}</span></div>
                            <a class="meeting-zoom-btn" href="${req.scheduledMeeting.zoomLink}" target="_blank">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>Join Zoom Meeting
                            </a>
                        </div>`
                        : req.status === "accepted"
                          ? `<div style="margin-top:10px;font-size:0.82rem;color:#aaa;display:flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>Waiting for mentor to schedule a meeting.</div>`
                          : ""
                    }
                    
                    <div style="margin-top:20px;display:flex;gap:10px;">
                        <button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="MentorDiscovery.openProfile('${req.mentorId}')">
                            <i class="fa fa-user me-1"></i> View Profile
                        </button>
                        ${
                          req.status === "accepted"
                            ? `
                            <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="MentorDiscovery.requestTermination('${req.id}', '${mentor.fullName}')">
                                <i class="fa fa-user-minus me-1"></i> Stop Mentorship
                            </button>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>`;
    }

    container.innerHTML = html;
  } catch (err) {
    console.error("Error fetching mentees:", err);
    container.innerHTML = `<div class="text-center text-danger py-5">Failed to load active mentors.</div>`;
  }
}

// ============================================================
//  TOAST
// ============================================================
function showToast(message, type = "success") {
  const colors = { success: "#1a5e4f", warning: "#b47b00", error: "#dc3545" };
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:30px;right:30px;z-index:99999;padding:14px 24px;border-radius:14px;font-weight:700;font-size:0.9rem;box-shadow:0 8px 24px rgba(0,0,0,0.15);animation:slideup 0.3s ease;color:#fff;background:${colors[type] || colors.success};`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ============================================================
//  MENTOR REQUESTS (Mentor Side)
// ============================================================
async function renderMentorRequests() {
  const container = document.getElementById("requestsContainer");
  if (!container || !auth.currentUser) return;

  container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

  try {
    const q = query(
      collection(db, "mentorshipRequests"),
      where("mentorId", "==", auth.currentUser.uid),
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `<div class="text-center py-5"><div style="font-size:3rem;margin-bottom:16px;">📭</div><h5 style="font-family:var(--font-head);color:var(--brand-green);">No requests yet</h5><p style="color:#aaa;">Mentorship requests from innovators will appear here.</p></div>`;
      return;
    }

    let html = "";
    for (let docSnap of snap.docs) {
      const req = { id: docSnap.id, ...docSnap.data() };

      const iSnap = await getDoc(doc(db, "users", req.innovatorId));
      const innovator = iSnap.exists()
        ? iSnap.data()
        : { fullName: "Unknown Innovator" };

      let project = null;
      if (req.projectId) {
        const pSnap = await getDoc(doc(db, "projects", req.projectId));
        if (pSnap.exists()) project = pSnap.data();
      }

      const actionButtons =
        req.status === "pending"
          ? `<button class="btn-approve" onclick="MentorView.acceptRequest('${req.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><polyline points="20 6 9 17 4 12"/></svg>Accept
                   </button>
                   <button class="btn-reject-soft" onclick="MentorView.promptRejectRequest('${req.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Reject
                   </button>`
          : req.status === "accepted"
            ? `<span class="badge-premium badge-premium-approved">✓ Accepted</span>
                   <button class="btn-approve" style="margin-left:8px;" onclick="MentorView.openScheduler('${req.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="me-1" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Schedule Meeting
                   </button>`
            : `<span class="badge-premium badge-premium-rejected">✕ Rejected</span>`;

      html += `
            <div class="request-card" id="req-${req.id}">
                <div class="request-card-header">
                    <div class="user-avatar-mini" style="border-radius:12px;width:48px;height:48px;font-size:1rem;flex-shrink:0;">${innovator ? getInitials(innovator.fullName) : "??"}</div>
                    <div style="flex:1;">
                        <div class="request-card-title">${innovator.fullName}</div>
                        <div class="request-card-meta">${innovator.institution || ""} &nbsp;·&nbsp; ${formatDate(req.requestedAt)}</div>
                        ${project ? `<div style="margin-top:4px;font-size:0.78rem;"><i class="fa fa-folder me-1" style="color:var(--brand-green);"></i>${project.title}</div>` : ""}
                    </div>
                </div>
                <div class="request-card-message">"${req.message}"</div>
                ${
                  req.scheduledMeeting
                    ? `
                    <div class="meeting-card" style="margin-bottom:14px;">
                        <div class="meeting-info-row"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>${formatDate(req.scheduledMeeting.date)} at ${req.scheduledMeeting.time}</span></div>
                        <a class="meeting-zoom-btn" href="${req.scheduledMeeting.zoomLink || "#"}" target="_blank">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>Join Zoom
                        </a>
                    </div>`
                    : ""
                }
                <div class="request-card-actions">${actionButtons}</div>
            </div>`;
    }

    container.innerHTML = html;
  } catch (err) {
    console.error("Error fetching mentor requests:", err);
  }
}

// ============================================================
//  MENTOR VIEW CONTROLLERS
// ============================================================
const MentorView = {
  async acceptRequest(requestId) {
    try {
      await updateDoc(doc(db, "mentorshipRequests", requestId), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });
      renderMentorRequests();
      showToast("✓ Request accepted! You can now schedule a meeting.");
    } catch (e) {
      console.error("Failed to accept:", e);
      showToast("⚠ Failed to accept request.");
    }
  },

  promptRejectRequest(requestId) {
    const overlay = document.createElement("div");
    overlay.className = "rejection-modal-overlay";
    overlay.id = "requestRejectModal";
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
    const reason = document.getElementById("mentorRejectReason")?.value?.trim();
    if (!reason) {
      document.getElementById("mentorRejectReason").style.borderColor =
        "#dc3545";
      return;
    }
    try {
      await updateDoc(doc(db, "mentorshipRequests", requestId), {
        status: "rejected",
        rejectionReason: reason,
        updatedAt: serverTimestamp(),
      });
      document.getElementById("requestRejectModal")?.remove();
      renderMentorRequests();
      showToast("Request declined.", "warning");
    } catch (err) {
      console.error(err);
    }
  },

  openScheduler(requestId) {
    const overlay = document.createElement("div");
    overlay.className = "rejection-modal-overlay";
    overlay.id = "schedulerModal";
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
    const date = document.getElementById("meetDate")?.value;
    const time = document.getElementById("meetTime")?.value;
    const zoom = document.getElementById("meetZoom")?.value?.trim();
    if (!date || !time) {
      showToast("Please fill in date and time.", "error");
      return;
    }
    try {
      await updateDoc(doc(db, "mentorshipRequests", requestId), {
        scheduledMeeting: {
          date,
          time: time + " EAT",
          zoomLink: zoom || "#",
        },
        updatedAt: serverTimestamp(),
      });
      document.getElementById("schedulerModal")?.remove();
      renderMentorRequests();
      showToast("✓ Meeting scheduled! The innovator will see the details.");
    } catch (e) {
      console.error(e);
      showToast("Failed to schedule meeting.", "error");
    }
  },
};

// ============================================================
//  PUBLIC API
// ============================================================
const MentorDiscovery = {
  init() {
    renderCategoryFilters();
    renderMentorDiscovery();
    const searchInput = document.getElementById("mentorSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        let filteredMentors = []; // Using mock query inside or re-render
        renderMentorDiscovery();
      }); // Re-renders
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
    const reason = prompt(
      `Why would you like to terminate your mentorship with ${mentorName}?\n\nThis will notify the Admin for review.`,
    );
    if (!reason) return;

    try {
      await addDoc(collection(db, "mentorshipTerminations"), {
        requestId: requestId,
        innovatorId: auth.currentUser.uid,
        mentorName: mentorName,
        reason: reason,
        status: "pending",
        requestedAt: serverTimestamp(),
      });

      // Also update the request status to indicate a pending termination
      await updateDoc(doc(db, "mentorshipRequests", requestId), {
        terminationRequested: true,
        updatedAt: serverTimestamp(),
      });

      showToast("✓ Termination request submitted to Admin.", "success");
      renderMyMentors();
    } catch (err) {
      console.error("Error requesting termination:", err);
      showToast("⚠ Failed to submit request.", "error");
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

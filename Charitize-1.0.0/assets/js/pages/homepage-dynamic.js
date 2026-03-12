import { db } from '../core/firebase-config.js';
import { collection, getDocs, query, where, limit, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch and Animate Stats
    try {
        const [usersSnap, projectsSnap] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'projects'))
        ]);
        
        const users = usersSnap.docs.map(d => d.data());
        const projects = projectsSnap.docs.map(d => d.data());
        
        // Mentors: Approved users with role 'mentor'
        const mentorsCount = users.filter(u => u.role === 'mentor' && u.status !== 'rejected').length;
        // Projects: Approved projects (or just total for now)
        const projectsCount = projects.length;
        // Students: Innovators
        const studentsCount = users.filter(u => u.role === 'innovator').length;
        // Awards: A static impressive metric or featured projects
        const awardsCount = Math.floor(projects.length * 0.1) + 40; // Simulated dynamically
        
        animateValue("stat-mentors", 0, mentorsCount || 0, 2000);
        animateValue("stat-awards", 0, awardsCount, 2000);
        animateValue("stat-projects", 0, projectsCount || 0, 2000);
        animateValue("stat-students", 0, studentsCount || 0, 2000);
        
    } catch (error) {
        console.error("Error fetching stats:", error);
    }
    
    // 2. Fetch and Inject Events
    try {
        const eventsContainer = document.getElementById('dynamicEventsGrid');
        if (!eventsContainer) return;
        
        const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(3));
        const eventsSnap = await getDocs(eventsQuery);
        
        if (eventsSnap.empty) {
            eventsContainer.innerHTML = '<div class="col-12 text-center p-5"><p class="text-muted">No upcoming events scheduled at the moment.</p></div>';
            return;
        }
        
        const eventsHTML = eventsSnap.docs.map((docSnap, index) => {
            const ev = docSnap.data();
            const delay = (index + 1) * 0.2;
            return `
                <div class="col-md-6 col-lg-4 wow fadeIn" data-wow-delay="${delay}s">
                    <div class="ih-event-card h-100 overflow-hidden" 
                         style="border-radius:16px; border:1px solid #e2e8f0; background:#fff; transition: transform 0.3s ease, box-shadow 0.3s ease;"
                         onmouseenter="this.style.transform='translateY(-8px)';this.style.boxShadow='0 20px 40px rgba(0,0,0,0.12)';"
                         onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow='none';">
                        <div style="position:relative; overflow:hidden; height:210px;">
                            <img style="width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.4s ease;"
                                 onmouseenter="this.style.transform='scale(1.04)';"
                                 onmouseleave="this.style.transform='scale(1)';"
                                 src="${ev.imageLink}" alt="${ev.title}">
                            <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(15,23,42,0.35) 0%, transparent 60%);"></div>
                        </div>
                        <div style="padding:1.4rem 1.5rem;">
                            <h5 style="font-weight:700; color:#1a5e4f; margin-bottom:0.6rem; line-height:1.3;">${ev.title}</h5>
                            <p style="color:#64748b; font-size:0.9rem; margin-bottom:1.1rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${ev.description}</p>
                            <div style="border-top:1px solid #f1f5f9; padding-top:1rem;">
                                <div style="display:flex; align-items:center; margin-bottom:0.55rem; gap:0.6rem;">
                                    <span style="flex-shrink:0; width:30px; height:30px; border-radius:8px; background:#f0fdf4; display:flex; align-items:center; justify-content:center;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a5e4f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    </span>
                                    <span style="font-size:0.85rem; color:#334155; font-weight:500;">${ev.date} &bull; ${ev.time}</span>
                                </div>
                                <div style="display:flex; align-items:center; gap:0.6rem;">
                                    <span style="flex-shrink:0; width:30px; height:30px; border-radius:8px; background:#f0fdf4; display:flex; align-items:center; justify-content:center;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a5e4f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    </span>
                                    <span style="font-size:0.85rem; color:#334155; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">${ev.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        eventsContainer.innerHTML = eventsHTML;
        
    } catch (error) {
        console.error("Error fetching events:", error);
        document.getElementById('dynamicEventsGrid').innerHTML = '<div class="col-12 text-center p-5"><p class="text-danger">Failed to load events. Please try again later.</p></div>';
    }
});

// Helper Function for number animation
function animateValue(id, start, end, duration) {
    if (start === end) return;
    const obj = document.getElementById(id);
    if (!obj) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        obj.innerHTML = Math.floor(easeProgress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            // Guarantee final value
            obj.innerHTML = end; 
        }
    };
    window.requestAnimationFrame(step);
}

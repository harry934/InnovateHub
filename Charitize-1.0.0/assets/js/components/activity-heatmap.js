/**
 * Activity Heatmap Component
 * Renders a GitHub-style 52-week activity grid
 */

export class ActivityHeatmap {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            color: options.color || '#1a5e4f',
            levelColors: options.levelColors || [
                '#ebedf0', // Level 0 (Empty)
                '#9be9a8', // Level 1
                '#40c463', // Level 2
                '#30a14e', // Level 3
                '#216e39'  // Level 4
            ],
            tooltipSuffix: options.tooltipSuffix || 'activities',
            ...options
        };
        this.data = options.data || {}; // Format: { "YYYY-MM-DD": count }
    }

    init() {
        this.render();
        // Skip auto-populating with fake data as per user request
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="heatmap-container">
                <div class="heatmap-header">
                    <div class="heatmap-months"></div>
                </div>
                <div class="heatmap-body">
                    <div class="heatmap-days">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                    </div>
                    <div class="heatmap-grid" id="heatmapGrid"></div>
                </div>
                <div class="heatmap-footer">
                    <div class="heatmap-legend">
                        <span>Less</span>
                        <div class="legend-squares">
                            <div class="legend-sq level-0"></div>
                            <div class="legend-sq level-1"></div>
                            <div class="legend-sq level-2"></div>
                            <div class="legend-sq level-3"></div>
                            <div class="legend-sq level-4"></div>
                        </div>
                        <span>More</span>
                    </div>
                </div>
            </div>
        `;

        this.gridContainer = this.container.querySelector('#heatmapGrid');
        this.renderMonths();
        this.renderGrid();
    }

    renderMonths() {
        const monthsContainer = this.container.querySelector('.heatmap-months');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        
        // Render months starting from 12 months ago
        for (let i = 0; i < 12; i++) {
            const mIdx = (currentMonth + i + 1) % 12;
            monthsContainer.innerHTML += `<span class="month-label">${months[mIdx]}</span>`;
        }
    }

    renderGrid() {
        if (!this.gridContainer) return;
        this.gridContainer.innerHTML = '';
        
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setDate(today.getDate() - 364);

        // Find the first Monday
        const start = new Date(oneYearAgo);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);

        let gridHtml = '';
        for (let w = 0; w < 53; w++) {
            gridHtml += '<div class="heatmap-week">';
            for (let d = 0; d < 7; d++) {
                const currentDate = new Date(start);
                currentDate.setDate(start.getDate() + (w * 7) + d);
                
                if (currentDate > today) {
                    gridHtml += '<div class="heatmap-day empty"></div>';
                    continue;
                }

                const dateStr = currentDate.toISOString().split('T')[0];
                const count = this.data[dateStr] || 0;
                const level = this.calculateLevel(count);
                
                gridHtml += `<div class="heatmap-day level-${level}" 
                    data-date="${dateStr}" 
                    data-count="${count}"></div>`;
            }
            gridHtml += '</div>';
        }
        this.gridContainer.innerHTML = gridHtml;
        this.setupTooltips();
    }

    calculateLevel(count) {
        if (count === 0) return 0;
        if (count < 2) return 1;
        if (count < 4) return 2;
        if (count < 7) return 3;
        return 4;
    }

    setupTooltips() {
        const days = this.container.querySelectorAll('.heatmap-day');
        days.forEach(day => {
            day.addEventListener('mouseover', (e) => {
                const dateStrings = day.dataset.date.split('-');
                const formattedDate = new Date(dateStrings[0], dateStrings[1]-1, dateStrings[2]).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                const count = day.dataset.count;
                const tooltip = document.createElement('div');
                tooltip.className = 'heatmap-tooltip';
                tooltip.innerHTML = `
                    <div style="font-weight: 800; color: #f3a813; font-size: 14px; margin-bottom: 2px;">${count} ${this.options.tooltipSuffix}</div>
                    <div style="opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">${formattedDate}</div>
                `;
                document.body.appendChild(tooltip);

                const rect = day.getBoundingClientRect();
                tooltip.style.left = `${rect.left + window.scrollX - tooltip.offsetWidth/2 + rect.width/2}px`;
                tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 15}px`;
                
                day._tooltip = tooltip;
                
                // GSAP Animation for tooltip
                if (window.gsap) {
                    gsap.fromTo(tooltip, { opacity: 0, y: 10, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(1.7)" });
                }
            });

            day.addEventListener('mouseout', () => {
                if (day._tooltip) {
                    const t = day._tooltip;
                    if (window.gsap) {
                        gsap.to(t, { opacity: 0, y: 5, scale: 0.9, duration: 0.2, onComplete: () => t.remove() });
                    } else {
                        t.remove();
                    }
                    day._tooltip = null;
                }
            });
        });
    }
}

// CSS Injection
const style = document.createElement('style');
style.textContent = `
    .heatmap-container {
        font-family: 'Josefin Sans', sans-serif;
        color: #1e293b;
        font-size: 11px;
        padding: 15px;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .heatmap-header { margin-bottom: 10px; }
    .heatmap-months { 
        display: flex; 
        margin-left: 30px; 
        justify-content: space-between;
        padding-right: 5px;
        font-weight: 600;
        color: #64748b;
    }
    .month-label { width: 25px; text-align: center; }
    .heatmap-body { display: flex; gap: 8px; }
    .heatmap-days { 
        display: flex; 
        flex-direction: column; 
        justify-content: space-around; 
        height: 85px;
        padding-top: 2px;
        font-weight: 600;
        color: #94a3b8;
        font-size: 9px;
        text-transform: uppercase;
    }
    .heatmap-grid { 
        display: flex; 
        gap: 3px; 
    }
    .heatmap-week { display: flex; flex-direction: column; gap: 3px; }
    .heatmap-day {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        cursor: pointer;
        transition: background 0.2s ease;
    }
    .heatmap-day.level-0 { background-color: #f1f5f9; }
    .heatmap-day.level-1 { background-color: #d1fae5; }
    .heatmap-day.level-2 { background-color: #6ee7b7; }
    .heatmap-day.level-3 { background-color: #10b981; }
    .heatmap-day.level-4 { background-color: #047857; }

    .heatmap-day:hover {
        transform: scale(1.3);
        z-index: 10;
        outline: 2px solid #1a5e4f;
    }
    .heatmap-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid #f1f5f9;
    }
    .heatmap-legend {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        color: #64748b;
    }
    .legend-squares { display: flex; gap: 2px; }
    .legend-sq { width: 9px; height: 9px; border-radius: 1.5px; }
    .legend-sq.level-0 { background-color: #f1f5f9; }
    .legend-sq.level-1 { background-color: #d1fae5; }
    .legend-sq.level-2 { background-color: #6ee7b7; }
    .legend-sq.level-3 { background-color: #10b981; }
    .legend-sq.level-4 { background-color: #047857; }
    
    .heatmap-tooltip {
        position: absolute;
        background: #1e293b;
        color: #fff;
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 11px;
        pointer-events: none;
        z-index: 10000;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        text-align: center;
        white-space: nowrap;
    }
    .heatmap-tooltip::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -4px;
        border-width: 4px;
        border-style: solid;
        border-color: #1e293b transparent transparent transparent;
    }
`;
document.head.appendChild(style);

window.ActivityHeatmap = ActivityHeatmap;

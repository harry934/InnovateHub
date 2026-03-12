/**
 * Live Wallpaper Background System
 * Uses Canvas and GSAP for a premium, flowing background effect
 */

export class LiveWallpaper {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        
        this.particles = [];
        this.particleCount = 20; // Reverted to subtle density
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        this.init();
        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    init() {
        const colors = [
            'rgba(26, 94, 79, 0.08)',  // Subtle Brand Green
            'rgba(243, 168, 19, 0.08)', // Subtle Brand Gold
            'rgba(26, 94, 79, 0.05)',
            'rgba(243, 168, 19, 0.05)'
        ];

        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 300 + 200, // Reverted to larger, softer range
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 0.4, // Slower, calmer motion
                vy: (Math.random() - 0.5) * 0.4,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw background gradient
        const bgGradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        bgGradient.addColorStop(0, '#f8fafb');
        bgGradient.addColorStop(1, '#f1f5f9');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.phase += 0.005;

            // Bounce off edges
            if (p.x < -p.radius) p.x = this.width + p.radius;
            if (p.x > this.width + p.radius) p.x = -p.radius;
            if (p.y < -p.radius) p.y = this.height + p.radius;
            if (p.y > this.height + p.radius) p.y = -p.radius;

            const currentRadius = p.radius + Math.sin(p.phase) * 50;
            
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.fillStyle = gradient;
            this.ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const bg = document.getElementById('liveWallpaperBg');
    if (bg) {
        window._liveWallpaper = new LiveWallpaper('liveWallpaperBg');
    }
});

window.LiveWallpaper = LiveWallpaper;

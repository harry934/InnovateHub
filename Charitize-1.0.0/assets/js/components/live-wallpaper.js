export class LiveWallpaper {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        
        this.particles = [];
        this.particleCount = 60; // Balanced density (up from 45)
        this.isActive = false;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.init();
    }

    resize() {
        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.animate();
    }

    stop() {
        this.isActive = false;
    }

    init() {
        const colors = [
            '#2C5F5D', // Teal
            '#F2A81D'  // Yellow
        ];
        const shapes = ['x', 'plus', 'diamond', 'dot', 'line'];

        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 10 + 10, // Slightly larger (10-20)
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.015,
                opacityPhase: Math.random() * Math.PI * 2,
                opacitySpeed: 0.005 + Math.random() * 0.01
            });
        }
    }

    drawShape(p) {
        const { x, y, size, color, shape, rotation, opacityPhase } = p;
        // Moderate visibility opacity (range 0.1 to 0.4)
        const opacity = 0.2 + (Math.sin(opacityPhase) * 0.2);
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        this.ctx.globalAlpha = opacity;
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 1.8; // Slightly thicker lines

        switch (shape) {
            case 'x':
                this.ctx.beginPath();
                this.ctx.moveTo(-size / 2, -size / 2);
                this.ctx.lineTo(size / 2, size / 2);
                this.ctx.moveTo(size / 2, -size / 2);
                this.ctx.lineTo(-size / 2, size / 2);
                this.ctx.stroke();
                break;
            case 'plus':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size / 2);
                this.ctx.lineTo(0, size / 2);
                this.ctx.moveTo(-size / 2, 0);
                this.ctx.lineTo(size / 2, 0);
                this.ctx.stroke();
                break;
            case 'diamond':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size / 2);
                this.ctx.lineTo(size / 2, 0);
                this.ctx.lineTo(0, size / 2);
                this.ctx.lineTo(-size / 2, 0);
                this.ctx.closePath();
                this.ctx.stroke();
                break;
            case 'dot':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'line':
                this.ctx.beginPath();
                this.ctx.moveTo(-size / 2, 0);
                this.ctx.lineTo(size / 2, 0);
                this.ctx.stroke();
                break;
        }
        this.ctx.restore();
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Distinct background for contrast (soft off-white)
        this.ctx.fillStyle = '#f6f8f9';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.opacityPhase += p.opacitySpeed;

            // Wrap around edges
            if (p.x < -50) p.x = this.width + 50;
            if (p.x > this.width + 50) p.x = -50;
            if (p.y < -50) p.y = this.height + 50;
            if (p.y > this.height + 50) p.y = -50;

            this.drawShape(p);
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const bg = document.getElementById('liveWallpaperBg');
    if (bg) {
        const wp = new LiveWallpaper('liveWallpaperBg');
        wp.start();
        window._liveWallpaper = wp;
    }
});

window.LiveWallpaper = LiveWallpaper;

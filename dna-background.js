class DNABackground {
    constructor() {
        this.canvas = document.getElementById('dna-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.nodesCount = 50; // More nodes for a fuller helix
        this.radius = 280; // Much larger helix radius
        this.perspective = 500;
        
        this.rotationY = 0;
        this.rotationX = 0.15;
        this.rotationZ = 0.08;
        
        this.targetRotationY = 0;
        
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };
        this.scroll = { y: 0, targetY: 0, velocity: 0 };
        
        // Labels to render inside the big end-node balls
        this.nodeLabels = [
            { index: 4, text: 'HOME', strand: 'A' },
            { index: 12, text: 'ABOUT', strand: 'B' },
            { index: 20, text: 'SKILLS', strand: 'A' },
            { index: 28, text: 'PROJECTS', strand: 'B' },
            { index: 36, text: 'EXPERIENCE', strand: 'A' },
            { index: 44, text: 'CONTACT', strand: 'B' },
        ];
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.active = true;
            this.mouse.targetX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
            this.mouse.targetY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
        });
        
        window.addEventListener('mouseleave', () => {
            this.mouse.active = false;
            this.mouse.targetX = 0;
            this.mouse.targetY = 0;
        });
        
        window.addEventListener('scroll', () => {
            this.scroll.targetY = window.scrollY;
        });
        
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (window.innerWidth < 768) {
            this.radius = 130;
            this.perspective = 320;
        } else if (window.innerWidth < 1200) {
            this.radius = 220;
            this.perspective = 420;
        } else {
            this.radius = 280;
            this.perspective = 500;
        }
    }
    
    project(x, y, z, width, height) {
        // Rotate X
        let y1 = y * Math.cos(this.rotationX) - z * Math.sin(this.rotationX);
        let z1 = y * Math.sin(this.rotationX) + z * Math.cos(this.rotationX);
        
        // Rotate Z
        let x1 = x * Math.cos(this.rotationZ) - y1 * Math.sin(this.rotationZ);
        let y2 = x * Math.sin(this.rotationZ) + y1 * Math.cos(this.rotationZ);
        
        let scale = this.perspective / (this.perspective + z1);
        let px = x1 * scale + width / 2;
        let py = y2 * scale + height / 2;
        
        return { x: px, y: py, scale: scale, depth: z1 };
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        this.ctx.clearRect(0, 0, width, height);
        
        // Smooth scroll interpolation
        const prevScrollY = this.scroll.y;
        this.scroll.y += (this.scroll.targetY - this.scroll.y) * 0.08;
        this.scroll.velocity = Math.abs(this.scroll.y - prevScrollY);
        
        // Smooth mouse interpolation
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;
        
        // Rotation speed tied to scroll velocity
        const baseSpeed = 0.004;
        const scrollSpinSpeed = this.scroll.velocity * 0.008;
        this.targetRotationY += baseSpeed + scrollSpinSpeed;
        
        const scrollPositionFactor = this.scroll.y * 0.0015;
        this.rotationY = this.targetRotationY + scrollPositionFactor;
        
        // React to mouse for tilt
        this.rotationX = 0.15 + this.mouse.y * 0.3;
        this.rotationZ = 0.08 + this.mouse.x * 0.2;
        
        // Draw starfield
        this.drawStars(width, height);
        
        // Build a label lookup for fast access
        const labelMap = {};
        this.nodeLabels.forEach(l => {
            labelMap[l.index + '_' + l.strand] = l.text;
        });
        
        // Set of indices that are label nodes (they get drawn bigger)
        const labelIndices = new Set(this.nodeLabels.map(l => l.index));
        
        const renderQueue = [];
        
        for (let i = 0; i < this.nodesCount; i++) {
            const progress = i / (this.nodesCount - 1);
            const y = (progress - 0.5) * height * 1.4;
            
            const twistAngle = progress * Math.PI * 5;
            
            // Strand A
            const angleA = twistAngle + this.rotationY;
            const xa = this.radius * Math.sin(angleA);
            const za = this.radius * Math.cos(angleA);
            
            // Strand B (180 deg offset)
            const angleB = twistAngle + this.rotationY + Math.PI;
            const xb = this.radius * Math.sin(angleB);
            const zb = this.radius * Math.cos(angleB);
            
            // Mouse interaction
            let offsetXa = 0, offsetXb = 0;
            if (this.mouse.active) {
                const mouseWorldX = this.mouse.x * (width / 3);
                const mouseWorldY = this.mouse.y * (height / 2);
                
                const distA = Math.hypot(xa - mouseWorldX, y - mouseWorldY);
                if (distA < 300) {
                    offsetXa = (xa - mouseWorldX) / distA * (300 - distA) * 0.12;
                }
                const distB = Math.hypot(xb - mouseWorldX, y - mouseWorldY);
                if (distB < 300) {
                    offsetXb = (xb - mouseWorldX) / distB * (300 - distB) * 0.12;
                }
            }
            
            const ptA = this.project(xa + offsetXa, y, za, width, height);
            const ptB = this.project(xb + offsetXb, y, zb, width, height);
            
            const isLabelNode = labelIndices.has(i);
            
            // Rung
            renderQueue.push({
                type: 'rung', ptA, ptB,
                depth: (ptA.depth + ptB.depth) / 2,
                isLabelRung: isLabelNode
            });
            
            // Strand A node
            renderQueue.push({
                type: 'node', point: ptA, strand: 'A', depth: ptA.depth,
                isLabelNode: isLabelNode,
                label: labelMap[i + '_A'] || null
            });
            
            // Strand B node
            renderQueue.push({
                type: 'node', point: ptB, strand: 'B', depth: ptB.depth,
                isLabelNode: isLabelNode,
                label: labelMap[i + '_B'] || null
            });
        }
        
        // Sort back-to-front
        renderQueue.sort((a, b) => b.depth - a.depth);
        
        renderQueue.forEach(item => {
            if (item.type === 'rung') {
                this.drawRung(item.ptA, item.ptB, item.isLabelRung);
            } else {
                this.drawNode(item.point, item.strand, item.isLabelNode, item.label);
            }
        });
    }
    
    drawRung(ptA, ptB, isLabelRung) {
        const opacity = Math.max(0.05, 0.5 - (ptA.depth + ptB.depth) / (2 * this.perspective));
        this.ctx.beginPath();
        this.ctx.moveTo(ptA.x, ptA.y);
        this.ctx.lineTo(ptB.x, ptB.y);
        
        const grad = this.ctx.createLinearGradient(ptA.x, ptA.y, ptB.x, ptB.y);
        grad.addColorStop(0, `rgba(245, 158, 11, ${opacity})`);
        grad.addColorStop(0.5, `rgba(52, 211, 153, ${opacity * 0.5})`);
        grad.addColorStop(1, `rgba(251, 113, 133, ${opacity})`);
        
        this.ctx.strokeStyle = grad;
        this.ctx.lineWidth = isLabelRung
            ? Math.max(2, 3 * ((ptA.scale + ptB.scale) / 2))
            : Math.max(1, 2 * ((ptA.scale + ptB.scale) / 2));
        this.ctx.stroke();
    }
    
    drawNode(pt, strand, isLabelNode, label) {
        const opacity = Math.max(0.1, 1 - pt.depth / this.perspective);
        
        // If this is a label node, draw a much bigger glowing orb
        if (isLabelNode) {
            const bigSize = Math.max(8, 28 * pt.scale);
            
            // Outer glow
            const glowGrad = this.ctx.createRadialGradient(pt.x, pt.y, bigSize * 0.3, pt.x, pt.y, bigSize * 2);
            if (strand === 'A') {
                glowGrad.addColorStop(0, `rgba(245, 158, 11, ${opacity * 0.4})`);
                glowGrad.addColorStop(1, `rgba(245, 158, 11, 0)`);
            } else {
                glowGrad.addColorStop(0, `rgba(251, 113, 133, ${opacity * 0.4})`);
                glowGrad.addColorStop(1, `rgba(251, 113, 133, 0)`);
            }
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, bigSize * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = glowGrad;
            this.ctx.fill();
            
            // Solid orb with glass feel
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, bigSize, 0, Math.PI * 2);
            
            const orbGrad = this.ctx.createRadialGradient(
                pt.x - bigSize * 0.3, pt.y - bigSize * 0.3, bigSize * 0.1,
                pt.x, pt.y, bigSize
            );
            if (strand === 'A') {
                orbGrad.addColorStop(0, `rgba(255, 210, 100, ${opacity * 0.9})`);
                orbGrad.addColorStop(0.5, `rgba(245, 158, 11, ${opacity * 0.7})`);
                orbGrad.addColorStop(1, `rgba(180, 100, 0, ${opacity * 0.5})`);
            } else {
                orbGrad.addColorStop(0, `rgba(255, 180, 190, ${opacity * 0.9})`);
                orbGrad.addColorStop(0.5, `rgba(251, 113, 133, ${opacity * 0.7})`);
                orbGrad.addColorStop(1, `rgba(180, 60, 80, ${opacity * 0.5})`);
            }
            
            this.ctx.fillStyle = orbGrad;
            this.ctx.shadowBlur = bigSize * 3;
            this.ctx.shadowColor = strand === 'A'
                ? `rgba(245, 158, 11, ${opacity * 0.6})`
                : `rgba(251, 113, 133, ${opacity * 0.6})`;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // Glass highlight (inner arc)
            this.ctx.beginPath();
            this.ctx.arc(pt.x - bigSize * 0.15, pt.y - bigSize * 0.2, bigSize * 0.55, Math.PI * 1.2, Math.PI * 1.9);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.25})`;
            this.ctx.lineWidth = 1.5 * pt.scale;
            this.ctx.stroke();
            
            // Draw label text inside the ball
            if (label && opacity > 0.25) {
                const fontSize = Math.max(7, Math.floor(11 * pt.scale));
                this.ctx.font = `700 ${fontSize}px 'Outfit', sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, opacity * 1.3)})`;
                this.ctx.shadowBlur = 4;
                this.ctx.shadowColor = `rgba(0, 0, 0, 0.5)`;
                this.ctx.fillText(label, pt.x, pt.y);
                this.ctx.shadowBlur = 0;
            }
        } else {
            // Regular smaller node
            const size = Math.max(2.5, (strand === 'A' ? 8 : 7) * pt.scale);
            
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
            
            this.ctx.shadowBlur = size * 3;
            if (strand === 'A') {
                this.ctx.fillStyle = `rgba(245, 158, 11, ${opacity})`;
                this.ctx.shadowColor = `rgba(245, 158, 11, ${opacity * 0.7})`;
            } else {
                this.ctx.fillStyle = `rgba(251, 113, 133, ${opacity})`;
                this.ctx.shadowColor = `rgba(251, 113, 133, ${opacity * 0.7})`;
            }
            
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }
    
    drawStars(width, height) {
        if (!this.stars) {
            this.stars = [];
            const count = Math.min(120, Math.floor(width / 12));
            for (let i = 0; i < count; i++) {
                this.stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * 1.5,
                    speed: Math.random() * 0.2 + 0.05,
                    opacity: Math.random() * 0.5 + 0.1
                });
            }
        }
        
        this.stars.forEach(star => {
            star.y -= star.speed + this.scroll.velocity * 0.05;
            if (star.y < 0) { star.y = height; star.x = Math.random() * width; }
            if (star.y > height) { star.y = 0; star.x = Math.random() * width; }
            
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.fill();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DNABackground();
});

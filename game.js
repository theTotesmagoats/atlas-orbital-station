// --- RENDER LOOP (WITH HARD LIMITS) ---
            renderLoop() {
                // Defensive Culling to prevent memory leaks/freezes
                if (this.projectiles.length > 50) this.projectiles = this.projectiles.slice(-50);
                if (this.particles.length > 150) this.particles = this.particles.slice(-150);

                const w = this.canvas.width; const h = this.canvas.height;
                const cx = w / 2; const cy = h / 2;

                this.ctx.clearRect(0, 0, w, h); 

                // 1. BACKGROUND LAYER
                this.ctx.globalCompositeOperation = 'lighter';
                this.angleY += 0.003; 
                const cosX = Math.cos(this.angleX), sinX = Math.sin(this.angleX);
                const cosY = Math.cos(this.angleY), sinY = Math.sin(this.angleY);

                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; 
                this.ctx.lineWidth = 1;
                for (let r = this.globeRadius + 50; r <= 350; r += 50) {
                    this.ctx.beginPath();
                    for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
                        const tx = r * Math.cos(angle); const tz = r * Math.sin(angle);
                        const p = this.project3D(tx, 0, tz, cx, cy, cosX, sinX, cosY, sinY);
                        if(angle === 0) this.ctx.moveTo(p.px, p.py); else this.ctx.lineTo(p.px, p.py);
                    }
                    this.ctx.closePath(); this.ctx.stroke();
                }

                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.lineWidth = 1.5;
                this.globeNodes.forEach(n => {
                    const p = this.project3D(n.x, n.y, n.z, cx, cy, cosX, sinX, cosY, sinY);
                    this.ctx.globalAlpha = p.depth > 0 ? 0.3 : 0.8;
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillRect(p.px, p.py, 2, 2);
                });

                const coreGlow = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, this.globeRadius);
                coreGlow.addColorStop(0, 'rgba(255,255,255,0.15)'); 
                coreGlow.addColorStop(1, 'rgba(255,255,255,0)');
                this.ctx.fillStyle = coreGlow;
                this.ctx.beginPath(); this.ctx.arc(cx, cy, this.globeRadius, 0, Math.PI*2); this.ctx.fill();

                // Fix: Scan beam from station position (bottom center) instead of screen center
                if (this.analyzingTarget && this.analyzingTarget.scanStart) {
                    const elapsed = Date.now() - this.analyzingTarget.scanStart;
                    const pct = Math.min(1.0, elapsed / 3000);
                    
                    // Draw scan beam from station position to target
                    const stationX = w / 2; 
                    const stationY = h - 60; // Positioned at bottom of screen
                    
                    this.ctx.strokeStyle = 'rgba(51, 204, 255, 0.6)';
                    this.ctx.lineWidth = 5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(stationX, stationY);
                    this.ctx.lineTo(this.analyzingTarget.screenX, this.analyzingTarget.screenY);
                    this.ctx.stroke();
                    
                    // Draw progress bar above target
                    if (pct < 1.0) {
                        this.ctx.strokeStyle = '#33ccff'; 
                        this.ctx.strokeRect(this.analyzingTarget.screenX - 20, this.analyzingTarget.screenY - 25, 40, 4);
                        this.ctx.fillStyle = '#33ccff'; 
                        this.ctx.fillRect(this.analyzingTarget.screenX - 20, this.analyzingTarget.screenY - 25, 40 * pct, 4);
                    } else {
                        // Scan complete - mark for resolution
                        this.analyzingTarget.scanComplete = true;
                    }
                }

                // 2. FOREGROUND LAYER (Source Over prevents fading)
                this.ctx.globalCompositeOperation = 'source-over';

                // Reverse Loop Targets to prevent splice skipping
                for (let i = this.targets.length - 1; i >= 0; i--) {
                    let tgt = this.targets[i];
                    
                    // Handle completed scans in the loop
                    if (tgt.scanComplete) {
                        this.resolveScan();
                        this.analyzingTarget = null;
                        continue;
                    }
                    
                    if(!tgt.alive) { this.targets.splice(i, 1); continue; }
                    
                    if(!tgt.frozen) tgt.angle += tgt.speed;
                    
                    const tx = tgt.orbitRadius * Math.cos(tgt.angle);
                    const ty = tgt.yOffset; 
                    const tz = tgt.orbitRadius * Math.sin(tgt.angle);

                    const p = this.project3D(tx, ty, tz, cx, cy, cosX, sinX, cosY, sinY);
                    tgt.screenX = p.px; tgt.screenY = p.py; tgt.depth = p.depth;

                    const anchor = this.project3D(tx, 0, tz, cx, cy, cosX, sinX, cosY, sinY);
                    
                    tgt.isOccluded = (p.depth > 0 && Math.hypot(p.px - cx, p.py - cy) < this.globeRadius * 0.8);
                    this.ctx.globalAlpha = tgt.isOccluded ? 0.2 : 1.0;

                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; this.ctx.lineWidth = 1; this.ctx.setLineDash([2, 4]);
                    this.ctx.beginPath(); this.ctx.moveTo(anchor.px, anchor.py); this.ctx.lineTo(p.px, p.py); this.ctx.stroke();
                    this.ctx.setLineDash([]);
                    
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; 
                    this.ctx.beginPath(); this.ctx.arc(anchor.px, anchor.py, 2, 0, Math.PI*2); this.ctx.fill();

                    // Absolute Hex Colors for stable Canvas rendering
                    this.ctx.strokeStyle = tgt.color; this.ctx.fillStyle = tgt.color; this.ctx.lineWidth = 2;
                    const s = 6 * p.scale;
                    
                    this.ctx.beginPath();
                    if (tgt.faction === 'enemy') { 
                        this.ctx.moveTo(p.px, p.py - s*1.5); this.ctx.lineTo(p.px + s, p.py + s); this.ctx.lineTo(p.px - s, p.py + s); 
                    } else if (tgt.faction === 'friendly') { 
                        this.ctx.arc(p.px, p.py, s, 0, Math.PI*2); 
                    } else { 
                        this.ctx.moveTo(p.px, p.py - s*1.2); this.ctx.lineTo(p.px + s*1.2, p.py); this.ctx.lineTo(p.px, p.py + s*1.2); this.ctx.lineTo(p.px - s*1.2, p.py); 
                    }
                    this.ctx.closePath(); 
                    this.ctx.fill(); 
                    this.ctx.stroke();
                    
                    this.ctx.fillStyle = tgt.color; this.ctx.font = "10px Courier"; this.ctx.fillText(tgt.id, p.px + 10, p.py);

                    if (this.lockedTargets.includes(tgt)) {
                        this.ctx.strokeStyle = 'rgba(255,255,255,0.8)'; 
                        const box = 15 * p.scale + Math.sin(Date.now() / 150) * 3;
                        this.ctx.strokeRect(p.px - box, p.py - box, box*2, box*2);
                    }
                }

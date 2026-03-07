// --- OPERATIONS & CUSTOMS ---
            engageTractorBeam() {
                const tgt = this.lockedTargets.find(t => t.faction === 'mystery');
                if (tgt) {
                    this.playSound('tractor');
                    tgt.frozen = true;
                    this.analyzingTarget = tgt;
                    this.analyzingTarget.scanStart = Date.now();
                    this.log(`Tractor beam engaged on ${tgt.id}. Initiating deep scan...`);
                    
                    document.getElementById('btn-tractor').disabled = true;
                    document.getElementById('btn-tractor').innerText = "SCANNING...";
                }
            }

            resolveScan() {
                const tgt = this.analyzingTarget;
                if (!tgt || !tgt.alive) return;

                tgt.frozen = false;
                
                if (Math.random() > 0.4) {
                    tgt.faction = 'enemy';
                    tgt.color = '#ff3333'; 
                    this.playSound('alert');
                    this.log(`WARNING: ${tgt.id} is hostile! Contraband detected!`);
                    
                    this.pendingDecisionTarget = tgt;
                    document.getElementById('ops-default').style.display = 'none';
                    document.getElementById('ops-action').style.display = 'flex';
                    document.getElementById('ops-panel').classList.add('flash-red');
                } else {
                    tgt.faction = 'friendly';
                    tgt.color = '#39ff14'; 
                    this.log(`Scan complete. ${tgt.id} cleared for commerce.`);
                    document.getElementById('btn-tractor').disabled = false;
                    document.getElementById('btn-tractor').innerText = "TRACTOR & ANALYZE";
                }
                
                this.analyzingTarget = null;
                this.updateTargetUI();
            }

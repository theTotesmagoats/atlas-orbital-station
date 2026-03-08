<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tactical Naval Simulator</title>
<style>
    :root {
        --bg: #0a0e17;
        --grid-bg: #111a24;
        --grid-border: #1f3044;
        --text: #4ade80;
        --alert: #ef4444;
        --ship: #3b82f6;
    }
    body {
        background-color: var(--bg);
        color: var(--text);
        font-family: 'Courier New', Courier, monospace;
        margin: 0;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow-x: hidden;
    }
    h1, h2, h3 { margin: 5px 0; text-transform: uppercase; }
    
    .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    .heavy-shake { animation: heavy-shake 0.8s cubic-bezier(.36,.07,.19,.97) both; }
    .flash-red { animation: flash 0.5s ease-in-out 3; }
    
    @keyframes shake {
        10%, 90% { transform: translate3d(-1px, 0, 0); }
        20%, 80% { transform: translate3d(2px, 0, 0); }
        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
        40%, 60% { transform: translate3d(4px, 0, 0); }
    }
    @keyframes heavy-shake {
        10%, 90% { transform: translate3d(-4px, -4px, 0); }
        20%, 80% { transform: translate3d(8px, 8px, 0); }
        30%, 50%, 70% { transform: translate3d(-12px, -12px, 0); }
        40%, 60% { transform: translate3d(12px, 12px, 0); }
    }
    @keyframes flash {
        0%, 100% { background-color: var(--bg); }
        50% { background-color: #4a0000; }
    }
    @keyframes sink {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.1); }
    }

    #game-board {
        display: flex;
        gap: 40px;
        margin-bottom: 20px;
    }
    .grid-container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .grid {
        display: grid;
        grid-template-columns: repeat(12, 30px);
        grid-template-rows: repeat(12, 30px);
        gap: 1px;
        background-color: var(--grid-border);
        border: 2px solid var(--grid-border);
    }
    .cell {
        width: 30px;
        height: 30px;
        background-color: var(--grid-bg);
        cursor: crosshair;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 10px;
    }
    .enemy-cell:hover { background-color: #2a3f54; }
    
    .cell.ship { background-color: var(--ship); }
    .cell.hit { background-color: var(--alert); }
    .cell.miss { background-color: #6b7280; }
    .cell.sunk { animation: sink 2s forwards; background-color: #111; }

    #controls-container {
        display: flex;
        gap: 20px;
        width: 100%;
        max-width: 900px;
        justify-content: space-between;
    }
    .panel {
        border: 1px solid var(--text);
        padding: 15px;
        background: #0d1522;
        flex: 1;
    }
    
    .switch-group {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
    }
    .switch-group label {
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
    }
    #fire-btn {
        width: 100%;
        padding: 15px;
        font-weight: bold;
        font-size: 18px;
        background-color: #333;
        color: #666;
        border: 2px solid #555;
        cursor: not-allowed;
        transition: 0.3s;
    }
    #fire-btn.armed {
        background-color: var(--alert);
        color: white;
        border-color: #fff;
        cursor: pointer;
        box-shadow: 0 0 15px var(--alert);
    }

    #intel-log {
        height: 100px;
        overflow-y: auto;
        background: #000;
        border: 1px solid var(--text);
        padding: 5px;
        font-size: 12px;
    }

    .move-controls {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 5px;
        margin-top: 10px;
    }
    .move-controls button {
        background: #1f3044;
        color: var(--text);
        border: 1px solid var(--text);
        padding: 5px;
        cursor: pointer;
    }
    .move-controls button:hover { background: var(--text); color: var(--bg); }
    #target-coords { font-size: 20px; font-weight: bold; margin-bottom: 10px; color: yellow; }
    
    select { background: #000; color: var(--text); border: 1px solid var(--text); padding: 5px; width: 100%; }
</style>
</head>
<body>

<h1>Tactical Naval Simulator</h1>

<div id="game-board">
    <div class="grid-container">
        <h2>Local Fleet (Player)</h2>
        <div id="player-grid" class="grid"></div>
    </div>
    <div class="grid-container">
        <h2>Hostile Waters (Enemy)</h2>
        <div id="enemy-grid" class="grid"></div>
    </div>
</div>

<div id="controls-container">
    <div class="panel">
        <h3>Weapons Control</h3>
        <div id="target-coords">TARGET: [ NONE ]</div>
        <div class="switch-group">
            <label><input type="checkbox" id="sw-power" onchange="checkArming()"> Power</label>
            <label><input type="checkbox" id="sw-fuel" onchange="checkArming()"> Fuel</label>
            <label><input type="checkbox" id="sw-ign" onchange="checkArming()"> Ignition</label>
        </div>
        <button id="fire-btn" disabled onclick="executeFire()">FIRE WEAPON</button>
    </div>

    <div class="panel">
        <h3>Fleet Command (Move)</h3>
        <select id="ship-selector"></select>
        <div class="move-controls">
            <div></div>
            <button onclick="moveShip(0, -1)">UP 1</button>
            <button onclick="moveShip(0, -2)">UP 2</button>
            <button onclick="moveShip(-1, 0)">LFT 1</button>
            <button onclick="moveShip(0, 0)">HOLD</button>
            <button onclick="moveShip(1, 0)">RGT 1</button>
            <button onclick="moveShip(-2, 0)">LFT 2</button>
            <button onclick="moveShip(0, 1)">DWN 1</button>
            <button onclick="moveShip(0, 2)">DWN 2</button>
            <div></div><div></div><button onclick="moveShip(2, 0)">RGT 2</button>
        </div>
    </div>

    <div class="panel">
        <h3>SIGINT (Delay: 5 Turns)</h3>
        <div id="intel-log">Awaiting intelligence...</div>
    </div>
</div>

<script>
// --- AUDIO ENGINE ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let actx;

function initAudio() {
    if(!actx) actx = new AudioContext();
    if(actx.state === 'suspended') actx.resume();
}

function playTone(freq, type, duration) {
    if(!actx) return;
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, actx.currentTime);
    gain.gain.setValueAtTime(0.1, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + duration);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + duration);
}

function playFire() {
    playTone(100, 'sawtooth', 0.5);
    setTimeout(() => playTone(50, 'square', 0.5), 100);
}

function playMiss() {
    if(!actx) return;
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.frequency.setValueAtTime(400, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, actx.currentTime + 1);
    gain.gain.setValueAtTime(0.1, actx.currentTime);
    gain.gain.linearRampToValueAtTime(0, actx.currentTime + 1);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 1);
}

function playExplosion() {
    if(!actx) return;
    const bufferSize = actx.sampleRate * 2; 
    const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = actx.createBufferSource();
    noise.buffer = buffer;
    const filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    const gain = actx.createGain();
    gain.gain.setValueAtTime(1, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 1.5);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(actx.destination);
    noise.start();
}

function playAlarm() {
    if(!actx) return;
    for(let i=0; i<4; i++) {
        setTimeout(() => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, actx.currentTime);
            gain.gain.setValueAtTime(0.1, actx.currentTime);
            gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start();
            osc.stop(actx.currentTime + 0.3);
        }, i * 400);
    }
}

function playSink() {
    if(!actx) return;
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, actx.currentTime + 2);
    gain.gain.setValueAtTime(0.2, actx.currentTime);
    gain.gain.linearRampToValueAtTime(0, actx.currentTime + 2);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 2);
}

// --- GAME LOGIC ---
const GRID_SIZE = 12;
const SHIP_TYPES = [
    { name: "Carrier", size: 5 },
    { name: "Battleship", size: 4 },
    { name: "Cruiser", size: 3 },
    { name: "Submarine", size: 3 },
    { name: "Destroyer", size: 2 },
    { name: "Frigate", size: 2 },
    { name: "Corvette", size: 2 },
    { name: "Patrol", size: 1 }
];

let playerShips = [];
let enemyShips = [];
let playerBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
let enemyBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
let turn = 0;
let intelHistory = []; // Stores enemy ship coords
let selectedTarget = null;
let gameActive = true;

function createGrid(id, isEnemy) {
    const grid = document.getElementById(id);
    grid.innerHTML = '';
    for(let y=0; y<GRID_SIZE; y++) {
        for(let x=0; x<GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell' + (isEnemy ? ' enemy-cell' : '');
            cell.dataset.x = x;
            cell.dataset.y = y;
            if(isEnemy) {
                cell.onclick = () => selectTarget(x, y);
            }
            grid.appendChild(cell);
        }
    }
}

function isValidPlacement(board, coords) {
    for(let c of coords) {
        if(c.x < 0 || c.x >= GRID_SIZE || c.y < 0 || c.y >= GRID_SIZE) return false;
        if(board[c.y][c.x] !== null) return false;
    }
    return true;
}

function generateShips(board, shipArray) {
    SHIP_TYPES.forEach((type, idx) => {
        let placed = false;
        while(!placed) {
            let x = Math.floor(Math.random() * GRID_SIZE);
            let y = Math.floor(Math.random() * GRID_SIZE);
            let horizontal = Math.random() > 0.5;
            let coords = [];
            for(let i=0; i<type.size; i++) {
                coords.push({ x: x + (horizontal ? i : 0), y: y + (horizontal ? 0 : i), hit: false });
            }
            if(isValidPlacement(board, coords)) {
                coords.forEach(c => board[c.y][c.x] = idx);
                shipArray.push({ id: idx, ...type, coords: coords, sunk: false });
                placed = true;
            }
        }
    });
}

function drawPlayerGrid() {
    const cells = document.getElementById('player-grid').children;
    for(let cell of cells) {
        cell.className = 'cell';
        let x = parseInt(cell.dataset.x);
        let y = parseInt(cell.dataset.y);
        let val = playerBoard[y][x];
        if(val !== null) {
            if(val === 'M') cell.classList.add('miss');
            else if(val === 'H') cell.classList.add('hit');
            else {
                cell.classList.add('ship');
                let ship = playerShips[val];
                let isHit = ship.coords.find(c => c.x === x && c.y === y).hit;
                if(isHit) cell.classList.add('hit');
                if(ship.sunk) cell.classList.add('sunk');
            }
        }
    }
}

function drawEnemyGrid(reveal = false) {
    const cells = document.getElementById('enemy-grid').children;
    for(let cell of cells) {
        cell.className = 'cell enemy-cell';
        let x = parseInt(cell.dataset.x);
        let y = parseInt(cell.dataset.y);
        let val = enemyBoard[y][x];
        if(selectedTarget && selectedTarget.x === x && selectedTarget.y === y) {
            cell.style.border = '2px solid yellow';
        } else {
            cell.style.border = 'none';
        }

        if(val === 'M') cell.classList.add('miss');
        else if(val === 'H') cell.classList.add('hit');
        else if(val !== null && val !== 'M' && val !== 'H') {
            let ship = enemyShips[val];
            let isHit = ship.coords.find(c => c.x === x && c.y === y).hit;
            if(isHit) cell.classList.add('hit');
            if(ship.sunk) cell.classList.add('sunk');
            if(reveal && !isHit && !ship.sunk) cell.classList.add('ship'); // Debug/endgame
        }
    }
}

function selectTarget(x, y) {
    if(!gameActive) return;
    initAudio();
    selectedTarget = {x, y};
    document.getElementById('target-coords').innerText = `TARGET: [ X:${x} Y:${y} ]`;
    drawEnemyGrid();
}

function checkArming() {
    initAudio();
    const p = document.getElementById('sw-power').checked;
    const f = document.getElementById('sw-fuel').checked;
    const i = document.getElementById('sw-ign').checked;
    const btn = document.getElementById('fire-btn');
    if(p && f && i) {
        btn.disabled = false;
        btn.classList.add('armed');
    } else {
        btn.disabled = true;
        btn.classList.remove('armed');
    }
}

function resetFirePanel() {
    document.getElementById('sw-power').checked = false;
    document.getElementById('sw-fuel').checked = false;
    document.getElementById('sw-ign').checked = false;
    checkArming();
    selectedTarget = null;
    document.getElementById('target-coords').innerText = `TARGET: [ NONE ]`;
}

function logMessage(msg) {
    const log = document.getElementById('intel-log');
    log.innerHTML += `<div>[T${turn}] ${msg}</div>`;
    log.scrollTop = log.scrollHeight;
}

function recordIntel() {
    let intel = [];
    enemyShips.forEach(s => {
        if(!s.sunk) s.coords.forEach(c => intel.push(`(${c.x},${c.y})`));
    });
    intelHistory.push(intel);
}

function deliverIntel() {
    if(turn >= 5) {
        let oldIntel = intelHistory[turn - 5];
        logMessage(`SIGINT: Hostile activity detected 5 turns ago at: ${oldIntel.slice(0,4).join(' ')}...`);
    }
}

function moveShip(dx, dy) {
    if(!gameActive) return;
    const sel = document.getElementById('ship-selector');
    const shipId = parseInt(sel.value);
    let ship = playerShips[shipId];
    if(ship.sunk) { alert("Ship is sunk."); return; }
    if(dx === 0 && dy === 0) return; // Hold

    // Clear current position temporarily to check validity
    ship.coords.forEach(c => playerBoard[c.y][c.x] = null);
    
    let newCoords = ship.coords.map(c => ({ x: c.x + dx, y: c.y + dy, hit: c.hit }));
    
    if(isValidPlacement(playerBoard, newCoords)) {
        ship.coords = newCoords;
        logMessage(`${ship.name} repositioned.`);
    } else {
        logMessage(`Invalid maneuver for ${ship.name}.`);
    }
    
    // Rewrite ship to board
    ship.coords.forEach(c => playerBoard[c.y][c.x] = shipId);
    drawPlayerGrid();
}

function executeFire() {
    if(!gameActive || !selectedTarget) return;
    document.body.classList.remove('shake', 'heavy-shake');
    void document.body.offsetWidth; // trigger reflow
    document.body.classList.add('shake');
    playFire();

    setTimeout(() => {
        let x = selectedTarget.x;
        let y = selectedTarget.y;
        let val = enemyBoard[y][x];

        if(val !== null && val !== 'M' && val !== 'H') {
            // HIT
            enemyBoard[y][x] = 'H';
            let ship = enemyShips[val];
            ship.coords.find(c => c.x === x && c.y === y).hit = true;
            playExplosion();
            document.body.classList.remove('shake');
            void document.body.offsetWidth;
            document.body.classList.add('heavy-shake');
            
            if(ship.coords.every(c => c.hit)) {
                ship.sunk = true;
                playSink();
                logMessage(`CONFIRMED: Enemy ${ship.name} destroyed.`);
                checkWinCondition();
            } else {
                logMessage(`HIT at X:${x} Y:${y}`);
            }
        } else if (val === null) {
            enemyBoard[y][x] = 'M';
            playMiss();
            logMessage(`Miss at X:${x} Y:${y}`);
        }

        drawEnemyGrid();
        resetFirePanel();
        
        recordIntel();
        deliverIntel();
        
        if(gameActive) setTimeout(computerTurn, 1000);
    }, 500);
}

function computerTurn() {
    // Basic AI: Random fire, Random move
    playAlarm();
    
    setTimeout(() => {
        let x, y;
        do {
            x = Math.floor(Math.random() * GRID_SIZE);
            y = Math.floor(Math.random() * GRID_SIZE);
        } while (playerBoard[y][x] === 'M' || playerBoard[y][x] === 'H');

        let val = playerBoard[y][x];
        if(val !== null && val !== 'M' && val !== 'H') {
            playerBoard[y][x] = 'H';
            let ship = playerShips[val];
            ship.coords.find(c => c.x === x && c.y === y).hit = true;
            
            document.body.classList.remove('flash-red', 'heavy-shake');
            void document.body.offsetWidth;
            document.body.classList.add('flash-red', 'heavy-shake');
            playExplosion();

            if(ship.coords.every(c => c.hit)) {
                ship.sunk = true;
                playSink();
                logMessage(`CRITICAL: Local ${ship.name} lost.`);
                checkWinCondition();
            }
        } else if (val === null) {
             playerBoard[y][x] = 'M';
             playMiss();
        }

        // Enemy randomly moves 1 ship
        let aliveEnemies = enemyShips.filter(s => !s.sunk);
        if(aliveEnemies.length > 0) {
            let s = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            let dx = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
            let dy = Math.floor(Math.random() * 3) - 1;
            
            s.coords.forEach(c => { if(enemyBoard[c.y][c.x] === s.id) enemyBoard[c.y][c.x] = null; });
            let newCoords = s.coords.map(c => ({ x: c.x + dx, y: c.y + dy, hit: c.hit }));
            if(isValidPlacement(enemyBoard, newCoords)) {
                s.coords = newCoords;
            }
            s.coords.forEach(c => { if(!c.hit) enemyBoard[c.y][c.x] = s.id; else enemyBoard[c.y][c.x] = 'H'; });
        }

        drawPlayerGrid();
        turn++;
    }, 1200);
}

function checkWinCondition() {
    if(enemyShips.every(s => s.sunk)) {
        gameActive = false;
        alert("VICTORY. Enemy fleet eradicated.");
        drawEnemyGrid(true);
    } else if (playerShips.every(s => s.sunk)) {
        gameActive = false;
        alert("DEFEAT. Local fleet destroyed.");
        drawEnemyGrid(true);
    }
}

function initGame() {
    createGrid('player-grid', false);
    createGrid('enemy-grid', true);
    generateShips(playerBoard, playerShips);
    generateShips(enemyBoard, enemyShips);
    drawPlayerGrid();
    drawEnemyGrid();
    
    const sel = document.getElementById('ship-selector');
    playerShips.forEach((s, i) => {
        let opt = document.createElement('option');
        opt.value = i;
        opt.innerText = s.name;
        sel.appendChild(opt);
    });
}

initGame();
</script>
</body>
</html>

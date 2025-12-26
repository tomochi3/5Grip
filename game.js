const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scrollSpacer = document.getElementById('scroll-spacer');
const scoreVal = document.getElementById('score-val');
const deathVal = document.getElementById('death-val');
const endScreen = document.getElementById('end-screen');
const endTitle = document.getElementById('end-title');
const endMsg = document.getElementById('end-msg');
const retryBtn = document.getElementById('retry-btn');
const hintOverlay = document.getElementById('hint-overlay');

// Game State
let deaths = 0;
let isGameOver = false;
let isVictory = false;

// World Params
const WORLD_HEIGHT = 10000; // Total pixels to scroll
const METER_SCALE = 100; // 100px = 1m
const GAME_HEIGHT = WORLD_HEIGHT / METER_SCALE; // 100m total

// Player
const player = {
    x: 0, // Set in resize
    y: 0, // Starts at bottom (screen coords)
    worldY: 0, // Current height in world (0 to WORLD_HEIGHT)
    width: 30,
    height: 30,
    color: '#00d2ff',
    trail: []
};

// Obstacles
let obstacles = [];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2;

    // Ensure we can scroll exactly to WORLD_HEIGHT
    // When scrollY = WORLD_HEIGHT, we want to be at the top.
    // Total document height needs to be (WORLD_HEIGHT + ViewportHeight)
    // Actually, max scrollY = (docHeight - viewportHeight).
    // So if we want max scrollY == WORLD_HEIGHT, then:
    // WORLD_HEIGHT = docHeight - viewportHeight
    // docHeight = WORLD_HEIGHT + viewportHeight
    scrollSpacer.style.height = (WORLD_HEIGHT + window.innerHeight) + 'px';
}

window.addEventListener('resize', resize);
resize();

function initObstacles() {
    obstacles = [];
    const count = 50;
    // Start generating from 5m (500px) onwards
    for (let i = 0; i < count; i++) {
        const type = Math.random() > 0.5 ? 'bird' : 'rock';
        const worldY = 500 + Math.random() * (WORLD_HEIGHT - 1000); // Spread across the climb
        const width = type === 'bird' ? 40 : 50;
        const height = type === 'bird' ? 20 : 50;

        // Generate vertices for rock shape
        const vertices = [];
        if (type === 'rock') {
            const numPoints = 8;
            for (let j = 0; j < numPoints; j++) {
                const angle = (j / numPoints) * Math.PI * 2;
                const r = (Math.min(width, height) / 2) * (0.5 + Math.random() * 0.5);
                vertices.push({
                    x: Math.cos(angle) * r,
                    y: Math.sin(angle) * r
                });
            }
        }

        obstacles.push({
            type: type,
            worldY: worldY,
            x: Math.random() * canvas.width,
            laneY: 0,
            speed: (Math.random() + 0.5) * (Math.random() > 0.5 ? 2 : -2),
            width: width,
            height: height,
            color: type === 'bird' ? '#ff4757' : '#ff6b6b', // Red-ish for dangerous rocks
            vertices: vertices
        });
    }
}

initObstacles();

// Main Loop
function loop() {
    if (isGameOver) return; // Stop updates

    // 1. Update Input / Player Position
    const scrollY = window.scrollY; // 0 at top
    // Map scrollY to "Altitude"
    // Let's say: 1px scroll = 1px altitude.
    player.worldY = scrollY;

    // Update Score
    const altitudeMeters = Math.floor(player.worldY / METER_SCALE);
    scoreVal.innerText = Math.min(altitudeMeters, 100);

    if (scrollY > 100) hintOverlay.style.opacity = 0;

    // Victory Check
    if (altitudeMeters >= 100 && !isVictory) {
        victory();
    }

    // 2. Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. Draw Background Grid (Moving with visual)
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    const gridOffset = player.worldY % 100;
    for (let i = 0; i < canvas.height; i += 100) {
        const y = i + gridOffset; // Move grid down as we go up? 
        // If we climb UP (scrollY increase), the world should move DOWN.
        // Wait, native scroll moves content UP.
        // If I draw at `y - scrollY`, it moves up.
    }
    ctx.stroke();
    ctx.restore();

    // 4. Update & Draw Obstacles
    obstacles.forEach(obs => {
        // Move Obstacle
        obs.x += obs.speed;

        // Wrap around screen
        if (obs.x > canvas.width + 50) obs.x = -50;
        if (obs.x < -50) obs.x = canvas.width + 50;

        // Calculate Screen Y
        // Object is at `obs.worldY`.
        // Camera is at `player.worldY` (which is top of screen + offset?)
        // Let's say player is centered.
        // Actually, since we use native scroll, the canvas is FIXED to viewport.
        // We need to render objects relative to scrollY.
        // Object World Y = 2000. Player Scroll Y = 1900. Object should be 100px from top.
        // ScreenY = obs.worldY - player.worldY + (canvas.height / 2)?
        // NO. Native scroll feeling:
        // Start (0) is top.
        // As we scroll down (scrollY increases), "old" objects move UP and off screen.
        // "New" objects come form bottom?

        // Let's stick to the metaphor:
        // Scroll 0 = Bottom of Mountain (Start).
        // Scroll MAX = Top of Mountain.
        // Screen Y of an object = (WorldHeight - obs.worldY) - (WorldHeight - scrollY - windowHeight)?
        // Too complex.

        // Simple View:
        // Top of doc (scrollY=0) is Start.
        // Bottom of doc is Finish.
        // Object at worldY=100.
        // If scrollY=0, object is at 100px from top of screen.
        // If scrollY=50, object is at 50px from top of screen.
        // ScreenY = obs.worldY - scrollY;

        // Wait, obstacles are static vertically? Yes.
        // They just move left/right.

        const screenY = obs.worldY - scrollY + 200; // +200 offset so we start with some space

        // Draw only if visible
        if (screenY > -100 && screenY < canvas.height + 100) {
            // Draw
            ctx.fillStyle = obs.color;

            if (obs.type === 'rock') {
                // Draw Rock/Hold Shape
                ctx.beginPath();
                const cx = obs.x + obs.width / 2;
                const cy = screenY + obs.height / 2;
                if (obs.vertices && obs.vertices.length > 0) {
                    ctx.moveTo(cx + obs.vertices[0].x, cy + obs.vertices[0].y);
                    for (let j = 1; j < obs.vertices.length; j++) {
                        ctx.lineTo(cx + obs.vertices[j].x, cy + obs.vertices[j].y);
                    }
                } else {
                    ctx.rect(obs.x, screenY, obs.width, obs.height);
                }
                ctx.closePath();
                ctx.fill();

                // Add "depth" effect
                ctx.strokeStyle = "rgba(0,0,0,0.3)";
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                // Draw Bird (Triangle)
                ctx.beginPath();
                ctx.moveTo(obs.x, screenY + obs.height / 2);
                ctx.lineTo(obs.x + obs.width, screenY);
                ctx.lineTo(obs.x + obs.width, screenY + obs.height);
                ctx.closePath();
                ctx.fill();
            }

            // Collision Check
            // Player is fixed on screen?
            // "Player" is the cursor of your progress.
            // Let's visualize Player at a fixed point on screen (e.g. 20% from top? or center?)
            // OR, Player IS the Scroll Viewport?
            // The prompt says "Scroll to avoid".
            // If I just scroll, I move the whole screen.
            // If an obstacle hits the "Player", game over.
            // Where is the Player?
            // Let's put a "Climber" avatar fixed in the center of the screen.
            // But if I scroll, the climber moves through the world.
            // So Collision = (Object intersects Center of Screen).

            const playerScreenX = canvas.width / 2 - 15;
            const playerScreenY = canvas.height / 2 - 15; // Fixed at center

            // Box Box collision
            if (
                obs.x < playerScreenX + 30 &&
                obs.x + obs.width > playerScreenX &&
                screenY < playerScreenY + 30 &&
                screenY + obs.height > playerScreenY
            ) {
                gameOver();
            }
        }
    });

    // 5. Draw Player (Fixed at Center)
    const px = canvas.width / 2;
    const py = canvas.height / 2;

    // Trail
    player.trail.push({ x: px, y: py + (Math.random() - 0.5) * 5 });
    if (player.trail.length > 10) player.trail.shift();

    ctx.fillStyle = '#00d2ff';
    ctx.beginPath();
    ctx.arc(px, py, 15, 0, Math.PI * 2);
    ctx.fill();

    // Draw "Climbing Rope" or visual cue
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(px, py + 15);
    ctx.lineTo(px, canvas.height);
    ctx.stroke();

    requestAnimationFrame(loop);
}

function gameOver() {
    isGameOver = true;
    deaths++;
    deathVal.innerText = deaths;
    endTitle.innerText = "CRUSHED";
    endMsg.innerHTML = "Position: " + scoreVal.innerText + "m<br>Obstacles hit your rope.";
    endScreen.classList.remove('hidden');
    document.getElementById('home-btn-victory').style.display = 'none';
}

function victory() {
    isVictory = true;
    isGameOver = true;
    endTitle.innerText = "SUMMIT!";
    endTitle.style.color = "gold";
    endTitle.style.textShadow = "0 0 20px gold";
    endMsg.innerHTML = "You conquered the wall.<br>Deaths: " + deaths;
    endScreen.classList.remove('hidden');
    retryBtn.innerText = "CLIMB AGAIN";
    document.getElementById('home-btn-victory').style.display = 'inline-block';
}

retryBtn.addEventListener('click', () => {
    isGameOver = false;
    isVictory = false;
    endScreen.classList.add('hidden');
    window.scrollTo(0, 0); // Reset scroll
    initObstacles(); // New random seed
    loop();
});

// Start
loop();

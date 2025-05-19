const TYPES = ['rock', 'paper', 'scissors'];
const ICONS = {
    rock: '🪨',
    paper: '📄',
    scissors: '✂️'
}

const COLORS = {
    rock: '#6c757d',
    paper: '#0d6efd',
    scissors: '#dc3545'
}

const images = {
    rock: new Image(),
    paper: new Image(),
    scissors: new Image()
};

images.rock.src = 'assets/rock.png';
images.paper.src = 'assets/paper.png';
images.scissors.src = 'assets/scissors.png';

let particles = [];
let canvas, ctx;
let radius = 10;
let speed = 1;
let showGrid = false;
let animationId = null;
let isPaused = false;

let fpsEl, lastFrameTime = performance.now(), frames = 0;

class Particle {
    constructor(x, y, vx, vy, type) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
    }

    move() {
        this.x = this.x + this.vx * speed;
        this.y = this.y + this.vy * speed;

        if (this.x < radius || this.x > canvas.width - radius) {
            this.vx *= -1;
        }
        if (this.y < radius || this.y > canvas.height - radius) {
            this.vy *= -1;
        }
    }

    draw() {
        // ctx.font = `${radius * 1.5}px Arial`
        // ctx.textAlign = 'center';
        // ctx.textBaseline = 'middle';
        // ctx.fillText(ICONS[this.type], this.x, this.y);
        let img;
        switch (this.type) {
            case 'rock': img = images.rock; break;
            case 'paper': img = images.paper; break;
            case 'scissors': img = images.scissors; break;
        }
        ctx.drawImage(img, this.x - radius, this.y - radius, 2 * radius, 2 * radius)
    }
}

document.getElementById('speed').addEventListener('change', (e) => {
    speed = parseFloat(e.target.value);
});


function startSimulation() {
    const numParticles = Number.parseInt(document.getElementById("numParticles").value);
    radius = Number.parseInt(document.getElementById("radius").value);
    speed = Number.parseInt(document.getElementById("speed").value);
    // showGrid = Number.parseInt(document.getElementById("showGrid").checked);

    particles = [];
    for (let i = 0; i < numParticles; i++) {
        const x = Math.random() * (canvas.width - 2 * radius) + radius;
        const y = Math.random() * (canvas.height - 2 * radius) + radius;
        const vx = (Math.random() - 0.5) * 2;
        const vy = (Math.random() - 0.5) * 2;
        const type = TYPES[Math.floor(Math.random() * 3)];
        particles.push(new Particle(x, y, vx, vy, type));
    }
    isPaused = false;
    cancelAnimationFrame(animationId);
    animate();
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseBtn').textContent = isPaused ? 'Resume' : 'Pause';
    if (!isPaused) animate();
}

function resetSimulation() {
    cancelAnimationFrame(animationId);
    particles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("rockCount").textContent = '0';
    document.getElementById("paperCount").textContent = '0';
    document.getElementById("scissorCount").textContent = '0';
    document.getElementById("fps").textContent = '0';
    isPaused = false;
    document.getElementById("pauseBtn").textContent = "Pause";
}

function fight(a, b) {
    if (a == b) return 0;
    if ((a == 'rock' && b == 'scissors') || (a == 'scissors' && b == 'paper') || (a == 'paper' && b == 'rock')) return 1;
    return -1;
}

function resCollision(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / dist; //normal
    const ny = dy / dist;

    const tx = -ny; //tangent
    const ty = nx;

    const atang = a.vx * tx + a.vy * ty;
    const btang = b.vx * tx + b.vy * ty;

    const anorm = a.vx * nx + a.vy * ny;
    const bnorm = b.vx * nx + b.vy * ny;

    a.vx = tx * atang + nx * bnorm;
    a.vy = ty * atang + ny * bnorm;

    b.vx = tx * btang + nx * anorm;
    b.vy = ty * btang + ny * anorm;

}

function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 2 * radius) {
                const result = fight(a.type, b.type);
                if (result === 1) b.type = a.type;
                else if (result === -1) a.type = b.type;
                resCollision(a, b);

                const overlap = 2 * radius - dist;
                const adjustX = (dx / dist) * (overlap / 2);
                const adjustY = (dy / dist) * (overlap / 2);
                a.x += adjustX;
                a.y += adjustY;
                b.x -= adjustX;
                b.y -= adjustY;
            }
        }
    }
    particles.forEach(p => p.move());
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (showGrid) {
        ctx.strokeStyle = '#eee';
        const step = 20;
        for (let x = 0; x < canvas.width; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    particles.forEach(p => p.draw());
    const counts = { rock: 0, paper: 0, scissors: 0 };
    particles.forEach(p => counts[p.type]++);
    document.getElementById('rockCount').textContent = counts.rock;
    document.getElementById('paperCount').textContent = counts.paper;
    document.getElementById('scissorCount').textContent = counts.scissors;
}

function updateFPS() {
    frames++;
    const now = performance.now();
    const del = now - lastFrameTime;
    if (del >= 1000) {
        document.getElementById('fps').textContent = frames.toString();
        frames = 0;
        lastFrameTime = now;
    }
}

function animate() {
    if (isPaused) return;
    updateParticles();
    draw();
    updateFPS();
    animationId = requestAnimationFrame(animate);
}

window.onload = () => {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    document.getElementById("startBtn").addEventListener('click', startSimulation);
    document.getElementById("pauseBtn").addEventListener('click', togglePause);
    document.getElementById("resetBtn").addEventListener('click', resetSimulation);
}

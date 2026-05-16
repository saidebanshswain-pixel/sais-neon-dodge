const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player, blocks, particles, trail;
let score, gameOver, started, paused, keys, highScore;
let fade = 1;
let touchX = null;

const bgMusic = document.getElementById("bgMusic");

function init() {
  player = {
    x: 180,
    y: 520,
    width: 40,
    height: 40,
    speed: 0,
    maxSpeed: 7,
    accel: 0.6,
    friction: 0.85
  };

  blocks = [];
  particles = [];
  trail = [];

  score = 0;
  gameOver = false;
  started = false;
  paused = false;
  keys = {};

  highScore = localStorage.getItem("highScore") || 0;

  updateUI();
}

init();


// 🎮 KEYBOARD
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  // START GAME + MUSIC
  if (e.key === "Enter" && !started) {
    startGame();

    bgMusic.volume = 0.3;
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
  }

  if (e.key === "r" && gameOver) restartGame();
  if (e.key === "p") paused = !paused;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});


// 📱 TOUCH START (for mobile + music)
canvas.addEventListener("touchstart", () => {
  if (!started) {
    startGame();

    bgMusic.volume = 0.3;
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
  }
});


// 📱 TOUCH MOVE (control)
canvas.addEventListener("touchmove", (e) => {
  const rect = canvas.getBoundingClientRect();
  touchX = e.touches[0].clientX - rect.left;
});

canvas.addEventListener("touchend", () => {
  touchX = null;
});


// 🚀 START
function startGame() {
  started = true;
  fade = 1;
}

// 🔄 RESTART
function restartGame() {
  init();
  startGame();
}


// 🧱 SPAWN BLOCKS
function spawnBlock() {
  if (!started || gameOver || paused) return;

  const difficulty = 1 + score / 200;

  blocks.push({
    x: Math.random() * (canvas.width - 40),
    y: 0,
    width: 40,
    height: 40,
    speed: 2 + Math.random() * 3 * difficulty
  });
}


// ✨ PARTICLES
function createParticles(x, y) {
  for (let i = 0; i < 15; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 30
    });
  }
}


// 🔄 UPDATE
function update() {
  if (!started || gameOver || paused) return;

  // Movement
  if (keys["ArrowLeft"]) player.speed -= player.accel;
  if (keys["ArrowRight"]) player.speed += player.accel;

  if (touchX !== null) {
    if (touchX < player.x) player.speed -= player.accel;
    if (touchX > player.x) player.speed += player.accel;
  }

  player.speed *= player.friction;

  if (player.speed > player.maxSpeed) player.speed = player.maxSpeed;
  if (player.speed < -player.maxSpeed) player.speed = -player.maxSpeed;

  player.x += player.speed;

  if (player.x < 0) player.x = 0;
  if (player.x > canvas.width - player.width)
    player.x = canvas.width - player.width;

  // Trail
  trail.push({
    x: player.x + player.width / 2,
    y: player.y + player.height / 2
  });
  if (trail.length > 20) trail.shift();

  // Blocks
  blocks.forEach((b, i) => {
    b.y += b.speed;

    if (
      b.x < player.x + player.width &&
      b.x + b.width > player.x &&
      b.y < player.y + player.height &&
      b.y + b.height > player.y
    ) {
      createParticles(player.x, player.y);
      gameOver = true;

      if (score > highScore) {
        localStorage.setItem("highScore", score);
      }
    }

    if (b.y > canvas.height) blocks.splice(i, 1);
  });

  // Particles
  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  });

  score++;
  updateUI();

  if (fade > 0) fade -= 0.02;
}


// 🎨 DRAW
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!started) {
    drawTitleScreen();
    return;
  }

  // Trail
  trail.forEach((t, i) => {
    const alpha = i / trail.length;
    ctx.fillStyle = `rgba(0,255,255,${alpha})`;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00ffff";
    ctx.beginPath();
    ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // Player
  ctx.shadowBlur = 25;
  ctx.shadowColor = "#00ffcc";
  ctx.fillStyle = "#00ffcc";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.shadowBlur = 0;

  // Blocks
  ctx.fillStyle = "#ff3b3b";
  blocks.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  // Particles
  ctx.fillStyle = "orange";
  particles.forEach(p => ctx.fillRect(p.x, p.y, 4, 4));

  // UI overlays
  if (paused) drawText("PAUSED", 150, 300);

  if (gameOver) {
    drawText("GAME OVER", 110, 260);
    drawText("Press R", 140, 300);
  }

  // Fade
  if (fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}


// 🎬 TITLE SCREEN
function drawTitleScreen() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pulse = Math.sin(Date.now() * 0.005) * 5;

  ctx.fillStyle = "#00ffcc";
  ctx.font = `bold ${40 + pulse}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText("NEON DODGE+", canvas.width / 2, 250);

  ctx.font = "18px Arial";
  ctx.fillStyle = "#aaa";
  ctx.fillText("Press ENTER (Sound On 🎧)", canvas.width / 2, 320);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("by Saidebansh Swain", canvas.width / 2, 380);

  ctx.textAlign = "start";
}


// 🧾 UI
function updateUI() {
  document.getElementById("score").innerText = "Score: " + score;
  document.getElementById("highScore").innerText =
    "High: " + (localStorage.getItem("highScore") || 0);
}


// 🖊 TEXT
function drawText(text, x, y) {
  ctx.fillStyle = "white";
  ctx.font = "28px Arial";
  ctx.fillText(text, x, y);
}


// 🔁 LOOP
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

setInterval(spawnBlock, 900);
gameLoop();
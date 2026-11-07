import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createCat } from './cat.js';
import { World } from './world.js';
import { AudioEngine } from './audio.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ================= renderer ================= */
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(11, 4, 20);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.92,
  0.62,
  0.2
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ================= entities ================= */
const audio = new AudioEngine();
const cat = createCat();
scene.add(cat.group);

const world = new World(scene, onWorldEvent);

/* ================= game state ================= */
const GRAVITY = -37;
const JUMP_V = 13.4;
const DOUBLE_V = 11.8;
const BASE_SPEED = 9.6;
const MAX_SPEED = 19.5;
const START_X = 8;

const G = {
  state: 'boot',
  catX: START_X,
  catY: 0,
  vy: 0,
  grounded: true,
  jumps: 0,
  coyote: 0,
  speed: BASE_SPEED,
  elapsed: 0,
  time: 0,
  score: 0,
  displayScore: 0,
  hearts: 3,
  maxHearts: 3,
  nova: 0,
  novaActive: 0,
  invuln: 0,
  combo: 1,
  comboTimer: 0,
  bestCombo: 1,
  coins: 0,
  crystals: 0,
  flashes: 0,
  best: Number(localStorage.getItem('tavi-best') || 0) || 0,
  shake: 0,
  camX: START_X,
  started: false,
  novaReadyNotified: false,
};

let bannerTimer = 0;
let flashTimer = 0;
let lastScoreShown = -1;
let lastNovaShown = -1;
let lastComboShown = -1;
let hudHeartEls = [];

/* ================= UI helpers ================= */
function buildHearts() {
  const wrap = $('hearts');
  wrap.innerHTML = '';
  hudHeartEls = [];
  for (let i = 0; i < G.maxHearts; i++) {
    const s = document.createElement('span');
    s.className = 'heart';
    s.textContent = '♥';
    wrap.appendChild(s);
    hudHeartEls.push(s);
  }
  renderHearts();
}

function renderHearts(pop = false) {
  hudHeartEls.forEach((el, i) => {
    const filled = i < G.hearts;
    el.classList.toggle('empty', !filled);
    if (pop && i === G.hearts) {
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
      setTimeout(() => el.classList.remove('pop'), 320);
    }
  });
}

function showBanner(text, hot = false, duration = 1.7) {
  const el = $('banner');
  el.textContent = text;
  el.classList.toggle('hot', hot);
  el.classList.add('show');
  bannerTimer = duration;
}

function flashScreen(kind = 'hit') {
  const el = $('flash');
  el.style.background = kind === 'nova'
    ? 'radial-gradient(circle at 55% 40%, rgba(255,255,255,0.98), rgba(200,120,255,0.7) 35%, rgba(120,40,255,0.15) 68%, transparent 85%)'
    : kind === 'surge'
      ? 'radial-gradient(circle at 68% 22%, rgba(240,210,255,0.9), rgba(160,70,255,0.45) 45%, transparent 75%)'
      : 'radial-gradient(circle at 50% 50%, rgba(255,90,160,0.55), transparent 72%)';
  el.classList.add('on');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove('on'), kind === 'nova' ? 150 : 90);
}

function updateHud(force = false) {
  const sc = Math.floor(G.score);
  if (force || sc !== lastScoreShown) {
    $('score').textContent = sc.toLocaleString('en-US');
    lastScoreShown = sc;
  }
  const nv = Math.floor(G.nova);
  if (force || nv !== lastNovaShown) {
    $('novaPct').textContent = nv + '%';
    $('novaFill').style.width = nv + '%';
    $('novaFill').parentElement.classList.toggle('full', nv >= 100);
    lastNovaShown = nv;
  }
  const ready = G.nova >= 100 && G.state === 'playing';
  const btn = $('novaBtn');
  btn.disabled = !ready;
  btn.classList.toggle('ready', ready);

  const comboVisible = G.combo > 1 && G.comboTimer > 0 && G.state === 'playing';
  const comboEl = $('combo');
  comboEl.classList.toggle('show', comboVisible);
  if (comboVisible && G.combo !== lastComboShown) {
    comboEl.textContent = 'x' + G.combo;
    comboEl.classList.remove('pulse');
    void comboEl.offsetWidth;
    comboEl.classList.add('pulse');
    lastComboShown = G.combo;
  }
  if (!comboVisible) lastComboShown = -1;

  $('bestHud').textContent = Math.max(G.best, Math.floor(G.score)).toLocaleString('en-US');
}

function addScore(n) {
  G.score += n;
}

function novaGain(n) {
  if (G.nova >= 100) return;
  G.nova = Math.min(100, G.nova + n);
  if (G.nova >= 100 && !G.novaReadyNotified) {
    G.novaReadyNotified = true;
    showBanner('NOVA CHARGED — PRESS F / NOVA', true, 2.2);
    audio.crystal();
    world.shockwave(G.catX, G.catY + 1.1, 0xd070ff, 8);
  }
}

/* ================= world events ================= */
function onWorldEvent(type) {
  if (type === 'surge') {
    if (G.state !== 'playing') return;
    showBanner('SUPERNOVA SURGE · COLLECT THE FLASHES', true, 2.4);
    flashScreen('surge');
    audio.supernova();
    G.shake = Math.max(G.shake, 0.22);
  }
}

/* ================= lifecycle ================= */
function resetRun() {
  world.reset();
  cat.reset();
  cat.group.position.set(START_X, 0, 0);
  G.catX = START_X;
  G.catY = 0;
  G.vy = 0;
  G.grounded = true;
  G.jumps = 0;
  G.coyote = 0;
  G.speed = BASE_SPEED;
  G.elapsed = 0;
  G.time = 0;
  G.score = 0;
  G.displayScore = 0;
  G.hearts = G.maxHearts;
  G.nova = 0;
  G.novaActive = 0;
  G.invuln = 0;
  G.combo = 1;
  G.comboTimer = 0;
  G.bestCombo = 1;
  G.coins = 0;
  G.crystals = 0;
  G.flashes = 0;
  G.shake = 0;
  G.camX = START_X;
  G.novaReadyNotified = false;
  lastScoreShown = -1;
  lastNovaShown = -1;
  lastComboShown = -1;
  renderHearts();
  updateHud(true);
}

function startGame() {
  audio.init();
  audio.startMusic();
  resetRun();
  G.state = 'playing';
  G.started = true;
  $('title').classList.add('hidden');
  $('gameover').classList.add('hidden');
  $('pause').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('boot').classList.add('hidden');
  showBanner('RUN, TAVI, RUN', false, 1.4);
  updateHud(true);
}

function gameOver() {
  if (G.state === 'over') return;
  G.state = 'over';
  audio.stopMusic();
  audio.gameover();
  cat.setInvulnerable(0);
  cat.setNova(0);
  if (navigator.vibrate) navigator.vibrate([40, 60, 90]);
  G.best = Math.max(G.best, Math.floor(G.score));
  localStorage.setItem('tavi-best', String(G.best));
  $('finalScore').textContent = Math.floor(G.score).toLocaleString('en-US');
  $('finalBest').textContent = G.best.toLocaleString('en-US');
  $('finalCoins').textContent = G.coins;
  $('finalCrystals').textContent = G.crystals;
  $('finalFlashes').textContent = G.flashes;
  $('finalDist').textContent = Math.floor(Math.max(0, G.catX - START_X) / 2) + 'm';
  $('finalCombo').textContent = 'x' + G.bestCombo;
  $('hud').classList.add('hidden');
  $('gameover').classList.remove('hidden');
  updateHud(true);
}

function pauseGame() {
  if (G.state !== 'playing') return;
  G.state = 'paused';
  $('pause').classList.remove('hidden');
}

function resumeGame() {
  if (G.state !== 'paused') return;
  G.state = 'playing';
  $('pause').classList.add('hidden');
  last = performance.now();
}

/* ================= gameplay actions ================= */
function doJump() {
  if (G.state === 'title') { startGame(); return; }
  if (G.state !== 'playing') return;
  if (G.grounded || G.coyote > 0) {
    G.vy = JUMP_V;
    G.grounded = false;
    G.coyote = 0;
    G.jumps = 1;
    audio.jump();
    world.burst(G.catX - 0.1, G.catY + 0.15, 0x43f6ff, 5, 0.3);
  } else if (G.jumps < 2) {
    G.vy = DOUBLE_V;
    G.jumps = 2;
    audio.doubleJump();
    world.shockwave(G.catX, G.catY + 0.9, 0x43f6ff, 5);
    world.burst(G.catX, G.catY + 0.6, 0x43f6ff, 9, 0.4);
  }
}

function activateNova() {
  if (G.state !== 'playing' || G.nova < 100) return;
  G.nova = 0;
  G.novaActive = 2.6;
  G.invuln = Math.max(G.invuln, 2.6);
  G.novaReadyNotified = false;
  cat.setNova(1);
  cat.setInvulnerable(0);
  audio.nova();
  flashScreen('nova');
  G.shake = Math.max(G.shake, 0.5);
  if (navigator.vibrate) navigator.vibrate(25);
  const res = world.novaBlast(G.catX);
  const mult = Math.max(1, G.combo);
  const gained = (res.coins * 10 + res.crystals * 60 + res.flashes * 120) * mult;
  G.score += gained;
  G.coins += res.coins;
  G.crystals += res.crystals;
  G.flashes += res.flashes;
  G.nova = 0;
  showBanner('NOVA BURST!  +' + gained.toLocaleString('en-US'), true, 2.0);
  updateHud(true);
}

function damage(kind = 'hit') {
  if (G.invuln > 0 || G.state !== 'playing') return;
  G.hearts -= 1;
  G.invuln = 1.7;
  G.combo = 1;
  G.comboTimer = 0;
  G.shake = Math.max(G.shake, 0.5);
  cat.setInvulnerable(1.7);
  renderHearts(true);
  audio.hit();
  flashScreen('hit');
  if (navigator.vibrate) navigator.vibrate(18);
  if (G.hearts <= 0) {
    gameOver();
  } else {
    showBanner(kind === 'fall' ? 'THE ABYSS PULLS — HOLD ON' : 'OUCH!  ' + G.hearts + ' HEARTS LEFT', false, 1.3);
  }
}

function fallIntoAbyss() {
  if (G.state !== 'playing') return;
  audio.fall();
  G.hearts -= 1;
  G.combo = 1;
  G.comboTimer = 0;
  G.shake = Math.max(G.shake, 0.4);
  renderHearts(true);
  if (G.hearts <= 0) { gameOver(); return; }
  // respawn on the next platform ahead
  let target = null;
  for (const p of world.platforms) {
    if (p.x0 > G.catX + 1 && (!target || p.x0 < target.x0)) target = p;
  }
  if (!target) {
    for (const p of world.platforms) if (!target || p.x0 > target.x0) target = p;
  }
  G.catX = target ? target.x0 + 3 : G.catX + 12;
  G.catY = 0;
  G.vy = 0;
  G.grounded = true;
  G.jumps = 0;
  G.invuln = 2.1;
  cat.setInvulnerable(2.1);
  cat.group.position.set(G.catX, 0, 0);
  audio.crystal();
  flashScreen('surge');
  showBanner('THE ABYSS PULLS — HOLD ON', false, 1.6);
}

/* ================= simulation ================= */
function update(dt) {
  G.time += dt;

  if (G.state === 'playing') {
    G.elapsed += dt;
    G.speed = Math.min(MAX_SPEED, BASE_SPEED + G.elapsed * 0.115);
    const boost = G.novaActive > 0 ? 1.16 : 1;
    const speed = G.speed * boost;

    G.catX += speed * dt;

    if (G.grounded) G.coyote = 0.12;
    else G.coyote = Math.max(0, G.coyote - dt);

    if (!G.grounded) {
      G.vy += GRAVITY * dt;
      G.catY += G.vy * dt;
    }

    const plat = world.platformAt(G.catX);
    if (plat && G.catY <= 0) {
      if (!G.grounded && G.vy < -2) {
        audio.land();
        world.burst(G.catX, 0.12, 0x9a6cff, 6, 0.32);
      }
      G.catY = 0;
      G.vy = 0;
      G.grounded = true;
      G.jumps = 0;
    } else if (!plat && G.grounded) {
      G.grounded = false;
      G.vy = Math.min(G.vy, 0);
      G.coyote = 0.1;
    }

    if (G.catY < -4.2) fallIntoAbyss();

    // collectibles
    const got = world.collectNear(G.catX, G.catY + 1.05, 0.5);
    if (got.length) {
      let gained = 0;
      const kinds = new Set();
      for (const p of got) {
        if (p.kind === 'coin') { G.coins++; gained += 10; novaGain(1.6); }
        else if (p.kind === 'crystal') { G.crystals++; gained += 60; novaGain(7); }
        else { G.flashes++; gained += 120; novaGain(13); }
        kinds.add(p.kind);
      }
      G.combo = Math.min(9, G.combo + Math.min(got.length, 3));
      G.bestCombo = Math.max(G.bestCombo, G.combo);
      G.comboTimer = 2.5;
      addScore(gained * G.combo);
      if (kinds.has('flash')) audio.flash();
      else if (kinds.has('crystal')) audio.crystal();
      else audio.coin();
      updateHud();
    }

    if (G.comboTimer > 0) {
      G.comboTimer -= dt;
      if (G.comboTimer <= 0) G.combo = 1;
    }

    G.invuln = Math.max(0, G.invuln - dt);
    if (G.invuln <= 0) {
      const hit = world.hitObstacle({
        x0: G.catX - 0.36, x1: G.catX + 0.36,
        y0: G.catY + 0.12, y1: G.catY + 1.9,
      });
      if (hit) damage('hit');
    }

    if (G.novaActive > 0) {
      G.novaActive = Math.max(0, G.novaActive - dt);
      cat.setNova(1);
    } else {
      cat.setNova(0);
    }

    G.score += speed * dt * 0.9;
    G.camX = lerp(G.camX, G.catX, 1 - Math.exp(-dt * 7));
  } else {
    G.camX = lerp(G.camX, G.state === 'title' ? START_X : G.catX, 1 - Math.exp(-dt * 4));
  }

  G.shake = Math.max(0, G.shake - dt * 1.7);

  world.update(dt, G.catX, G.camX);

  cat.group.position.set(G.catX, G.catY, 0);
  cat.animate(dt, {
    speed: G.state === 'playing' ? G.speed : 0,
    grounded: G.grounded,
    vy: G.vy,
    mode: G.state === 'playing' ? 'run' : 'idle',
  });

  updateCamera(dt);
  updateHud();

  if (bannerTimer > 0) {
    bannerTimer -= dt;
    if (bannerTimer <= 0) $('banner').classList.remove('show');
  }
}

function updateCamera(dt) {
  const aspect = window.innerWidth / window.innerHeight;
  if (Math.abs(camera.aspect - aspect) > 0.001) {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }
  const targetW = aspect > 1.08 ? 23.5 : 15.5;
  const fovRad = THREE.MathUtils.degToRad(camera.fov / 2);
  const d = clamp((targetW / 2) / (Math.tan(fovRad) * aspect), 13, 58);

  const sx = (Math.random() - 0.5) * G.shake;
  const sy = (Math.random() - 0.5) * G.shake * 0.7;

  camera.position.set(G.camX + 3.1 + sx, 2.3 + d * 0.078 + sy, d);
  camera.lookAt(G.camX + 1.5, 1.55 + G.catY * 0.12, 0);
}

/* ================= input ================= */
function toggleMute() {
  audio.init();
  audio.setMuted(!audio.muted);
  const btn = $('soundBtn');
  btn.classList.toggle('muted', audio.muted);
  btn.textContent = audio.muted ? '✕' : '♪';
  btn.setAttribute('aria-label', audio.muted ? 'Unmute sound' : 'Mute sound');
}

function onKeyDown(e) {
  const k = e.code;
  if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') {
    e.preventDefault();
    if (e.repeat) return;
    if (G.state === 'title') startGame();
    else if (G.state === 'playing') doJump();
    else if (G.state === 'over' && k === 'Space') { /* wait for button */ }
    return;
  }
  if (k === 'Enter') {
    if (G.state === 'title' || G.state === 'over') startGame();
    else if (G.state === 'paused') resumeGame();
    return;
  }
  if (k === 'KeyF' || k === 'ShiftLeft' || k === 'ShiftRight' || k === 'KeyX') {
    e.preventDefault();
    activateNova();
    return;
  }
  if (k === 'KeyP' || k === 'Escape') {
    if (G.state === 'playing') pauseGame();
    else if (G.state === 'paused') resumeGame();
    return;
  }
  if (k === 'KeyM') toggleMute();
}

function bindInputs() {
  window.addEventListener('keydown', onKeyDown, { passive: false });

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (G.state === 'title') startGame();
    else if (G.state === 'playing') doJump();
  });

  const jumpBtn = $('jumpBtn');
  jumpBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    jumpBtn.classList.add('press');
    setTimeout(() => jumpBtn.classList.remove('press'), 130);
    doJump();
  });

  $('novaBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    activateNova();
  });
  $('startBtn').addEventListener('click', startGame);
  $('restartBtn').addEventListener('click', startGame);
  $('resumeBtn').addEventListener('click', resumeGame);
  $('soundBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMute();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.state === 'playing') pauseGame();
  });
  window.addEventListener('blur', () => {
    if (G.state === 'playing') pauseGame();
  });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 120));
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(w, h);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

/* ================= boot / loop ================= */
buildHearts();
cat.group.position.set(START_X, 0, 0);
updateHud(true);
bindInputs();

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, Math.max(0.0001, (now - last) / 1000));
  last = now;
  if (G.state !== 'paused') update(dt);
  composer.render();
}

requestAnimationFrame(loop);

setTimeout(() => {
  $('boot').classList.add('hidden');
  G.state = 'title';
}, 420);

// expose a tiny debug handle for capture/testing
window.__TAVI__ = { G, startGame, doJump, activateNova, pauseGame, resumeGame, world, cat };


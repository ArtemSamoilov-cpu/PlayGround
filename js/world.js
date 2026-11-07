import * as THREE from 'three';
import { makeGlowTexture } from './cat.js';

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export class World {
  constructor(scene, onEvent = () => {}) {
    this.scene = scene;
    this.onEvent = onEvent;
    this.platforms = [];
    this.obstacles = [];
    this.pickups = [];
    this.islands = [];
    this.bursts = [];
    this.rings = [];
    this.genX = 0;
    this.time = 0;
    this.supernovaTimer = 8;
    this.eventPulse = 0;
    this.cleanupTimer = 0;
    this.flashCount = 0;

    this._buildAssets();
    this._buildBackground();
    this._buildDust();
    this.reset();
  }

  /* ================= shared assets ================= */
  _buildAssets() {
    this.glowTex = makeGlowTexture(128, 1);
    this.sparkTex = makeGlowTexture(64, 0.85);

    this.geo = {
      box: new THREE.BoxGeometry(1, 1, 1),
      coin: new THREE.CylinderGeometry(0.42, 0.42, 0.1, 22),
      coinRim: new THREE.TorusGeometry(0.42, 0.055, 6, 24),
      crystal: new THREE.OctahedronGeometry(0.5, 0),
      flash: new THREE.IcosahedronGeometry(0.34, 1),
      spike: new THREE.ConeGeometry(0.58, 1.45, 4),
      orb: new THREE.IcosahedronGeometry(0.56, 1),
      ring: new THREE.TorusGeometry(0.78, 0.045, 6, 28),
      rock: new THREE.DodecahedronGeometry(1, 0),
      isleRing: new THREE.TorusGeometry(1.6, 0.05, 5, 28),
      shock: new THREE.RingGeometry(0.86, 1, 56),
    };

    this.mat = {
      dark: new THREE.MeshStandardMaterial({ color: 0x161028, roughness: 0.72, metalness: 0.55 }),
      slabSide: new THREE.MeshStandardMaterial({ color: 0x0d081a, roughness: 0.9, metalness: 0.3 }),
      cyan: new THREE.MeshStandardMaterial({ color: 0x0b2a30, emissive: 0x43f6ff, emissiveIntensity: 2.4, roughness: 0.3 }),
      purple: new THREE.MeshStandardMaterial({ color: 0x1c0a33, emissive: 0xb44cff, emissiveIntensity: 2.2, roughness: 0.3 }),
      pink: new THREE.MeshStandardMaterial({ color: 0x2a0a1a, emissive: 0xff4fa3, emissiveIntensity: 1.7, roughness: 0.35 }),
      coin: new THREE.MeshStandardMaterial({ color: 0x5a3a08, emissive: 0xffb320, emissiveIntensity: 1.5, roughness: 0.25, metalness: 0.8 }),
      coinRim: new THREE.MeshStandardMaterial({ color: 0x2a1a04, emissive: 0xffd166, emissiveIntensity: 2.0, roughness: 0.2, metalness: 0.9 }),
      crystal: new THREE.MeshStandardMaterial({ color: 0x083a42, emissive: 0x43f6ff, emissiveIntensity: 1.7, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.94 }),
      flash: new THREE.MeshStandardMaterial({ color: 0x2a0a4a, emissive: 0xd070ff, emissiveIntensity: 2.8, roughness: 0.15, metalness: 0.2 }),
      rock: new THREE.MeshStandardMaterial({ color: 0x120a22, roughness: 0.95, metalness: 0.2, emissive: 0x2a0a4a, emissiveIntensity: 0.35 }),
      star: new THREE.PointsMaterial({ color: 0xc7a6ff, size: 0.5, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, map: this.glowTex, sizeAttenuation: true }),
      dust: new THREE.PointsMaterial({ color: 0xb44cff, size: 0.16, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, map: this.glowTex, sizeAttenuation: true }),
    };

    this.spriteMat = {
      coin: new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffc247, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }),
      crystal: new THREE.SpriteMaterial({ map: this.glowTex, color: 0x43f6ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }),
      flash: new THREE.SpriteMaterial({ map: this.glowTex, color: 0xd070ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }),
    };

    this.spikeTipMat = new THREE.MeshBasicMaterial({ color: 0xff4fa3 });
  }

  /* ================= background ================= */
  _buildBackground() {
    const s = this.scene;

    s.fog = new THREE.FogExp2(0x0a0218, 0.0072);
    s.background = new THREE.Color(0x070111);

    const hemi = new THREE.HemisphereLight(0x9a6cff, 0x08020f, 1.15);
    s.add(hemi);
    const key = new THREE.DirectionalLight(0xbfe8ff, 2.0);
    key.position.set(6, 12, 8);
    s.add(key);
    const rim = new THREE.DirectionalLight(0xb44cff, 1.6);
    rim.position.set(-8, 5, -6);
    s.add(rim);
    this.catLight = new THREE.PointLight(0xb44cff, 34, 26, 2);
    this.catLight.position.set(0, 4, 5);
    s.add(this.catLight);

    // gradient backdrop
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#05010d');
    g.addColorStop(0.45, '#0e0322');
    g.addColorStop(0.78, '#1c0738');
    g.addColorStop(1, '#0a0218');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);
    const glow = ctx.createRadialGradient(730, 130, 0, 730, 130, 300);
    glow.addColorStop(0, 'rgba(196, 107, 255, 0.55)');
    glow.addColorStop(0.3, 'rgba(150, 60, 255, 0.22)');
    glow.addColorStop(1, 'rgba(90, 20, 160, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1024, 512);
    const neb = ctx.createRadialGradient(280, 250, 0, 280, 250, 380);
    neb.addColorStop(0, 'rgba(30, 120, 180, 0.18)');
    neb.addColorStop(1, 'rgba(20, 60, 120, 0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, 1024, 512);
    const bgTex = new THREE.CanvasTexture(canvas);
    bgTex.colorSpace = THREE.SRGBColorSpace;
    const bgMat = new THREE.MeshBasicMaterial({ map: bgTex, depthWrite: false, fog: false });
    this.backdrop = new THREE.Mesh(new THREE.PlaneGeometry(320, 160), bgMat);
    this.backdrop.position.set(0, 34, -150);
    s.add(this.backdrop);

    // stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(340 * 3);
    for (let i = 0; i < 340; i++) {
      starPos[i * 3] = rand(-120, 120);
      starPos[i * 3 + 1] = rand(-6, 70);
      starPos[i * 3 + 2] = rand(-130, -25);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.stars = new THREE.Points(starGeo, this.mat.star);
    s.add(this.stars);

    // supernova
    const sn = new THREE.Group();
    sn.position.set(18, 21, -92);
    this.supernova = sn;
    s.add(sn);

    this.snCore = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0xffe9ff })
    );
    sn.add(this.snCore);

    this.snHalo = new THREE.Mesh(
      new THREE.SphereGeometry(2.9, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0xc56bff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    sn.add(this.snHalo);

    const snGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.glowTex, color: 0xa64cff, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    snGlow.scale.set(34, 34, 1);
    sn.add(snGlow);
    this.snGlow = snGlow;

    for (let i = 0; i < 2; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(4.6 + i * 1.5, 0.1, 6, 64),
        new THREE.MeshBasicMaterial({ color: i ? 0x43f6ff : 0xd9a6ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      ring.rotation.x = rand(0.6, 1.2);
      ring.rotation.y = rand(-0.4, 0.4);
      sn.add(ring);
      if (i === 0) this.snRing = ring;
      else this.snRing2 = ring;
    }

    const sparkGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(70 * 3);
    for (let i = 0; i < 70; i++) {
      const r = rand(2.6, 7.2);
      const a = rand(0, Math.PI * 2);
      sp[i * 3] = Math.cos(a) * r;
      sp[i * 3 + 1] = Math.sin(a) * r * 0.8;
      sp[i * 3 + 2] = rand(-1.5, 1.5);
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.snSparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
      color: 0xe0b6ff, size: 0.5, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, map: this.glowTex,
    }));
    sn.add(this.snSparks);

    // shockwave pool
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(this.geo.shock, new THREE.MeshBasicMaterial({
        color: 0xd070ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide,
      }));
      m.visible = false;
      m.renderOrder = 5;
      s.add(m);
      this.rings.push({ mesh: m, life: 0, max: 1, scale: 1, speed: 1 });
    }

    // burst particle pool
    for (let i = 0; i < 70; i++) {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this.sparkTex, color: 0xffffff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      m.visible = false;
      m.renderOrder = 6;
      s.add(m);
      this.bursts.push({ sprite: m, life: 0, max: 1, vx: 0, vy: 0, vz: 0, size: 1 });
    }
  }

  _buildDust() {
    const geo = new THREE.BufferGeometry();
    const n = 150;
    const pos = new Float32Array(n * 3);
    this.dustData = [];
    for (let i = 0; i < n; i++) {
      const d = { x: rand(-22, 22), y: rand(-5, 14), z: rand(-8, 9), s: rand(0.2, 1.1), p: rand(0, 6.28) };
      this.dustData.push(d);
      pos[i * 3] = d.x; pos[i * 3 + 1] = d.y; pos[i * 3 + 2] = d.z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(geo, this.mat.dust);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  /* ================= lifecycle ================= */
  reset() {
    for (const p of this.platforms) this.scene.remove(p.group);
    for (const o of this.obstacles) this.scene.remove(o.group);
    for (const p of this.pickups) this.scene.remove(p.group);
    for (const d of this.islands) this.scene.remove(d.group);
    this.platforms.length = 0;
    this.obstacles.length = 0;
    this.pickups.length = 0;
    this.islands.length = 0;
    for (const b of this.bursts) { b.life = 0; b.sprite.visible = false; }
    for (const r of this.rings) { r.life = 0; r.mesh.visible = false; }

    this.time = 0;
    this.genX = 0;
    this.supernovaTimer = 7.5;
    this.eventPulse = 0;
    this.flashCount = 0;

    this.addPlatform(-18, 34);
    for (let i = 0; i < 7; i++) this.addPickup(12 + i * 2.2, 1.15 + Math.sin((i / 6) * Math.PI) * 0.9, 'coin');
    this.addPickup(28, 2.3, 'crystal');
    this.addPickup(32, 1.2, 'coin');
    this.genX = 34;
    this.generateAhead(170);
    this.updateBackground(8);
  }

  /* ================= generation ================= */
  addPlatform(x0, x1) {
    const w = x1 - x0;
    const group = new THREE.Group();
    group.position.x = (x0 + x1) / 2;

    const slab = new THREE.Mesh(this.geo.box, this.mat.dark);
    slab.scale.set(w, 1.9, 6);
    slab.position.y = -0.95;
    group.add(slab);

    const front = new THREE.Mesh(this.geo.box, this.mat.cyan);
    front.scale.set(w, 0.09, 0.14);
    front.position.set(0, 0.03, 2.98);
    group.add(front);

    const back = new THREE.Mesh(this.geo.box, this.mat.purple);
    back.scale.set(w, 0.07, 0.1);
    back.position.set(0, 0.03, -2.98);
    group.add(back);

    for (let x = -w / 2 + 1.6; x < w / 2 - 0.8; x += 4.2) {
      const dash = new THREE.Mesh(this.geo.box, Math.random() < 0.5 ? this.mat.purple : this.mat.cyan);
      dash.scale.set(1.7, 0.055, 0.07);
      dash.position.set(x, -0.32, 2.99);
      group.add(dash);
    }

    for (let x = -w / 2 + 3; x < w / 2 - 1; x += rand(6, 9)) {
      const h = rand(4, 11);
      for (const z of [-2.5, 2.5]) {
        const strut = new THREE.Mesh(this.geo.box, this.mat.purple);
        strut.scale.set(0.09, h, 0.09);
        strut.position.set(x, -1.9 - h / 2, z);
        group.add(strut);
      }
      const cap = new THREE.Mesh(this.geo.box, this.mat.cyan);
      cap.scale.set(0.5, 0.08, 5.2);
      cap.position.set(x, -1.9, 0);
      group.add(cap);
    }

    this.scene.add(group);
    this.platforms.push({ x0, x1, group });
  }

  addIsland(x) {
    const group = new THREE.Group();
    group.position.set(x + rand(-7, 7), rand(-3, 8), rand(-20, -40));
    const n = 1 + ((Math.random() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const rock = new THREE.Mesh(this.geo.rock, this.mat.rock);
      const s = rand(1.2, 3.4);
      rock.scale.set(s, s * rand(0.5, 0.9), s * rand(0.7, 1.1));
      rock.position.set(rand(-4, 4), rand(-2, 2), rand(-2, 2));
      rock.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      group.add(rock);
      if (Math.random() < 0.7) {
        const ring = new THREE.Mesh(this.geo.isleRing, this.mat.purple);
        ring.scale.setScalar(s * 0.55);
        ring.position.copy(rock.position);
        ring.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
        group.add(ring);
      }
    }
    const shard = new THREE.Mesh(this.geo.crystal, this.mat.crystal);
    shard.scale.setScalar(rand(0.35, 0.7));
    shard.position.set(rand(-2, 2), rand(1, 3), 0);
    group.add(shard);

    this.scene.add(group);
    this.islands.push({ group, x });
  }

  addSpikes(x, count = 1) {
    const group = new THREE.Group();
    group.position.x = x;
    for (let i = 0; i < count; i++) {
      const spike = new THREE.Mesh(this.geo.spike, this.mat.pink);
      spike.position.set((i - (count - 1) / 2) * 1.05, 0.72, 0);
      spike.rotation.y = rand(0, Math.PI);
      group.add(spike);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), this.spikeTipMat);
      tip.position.set(spike.position.x, 1.44, 0);
      group.add(tip);
    }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.glowTex, color: 0xff4fa3, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.set(3.4, 1.5, 1);
    glow.position.y = 0.55;
    group.add(glow);

    this.scene.add(group);
    this.obstacles.push({ type: 'spike', x, w: count * 1.05 + 0.25, group, dead: false, baseY: 0, phase: 0 });
  }

  addOrb(x, y) {
    const group = new THREE.Group();
    group.position.set(x, y, 0);
    const orb = new THREE.Mesh(this.geo.orb, this.mat.dark);
    orb.material = this.mat.rock;
    group.add(orb);
    const ring = new THREE.Mesh(this.geo.ring, this.mat.pink);
    ring.rotation.x = 0.7;
    group.add(ring);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), this.spikeTipMat);
    group.add(core);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.glowTex, color: 0xff4fa3, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.set(2.6, 2.6, 1);
    group.add(glow);

    this.scene.add(group);
    this.obstacles.push({ type: 'orb', x, y, w: 1.15, group, dead: false, baseY: y, phase: rand(0, 6.28) });
  }

  addPickup(x, y, kind) {
    const group = new THREE.Group();
    group.position.set(x, y, 0);
    let mesh;

    if (kind === 'coin') {
      const spin = new THREE.Group();
      const coin = new THREE.Mesh(this.geo.coin, this.mat.coin);
      coin.rotation.x = Math.PI / 2;
      spin.add(coin);
      const rim = new THREE.Mesh(this.geo.coinRim, this.mat.coinRim);
      spin.add(rim);
      group.add(spin);
      mesh = spin;
    } else if (kind === 'crystal') {
      mesh = new THREE.Mesh(this.geo.crystal, this.mat.crystal);
      group.add(mesh);
    } else {
      mesh = new THREE.Mesh(this.geo.flash, this.mat.flash);
      group.add(mesh);
      const ring = new THREE.Mesh(this.geo.ring, this.mat.purple);
      ring.scale.setScalar(1.25);
      group.add(ring);
    }

    const glow = new THREE.Sprite(this.spriteMat[kind]);
    glow.scale.setScalar(kind === 'flash' ? 3.6 : kind === 'crystal' ? 2.4 : 1.8);
    group.add(glow);

    this.scene.add(group);
    this.pickups.push({
      kind, group, mesh, glow, alive: true,
      baseY: y, phase: rand(0, 6.28),
      radius: kind === 'flash' ? 0.85 : kind === 'crystal' ? 0.7 : 0.55,
    });
  }

  generateAhead(untilX) {
    let guard = 0;
    while (this.genX < untilX && guard++ < 40) this.generateChunk();
  }

  generateChunk() {
    const difficulty = clamp(this.genX / 1200, 0, 1);
    const len = rand(17, 25) - difficulty * 4;
    const x0 = this.genX;
    const x1 = x0 + len;
    this.addPlatform(x0, x1);

    if (Math.random() < 0.88) {
      const n = Math.floor(rand(5, 9));
      const high = Math.random() < 0.52;
      for (let i = 0; i < n; i++) {
        const t = n > 1 ? i / (n - 1) : 0.5;
        const cx = x0 + 2.5 + (len - 5) * t;
        const cy = high ? 2.0 + Math.sin(t * Math.PI) * 1.9 : 1.15 + Math.sin(t * Math.PI) * 0.7;
        this.addPickup(cx, cy, 'coin');
      }
    }

    if (Math.random() < 0.62) {
      this.addPickup(rand(x0 + 4, x1 - 4), rand(1.9, 3.2), 'crystal');
    }

    const hazards = Math.random() < 0.8 ? 1 : 2;
    const used = [];
    for (let i = 0; i < hazards; i++) {
      const hx = rand(x0 + 5.5, x1 - 4.5);
      if (used.some((u) => Math.abs(u - hx) < 4.5)) continue;
      used.push(hx);
      if (Math.random() < 0.62) this.addSpikes(hx, Math.random() < 0.35 ? 2 : 1);
      else this.addOrb(hx, rand(2.25, 2.7));
    }

    if (Math.random() < 0.6) this.addIsland(x0 + len / 2);

    const gap = rand(2.7, 3.6 + difficulty * 2.0);
    this.genX = x1 + gap;
  }

  spawnFlashTrail(catX) {
    const count = 7;
    const start = catX + 24;
    for (let i = 0; i < count; i++) {
      const x = start + i * 3.05 + rand(-0.35, 0.35);
      const y = 1.9 + Math.sin((i / (count - 1)) * Math.PI) * 3.0;
      if (!this.platformAt(x) && y < 2.7) continue;
      this.addPickup(x, y, 'flash');
    }
    this.addPickup(catX + 19, 2.1, 'crystal');
    this.addPickup(catX + 41, 2.6, 'crystal');
    this.eventPulse = 1;
  }

  /* ================= simulation ================= */
  platformAt(x) {
    for (const p of this.platforms) if (x >= p.x0 && x <= p.x1) return p;
    return null;
  }

  update(dt, catX, camX) {
    this.time += dt;
    this.generateAhead(catX + 150);
    this.updateBackground(camX);
    this._updatePickups(dt);
    this._updateObstacles(dt);
    this._updateAmbient(dt);
    this._updateEffects(dt);
    this._updateSupernova(dt, catX);

    this.cleanupTimer -= dt;
    if (this.cleanupTimer <= 0) {
      this.cleanupTimer = 0.5;
      this._cleanup(catX);
    }
  }

  updateBackground(camX) {
    this.backdrop.position.x = camX;
    this.stars.position.x = camX;
    this.supernova.position.x = camX + 19;
    this.dust.position.x = camX;
    this.catLight.position.x = camX + 2;
  }

  _updatePickups(dt) {
    for (const p of this.pickups) {
      p.phase += dt;
      p.group.position.y = p.baseY + Math.sin(this.time * 2.2 + p.phase) * 0.13;
      const gb = p.kind === 'flash' ? 3.6 : p.kind === 'crystal' ? 2.4 : 1.8;
      p.glow.scale.setScalar(gb * (1 + Math.sin(this.time * 4 + p.phase) * 0.09));
      if (p.kind === 'coin') {
        p.mesh.rotation.y += dt * 3.4;
        p.mesh.rotation.z = Math.sin(this.time * 1.5 + p.phase) * 0.12;
      } else if (p.kind === 'crystal') {
        p.mesh.rotation.y += dt * 1.9;
        p.mesh.rotation.x += dt * 0.7;
      } else {
        p.mesh.rotation.y += dt * 1.4;
        p.mesh.rotation.x += dt * 0.9;
        p.group.scale.setScalar(1 + Math.sin(this.time * 6 + p.phase) * 0.07);
      }
    }
  }

  _updateObstacles(dt) {
    for (const o of this.obstacles) {
      if (o.dead) continue;
      if (o.type === 'orb') {
        o.group.position.y = o.baseY + Math.sin(this.time * 2.4 + o.phase) * 0.18;
        o.group.rotation.y += dt * 0.9;
      }
    }
  }

  _updateAmbient(dt) {
    const pos = this.dust.geometry.attributes.position;
    for (let i = 0; i < this.dustData.length; i++) {
      const d = this.dustData[i];
      d.y += dt * (0.22 + d.s * 0.5);
      d.x += Math.sin(this.time * 0.6 + d.p) * dt * 0.16;
      if (d.y > 15) { d.y = -6; d.x = rand(-22, 22); }
      pos.array[i * 3] = d.x;
      pos.array[i * 3 + 1] = d.y;
      pos.array[i * 3 + 2] = d.z;
    }
    pos.needsUpdate = true;
    this.mat.star.opacity = 0.62 + Math.sin(this.time * 1.6) * 0.1;
  }

  _updateSupernova(dt, catX) {
    this.supernovaTimer -= dt;
    if (this.supernovaTimer <= 0) {
      this.supernovaTimer = rand(13, 18);
      this.spawnFlashTrail(catX);
      this.shockwave(catX + 14, 7.5, 0xd070ff, 30);
      this.onEvent('surge');
    }

    this.eventPulse = Math.max(0, this.eventPulse - dt * 0.55);
    const e = this.eventPulse;
    const pulse = 1 + Math.sin(this.time * 1.5) * 0.035 + e * 0.22;
    this.snCore.scale.setScalar(pulse);
    this.snHalo.scale.setScalar(pulse * (1 + Math.sin(this.time * 2.7) * 0.04));
    this.snGlow.material.opacity = 0.72 + Math.sin(this.time * 1.2) * 0.08 + e * 0.2;
    this.snRing.rotation.z += dt * 0.35;
    this.snRing2.rotation.z -= dt * 0.22;
    this.snSparks.rotation.z += dt * 0.12;
    this.snSparks.material.opacity = 0.6 + e * 0.4;
  }

  _updateEffects(dt) {
    for (const b of this.bursts) {
      if (b.life <= 0) continue;
      b.life -= dt;
      if (b.life <= 0) { b.sprite.visible = false; continue; }
      const t = b.life / b.max;
      b.sprite.position.x += b.vx * dt;
      b.sprite.position.y += b.vy * dt;
      b.sprite.position.z += b.vz * dt;
      b.vy -= dt * 3.2;
      b.sprite.material.opacity = t * t * 0.95;
      b.sprite.scale.setScalar(b.size * (0.35 + (1 - t) * 0.9));
    }
    for (const r of this.rings) {
      if (r.life <= 0) continue;
      r.life -= dt;
      if (r.life <= 0) { r.mesh.visible = false; continue; }
      const t = 1 - r.life / r.max;
      r.mesh.scale.setScalar(0.35 + t * r.scale);
      r.mesh.material.opacity = (1 - t) * 0.75;
    }
  }

  _cleanup(catX) {
    const cut = catX - 34;
    this.platforms = this.platforms.filter((p) => {
      if (p.x1 < cut) { this.scene.remove(p.group); return false; }
      return true;
    });
    this.obstacles = this.obstacles.filter((o) => {
      if (o.dead || o.x < cut) { if (o.group.parent) this.scene.remove(o.group); return false; }
      return true;
    });
    this.pickups = this.pickups.filter((p) => {
      if (!p.alive || p.group.position.x < cut) { if (p.group.parent) this.scene.remove(p.group); return false; }
      return true;
    });
    this.islands = this.islands.filter((d) => {
      if (d.x < catX - 60) { this.scene.remove(d.group); return false; }
      return true;
    });
  }

  collectNear(x, y, radius = 0.9) {
    const got = [];
    for (const p of this.pickups) {
      if (!p.alive) continue;
      const dx = p.group.position.x - x;
      const dy = p.group.position.y - y;
      const rr = radius + p.radius;
      if (dx * dx + dy * dy < rr * rr) {
        p.alive = false;
        this.scene.remove(p.group);
        const color = p.kind === 'coin' ? 0xffc247 : p.kind === 'crystal' ? 0x43f6ff : 0xd070ff;
        this.burst(p.group.position.x, p.group.position.y, color, p.kind === 'flash' ? 14 : 7, p.kind === 'flash' ? 0.55 : 0.4);
        got.push(p);
      }
    }
    if (got.length) this.pickups = this.pickups.filter((p) => p.alive);
    return got;
  }

  hitObstacle(box) {
    for (const o of this.obstacles) {
      if (o.dead) continue;
      const ox0 = o.x - o.w / 2;
      const ox1 = o.x + o.w / 2;
      const oy0 = o.type === 'spike' ? 0 : o.group.position.y - 0.58;
      const oy1 = o.type === 'spike' ? 1.42 : o.group.position.y + 0.58;
      if (box.x1 > ox0 && box.x0 < ox1 && box.y1 > oy0 && box.y0 < oy1) {
        o.dead = true;
        this.scene.remove(o.group);
        this.burst(o.x, o.type === 'spike' ? 0.8 : o.group.position.y, 0xff4fa3, 16, 0.6);
        return o;
      }
    }
    return null;
  }

  novaBlast(catX) {
    const result = { coins: 0, crystals: 0, flashes: 0, obstacles: 0 };
    const far = catX + 72;
    for (const o of this.obstacles) {
      if (o.dead || o.x < catX - 4 || o.x > far) continue;
      o.dead = true;
      this.scene.remove(o.group);
      this.burst(o.x, 1.1, 0xd070ff, 10, 0.6);
      result.obstacles++;
    }
    for (const p of this.pickups) {
      if (!p.alive) continue;
      const px = p.group.position.x;
      if (px < catX - 2 || px > far) continue;
      p.alive = false;
      this.scene.remove(p.group);
      if (p.kind === 'coin') result.coins++;
      else if (p.kind === 'crystal') result.crystals++;
      else result.flashes++;
      const color = p.kind === 'coin' ? 0xffc247 : p.kind === 'crystal' ? 0x43f6ff : 0xd070ff;
      this.burst(px, p.group.position.y, color, 6, 0.5);
    }
    this.obstacles = this.obstacles.filter((o) => !o.dead);
    this.pickups = this.pickups.filter((p) => p.alive);
    this.shockwave(catX + 6, 1.5, 0xd070ff, 36);
    this.shockwave(catX + 26, 2.0, 0x43f6ff, 30);
    this.shockwave(catX + 48, 2.5, 0xff4fa3, 24);
    return result;
  }

  burst(x, y, color, count = 8, size = 0.45) {
    for (let i = 0; i < count; i++) {
      const b = this.bursts.find((v) => v.life <= 0);
      if (!b) return;
      const a = rand(0, Math.PI * 2);
      const sp = rand(1.2, 5.5);
      b.sprite.position.set(x, y, rand(-0.6, 0.6));
      b.sprite.material.color.setHex(color);
      b.sprite.material.opacity = 1;
      b.sprite.visible = true;
      b.sprite.scale.setScalar(size);
      b.vx = Math.cos(a) * sp;
      b.vy = Math.sin(a) * sp + 1.2;
      b.vz = rand(-1, 1);
      b.max = rand(0.4, 0.8);
      b.life = b.max;
      b.size = size * rand(0.7, 1.5);
    }
  }

  shockwave(x, y, color, scale = 26) {
    const r = this.rings.find((v) => v.life <= 0);
    if (!r) return;
    r.mesh.position.set(x, y, 1.5);
    r.mesh.material.color.setHex(color);
    r.mesh.material.opacity = 0.75;
    r.mesh.visible = true;
    r.mesh.scale.setScalar(0.35);
    r.max = 0.85;
    r.life = r.max;
    r.scale = scale;
  }
}

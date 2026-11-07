import * as THREE from 'three';

/* TAVI — a neon-purple cat built entirely from primitives. Faces +X, feet at y=0. */
export function createCat() {
  const root = new THREE.Group();
  const rig = new THREE.Group();
  root.add(rig);

  const mats = [];
  const mat = (opts) => {
    const m = new THREE.MeshStandardMaterial(opts);
    mats.push(m);
    return m;
  };

  const fur = mat({
    color: 0x2a1444,
    emissive: 0x6a1fd0,
    emissiveIntensity: 0.42,
    roughness: 0.38,
    metalness: 0.45,
  });
  const furLight = mat({
    color: 0x3b2158,
    emissive: 0x8a3cff,
    emissiveIntensity: 0.28,
    roughness: 0.5,
    metalness: 0.3,
  });
  const neon = mat({
    color: 0x12051f,
    emissive: 0xb44cff,
    emissiveIntensity: 1.9,
    roughness: 0.3,
    metalness: 0.2,
  });
  const cyanMat = mat({
    color: 0x0a2b30,
    emissive: 0x43f6ff,
    emissiveIntensity: 2.2,
    roughness: 0.2,
    metalness: 0.2,
  });
  const pinkMat = mat({
    color: 0x300a1c,
    emissive: 0xff4fa3,
    emissiveIntensity: 1.6,
    roughness: 0.4,
  });

  /* ---------- body ---------- */
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 1.02, 0);
  rig.add(bodyGroup);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.5, 22, 16), fur);
  torso.scale.set(1.14, 0.86, 0.84);
  torso.castShadow = true;
  bodyGroup.add(torso);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), furLight);
  chest.position.set(0.36, -0.02, 0);
  chest.scale.set(0.9, 0.85, 0.8);
  bodyGroup.add(chest);

  // glowing ribs / fur stripes
  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.34 - i * 0.03, 0.022, 6, 18), neon);
    stripe.position.set(-0.18 + i * 0.16, 0.14 - i * 0.02, 0);
    stripe.rotation.y = Math.PI / 2;
    stripe.scale.set(1, 0.9, 0.72);
    bodyGroup.add(stripe);
  }

  /* ---------- head ---------- */
  const headGroup = new THREE.Group();
  headGroup.position.set(0.5, 1.6, 0);
  rig.add(headGroup);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.4, 22, 16), fur);
  skull.scale.set(1, 0.94, 0.92);
  headGroup.add(skull);

  const cheeks = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), furLight);
  cheeks.position.set(0.2, -0.1, 0);
  cheeks.scale.set(0.95, 0.72, 0.92);
  headGroup.add(cheeks);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), furLight);
  muzzle.position.set(0.34, -0.11, 0);
  muzzle.scale.set(0.9, 0.7, 0.85);
  headGroup.add(muzzle);

  const nose = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), pinkMat);
  nose.position.set(0.48, -0.08, 0);
  headGroup.add(nose);

  // ears
  const ears = [];
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(-0.02, 0.33, side * 0.2);
    ear.rotation.z = -0.16;
    ear.rotation.x = side * 0.22;
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.36, 5), fur);
    outer.position.y = 0.12;
    ear.add(outer);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 5), neon);
    inner.position.set(0.02, 0.11, 0);
    inner.scale.set(0.9, 0.9, 0.7);
    ear.add(inner);
    headGroup.add(ear);
    ears.push(ear);
  }

  // eyes
  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(0.31, 0.08, side * 0.155);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.078, 12, 10), cyanMat);
    ball.scale.set(0.55, 1.05, 0.9);
    eye.add(ball);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glint.position.set(0.05, 0.025, 0.02);
    eye.add(glint);
    headGroup.add(eye);
    eyes.push(eye);
  }

  // whiskers
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.004, 0.44, 4), cyanMat);
      w.position.set(0.5, -0.11 + i * 0.07, side * 0.12);
      w.rotation.z = Math.PI / 2 + (i === 0 ? 0.18 : -0.14);
      w.rotation.x = side * (0.35 + i * 0.12);
      headGroup.add(w);
    }
  }

  // collar + gem
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.045, 8, 22), neon);
  collar.position.set(0.27, 1.26, 0);
  collar.rotation.y = Math.PI / 2;
  rig.add(collar);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), cyanMat);
  gem.position.set(0.34, 1.13, 0);
  rig.add(gem);

  /* ---------- legs ---------- */
  const legs = [];
  const legDefs = [
    { x: 0.28, z: 0.2, front: true },
    { x: 0.28, z: -0.2, front: true },
    { x: -0.26, z: 0.2, front: false },
    { x: -0.26, z: -0.2, front: false },
  ];
  for (const def of legDefs) {
    const pivot = new THREE.Group();
    pivot.position.set(def.x, 0.86, def.z);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.4, 5, 10), fur);
    upper.position.y = -0.29;
    upper.castShadow = true;
    pivot.add(upper);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 9), furLight);
    paw.position.set(0.045, -0.6, 0);
    paw.scale.set(1.3, 0.72, 1);
    pivot.add(paw);
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), neon);
    toe.position.set(0.16, -0.63, 0);
    toe.scale.set(1, 0.7, 1.3);
    pivot.add(toe);
    rig.add(pivot);
    legs.push({ pivot, front: def.front, side: Math.sign(def.z) });
  }

  /* ---------- tail ---------- */
  const tailBase = new THREE.Vector3(-0.52, 1.16, 0);
  const tail = [];
  const tailCount = 9;
  for (let i = 0; i < tailCount; i++) {
    const r = 0.125 * (1 - i / (tailCount + 2)) + 0.045;
    const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), i % 3 === 2 ? neon : fur);
    rig.add(seg);
    tail.push(seg);
  }
  const tailTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), cyanMat);
  rig.add(tailTip);

  /* ---------- aura ---------- */
  const auraTex = makeGlowTexture(128, 0.9);
  const auraMat = new THREE.SpriteMaterial({
    map: auraTex,
    color: 0xb44cff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const aura = new THREE.Sprite(auraMat);
  aura.scale.set(4.2, 4.2, 1);
  aura.position.set(0.1, 1.1, 0);
  rig.add(aura);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  shadow.scale.set(1.15, 0.7, 1);
  root.add(shadow);

  const state = {
    time: 0,
    phase: 0,
    blink: 0,
    blinkTimer: 2,
    invuln: 0,
    nova: 0,
    visTimer: 0,
  };

  function animate(dt, info) {
    const { speed = 0, grounded = true, vy = 0, mode = 'run' } = info;
    state.time += dt;
    state.phase += dt * (grounded ? 7.5 + speed * 0.5 : 3);

    // body bob & lean
    const runBob = grounded ? Math.abs(Math.sin(state.phase * 1.05)) * 0.055 : 0;
    const breathe = Math.sin(state.time * 1.7) * 0.012;
    rig.position.y = runBob + breathe + (mode === 'idle' ? Math.sin(state.time * 1.4) * 0.02 : 0);
    rig.rotation.z = THREE.MathUtils.lerp(rig.rotation.z, grounded ? -0.035 - Math.min(speed, 18) * 0.002 : -0.12, dt * 8);
    rig.rotation.x = Math.sin(state.phase * 0.5) * 0.02;

    // legs
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const off = i % 2 === 0 ? 0 : Math.PI;
      let target;
      if (grounded) {
        target = Math.sin(state.phase + off + (leg.front ? 0 : Math.PI)) * 0.8;
        if (mode === 'idle') target *= 0.12;
      } else {
        target = leg.front ? -0.95 : 0.75;
      }
      leg.pivot.rotation.z = THREE.MathUtils.lerp(leg.pivot.rotation.z, target, dt * 14);
      leg.pivot.rotation.x = leg.side * 0.06;
    }

    // head
    const headBob = grounded ? Math.sin(state.phase * 2) * 0.022 : 0;
    headGroup.position.y = 1.6 + headBob;
    headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, grounded ? 0.05 : 0.2, dt * 6);
    headGroup.rotation.y = Math.sin(state.time * 0.9) * 0.05;

    // ears twitch
    for (let i = 0; i < ears.length; i++) {
      const twitch = Math.max(0, Math.sin(state.time * 1.3 + i * 2.1) - 0.96) * 2.2;
      ears[i].rotation.x = (i === 0 ? -1 : 1) * (0.22 + twitch * 0.4);
    }

    // blink
    state.blinkTimer -= dt;
    if (state.blinkTimer <= 0) {
      state.blinkTimer = 2.4 + Math.random() * 3.2;
      state.blink = 1;
    }
    state.blink = Math.max(0, state.blink - dt * 7);
    const eyeScale = 1 - state.blink * 0.88;
    for (const eye of eyes) eye.scale.y = Math.max(0.1, eyeScale);

    // tail
    for (let i = 0; i < tail.length; i++) {
      const t = i / (tail.length - 1);
      const wave = Math.sin(state.time * 2.4 - i * 0.52) * (0.05 + t * 0.06);
      const lift = grounded ? 0.12 : 0.26;
      tail[i].position.set(
        tailBase.x - t * 0.86 + Math.sin(state.time * 1.2 + i * 0.4) * 0.02,
        tailBase.y + t * (0.5 + lift) + wave - t * t * 0.12,
        Math.sin(state.time * 1.8 - i * 0.45) * (0.04 + t * 0.12)
      );
    }
    const last = tail[tail.length - 1];
    tailTip.position.set(last.position.x - 0.1, last.position.y + 0.06, last.position.z);

    // invulnerability blink
    if (state.invuln > 0) {
      state.invuln -= dt;
      state.visTimer += dt;
      rig.visible = Math.floor(state.visTimer * 14) % 2 === 0;
    } else {
      rig.visible = true;
      state.visTimer = 0;
    }

    // nova aura
    auraMat.opacity = THREE.MathUtils.lerp(auraMat.opacity, state.nova, dt * 5);
    aura.scale.setScalar(4.2 + Math.sin(state.time * 9) * 0.2 + state.nova * 1.8);
    gem.rotation.y += dt * 2.5;
    gem.scale.setScalar(1 + Math.sin(state.time * 4) * 0.12);
  }

  return {
    group: root,
    parts: { rig, bodyGroup, headGroup, legs, tail, tailTip, aura, shadow, ears, eyes, gem, mats },
    animate,
    setInvulnerable(seconds) { state.invuln = seconds; },
    setNova(v) { state.nova = v; },
    reset() {
      state.invuln = 0;
      state.nova = 0;
      state.phase = 0;
      rig.visible = true;
      auraMat.opacity = 0;
    },
  };
}

export function makeGlowTexture(size = 128, power = 0.9) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, `rgba(255,255,255,${0.85 * power})`);
  g.addColorStop(0.42, `rgba(255,255,255,${0.3 * power})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Tiny WebAudio synth — no external audio files. */
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.music = null;
    this.arpTimer = null;
    this.noiseBuf = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);

    const len = this.ctx.sampleRate * 0.5;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.05);
  }

  _tone({ freq = 440, end = freq, dur = 0.15, type = 'sine', gain = 0.15, delay = 0, filter = 0, attack = 0.005 }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (filter) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(filter, t);
      node.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  _noise({ dur = 0.2, gain = 0.2, freq = 1200, q = 0.8, delay = 0 }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.25), t + dur);
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.03);
  }

  jump() {
    this._tone({ freq: 280, end: 620, dur: 0.16, type: 'triangle', gain: 0.16 });
    this._tone({ freq: 560, end: 940, dur: 0.1, type: 'sine', gain: 0.05, delay: 0.02 });
  }

  doubleJump() {
    this._tone({ freq: 480, end: 1080, dur: 0.18, type: 'square', gain: 0.07 });
    this._noise({ dur: 0.16, gain: 0.06, freq: 2600 });
  }

  land() {
    this._tone({ freq: 140, end: 70, dur: 0.1, type: 'sine', gain: 0.12 });
    this._noise({ dur: 0.09, gain: 0.05, freq: 500 });
  }

  coin() {
    this._tone({ freq: 1046, end: 1568, dur: 0.09, type: 'square', gain: 0.05 });
    this._tone({ freq: 1568, end: 2093, dur: 0.1, type: 'sine', gain: 0.05, delay: 0.045 });
  }

  crystal() {
    const notes = [784, 1046, 1318, 1568];
    notes.forEach((n, i) => this._tone({ freq: n, end: n * 1.01, dur: 0.16, type: 'triangle', gain: 0.06, delay: i * 0.035 }));
  }

  flash() {
    this._tone({ freq: 330, end: 990, dur: 0.24, type: 'sawtooth', gain: 0.06, filter: 2400 });
    this._tone({ freq: 1320, end: 2640, dur: 0.3, type: 'sine', gain: 0.05, delay: 0.04 });
    this._noise({ dur: 0.2, gain: 0.05, freq: 3200 });
  }

  hit() {
    this._tone({ freq: 180, end: 48, dur: 0.35, type: 'sawtooth', gain: 0.18, filter: 900 });
    this._noise({ dur: 0.28, gain: 0.16, freq: 900, q: 0.5 });
  }

  fall() {
    this._tone({ freq: 420, end: 60, dur: 0.7, type: 'triangle', gain: 0.12 });
  }

  nova() {
    this._tone({ freq: 110, end: 880, dur: 0.7, type: 'sawtooth', gain: 0.14, filter: 3200 });
    this._tone({ freq: 220, end: 1760, dur: 0.8, type: 'sine', gain: 0.1 });
    this._noise({ dur: 0.8, gain: 0.18, freq: 2400, q: 0.4 });
    [523, 659, 784, 1046].forEach((n, i) => this._tone({ freq: n, end: n, dur: 0.4, type: 'triangle', gain: 0.06, delay: 0.25 + i * 0.07 }));
  }

  supernova() {
    this._tone({ freq: 80, end: 240, dur: 1.1, type: 'sine', gain: 0.12 });
    this._tone({ freq: 1200, end: 300, dur: 0.9, type: 'sawtooth', gain: 0.05, filter: 3000 });
    this._noise({ dur: 0.9, gain: 0.08, freq: 4200 });
  }

  gameover() {
    [392, 330, 262, 196].forEach((n, i) => this._tone({ freq: n, end: n * 0.98, dur: 0.5, type: 'triangle', gain: 0.1, delay: i * 0.18 }));
  }

  startMusic() {
    if (!this.ctx || this.music) return;
    const t = this.ctx.currentTime;
    const bus = this.ctx.createGain();
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.exponentialRampToValueAtTime(0.055, t + 2.0);
    bus.connect(this.master);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 1.2;
    filter.connect(bus);

    const oscs = [];
    for (const [freq, detune, type] of [[55, -7, 'sawtooth'], [82.4, 6, 'sawtooth'], [110, 3, 'triangle']]) {
      const o = this.ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = this.ctx.createGain();
      g.gain.value = 0.3;
      o.connect(g);
      g.connect(filter);
      o.start();
      oscs.push(o);
    }

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    oscs.push(lfo);

    this.music = { bus, oscs, filter };

    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    let step = 0;
    this.arpTimer = setInterval(() => {
      if (!this.ctx || this.muted) return;
      if (Math.random() < 0.3) return;
      const n = scale[(step * 3 + ((Math.random() * 3) | 0)) % scale.length];
      step++;
      this._tone({ freq: n, end: n, dur: 0.7, type: 'sine', gain: 0.025, attack: 0.03 });
      if (Math.random() < 0.25) this._tone({ freq: n * 2, end: n * 2, dur: 0.5, type: 'triangle', gain: 0.012 });
    }, 460);
  }

  stopMusic() {
    if (!this.ctx || !this.music) return;
    const t = this.ctx.currentTime;
    const { bus, oscs } = this.music;
    bus.gain.cancelScheduledValues(t);
    bus.gain.setTargetAtTime(0.0001, t, 0.25);
    setTimeout(() => {
      for (const o of oscs) { try { o.stop(); } catch {} }
      try { bus.disconnect(); } catch {}
    }, 900);
    this.music = null;
    if (this.arpTimer) { clearInterval(this.arpTimer); this.arpTimer = null; }
  }
}

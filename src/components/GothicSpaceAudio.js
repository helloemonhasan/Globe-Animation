// Dark Gothic Space Ambient Soundscape Synthesizer
// Generates continuous, evolving cinematic dark ambient music using Web Audio API
// No external assets required. Resonant sub-drones, cathedral space pads, cosmic wind, and gothic bell chimes.

class GothicSpaceMusic {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.reverbBus = null;
    this.padGain = null;
    this.droneGain = null;
    this.windGain = null;
    this.chimeGain = null;

    // Active nodes & intervals
    this.droneNodes = [];
    this.padOscillators = [];
    this.padFilter = null;
    this.padLfo = null;
    this.windSource = null;
    this.chimeTimer = null;
    this.progressionTimer = null;

    // Musical scale & chord progression (D Gothic Minor)
    // Chords: Dm9 -> Bbmaj7#11 -> Gm9 -> Asusc4 / D
    this.chordProgression = [
      [73.42, 110.0, 174.61, 261.63, 293.66],  // Dm (D2, A2, F3, C4, D4)
      [58.27, 87.31, 146.83, 220.0, 293.66],   // Bbmaj7 (Bb1, F2, D3, A3, D4)
      [49.0, 73.42, 116.54, 174.61, 220.0],    // Gm9 (G1, D2, Bb2, F3, A3)
      [55.0, 82.41, 130.81, 196.0, 261.63]     // Am7 (A1, E2, C3, G3, C4)
    ];
    this.currentChordIndex = 0;

    // Interactive state
    this.dragModulation = 0;
    this.isFocused = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  start() {
    this.init();
    if (!this.ctx) return;
    if (this.isPlaying) return;

    const t = this.ctx.currentTime;

    // 1. Master Output
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, t);
    this.masterGain.gain.exponentialRampToValueAtTime(0.35, t + 2.0); // smooth cinematic fade-in
    this.masterGain.connect(this.ctx.destination);

    // 2. Space Delay & Gothic Reverb Simulation Network
    this.setupSpaceDelay();

    // 3. Deep Void Sub-Drone (D1 36.7Hz + A1 55Hz detuned)
    this.setupSubDrone();

    // 4. Evolving Cathedral Minor Pad Synth
    this.setupGothicPads();

    // 5. Cosmic Stellar Wind & Interstellar Noise
    this.setupCosmicWind();

    // 6. Haunting Celestial Gothic Bell Chimes
    this.startChimeScheduler();

    this.isPlaying = true;
  }

  stop() {
    if (!this.isPlaying || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Smooth fade out
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    }

    if (this.chimeTimer) clearInterval(this.chimeTimer);
    if (this.progressionTimer) clearInterval(this.progressionTimer);

    setTimeout(() => {
      this.cleanupNodes();
      this.isPlaying = false;
    }, 1300);
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  // --- 2. Space Delay Network ---
  setupSpaceDelay() {
    const delayL = this.ctx.createDelay();
    delayL.delayTime.value = 0.48; // 480ms

    const delayR = this.ctx.createDelay();
    delayR.delayTime.value = 0.72; // 720ms

    const feedbackL = this.ctx.createGain();
    feedbackL.gain.value = 0.52;

    const feedbackR = this.ctx.createGain();
    feedbackR.gain.value = 0.48;

    // Gothic dark damping filter (attenuates high frequencies in echoes)
    const dampFilter = this.ctx.createBiquadFilter();
    dampFilter.type = 'lowpass';
    dampFilter.frequency.value = 1400;

    const delayPannerL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (delayPannerL) delayPannerL.pan.value = -0.6;
    const delayPannerR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (delayPannerR) delayPannerR.pan.value = 0.6;

    // Cross-feedback loop
    delayL.connect(dampFilter);
    dampFilter.connect(feedbackL);
    feedbackL.connect(delayR);

    delayR.connect(feedbackR);
    feedbackR.connect(delayL);

    this.reverbBus = this.ctx.createGain();
    this.reverbBus.gain.value = 0.45;

    this.reverbBus.connect(delayL);
    this.reverbBus.connect(delayR);

    if (delayPannerL && delayPannerR) {
      delayL.connect(delayPannerL);
      delayPannerL.connect(this.masterGain);
      delayR.connect(delayPannerR);
      delayPannerR.connect(this.masterGain);
    } else {
      delayL.connect(this.masterGain);
      delayR.connect(this.masterGain);
    }
  }

  // --- 3. Sub Void Drone ---
  setupSubDrone() {
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.38;
    this.droneGain.connect(this.masterGain);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.value = 160;
    subFilter.connect(this.droneGain);

    // D1 (36.7Hz) + detuned sub
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 36.71;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 55.0; // A1
    osc2.detune.value = -6; // slow gothic acoustic beating

    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 73.42; // D2
    osc3.detune.value = 4;

    osc1.connect(subFilter);
    osc2.connect(subFilter);
    osc3.connect(subFilter);

    osc1.start();
    osc2.start();
    osc3.start();

    this.droneNodes.push(osc1, osc2, osc3, subFilter, this.droneGain);
  }

  // --- 4. Gothic Minor Cathedral Pads ---
  setupGothicPads() {
    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0.22;
    this.padGain.connect(this.masterGain);
    this.padGain.connect(this.reverbBus);

    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 450;
    this.padFilter.Q.value = 3.5;
    this.padFilter.connect(this.padGain);

    // Slow LFO for filter breathing (period ~16s)
    this.padLfo = this.ctx.createOscillator();
    this.padLfo.frequency.value = 0.06; // very slow gothic swell
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 180;
    this.padLfo.connect(lfoGain);
    lfoGain.connect(this.padFilter.frequency);
    this.padLfo.start();

    // Create pad voice oscillators
    const initialChord = this.chordProgression[0];
    this.padOscillators = initialChord.map((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.detune.value = (i - 2) * 4.5; // lush celestial detuning

      const voiceGain = this.ctx.createGain();
      voiceGain.gain.value = 0.16;
      osc.connect(voiceGain);
      voiceGain.connect(this.padFilter);
      osc.start();
      return { osc, voiceGain };
    });

    // Schedule slow evolving chord shifts every 14 seconds
    this.progressionTimer = setInterval(() => {
      this.advanceChordProgression();
    }, 14000);
  }

  advanceChordProgression() {
    if (!this.isPlaying || !this.ctx) return;
    this.currentChordIndex = (this.currentChordIndex + 1) % this.chordProgression.length;
    const targetChord = this.chordProgression[this.currentChordIndex];
    const t = this.ctx.currentTime;

    this.padOscillators.forEach((voice, i) => {
      const newFreq = targetChord[i] || targetChord[targetChord.length - 1];
      // Slow exponential pitch transition like a shifting gothic pipe organ
      voice.osc.frequency.setTargetAtTime(newFreq, t, 3.2);
    });
  }

  // --- 5. Cosmic Stellar Wind & Deep Space Breath ---
  setupCosmicWind() {
    const bufferSize = this.ctx.sampleRate * 5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    // Generate pinkish/cosmic low-frequency noise
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.12;
    }

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 680;
    windFilter.Q.value = 4.0;

    // Wind LFO for celestial whistling
    const windLfo = this.ctx.createOscillator();
    windLfo.frequency.value = 0.08;
    const windLfoGain = this.ctx.createGain();
    windLfoGain.gain.value = 280;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start();

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.08;

    this.windSource.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    this.windGain.connect(this.reverbBus);

    this.windSource.start();
  }

  // --- 6. Celestial Gothic Bell Chimes ---
  startChimeScheduler() {
    const bellNotes = [293.66, 349.23, 440.0, 523.25, 587.33, 698.46, 880.0]; // D4 to A5

    const triggerRandomChime = () => {
      if (!this.isPlaying || !this.ctx) return;
      const note = bellNotes[Math.floor(Math.random() * bellNotes.length)];
      this.playGothicBell(note);

      // Random interval between 5.5s and 11s
      const nextDelay = 5500 + Math.random() * 5500;
      this.chimeTimer = setTimeout(triggerRandomChime, nextDelay);
    };

    this.chimeTimer = setTimeout(triggerRandomChime, 3000);
  }

  playGothicBell(freq) {
    if (!this.ctx || !this.isPlaying) return;
    const t = this.ctx.currentTime;

    // Fundamental Bell Sine
    const bellOsc = this.ctx.createOscillator();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(freq, t);

    // Harmonic bell overtone (e.g. 2.76x minor metallic overtone)
    const overtoneOsc = this.ctx.createOscillator();
    overtoneOsc.type = 'sine';
    overtoneOsc.frequency.setValueAtTime(freq * 2.76, t);

    const bellGain = this.ctx.createGain();
    bellGain.gain.setValueAtTime(0.0001, t);
    bellGain.gain.linearRampToValueAtTime(0.07, t + 0.008); // sharp chime attack
    bellGain.gain.exponentialRampToValueAtTime(0.0001, t + 4.8); // 4.8s ringing decay

    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.0001, t);
    overtoneGain.gain.linearRampToValueAtTime(0.025, t + 0.006);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

    bellOsc.connect(bellGain);
    overtoneOsc.connect(overtoneGain);

    bellGain.connect(this.reverbBus);
    bellGain.connect(this.masterGain);
    overtoneGain.connect(this.reverbBus);

    bellOsc.start(t);
    overtoneOsc.start(t);
    bellOsc.stop(t + 5.0);
    overtoneOsc.stop(t + 5.0);
  }

  // --- Dynamic Interactivity ---
  onDrag(velocity) {
    if (!this.ctx || !this.padFilter) return;
    const t = this.ctx.currentTime;
    const speed = Math.min(Math.hypot(velocity.x, velocity.y) * 120, 400);

    // Dragging opens high frequencies and swells cosmic wind
    this.padFilter.frequency.setTargetAtTime(450 + speed, t, 0.2);
    if (this.windGain) {
      this.windGain.gain.setTargetAtTime(0.08 + speed * 0.0003, t, 0.2);
    }
  }

  onFocus(isFocused) {
    this.isFocused = isFocused;
    if (!this.ctx || !this.padFilter) return;
    const t = this.ctx.currentTime;

    if (isFocused) {
      // Intimate dark focus: lower pad highs, boost sub-drone
      this.padFilter.frequency.setTargetAtTime(320, t, 0.8);
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.48, t, 0.6);
      this.playGothicBell(220.0); // low gothic cue
    } else {
      this.padFilter.frequency.setTargetAtTime(450, t, 1.2);
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.38, t, 0.8);
    }
  }

  cleanupNodes() {
    try {
      this.droneNodes.forEach((n) => {
        n.stop?.();
        n.disconnect?.();
      });
      this.droneNodes = [];

      this.padOscillators.forEach((vo) => {
        vo.osc.stop?.();
        vo.osc.disconnect?.();
        vo.voiceGain.disconnect?.();
      });
      this.padOscillators = [];

      this.padLfo?.stop();
      this.padLfo?.disconnect();
      this.padFilter?.disconnect();
      this.padGain?.disconnect();

      this.windSource?.stop();
      this.windSource?.disconnect();
      this.windGain?.disconnect();

      this.masterGain?.disconnect();
    } catch {}
  }
}

export const gothicSpaceMusic = new GothicSpaceMusic();

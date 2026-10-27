// Web Audio API - Hệ thống âm thanh tổng hợp kinh dị procedural chuyên nghiệp
class HorrorAudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.masterVolume = 0.8;
    this.masterGain = null;
    this.rainGain = null;
    this.droneGain = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.startAmbientDrone();
    this.startRainAndWind();
    this.isInitialized = true;
  }

  setVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (!this.isMuted && this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }
    return !this.isMuted;
  }

  // Tiếng drone u ám kinh dị (Atmospheric Horror Sub-drone)
  startAmbientDrone() {
    if (!this.ctx) return;

    // Oscillator 1: Tần số siêu trầm
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(46.25, this.ctx.currentTime); // F#1

    // Filter cắt tần số cao
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(95, this.ctx.currentTime);

    // Oscillator 2: Tạo beat bất an lệch pha
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(47.8, this.ctx.currentTime);

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    osc1.start();
    osc2.start();
  }

  // Mưa đêm và gió rít xuyên qua rặng thông
  startRainAndWind() {
    if (!this.ctx) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink noise cho mưa
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(650, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    rainSource.start();
  }

  // TIẾNG THỞ DỐC KINH HOÀNG (Realistic Panicked Breathing for VHS Video)
  playPantingBreath(isInhale = true) {
    if (!this.ctx || this.isMuted) return;
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isInhale ? 850 : 600, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.42);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }

  // TIẾNG GẦM RÚ QUÁI VẬT HUYẾT QUỶ (Bloodcurdling Monster Scream)
  playMonsterShriek() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Carrier
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(320, now);
    carrier.frequency.exponentialRampToValueAtTime(780, now + 0.4);
    carrier.frequency.exponentialRampToValueAtTime(140, now + 1.6);

    // Modulator FM
    const mod = this.ctx.createOscillator();
    mod.type = 'square';
    mod.frequency.setValueAtTime(85, now);
    mod.frequency.linearRampToValueAtTime(190, now + 0.8);

    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(450, now);
    modGain.gain.linearRampToValueAtTime(150, now + 1.4);

    mod.connect(carrier.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + 1.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.65, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    carrier.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    carrier.start(now);
    mod.start(now);
    carrier.stop(now + 1.85);
    mod.stop(now + 1.85);
  }

  // Tiếng quái vật trườn gầm gừ cổ họng (Throat clicking / gargle)
  playMonsterSnarl() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(52, now);
    osc.frequency.linearRampToValueAtTime(38, now + 0.9);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, now);
    filter.Q.setValueAtTime(5.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.95);
  }

  // Tiếng cắn xé móng vuốt / gãy cành cây dữ dội (Flesh Tear & Violent Impact)
  playFleshRip() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.linearRampToValueAtTime(250, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  // Tiếng bước chân giày cảnh sát trên đất rừng & sỏi ướt (Realistic Wet Gravel & Forest Soil Footstep)
  playFootstepMud() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const pitchVar = 0.92 + Math.random() * 0.16;

    // 1. Âm trầm gót giày nện xuống đất ẩm (Organic Heel Thud)
    const heelOsc = this.ctx.createOscillator();
    heelOsc.type = 'sine';
    heelOsc.frequency.setValueAtTime(78 * pitchVar, now);
    heelOsc.frequency.exponentialRampToValueAtTime(28, now + 0.085);

    const heelGain = this.ctx.createGain();
    heelGain.gain.setValueAtTime(0.26, now);
    heelGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    heelOsc.connect(heelGain);
    heelGain.connect(this.masterGain);
    heelOsc.start(now);
    heelOsc.stop(now + 0.095);

    // 2. Tiếng lạo xạo của sỏi ướt, lá khô và bùn đất (Filtered Gravel/Soil Crunch)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.11);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI) * Math.exp(-i / (bufferSize * 0.55));
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const crunchNoise = this.ctx.createBufferSource();
    crunchNoise.buffer = buffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(620 * pitchVar, now);
    bandpass.Q.setValueAtTime(1.6, now);

    const crunchGain = this.ctx.createGain();
    crunchGain.gain.setValueAtTime(0.18, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.002, now + 0.105);

    crunchNoise.connect(bandpass);
    bandpass.connect(crunchGain);
    crunchGain.connect(this.masterGain);
    crunchNoise.start(now);
  }

  // Tiếng bước chân giày da cảnh sát trên sàn gỗ & đá cẩm thạch trong biệt thự (Realistic Indoor Wood/Marble Boot Step)
  playFootstepWood() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const pitchVar = 0.93 + Math.random() * 0.14;

    // 1. Tiếng gót giày da trầm ấm chạm mặt sàn gỗ/đá (Boot Heel Thump)
    const thumpOsc = this.ctx.createOscillator();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(105 * pitchVar, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(38, now + 0.075);

    const thumpGain = this.ctx.createGain();
    thumpGain.gain.setValueAtTime(0.32, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    thumpOsc.connect(thumpGain);
    thumpGain.connect(this.masterGain);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.085);

    // 2. Tiếng mũi giày tiếp đất nhẹ ngay sau gót giày (Sole Tap + Wood Resonance)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.065);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const tapNoise = this.ctx.createBufferSource();
    tapNoise.buffer = buffer;

    const woodFilter = this.ctx.createBiquadFilter();
    woodFilter.type = 'lowpass';
    woodFilter.frequency.setValueAtTime(480 * pitchVar, now + 0.018);

    const tapGain = this.ctx.createGain();
    tapGain.gain.setValueAtTime(0.14, now + 0.018);
    tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    tapNoise.connect(woodFilter);
    woodFilter.connect(tapGain);
    tapGain.connect(this.masterGain);
    tapNoise.start(now + 0.018);
  }

  // Tiếng sấm rền nhiều tầng (Deep Layered Thunderclap)
  playThunder() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Tia chớp nổ
    const crack = this.ctx.createOscillator();
    crack.type = 'sawtooth';
    crack.frequency.setValueAtTime(280, now);
    crack.frequency.exponentialRampToValueAtTime(45, now + 0.3);

    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.5, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    crack.connect(crackGain);
    crackGain.connect(this.masterGain);
    crack.start(now);
    crack.stop(now + 0.42);

    // Sấm rền siêu trầm
    const rumble = this.ctx.createOscillator();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(65, now + 0.1);
    rumble.frequency.exponentialRampToValueAtTime(22, now + 3.2);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.01, now);
    rumbleGain.gain.linearRampToValueAtTime(0.75, now + 0.3);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 3.4);

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);
    rumble.start(now + 0.1);
    rumble.stop(now + 3.5);
  }

  // Tiếng nhịp tim hồi hộp (Anatomical Heartbeat Lub-Dub)
  playHeartbeat() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const playThump = (t, freq, vol) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.15);
    };

    playThump(now, 75, 0.45);        // Lub
    playThump(now + 0.14, 60, 0.35); // Dub
  }

  // Tiếng bật tắt công tắc đèn pin kim loại
  playFlashlightToggle() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.setValueAtTime(700, now + 0.025);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Tiếng chém dao trong gió (Knife Swing Whoosh)
  playKnifeSlash() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(350, now + 0.14);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  // Tiếng rè nhiễu sóng tivi / băng từ VHS
  playVhsStaticBurst() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  // Tiếng nhặt vũ khí / dao rựa sáng bóng
  playPickup() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(850, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  // Tiếng nhảy bật lên & cất cánh bay (Jump & Fly)
  playJump() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.14);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Tiếng rè và bíp bộ đàm cảnh sát
  playRadioBeep() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.setValueAtTime(1250, now + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Âm thanh trầm kịch tính (Title Card Impact)
  playDramaticImpact() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(26, now + 2.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 2.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 3.3);
  }

  // Tiếng click nút bấm
  playClick() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.07);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Tiếng rê chuột qua nút
  playHover() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Tiếng súng lục 9mm nổ đanh thép có tiếng vang (9mm Tactical Pistol Gunshot)
  playGunshot() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Tiếng nổ thuốc súng (White Noise Burst)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.28);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.14));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.25);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.95, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.26);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    // 2. Xung trầm đầu nòng (Low-End Punch)
    const punch = this.ctx.createOscillator();
    punch.type = 'triangle';
    punch.frequency.setValueAtTime(190, now);
    punch.frequency.exponentialRampToValueAtTime(32, now + 0.12);

    const punchGain = this.ctx.createGain();
    punchGain.gain.setValueAtTime(0.85, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    punch.connect(punchGain);
    punchGain.connect(this.masterGain);
    punch.start(now);
    punch.stop(now + 0.15);
  }

  // Tiếng cò súng cạch khi hết đạn (Dry Fire Click)
  playEmptyGunClick() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.035);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Tiếng lật giấy đọc hồ sơ (Paper Rustle)
  playPageTurn() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }
}

export const audioManager = new HorrorAudioManager();

// Thước Phim Băng Ghi Hình VHS 3D Chân Thực, Sáng Rõ Ràng & Chuẩn Kịch Bản
import * as THREE from 'three';
import { audioManager } from './audio.js';

export class VHSPlayer {
  constructor(onClose) {
    this.onClose = onClose;

    this.container = document.createElement('div');
    this.container.id = 'vhs-player-overlay';
    this.container.innerHTML = `
      <div class="vhs-crt-glass"></div>
      <div class="vhs-scanlines"></div>
      
      <!-- Canvas 3D chứa bối cảnh rừng và quái vật -->
      <div class="vhs-3d-canvas-container">
        <canvas id="vhs-3d-canvas"></canvas>
      </div>

      <!-- Canvas 2D chuyên dụng vẽ hiệu ứng Nhiễu Từ Tính (Static Noise Overlay) -->
      <canvas id="vhs-noise-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></canvas>

      <div class="vhs-hud" id="vhs-hud">
        <div class="vhs-hud-top">
          <div class="vhs-rec-indicator">
            <span class="vhs-rec-dot">●</span> REC
          </div>
          <div class="vhs-hud-info">
            <span>SP</span>
            <span>STEREO [L▮▮▮ R▮▮▮]</span>
            <span class="vhs-battery">BATT [|||| ]</span>
          </div>
        </div>
        <div class="vhs-hud-bottom">
          <div class="vhs-date">26-10-1998 PM 08:14:18</div>
          <div class="vhs-counter" id="vhs-counter">TAPE 00:04:18</div>
        </div>
      </div>

      <div class="vhs-subtitles-box" id="vhs-subtitles-box">
        <div class="vhs-subtitles-speaker" id="vhs-speaker">QUYẾT (NHÂN VIÊN GIAO HÀNG)</div>
        <div class="vhs-subtitles-text" id="vhs-text">[ Đang chạy thục mạng trong rừng... ]</div>
      </div>

      <div class="vhs-screen-off" id="vhs-screen-off" style="display: none;">
        <div class="vhs-no-signal">[ MẤT TÍN HIỆU TỪ CUỘN BĂNG ]</div>
      </div>

      <button class="vhs-close-btn" id="vhs-close-btn">✕ DỪNG BĂNG & THOÁT [ESC]</button>
    `;

    document.body.appendChild(this.container);

    this.canvas3D = this.container.querySelector('#vhs-3d-canvas');
    this.noiseCanvas = this.container.querySelector('#vhs-noise-canvas');
    this.noiseCtx = this.noiseCanvas.getContext('2d');
    this.noiseCanvas.width = 480;
    this.noiseCanvas.height = 270;

    this.counterEl = this.container.querySelector('#vhs-counter');
    this.speakerEl = this.container.querySelector('#vhs-speaker');
    this.textEl = this.container.querySelector('#vhs-text');
    this.closeBtn = this.container.querySelector('#vhs-close-btn');
    this.screenOffEl = this.container.querySelector('#vhs-screen-off');
    this.hudEl = this.container.querySelector('#vhs-hud');
    this.subBoxEl = this.container.querySelector('#vhs-subtitles-box');

    this.startTime = Date.now();
    this.isPlaying = true;
    this.lastBreathTime = 0;
    this.lastFootstepTime = 0;
    this.snarlPlayed = false;
    this.shriekPlayed = false;
    this.fleshRipPlayed = false;
    this.staticPlayed = false;

    // Vết máu văng lên ống kính
    this.bloodSplats = [];

    // Khởi tạo không gian 3D sáng rõ cho video
    this.init3DScene();

    this.closeBtn.addEventListener('click', () => this.close());
    this.handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        this.close();
      }
    };
    window.addEventListener('keydown', this.handleKeyDown);

    audioManager.playRadioBeep();

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  // KHỞI TẠO KHÔNG GIAN 3D SÁNG RÕ RÀNG CHO VIDEO
  init3DScene() {
    this.scene = new THREE.Scene();
    // Giảm độ dày sương mù để thấy rõ khung cảnh rừng
    this.scene.fog = new THREE.FogExp2(0x0a0e1c, 0.018);

    this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 120);
    this.camera.position.set(0, 1.65, 20); // Điểm xuất phát

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas3D, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4; // Tăng sáng rực rỡ để không bị tối mù mịt

    // 1. ÁNH SÁNG MÔI TRƯỜNG & ÁNH TRĂNG SÁNG RÕ
    const ambient = new THREE.AmbientLight(0x445577, 0.9);
    this.scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0x88aacc, 1.4);
    moonLight.position.set(15, 35, 10);
    this.scene.add(moonLight);

    // 2. ĐÈN PIN CẦM TAY SIÊU SÁNG (High-Intensity Handheld Torch)
    this.flashlight = new THREE.SpotLight(0xfffae6, 24.0, 70, Math.PI / 4.2, 0.35, 1.0);
    this.flashlight.position.copy(this.camera.position);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);

    // 3. Mặt đất rừng ẩm ướt có vết bánh xe bùn lầy & cỏ dại
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 256;
    groundCanvas.height = 256;
    const gCtx = groundCanvas.getContext('2d');
    gCtx.fillStyle = '#10140f';
    gCtx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1200; i++) {
      gCtx.fillStyle = Math.random() > 0.5 ? '#182016' : '#090c08';
      gCtx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
    }
    const groundTex = new THREE.CanvasTexture(groundCanvas);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(14, 24);

    const groundGeo = new THREE.PlaneGeometry(60, 110, 16, 16);
    const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.78, metalness: 0.08 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Đèn chớp sấm sét ma quái trong rừng
    this.lightningLight = new THREE.PointLight(0x99bbff, 0, 100);
    this.lightningLight.position.set(0, 28, -5);
    this.scene.add(this.lightningLight);

    // 4. Rừng thông cổ thụ nhiều tầng tán & cành khô vặn vẹo hai bên đường chạy
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1b120c, roughness: 0.96 });
    const folMat = new THREE.MeshStandardMaterial({ color: 0x08160d, roughness: 0.88 });
    for (let i = 0; i < 48; i++) {
      const z = 25 - (i * 2.0);
      const isRight = i % 2 === 0;
      const x = isRight ? 3.6 + (i % 4) * 1.4 : -3.6 - (i % 4) * 1.4;

      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      tree.rotation.y = (i * 1.37) % Math.PI;
      tree.rotation.z = ((i % 3) - 1) * 0.04;

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.48, 10, 8), trunkMat);
      trunk.position.y = 5.0;
      tree.add(trunk);

      // 3 tầng tán lá thông rậm rạp
      for (let t = 0; t < 3; t++) {
        const fol = new THREE.Mesh(
          new THREE.ConeGeometry(2.9 - t * 0.55, 4.2 - t * 0.4, 7),
          folMat
        );
        fol.position.y = 4.6 + t * 2.1;
        tree.add(fol);
      }

      // Cành cây khô vươn ra đường mòn như bàn tay quỷ
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.09, 2.2, 5), trunkMat);
      branch.position.set(isRight ? -0.9 : 0.9, 3.2 + (i % 3) * 0.6, 0);
      branch.rotation.z = isRight ? 1.1 : -1.1;
      tree.add(branch);

      this.scene.add(tree);
    }

    // 5. Cây đại thụ nơi người quay dừng lại nấp
    const stopTree = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.4, 13, 8),
      trunkMat
    );
    stopTree.position.set(2.2, 6.5, -8.0);
    this.scene.add(stopTree);

    // 6. THỰC THỂ BÓNG ĐEN MẮT ĐỎ SIÊU THỰC (VOID SHADOW ENTITY VỚI KHÓI ĐEN UỐN LƯỢN & MÓNG VUỐT)
    this.shadowMonster = new THREE.Group();
    this.shadowMonster.position.set(0, 0, 8);
    this.shadowMonster.visible = false;

    // Vật liệu bóng đen hắc ám tuyệt đối (hấp thụ mọi nguồn sáng)
    const pureShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000
    });
    const smokeTendrilMat = new THREE.MeshBasicMaterial({
      color: 0x020003,
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    });

    // Thân dưới dạng sương khói đen đặc trườn trên mặt đất
    const lowerVoid = new THREE.Mesh(new THREE.ConeGeometry(0.92, 1.8, 12), pureShadowMat);
    lowerVoid.position.y = 0.85;
    this.shadowMonster.add(lowerVoid);

    // Thân trên gầy guộc, lưng gù quái dị cao 2.75m
    this.monsterTorsoGroup = new THREE.Group();
    this.monsterTorsoGroup.position.set(0, 1.35, 0);
    this.shadowMonster.add(this.monsterTorsoGroup);

    const spineTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.19, 1.35, 10), pureShadowMat);
    spineTorso.rotation.x = 0.22; // Hơi khom lưng rình mồi
    this.monsterTorsoGroup.add(spineTorso);

    // Bờ vai nhọn bất đối xứng của bóng đen
    const shoulderHum = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), pureShadowMat);
    shoulderHum.scale.set(1.55, 0.65, 0.85);
    shoulderHum.position.set(0, 0.52, 0.12);
    this.monsterTorsoGroup.add(shoulderHum);

    // Đầu bóng đen (Cổ dài, đầu nghiêng giật cục kinh dị)
    this.monsterHeadGroup = new THREE.Group();
    this.monsterHeadGroup.position.set(0, 0.96, 0.24);
    this.monsterTorsoGroup.add(this.monsterHeadGroup);

    const headSkull = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 16), pureShadowMat);
    headSkull.scale.set(0.88, 1.22, 0.98); // Đầu thon dài ma quái
    this.monsterHeadGroup.add(headSkull);

    // ĐÔI MẮT ĐỎ MÁU RỰC SÁNG XUYÊN MÀN ĐÊM + TÂM MẮT TRẮNG ĐỎ + QUẦNG SÁNG VOLUMETRIC
    const eyeOuterMat = new THREE.MeshBasicMaterial({ color: 0xff0015 });
    const eyeCoreMat = new THREE.MeshBasicMaterial({ color: 0xffbbbb });

    // Tạo texture quầng sáng đỏ (lens flare / glow) cho đôi mắt
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const glowCtx = glowCanvas.getContext('2d');
    const grad = glowCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 60, 60, 1.0)');
    grad.addColorStop(0.35, 'rgba(255, 0, 15, 0.65)');
    grad.addColorStop(1, 'rgba(180, 0, 0, 0)');
    glowCtx.fillStyle = grad;
    glowCtx.fillRect(0, 0, 64, 64);
    const eyeGlowTex = new THREE.CanvasTexture(glowCanvas);
    const eyeGlowSpriteMat = new THREE.SpriteMaterial({
      map: eyeGlowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    [-0.13, 0.13].forEach((ex, idx) => {
      const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 12), eyeOuterMat);
      eyeMesh.scale.set(1.25, 0.68, 0.9); // Mắt xếch sắc lạnh
      eyeMesh.position.set(ex, 0.04, 0.31);
      eyeMesh.rotation.z = idx === 0 ? -0.18 : 0.18;
      this.monsterHeadGroup.add(eyeMesh);

      const pupilCore = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeCoreMat);
      pupilCore.position.set(ex, 0.04, 0.35);
      this.monsterHeadGroup.add(pupilCore);

      const glowSprite = new THREE.Sprite(eyeGlowSpriteMat);
      glowSprite.scale.set(0.58, 0.38, 1);
      glowSprite.position.set(ex, 0.04, 0.36);
      this.monsterHeadGroup.add(glowSprite);
    });

    // Đèn đỏ ma mị chiếu từ mắt thực thể
    this.eyeLight = new THREE.PointLight(0xff0011, 22.0, 28);
    this.eyeLight.position.set(0, 0.05, 0.55);
    this.monsterHeadGroup.add(this.eyeLight);

    // HAI CÁNH TAY DÀI NGOẰNG NGOÈO VỚI 5 MÓNG VUỐT BÓNG ĐEN SẮC NHỌN
    const buildShadowClawArm = (isLeft) => {
      const armPivot = new THREE.Group();
      const side = isLeft ? -1 : 1;
      armPivot.position.set(side * 0.54, 0.5, 0.1);

      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.055, 0.95, 8), pureShadowMat);
      upperArm.position.set(side * 0.08, -0.42, 0.22);
      upperArm.rotation.x = -0.5;
      upperArm.rotation.z = side * -0.18;
      armPivot.add(upperArm);

      const foreArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.032, 1.05, 8), pureShadowMat);
      foreArm.position.set(side * 0.16, -0.95, 0.68);
      foreArm.rotation.x = -1.05;
      armPivot.add(foreArm);

      // 5 ngón tay móng vuốt dài của thực thể bóng đen
      for (let c = -2; c <= 2; c++) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.34, 5), pureShadowMat);
        claw.position.set(side * 0.16 + c * 0.032, -1.18, 1.18);
        claw.rotation.x = Math.PI * 0.62;
        claw.rotation.z = c * 0.12;
        armPivot.add(claw);
      }
      return armPivot;
    };

    this.monsterArmL = buildShadowClawArm(true);
    this.monsterArmR = buildShadowClawArm(false);
    this.monsterTorsoGroup.add(this.monsterArmL, this.monsterArmR);

    // 42 DẢI KHÓI ĐEN & XÚC TU BÓNG TỐI UỐN LƯỢN QUANH CƠ THỂ (làm bóng đen sống động như khói đặc thực sự)
    this.shadowTendrils = [];
    for (let i = 0; i < 42; i++) {
      const isTendril = i % 2 === 0;
      const geo = isTendril
        ? new THREE.ConeGeometry(0.08 + (i % 4) * 0.03, 0.75 + (i % 5) * 0.22, 6)
        : new THREE.SphereGeometry(0.18 + (i % 4) * 0.05, 8, 8);
      const mesh = new THREE.Mesh(geo, i % 3 === 0 ? pureShadowMat : smokeTendrilMat);
      const angle = (i / 42) * Math.PI * 2;
      const radius = 0.18 + (i % 5) * 0.09;
      const baseY = 0.25 + (i / 42) * 2.15;
      mesh.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
      this.shadowMonster.add(mesh);
      this.shadowTendrils.push({
        mesh,
        angle,
        radius,
        baseY,
        speed: 2.5 + (i % 7) * 0.85,
        phase: i * 0.43
      });
    }

    this.scene.add(this.shadowMonster);
  }

  close() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    window.removeEventListener('keydown', this.handleKeyDown);
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    if (this.onClose) this.onClose();
  }

  animate() {
    if (!this.isPlaying) return;
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = (Date.now() - this.startTime) / 1000;
    const now = Date.now();

    // Cập nhật bộ đếm giờ băng
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = Math.floor(elapsed % 60).toString().padStart(2, '0');
    const ms = Math.floor((elapsed * 100) % 100).toString().padStart(2, '0');
    this.counterEl.textContent = `TAPE 00:${mins}:${secs}:${ms}`;

    // Chuyển động uốn lượn kinh dị của các dải khói đen quanh thực thể bóng đen
    if (this.shadowMonster && this.shadowMonster.visible) {
      for (const t of this.shadowTendrils) {
        const wave = elapsed * t.speed + t.phase;
        t.mesh.position.x = Math.cos(t.angle + Math.sin(wave * 0.5) * 0.4) * (t.radius + Math.sin(wave) * 0.08);
        t.mesh.position.z = Math.sin(t.angle + Math.cos(wave * 0.5) * 0.4) * (t.radius + Math.cos(wave) * 0.08);
        t.mesh.position.y = t.baseY + Math.sin(wave * 1.3) * 0.09;
        t.mesh.rotation.z = Math.sin(wave) * 0.65;
        t.mesh.rotation.x = Math.cos(wave * 0.8) * 0.45;
      }
      // Đầu thực thể giật cục bất thường (head twitching) như phim kinh dị found-footage
      const twitch = Math.random() < 0.22 ? (Math.random() - 0.5) * 0.55 : Math.sin(elapsed * 9) * 0.12;
      this.monsterHeadGroup.rotation.z = twitch;
      this.monsterHeadGroup.rotation.x = Math.sin(elapsed * 14) * 0.08;
    }

    // Âm thanh thở dốc lúc chạy (0s - 4.5s)
    if (elapsed < 4.5) {
      if (now - this.lastBreathTime > 800) {
        audioManager.playPantingBreath(true);
        this.lastBreathTime = now;
      }
      if (now - this.lastFootstepTime > 340) {
        audioManager.playFootstepMud();
        this.lastFootstepTime = now;
      }
    }

    // Tiếng quái vật gầm gừ lúc nhìn ra sau (7.8s)
    if (elapsed > 7.8 && !this.snarlPlayed) {
      audioManager.playMonsterSnarl();
      this.snarlPlayed = true;
    }

    // Tiếng thét quái vật khi bóng đen lao chớp nhoáng (9.6s)
    if (elapsed > 9.6 && !this.shriekPlayed) {
      audioManager.playMonsterShriek();
      this.shriekPlayed = true;
    }

    // Tiếng rơi máy & va đập dữ dội ngay khi va chạm cực mạnh (9.95s)
    if (elapsed > 9.95 && !this.fleshRipPlayed) {
      audioManager.playFleshRip();
      this.fleshRipPlayed = true;
      // Vết máu bắn tung tóe lên ống kính máy quay
      const w = this.noiseCanvas.width;
      const h = this.noiseCanvas.height;
      for (let i = 0; i < 26; i++) {
        this.bloodSplats.push({
          x: 20 + Math.random() * (w - 40),
          y: 15 + Math.random() * (h - 30),
          r: 12 + Math.random() * 38,
          dripLen: 15 + Math.random() * 55
        });
      }
    }

    // Tiếng nhiễu sóng băng từ ở cuối (13.5s)
    if (elapsed > 13.5 && !this.staticPlayed) {
      audioManager.playVhsStaticBurst();
      this.staticPlayed = true;
    }

    // ==========================================
    // DIỄN HOẠT 3D CHUẨN XÁC TỪNG GIÂY
    // ==========================================

    // GIAI ĐOẠN 1: ĐANG QUAY Ở RỪNG RỒI CHẠY (0s - 4.5s)
    if (elapsed < 4.5) {
      const runT = elapsed / 4.5;
      this.camera.position.z = THREE.MathUtils.lerp(20, -8.0, runT);
      // Lắc lư đầu camera chân thực khi chạy thục mạng
      this.camera.position.y = 1.65 + Math.abs(Math.sin(elapsed * 14)) * 0.16;
      this.camera.position.x = Math.sin(elapsed * 7.0) * 0.22;
      this.camera.rotation.y = Math.sin(elapsed * 7.0) * 0.11;
      this.camera.rotation.z = Math.sin(elapsed * 14) * 0.085;
      this.flashlight.intensity = 24.0;

      this.speakerEl.textContent = "QUYẾT (ĐANG CHẠY THỤC MẠNG TRONG RỪNG)";
      this.textEl.textContent = "Chúa ơi... nó vừa nhảy xuống từ nóc xe tải Nexus... Mình phải chạy nhanh hơn nữa!";
      this.drawCamcorderOverlay(elapsed, 0.04);
    }

    // GIAI ĐOẠN 2: ĐỨNG IM NHÌN XUNG QUANH (4.5s - 7.8s)
    else if (elapsed < 7.8) {
      this.camera.position.z = -8.0;
      this.camera.position.y = 1.65 + Math.sin(elapsed * 3.2) * 0.035;
      this.camera.position.x = 0;

      // Xoay đầu nhìn sang trái rồi nhìn sang phải trong hoảng loạn
      const lookT = (elapsed - 4.5) / 3.3;
      this.camera.rotation.y = Math.sin(lookT * Math.PI * 2) * 0.85;
      this.camera.rotation.z = Math.sin(elapsed * 5) * 0.02;

      this.speakerEl.textContent = "QUYẾT (ĐỨNG IM NẤP SAU GỐC CÂY)";
      this.textEl.textContent = "Suỵt... Im lặng... Nó đâu rồi? Mình cắt đuôi được thứ đó chưa?...";
      this.drawCamcorderOverlay(elapsed, 0.06);
    }

    // GIAI ĐOẠN 3: NHÌN RA SAU & BÓNG ĐEN MẮT ĐỎ RÌNH RẬP GIẬT CỤC (7.8s - 9.6s)
    else if (elapsed < 9.6) {
      this.camera.position.z = -8.0;
      const stalkElapsed = elapsed - 7.8;
      // Quay 180 độ ra đằng sau nhìn vào con đường tối
      const turnT = Math.min(1, stalkElapsed / 0.65);
      this.camera.rotation.y = THREE.MathUtils.lerp(0, Math.PI, turnT);
      this.camera.rotation.z = (Math.random() - 0.5) * 0.03;

      // Đèn pin chập chờn vì từ trường của thực thể bóng đen + chớp sấm sét
      this.flashlight.intensity = Math.random() < 0.25 ? 4.0 : 22.0;
      this.lightningLight.intensity = (stalkElapsed > 0.7 && stalkElapsed < 0.88) ? 35.0 : 0;

      // Sinh vật bóng đen rình rập, dịch chuyển giật cục (teleport twitch) lại gần
      this.shadowMonster.visible = true;
      const glitchStep = stalkElapsed > 1.25 ? 2.4 : (stalkElapsed > 0.75 ? 4.2 : 6.0);
      const sideTwitch = stalkElapsed > 1.25 ? -0.28 : (stalkElapsed > 0.75 ? 0.32 : 0);
      this.shadowMonster.position.set(sideTwitch, 0, glitchStep);
      this.monsterArmL.rotation.x = -0.35 - Math.sin(elapsed * 12) * 0.15;
      this.monsterArmR.rotation.x = -0.35 + Math.cos(elapsed * 12) * 0.15;

      this.speakerEl.textContent = "QUYẾT (QUAY ĐẦU NHÌN RA SAU)";
      this.textEl.textContent = "Khoan đã... Trong bóng tối đằng sau... HAI ĐỐM MẮT ĐỎ ĐÓ LÀ CÁI GÌ?!";
      this.drawCamcorderOverlay(elapsed, 0.14);
    }

    // GIAI ĐOẠN 4: BÓNG ĐEN MẮT ĐỎ LAO THẦN TỐC VỒ THẲNG VÀO ỐNG KÍNH (9.6s - 9.95s)
    else if (elapsed < 9.95) {
      this.camera.rotation.y = Math.PI + (Math.random() - 0.5) * 0.55;
      this.camera.rotation.x = (Math.random() - 0.5) * 0.38;
      this.shadowMonster.visible = true;
      this.flashlight.intensity = 28.0;
      this.eyeLight.intensity = 45.0;

      // Bóng đen lao với vận tốc kinh hoàng (0.35s) từ khoảng cách gần vồ thẳng vào mặt camera
      const chargeT = Math.min(1, (elapsed - 9.6) / 0.35);
      this.shadowMonster.position.z = THREE.MathUtils.lerp(2.4, -7.85, Math.pow(chargeT, 2.2));
      this.shadowMonster.position.x = (Math.random() - 0.5) * 0.18;
      this.shadowMonster.position.y = Math.sin(chargeT * Math.PI) * 0.25;
      // Hai cánh tay móng vuốt giơ cao vồ thẳng vào màn hình
      this.monsterArmL.rotation.x = -1.35;
      this.monsterArmR.rotation.x = -1.35;

      this.speakerEl.textContent = "THỰC THỂ BÓNG ĐEN MẮT ĐỎ";
      this.textEl.textContent = "*(BÓNG ĐEN XÉ TOẠC MÀN ĐÊM LAO THẲNG VÀO MẶT VỚI TIẾNG RÍT KINH HOÀNG!)*";
      this.drawCamcorderOverlay(elapsed, 0.28);
    }

    // GIAI ĐOẠN 5: ANIMATION RỚT CAMERA XUỐNG BÙN ĐẦY MÁU (9.95s - 13.5s)
    else if (elapsed < 13.5) {
      this.shadowMonster.visible = false;
      const dropT = Math.min(1, (elapsed - 9.95) / 0.22);

      // Camera rơi đánh 'rầm' xuống bùn và nằm nghiêng góc trong đất, máu chảy trên ống kính
      this.camera.position.y = THREE.MathUtils.lerp(1.65, 0.18, dropT);
      this.camera.rotation.z = THREE.MathUtils.lerp(0, -0.95, dropT);
      this.camera.rotation.x = THREE.MathUtils.lerp(0, 0.65, dropT);
      this.flashlight.intensity = Math.random() < 0.3 ? 3.0 : 12.0;

      this.speakerEl.textContent = "QUYẾT (MÁY RƠI XUỐNG ĐẤT - LỜI TRĂN TRỐI)";
      this.textEl.textContent = "Đừng... đừng vào căn biệt thự... Nó đang ở đó... Quỷ dữ...";
      this.drawCamcorderOverlay(elapsed, 0.18);
    }

    // GIAI ĐOẠN 6: NHIỄU SÓNG TỪ TÍNH RỒI TẮT (13.5s - 16.8s)
    else if (elapsed < 16.8) {
      this.speakerEl.textContent = "TÍN HIỆU TỪ TÍNH";
      this.textEl.textContent = "*(Nhiễu sóng quét ngang, tín hiệu bị cắt đứt...)*";
      this.drawVhsNoise(elapsed);
    } else {
      // TẮT MÀN HÌNH (NO SIGNAL)
      this.screenOffEl.style.display = 'flex';
      this.hudEl.style.display = 'none';
      this.subBoxEl.style.display = 'none';

      if (elapsed > 18.5) {
        this.close();
        return;
      }
    }

    // Cập nhật đèn pin theo camera
    this.flashlight.position.copy(this.camera.position);
    const targetDir = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation);
    this.flashlightTarget.position.copy(this.camera.position).add(targetDir);

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }

  // VẼ HIỆU ỨNG ỐNG KÍNH MÁY QUAY HANDYCAM, VỆT NHIỄU NHẸ & VẾT MÁU BẮN LÊN KÍNH
  drawCamcorderOverlay(elapsed, glitchLevel = 0.05) {
    const ctx = this.noiseCtx;
    const w = this.noiseCanvas.width;
    const h = this.noiseCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Viền tối ống kính máy quay cổ (Camcorder Vignette)
    const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.28, w / 2, h / 2, w * 0.62);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.58)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // Các vạch nhiễu từ tính VHS nhẹ khi thực thể đến gần
    if (Math.random() < glitchLevel * 3.5) {
      const barCount = Math.ceil(glitchLevel * 12);
      for (let i = 0; i < barCount; i++) {
        const y = Math.random() * h;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.08 + glitchLevel * 0.45})`;
        ctx.fillRect(0, y, w, 1 + Math.random() * 4);
        ctx.fillStyle = `rgba(255, 0, 30, ${glitchLevel * 0.5})`;
        ctx.fillRect(0, y + 2, w, 2);
      }
    }

    // Vẽ vết máu đỏ thẫm bắn và chảy dài trên ống kính máy quay sau khi bị vồ
    if (this.bloodSplats.length > 0) {
      const dripProgress = Math.min(1, Math.max(0, (elapsed - 9.95) / 3.0));
      for (const b of this.bloodSplats) {
        const bg = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, b.r);
        bg.addColorStop(0, 'rgba(130, 0, 8, 0.92)');
        bg.addColorStop(0.65, 'rgba(85, 0, 4, 0.78)');
        bg.addColorStop(1, 'rgba(50, 0, 0, 0)');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();

        // Dòng máu chảy xuống ống kính
        ctx.fillStyle = 'rgba(110, 0, 5, 0.82)';
        ctx.fillRect(b.x - 2.5, b.y, 5, b.dripLen * dripProgress);
      }
    }
  }

  // VẼ NHIỄU SÓNG TỪ TÍNH VHS (STATIC NOISE & GLITCH OVERLAY)
  drawVhsNoise(elapsed) {
    const ctx = this.noiseCtx;
    const w = this.noiseCanvas.width;
    const h = this.noiseCanvas.height;

    // Hạt nhiễu tĩnh trắng đen (Snow static)
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.random() < 0.35) {
        const val = Math.random() * 255;
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
        d[i + 3] = 200;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Vạch quét ngang gián đoạn (Tracking bars)
    for (let k = 0; k < 5; k++) {
      const barY = (elapsed * 280 + k * 65) % h;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(0, barY, w, 8 + (k % 2) * 6);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(0, barY - 4, w, 3);
      ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.fillRect(0, barY + 8, w, 3);
    }
  }
}

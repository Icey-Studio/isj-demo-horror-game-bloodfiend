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

    // 3. Mặt đất rừng ẩm ướt
    const groundGeo = new THREE.PlaneGeometry(60, 110, 10, 10);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x141814, roughness: 0.7, metalness: 0.1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // 4. Rừng thông hai bên đường chạy
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1f1610, roughness: 0.95 });
    const folMat = new THREE.MeshStandardMaterial({ color: 0x0c1e12, roughness: 0.85 });
    for (let i = 0; i < 40; i++) {
      const z = 24 - (i * 2.2);
      const isRight = i % 2 === 0;
      const x = isRight ? 4.0 + (i % 3) * 1.5 : -4.0 - (i % 3) * 1.5;

      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 9, 8), trunkMat);
      trunk.position.y = 4.5;
      tree.add(trunk);

      const fol = new THREE.Mesh(new THREE.ConeGeometry(2.8, 5.5, 8), folMat);
      fol.position.y = 6.2;
      tree.add(fol);

      this.scene.add(tree);
    }

    // 5. Cây đại thụ nơi người quay dừng lại nấp
    const stopTree = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.4, 13, 8),
      trunkMat
    );
    stopTree.position.set(2.2, 6.5, -8.0);
    this.scene.add(stopTree);

    // 6. BÓNG ĐEN THUẦN TÚY MẮT ĐỎ (PURE SHADOW SILHOUETTE - KHÔNG CÓ RĂNG, KHÔNG MẶT)
    this.shadowMonster = new THREE.Group();
    this.shadowMonster.position.set(0, 0, 8); // Đứng ở đằng sau người quay
    this.shadowMonster.visible = false;

    // Vật liệu bóng đen tuyệt đối (Hấp thụ hoàn toàn ánh sáng, không có răng hay chi tiết da)
    const pureShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000
    });

    // Đầu bóng ma (Khối tròn đen trơn, không có miệng, không có răng)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16), pureShadowMat);
    head.position.y = 2.25;
    this.shadowMonster.add(head);

    // Thân bóng đen cao lêu nghêu 2.8 mét
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.18, 1.8, 10), pureShadowMat);
    torso.position.y = 1.35;
    this.shadowMonster.add(torso);

    // Tà áo bóng ma dạng khói tỏa xuống mặt đất
    const shroud = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.2, 10), pureShadowMat);
    shroud.position.y = 0.9;
    this.shadowMonster.add(shroud);

    // Cánh tay bóng đen dài vươn về phía trước
    const armGeo = new THREE.CylinderGeometry(0.07, 0.03, 1.9, 8);
    const armL = new THREE.Mesh(armGeo, pureShadowMat);
    armL.position.set(-0.55, 1.45, 0.5);
    armL.rotation.x = -Math.PI / 3.2;
    armL.rotation.z = -0.3;
    this.shadowMonster.add(armL);

    const armR = new THREE.Mesh(armGeo, pureShadowMat);
    armR.position.set(0.55, 1.45, 0.5);
    armR.rotation.x = -Math.PI / 3.2;
    armR.rotation.z = 0.3;
    this.shadowMonster.add(armR);

    // CHỈ CÓ ĐÔI MẮT ĐỎ RỰC SÁNG TRONG BÓNG TỐI
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0011 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), eyeMat);
    eyeL.position.set(-0.16, 2.28, 0.4);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), eyeMat);
    eyeR.position.set(0.16, 2.28, 0.4);
    this.shadowMonster.add(eyeL);
    this.shadowMonster.add(eyeR);

    // Vầng hào quang sáng đỏ ma quái rọi từ đôi mắt
    this.eyeLight = new THREE.PointLight(0xff0000, 16.0, 26);
    this.eyeLight.position.set(0, 2.28, 0.55);
    this.shadowMonster.add(this.eyeLight);

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

    // Tiếng rơi máy & va đập dữ dội ngay khi va chạm cực mạnh (9.98s)
    if (elapsed > 9.98 && !this.fleshRipPlayed) {
      audioManager.playFleshRip();
      this.fleshRipPlayed = true;
      // Vết máu bắn lên ống kính
      for (let i = 0; i < 20; i++) {
        this.bloodSplats.push({
          x: 40 + Math.random() * (window.innerWidth - 80),
          y: 30 + Math.random() * (window.innerHeight - 60),
          r: 25 + Math.random() * 65
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
      // Lắc lư đầu camera khi chạy
      this.camera.position.y = 1.65 + Math.sin(elapsed * 15) * 0.14;
      this.camera.position.x = Math.sin(elapsed * 7.5) * 0.2;
      this.camera.rotation.y = Math.sin(elapsed * 7.5) * 0.09;
      this.camera.rotation.z = Math.sin(elapsed * 15) * 0.08;

      this.speakerEl.textContent = "QUYẾT (ĐANG CHẠY THỤC MẠNG TRONG RỪNG)";
      this.textEl.textContent = "Chúa ơi... nó vừa nhảy xuống từ nóc xe tải... Mình phải chạy nhanh hơn nữa!";
    }

    // GIAI ĐOẠN 2: ĐỨNG IM NHÌN XUNG QUANH (4.5s - 7.8s)
    else if (elapsed < 7.8) {
      this.camera.position.z = -8.0;
      this.camera.position.y = 1.65 + Math.sin(elapsed * 2.5) * 0.03;
      this.camera.position.x = 0;

      // Xoay đầu nhìn sang trái rồi nhìn sang phải
      const lookT = (elapsed - 4.5) / 3.3;
      this.camera.rotation.y = Math.sin(lookT * Math.PI * 2) * 0.85;
      this.camera.rotation.z = 0;

      this.speakerEl.textContent = "QUYẾT (ĐỨNG IM NHÌN XUNG QUANH)";
      this.textEl.textContent = "Suỵt... Im lặng... Nó đâu rồi? Mình cắt đuôi được nó chưa?...";
    }

    // GIAI ĐOẠN 3: NHÌN RA SAU & BÓNG ĐEN RÌNH RẬP (7.8s - 9.6s)
    else if (elapsed < 9.6) {
      this.camera.position.z = -8.0;
      // Quay 180 độ ra đằng sau nhìn vào con đường tối
      const turnT = Math.min(1, (elapsed - 7.8) / 0.85);
      this.camera.rotation.y = THREE.MathUtils.lerp(0, Math.PI, turnT);

      // Sinh vật bóng đen đứng rình rập ở đằng xa trên đường
      this.shadowMonster.visible = true;
      this.shadowMonster.position.set(0, 0, 5.2); // Đứng trong tầm đèn mờ

      this.speakerEl.textContent = "QUYẾT (QUAY ĐẦU NHÌN RA SAU)";
      this.textEl.textContent = "Khoan đã... Trong bóng tối đằng sau... HAI ĐỐM MẮT ĐỎ ĐÓ LÀ CÁI GÌ?!";
    }

    // GIAI ĐOẠN 4: BÓNG ĐEN MẮT ĐỎ LAO NHANH THẦN TỐC (JUMP-SCARE BLITZ CHỚP NHOÁNG: 0.38 GIÂY! 9.6s - 9.98s)
    else if (elapsed < 9.98) {
      this.camera.rotation.y = Math.PI + (Math.random() - 0.5) * 0.65; // Rung giật cực mạnh
      this.camera.rotation.x = (Math.random() - 0.5) * 0.45;
      this.shadowMonster.visible = true;

      // Bóng đen lao với vận tốc siêu âm chớp nhoáng (0.38s) thẳng vào camera
      const chargeT = (elapsed - 9.6) / 0.38; // 0 to 1
      this.shadowMonster.position.z = THREE.MathUtils.lerp(5.2, -7.9, Math.pow(chargeT, 3.8));

      this.speakerEl.textContent = "BÓNG ĐEN MẮT ĐỎ (LAO THẦN TỐC)";
      this.textEl.textContent = "*(BÓNG ĐEN LAO THẦN TỐC TRONG CHỚP MẮT VỚI TIẾNG RÍT KINH HOÀNG, VỒ THẲNG VÀO MẶT!)*";
    }

    // GIAI ĐOẠN 5: ANIMATION RỚT CAMERA XUỐNG BÙN (9.98s - 13.5s)
    else if (elapsed < 13.5) {
      this.shadowMonster.visible = false;
      const dropT = Math.min(1, (elapsed - 9.98) / 0.22);

      // Camera rơi đánh 'rầm' xuống bùn và nằm nghiêng góc trong đất
      this.camera.position.y = THREE.MathUtils.lerp(1.65, 0.18, dropT);
      this.camera.rotation.z = THREE.MathUtils.lerp(0, -0.95, dropT);
      this.camera.rotation.x = THREE.MathUtils.lerp(0, 0.65, dropT);

      this.speakerEl.textContent = "QUYẾT (MÁY RƠI XUỐNG ĐẤT - LỜI TRĂN TRỐI)";
      this.textEl.textContent = "Đừng... đừng vào căn biệt thự... Nó đang ở đó... Quỷ dữ...";
    }

    // GIAI ĐOẠN 6: NHIỄU NHIỄU RỒI TẮT (13.5s - 16.8s)
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

// Thế Giới 3D Góc Nhìn Thứ Nhất Trau Chuốt (High-Polish First-Person Horror World) - Three.js
import * as THREE from 'three';
import { audioManager } from './audio.js';
import { VHSPlayer } from './vhsPlayer.js';

export class HorrorWorld3D {
  constructor(canvas, onReturnToMenu, options = {}) {
    this.canvas = canvas;
    this.onReturnToMenu = onReturnToMenu;

    // Chế độ chơi: 'survival' (Sinh Tồn kinh dị ban đêm) | 'creative' (Sáng Tạo trời sáng & bay lượn Minecraft)
    this.mode = options.mode || 'survival';
    this.isFlying = false;
    this.isGrounded = true;
    this.verticalVelocity = 0;
    this.lastSpacePressTime = 0;

    // Thiết lập Three.js Scene, Camera & WebGL Renderer
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x040307, 0.042);

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 200);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Vị trí người chơi ban đầu
    this.camera.position.set(0, 1.65, 2.5);
    this.cameraRotation = { yaw: 0, pitch: 0 };
    this.flashlightTargetPos = new THREE.Vector3();

    // Biến trạng thái người chơi
    this.keys = {};
    this.hasKnife = false;
    this.hasWatchedVideo = false;
    this.hasInspectedTruck = false;
    this.isFlashlightOn = true;
    this.moveSpeed = 4.2;
    this.stepTimer = 0;
    this.headBobTimer = 0;

    // Tạo Canvas Textures thủ công cho độ chân thực cao (Nexus Logistics, Đá Gothic, Gỗ Lim, Kính Cửa Sổ)
    this.textures = this.generateProceduralTextures();

    // UI Overlay
    this.createUIOverlay();

    // Thiết lập Ánh sáng & Cảnh quan
    this.setupLighting();
    this.buildWorld();
    this.buildFirstPersonKnife(); // Xây dựng mô hình dao cầm trên tay góc nhìn thứ nhất

    // Áp dụng cấu hình chế độ chơi (Sáng tạo / Sinh tồn)
    this.applyGameMode(this.mode, false);

    // Thiết lập Tương tác & Phím điều khiển
    this.setupInteractions();
    this.setupControls();

    this.clock = new THREE.Clock();
    this.isRunning = true;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Lời dẫn đầu game
    if (this.mode === 'creative') {
      this.showMonologue("Chế độ Sáng Tạo: Trời sáng rực rỡ! Nhấn Space để nhảy, nhấp Space 2 lần liên tiếp để bay lên như Minecraft!", 7500);
    } else {
      this.showMonologue("An: 'Chiếc xe cảnh sát đã dừng lại ở bìa rừng... Phải tiến lại chiếc xe giao hàng Nexus gặp nạn phía trước để xem chuyện gì xảy ra.'", 6500);
    }
  }

  // Tự sinh Texture độ phân giải cao cho Nexus Logistics, Đá Lâu Đài Gothic, Gỗ Lim, Kính Cửa Sổ
  generateProceduralTextures() {
    const createNoiseTexture = (w, h, baseColor, noiseColor, roughness = 0.5) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (Math.random() < roughness) {
          const v = (Math.random() - 0.5) * 45;
          d[i] = Math.min(255, Math.max(0, d[i] + v));
          d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + v));
          d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + v));
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };

    // 1. Texture Logo Nexus Logistics từ file logo.png trong thư mục picture
    const textureLoader = new THREE.TextureLoader();
    const nexusLogoTexture = textureLoader.load('/nexus-logo.png');
    nexusLogoTexture.colorSpace = THREE.SRGBColorSpace;

    // Canvas dán trang trí bên hông xe tải Nexus Logistics
    const nexusCanvas = document.createElement('canvas');
    nexusCanvas.width = 512;
    nexusCanvas.height = 256;
    const nCtx = nexusCanvas.getContext('2d');
    nCtx.fillStyle = '#f0f3f8';
    nCtx.fillRect(0, 0, 512, 256);
    // Vạch xanh dương công nghệ cao Nexus
    nCtx.fillStyle = '#0f2b5c';
    nCtx.fillRect(0, 180, 512, 32);
    nCtx.fillStyle = '#1e5ecc';
    nCtx.fillRect(0, 172, 512, 8);
    // Chữ Nexus Logistics
    nCtx.fillStyle = '#0f2b5c';
    nCtx.font = 'bold 84px "Arial", sans-serif';
    nCtx.textAlign = 'center';
    nCtx.textBaseline = 'middle';
    nCtx.fillText('NEXUS', 256, 80);
    nCtx.font = 'bold 24px "Arial", sans-serif';
    nCtx.fillStyle = '#ffffff';
    nCtx.fillText('PHARMACEUTICAL LOGISTICS', 256, 196);
    const nexusLivery = new THREE.CanvasTexture(nexusCanvas);

    // 2. Texture Kim loại sọc gân bên trong lòng thùng xe hàng (Corrugated Metal Cargo Interior)
    const ribbedCanvas = document.createElement('canvas');
    ribbedCanvas.width = 256;
    ribbedCanvas.height = 256;
    const rbCtx = ribbedCanvas.getContext('2d');
    rbCtx.fillStyle = '#22252c';
    rbCtx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) {
      rbCtx.fillStyle = '#3a3f4b';
      rbCtx.fillRect(0, y, 256, 4);
      rbCtx.fillStyle = '#14161a';
      rbCtx.fillRect(0, y + 4, 256, 4);
    }
    const metalRibbed = new THREE.CanvasTexture(ribbedCanvas);
    metalRibbed.wrapS = THREE.RepeatWrapping;
    metalRibbed.wrapT = THREE.RepeatWrapping;

    // 3. Texture Màn hình máy quay Handycam Hi8 (LCD Mini Screen) hiển thị tĩnh sóng & REC
    const lcdCanvas = document.createElement('canvas');
    lcdCanvas.width = 256;
    lcdCanvas.height = 192;
    const lCtx = lcdCanvas.getContext('2d');
    lCtx.fillStyle = '#06101c';
    lCtx.fillRect(0, 0, 256, 192);

    // Hạt nhiễu tĩnh điện truyền hình Analog
    for (let i = 0; i < 400; i++) {
      const nx = Math.floor(Math.random() * 256);
      const ny = Math.floor(Math.random() * 192);
      lCtx.fillStyle = Math.random() > 0.5 ? 'rgba(0, 255, 200, 0.25)' : 'rgba(255, 255, 255, 0.18)';
      lCtx.fillRect(nx, ny, 2, 2);
    }
    // Vạch quét CRT scanlines
    for (let s = 0; s < 192; s += 3) {
      lCtx.fillStyle = 'rgba(0, 220, 255, 0.08)';
      lCtx.fillRect(0, s, 256, 1);
    }
    // Khung ngắm chữ thập ở tâm
    lCtx.strokeStyle = 'rgba(0, 255, 180, 0.6)';
    lCtx.lineWidth = 1.5;
    lCtx.strokeRect(40, 30, 176, 132);
    lCtx.beginPath();
    lCtx.moveTo(128, 90); lCtx.lineTo(128, 102);
    lCtx.moveTo(122, 96); lCtx.lineTo(134, 96);
    lCtx.stroke();
    // Đèn nhấp nháy REC đỏ rực
    lCtx.fillStyle = '#ff1818';
    lCtx.font = 'bold 20px monospace';
    lCtx.fillText('● REC', 18, 26);
    // Biểu tượng pin & định dạng VHS
    lCtx.fillStyle = '#00ffc8';
    lCtx.font = '14px monospace';
    lCtx.fillText('BAT [■■□]', 172, 26);
    lCtx.fillText('Hi8 / VHS-C', 18, 176);
    lCtx.fillStyle = '#f0f8ff';
    lCtx.fillText('SP 00:04:18', 145, 176);
    const camcorderLcd = new THREE.CanvasTexture(lcdCanvas);

    // 4. Texture Gạch Đá Lâu Đài Gothic Cổ Kính Rêu Phong (Weathered Mossy Gothic Ashlar Stone)
    const stoneBrickCanvas = document.createElement('canvas');
    stoneBrickCanvas.width = 512;
    stoneBrickCanvas.height = 512;
    const sbCtx = stoneBrickCanvas.getContext('2d');
    sbCtx.fillStyle = '#14131a';
    sbCtx.fillRect(0, 0, 512, 512);
    const rows = 10;
    const rowH = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * 48;
      const cols = 5;
      const colW = 512 / cols;
      for (let c = -1; c <= cols; c++) {
        const bx = c * colW + offset;
        const by = r * rowH;
        const shade = 32 + Math.floor(Math.random() * 24);
        const mossTint = Math.random() < 0.28 ? 8 : 0;
        sbCtx.fillStyle = `rgb(${shade - mossTint}, ${shade + mossTint}, ${shade + 4})`;
        sbCtx.fillRect(bx + 3, by + 3, colW - 6, rowH - 6);

        // Viền vữa cổ & vết nứt thời gian trên từng viên đá
        sbCtx.strokeStyle = 'rgba(10, 9, 14, 0.85)';
        sbCtx.lineWidth = 2;
        sbCtx.strokeRect(bx + 3, by + 3, colW - 6, rowH - 6);

        if (Math.random() < 0.35) {
          sbCtx.strokeStyle = 'rgba(8, 8, 12, 0.7)';
          sbCtx.lineWidth = 1.5;
          sbCtx.beginPath();
          sbCtx.moveTo(bx + 15 + Math.random() * 30, by + 4);
          sbCtx.lineTo(bx + 25 + Math.random() * 40, by + rowH * 0.6);
          sbCtx.stroke();
        }
      }
    }
    // Vệt rêu ẩm mốc & nước mưa chảy dọc tường đá cổ
    for (let m = 0; m < 18; m++) {
      const mx = Math.random() * 512;
      const my = Math.random() * 512;
      const mGrad = sbCtx.createRadialGradient(mx, my, 4, mx, my, 45 + Math.random() * 45);
      mGrad.addColorStop(0, 'rgba(22, 38, 20, 0.45)');
      mGrad.addColorStop(1, 'rgba(15, 20, 15, 0)');
      sbCtx.fillStyle = mGrad;
      sbCtx.fillRect(0, 0, 512, 512);
    }
    const stoneBrick = new THREE.CanvasTexture(stoneBrickCanvas);
    stoneBrick.wrapS = THREE.RepeatWrapping;
    stoneBrick.wrapT = THREE.RepeatWrapping;

    // 5. Texture Cửa Sổ Gothic Cũ Nát, Kính Vỡ Nứt Toác & Rèm Nhung Đỏ Rách Rưới (Dilapidated Broken Gothic Window)
    const windowCanvas = document.createElement('canvas');
    windowCanvas.width = 256;
    windowCanvas.height = 512;
    const wCtx = windowCanvas.getContext('2d');
    wCtx.fillStyle = '#07060b';
    wCtx.fillRect(0, 0, 256, 512);

    // Ánh đèn nến ma mị lập lòe phía sau lớp kính bụi bẩn
    const winGrad = wCtx.createRadialGradient(128, 240, 12, 128, 256, 185);
    winGrad.addColorStop(0, 'rgba(215, 110, 28, 0.85)');
    winGrad.addColorStop(0.4, 'rgba(110, 28, 14, 0.65)');
    winGrad.addColorStop(0.75, 'rgba(28, 16, 22, 0.9)');
    winGrad.addColorStop(1, '#060509');
    wCtx.fillStyle = winGrad;
    wCtx.fillRect(18, 22, 220, 468);

    // Rèm nhung đỏ thẫm rách tươm hai bên cửa sổ
    wCtx.fillStyle = '#3b070c';
    wCtx.beginPath();
    wCtx.moveTo(18, 22);
    wCtx.lineTo(88, 22);
    wCtx.lineTo(62, 220);
    wCtx.lineTo(44, 390);
    wCtx.lineTo(18, 460);
    wCtx.closePath();
    wCtx.fill();

    wCtx.beginPath();
    wCtx.moveTo(238, 22);
    wCtx.lineTo(168, 22);
    wCtx.lineTo(198, 240);
    wCtx.lineTo(212, 360);
    wCtx.lineTo(238, 450);
    wCtx.closePath();
    wCtx.fill();

    // Lưới sắt mắt cáo gỉ sét
    wCtx.strokeStyle = 'rgba(12, 11, 16, 0.92)';
    wCtx.lineWidth = 3;
    for (let x = -256; x < 512; x += 34) {
      wCtx.beginPath();
      wCtx.moveTo(x, 0);
      wCtx.lineTo(x + 512, 512);
      wCtx.stroke();
      wCtx.beginPath();
      wCtx.moveTo(x + 512, 0);
      wCtx.lineTo(x, 512);
      wCtx.stroke();
    }

    // Các mảng kính bị đập vỡ đen ngòm & vết nứt mạng nhện
    const brokenHoles = [
      [[65, 130], [115, 110], [122, 175], [75, 190]],
      [[145, 290], [205, 275], [195, 355], [138, 340]],
      [[55, 360], [95, 350], [88, 420], [45, 410]]
    ];
    brokenHoles.forEach(poly => {
      wCtx.fillStyle = '#030205';
      wCtx.beginPath();
      wCtx.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i++) wCtx.lineTo(poly[i][0], poly[i][1]);
      wCtx.closePath();
      wCtx.fill();

      // Viền kính vỡ sắc nhọn phản quang
      wCtx.strokeStyle = 'rgba(180, 200, 220, 0.45)';
      wCtx.lineWidth = 1.5;
      wCtx.stroke();
    });

    // Khung gỗ mục chia ô cửa sổ
    wCtx.strokeStyle = '#09080d';
    wCtx.lineWidth = 14;
    wCtx.strokeRect(12, 12, 232, 488);
    wCtx.lineWidth = 10;
    wCtx.beginPath();
    wCtx.moveTo(128, 12);
    wCtx.lineTo(128, 500);
    wCtx.moveTo(12, 180);
    wCtx.lineTo(244, 180);
    wCtx.moveTo(12, 340);
    wCtx.lineTo(244, 340);
    wCtx.stroke();
    const gothicWindow = new THREE.CanvasTexture(windowCanvas);

    // 6. Texture Gỗ Lim Cổ Chạm Khắc Tinh Xảo Cửa Đại Sảnh Biệt Thự (Ornate Carved Gothic Mahogany Portal)
    const doorCanvas = document.createElement('canvas');
    doorCanvas.width = 512;
    doorCanvas.height = 1024;
    const dCtx = doorCanvas.getContext('2d');
    // Nền gỗ lim đỏ sẫm cổ kính
    dCtx.fillStyle = '#24120b';
    dCtx.fillRect(0, 0, 512, 1024);
    // Vân gỗ tự nhiên sâu và sắc nét
    for (let g = 0; g < 512; g += 3) {
      dCtx.fillStyle = (g % 6 === 0) ? '#2f180e' : (g % 9 === 0 ? '#180b06' : '#211009');
      dCtx.fillRect(g, 0, 2, 1024);
    }
    // Khung đố cửa ngoài viền đồng cổ
    dCtx.strokeStyle = '#120804';
    dCtx.lineWidth = 28;
    dCtx.strokeRect(14, 14, 484, 996);
    dCtx.strokeStyle = '#6b4c2b';
    dCtx.lineWidth = 4;
    dCtx.strokeRect(30, 30, 452, 964);

    // 3 Ô Pano Chạm Khắc Kiến Trúc Gothic Victoria (Trên: Vòm nhọn hoa hồng, Giữa: Phù điêu kim cương, Dưới: Pano chân đế)
    const panels = [
      { y: 55, h: 330, type: 'arch' },
      { y: 415, h: 310, type: 'diamond' },
      { y: 755, h: 210, type: 'base' }
    ];
    panels.forEach(p => {
      // Nền pano chìm sâu
      dCtx.fillStyle = '#150905';
      dCtx.fillRect(58, p.y, 396, p.h);

      // Viền phào chỉ gỗ nổi 2 lớp
      dCtx.strokeStyle = '#472515';
      dCtx.lineWidth = 10;
      dCtx.strokeRect(58, p.y, 396, p.h);
      dCtx.strokeStyle = '#7c5832';
      dCtx.lineWidth = 2.5;
      dCtx.strokeRect(70, p.y + 12, 372, p.h - 24);

      if (p.type === 'arch') {
        // Hoa văn vòm nhọn Nhà Thờ Gothic & Hoa Hồng Cổ
        dCtx.strokeStyle = '#6e4926';
        dCtx.lineWidth = 5;
        dCtx.beginPath();
        dCtx.moveTo(90, p.y + p.h - 24);
        dCtx.lineTo(90, p.y + 120);
        dCtx.quadraticCurveTo(256, p.y + 15, 422, p.y + 120);
        dCtx.lineTo(422, p.y + p.h - 24);
        dCtx.stroke();

        // Hoa thị tròn (Rose Medallion) ở tâm vòm
        dCtx.beginPath();
        dCtx.arc(256, p.y + 145, 58, 0, Math.PI * 2);
        dCtx.stroke();
        dCtx.beginPath();
        dCtx.arc(256, p.y + 145, 32, 0, Math.PI * 2);
        dCtx.stroke();
      } else if (p.type === 'diamond') {
        // Phù điêu quả trám cổ điển
        dCtx.strokeStyle = '#6e4926';
        dCtx.lineWidth = 5;
        dCtx.beginPath();
        dCtx.moveTo(256, p.y + 28);
        dCtx.lineTo(410, p.y + p.h / 2);
        dCtx.lineTo(256, p.y + p.h - 28);
        dCtx.lineTo(102, p.y + p.h / 2);
        dCtx.closePath();
        dCtx.stroke();
      }

      // Đinh tán đồng cổ ở 4 góc mỗi pano
      [[84, p.y + 26], [428, p.y + 26], [84, p.y + p.h - 26], [428, p.y + p.h - 26]].forEach(([nx, ny]) => {
        dCtx.fillStyle = '#8c673a';
        dCtx.beginPath();
        dCtx.arc(nx, ny, 7, 0, Math.PI * 2);
        dCtx.fill();
      });
    });

    // Bản lề sắt rèn hoa văn Fleur-de-lis vắt ngang
    [95, 510, 915].forEach(hy => {
      dCtx.fillStyle = '#121318';
      dCtx.fillRect(14, hy, 320, 24);
      dCtx.strokeStyle = '#333642';
      dCtx.lineWidth = 2;
      dCtx.strokeRect(14, hy, 320, 24);
      dCtx.beginPath();
      dCtx.moveTo(334, hy - 8);
      dCtx.lineTo(372, hy + 12);
      dCtx.lineTo(334, hy + 32);
      dCtx.closePath();
      dCtx.fill();
    });

    // Vết máu khô và vết móng vuốt cào xé dữ tợn trên mặt cửa gỗ
    dCtx.strokeStyle = 'rgba(120, 4, 8, 0.9)';
    dCtx.lineWidth = 7;
    for (let c = 0; c < 4; c++) {
      dCtx.beginPath();
      dCtx.moveTo(150 + c * 32, 330);
      dCtx.quadraticCurveTo(210 + c * 30, 510, 260 + c * 28, 710);
      dCtx.stroke();
    }
    // Vệt máu chảy dài từ tay nắm cửa xuống chân cửa
    const bloodGrad = dCtx.createLinearGradient(0, 460, 0, 880);
    bloodGrad.addColorStop(0, 'rgba(130, 0, 5, 0.85)');
    bloodGrad.addColorStop(1, 'rgba(60, 0, 0, 0)');
    dCtx.fillStyle = bloodGrad;
    dCtx.fillRect(385, 460, 48, 420);

    const doorWood = new THREE.CanvasTexture(doorCanvas);
    doorWood.colorSpace = THREE.SRGBColorSpace;

    return {
      asphalt: createNoiseTexture(256, 256, '#1a1820', '#2d2938', 0.8),
      mud: createNoiseTexture(256, 256, '#0f0c09', '#1a140d', 0.9),
      bark: createNoiseTexture(256, 256, '#140c06', '#221509', 0.95),
      stone: createNoiseTexture(256, 256, '#1f1e26', '#353342', 0.7),
      nexusLogoTexture,
      nexusLivery,
      metalRibbed,
      camcorderLcd,
      stoneBrick,
      gothicWindow,
      doorWood
    };
  }

  createUIOverlay() {
    this.isPaused = false;
    this.hasLockedOnce = false;
    this.isViewingVHS = false;

    this.uiContainer = document.createElement('div');
    this.uiContainer.id = 'fp-ui-overlay';
    this.uiContainer.innerHTML = `
      <div class="fp-crosshair" id="fp-crosshair">+</div>
      <div class="fp-prompt" id="fp-prompt" style="display: none;">[E] Tương tác</div>
      <div class="fp-monologue" id="fp-monologue"></div>

      <!-- Góc trên bên phải: Nút mở Menu Tạm Dừng [ESC] & Trạng thái Bay (chỉ hiện ở Sáng Tạo) -->
      <div class="fp-mode-badge">
        <button class="pixel-btn btn-secondary" id="fp-btn-pause" style="padding: 8px 14px; font-size: 0.72rem; border-color: #8c6d3b; color: #e2c893;">
          ⚜ MENU [ESC]
        </button>
        <div class="fp-mode-pill flying" id="fp-fly-pill" style="display: none;">
          🕊 ĐANG BAY [SPACE x2: HẠ CÁNH]
        </div>
      </div>

      <div class="fp-hud-bottom">
        <div class="fp-inventory">
          <div class="fp-slot active" id="slot-flashlight">⚜ 🔦 ĐÈN PIN [F: BẬT]</div>
          <div class="fp-slot" id="slot-knife">⚜ 🗡 TAY KHÔNG</div>
        </div>
        <div class="fp-help">
          [WASD] Di chuyển | [SPACE] Nhảy${this.mode === 'creative' ? ' / [SPACE x2] Bay' : ''} | [SHIFT] Chạy | [F] Đèn pin | [ESC] Tạm dừng / Menu
        </div>
      </div>

      <!-- Menu Tạm Dừng Cổ Kính Gothic [ESC] -->
      <div class="fp-story-modal" id="fp-pause-modal" style="display: none;">
        <div class="fp-modal-card gothic-pause-card">
          <div class="gothic-ornament">⚜ ❖ ⚜</div>
          <h2 id="fp-pause-title">TẠM DỪNG ĐIỀU TRA</h2>
          <p style="color: #c8b69e; font-size: 1.25rem; margin-bottom: 22px; line-height: 1.5;">
            Hồ sơ vụ án: <strong>Biệt Thự Bác Sĩ Bình (Khu Rừng Cấm)</strong><br>
            Chế độ hiện tại: <span style="color: #ffd166;">${this.mode === 'creative' ? 'Sáng Tạo (Khám Phá Tự Do)' : 'Sinh Tồn (Kinh Dị)'}</span>
          </p>
          <div style="display: flex; flex-direction: column; gap: 12px; align-items: center;">
            <button class="pixel-btn btn-primary" id="fp-resume-btn" style="width: 280px;">▶ TIẾP TỤC ĐIỀU TRA [ESC]</button>
            <button class="pixel-btn btn-secondary" id="fp-exit-btn" style="width: 280px;">🚪 THOÁT RA MENU CHÍNH</button>
          </div>
          <div class="gothic-ornament" style="margin-top: 18px;">❖ ─── 🩸 ─── ❖</div>
        </div>
      </div>

      <div class="fp-story-modal" id="fp-story-modal" style="display: none;">
        <div class="fp-modal-card gothic-pause-card">
          <div class="gothic-ornament">⚜ ❖ ⚜</div>
          <h2 id="fp-modal-title">CĂN BIỆT THỰ HUYẾT QUỶ</h2>
          <div id="fp-modal-body"></div>
          <button class="pixel-btn btn-primary" id="fp-modal-btn">TIẾP TỤC</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.uiContainer);

    this.crosshairEl = this.uiContainer.querySelector('#fp-crosshair');
    this.promptEl = this.uiContainer.querySelector('#fp-prompt');
    this.monologueEl = this.uiContainer.querySelector('#fp-monologue');
    this.btnPauseEl = this.uiContainer.querySelector('#fp-btn-pause');
    this.flyPillEl = this.uiContainer.querySelector('#fp-fly-pill');
    this.slotFlashlightEl = this.uiContainer.querySelector('#slot-flashlight');
    this.slotKnifeEl = this.uiContainer.querySelector('#slot-knife');
    this.pauseModalEl = this.uiContainer.querySelector('#fp-pause-modal');
    this.resumeBtnEl = this.uiContainer.querySelector('#fp-resume-btn');
    this.exitBtnEl = this.uiContainer.querySelector('#fp-exit-btn');
    this.storyModalEl = this.uiContainer.querySelector('#fp-story-modal');
    this.modalTitleEl = this.uiContainer.querySelector('#fp-modal-title');
    this.modalBodyEl = this.uiContainer.querySelector('#fp-modal-body');
    this.modalBtnEl = this.uiContainer.querySelector('#fp-modal-btn');

    this.btnPauseEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePauseMenu(true);
    });
    this.resumeBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePauseMenu(false);
    });
    this.exitBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.playClick();
      this.destroy();
      if (this.onReturnToMenu) this.onReturnToMenu();
    });
  }

  togglePauseMenu(forceState) {
    if (this.storyModalEl && this.storyModalEl.style.display === 'flex') return;
    if (this.isViewingVHS) return;

    this.isPaused = typeof forceState === 'boolean' ? forceState : !this.isPaused;
    if (this.isPaused) {
      document.exitPointerLock?.();
      this.pauseModalEl.style.display = 'flex';
      this.keys = {};
      audioManager.playClick();
    } else {
      this.pauseModalEl.style.display = 'none';
      audioManager.playClick();
      this.canvas.requestPointerLock?.();
    }
  }

  showMonologue(text, duration = 6000) {
    this.monologueEl.textContent = text;
    this.monologueEl.style.opacity = '1';
    clearTimeout(this.monoTimeout);
    this.monoTimeout = setTimeout(() => {
      this.monologueEl.style.opacity = '0';
    }, duration);
  }

  setupLighting() {
    // Ánh sáng môi trường (Tự động thay đổi giữa Sinh Tồn u ám & Sáng Tạo rực rỡ)
    this.ambientLight = new THREE.AmbientLight(0x080a14, 0.45);
    this.scene.add(this.ambientLight);

    // Ánh trăng lạnh lẽo ban đêm / Ánh mặt trời vàng ấm áp ban ngày
    this.dirLight = new THREE.DirectionalLight(0x2d3b55, 0.55);
    this.dirLight.position.set(25, 45, -20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.bias = -0.001;
    this.scene.add(this.dirLight);

    // ĐÈN PIN CHIẾN THUẬT SIÊU SÁNG (Tactical Torch với quầng sáng thực)
    this.flashlight = new THREE.SpotLight(0xfff8e7, 5.5, 38, Math.PI / 5.2, 0.35, 1.1);
    this.flashlight.position.copy(this.camera.position);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.flashlight.castShadow = true;
    this.scene.add(this.flashlight);

    // CÒI XE CẢNH SÁT (Đỏ & Xanh nhấp nháy luân phiên rực rỡ)
    this.sirenRed = new THREE.PointLight(0xff1818, 3.2, 22, 1.2);
    this.sirenRed.position.set(-1.8, 1.85, 2.0);
    this.scene.add(this.sirenRed);

    this.sirenBlue = new THREE.PointLight(0x1855ff, 0, 22, 1.2);
    this.sirenBlue.position.set(-2.2, 1.85, 2.0);
    this.scene.add(this.sirenBlue);

    // ĐÈN XI-NHAN XE TẢI NEXUS BỊ NẠN (Ánh vàng hổ phách nhấp nháy)
    this.truckHazard = new THREE.PointLight(0xff9900, 3.5, 15, 1.4);
    this.truckHazard.position.set(1.2, 1.2, -10.5);
    this.scene.add(this.truckHazard);

    // ĐÈN LỒNG SẢNH TRƯỚC BIỆT THỰ
    this.mansionLanternL = new THREE.PointLight(0xffaa33, 4.0, 26, 1.2);
    this.mansionLanternL.position.set(-4.5, 4.8, -60.5);
    this.scene.add(this.mansionLanternL);

    this.mansionLanternR = new THREE.PointLight(0xffaa33, 4.0, 26, 1.2);
    this.mansionLanternR.position.set(4.5, 4.8, -60.5);
    this.scene.add(this.mansionLanternR);
  }

  // Chuyển đổi giữa chế độ Sinh Tồn (Đêm tối kinh dị) và Sáng Tạo (Trời sáng & Bay lượn Minecraft)
  applyGameMode(mode, showNotification = true) {
    this.mode = mode;
    this.updateModeUI();

    if (this.mode === 'creative') {
      // 1. TRỜI SÁNG RỰC RỠ (DAYLIGHT SKY & CLEAR SUNSHINE)
      this.scene.background = new THREE.Color(0x78b8e0);
      this.scene.fog.color.setHex(0x9fd2ec);
      this.scene.fog.density = 0.004; // Tầm nhìn siêu xa, ngắm trọn vẹn toàn bộ khuôn viên biệt thự
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 1.25;
      this.dirLight.color.setHex(0xfffaea);
      this.dirLight.intensity = 1.85;
      this.dirLight.position.set(35, 70, -25);

      if (this.rainSystem) this.rainSystem.visible = false;

      if (showNotification) {
        this.showMonologue("ĐÃ BẬT CHẾ ĐỘ SÁNG TẠO! Trời sáng quang đãng. Nhấn [SPACE] để nhảy, nhấp [SPACE x2] liên tiếp để BAY LƯỢN!", 6000);
        audioManager.playPickup();
      }
    } else {
      // 2. CHẾ ĐỘ SINH TỒN U ÁM (HORROR SURVIVAL NIGHT)
      this.isFlying = false;
      this.scene.background = new THREE.Color(0x040307);
      this.scene.fog.color.setHex(0x040307);
      this.scene.fog.density = 0.042;
      this.ambientLight.color.setHex(0x080a14);
      this.ambientLight.intensity = 0.45;
      this.dirLight.color.setHex(0x2d3b55);
      this.dirLight.intensity = 0.55;
      this.dirLight.position.set(25, 45, -20);

      if (this.rainSystem) this.rainSystem.visible = true;

      if (showNotification) {
        this.showMonologue("ĐÃ TRỞ LẠI CHẾ ĐỘ SINH TỒN! Đêm bão tối tăm bao trùm... Bật đèn pin [F] để quan sát.", 5500);
        audioManager.playDramaticImpact();
      }
    }
  }

  updateModeUI() {
    if (this.flyPillEl) {
      this.flyPillEl.style.display = this.isFlying ? 'block' : 'none';
    }
  }

  buildWorld() {
    // =========================================================================
    // 1. TUYẾN QUỐC LỘ NHỰA CHÍNH CHẠY NGANG BÌA RỪNG (EAST-WEST MAIN HIGHWAY)
    // Theo đúng kịch bản: Xe cảnh sát dừng trên quốc lộ chính, còn căn biệt thự
    // nằm sâu bên trong một con đường mòn đất bùn tách ra từ bìa rừng!
    // =========================================================================
    const roadGeo = new THREE.PlaneGeometry(190, 12.5, 16, 4);
    const roadMat = new THREE.MeshStandardMaterial({
      map: this.textures.asphalt,
      roughness: 0.38,
      metalness: 0.18
    });
    this.textures.asphalt.repeat.set(36, 2);
    const mainHighway = new THREE.Mesh(roadGeo, roadMat);
    mainHighway.rotation.x = -Math.PI / 2;
    mainHighway.position.set(0, 0.015, 3.5);
    mainHighway.receiveShadow = true;
    this.scene.add(mainHighway);

    // Vạch kẻ tim đường đứt đoạn chạy dọc Quốc lộ Đông - Tây
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xe8e4d5 });
    const yellowStripeMat = new THREE.MeshBasicMaterial({ color: 0xd4a024 });
    for (let rx = -90; rx <= 90; rx += 6.0) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.22), yellowStripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(rx, 0.025, 3.5);
      this.scene.add(stripe);

      // Đinh phản quang mặt đường (Cat's Eyes)
      const stud = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.035, 0.12),
        new THREE.MeshBasicMaterial({ color: 0xffaa22 })
      );
      stud.position.set(rx + 2.2, 0.03, 3.5);
      this.scene.add(stud);
    }

    // Vạch biên trắng hai bên Quốc lộ (chừa khoảng trống ở ngã rẽ vào đường mòn rừng x: [-5.5, 5.5])
    const southEdge = new THREE.Mesh(new THREE.PlaneGeometry(190, 0.18), stripeMat);
    southEdge.rotation.x = -Math.PI / 2;
    southEdge.position.set(0, 0.025, 9.3);
    this.scene.add(southEdge);

    [-52, 52].forEach(segX => {
      const northEdge = new THREE.Mesh(new THREE.PlaneGeometry(92, 0.18), stripeMat);
      northEdge.rotation.x = -Math.PI / 2;
      northEdge.position.set(segX, 0.025, -2.3);
      this.scene.add(northEdge);
    });

    // Lan can hộ lan kim loại (Steel Guardrails) dọc theo Quốc lộ (mở lối rẽ vào đường mòn ở giữa)
    const guardMat = new THREE.MeshStandardMaterial({ color: 0x8e96a4, metalness: 0.75, roughness: 0.35 });
    for (let gx = -84; gx <= 84; gx += 4.5) {
      // Hộ lan phía Nam quốc lộ
      const railS = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.38, 0.12), guardMat);
      railS.position.set(gx, 0.62, 9.8);
      this.scene.add(railS);
      const postS = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.72), guardMat);
      postS.position.set(gx, 0.35, 9.8);
      this.scene.add(postS);

      // Hộ lan phía Bắc quốc lộ (chừa lối mở x: [-7.5, 7.5] cho con đường mòn vào rừng)
      if (Math.abs(gx) > 8.0) {
        const railN = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.38, 0.12), guardMat);
        railN.position.set(gx, 0.62, -2.8);
        this.scene.add(railN);
        const postN = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.72), guardMat);
        postN.position.set(gx, 0.35, -2.8);
        this.scene.add(postN);
      }
    }

    // Cột điện gỗ ven Quốc lộ
    const woodPoleMat = new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.92 });
    for (let px = -75; px <= 75; px += 30) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 11, 8), woodPoleMat);
      pole.position.set(px, 5.5, 10.6);
      this.scene.add(pole);
      const crossarm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.2), guardMat);
      crossarm.position.set(px, 10.1, 10.6);
      this.scene.add(crossarm);
    }

    // Đất rừng bùn lầy bao la (Rộng 200m x 260m)
    const forestGroundGeo = new THREE.PlaneGeometry(200, 260, 16, 16);
    const forestGroundMat = new THREE.MeshStandardMaterial({
      map: this.textures.mud,
      roughness: 0.92,
      metalness: 0.05
    });
    this.textures.mud.repeat.set(24, 32);
    const forestGround = new THREE.Mesh(forestGroundGeo, forestGroundMat);
    forestGround.rotation.x = -Math.PI / 2;
    forestGround.position.set(0, 0, -55);
    forestGround.receiveShadow = true;
    this.scene.add(forestGround);

    // =========================================================================
    // 2. CON ĐƯỜNG MÒN ĐẤT BÙN UỐN LƯỢN SÂU TRONG RỪNG (WINDING FOREST DIRT TRAIL)
    // Nối từ ngã rẽ Quốc lộ (z = -2.5) xuyên qua rừng rậm tới Cổng Sắt Biệt Thự (z = -46)
    // =========================================================================
    const trailWaypoints = [
      { x: 0.5, z: -4.5, w: 6.2, len: 5.5, rot: -0.08 },
      { x: 0.9, z: -9.5, w: 5.6, len: 5.5, rot: 0.06 },
      { x: 0.3, z: -14.5, w: 5.2, len: 5.5, rot: 0.14 },
      { x: -0.6, z: -19.5, w: 4.8, len: 5.5, rot: 0.16 },
      { x: -1.3, z: -24.5, w: 4.8, len: 5.5, rot: 0.08 },
      { x: -1.1, z: -29.5, w: 4.8, len: 5.5, rot: -0.10 },
      { x: -0.4, z: -34.5, w: 5.0, len: 5.5, rot: -0.12 },
      { x: 0.0, z: -39.5, w: 5.2, len: 5.5, rot: -0.05 },
      { x: 0.0, z: -44.0, w: 5.6, len: 4.8, rot: 0.0 }
    ];

    const dirtTrailMat = new THREE.MeshStandardMaterial({
      color: 0x1c140d,
      map: this.textures.mud,
      roughness: 0.95,
      metalness: 0.08
    });
    const rutMat = new THREE.MeshStandardMaterial({
      color: 0x0e0906,
      roughness: 0.25, // Bùn ướt đọng nước mưa trong vết bánh xe
      metalness: 0.35
    });

    trailWaypoints.forEach((seg, idx) => {
      const pathPatch = new THREE.Mesh(new THREE.PlaneGeometry(seg.w, seg.len), dirtTrailMat);
      pathPatch.rotation.x = -Math.PI / 2;
      pathPatch.rotation.z = seg.rot;
      pathPatch.position.set(seg.x, 0.012 + (idx % 2) * 0.002, seg.z);
      pathPatch.receiveShadow = true;
      this.scene.add(pathPatch);

      // Hai vệt bánh xe hằn sâu đọng nước mưa dọc theo đường mòn
      [-1.15, 1.15].forEach(rutOffset => {
        const rut = new THREE.Mesh(new THREE.PlaneGeometry(0.42, seg.len * 0.92), rutMat);
        rut.rotation.x = -Math.PI / 2;
        rut.rotation.z = seg.rot;
        rut.position.set(seg.x + rutOffset, 0.016, seg.z);
        this.scene.add(rut);
      });
    });

    // Biển báo gỗ mục nát nghiêng ngả ở đầu đường mòn bìa rừng
    const signGroup = new THREE.Group();
    signGroup.position.set(-4.2, 0, -4.2);
    signGroup.rotation.y = 0.35;
    signGroup.rotation.z = -0.08;
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.2, 7), woodPoleMat);
    signPost.position.y = 1.1;
    signGroup.add(signPost);
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.48, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x2a1b10, roughness: 0.9 })
    );
    signBoard.position.set(0, 1.75, 0.06);
    signBoard.rotation.z = -0.06;
    signGroup.add(signBoard);
    this.scene.add(signGroup);

    // Tảng đá rêu phong & bụi cỏ dại ven hai bên đường mòn rừng
    const rockMat = new THREE.MeshStandardMaterial({ map: this.textures.stone, roughness: 0.92 });
    for (let rk = 0; rk < 28; rk++) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.45 + Math.random() * 0.75, 1),
        rockMat
      );
      const side = rk % 2 === 0 ? 1 : -1;
      const rz = -5 - rk * 1.45;
      rock.position.set(side * (3.2 + Math.random() * 4.5), 0.28, rz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      this.scene.add(rock);
    }

    // 3. Xe Cảnh Sát Tuần Tra đỗ trên Quốc lộ chính hướng đèn pha vào đường mòn
    this.buildPoliceCruiser(-2.4, 0, 2.6);

    // 4. Xe Giao Hàng Nexus Bị Nạn lao khỏi Quốc lộ đâm vào gốc cây đầu đường mòn
    this.buildCrashedDeliveryTruck(1.2, 0, -11.0);

    // 5. Rừng thông rậm rạp bao bọc hai bên con đường mòn và bao quanh biệt thự
    for (let i = 0; i < 115; i++) {
      const z = -115 + Math.random() * 130;
      const side = Math.random() > 0.5 ? 1 : -1;
      // Dọc theo đường mòn (z > -45), cây mọc sát lối đi (từ 4.8m trở ra) tạo cảm giác rừng sâu âm u
      const minX = (z > -45 && z < -2) ? 4.8 : 9.5;
      const x = side * (minX + Math.random() * 45);
      // Không trồng cây đè lên mặt Quốc lộ (z: [-2.5, 9.5]) hoặc trong Sân & Tòa Biệt Thự (x: [-44, 44], z: [-95, -45])
      if (z > -3.0 && z < 10.5) continue;
      if (Math.abs(x) < 42 && z <= -45 && z >= -95) continue;
      this.buildPineTree(x, 0, z, 0.85 + Math.random() * 0.65);
    }

    // 6. Cây Đại Thụ & Thi Thể Người Giao Hàng Rơi Xuống bên vệ đường mòn
    this.buildCorpseTree(-2.6, 0, -29);

    // 7. Vệt Máu Visceral Dẫn Từ Xe Tải -> Thi Thể -> Cổng Sắt -> Thềm Cửa Biệt Thự
    this.buildVisceralBloodTrail();

    // 8. CỔNG SẮT CŨ KỸ RỈ SÉT & SÂN BIỆT THỰ BỎ HOANG ĐẦY CỎ DẠI, VẾT MÁU, ĐÀI PHUN NƯỚC MÁU
    this.buildAbandonedCourtyardAndGate();

    // 9. CĂN BIỆT THỰ HUYẾT QUỶ ĐỒ SỘ, GOTHIC CỔ KÍNH & BỆ THỀM THẤP DỄ BƯỚC VÀO
    this.buildMansionEntrance(0, 0, -75);

    // 10. Hạt mưa rơi rả rích trong không gian
    const rainGeo = new THREE.BufferGeometry();
    const rainCount = 2000;
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 85;
      rainPositions[i + 1] = Math.random() * 35;
      rainPositions[i + 2] = -120 + Math.random() * 170;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x8899bb,
      size: 0.15,
      transparent: true,
      opacity: 0.65
    });
    this.rainSystem = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainSystem);
  }

  buildPoliceCruiser(x, y, z) {
    const car = new THREE.Group();
    car.position.set(x, y, z);

    // Thân xe đen bóng
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x12141a, roughness: 0.3, metalness: 0.7 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xededed, roughness: 0.4, metalness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x1c2430, roughness: 0.1, transparent: true, opacity: 0.85 });

    // Khung gầm
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 4.6), bodyMat);
    base.position.y = 0.55;
    car.add(base);

    // Cửa trắng cảnh sát
    const doors = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.72, 1.8), whiteMat);
    doors.position.set(0, 0.56, 0);
    car.add(doors);

    // Cabin xe & kính chắn gió
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 2.3), glassMat);
    cabin.position.set(0, 1.2, -0.2);
    car.add(cabin);

    // Nóc xe đen
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.08, 1.8), bodyMat);
    roof.position.set(0, 1.55, -0.2);
    car.add(roof);

    // Bánh xe
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9 });
    wheelGeo.rotateZ(Math.PI / 2);
    [[-1.05, 0.38, 1.4], [1.05, 0.38, 1.4], [-1.05, 0.38, -1.4], [1.05, 0.38, -1.4]].forEach(pos => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(...pos);
      car.add(w);
    });

    // Còi đỏ xanh trên nóc
    const siren = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.28), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    siren.position.set(0, 1.65, -0.2);
    car.add(siren);

    // Đèn pha trước chiếu sáng
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xfffae6 });
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.1), hlMat);
    hlL.position.set(-0.65, 0.65, -2.31);
    const hlR = hlL.clone();
    hlR.position.x = 0.65;
    car.add(hlL);
    car.add(hlR);

    this.scene.add(car);
  }

  // XE GIAO HÀNG NEXUS - THÙNG XE RỖNG THẤY TOÀN BỘ BÊN TRONG (HOLLOW CARGO CONTAINER)
  buildCrashedDeliveryTruck(x, y, z) {
    const truck = new THREE.Group();
    truck.position.set(x, y, z);
    truck.rotation.y = 0.42; // Xe đâm nghiêng vào gốc cây

    // Cây cổ thụ khổng lồ bị xe đâm sầm
    const treeGeo = new THREE.CylinderGeometry(0.9, 1.3, 14, 10);
    const treeMat = new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.95 });
    const tree = new THREE.Mesh(treeGeo, treeMat);
    tree.position.set(1.4, 6.5, -2.2);
    truck.add(tree);

    // 1. Cabin xe tải giao hàng Nexus màu trắng kim loại
    const cabMat = new THREE.MeshStandardMaterial({
      color: 0xededed,
      roughness: 0.35,
      metalness: 0.4
    });
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 2.2), cabMat);
    cab.position.set(0, 1.2, -1.0);
    truck.add(cab);

    // Logo Nexus trên nắp ca-pô
    const hoodLogo = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.6),
      new THREE.MeshStandardMaterial({ map: this.textures.nexusLogoTexture, transparent: true })
    );
    hoodLogo.rotation.x = -Math.PI / 2.3;
    hoodLogo.position.set(0, 1.35, -1.5);
    truck.add(hoodLogo);

    // Kính chắn gió vỡ rạn nứt
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x223344,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75
    });
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), glassMat);
    windshield.position.set(0, 1.55, -2.11);
    windshield.rotation.x = 0.25;
    truck.add(windshield);

    // Mũi xe bẹp dúm gập vào thân cây
    const crushedHood = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.1, 1.2), cabMat);
    crushedHood.position.set(0.3, 0.9, -2.4);
    crushedHood.rotation.z = 0.22;
    crushedHood.rotation.y = -0.32;
    truck.add(crushedHood);

    // ========================================================
    // 2. THÙNG XE HÀNG RỖNG (HOLLOW CARGO CONTAINER - THẤY RÕ BÊN TRONG!)
    // ========================================================
    const cargoOuterMat = new THREE.MeshStandardMaterial({
      map: this.textures.nexusLivery,
      roughness: 0.5
    });
    const cargoInnerMat = new THREE.MeshStandardMaterial({
      map: this.textures.metalRibbed,
      roughness: 0.65
    });
    const metalFloorMat = new THREE.MeshStandardMaterial({
      color: 0x3a424e,
      roughness: 0.4,
      metalness: 0.6
    });

    // A. Sàn thùng xe kim loại gân chống trượt
    const cargoFloor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 4.4), metalFloorMat);
    cargoFloor.position.set(0, 0.42, 2.0);
    truck.add(cargoFloor);

    // B. Trần thùng xe
    const cargoRoof = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.08, 4.4), cargoOuterMat);
    cargoRoof.position.set(0, 2.78, 2.0);
    truck.add(cargoRoof);

    // C. Vách ngăn trước (giữa cabin và khoang chở hàng)
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.3, 0.08), cargoInnerMat);
    frontWall.position.set(0, 1.6, -0.15);
    truck.add(frontWall);

    // D. Vách thùng bên trái (có logo Nexus nhìn từ ngoài, mặt trong sọc gân)
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 4.4), cargoOuterMat);
    wallLeft.position.set(-1.25, 1.6, 2.0);
    truck.add(wallLeft);

    // E. Vách thùng bên phải
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 4.4), cargoOuterMat);
    wallRight.position.set(1.25, 1.6, 2.0);
    truck.add(wallRight);

    // F. HAI CÁNH CỬA THÙNG PHÍA SAU MỞ TOANG 110 ĐỘ (REAR DOORS SWUNG OPEN)
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x0f2b5c, roughness: 0.5 });
    // Cửa trái mở bung ra ngoài
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.25, 0.06), doorMat);
    doorL.position.set(-1.24, 1.6, 4.2);
    doorL.rotation.y = 1.95; // Mở ngoác ra bên hông
    truck.add(doorL);

    // Cửa phải mở bung ra ngoài
    const doorR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.25, 0.06), doorMat);
    doorR.position.set(1.24, 1.6, 4.2);
    doorR.rotation.y = -1.95; // Mở ngoác ra bên hông
    truck.add(doorR);

    // G. ĐÈN TRẦN CHIẾU SÁNG TRONG THÙNG HÀNG (INTERIOR CARGO DOME LIGHT)
    const cargoDomeLight = new THREE.PointLight(0xffddaa, 3.2, 6.5);
    cargoDomeLight.position.set(0, 2.65, 2.0);
    truck.add(cargoDomeLight);

    // ========================================================
    // 3. CHI TIẾT HÀNG HÓA VÀ THIẾT BỊ BÊN TRONG THÙNG XE
    // ========================================================
    // Kệ sắt 3 tầng gắn ở vách trái bên trong thùng xe (Cargo Shelving Rack)
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x556070, metalness: 0.8, roughness: 0.3 });
    for (let sh = 0; sh < 3; sh++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.03, 3.2), rackMat);
      shelf.position.set(-0.95, 0.9 + sh * 0.55, 1.8);
      truck.add(shelf);

      // Các hộp thuốc bảo quản sinh học Nexus trên kệ
      for (let kb = 0; kb < 3; kb++) {
        const medBox = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.22, 0.35),
          new THREE.MeshStandardMaterial({ color: 0xf5f8fa, roughness: 0.5 })
        );
        medBox.position.set(-0.95, 1.05 + sh * 0.55, 0.8 + kb * 0.85);
        truck.add(medBox);
      }
    }

    // Thùng giữ nhiệt lạnh y tế (Bio-Specimen Cold Storage Chest) bị đổ vỡ trên sàn xe
    const cooler = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.5, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x2255aa, roughness: 0.4 })
    );
    cooler.position.set(0.3, 0.65, 1.5);
    cooler.rotation.y = 0.35;
    cooler.rotation.z = 0.25;
    truck.add(cooler);

    // Vũng dung dịch mẫu sinh học phát sáng mờ loang lổ trên sàn xe
    const bioPuddle = new THREE.Mesh(
      new THREE.CircleGeometry(0.75, 12),
      new THREE.MeshBasicMaterial({ color: 0x33ff88, transparent: true, opacity: 0.65 })
    );
    bioPuddle.rotation.x = -Math.PI / 2;
    bioPuddle.position.set(0.2, 0.49, 1.6);
    truck.add(bioPuddle);

    // Kiện hàng carton Nexus trên sàn xe và rơi vãi ra ngoài
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 });
    for (let b = 0; b < 7; b++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.48), boxMat);
      if (b < 3) {
        // Bên trong thùng xe
        box.position.set(0.1 + (b % 2) * 0.45, 0.65, 2.6 + b * 0.45);
      } else {
        // Rơi ra ngoài bãi cỏ/đường
        box.position.set(-0.9 + b * 0.42, 0.22, 4.9 + (b % 2) * 0.55);
      }
      box.rotation.y = b * 0.45;
      truck.add(box);
    }

    // Khói bốc lên từ động cơ bị vỡ
    const smokeGeo = new THREE.SphereGeometry(0.45, 8, 8);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x3a3642, transparent: true, opacity: 0.65 });
    this.smokeNodes = [];
    for (let s = 0; s < 10; s++) {
      const sm = new THREE.Mesh(smokeGeo, smokeMat);
      sm.position.set(0.4, 1.4 + s * 0.35, -2.3);
      truck.add(sm);
      this.smokeNodes.push(sm);
    }

    this.scene.add(truck);
    this.crashedTruckMesh = truck;
  }

  // CÂY THÔNG TỰ NHIÊN NHIỀU TẦNG CÀNH LÁ (MULTI-TIERED CONIFER TREE)
  buildPineTree(x, y, z, scale = 1) {
    const tree = new THREE.Group();
    tree.position.set(x, y, z);
    tree.scale.set(scale, scale, scale);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.48, 9, 8),
      new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.95 })
    );
    trunk.position.y = 4.5;
    tree.add(trunk);

    const folMat = new THREE.MeshStandardMaterial({ color: 0x09140c, roughness: 0.88 });
    for (let l = 0; l < 5; l++) {
      const fol = new THREE.Mesh(
        new THREE.ConeGeometry(3.0 - l * 0.48, 3.2, 8),
        folMat
      );
      fol.position.y = 4.2 + l * 1.9;
      tree.add(fol);
    }

    this.scene.add(tree);
  }

  buildCorpseTree(x, y, z) {
    this.corpseGroup = new THREE.Group();
    this.corpseGroup.position.set(x, y, z);

    // Cây đại thụ rễ nổi ngoằn ngoèo gãy cành
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 1.25, 12, 10),
      new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.95 })
    );
    trunk.position.y = 6.0;
    this.corpseGroup.add(trunk);

    // Rễ cây gồ ghề trồi lên mặt đất
    for (let r = 0; r < 4; r++) {
      const root = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.35, 3.2, 6),
        new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.95 })
      );
      root.rotation.z = Math.PI / 3.2;
      root.rotation.y = (r * Math.PI) / 2 + 0.3;
      root.position.set(Math.cos(root.rotation.y) * 1.4, 0.25, Math.sin(root.rotation.y) * 1.4);
      this.corpseGroup.add(root);
    }

    // Cành cây chìa ra nơi thi thể rơi xuống
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.38, 4.8, 6),
      new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.95 })
    );
    branch.position.set(1.6, 6.8, 0);
    branch.rotation.z = Math.PI / 3.2;
    this.corpseGroup.add(branch);

    // ========================================================
    // 1. THI THỂ ANH PHÚC - TÀI XẾ GIAO HÀNG NEXUS LOGISTICS NẰM GỤC
    // ========================================================
    const corpse = new THREE.Group();
    corpse.position.set(1.0, 0, 0.4);

    const nexusJacketMat = new THREE.MeshStandardMaterial({ color: 0x0f2b5c, roughness: 0.7 }); // Xanh đậm Nexus
    const darkPantsMat = new THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.85 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0d, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc8a58a, roughness: 0.75 });

    // Thân người (áo khoác đồng phục Nexus rách tả tơi)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.72), nexusJacketMat);
    torso.position.set(0, 0.22, 0);
    torso.rotation.set(0.2, 0.45, -0.15);
    torso.castShadow = true;
    corpse.add(torso);

    // Vạch trắng phản quang áo bảo hộ Nexus
    const stripeP = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.04, 0.12), new THREE.MeshStandardMaterial({ color: 0xf5f8fa, roughness: 0.3 }));
    stripeP.position.set(0, 0.28, -0.05);
    stripeP.rotation.copy(torso.rotation);
    corpse.add(stripeP);

    // Hai chân co quắp trong bùn đất
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.65), darkPantsMat);
    legL.position.set(-0.25, 0.12, 0.48);
    legL.rotation.set(-0.1, 0.3, 0);
    corpse.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.62), darkPantsMat);
    legR.position.set(0.12, 0.12, 0.52);
    legR.rotation.set(-0.15, -0.2, 0);
    corpse.add(legR);

    // Giày bảo hộ lao động dính bùn
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.32), bootMat);
    bootL.position.set(-0.28, 0.1, 0.88);
    corpse.add(bootL);

    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.32), bootMat);
    bootR.position.set(0.14, 0.1, 0.9);
    corpse.add(bootR);

    // Cánh tay trái buông thõng chìm trong vũng máu
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.52), nexusJacketMat);
    armL.position.set(-0.35, 0.12, -0.08);
    armL.rotation.set(0.1, 0.6, 0.2);
    corpse.add(armL);

    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), skinMat);
    handL.position.set(-0.48, 0.08, -0.28);
    corpse.add(handL);

    // Cánh tay phải giơ lên với chiếc máy quét mã vận đơn Nexus bị vỡ
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.48), nexusJacketMat);
    armR.position.set(0.32, 0.15, -0.02);
    armR.rotation.set(-0.2, -0.4, -0.3);
    corpse.add(armR);

    // Máy quét mã vận đơn Nexus cầm tay rơi cạnh ngón tay
    const scanner = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.06, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.5 })
    );
    scanner.position.set(0.55, 0.08, -0.18);
    scanner.rotation.y = 0.4;
    corpse.add(scanner);

    // Đầu gục nghiêng sang bên gốc cây
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 12), skinMat);
    head.position.set(-0.06, 0.24, -0.45);
    corpse.add(head);

    // Mũ lưỡi trai đồng phục Nexus văng ra cạnh đầu
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, 0.09, 12),
      new THREE.MeshStandardMaterial({ color: 0x0f2b5c, roughness: 0.8 })
    );
    cap.position.set(0.24, 0.06, -0.58);
    cap.rotation.z = 0.35;
    corpse.add(cap);

    this.corpseGroup.add(corpse);

    // VŨNG MÁU ƯỚT SŨNG NHIỀU TẦNG (VISCERAL POOL OF FRESH BLOOD)
    const bloodPoolCore = new THREE.Mesh(
      new THREE.CircleGeometry(1.65, 16),
      new THREE.MeshStandardMaterial({
        color: 0x480202,
        roughness: 0.1, // Phản quang ướt sũng
        metalness: 0.45,
        transparent: true,
        opacity: 0.95
      })
    );
    bloodPoolCore.rotation.x = -Math.PI / 2;
    bloodPoolCore.position.set(1.0, 0.02, 0.35);
    this.corpseGroup.add(bloodPoolCore);

    // Các vệt máu bắn tia ra xung quanh
    for (let sp = 0; sp < 8; sp++) {
      const splatter = new THREE.Mesh(
        new THREE.CircleGeometry(0.25 + Math.random() * 0.35, 8),
        new THREE.MeshStandardMaterial({ color: 0x550000, roughness: 0.15, transparent: true, opacity: 0.88 })
      );
      splatter.rotation.x = -Math.PI / 2;
      const angle = (sp * Math.PI * 2) / 8 + Math.random() * 0.4;
      const dist = 1.6 + Math.random() * 0.85;
      splatter.position.set(1.0 + Math.cos(angle) * dist, 0.02, 0.35 + Math.sin(angle) * dist);
      this.corpseGroup.add(splatter);
    }

    // ========================================================
    // 2. CON DAO GĂM ĐI RỪNG CHIẾN THUẬT (TACTICAL BOWIE SURVIVAL KNIFE) CẮM VÀO THÂN CÂY
    // ========================================================
    const knifeGroup = new THREE.Group();
    knifeGroup.position.set(0.68, 1.48, -0.28);
    knifeGroup.rotation.set(0.2, 0.3, -0.65); // Cắm chéo 45 độ vào thân cây

    // Lưỡi dao thép không gỉ sáng bóng với sống dao có răng cưa & rãnh huyết
    const knifeBladeMat = new THREE.MeshStandardMaterial({
      color: 0xf5f8fc,
      metalness: 0.96,
      roughness: 0.12
    });
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.09), knifeBladeMat);
    blade.position.y = 0.21;
    knifeGroup.add(blade);

    // Mũi dao clip-point nhọn vát sắc bén
    const bladeTip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 4), knifeBladeMat);
    bladeTip.position.y = 0.48;
    bladeTip.rotation.y = Math.PI / 4;
    knifeGroup.add(bladeTip);

    // Chốt bảo vệ tay (Crossguard) bằng đồng thau vàng bóng
    const guardMat = new THREE.MeshStandardMaterial({ color: 0xd4a038, metalness: 0.9, roughness: 0.2 });
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.028, 0.18), guardMat);
    guard.position.y = 0.0;
    knifeGroup.add(guard);

    // Chuôi dao bọc da đen có các rãnh vân công thái học
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x141218, roughness: 0.85 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.035, 0.24, 12), handleMat);
    handle.position.y = -0.12;
    knifeGroup.add(handle);

    // Chuôi đáy bằng thép có lỗ xỏ dây
    const pommel = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.04, 12), guardMat);
    pommel.position.y = -0.25;
    knifeGroup.add(pommel);

    // Vết máu tươi nhỏ giọt từ vết cắm trên thân cây
    const bloodDrip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.75),
      new THREE.MeshBasicMaterial({ color: 0x880000, transparent: true, opacity: 0.9 })
    );
    bloodDrip.position.set(0, -0.38, 0.05);
    knifeGroup.add(bloodDrip);

    this.corpseGroup.add(knifeGroup);
    this.knifeObject = knifeGroup;

    // ========================================================
    // 3. CHIẾC MÁY QUAY HANDYCAM HI8 / VHS-C TRAU CHUỐT TỪNG CHI TIẾT
    // ========================================================
    const camcorderGroup = new THREE.Group();
    camcorderGroup.position.set(1.7, 0.18, 0.85);
    camcorderGroup.rotation.set(0.15, 0.75, -0.2); // Rơi nghiêng trong bùn

    const camBodyMat = new THREE.MeshStandardMaterial({ color: 0x18191f, roughness: 0.65, metalness: 0.35 });
    const camAccentMat = new THREE.MeshStandardMaterial({ color: 0x2d323c, roughness: 0.45, metalness: 0.6 });
    const camGlassMat = new THREE.MeshStandardMaterial({ color: 0x082035, roughness: 0.1, metalness: 0.9 });

    // Thân máy quay chính
    const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.20, 0.42), camBodyMat);
    camBody.position.y = 0.1;
    camBody.castShadow = true;
    camcorderGroup.add(camBody);

    // Cụm ống kính quang học (Optical Lens Barrel) phía trước
    const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.082, 0.12, 18), camAccentMat);
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.set(0.04, 0.11, -0.26);
    camcorderGroup.add(lensBarrel);

    // Vòng zoom & lấy nét có rãnh chống trượt
    const focusRing = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.084, 0.04, 18), camBodyMat);
    focusRing.rotation.x = Math.PI / 2;
    focusRing.position.set(0.04, 0.11, -0.24);
    camcorderGroup.add(focusRing);

    // Kính ống kính phản chiếu ánh xanh tím sâu thẳm
    const lensGlass = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), camGlassMat);
    lensGlass.position.set(0.04, 0.11, -0.321);
    camcorderGroup.add(lensGlass);

    // Ống ngắm điện tử (EVF - Electronic Viewfinder) ở góc trên phía sau
    const evf = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.065, 0.18), camBodyMat);
    evf.position.set(-0.06, 0.23, 0.12);
    camcorderGroup.add(evf);

    const eyecup = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.028, 0.04, 12), camBodyMat);
    eyecup.rotation.x = Math.PI / 2;
    eyecup.position.set(-0.06, 0.23, 0.22);
    camcorderGroup.add(eyecup);

    // Micro thu âm âm thanh nổi (Stereo Mic) trên đỉnh máy
    const topMic = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.14, 12), camAccentMat);
    topMic.rotation.x = Math.PI / 2;
    topMic.position.set(0.04, 0.22, -0.12);
    camcorderGroup.add(topMic);

    // MÀN HÌNH XOAY LẬT MỞ 85 ĐỘ (Flip-out Swivel LCD Screen) CÓ HÌNH ẢNH SÓNG TĨNH & REC
    const screenHinge = new THREE.Group();
    screenHinge.position.set(-0.12, 0.10, -0.04);
    screenHinge.rotation.y = -1.45; // Xoay lật mở hướng ra ngoài

    // Khung vỏ bảo vệ màn hình
    const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.16, 0.24), camBodyMat);
    screenFrame.position.set(0, 0, 0.12);
    screenHinge.add(screenFrame);

    // Tấm nền LCD hiển thị giao diện quay phim chân thực
    const lcdScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.14),
      new THREE.MeshBasicMaterial({ map: this.textures.camcorderLcd })
    );
    lcdScreen.rotation.y = Math.PI / 2;
    lcdScreen.position.set(0.009, 0, 0.12);
    screenHinge.add(lcdScreen);

    // Ánh sáng xanh lơ dịu từ màn hình LCD hắt xuống mặt đất bùn
    const lcdGlow = new THREE.PointLight(0x00f5d4, 1.2, 2.0);
    lcdGlow.position.set(0.12, 0, 0.12);
    screenHinge.add(lcdGlow);

    camcorderGroup.add(screenHinge);

    // Dây đai đeo tay bằng da có đệm (Padded Hand Strap) bên hông phải
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.26), camBodyMat);
    strap.position.set(0.14, 0.09, 0.05);
    camcorderGroup.add(strap);

    // ĐÈN LED ĐỎ TALLY GHI HÌNH (RECORDING TALLY LIGHT) NHẤP NHÁY
    const tallyLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    tallyLed.position.set(0.09, 0.18, -0.21);
    camcorderGroup.add(tallyLed);

    this.camcorderLed = new THREE.PointLight(0xff1111, 2.5, 3.8);
    this.camcorderLed.position.set(0.09, 0.18, -0.21);
    camcorderGroup.add(this.camcorderLed);

    this.corpseGroup.add(camcorderGroup);

    this.scene.add(this.corpseGroup);
  }

  buildVisceralBloodTrail() {
    // Vệt máu kéo lê thi thể xuyên suốt từ Xe Tải Nexus -> Gốc Cây -> Cổng Sắt -> Sân Cỏ -> Cửa Biệt Thự
    const bloodMat = new THREE.MeshStandardMaterial({
      color: 0x5a0303,
      roughness: 0.18,
      metalness: 0.35,
      transparent: true,
      opacity: 0.9
    });

    const waypoints = [
      [1.0, -11.5], [0.4, -15.0], [-0.5, -19.0], [-1.4, -23.0], [-2.0, -27.0],
      [-1.5, -32.0], [-0.6, -37.0], [0.2, -42.0], [0.9, -46.0],
      [0.6, -49.5], [0.3, -52.8], [0.4, -55.2], [0.6, -58.5], [0.8, -61.5]
    ];

    waypoints.forEach(([bx, bz], idx) => {
      const elev = bz <= -56.6 ? 0.275 : 0.022;
      const drop = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55 + (idx % 3) * 0.28, 1.35),
        bloodMat
      );
      drop.rotation.x = -Math.PI / 2;
      drop.rotation.z = (idx % 2 === 0 ? 0.12 : -0.15);
      drop.position.set(bx, elev, bz);
      this.scene.add(drop);
    });
  }

  // =========================================================================
  // SÂN BIỆT THỰ BỎ HOANG, CỔNG SẮT CŨ KỸ RỈ SÉT, CỎ DẠI, ĐÀI PHUN NƯỚC MÁU & ĐỒ VẬT KINH DỊ
  // =========================================================================
  buildAbandonedCourtyardAndGate() {
    const courtGroup = new THREE.Group();

    const rustyIronMat = new THREE.MeshStandardMaterial({
      color: 0x261a16,
      roughness: 0.72,
      metalness: 0.65
    });
    const mossyStoneMat = new THREE.MeshStandardMaterial({
      map: this.textures.stoneBrick,
      roughness: 0.88,
      metalness: 0.1
    });
    const darkStoneMat = new THREE.MeshStandardMaterial({
      map: this.textures.stone,
      roughness: 0.85,
      metalness: 0.1
    });
    const bloodWaterMat = new THREE.MeshStandardMaterial({
      color: 0x4d0205,
      roughness: 0.12,
      metalness: 0.45,
      transparent: true,
      opacity: 0.94
    });

    // 1. NỀN SÂN ĐÁ CỔ NỨT VỠ & RÊU PHONG (WEATHERED COBBLESTONE COURTYARD)
    const courtGeo = new THREE.PlaneGeometry(88, 52, 12, 12);
    this.textures.stone.repeat.set(14, 10);
    const courtyard = new THREE.Mesh(courtGeo, darkStoneMat);
    courtyard.rotation.x = -Math.PI / 2;
    courtyard.position.set(0, 0.015, -72);
    courtyard.receiveShadow = true;
    courtGroup.add(courtyard);

    // Các phiến đá lát đường nứt vỡ dẫn từ Cổng Sắt (z = -46) tới Bậc Thềm (z = -56)
    for (let pz = -46.5; pz >= -55.5; pz -= 1.35) {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(2.8 + (Math.random() - 0.5) * 0.6, 0.04, 0.95),
        mossyStoneMat
      );
      slab.position.set((Math.random() - 0.5) * 0.35, 0.02, pz);
      slab.rotation.y = (Math.random() - 0.5) * 0.08;
      slab.receiveShadow = true;
      courtGroup.add(slab);
    }

    // 2. CỔNG SẮT CŨ KỸ RỈ SÉT & HÀNG RÀO MŨI GIÁO GOTHIC (RUSTY WROUGHT-IRON ENTRANCE GATE AT Z = -46)
    const gateZ = -46.0;

    // Hai trụ cổng đá cổ rêu phong đồ sộ (x = -3.8 và x = +3.8)
    [-3.8, 3.8].forEach((px, idx) => {
      const pillarBase = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.8, 1.35), mossyStoneMat);
      pillarBase.position.set(px, 0.4, gateZ);
      courtGroup.add(pillarBase);

      const pillarShaft = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.6, 1.1), mossyStoneMat);
      pillarShaft.position.set(px, 2.5, gateZ);
      pillarShaft.castShadow = true;
      courtGroup.add(pillarShaft);

      const pillarCap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.4), darkStoneMat);
      pillarCap.position.set(px, 4.4, gateZ);
      courtGroup.add(pillarCap);

      // Chóp cầu đá cổ nứt trên đỉnh trụ cổng
      const finial = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 1), darkStoneMat);
      finial.position.set(px, 4.9, gateZ);
      courtGroup.add(finial);

      // Đèn lồng sắt gỉ sét lập lòe trên trụ cổng trái
      if (idx === 0) {
        const lantern = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.55, 0.35),
          new THREE.MeshBasicMaterial({ color: 0xff7722 })
        );
        lantern.position.set(px + 0.65, 3.4, gateZ + 0.4);
        courtGroup.add(lantern);

        const gateLight = new THREE.PointLight(0xff6611, 2.2, 14);
        gateLight.position.set(px + 0.75, 3.4, gateZ + 0.5);
        courtGroup.add(gateLight);
      } else {
        // Biển đồng gỉ sét nghiêng lệch trên trụ phải: "DINH THỰ BÁC SĨ BÌNH"
        const plaque = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, 0.45, 0.06),
          new THREE.MeshStandardMaterial({ color: 0x3b2818, metalness: 0.6, roughness: 0.5 })
        );
        plaque.position.set(px, 2.4, gateZ + 0.56);
        plaque.rotation.z = -0.09;
        courtGroup.add(plaque);
      }
    });

    // Vòm sắt uốn cong nối liền đỉnh 2 trụ cổng (Wrought-Iron Overthrow Arch)
    const gateArchBar = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.22, 0.16), rustyIronMat);
    gateArchBar.position.set(0, 4.35, gateZ);
    courtGroup.add(gateArchBar);

    // Hàm dựng 1 cánh cổng sắt rèn cũ kỹ (gồm khung, song sắt mũi giáo & vết máu)
    const createIronGateLeaf = (width) => {
      const leaf = new THREE.Group();
      // Thanh ngang trên, giữa và dưới
      [0.35, 1.85, 3.25].forEach(ry => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.08), rustyIronMat);
        rail.position.set(width / 2, ry, 0);
        leaf.add(rail);
      });
      // Các thanh sắt dọc có mũi giáo nhọn trên đỉnh (một vài thanh bị cong vẹo)
      const numBars = 10;
      for (let b = 0; b <= numBars; b++) {
        const bx = (b / numBars) * (width - 0.12) + 0.06;
        const barH = 3.35 + Math.sin((b / numBars) * Math.PI) * 0.45;
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, barH, 6), rustyIronMat);
        bar.position.set(bx, barH / 2 + 0.15, 0);
        if (b === 4 || b === 7) bar.rotation.z = (b === 4 ? 0.08 : -0.11); // Thanh sắt bị quái vật bẻ cong
        leaf.add(bar);

        // Mũi giáo sắt trên đỉnh mỗi thanh
        const spear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 4), rustyIronMat);
        spear.position.set(bx, barH + 0.25, 0);
        leaf.add(spear);
      }
      return leaf;
    };

    // Cánh cổng sắt bên trái (Khép hờ, dây xích sắt đứt thõng xuống)
    const leftGateLeaf = createIronGateLeaf(3.25);
    leftGateLeaf.position.set(-3.25, 0, gateZ);
    leftGateLeaf.rotation.y = 0.22;
    courtGroup.add(leftGateLeaf);

    // Cánh cổng sắt bên phải (BỊ HÚC BUNG BẢN LỀ, NGHIÊNG LỆCH MỞ TOANG VÀO SÂN)
    const rightGateHinge = new THREE.Group();
    rightGateHinge.position.set(3.25, 0, gateZ);
    rightGateHinge.rotation.y = 2.15; // Mở ngoác về phía trong sân
    rightGateHinge.rotation.z = -0.07; // Sập xệ bản lề
    const rightGateLeaf = createIronGateLeaf(3.25);
    rightGateHinge.add(rightGateLeaf);
    courtGroup.add(rightGateHinge);

    // Hàng rào sắt mũi giáo cũ kỹ chạy dọc mặt tiền sân (từ trụ cổng ra hai bên x = +-46)
    for (let fx = -44; fx <= 44; fx += 4.5) {
      if (Math.abs(fx) < 5.5) continue; // Chừa lối cổng chính
      // Tường đá chân rào thấp
      const lowWall = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.65, 0.45), mossyStoneMat);
      lowWall.position.set(fx, 0.325, gateZ);
      courtGroup.add(lowWall);

      // Khung rào sắt phía trên
      const railTop = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.07, 0.07), rustyIronMat);
      railTop.position.set(fx, 2.45, gateZ);
      courtGroup.add(railTop);

      for (let sb = -1.8; sb <= 1.8; sb += 0.45) {
        const picket = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.95, 6), rustyIronMat);
        picket.position.set(fx + sb, 1.55, gateZ);
        if (Math.random() < 0.18) picket.rotation.z = (Math.random() - 0.5) * 0.22; // Song sắt xiêu vẹo
        courtGroup.add(picket);
      }

      // Trụ đá ngăn cách mỗi nhịp rào
      const fencePost = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.8, 0.65), mossyStoneMat);
      fencePost.position.set(fx + 2.2, 1.4, gateZ);
      courtGroup.add(fencePost);
    }

    // 3. CỎ DẠI 3D MỌC UM TÙM HOANG PHẾ KHẮP SÂN (145+ 3D OVERGROWN WILD GRASS CLUSTERS)
    const grassColors = [0x1c2b14, 0x253318, 0x2e3015, 0x162410];
    const grassMats = grassColors.map(col => new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.9,
      side: THREE.DoubleSide
    }));

    for (let g = 0; g < 145; g++) {
      // Phân bố cỏ dại mọc dày hai bên lối đi, quanh đài phun nước, chân hàng rào và chân thềm biệt thự
      const gx = (Math.random() - 0.5) * 56;
      const gz = -46.5 - Math.random() * 15.5;
      // Chừa vệt lối đá chính giữa hơi thưa cỏ hơn một chút
      if (Math.abs(gx) < 1.1 && Math.random() < 0.6) continue;

      const tuft = new THREE.Group();
      tuft.position.set(gx, 0.01, gz);
      const mat = grassMats[g % grassMats.length];
      const bladeCount = 4 + (g % 4);

      for (let b = 0; b < bladeCount; b++) {
        const bladeH = 0.35 + Math.random() * 0.55;
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.08, bladeH, 4), mat);
        blade.position.set((Math.random() - 0.5) * 0.28, bladeH / 2, (Math.random() - 0.5) * 0.28);
        blade.rotation.x = (Math.random() - 0.5) * 0.45;
        blade.rotation.z = (Math.random() - 0.5) * 0.45;
        tuft.add(blade);
      }
      courtGroup.add(tuft);
    }

    // 4. ĐÀI PHUN NƯỚC ĐÁ CẨM THẠCH NỨT VỠ ĐỌNG MÁU ĐỎ THẪM (BLOOD-FILLED GOTHIC FOUNTAIN)
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(-6.8, 0, -52.8);

    // Thành bể đá bát giác rêu phong
    const basinWall = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.78, 8), mossyStoneMat);
    basinWall.position.y = 0.39;
    fountainGroup.add(basinWall);

    // Lòng bể chứa đầy nước mưa hòa lẫn máu đỏ sẫm
    const bloodBasin = new THREE.Mesh(new THREE.CircleGeometry(2.35, 12), bloodWaterMat);
    bloodBasin.rotation.x = -Math.PI / 2;
    bloodBasin.position.y = 0.79;
    fountainGroup.add(bloodBasin);

    // Trụ đá giữa đài phun nước bị gãy nghiêng
    const centerPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.58, 1.9, 8), darkStoneMat);
    centerPedestal.position.set(0, 1.1, 0);
    centerPedestal.rotation.z = 0.14;
    fountainGroup.add(centerPedestal);

    const upperBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.35, 0.35, 8), mossyStoneMat);
    upperBowl.position.set(0.18, 1.95, 0);
    upperBowl.rotation.z = 0.22;
    fountainGroup.add(upperBowl);

    // Vũng máu tràn qua vết nứt thành bể chảy xuống cỏ
    const fountainSpill = new THREE.Mesh(new THREE.CircleGeometry(1.45, 10), bloodWaterMat);
    fountainSpill.rotation.x = -Math.PI / 2;
    fountainSpill.position.set(2.2, 0.025, 0.8);
    fountainGroup.add(fountainSpill);

    courtGroup.add(fountainGroup);

    // 5. CHI TIẾT KINH DỊ THEO KỊCH BẢN: CHIẾC XE LĂN GỈ SÉT BỎ HOANG CỦA BÉ CHI & HOA PHỤC SINH ĐẪM MÁU
    const wheelchairGroup = new THREE.Group();
    wheelchairGroup.position.set(5.8, 0, -51.8);
    wheelchairGroup.rotation.y = -0.65;
    wheelchairGroup.rotation.z = 0.32; // Xe lăn bị đổ nghiêng trên bãi cỏ hoang

    // Hai bánh xe lớn có nan hoa gỉ sét
    [-0.32, 0.32].forEach(wx => {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 8, 18), rustyIronMat);
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(wx, 0.4, 0);
      wheelchairGroup.add(wheel);
    });
    // Ghế ngồi và lưng tựa da rách
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.06, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.9 })
    );
    seat.position.set(0, 0.45, 0.05);
    wheelchairGroup.add(seat);

    const chairBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.65, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.9 })
    );
    chairBack.position.set(0, 0.78, -0.2);
    wheelchairGroup.add(chairBack);
    courtGroup.add(wheelchairGroup);

    // Khóm Hoa Phục Sinh trắng muốt dị biến mọc trên vũng máu cạnh chiếc xe lăn
    for (let fl = 0; fl < 5; fl++) {
      const flowerStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.02, 0.38, 5),
        new THREE.MeshStandardMaterial({ color: 0x1f3318 })
      );
      const fx = 5.2 + (fl * 0.25);
      const fz = -51.2 + (fl % 2) * 0.3;
      flowerStem.position.set(fx, 0.19, fz);
      courtGroup.add(flowerStem);

      const whitePetal = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xf5f5ff })
      );
      whitePetal.scale.set(1.2, 0.55, 1.2);
      whitePetal.position.set(fx, 0.39, fz);
      courtGroup.add(whitePetal);

      const redCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xcc0011 })
      );
      redCore.position.set(fx, 0.42, fz);
      courtGroup.add(redCore);
    }

    // 6. THÙNG GỖ DƯỢC PHẨM NEXUS BỊ ĐẬP VỠ & LỒNG SẮT TREO TRÊN CÂY KHÔ TRONG SÂN
    const brokenCrate = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.65, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x4a301a, roughness: 0.9 })
    );
    brokenCrate.position.set(4.2, 0.32, -55.0);
    brokenCrate.rotation.set(0.12, 0.5, -0.18);
    courtGroup.add(brokenCrate);

    // Hai cây cổ thụ chết khô vặn vẹo trong sân cùng lồng sắt rỉ sét treo lơ lửng
    [[-12.5, -50.5], [13.2, -53.5]].forEach(([tx, tz], tIdx) => {
      const deadTrunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.65, 8.5, 7),
        new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.95 })
      );
      deadTrunk.position.set(tx, 4.2, tz);
      deadTrunk.rotation.z = tIdx === 0 ? -0.12 : 0.14;
      courtGroup.add(deadTrunk);

      const deadLimb = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.24, 4.2, 6),
        new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.95 })
      );
      deadLimb.position.set(tx + (tIdx === 0 ? 1.5 : -1.5), 6.2, tz);
      deadLimb.rotation.z = tIdx === 0 ? -1.1 : 1.1;
      courtGroup.add(deadLimb);

      // Lồng sắt tra tấn cổ treo đung đưa dưới cành cây khô
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2), rustyIronMat);
      const cageX = tx + (tIdx === 0 ? 2.4 : -2.4);
      chain.position.set(cageX, 4.8, tz);
      courtGroup.add(chain);

      const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 1.1, 8, 1, true), rustyIronMat);
      cage.position.set(cageX, 3.2, tz);
      courtGroup.add(cage);
    });

    this.scene.add(courtGroup);
  }

  buildMansionEntrance(x, y, z) {
    const mansion = new THREE.Group();
    mansion.position.set(x, y, z);

    // Vật liệu kiến trúc Gothic Cổ Kính & Rêu Phong
    const stoneWallMat = new THREE.MeshStandardMaterial({
      map: this.textures.stoneBrick,
      roughness: 0.86,
      metalness: 0.12
    });
    this.textures.stoneBrick.repeat.set(4, 3);

    const stoneTrimMat = new THREE.MeshStandardMaterial({
      map: this.textures.stone,
      roughness: 0.78
    });

    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x11131c,
      roughness: 0.82,
      metalness: 0.22
    });

    const windowMat = new THREE.MeshStandardMaterial({
      map: this.textures.gothicWindow,
      roughness: 0.28,
      metalness: 0.45
    });

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x18151c,
      metalness: 0.78,
      roughness: 0.42
    });

    const oldWoodPlankMat = new THREE.MeshStandardMaterial({
      color: 0x3b2616,
      roughness: 0.92
    });

    // =========================================================================
    // 1. TÒA NHÀ TRUNG TÂM CÓ KHOẢNG MỞ ĐẠI SẢNH THẬT 100% (TRUE HOLLOW FOYER OPENING)
    // Không bao giờ bị khối tường xám chắn ngang cửa chính!
    // =========================================================================
    // Khối hậu sảnh phía sau (từ z = -12.0 đến z = +6.0)
    const centerRearBody = new THREE.Mesh(new THREE.BoxGeometry(30, 20, 18), stoneWallMat);
    centerRearBody.position.set(0, 10, -3.0);
    centerRearBody.castShadow = true;
    centerRearBody.receiveShadow = true;
    mansion.add(centerRearBody);

    // Khối mặt tiền bên trái cửa chính (x: -15.0 đến -2.3, z: 6.0 đến 12.0)
    const frontLeftWall = new THREE.Mesh(new THREE.BoxGeometry(12.7, 20, 6.0), stoneWallMat);
    frontLeftWall.position.set(-8.65, 10, 9.0);
    frontLeftWall.castShadow = true;
    frontLeftWall.receiveShadow = true;
    mansion.add(frontLeftWall);

    // Khối mặt tiền bên phải cửa chính (x: +2.3 đến +15.0, z: 6.0 đến 12.0)
    const frontRightWall = new THREE.Mesh(new THREE.BoxGeometry(12.7, 20, 6.0), stoneWallMat);
    frontRightWall.position.set(8.65, 10, 9.0);
    frontRightWall.castShadow = true;
    frontRightWall.receiveShadow = true;
    mansion.add(frontRightWall);

    // Khối tường mặt tiền phía trên cổng vòm (x: -2.3 đến +2.3, y: 6.8 đến 20.0, z: 6.0 đến 12.0)
    const frontUpperWall = new THREE.Mesh(new THREE.BoxGeometry(4.6, 13.2, 6.0), stoneWallMat);
    frontUpperWall.position.set(0, 13.4, 9.0);
    frontUpperWall.castShadow = true;
    frontUpperWall.receiveShadow = true;
    mansion.add(frontUpperWall);

    // Phào chỉ đá cổ điển chạy ngang phân tầng (Cornices & Stringcourses)
    [6.9, 13.8, 19.8].forEach(cy => {
      const ledge = new THREE.Mesh(new THREE.BoxGeometry(30.6, 0.45, 24.6), stoneTrimMat);
      ledge.position.set(0, cy, 0);
      mansion.add(ledge);
    });

    // Đá ốp góc tường cổ kính (Corner Quoins)
    [-15.05, 15.05].forEach(qx => {
      for (let qy = 1.0; qy < 19.5; qy += 1.6) {
        const quoin = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.65), stoneTrimMat);
        quoin.position.set(qx, qy, 12.0);
        mansion.add(quoin);
      }
    });

    // Mái ngói Slate Mansard dốc đứng tòa trung tâm
    const centerRoof = new THREE.Mesh(new THREE.ConeGeometry(19, 10, 4), roofMat);
    centerRoof.position.set(0, 24.5, 0);
    centerRoof.rotation.y = Math.PI / 4;
    mansion.add(centerRoof);

    // THÁP CHUÔNG GOTHIC CAO VÚT Ở TRUNG TÂM (Tower Spire - Vút lên 36m)
    const spireTower = new THREE.Mesh(new THREE.BoxGeometry(6.5, 12, 6.5), stoneWallMat);
    spireTower.position.set(0, 25, 2.0);
    mansion.add(spireTower);

    const spireCone = new THREE.Mesh(new THREE.ConeGeometry(4.4, 14, 8), roofMat);
    spireCone.position.set(0, 36, 2.0);
    mansion.add(spireCone);

    const vane = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5), ironMat);
    vane.position.set(0, 43, 2.0);
    mansion.add(vane);

    // ========================================================
    // 2. GIAN CÁNH TRÁI & CÁNH PHẢI (WEST & EAST WINGS + TURRETS)
    // ========================================================
    [-22, 22].forEach((wx, wIdx) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(18, 16, 20), stoneWallMat);
      wing.position.set(wx, 8, 1);
      wing.castShadow = true;
      wing.receiveShadow = true;
      mansion.add(wing);

      const wingLedge = new THREE.Mesh(new THREE.BoxGeometry(18.5, 0.4, 20.5), stoneTrimMat);
      wingLedge.position.set(wx, 15.8, 1);
      mansion.add(wingLedge);

      const wingRoof = new THREE.Mesh(new THREE.ConeGeometry(13, 8, 4), roofMat);
      wingRoof.position.set(wx, 19.5, 1);
      wingRoof.rotation.y = Math.PI / 4;
      mansion.add(wingRoof);

      const tx = wIdx === 0 ? -30 : 30;
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 18, 8), stoneWallMat);
      turret.position.set(tx, 9, 10);
      mansion.add(turret);

      const turretCone = new THREE.Mesh(new THREE.ConeGeometry(3.1, 7.2, 8), roofMat);
      turretCone.position.set(tx, 21, 10);
      mansion.add(turretCone);
    });

    // 4 Ống khói gạch cao kiểu Victoria trên mái nhà
    [[-10, 24, -5], [10, 24, -5], [-24, 20, 2], [24, 20, 2]].forEach(([cx, cy, cz]) => {
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.5, 1.4), stoneWallMat);
      chimney.position.set(cx, cy, cz);
      mansion.add(chimney);
    });

    // =========================================================================
    // 3. BỆ HIÊN NHÀ THẤP CHÂN THỰC (CHỈ CAO 0.26M - DƯỚI ĐẦU GỐI NGƯỜI CHƠI!)
    // Và 2 bậc tam cấp thấp giúp người chơi bước lên hiên nhà cực kỳ tự nhiên!
    // =========================================================================
    // Sàn hiên đá (Cao đúng 0.26m thay vì 1.4m như cũ!)
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(22, 0.26, 6.6), stoneTrimMat);
    terrace.position.set(0, 0.13, 15.1); // Trải từ z = 11.8 đến z = 18.4 (world z = -63.2 đến -56.6)
    terrace.receiveShadow = true;
    mansion.add(terrace);

    // 2 Bậc thềm đá thấp nằm phía trước sàn hiên (không bị lọt vào trong khối hiên)
    const stepUpper = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.18, 0.55), stoneTrimMat);
    stepUpper.position.set(0, 0.09, 18.68); // World z = -56.32, cao 18cm
    stepUpper.receiveShadow = true;
    mansion.add(stepUpper);

    const stepLower = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.09, 0.55), stoneTrimMat);
    stepLower.position.set(0, 0.045, 19.22); // World z = -55.78, cao 9cm
    stepLower.receiveShadow = true;
    mansion.add(stepLower);

    // Lan can đá Gothic (Balustrade) hai bên hông thềm hiên (mặt trước mở thông thoáng)
    [-10.5, 10.5].forEach(bx => {
      const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.95, 6.2), stoneTrimMat);
      sideRail.position.set(bx, 0.26 + 0.475, 15.1);
      mansion.add(sideRail);

      // Trụ đá canh hiên kèm tượng Gargoyle cổ
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.25, 1.1), stoneTrimMat);
      pedestal.position.set(bx, 0.26 + 0.625, 18.0);
      mansion.add(pedestal);

      const gargoyle = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), stoneTrimMat);
      gargoyle.position.set(bx, 0.26 + 1.5, 18.0);
      mansion.add(gargoyle);
    });

    // 4 Cột Đá La Mã Fluted Khổng Lồ đặt trực tiếp trên bệ hiên 0.26m
    [-8.5, -3.9, 3.9, 8.5].forEach(colX => {
      const colBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 1.1), stoneTrimMat);
      colBase.position.set(colX, 0.26 + 0.275, 17.4);
      mansion.add(colBase);

      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 8.2, 14), stoneTrimMat);
      col.position.set(colX, 0.26 + 0.55 + 4.1, 17.4);
      col.castShadow = true;
      mansion.add(col);

      const colCap = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.65, 1.25), stoneTrimMat);
      colCap.position.set(colX, 0.26 + 8.85, 17.4);
      mansion.add(colCap);
    });

    // Mái vòm hiên tam giác kiểu Gothic (Pediment Tympanum)
    const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(21.5, 1.1, 7.2), stoneTrimMat);
    porticoRoof.position.set(0, 9.8, 15.2);
    mansion.add(porticoRoof);

    const pediment = new THREE.Mesh(new THREE.ConeGeometry(11.5, 4.2, 4), stoneTrimMat);
    pediment.position.set(0, 12.3, 16.5);
    pediment.rotation.y = Math.PI / 4;
    mansion.add(pediment);

    // =========================================================================
    // 4. CỔNG VÒM ĐÁ GOTHIC MỞ THÔNG & CỬA ĐÔI GỖ LIM CHẠM KHẮC (GRAND GOTHIC PORTAL)
    // =========================================================================
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0.26, 12.0); // Đặt chuẩn trên mặt sàn hiên y = 0.26m!

    // A. HAI TRỤ ĐÁ VÒM CỬA HAI BÊN (KHÔNG CHẮN GIỮA LỐI ĐI!)
    [-2.55, 2.55].forEach(jx => {
      const jambPillar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 6.8, 0.95), stoneTrimMat);
      jambPillar.position.set(jx, 3.4, 0.25);
      portalGroup.add(jambPillar);

      // Các cột tròn thanh mảnh chạm nổi hai bên cổng vòm (Clustered Colonnettes)
      [-0.28, 0.28].forEach(offset => {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 6.4, 10), stoneTrimMat);
        shaft.position.set(jx + offset, 3.3, 0.68);
        portalGroup.add(shaft);
      });
    });

    // B. TRÁN VÒM ĐÁ GOTHIC PHÍA TRÊN CỬA (ARCH LINTEL & TYMPANUM TRÊN CAO Y = 6.5M)
    const archLintel = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.85, 1.05), stoneTrimMat);
    archLintel.position.set(0, 6.65, 0.32);
    portalGroup.add(archLintel);

    const tympanum = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.35, 0.75, 16, 1, false, 0, Math.PI),
      stoneTrimMat
    );
    tympanum.rotation.z = Math.PI / 2;
    tympanum.rotation.y = Math.PI / 2;
    tympanum.position.set(0, 6.95, 0.35);
    portalGroup.add(tympanum);

    // Phù điêu Đầu Lâu & Huyết Quỷ ở tâm trán vòm trên cao
    const reliefCrest = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.48, 1),
      new THREE.MeshStandardMaterial({ color: 0x4a1215, roughness: 0.7 })
    );
    reliefCrest.position.set(0, 7.65, 0.78);
    portalGroup.add(reliefCrest);

    // C. KHÔNG GIAN ĐẠI SẢNH BÊN TRONG BIỆT THỰ (INTERIOR FOYER VISIBLE THROUGH AJAR DOOR)
    const foyerGroup = new THREE.Group();
    foyerGroup.position.set(0, 0.01, 0);

    // Sàn đá cẩm thạch đen bóng bên trong đại sảnh
    const foyerFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 6.2),
      new THREE.MeshStandardMaterial({ color: 0x100e14, roughness: 0.35, metalness: 0.25 })
    );
    foyerFloor.rotation.x = -Math.PI / 2;
    foyerFloor.position.set(0, 0.01, -3.0);
    foyerGroup.add(foyerFloor);

    // Thảm nhung đỏ thẫm hoàng gia trải từ bậc cửa dẫn sâu vào đại sảnh
    const redCarpet = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 6.8),
      new THREE.MeshStandardMaterial({ color: 0x68050d, roughness: 0.85 })
    );
    redCarpet.rotation.x = -Math.PI / 2;
    redCarpet.position.set(0, 0.02, -2.6);
    foyerGroup.add(redCarpet);

    // Tường gỗ lim ốp hai bên đại sảnh
    [-2.25, 2.25].forEach(fwx => {
      const foyerWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 6.6, 6.0),
        new THREE.MeshStandardMaterial({ color: 0x1c0f08, roughness: 0.8 })
      );
      foyerWall.position.set(fwx, 3.3, -3.0);
      foyerGroup.add(foyerWall);
    });

    // Trần đại sảnh & Đèn chùm nến Gothic tỏa ánh sáng vàng cam ấm áp lẫn ma mị ra cửa
    const foyerCeiling = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.2, 6.0),
      new THREE.MeshStandardMaterial({ color: 0x140b07 })
    );
    foyerCeiling.position.set(0, 6.5, -3.0);
    foyerGroup.add(foyerCeiling);

    const interiorChandelier = new THREE.PointLight(0xff8822, 5.2, 16, 1.2);
    interiorChandelier.position.set(0.4, 4.6, -2.2);
    foyerGroup.add(interiorChandelier);

    // Đèn nến lập lòe ngay ngưỡng cửa giúp cánh cửa gỗ lim luôn nổi bật rõ nét trong đêm
    const portalThresholdLight = new THREE.PointLight(0xff9933, 3.6, 11, 1.3);
    portalThresholdLight.position.set(0, 3.8, 1.8);
    portalGroup.add(portalThresholdLight);

    portalGroup.add(foyerGroup);

    // D. HAI CÁNH CỬA ĐÔI GỖ LIM CỔ KÍNH CHẠM KHẮC TINH XẢO (GRAND CARVED DOUBLE DOORS)
    const doorMat = new THREE.MeshStandardMaterial({
      map: this.textures.doorWood,
      roughness: 0.58,
      metalness: 0.18
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd8a23c,
      metalness: 0.85,
      roughness: 0.25
    });

    // 1) Cánh cửa bên trái (Đóng, rộng 2.15m, cao 6.2m, nằm nổi phía trước ở z = 0.22)
    const doorLGroup = new THREE.Group();
    doorLGroup.position.set(-1.08, 3.1, 0.22);

    const doorLMesh = new THREE.Mesh(new THREE.BoxGeometry(2.14, 6.2, 0.22), doorMat);
    doorLMesh.castShadow = true;
    doorLMesh.receiveShadow = true;
    doorLGroup.add(doorLMesh);

    // Khung phào chỉ gỗ nổi 3D và Tay nắm sư tử bằng đồng trên cánh trái
    const knockerRingL = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 10, 20), brassMat);
    knockerRingL.position.set(0.72, -0.45, 0.14);
    doorLGroup.add(knockerRingL);

    const knockerPlateL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 12), brassMat);
    knockerPlateL.rotation.x = Math.PI / 2;
    knockerPlateL.position.set(0.72, -0.28, 0.12);
    doorLGroup.add(knockerPlateL);

    portalGroup.add(doorLGroup);

    // 2) Cánh cửa bên phải (MỞ HÉ 38 ĐỘ VÀO TRONG SẢNH ĐỂ LỘ ÁNH ĐÈN & THẢM ĐỎ)
    const doorRHinge = new THREE.Group();
    doorRHinge.position.set(2.15, 3.1, 0.22); // Bản lề gắn ở mép phải (x = 2.15)
    doorRHinge.rotation.y = -0.66; // Xoay mở 38 độ vào trong đại sảnh

    const doorRMesh = new THREE.Mesh(new THREE.BoxGeometry(2.14, 6.2, 0.22), doorMat);
    doorRMesh.position.set(-1.07, 0, 0);
    doorRMesh.castShadow = true;
    doorRMesh.receiveShadow = true;
    doorRHinge.add(doorRMesh);

    const knockerRingR = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 10, 20), brassMat);
    knockerRingR.position.set(-1.78, -0.45, 0.14);
    doorRHinge.add(knockerRingR);

    const knockerPlateR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 12), brassMat);
    knockerPlateR.rotation.x = Math.PI / 2;
    knockerPlateR.position.set(-1.78, -0.28, 0.12);
    doorRHinge.add(knockerPlateR);

    portalGroup.add(doorRHinge);

    // 2 Đèn lồng sắt rèn kiểu Victoria treo hai bên cổng vòm chính
    [[-3.35, 0.75], [3.35, 0.75]].forEach(([lx, lz]) => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.65, 0.48), ironMat);
      bracket.position.set(lx, 4.4, lz - 0.2);
      portalGroup.add(bracket);

      const lanternFrame = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.9, 0.52), ironMat);
      lanternFrame.position.set(lx, 4.1, lz);
      portalGroup.add(lanternFrame);

      const lanternGlass = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.72, 0.38),
        new THREE.MeshBasicMaterial({ color: 0xffaa33 })
      );
      lanternGlass.position.set(lx, 4.1, lz);
      portalGroup.add(lanternGlass);
    });

    mansion.add(portalGroup);

    // =========================================================================
    // 5. HỆ THỐNG CỬA SỔ CŨ NÁT, KÍNH VỠ & ĐÓNG VÁN GỖ CHÉO KINH DỊ (BOARDED DILAPIDATED WINDOWS)
    // =========================================================================
    const windowPositions = [
      // Tầng 1 - Mặt tiền (Sẽ được đóng ván gỗ mục bịt chéo & chớp cửa gãy!)
      { pos: [-8.8, 3.8, 12.08], boarded: true },
      { pos: [8.8, 3.8, 12.08], boarded: true },
      { pos: [-18, 3.8, 11.08], boarded: true },
      { pos: [-25, 3.8, 11.08], boarded: false },
      { pos: [18, 3.8, 11.08], boarded: true },
      { pos: [25, 3.8, 11.08], boarded: false },
      // Tầng 2 - Mặt tiền
      { pos: [-8.8, 11.8, 12.08], boarded: false },
      { pos: [-3.8, 11.8, 12.08], boarded: true },
      { pos: [3.8, 11.8, 12.08], boarded: false },
      { pos: [8.8, 11.8, 12.08], boarded: false },
      { pos: [-18, 11.2, 11.08], boarded: false },
      { pos: [-25, 11.2, 11.08], boarded: true },
      { pos: [18, 11.2, 11.08], boarded: false },
      { pos: [25, 11.2, 11.08], boarded: false },
      // Cửa sổ hông trái & phải
      { pos: [-31.08, 7.2, 0], boarded: true },
      { pos: [-31.08, 13.2, 0], boarded: false },
      { pos: [31.08, 7.2, 0], boarded: true },
      { pos: [31.08, 13.2, 0], boarded: false },
      // Cửa sổ mặt sau
      { pos: [-10, 8.2, -12.08], boarded: true },
      { pos: [0, 8.2, -12.08], boarded: false },
      { pos: [10, 8.2, -12.08], boarded: true }
    ];

    windowPositions.forEach(({ pos: [wx, wy, wz], boarded }, idx) => {
      const winGroup = new THREE.Group();
      winGroup.position.set(wx, wy, wz);
      if (Math.abs(wx) > 30) {
        winGroup.rotation.y = wx < 0 ? -Math.PI / 2 : Math.PI / 2;
      } else if (wz < -10) {
        winGroup.rotation.y = Math.PI;
      }

      // Mặt kính cửa sổ nứt vỡ + rèm nhung đỏ rách
      const winPane = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.8), windowMat);
      winGroup.add(winPane);

      // Bệ đá dưới cửa sổ & Đầu vòm đá cổ phía trên (Window Sill & Lintel Hood)
      const sill = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.22, 0.35), stoneTrimMat);
      sill.position.set(0, -1.95, 0.12);
      winGroup.add(sill);

      const hood = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.32, 0.38), stoneTrimMat);
      hood.position.set(0, 1.98, 0.12);
      winGroup.add(hood);

      // Cánh cửa chớp gỗ mục (1 bên rơi mất hoặc treo lủng lẳng nghiêng lệch)
      const shutterL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.6, 0.08), oldWoodPlankMat);
      shutterL.position.set(-1.32, 0, 0.08);
      shutterL.rotation.z = (idx % 2 === 0) ? 0.09 : -0.14;
      winGroup.add(shutterL);

      // Các tấm ván gỗ đóng đinh chéo bịt kín cửa sổ cũ nát
      if (boarded) {
        [-0.95, 0.15, 1.05].forEach((py, pIdx) => {
          const plank = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.24, 0.07), oldWoodPlankMat);
          plank.position.set(0, py, 0.12 + pIdx * 0.02);
          plank.rotation.z = (pIdx === 1) ? -0.22 : 0.16;
          winGroup.add(plank);
        });
      }

      mansion.add(winGroup);
    });

    // Ánh nến lập lòe hắt ra từ các cửa sổ tầng lầu
    const candleLight1 = new THREE.PointLight(0xff7722, 2.5, 16);
    candleLight1.position.set(-8.8, 12.2, 14);
    mansion.add(candleLight1);

    const candleLight2 = new THREE.PointLight(0xff7722, 2.5, 16);
    candleLight2.position.set(8.8, 12.2, 14);
    mansion.add(candleLight2);

    // ========================================================
    // 6. KHUÔN VIÊN XUNG QUANH: NGHĨA ĐỊA GIA TỘC & NHÀ KÍNH HOA PHỤC SINH
    // ========================================================
    const graveMat = new THREE.MeshStandardMaterial({ map: this.textures.stone, roughness: 0.95 });
    for (let g = 0; g < 8; g++) {
      const gx = -35 - (g % 3) * 2.8;
      const gz = -4 + g * 3.5;

      const tombstone = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.45, 0.25), graveMat);
      tombstone.position.set(gx, 0.72, gz);
      tombstone.rotation.y = (Math.random() - 0.5) * 0.4;
      tombstone.rotation.z = (Math.random() - 0.5) * 0.18;
      mansion.add(tombstone);

      if (g % 2 === 0) {
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.08), ironMat);
        crossV.position.set(gx + 1.2, 0.8, gz);
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.08), ironMat);
        crossH.position.set(gx + 1.2, 1.2, gz);
        mansion.add(crossV);
        mansion.add(crossH);
      }
    }

    const deadTree = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.9, 9, 7),
      new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.95 })
    );
    deadTree.position.set(-39, 4.5, 6);
    deadTree.rotation.z = 0.2;
    mansion.add(deadTree);

    // Nhà kính trồng Hoa Phục Sinh bị vỡ nát ở cánh Đông (East Conservatory)
    const consFrame = new THREE.Mesh(new THREE.BoxGeometry(10, 5.5, 8), ironMat);
    consFrame.position.set(38, 2.75, 0);
    mansion.add(consFrame);

    // Cửa hầm đá phía sau biệt thự
    const cellarDoor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 3.2), ironMat);
    cellarDoor.position.set(0, 0.4, -14.5);
    cellarDoor.rotation.x = 0.35;
    mansion.add(cellarDoor);

    // Hàng rào sắt Gothic bao quanh hai bên hông khuôn viên biệt thự
    for (let fz = -18; fz <= 26; fz += 5.5) {
      const fenceL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 5.2), ironMat);
      fenceL.position.set(-46, 1.1, fz);
      mansion.add(fenceL);

      const fenceR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 5.2), ironMat);
      fenceR.position.set(46, 1.1, fz);
      mansion.add(fenceR);

      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.5, 0.7), stoneTrimMat);
      postL.position.set(-46, 1.25, fz + 2.6);
      mansion.add(postL);

      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.5, 0.7), stoneTrimMat);
      postR.position.set(46, 1.25, fz + 2.6);
      mansion.add(postR);
    }

    this.scene.add(mansion);
    this.mansionGroup = mansion;
  }

  // DỰNG CON DAO GĂM TRÊN TAY NGƯỜI CHƠI (FPS KNIFE VIEWMODEL)
  buildFirstPersonKnife() {
    this.fpsKnife = new THREE.Group();
    this.fpsKnife.position.set(0.32, -0.26, -0.52);
    this.fpsKnife.rotation.set(-0.25, 0.45, -0.35);
    this.fpsKnife.visible = false; // Ẩn khi chưa nhặt dao

    this.isSlashing = false;
    this.slashTimer = 0;

    // Lưỡi dao thép sáng loáng
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xf0f4f8,
      metalness: 0.95,
      roughness: 0.12
    });
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.38, 0.075), bladeMat);
    blade.position.set(0, 0.19, 0);
    this.fpsKnife.add(blade);

    // Mũi dao nhọn vát sắc
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 4), bladeMat);
    tip.position.set(0, 0.44, 0);
    tip.rotation.y = Math.PI / 4;
    this.fpsKnife.add(tip);

    // Răng cưa lưng dao
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xccd6e0, metalness: 0.9 });
    for (let s = 0; s < 4; s++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.028, 4), toothMat);
      tooth.position.set(0, 0.1 + s * 0.06, -0.04);
      tooth.rotation.x = -Math.PI / 2;
      this.fpsKnife.add(tooth);
    }

    // Chốt bảo vệ tay (Crossguard) bằng đồng
    const guardMat = new THREE.MeshStandardMaterial({ color: 0xc9933b, metalness: 0.8, roughness: 0.25 });
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.025, 0.15), guardMat);
    guard.position.set(0, 0.0, 0);
    this.fpsKnife.add(guard);

    // Chuôi dao bọc da đen có rãnh bám
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x16141a, roughness: 0.85 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.2, 12), handleMat);
    handle.position.set(0, -0.1, 0);
    this.fpsKnife.add(handle);

    // Chuôi đồng đáy
    const pommel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.035, 12), guardMat);
    pommel.position.set(0, -0.21, 0);
    this.fpsKnife.add(pommel);

    // Gắn trực tiếp vào Camera để luôn hiển thị trước mắt người chơi
    this.camera.add(this.fpsKnife);
    this.scene.add(this.camera);
  }

  // Hành động vung dao chém (Knife Slash Attack)
  slashKnife() {
    if (!this.hasKnife || this.isSlashing) return;
    this.isSlashing = true;
    this.slashTimer = 0;
    audioManager.playKnifeSlash();
  }

  setupInteractions() {
    this.interactables = [
      // 1. Kiểm tra Cabin & Thùng Xe Tải Nexus
      {
        pos: new THREE.Vector3(1.2, 1.4, -10.5),
        radius: 4.5,
        prompt: "⚜ [E] Khảo sát hiện trường xe giao hàng Nexus gặp nạn",
        action: () => {
          this.hasInspectedTruck = true;
          audioManager.playClick();
          this.showMonologue("An: 'Tài xế đã biến mất... Thùng xe Nexus mở toang, hàng hóa vương vãi và có vệt máu tươi kéo dài vào con đường mòn trong rừng!'", 6500);
        }
      },
      // 2. Rút Dao Găm trên Thân Cây
      {
        pos: new THREE.Vector3(-2.0, 1.4, -29.2),
        radius: 3.2,
        prompt: () => this.hasKnife ? null : "⚜ [E] Rút cây dao găm sinh tồn",
        action: () => {
          if (this.hasKnife) return;
          this.hasKnife = true;
          audioManager.playPickup();
          if (this.knifeObject) this.knifeObject.visible = false;
          if (this.fpsKnife) this.fpsKnife.visible = true; // HIỆN DAO TRÊN TAY NGƯỜI CHƠI!
          this.slotKnifeEl.textContent = "⚜ 🗡 DAO GĂM TRÊN TAY [CLICK: CHÉM]";
          this.slotKnifeEl.classList.add('active');
          this.showMonologue("An: 'Một con dao đi rừng sắc bén dính máu. Mình có thể click chuột trái để vung dao tự vệ!'", 6500);
        }
      },
      // 3. Mở Băng Ghi Hình Máy Quay (VHS Player)
      {
        pos: new THREE.Vector3(-1.0, 0.8, -28.2),
        radius: 3.2,
        prompt: "⚜ [E] Mở xem đoạn băng ghi hình trong máy quay",
        action: () => {
          this.isViewingVHS = true;
          document.exitPointerLock?.();
          new VHSPlayer(() => {
            this.isViewingVHS = false;
            this.hasWatchedVideo = true;
            this.showMonologue("An: 'Trời đất ơi... Sinh vật bóng đen mắt đỏ đó... Nó vừa tha người qua cánh cổng sắt rỉ sét vào căn biệt thự bỏ hoang phía trước!'", 7500);
          });
        }
      },
      // 4. Khảo sát Chiếc Xe Lăn Cũ & Hoa Phục Sinh Trong Sân Biệt Thự
      {
        pos: new THREE.Vector3(5.8, 1.2, -51.8),
        radius: 3.8,
        prompt: "⚜ [E] Kiểm tra chiếc xe lăn gỉ sét & đóa hoa trắng kỳ dị",
        action: () => {
          audioManager.playClick();
          this.showMonologue("An: 'Một chiếc xe lăn trẻ em gỉ sét bị bỏ lại giữa sân cỏ hoang... Cạnh bên là những bông hoa trắng muốt mọc lên từ vũng máu đỏ thẫm!'", 7000);
        }
      },
      // 5. Bước vào Biệt Thự Huyết Quỷ
      {
        pos: new THREE.Vector3(0, 1.9, -62.8),
        radius: 4.8,
        prompt: "⚜ [E] Bước qua cánh cửa gỗ lim vào Đại Sảnh Biệt Thự",
        action: () => {
          this.completeChapter1();
        }
      }
    ];
  }

  completeChapter1() {
    audioManager.playDramaticImpact();
    document.exitPointerLock?.();
    this.storyModalEl.style.display = 'flex';
    this.modalTitleEl.textContent = "🩸 ĐÃ BƯỚC VÀO CĂN BIỆT THỰ HUYẾT QUỶ";
    this.modalBodyEl.innerHTML = `
      <p style="font-size: 1.35rem; color: #fff; margin-bottom: 12px;">
        An hít một hơi thật sâu, bước lên bậc thềm đá thấp và lách qua cánh cửa gỗ lim chạm khắc cổ kính đang hé mở để tiến vào đại sảnh.
      </p>
      <p style="font-size: 1.35rem; color: #d1d5db; margin-bottom: 12px;">
        Cánh cửa khép sầm lại sau lưng: <em>"RẦM!"</em>. Mùi máu tanh nồng bốc lên từ hành lang thảm đỏ tối đen. Tiếng kêu cứu thảm thiết của anh shipper Phúc vọng ra từ tầng hầm nghiên cứu của Bác sĩ Bình...
      </p>
      <div style="background: rgba(139, 0, 0, 0.3); border: 2px solid #ff2a2a; padding: 14px; margin: 15px 0;">
        <h3 style="color: #ff2a2a; font-family: 'Press Start 2P', cursive; font-size: 0.9rem; margin-bottom: 8px;">
          HOÀN THÀNH CHẶNG 1: CON ĐƯỜNG MÒN RỪNG CẤM
        </h3>
        <p style="color: #ffd166; font-size: 1.25rem;">
          Bạn đã trải nghiệm trọn vẹn: Khảo sát hiện trường xe tải Nexus, xem đoạn băng ghi hình máy quay, nhặt dao găm tự vệ, vượt qua cổng sắt rỉ sét và bước vào Căn Biệt Thự Huyết Quỷ!
        </p>
      </div>
    `;
    this.modalBtnEl.textContent = "QUAY LẠI MENU CHÍNH";
    this.modalBtnEl.onclick = () => {
      this.destroy();
      if (this.onReturnToMenu) this.onReturnToMenu();
    };
  }

  setupControls() {
    this.onKeyDown = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        this.togglePauseMenu();
        return;
      }

      if (this.isPaused || this.isViewingVHS || (this.storyModalEl && this.storyModalEl.style.display === 'flex')) {
        return;
      }

      this.keys[e.code] = true;

      if (e.code === 'KeyF') {
        this.isFlashlightOn = !this.isFlashlightOn;
        this.flashlight.visible = this.isFlashlightOn;
        audioManager.playFlashlightToggle();
        if (this.isFlashlightOn) {
          this.slotFlashlightEl.classList.add('active');
          this.slotFlashlightEl.textContent = "⚜ 🔦 ĐÈN PIN [F: BẬT]";
        } else {
          this.slotFlashlightEl.classList.remove('active');
          this.slotFlashlightEl.textContent = "⚜ 🔦 ĐÈN PIN [F: TẮT]";
        }
      }

      // Tuyệt đối không cho bấm phím C đổi chế độ trong lúc chơi theo yêu cầu!

      if (e.code === 'Space') {
        const now = performance.now();
        const doubleTap = (now - this.lastSpacePressTime < 350);
        this.lastSpacePressTime = now;

        // Double-tap Space ở chế độ Sáng Tạo: Bật / Tắt chế độ Bay như Minecraft
        if (this.mode === 'creative' && doubleTap) {
          this.isFlying = !this.isFlying;
          this.updateModeUI();
          if (this.isFlying) {
            this.verticalVelocity = 0;
            audioManager.playJump();
            this.showMonologue("🕊 ĐÃ BẬT CHẾ ĐỘ BAY! Dùng [SPACE] bay lên cao, [SHIFT] bay xuống, nhấp [SPACE x2] liên tục để RƠI TỰ DO.", 5000);
          } else {
            audioManager.playFootstepMud();
            this.showMonologue("🪂 ĐÃ TẮT BAY - RƠI TỰ DO!", 2500);
          }
          return;
        }

        // Nhảy khi đứng trên mặt đất
        if (!this.isFlying && this.isGrounded) {
          this.verticalVelocity = 6.8;
          this.isGrounded = false;
          audioManager.playJump();
        }
      }

      if (e.code === 'KeyE') {
        if (this.activeInteractable) {
          this.activeInteractable.action();
        }
      }
    };

    this.onKeyUp = (e) => {
      this.keys[e.code] = false;
    };

    this.onPointerLockChange = () => {
      if (document.pointerLockElement === this.canvas) {
        this.hasLockedOnce = true;
        if (this.isPaused) {
          this.pauseModalEl.style.display = 'none';
          this.isPaused = false;
        }
      } else {
        // Khi người chơi nhấn ESC thoát khóa chuột -> Mở ngay Menu Tạm Dừng
        if (this.hasLockedOnce && !this.isViewingVHS && (!this.storyModalEl || this.storyModalEl.style.display === 'none')) {
          this.togglePauseMenu(true);
        }
      }
    };

    this.onMouseMove = (e) => {
      if (this.isPaused) return;
      if (document.pointerLockElement === this.canvas) {
        const sensitivity = 0.0022;
        this.cameraRotation.yaw -= e.movementX * sensitivity;
        this.cameraRotation.pitch -= e.movementY * sensitivity;
        this.cameraRotation.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.cameraRotation.pitch));

        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.cameraRotation.yaw;
        this.camera.rotation.x = this.cameraRotation.pitch;
      }
    };

    this.onCanvasClick = (e) => {
      if (this.isPaused || this.isViewingVHS) return;
      if (document.pointerLockElement !== this.canvas) {
        this.canvas.requestPointerLock();
      } else {
        // Nếu đã khóa chuột và click chuột trái -> Vung dao chém
        if (e.button === 0 && this.hasKnife) {
          this.slashKnife();
        }
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('click', this.onCanvasClick);
    window.addEventListener('mousedown', (e) => {
      if (!this.isPaused && document.pointerLockElement === this.canvas && e.button === 0 && this.hasKnife) {
        this.slashKnife();
      }
    });

    this.onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this.onResize);
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    document.exitPointerLock?.();
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
  }

  // Tính toán cao độ mặt đất tự nhiên và bệ hiên thấp 0.26m của Biệt Thự Huyết Quỷ
  getGroundElevation(x, z) {
    // Bệ hiên nhà rộng x: [-11.0, 11.0], cao đúng 0.26m (thấp dưới đầu gối, rất dễ bước lên!)
    if (Math.abs(x) <= 11.0) {
      if (z <= -56.6 && z >= -68.5) {
        return 0.26;
      }
      if (z > -56.6 && z <= -55.4) {
        // Bước mượt mà qua 2 bậc thềm thấp (từ z = -55.4 -> y = 0.0 lên z = -56.6 -> y = 0.26)
        const t = (-55.4 - z) / (-56.6 - (-55.4));
        return THREE.MathUtils.clamp(t, 0, 1) * 0.26;
      }
    }
    return 0.0; // Mặt đất tự nhiên
  }

  updatePlayer(delta) {
    if (this.isPaused) return;
    const currentGroundY = this.getGroundElevation(this.camera.position.x, this.camera.position.z);
    const naturalEyeY = currentGroundY + 1.68; // Chiều cao tầm mắt người chơi 1.68m (cao gấp 6.5 lần bệ hiên 0.26m!)

    if (this.isFlying) {
      // ==========================================
      // CHẾ ĐỘ BAY LƯỢN SÁNG TẠO (CREATIVE FLIGHT)
      // ==========================================
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const flySpeed = (this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 22.0 : 12.0);
      const flyMove = new THREE.Vector3();

      if (this.keys['KeyW'] || this.keys['ArrowUp']) flyMove.add(forward);
      if (this.keys['KeyS'] || this.keys['ArrowDown']) flyMove.sub(forward);
      if (this.keys['KeyD'] || this.keys['ArrowRight']) flyMove.add(right);
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) flyMove.sub(right);

      // Phím Space để bay lên cao
      if (this.keys['Space']) flyMove.y += 1.0;
      // Phím Shift hoặc KeyQ để hạ độ cao xuống
      if (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyQ']) flyMove.y -= 1.0;

      if (flyMove.lengthSq() > 0) {
        flyMove.normalize();
        this.camera.position.addScaledVector(flyMove, flySpeed * delta);
      }

      // Giới hạn độ cao khi bay (không chìm xuống dưới sàn hiên)
      this.camera.position.y = Math.max(naturalEyeY, Math.min(55, this.camera.position.y));

    } else {
      // ==========================================
      // DI CHUYỂN DƯỚI ĐẤT & NHẢY TRỌNG LỰC (GROUND & JUMP)
      // ==========================================
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotation.yaw);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotation.yaw);

      const isRunning = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
      const currentSpeed = isRunning ? this.moveSpeed * 1.65 : this.moveSpeed;

      const moveVector = new THREE.Vector3();
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveVector.add(forward);
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveVector.sub(forward);
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveVector.add(right);
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveVector.sub(right);

      if (moveVector.lengthSq() > 0) {
        moveVector.normalize();
        this.camera.position.addScaledVector(moveVector, currentSpeed * delta);

        // Hiệu ứng nhấp nhô bước chân (chỉ khi chạm đất)
        if (this.isGrounded) {
          this.headBobTimer += delta * (isRunning ? 13 : 8.5);
          this.camera.position.y = naturalEyeY + Math.sin(this.headBobTimer) * 0.055;

          this.stepTimer += delta;
          if (this.stepTimer > (isRunning ? 0.32 : 0.48)) {
            if (currentGroundY > 0.5) {
              audioManager.playClick();
            } else {
              audioManager.playFootstepMud();
            }
            this.stepTimer = 0;
          }
        }
      }

      // Xử lý Trọng lực & Rơi tự do (Gravity)
      this.verticalVelocity -= 18.0 * delta;
      this.camera.position.y += this.verticalVelocity * delta;

      // Va chạm mặt sàn (Ground / Porch Floor Collision)
      if (this.camera.position.y <= naturalEyeY) {
        if (!this.isGrounded && this.verticalVelocity < -3.0) {
          if (currentGroundY > 0.5) {
            audioManager.playClick();
          } else {
            audioManager.playFootstepMud();
          }
        }
        this.camera.position.y = naturalEyeY;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // Giới hạn không gian di chuyển rộng lớn để người chơi có thể đi xung quanh cả trước, sau, trái, phải biệt thự!
    this.camera.position.x = Math.max(-45, Math.min(45, this.camera.position.x));
    this.camera.position.z = Math.max(-105, Math.min(12, this.camera.position.z));

    // Va chạm với các bức tường kiên cố của Biệt Thự (Mansion Wall Collisions - khi ở độ cao thấp)
    if (this.camera.position.y < 16.0) {
      // 1. Tòa nhà trung tâm (x: -15 to 15, z: -87 to -63)
      // Thềm hiên cho phép người chơi đi đến z = -63.2. Cửa chính ở x: [-2.0, 2.0] cho phép bước vào đến z = -64.2!
      const isAtDoorway = Math.abs(this.camera.position.x) <= 2.0;
      const frontWallZ = isAtDoorway ? -64.2 : -63.2;

      if (this.camera.position.x > -15 && this.camera.position.x < 15 &&
          this.camera.position.z > -87 && this.camera.position.z < frontWallZ) {
        const dNorth = Math.abs(this.camera.position.z - (-87));
        const dSouth = Math.abs(this.camera.position.z - frontWallZ);
        const dWest = Math.abs(this.camera.position.x - (-15));
        const dEast = Math.abs(this.camera.position.x - 15);
        const minD = Math.min(dNorth, dSouth, dWest, dEast);
        if (minD === dSouth) this.camera.position.z = frontWallZ;
        else if (minD === dNorth) this.camera.position.z = -87;
        else if (minD === dWest) this.camera.position.x = -15;
        else if (minD === dEast) this.camera.position.x = 15;
      }

      // 2. Cánh trái (x: -31 to -13, z: -85 to -65)
      if (this.camera.position.x > -31 && this.camera.position.x < -13 &&
          this.camera.position.z > -85 && this.camera.position.z < -65) {
        if (this.camera.position.x < -22) this.camera.position.x = -31;
        else if (this.camera.position.z > -75) this.camera.position.z = -65;
        else this.camera.position.z = -85;
      }

      // 3. Cánh phải (x: 13 to 31, z: -85 to -65)
      if (this.camera.position.x > 13 && this.camera.position.x < 31 &&
          this.camera.position.z > -85 && this.camera.position.z < -65) {
        if (this.camera.position.x > 22) this.camera.position.x = 31;
        else if (this.camera.position.z > -75) this.camera.position.z = -65;
        else this.camera.position.z = -85;
      }
    }

    // Đèn pin di chuyển mượt mà có quán tính tay cầm
    this.flashlight.position.copy(this.camera.position);
    const targetDir = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation);
    this.flashlightTargetPos.lerp(this.camera.position.clone().add(targetDir), 0.25);
    this.flashlightTarget.position.copy(this.flashlightTargetPos);

    // CẬP NHẬT HOẠT ẢNH DAO TRÊN TAY (FPS KNIFE SWAY & SLASH ATTACK)
    if (this.hasKnife && this.fpsKnife && this.fpsKnife.visible) {
      if (this.isSlashing) {
        this.slashTimer += delta * 7.5;
        if (this.slashTimer > Math.PI) {
          this.isSlashing = false;
          this.slashTimer = 0;
        }
        const s = Math.sin(this.slashTimer);
        // Vung dao chém chéo xuống phía trước
        this.fpsKnife.position.set(0.32 - s * 0.22, -0.26 - s * 0.15, -0.52 - s * 0.18);
        this.fpsKnife.rotation.set(-0.25 + s * 0.85, 0.45 - s * 1.2, -0.35 - s * 0.4);
      } else {
        // Nhịp thở & Lắc lư khi bước chân đi bộ
        const swayX = Math.cos(this.headBobTimer * 0.5) * 0.015;
        const swayY = Math.sin(this.headBobTimer) * 0.018;
        this.fpsKnife.position.set(0.32 + swayX, -0.26 + swayY, -0.52);
        this.fpsKnife.rotation.set(-0.25, 0.45 + swayX * 2, -0.35);
      }
    }
  }

  checkInteractions() {
    this.activeInteractable = null;
    let closestDist = Infinity;
    const playerPos = this.camera.position;

    for (let item of this.interactables) {
      const dist = playerPos.distanceTo(item.pos);
      if (dist < item.radius && dist < closestDist) {
        const text = typeof item.prompt === 'function' ? item.prompt() : item.prompt;
        if (text) {
          closestDist = dist;
          this.activeInteractable = item;
          this.promptEl.textContent = text;
          this.promptEl.style.display = 'block';
          this.crosshairEl.style.color = '#ffd166';
        }
      }
    }

    if (!this.activeInteractable) {
      this.promptEl.style.display = 'none';
      this.crosshairEl.style.color = 'rgba(255, 255, 255, 0.75)';
    }
  }

  animate() {
    if (!this.isRunning) return;
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const now = Date.now();

    this.updatePlayer(delta);
    this.checkInteractions();

    // Hoạt ảnh còi xe cảnh sát tuần tra (Đỏ / Xanh đổi màu luân phiên)
    const sirenTime = now * 0.0075;
    this.sirenRed.intensity = Math.sin(sirenTime) > 0 ? 3.5 : 0;
    this.sirenBlue.intensity = Math.sin(sirenTime) <= 0 ? 3.5 : 0;

    // Hoạt ảnh đèn xi-nhan xe tải nhấp nháy
    this.truckHazard.intensity = Math.sin(now * 0.006) > 0 ? 4.0 : 0.2;

    // Đèn lồng sảnh biệt thự lập lòe
    const lanternInt = 3.5 + Math.sin(now * 0.01) * 0.8;
    if (this.mansionLanternL) this.mansionLanternL.intensity = lanternInt;
    if (this.mansionLanternR) this.mansionLanternR.intensity = lanternInt;

    // Khói đen bốc lên từ nắp ca-pô xe tải
    if (this.smokeNodes) {
      for (let i = 0; i < this.smokeNodes.length; i++) {
        const sm = this.smokeNodes[i];
        sm.position.y += delta * 0.85;
        sm.position.x += Math.sin(now * 0.003 + i) * 0.008;
        if (sm.position.y > 4.6) {
          sm.position.y = 1.4;
        }
      }
    }

    // Mưa rơi
    if (this.rainSystem) {
      const pos = this.rainSystem.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= delta * 25;
        if (pos[i] < 0) pos[i] = 28;
      }
      this.rainSystem.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

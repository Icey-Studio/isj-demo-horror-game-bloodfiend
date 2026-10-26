// Hoạt Cảnh Buồng Lái Xe Cảnh Sát 3D Chân Thực, Chi Tiết Cao & Sáng Rõ
import * as THREE from 'three';
import { audioManager } from './audio.js';

export class DrivingScene3D {
  constructor(canvas, onStepOutOfCar, onReturnToMenu) {
    this.canvas = canvas;
    this.onStepOutOfCar = onStepOutOfCar;
    this.onReturnToMenu = onReturnToMenu;
    this.isPaused = false;

    // Three.js Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b14);
    this.scene.fog = new THREE.FogExp2(0x070b14, 0.025);

    this.camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.05, 160);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    // VỊ TRÍ MẮT CỦA AN (Ngồi ghế lái bên trái, tầm nhìn tự nhiên qua vô lăng và kính chắn gió)
    this.camera.position.set(-0.36, 1.18, 0.28);
    this.camera.rotation.order = 'YXZ';
    this.targetRotation = { yaw: 0, pitch: -0.06 };
    this.currentRotation = { yaw: 0, pitch: -0.06 };

    // Tốc độ xe chạy
    this.carSpeed = 24.0;
    this.isStopping = false;

    // Hội thoại tự chạy (Auto-Advance) bám sát kịch bản gốc Bloodfiend
    this.dialogueIndex = 0;
    this.dialogueCharIndex = 0;
    this.dialogueTimer = 0;
    this.autoAdvanceDelay = 4.0;
    this.isFinishedDialogues = false;

    this.dialogues = [
      { speaker: "TỔNG ĐÀI ĐỒN", text: "Tuần tra số 7, đây là Tổng đài. An, ca trực đêm nay trên tuyến đường rừng thế nào rồi?" },
      { speaker: "AN", text: "Nghe rõ, Tổng đài. Tôi đang chạy dọc tuyến đường rừng quốc lộ cũ. Mưa bắt đầu nặng hạt hơn." },
      { speaker: "TỔNG ĐÀI ĐỒN", text: "Cơn bão đang đổ bộ đấy, sương mù dày đặc lắm. À mà An này, có một thông báo khẩn từ công ty giao hàng Nexus." },
      { speaker: "AN", text: "Công ty Nexus? Có chuyện gì vậy Tổng đài?" },
      { speaker: "TỔNG ĐÀI ĐỒN", text: "Một chiếc xe tải chở thuốc và vật tư định kỳ của họ vừa mất tín hiệu định vị ngay gần lối rẽ vào khu rừng già." },
      { speaker: "AN", text: "Giao thuốc giữa đêm bão trong rừng sâu sao? Đơn hàng đó gửi cho ai thế?" },
      { speaker: "TỔNG ĐÀI ĐỒN", text: "Gửi đến căn biệt thự biệt lập của gia đình Tiến sĩ Bình nằm sâu trong con đường mòn... nơi từng có nhiều lời đồn kỳ quái." },
      { speaker: "AN", text: "Biệt thự ông Bình? Khu nhà cổ bỏ hoang sâu trong đường mòn đó ư? Để tôi rọi đèn kiểm tra dọc bìa rừng." },
      { speaker: "TỔNG ĐÀI ĐỒN", text: "Thận trọng nhé An. Hai nhân viên giao hàng tên Phúc và Quyết đã không phản hồi bộ đàm suốt một giờ qua." },
      { speaker: "AN", text: "Rõ, tôi đang tiến tới khúc cua gần đầu con đường mòn dẫn vào rừng..." },
      { speaker: "AN (KINH NGẠC)", text: "Khoan đã!... Tổng đài, tôi thấy chiếc xe tải giao hàng Nexus rồi! Nó đâm gục bên đầu đường mòn, cửa thùng sau mở toang và đang bốc khói!" }
    ];

    // Tạo Textures thủ tục độ nét cao cho nội thất xe
    this.textures = this.createCockpitTextures();

    // Tạo UI & Menu Tạm Dừng [ESC]
    this.createUI();

    // Thiết lập ánh sáng & Dựng hình buồng lái + đường rừng
    this.setupLighting();
    this.buildRealisticCockpit();
    this.buildForestHighway();
    this.setupMouseLook();

    this.clock = new THREE.Clock();
    this.isRunning = true;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    audioManager.playRadioBeep();
  }

  // Tạo bộ Texture Canvas sắc nét cho Đồng hồ, Máy tính cảnh sát, Hồ sơ vụ án, Da ghế, Bàn phím & Súng
  createCockpitTextures() {
    // 1. Texture Da bọc ghế & Táp-lô (Stitched Dark Charcoal Leather)
    const leatherCanvas = document.createElement('canvas');
    leatherCanvas.width = 256;
    leatherCanvas.height = 256;
    const lCtx = leatherCanvas.getContext('2d');
    lCtx.fillStyle = '#1b1d24';
    lCtx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      lCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.08)';
      lCtx.fillRect(x, y, 2, 2);
    }
    // Đường chỉ khâu đôi màu xám bạc
    lCtx.strokeStyle = 'rgba(180, 190, 210, 0.25)';
    lCtx.setLineDash([6, 4]);
    lCtx.lineWidth = 2;
    lCtx.strokeRect(10, 10, 236, 236);
    const leatherTex = new THREE.CanvasTexture(leatherCanvas);
    leatherTex.wrapS = THREE.RepeatWrapping;
    leatherTex.wrapT = THREE.RepeatWrapping;

    // 2. Texture Cụm Đồng Hồ Công-Tơ-Mét Cảnh Sát (3 Đồng Hồ Analog & Màn Hình Số)
    const gaugeCanvas = document.createElement('canvas');
    gaugeCanvas.width = 1024;
    gaugeCanvas.height = 384;
    const gCtx = gaugeCanvas.getContext('2d');
    gCtx.fillStyle = '#05080f';
    gCtx.fillRect(0, 0, 1024, 384);

    // Viền хроm bao quanh 3 đồng hồ
    const drawDial = (cx, cy, r, title, unit, needleAngle, maxNum, step) => {
      // Nền mặt đồng hồ
      const grad = gCtx.createRadialGradient(cx, cy, 10, cx, cy, r);
      grad.addColorStop(0, '#0d1828');
      grad.addColorStop(0.85, '#060b14');
      grad.addColorStop(1, '#1e2c42');
      gCtx.fillStyle = grad;
      gCtx.beginPath();
      gCtx.arc(cx, cy, r, 0, Math.PI * 2);
      gCtx.fill();

      // Vòng vạch chia độ
      gCtx.strokeStyle = '#00f0ff';
      gCtx.lineWidth = 4;
      gCtx.beginPath();
      gCtx.arc(cx, cy, r - 10, Math.PI * 0.75, Math.PI * 2.25);
      gCtx.stroke();

      // Các vạch số
      const totalTicks = maxNum / step;
      for (let t = 0; t <= totalTicks; t++) {
        const ang = Math.PI * 0.75 + (t / totalTicks) * (Math.PI * 1.5);
        const x1 = cx + Math.cos(ang) * (r - 14);
        const y1 = cy + Math.sin(ang) * (r - 14);
        const x2 = cx + Math.cos(ang) * (r - 28);
        const y2 = cy + Math.sin(ang) * (r - 28);
        gCtx.strokeStyle = t >= totalTicks * 0.8 ? '#ff3344' : '#cceeff';
        gCtx.lineWidth = 3;
        gCtx.beginPath();
        gCtx.moveTo(x1, y1);
        gCtx.lineTo(x2, y2);
        gCtx.stroke();

        // Số đo
        const tx = cx + Math.cos(ang) * (r - 48);
        const ty = cy + Math.sin(ang) * (r - 48);
        gCtx.fillStyle = '#e2f4ff';
        gCtx.font = 'bold 20px monospace';
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'middle';
        gCtx.fillText(String(t * step), tx, ty);
      }

      // Nhãn đồng hồ
      gCtx.fillStyle = '#00f5d4';
      gCtx.font = 'bold 18px sans-serif';
      gCtx.fillText(title, cx, cy + 45);
      gCtx.fillStyle = '#7fa6c4';
      gCtx.font = '14px monospace';
      gCtx.fillText(unit, cx, cy + 68);

      // Kim đồng hồ phát sáng đỏ cam
      gCtx.strokeStyle = '#ff2a2a';
      gCtx.lineWidth = 6;
      gCtx.beginPath();
      gCtx.moveTo(cx, cy);
      gCtx.lineTo(cx + Math.cos(needleAngle) * (r - 26), cy + Math.sin(needleAngle) * (r - 26));
      gCtx.stroke();

      // Chốt tâm kim
      gCtx.fillStyle = '#d0d8e8';
      gCtx.beginPath();
      gCtx.arc(cx, cy, 12, 0, Math.PI * 2);
      gCtx.fill();
    };

    // Vẽ 3 đồng hồ: Vòng tua máy (RPM), Tốc độ (KM/H), Nhiệt độ & Xăng
    drawDial(210, 195, 145, 'TACHOMETER', 'x1000 RPM', Math.PI * 1.35, 8, 1);
    drawDial(512, 190, 165, 'PATROL INTERCEPTOR', '68 KM/H • [D]', Math.PI * 1.42, 160, 20);
    drawDial(814, 195, 145, 'FUEL / TEMP', 'FULL • 90°C', Math.PI * 1.65, 100, 25);

    // Màn hình ODO nhỏ ở giữa
    gCtx.fillStyle = '#081c24';
    gCtx.fillRect(442, 285, 140, 36);
    gCtx.strokeStyle = '#00f5d4';
    gCtx.lineWidth = 2;
    gCtx.strokeRect(442, 285, 140, 36);
    gCtx.fillStyle = '#00ffcc';
    gCtx.font = 'bold 18px monospace';
    gCtx.fillText('ODO 048291 KM', 512, 304);

    const gaugeTexture = new THREE.CanvasTexture(gaugeCanvas);

    // 3. Texture Màn hình Máy tính Cảnh sát MDT (Police CAD Dispatch & Radar)
    const mdtCanvas = document.createElement('canvas');
    mdtCanvas.width = 640;
    mdtCanvas.height = 420;
    const mCtx = mdtCanvas.getContext('2d');
    mCtx.fillStyle = '#04120c';
    mCtx.fillRect(0, 0, 640, 420);

    // Khung viền giao diện Cảnh sát
    mCtx.strokeStyle = '#00e676';
    mCtx.lineWidth = 3;
    mCtx.strokeRect(12, 12, 616, 396);
    mCtx.fillStyle = '#0a2e1c';
    mCtx.fillRect(14, 14, 612, 42);

    mCtx.fillStyle = '#00ff88';
    mCtx.font = 'bold 22px monospace';
    mCtx.fillText('★ HỆ THỐNG ĐIỀU ĐỘNG CẢNH SÁT - ĐƠN VỊ 07 ★', 28, 42);

    // Nội dung lệnh điều động bên trái
    mCtx.font = '18px monospace';
    mCtx.fillStyle = '#a5f3c8';
    mCtx.fillText('MÃ VỤ VIỆC : #NX-2026-884', 28, 90);
    mCtx.fillText('PHƯƠNG TIỆN: XE TẢI DƯỢC PHẨM NEXUS', 28, 122);
    mCtx.fillText('TÀI XẾ     : PHÚC & QUYẾT (MẤT LIÊN LẠC)', 28, 154);
    mCtx.fillText('ĐIỂM ĐẾN   : BIỆT THỰ ÔNG BÌNH (ĐƯỜNG MÒN)', 28, 186);
    mCtx.fillText('THỜI TIẾT  : BÃO CẤP 8 - SƯƠNG MÙ DÀY', 28, 218);

    // Cảnh báo đỏ
    mCtx.fillStyle = 'rgba(180, 20, 20, 0.35)';
    mCtx.fillRect(26, 245, 360, 68);
    mCtx.strokeStyle = '#ff3333';
    mCtx.strokeRect(26, 245, 360, 68);
    mCtx.fillStyle = '#ff4444';
    mCtx.font = 'bold 17px monospace';
    mCtx.fillText('⚠ CẢNH BÁO: KHU VỰC RỪNG CẤM', 38, 272);
    mCtx.fillText('TÍN HIỆU GPS CUỐI: CÁCH ĐÂY 200M', 38, 298);

    // Radar GPS bên phải màn hình
    const rx = 505, ry = 215, rr = 92;
    mCtx.strokeStyle = '#00e676';
    mCtx.lineWidth = 2;
    mCtx.beginPath();
    mCtx.arc(rx, ry, rr, 0, Math.PI * 2);
    mCtx.stroke();
    mCtx.beginPath();
    mCtx.arc(rx, ry, rr * 0.6, 0, Math.PI * 2);
    mCtx.stroke();
    mCtx.beginPath();
    mCtx.moveTo(rx - rr, ry); mCtx.lineTo(rx + rr, ry);
    mCtx.moveTo(rx, ry - rr); mCtx.lineTo(rx, ry + rr);
    mCtx.stroke();
    // Chấm đỏ vị trí xe Nexus mất tích
    mCtx.fillStyle = '#ff2222';
    mCtx.beginPath();
    mCtx.arc(rx + 25, ry - 35, 8, 0, Math.PI * 2);
    mCtx.fill();
    mCtx.fillStyle = '#ffffff';
    mCtx.font = '13px monospace';
    mCtx.fillText('NEXUS VAN', rx - 10, ry - 50);

    // Thanh trạng thái dưới cùng
    mCtx.fillStyle = '#00e676';
    mCtx.font = '16px monospace';
    mCtx.fillText('SĨ QUAN: AN | TRẠNG THÁI: ĐANG TIẾP CẬN HIỆN TRƯỜNG...', 28, 382);
    const mdtTexture = new THREE.CanvasTexture(mdtCanvas);

    // 4. Texture Bàn phím Laptop Quân Sự Có Đèn Nền (Backlit Keyboard)
    const kbCanvas = document.createElement('canvas');
    kbCanvas.width = 512;
    kbCanvas.height = 256;
    const kCtx = kbCanvas.getContext('2d');
    kCtx.fillStyle = '#12141a';
    kCtx.fillRect(0, 0, 512, 256);
    kCtx.strokeStyle = '#00e676';
    kCtx.lineWidth = 1.5;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 12; c++) {
        const kx = 24 + c * 39;
        const ky = 20 + r * 32;
        kCtx.fillStyle = '#1e222d';
        kCtx.fillRect(kx, ky, 34, 26);
        kCtx.strokeRect(kx, ky, 34, 26);
      }
    }
    // Touchpad
    kCtx.fillStyle = '#181b24';
    kCtx.fillRect(190, 190, 132, 54);
    kCtx.strokeStyle = '#445066';
    kCtx.strokeRect(190, 190, 132, 54);
    const kbTexture = new THREE.CanvasTexture(kbCanvas);

    // 5. Texture Hồ Sơ Vụ Án Trên Kẹp Giấy (Police Case File Document)
    const docCanvas = document.createElement('canvas');
    docCanvas.width = 512;
    docCanvas.height = 680;
    const dCtx = docCanvas.getContext('2d');
    dCtx.fillStyle = '#f2ead8';
    dCtx.fillRect(0, 0, 512, 680);
    // Tiêu đề hồ sơ
    dCtx.fillStyle = '#1a1a1a';
    dCtx.font = 'bold 26px serif';
    dCtx.fillText('CÔNG AN HUYỆN - ĐỘI TUẦN TRA', 40, 65);
    dCtx.font = 'bold 22px serif';
    dCtx.fillText('BIÊN BẢN TRỰC ĐÊM & TRUY TÌM', 40, 102);
    dCtx.fillRect(40, 118, 432, 4);

    dCtx.font = '19px monospace';
    dCtx.fillStyle = '#2b2b2b';
    dCtx.fillText('1. Phương tiện mất tích: Xe tải Nexus', 40, 165);
    dCtx.fillText('2. Nhân sự: Phúc & Quyết (Shipper)', 40, 200);
    dCtx.fillText('3. Khu vực: Đường mòn Biệt thự ông Bình', 40, 235);
    dCtx.fillText('4. Ghi chú: Có nhiều báo cáo về tiếng', 40, 270);
    dCtx.fillText('   thét lạ và thú dữ quanh rừng cấm.', 40, 300);

    // Kẻ dòng biên bản
    dCtx.strokeStyle = 'rgba(0,0,0,0.18)';
    dCtx.lineWidth = 2;
    for (let y = 350; y < 560; y += 34) {
      dCtx.beginPath();
      dCtx.moveTo(40, y);
      dCtx.lineTo(472, y);
      dCtx.stroke();
    }

    // Dấu mộc đỏ KHẨN CẤP
    dCtx.save();
    dCtx.translate(340, 480);
    dCtx.rotate(-0.22);
    dCtx.strokeStyle = '#b81d1d';
    dCtx.lineWidth = 5;
    dCtx.strokeRect(-95, -32, 190, 64);
    dCtx.fillStyle = '#b81d1d';
    dCtx.font = 'bold 28px sans-serif';
    dCtx.textAlign = 'center';
    dCtx.fillText('KHẨN CẤP', 0, 10);
    dCtx.restore();

    const docTexture = new THREE.CanvasTexture(docCanvas);

    // 6. Texture Khẩu Súng Lục Cảnh Sát (Brushed Steel Slide with Serrations)
    const slideCanvas = document.createElement('canvas');
    slideCanvas.width = 512;
    slideCanvas.height = 128;
    const sCtx = slideCanvas.getContext('2d');
    const sGrad = sCtx.createLinearGradient(0, 0, 0, 128);
    sGrad.addColorStop(0, '#5a6578');
    sGrad.addColorStop(0.5, '#3b4352');
    sGrad.addColorStop(1, '#252a34');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 512, 128);
    // Rãnh kéo khóa nòng (Slide Serrations)
    sCtx.fillStyle = '#15181f';
    for (let i = 0; i < 9; i++) {
      sCtx.fillRect(60 + i * 16, 20, 8, 88);
    }
    // Cửa thoát vỏ đạn (Ejection port)
    sCtx.fillStyle = '#8894a8';
    sCtx.fillRect(260, 18, 95, 48);
    // Chữ khắc trên thân súng
    sCtx.fillStyle = '#c8d4e6';
    sCtx.font = 'bold 20px monospace';
    sCtx.fillText('POLICE ISSUE 9x19mm', 230, 96);
    const gunSlideTex = new THREE.CanvasTexture(slideCanvas);

    // 7. Texture Huy Hiệu Cảnh Sát Ở Tâm Vô Lăng
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bCtx = badgeCanvas.getContext('2d');
    bCtx.fillStyle = '#191c24';
    bCtx.fillRect(0, 0, 256, 256);
    bCtx.strokeStyle = '#d4af37';
    bCtx.lineWidth = 6;
    bCtx.beginPath();
    bCtx.arc(128, 128, 90, 0, Math.PI * 2);
    bCtx.stroke();
    bCtx.fillStyle = '#d4af37';
    bCtx.font = 'bold 28px serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('★ POLICE ★', 128, 122);
    bCtx.font = '18px monospace';
    bCtx.fillStyle = '#9aa8c0';
    bCtx.fillText('AIRBAG', 128, 156);
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);

    return {
      leatherTex,
      gaugeTexture,
      mdtTexture,
      kbTexture,
      docTexture,
      gunSlideTex,
      badgeTex
    };
  }

  createUI() {
    this.uiContainer = document.createElement('div');
    this.uiContainer.id = 'driving-ui-overlay';
    this.uiContainer.innerHTML = `
      <div class="driving-hint-mouselook">
        <span>⚜ RÊ CHUỘT ĐỂ QUAN SÁT BUỒNG LÁI (ĐỒNG HỒ, MÁY TÍNH, GHẾ PHỤ, SÚNG LỤC & BIÊN BẢN) ⚜</span>
      </div>

      <div class="driving-dialogue-box">
        <div class="driving-speaker-badge" id="driving-speaker">TỔNG ĐÀI ĐỒN</div>
        <div class="driving-dialogue-text" id="driving-text">...</div>
        <div class="driving-prompt-hint">[Hội thoại tự chạy • Click chuột hoặc nhấn Space để tiếp tục nhanh • ESC: Tạm dừng]</div>
      </div>

      <!-- Banner bấm E để xuống xe -->
      <div class="driving-stepout-banner" id="driving-stepout-banner" style="display: none; cursor: pointer;">
        <span class="key-box">E</span> NHẤN [E] ĐỂ BƯỚC XUỐNG XE & ĐIỀU TRA HIỆN TRƯỜNG
      </div>

      <!-- Menu Tạm Dừng Cổ Kính khi bấm ESC -->
      <div class="fp-story-modal" id="driving-pause-modal" style="display: none;">
        <div class="fp-modal-card gothic-pause-card">
          <div class="gothic-ornament">⚜ ❖ ⚜</div>
          <h2>TẠM DỪNG CUỘC ĐIỀU TRA</h2>
          <p class="gothic-pause-sub">Đơn vị tuần tra số 07 – Cung đường rừng Biệt thự ông Bình</p>
          <div class="gothic-pause-actions">
            <button class="pixel-btn btn-primary" id="btn-driving-resume">▶ TIẾP TỤC HÀNH TRÌNH [ESC]</button>
            <button class="pixel-btn" id="btn-driving-exit">🚪 THOÁT RA MENU CHÍNH</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.uiContainer);

    this.speakerEl = this.uiContainer.querySelector('#driving-speaker');
    this.textEl = this.uiContainer.querySelector('#driving-text');
    this.stepoutBannerEl = this.uiContainer.querySelector('#driving-stepout-banner');
    this.pauseModalEl = this.uiContainer.querySelector('#driving-pause-modal');
    this.btnResume = this.uiContainer.querySelector('#btn-driving-resume');
    this.btnExit = this.uiContainer.querySelector('#btn-driving-exit');

    this.stepOut = () => {
      if (this.isPaused) return;
      this.destroy();
      if (this.onStepOutOfCar) this.onStepOutOfCar();
    };

    this.stepoutBannerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.stepOut();
    });

    this.togglePause = () => {
      this.isPaused = !this.isPaused;
      this.pauseModalEl.style.display = this.isPaused ? 'flex' : 'none';
      audioManager.playClick();
    };

    this.btnResume.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePause();
    });

    this.btnExit.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.playClick();
      this.destroy();
      if (this.onReturnToMenu) this.onReturnToMenu();
    });

    this.advanceDialogue = (e) => {
      if (this.isPaused || this.isFinishedDialogues) return;
      if (e && e.target && e.target.closest('#driving-pause-modal')) return;

      const cur = this.dialogues[this.dialogueIndex];
      if (this.dialogueCharIndex < cur.text.length) {
        this.dialogueCharIndex = cur.text.length;
        this.dialogueTimer = 0;
        return;
      }

      if (this.dialogueIndex < this.dialogues.length - 1) {
        this.dialogueIndex++;
        this.dialogueCharIndex = 0;
        this.dialogueTimer = 0;
        audioManager.playRadioBeep();

        if (this.dialogueIndex === 10) {
          this.isStopping = true;
          this.crashedTruckGroup.visible = true;
          this.stepoutBannerEl.style.display = 'flex';
        }
      } else {
        this.isFinishedDialogues = true;
        this.stepoutBannerEl.style.display = 'flex';
        this.stepoutBannerEl.classList.add('pulse');
        audioManager.playDramaticImpact();
      }
    };

    window.addEventListener('click', this.advanceDialogue);
    this.handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.togglePause();
        return;
      }
      if (this.isPaused) return;

      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        if (this.isStopping || this.isFinishedDialogues) {
          this.stepOut();
          return;
        }
      }
      if (e.key === ' ' || e.key === 'Enter') {
        this.advanceDialogue();
      }
    };
    window.addEventListener('keydown', this.handleKeyDown);

    this.onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this.onResize);
  }

  setupMouseLook() {
    this.onMouseMove = (e) => {
      if (this.isPaused) return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;

      // Giới hạn góc xoay mượt mà để thấy trọn vẹn ghế phụ, súng lục, biên bản mà không xuyên vào cột xe
      this.targetRotation.yaw = -nx * 1.15;
      this.targetRotation.pitch = -ny * 0.42 - 0.06;
    };
    window.addEventListener('mousemove', this.onMouseMove);
  }

  setupLighting() {
    // 1. Ánh sáng bầu trời đêm mưa bão
    const ambient = new THREE.AmbientLight(0x283655, 1.8);
    this.scene.add(ambient);

    const moonDir = new THREE.DirectionalLight(0x6688bb, 1.2);
    moonDir.position.set(10, 25, -15);
    this.scene.add(moonDir);

    // 2. Đèn trần nội thất xe ấm áp (Dome Light)
    const domeLight = new THREE.PointLight(0xffeedd, 3.2, 4.5, 1.0);
    domeLight.position.set(0.0, 1.48, 0.05);
    this.scene.add(domeLight);

    // 3. Đèn chiếu sáng khu vực ghế phụ (Làm rõ khẩu súng lục, biên bản và đèn pin)
    const passLight = new THREE.PointLight(0xfff6e5, 3.0, 3.5, 1.0);
    passLight.position.set(0.45, 1.25, 0.15);
    this.scene.add(passLight);

    // 4. Đèn hắt sáng cụm đồng hồ và màn hình cảnh sát
    const dashGlow = new THREE.PointLight(0x00e5ff, 1.5, 2.2);
    dashGlow.position.set(-0.36, 1.02, -0.28);
    this.scene.add(dashGlow);

    // 5. Đèn pha kép xe cảnh sát chiếu sáng con đường nhựa phía trước
    this.headlights = new THREE.SpotLight(0xfffbe6, 14.0, 75, Math.PI / 3.6, 0.35, 0.9);
    this.headlights.position.set(0, 0.85, -2.0);
    const target = new THREE.Object3D();
    target.position.set(0, 0.1, -38);
    this.scene.add(target);
    this.headlights.target = target;
    this.scene.add(this.headlights);

    // 6. Còi hú cảnh sát Đỏ / Xanh trên nóc xe
    this.sirenLight = new THREE.PointLight(0xff1e1e, 4.5, 24);
    this.sirenLight.position.set(0, 1.75, -0.2);
    this.scene.add(this.sirenLight);
  }

  // DỰNG BUỒNG LÁI XE CẢNH SÁT CHI TIẾT CAO (KHÔNG BỊ KHỐI HỘP THÔ HAY ĐEN XÌ)
  buildRealisticCockpit() {
    this.carInterior = new THREE.Group();

    this.textures.leatherTex.repeat.set(3, 3);
    const dashLeatherMat = new THREE.MeshStandardMaterial({
      map: this.textures.leatherTex,
      color: 0x242834,
      roughness: 0.65,
      metalness: 0.15
    });
    const seatLeatherMat = new THREE.MeshStandardMaterial({
      map: this.textures.leatherTex,
      color: 0x2c303d,
      roughness: 0.55,
      metalness: 0.12
    });
    const trimDarkMat = new THREE.MeshStandardMaterial({
      color: 0x151821,
      roughness: 0.5,
      metalness: 0.25
    });
    const brushedMetalMat = new THREE.MeshStandardMaterial({
      color: 0x9aa6b8,
      roughness: 0.3,
      metalness: 0.45
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xd8e2f0,
      roughness: 0.2,
      metalness: 0.55
    });

    // =========================================================
    // 1. BẢNG TÁP-LÔ ĐA TẦNG & VÒM ĐỒNG HỒ (SCULPTED DASHBOARD)
    // =========================================================
    // Thân táp-lô chính hạ thấp vừa tầm để không che khuất đồng hồ
    const mainDash = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.34, 0.68), dashLeatherMat);
    mainDash.position.set(0, 0.72, -0.46);
    this.carInterior.add(mainDash);

    // Tấm ốp viền bạc trang trí chạy ngang táp-lô
    const dashSilverTrim = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.025, 0.04), brushedMetalMat);
    dashSilverTrim.position.set(0, 0.88, -0.13);
    this.carInterior.add(dashSilverTrim);

    // Vòm che cụm đồng hồ phía người lái (Instrument Cluster Binnacle Hood)
    const binnacleGroup = new THREE.Group();
    binnacleGroup.position.set(-0.36, 0.90, -0.44);

    // Nóc vòm cong che nắng đồng hồ
    const hoodArch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.26, 24, 1, false, 0, Math.PI),
      dashLeatherMat
    );
    hoodArch.rotation.z = Math.PI / 2;
    hoodArch.rotation.y = Math.PI / 2;
    hoodArch.scale.set(1.0, 0.52, 1.0);
    hoodArch.position.set(0, 0.08, 0.02);
    binnacleGroup.add(hoodArch);

    // Mặt kính hiển thị 3 đồng hồ công-tơ-mét (Đặt trọn vẹn trên mặt táp-lô, không bị cắt chữ!)
    const gaugeScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.16),
      new THREE.MeshBasicMaterial({ map: this.textures.gaugeTexture })
    );
    gaugeScreen.position.set(0, 0.07, -0.02);
    gaugeScreen.rotation.x = -0.18;
    binnacleGroup.add(gaugeScreen);

    this.carInterior.add(binnacleGroup);

    // 4 Cửa gió điều hòa có lá tản gió chi tiết
    [-0.74, -0.06, 0.18, 0.74].forEach(vx => {
      const ventFrame = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.03), trimDarkMat);
      ventFrame.position.set(vx, 0.84, -0.12);
      this.carInterior.add(ventFrame);
      for (let s = -1; s <= 1; s++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.006, 0.035), brushedMetalMat);
        slat.position.set(vx, 0.84 + s * 0.018, -0.118);
        this.carInterior.add(slat);
      }
    });

    // =========================================================
    // 2. VÔ LĂNG CẢNH SÁT 3 CHẤU THỂ THAO & TRỤC LÁI
    // =========================================================
    // Ốp trục vô lăng
    const steeringColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.32, 16), trimDarkMat);
    steeringColumn.rotation.x = Math.PI / 2 - 0.35;
    steeringColumn.position.set(-0.36, 0.87, -0.22);
    this.carInterior.add(steeringColumn);

    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(-0.36, 0.91, -0.10);
    wheelGroup.rotation.x = 0.35;

    // Vành vô lăng bọc da mịn (36 segments tròn mượt)
    const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.022, 20, 40), seatLeatherMat);
    wheelGroup.add(wheelRim);

    // Đệm còi trung tâm có huy hiệu Cảnh sát
    const hornPad = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.032, 24), trimDarkMat);
    hornPad.rotation.x = Math.PI / 2;
    wheelGroup.add(hornPad);

    const hornBadge = new THREE.Mesh(
      new THREE.CircleGeometry(0.058, 24),
      new THREE.MeshBasicMaterial({ map: this.textures.badgeTex })
    );
    hornBadge.position.z = 0.017;
    wheelGroup.add(hornBadge);

    // 3 Chấu vô lăng mạ bạc (Trái, Phải, Dưới)
    const spokeAngles = [-Math.PI * 0.42, Math.PI * 0.42, Math.PI];
    spokeAngles.forEach(ang => {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.11, 0.018), brushedMetalMat);
      spoke.position.set(Math.sin(ang) * 0.11, Math.cos(ang) * 0.11, -0.005);
      spoke.rotation.z = -ang;
      wheelGroup.add(spoke);
    });

    this.carInterior.add(wheelGroup);

    // Cần gạt xi-nhan & đèn pha hai bên trục lái
    [-1, 1].forEach(side => {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.15, 10), trimDarkMat);
      stalk.position.set(-0.36 + side * 0.11, 0.89, -0.18);
      stalk.rotation.z = side * (Math.PI / 2.4);
      this.carInterior.add(stalk);
    });

    // =========================================================
    // 3. BỆ ĐIỀU KHIỂN TRUNG TÂM, BỘ ĐÀM & LAPTOP CẢNH SÁT (MDT)
    // =========================================================
    const centerConsole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.82), trimDarkMat);
    centerConsole.position.set(0.04, 0.56, -0.05);
    this.carInterior.add(centerConsole);

    // Cần số tự động (Gear Shifter)
    const shifterBase = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.02, 0.16), brushedMetalMat);
    shifterBase.position.set(-0.02, 0.75, 0.05);
    this.carInterior.add(shifterBase);

    const shifterStick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.12, 12), chromeMat);
    shifterStick.position.set(-0.02, 0.81, 0.05);
    this.carInterior.add(shifterStick);

    const shifterKnob = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.038, 0.045), seatLeatherMat);
    shifterKnob.position.set(-0.02, 0.87, 0.05);
    this.carInterior.add(shifterKnob);

    // Cụm bộ đàm & công tắc còi hú cảnh sát (Siren Control Box)
    const radioBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.22), trimDarkMat);
    radioBox.position.set(0.04, 0.80, -0.18);
    radioBox.rotation.x = -0.25;
    this.carInterior.add(radioBox);

    // Các nút công tắc đèn phát sáng Đỏ / Xanh / Cam trên bộ đàm
    const switchColors = [0xff2222, 0xff2222, 0x0088ff, 0x0088ff, 0xffaa00, 0x00e676];
    switchColors.forEach((col, idx) => {
      const btn = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.018, 0.01),
        new THREE.MeshBasicMaterial({ color: col })
      );
      btn.position.set(-0.04 + idx * 0.032, 0.83, -0.07);
      btn.rotation.x = -0.25;
      this.carInterior.add(btn);
    });

    // MÁY TÍNH XÁCH TAY CẢNH SÁT (POLICE RUGGED MDT LAPTOP)
    const mdtGroup = new THREE.Group();
    mdtGroup.position.set(0.12, 0.90, -0.24);
    mdtGroup.rotation.y = -0.42; // Xoay hướng về phía ghế lái An

    // Chân giá đỡ kim loại
    const mdtArm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.24, 12), brushedMetalMat);
    mdtArm.position.y = -0.12;
    mdtGroup.add(mdtArm);

    // Thân bàn phím Laptop có Texture phím bấm rõ ràng
    const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.024, 0.24), trimDarkMat);
    mdtGroup.add(laptopBase);

    const kbPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.29, 0.20),
      new THREE.MeshBasicMaterial({ map: this.textures.kbTexture })
    );
    kbPlane.rotation.x = -Math.PI / 2;
    kbPlane.position.y = 0.013;
    mdtGroup.add(kbPlane);

    // Màn hình Laptop mở góc 110 độ
    const screenHinge = new THREE.Group();
    screenHinge.position.set(0, 0.012, -0.115);
    screenHinge.rotation.x = -0.28;

    const screenBezel = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.018), trimDarkMat);
    screenBezel.position.set(0, 0.11, 0);
    screenHinge.add(screenBezel);

    const mdtDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(0.295, 0.195),
      new THREE.MeshBasicMaterial({ map: this.textures.mdtTexture })
    );
    mdtDisplay.position.set(0, 0.11, 0.011);
    screenHinge.add(mdtDisplay);

    mdtGroup.add(screenHinge);
    this.carInterior.add(mdtGroup);

    // =========================================================
    // 4. GHẾ PHỤ BÊN PHẢI & CÁC VẬT DỤNG CẢNH SÁT SIÊU CHI TIẾT
    // =========================================================
    // Đặt ghế phụ lùi hợp lý để khi xoay đầu nhìn sang phải thấy toàn cảnh rất đẹp
    const seatGroup = new THREE.Group();
    seatGroup.position.set(0.46, 0, 0.34);

    // Đệm ngồi chính
    const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.58), seatLeatherMat);
    seatCushion.position.set(0, 0.52, 0);
    seatGroup.add(seatCushion);

    // 2 Gờ ôm hông đệm ngồi (Side Bolsters)
    [-0.25, 0.25].forEach(bx => {
      const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.56), seatLeatherMat);
      bolster.position.set(bx, 0.55, 0);
      seatGroup.add(bolster);
    });

    // Tựa lưng ghế phụ nghiêng ra sau tự nhiên
    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.68, 0.14), seatLeatherMat);
    seatBack.position.set(0, 0.92, 0.26);
    seatBack.rotation.x = -0.18;
    seatGroup.add(seatBack);

    // Gối tựa đầu
    const headRest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.20, 0.10), seatLeatherMat);
    headRest.position.set(0, 1.35, 0.34);
    headRest.rotation.x = -0.15;
    seatGroup.add(headRest);

    // 2 Thanh inox cắm tựa đầu
    [-0.07, 0.07].forEach(px => {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), chromeMat);
      rod.position.set(px, 1.25, 0.32);
      seatGroup.add(rod);
    });

    this.carInterior.add(seatGroup);

    // ---------------------------------------------------------
    // A. KHẨU SÚNG LỤC CẢNH SÁT (SERVICE PISTOL) ĐẶT TRÊN BAO DA GHẾ PHỤ
    // ---------------------------------------------------------
    const pistolGroup = new THREE.Group();
    pistolGroup.position.set(0.38, 0.63, 0.22);
    pistolGroup.rotation.set(0.08, -0.45, 0.12); // Nghiêng nhẹ hướng về mắt người chơi để thấy rõ thân súng

    // Tấm lót bao da chiến thuật màu nâu sẫm dưới súng
    const holsterPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.016, 0.20),
      new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.75 })
    );
    holsterPad.position.set(0, -0.01, 0.02);
    pistolGroup.add(holsterPad);

    // Khối thân trượt thép xước (Steel Slide có Texture rãnh kéo & cửa thoát đạn)
    const slideMat = new THREE.MeshStandardMaterial({
      map: this.textures.gunSlideTex,
      roughness: 0.32,
      metalness: 0.45
    });
    const gunSlide = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.042, 0.038), slideMat);
    gunSlide.position.set(0, 0.048, 0);
    pistolGroup.add(gunSlide);

    // Nòng súng thép bạc nhô ra phía trước
    const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.26, 14), chromeMat);
    gunBarrel.rotation.z = Math.PI / 2;
    gunBarrel.position.set(-0.015, 0.048, 0);
    pistolGroup.add(gunBarrel);

    // Khung dưới súng & Ray gắn phụ kiện Picatinny
    const gunFrame = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.024, 0.036), trimDarkMat);
    gunFrame.position.set(0.015, 0.022, 0);
    pistolGroup.add(gunFrame);

    // Đèn laser/chiến thuật gắn dưới nòng súng
    const underLight = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.065, 12), brushedMetalMat);
    underLight.rotation.z = Math.PI / 2;
    underLight.position.set(-0.055, 0.012, 0);
    pistolGroup.add(underLight);

    // Tay cầm súng (Ergonomic Textured Grip)
    const gunGrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.054, 0.115, 0.036),
      new THREE.MeshStandardMaterial({ color: 0x1c2029, roughness: 0.8 })
    );
    gunGrip.position.set(0.085, -0.02, 0.045);
    gunGrip.rotation.x = 0.65;
    gunGrip.rotation.z = -0.25;
    pistolGroup.add(gunGrip);

    // Vành bảo vệ cò súng & Cò súng cong
    const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.006, 0.02), brushedMetalMat);
    triggerGuard.position.set(0.03, 0.004, 0.022);
    pistolGroup.add(triggerGuard);

    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.022, 0.01), chromeMat);
    trigger.position.set(0.035, 0.012, 0.012);
    trigger.rotation.z = 0.3;
    pistolGroup.add(trigger);

    // Thước ngắm Dạ Quang Xanh Lá (Tritium Night Sights)
    const frontSight = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.012, 0.012),
      new THREE.MeshBasicMaterial({ color: 0x00ff66 })
    );
    frontSight.position.set(-0.105, 0.072, 0);
    pistolGroup.add(frontSight);

    const rearSight = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.012, 0.026),
      new THREE.MeshBasicMaterial({ color: 0x00ff66 })
    );
    rearSight.position.set(0.105, 0.072, 0);
    pistolGroup.add(rearSight);

    // Băng đạn dự phòng (Spare Magazine) nằm cạnh súng
    const spareMag = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.018, 0.032), brushedMetalMat);
    spareMag.position.set(-0.02, 0.01, 0.075);
    spareMag.rotation.y = 0.25;
    pistolGroup.add(spareMag);

    // Đầu đạn đồng vàng ánh lên ở đầu băng đạn
    const brassRound = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.028, 10),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.6 })
    );
    brassRound.position.set(-0.072, 0.01, 0.075);
    brassRound.rotation.z = Math.PI / 2;
    pistolGroup.add(brassRound);

    this.carInterior.add(pistolGroup);

    // ---------------------------------------------------------
    // B. KẸP HỒ SƠ BIÊN BẢN VỤ ÁN & BÚT BI (POLICE CASE CLIPBOARD)
    // ---------------------------------------------------------
    const clipGroup = new THREE.Group();
    clipGroup.position.set(0.54, 0.62, 0.42);
    clipGroup.rotation.y = -0.35;

    const woodBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.014, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.75 })
    );
    clipGroup.add(woodBoard);

    // Tờ giấy biên bản có chữ in rõ nét & dấu mộc đỏ KHẨN CẤP
    const reportPaper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.235, 0.31),
      new THREE.MeshBasicMaterial({ map: this.textures.docTexture })
    );
    reportPaper.rotation.x = -Math.PI / 2;
    reportPaper.position.y = 0.009;
    clipGroup.add(reportPaper);

    // Kẹp sắt đầu bảng
    const metalClip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.022, 0.035), chromeMat);
    metalClip.position.set(0, 0.016, -0.145);
    clipGroup.add(metalClip);

    // Chiếc bút bi cảnh sát đặt chéo trên hồ sơ
    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.16, 10),
      new THREE.MeshStandardMaterial({ color: 0x154499, roughness: 0.3 })
    );
    pen.rotation.x = Math.PI / 2;
    pen.rotation.z = 0.45;
    pen.position.set(0.05, 0.016, 0.04);
    clipGroup.add(pen);

    this.carInterior.add(clipGroup);

    // ---------------------------------------------------------
    // C. ĐÈN PIN CHIẾN THUẬT CẢNH SÁT (HEAVY-DUTY FLASHLIGHT)
    // ---------------------------------------------------------
    const torchGroup = new THREE.Group();
    torchGroup.position.set(0.28, 0.63, 0.44);
    torchGroup.rotation.z = Math.PI / 2;
    torchGroup.rotation.y = 0.25;

    const torchBody = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.24, 16), trimDarkMat);
    torchGroup.add(torchBody);

    // Vòng đai vàng phản quang trên thân đèn pin
    const torchRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.023, 0.023, 0.025, 16),
      new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    );
    torchRing.position.y = 0.06;
    torchGroup.add(torchRing);

    const torchHead = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.024, 0.065, 16), brushedMetalMat);
    torchHead.position.y = 0.14;
    torchGroup.add(torchHead);

    const torchLens = new THREE.Mesh(
      new THREE.CircleGeometry(0.032, 16),
      new THREE.MeshBasicMaterial({ color: 0xe6ffff })
    );
    torchLens.rotation.x = -Math.PI / 2;
    torchLens.position.y = 0.174;
    torchGroup.add(torchLens);

    this.carInterior.add(torchGroup);

    // =========================================================
    // 5. KHUNG CABIN, CỘT CHỮ A, GƯƠNG CHIẾU HẬU & TẤM CHẮN NẮNG
    // =========================================================
    // Đặt cột chữ A và cửa xe xa tầm mắt để không bao giờ che tầm nhìn khi quay đầu
    [-0.92, 0.92].forEach(sideX => {
      const sign = Math.sign(sideX);
      // Cột chữ A nghiêng theo kính chắn gió
      const pillarA = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.78, 0.075), trimDarkMat);
      pillarA.position.set(sideX, 1.24, -0.38);
      pillarA.rotation.z = sign * 0.18;
      pillarA.rotation.x = 0.35;
      this.carInterior.add(pillarA);

      // Tấm ốp cửa xe có bệ tỳ tay (Door Panel & Armrest)
      const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 1.45), dashLeatherMat);
      doorPanel.position.set(sideX * 1.04, 0.56, 0.15);
      this.carInterior.add(doorPanel);

      const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.55), seatLeatherMat);
      armrest.position.set(sideX * 0.98, 0.78, 0.18);
      this.carInterior.add(armrest);
    });

    // Trần xe & 2 tấm chắn nắng (Sun Visors)
    const roofHeader = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.07, 1.65), trimDarkMat);
    roofHeader.position.set(0, 1.62, 0.15);
    this.carInterior.add(roofHeader);

    [-0.42, 0.42].forEach(vx => {
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.02), seatLeatherMat);
      visor.position.set(vx, 1.52, -0.26);
      visor.rotation.x = 0.25;
      this.carInterior.add(visor);
    });

    // Gương chiếu hậu trung tâm
    const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.10, 8), trimDarkMat);
    mirrorStem.position.set(0, 1.52, -0.22);
    this.carInterior.add(mirrorStem);

    const rearMirror = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.085, 0.025), trimDarkMat);
    rearMirror.position.set(0, 1.46, -0.22);
    this.carInterior.add(rearMirror);

    const mirrorGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.30, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x24344d, roughness: 0.1, metalness: 0.8 })
    );
    mirrorGlass.position.set(0, 1.46, -0.206);
    this.carInterior.add(mirrorGlass);

    // Nắp ca-pô xe cảnh sát phía trước kính chắn gió
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(1.82, 0.12, 1.75),
      new THREE.MeshStandardMaterial({ color: 0x141824, roughness: 0.25, metalness: 0.45 })
    );
    hood.position.set(0, 0.74, -1.55);
    hood.rotation.x = 0.04;
    this.carInterior.add(hood);

    this.scene.add(this.carInterior);
  }

  // CẢNH ĐƯỜNG RỪNG ĐÊM BÃO VÀ HIỆN TRƯỜNG XE TẢI NEXUS BÊN ĐẦU ĐƯỜNG MÒN
  buildForestHighway() {
    // 1. Mặt đường nhựa ướt mưa phản quang
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 120),
      new THREE.MeshStandardMaterial({ color: 0x151822, roughness: 0.28, metalness: 0.2 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -50);
    this.scene.add(road);

    // Hai lề đường cỏ đất rừng
    const forestEdge = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 120),
      new THREE.MeshStandardMaterial({ color: 0x0d130e, roughness: 0.9 })
    );
    forestEdge.rotation.x = -Math.PI / 2;
    forestEdge.position.set(0, -0.02, -50);
    this.scene.add(forestEdge);

    // Vạch kẻ tim đường màu vàng & vạch biên trắng
    this.stripes = [];
    const centerLineMat = new THREE.MeshBasicMaterial({ color: 0xffcc33 });
    for (let i = 0; i < 16; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 3.2), centerLineMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, 0.02, -i * 7.0);
      this.scene.add(s);
      this.stripes.push(s);
    }

    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xdde6f0 });
    [-5.8, 5.8].forEach(ex => {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 120), edgeMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(ex, 0.02, -50);
      this.scene.add(edge);
    });

    // 2. Hàng cây thông nhiều tầng và cọc tiêu phản quang ven đường
    this.trees = [];
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x0e2216, roughness: 0.85 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x241810, roughness: 0.95 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0xd0d8e0, roughness: 0.4 });
    const reflectMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

    for (let t = 0; t < 32; t++) {
      const isRight = t % 2 === 0;
      const x = isRight ? 6.8 + (t % 3) * 1.8 : -6.8 - (t % 3) * 1.8;
      const z = -(t * 3.4);

      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 8.5, 8), trunkMat);
      trunk.position.y = 4.25;
      tree.add(trunk);

      for (let tier = 0; tier < 3; tier++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6 - tier * 0.55, 3.6, 8), foliageMat);
        cone.position.y = 4.2 + tier * 2.0;
        tree.add(cone);
      }

      // Cọc tiêu phản quang ven đường
      if (t % 4 === 0) {
        const postX = isRight ? 6.2 - x : -6.2 - x;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), postMat);
        post.position.set(postX, 0.45, 0);
        tree.add(post);

        const refl = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.18, 0.13), reflectMat);
        refl.position.set(postX, 0.72, 0);
        tree.add(refl);
      }

      this.scene.add(tree);
      this.trees.push(tree);
    }

    // 3. Mưa rơi trước kính chắn gió
    const rainGeo = new THREE.BufferGeometry();
    const rainCount = 600;
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPos[i] = (Math.random() - 0.5) * 18;
      rainPos[i + 1] = Math.random() * 10;
      rainPos[i + 2] = -Math.random() * 45;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    this.rainSystem = new THREE.Points(
      rainGeo,
      new THREE.PointsMaterial({ color: 0x99bbdd, size: 0.08, transparent: true, opacity: 0.6 })
    );
    this.scene.add(this.rainSystem);

    // 4. HIỆN TRƯỜNG XE TẢI NEXUS ĐÂM GỐC CÂY BÊN ĐẦU ĐƯỜNG MÒN (XUẤT HIỆN Ở CÂU 10)
    this.crashedTruckGroup = new THREE.Group();
    this.crashedTruckGroup.position.set(3.5, 0, -28);
    this.crashedTruckGroup.rotation.y = -0.45;
    this.crashedTruckGroup.visible = false;

    const nexusLogoTexture = new THREE.TextureLoader().load('/nexus-logo.png');
    nexusLogoTexture.colorSpace = THREE.SRGBColorSpace;

    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 2.0, 2.1),
      new THREE.MeshStandardMaterial({ color: 0xe8eef5, roughness: 0.35 })
    );
    cab.position.set(0, 1.15, -1.0);
    this.crashedTruckGroup.add(cab);

    const cargo = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.3, 3.4),
      new THREE.MeshStandardMaterial({ map: nexusLogoTexture, color: 0xffffff, roughness: 0.4 })
    );
    cargo.position.set(0, 1.35, 1.8);
    this.crashedTruckGroup.add(cargo);

    this.hazardLight = new THREE.PointLight(0xff9900, 4.5, 16);
    this.hazardLight.position.set(0, 1.3, -1.6);
    this.crashedTruckGroup.add(this.hazardLight);

    this.scene.add(this.crashedTruckGroup);
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('click', this.advanceDialogue);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
  }

  animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    if (this.isPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const now = Date.now();

    // 1. Cập nhật góc nhìn theo chuột
    this.currentRotation.yaw = THREE.MathUtils.lerp(this.currentRotation.yaw, this.targetRotation.yaw, 0.12);
    this.currentRotation.pitch = THREE.MathUtils.lerp(this.currentRotation.pitch, this.targetRotation.pitch, 0.12);

    // Độ rung nhẹ tự nhiên của động cơ xe tuần tra
    const engineVib = Math.sin(now * 0.035) * 0.0018;
    this.camera.rotation.y = this.currentRotation.yaw;
    this.camera.rotation.x = this.currentRotation.pitch + engineVib;

    // 2. Chuyển động xe chạy trên đường
    if (this.isStopping) {
      this.carSpeed = THREE.MathUtils.lerp(this.carSpeed, 0, 0.04);
      if (this.crashedTruckGroup.position.z < -11.5) {
        this.crashedTruckGroup.position.z += 8.5 * delta;
      }
    }

    for (let s of this.stripes) {
      s.position.z += this.carSpeed * delta;
      if (s.position.z > 6) s.position.z = -98;
    }

    for (let t of this.trees) {
      t.position.z += this.carSpeed * delta;
      if (t.position.z > 8) t.position.z = -100;
    }

    // Mưa rơi
    if (this.rainSystem) {
      const positions = this.rainSystem.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 18 * delta;
        positions[i + 1] += this.carSpeed * 0.6 * delta;
        if (positions[i] < 0 || positions[i + 1] > 2) {
          positions[i] = 6 + Math.random() * 5;
          positions[i + 1] = -Math.random() * 40;
        }
      }
      this.rainSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Còi cảnh sát nhấp nháy Đỏ / Xanh
    const sirenTime = now * 0.008;
    this.sirenLight.color.setHex(Math.sin(sirenTime) > 0 ? 0xff1e1e : 0x1866ff);
    if (this.hazardLight) {
      this.hazardLight.intensity = Math.sin(now * 0.012) > 0 ? 4.5 : 0.2;
    }

    // 3. Tự động chạy hội thoại (Auto-Advance)
    if (!this.isFinishedDialogues) {
      const cur = this.dialogues[this.dialogueIndex];
      this.speakerEl.textContent = cur.speaker;

      if (this.dialogueCharIndex < cur.text.length) {
        this.dialogueCharIndex += 1;
        this.textEl.textContent = cur.text.substring(0, this.dialogueCharIndex);
      } else {
        this.dialogueTimer += delta;
        if (this.dialogueTimer >= this.autoAdvanceDelay) {
          this.advanceDialogue();
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

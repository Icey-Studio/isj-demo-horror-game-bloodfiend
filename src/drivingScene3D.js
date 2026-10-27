// Hoạt Cảnh Buồng Lái Xe Cảnh Sát 3D Chân Thực, Chi Tiết Cao & Sáng Rõ
import * as THREE from 'three';
import { audioManager } from './audio.js';
import { playerInventory, HOSOSO_VU_AN_DEFAULT } from './playerInventoryAndCharacter.js';

export class DrivingScene3D {
  constructor(canvas, onStepOutOfCar, onReturnToMenu) {
    this.canvas = canvas;
    this.onStepOutOfCar = onStepOutOfCar;
    this.onReturnToMenu = onReturnToMenu;
    this.isPaused = false;
    this.seatFocusTarget = null; // 'pistol' | 'clipboard' | null

    // Khởi tạo lại túi đồ khi bắt đầu màn lái xe
    playerInventory.resetForNewGame();

    // Three.js Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050811);
    this.scene.fog = new THREE.FogExp2(0x050811, 0.011);

    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.05, 240);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.32;

    // =========================================================================
    // 4 GIAI ĐOẠN ĐIỆN ẢNH 3D LIỀN MẠCH (THEO ĐÚNG CỐT TRUYỆN NGƯỜI CHƠI YÊU CẦU)
    // - STAGE_1_FOREST_EDGE : Góc nhìn thấp bên bìa rừng -> Ánh đèn quét tới -> Xe cảnh sát chạy ngang từ phải sang trái
    // - STAGE_2_AERIAL      : Góc nhìn từ trên cao -> Xe chạy bên dưới, xa xa chân trời là Thành Phố, gần chân trời là bóng Biệt Thự
    // - STAGE_3_IN_CAR      : Đổi góc nhìn vào trong buồng lái xe cảnh sát (Nghe bộ đàm, nhặt súng & hồ sơ, gặp xe Nexus tai nạn)
    // - STAGE_4_RISING_SKY  : Sau khi ấn [E] ra ngoài kiểm tra -> Camera từ từ bay cao lên trời, thấy bóng Biệt Thự to,
    //                         xe cảnh sát chớp đèn, khói xe gặp nạn bốc lên & Tên Game hiện ra ở giữa thật ngầu + nút [TIẾP TỤC]
    // =========================================================================
    this.stage = 'STAGE_1_FOREST_EDGE';
    this.stageTimer = 0;
    this.lightningTimer = 2.2;
    this.lightningFlashIntensity = 0;

    // Góc nhìn trong xe (dùng ở STAGE_3_IN_CAR)
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

    // Tạo Textures thủ tục độ nét cao cho nội thất xe & thành phố chân trời
    this.textures = this.createCockpitTextures();

    // Tạo UI & Menu Tạm Dừng [ESC] + Màn hình Title Card Stage 4
    this.createUI();

    // Thiết lập ánh sáng & Dựng hình buồng lái + đường rừng + xe cảnh sát 3D + thành phố + bóng biệt thự
    this.setupLighting();
    this.buildRealisticCockpit();
    this.buildForestHighway();
    this.buildCinematic3DAssets();
    this.setupMouseLook();

    // Bắt đầu ngay ở Cảnh 1: Góc nhìn thấp bên bìa rừng
    this.enterStage1ForestEdge();

    this.clock = new THREE.Clock();
    this.isRunning = true;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
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
      <!-- 2 Dải Đen Điện Ảnh (Cinematic Letterbox) cho Cảnh 1, Cảnh 2 và Cảnh 4 -->
      <div id="cinematic-letterbox-wrapper">
        <div class="cinematic-letterbox-top"></div>
        <div class="cinematic-letterbox-bottom">
          <div class="cinematic-caption-text" id="cinematic-caption-text">
            ĐÊM BÃO CẤP 8 — TUYẾN QUỐC LỘ RỪNG CẤM DẪN VÀO BIỆT THỰ ÔNG BÌNH...
          </div>
          <button class="cinematic-skip-hint" id="btn-skip-cinematic">
            ⏭ TIẾP TỤC CẢNH TIẾP THEO [SPACE]
          </button>
        </div>
      </div>

      <!-- Giao diện trong Buồng Lái Xe Cảnh Sát (Cảnh 3) -->
      <div class="driving-hint-mouselook" id="driving-hint-mouselook" style="display: none;">
        <span>⚜ RÊ CHUỘT ĐỂ QUAN SÁT BUỒNG LÁI (ĐỒNG HỒ, MÁY TÍNH, GHẾ PHỤ, SÚNG LỤC & BIÊN BẢN) ⚜</span>
      </div>

      <div class="driving-dialogue-box" id="driving-dialogue-box" style="display: none;">
        <div class="driving-speaker-badge" id="driving-speaker">TỔNG ĐÀI ĐỒN</div>
        <div class="driving-dialogue-text" id="driving-text">...</div>
        <div class="driving-prompt-hint">[Hội thoại tự chạy • Click chuột hoặc nhấn Space để tiếp tục nhanh • ESC: Tạm dừng]</div>
      </div>

      <!-- Khung nhắc tương tác Ghế Phụ: Nhặt Súng Lục [E] hoặc Cầm Tập Hồ Sơ Đọc [E] -->
      <div class="fp-prompt" id="driving-seat-prompt" style="display: none; top: 48%; pointer-events: auto; cursor: pointer; z-index: 65;">
        ⚜ [E] Tương tác trang bị trên ghế phụ
      </div>

      <!-- Banner bấm E để xuống xe (Sau khi bấm E sẽ chuyển sang Cảnh 4: Camera bay lên trời + Hiện tên game!) -->
      <div class="driving-stepout-banner" id="driving-stepout-banner" style="display: none; cursor: pointer;">
        <span class="key-box">E</span> NHẤN [E] ĐỂ BƯỚC XUỐNG XE & ĐIỀU TRA HIỆN TRƯỜNG
      </div>

      <!-- MÀN HÌNH HIỆN TÊN GAME THẬT NGẦU Ở GIỮA KHI CAMERA TỪ TỪ BAY LÊN TRỜI (CẢNH 4) -->
      <div class="bf-epic-title-overlay" id="bf-epic-title-overlay">
        <div class="bf-epic-crest">⚜ ICEY STUDIO PRESENTS ⚜</div>
        <h1 class="bf-epic-main-title">BLOODFIEND</h1>
        <div class="bf-epic-divider"></div>
        <div class="bf-epic-subtitle">— HUYẾT QUỶ —</div>
        <div class="bf-epic-chapter">HỒ SƠ VỤ ÁN #NX-2026-884 • BIỆT THỰ BÁC SĨ BÌNH</div>
        <button class="bf-epic-continue-btn" id="btn-title-continue">
          ▶ TIẾP TỤC
        </button>
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

    this.letterboxWrapperEl = this.uiContainer.querySelector('#cinematic-letterbox-wrapper');
    this.captionTextEl = this.uiContainer.querySelector('#cinematic-caption-text');
    this.btnSkipCinematic = this.uiContainer.querySelector('#btn-skip-cinematic');
    this.hintMouselookEl = this.uiContainer.querySelector('#driving-hint-mouselook');
    this.dialogueBoxEl = this.uiContainer.querySelector('#driving-dialogue-box');
    this.speakerEl = this.uiContainer.querySelector('#driving-speaker');
    this.textEl = this.uiContainer.querySelector('#driving-text');
    this.seatPromptEl = this.uiContainer.querySelector('#driving-seat-prompt');
    this.stepoutBannerEl = this.uiContainer.querySelector('#driving-stepout-banner');
    this.epicTitleOverlayEl = this.uiContainer.querySelector('#bf-epic-title-overlay');
    this.btnTitleContinue = this.uiContainer.querySelector('#btn-title-continue');
    this.pauseModalEl = this.uiContainer.querySelector('#driving-pause-modal');
    this.btnResume = this.uiContainer.querySelector('#btn-driving-resume');
    this.btnExit = this.uiContainer.querySelector('#btn-driving-exit');

    // Nút chuyển nhanh qua Cảnh 1 / Cảnh 2 nếu người chơi bấm
    this.btnSkipCinematic.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.playClick();
      if (this.stage === 'STAGE_1_FOREST_EDGE') {
        this.enterStage2Aerial();
      } else if (this.stage === 'STAGE_2_AERIAL') {
        this.enterStage3InCar();
      }
    });

    // Nút [▶ TIẾP TỤC] trên màn hình Title Card (Cảnh 4) -> Bắt đầu phần kiểm tra hiện trường!
    this.finishAndStartInvestigation = () => {
      if (this.isPaused) return;
      audioManager.playClick();
      playerInventory.closeCaseFileModal();
      this.destroy();
      if (this.onStepOutOfCar) this.onStepOutOfCar();
    };

    this.btnTitleContinue.addEventListener('click', (e) => {
      e.stopPropagation();
      this.finishAndStartInvestigation();
    });

    this.interactWithPassengerSeat = () => {
      if (this.seatFocusTarget === 'pistol' && !playerInventory.hasPickedPistolInCar) {
        playerInventory.hasPickedPistolInCar = true;
        if (this.pistolGroup) this.pistolGroup.visible = false;
        audioManager.playPickup();
        playerInventory.addItem({
          id: 'service_pistol',
          name: 'Súng Lục Cảnh Sát 9mm',
          type: 'weapon',
          icon: '🔫',
          count: 1,
          desc: 'Súng ngắn bán tự động trang bị 100 viên đạn 9mm. Click chuột trái để bắn, nhấn [Q] để ném.'
        });
        if (playerInventory.uiState === 0) {
          playerInventory.uiState = 1;
          playerInventory.renderUI();
        }
        return true;
      }

      if (this.seatFocusTarget === 'clipboard') {
        playerInventory.hasPickedCaseFileInCar = true;
        audioManager.playPickup();
        playerInventory.addItem(HOSOSO_VU_AN_DEFAULT);
        if (playerInventory.uiState === 0) {
          playerInventory.uiState = 1;
          playerInventory.renderUI();
        }
        playerInventory.openCaseFileModal(HOSOSO_VU_AN_DEFAULT);
        return true;
      }
      return false;
    };

    this.seatPromptEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.interactWithPassengerSeat();
    });

    // Khi bấm [E] để ra ngoài kiểm tra -> Chuyển sang Cảnh 4: Camera bay từ từ cao lên trời + Hiện tên game + Nút Tiếp Tục!
    this.stepOut = () => {
      if (this.isPaused || this.stage === 'STAGE_4_RISING_SKY') return;
      playerInventory.closeCaseFileModal();
      this.enterStage4RisingSky();
    };

    this.stepoutBannerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.stepOut();
    });

    this.togglePause = () => {
      if (playerInventory.isReadingDoc || playerInventory.isReadingCaseFile) {
        playerInventory.closeCaseFileModal();
        return;
      }
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
      playerInventory.uiState = 0;
      playerInventory.renderUI();
      this.destroy();
      if (this.onReturnToMenu) this.onReturnToMenu();
    });

    this.advanceDialogue = (e) => {
      if (this.stage !== 'STAGE_3_IN_CAR') return;
      if (this.isPaused || playerInventory.isReadingDoc || playerInventory.isReadingCaseFile || this.isFinishedDialogues) return;
      if (e && e.target && (e.target.closest('#driving-pause-modal') || e.target.closest('#bf-inventory-system') || e.target.closest('#driving-seat-prompt') || e.target.closest('#bf-epic-title-overlay'))) return;

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
          this.crashedTruckGroup.position.set(3.5, 0, -28);
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

      // Ở Cảnh 1 hoặc Cảnh 2: Nhấn Space/Enter để sang cảnh tiếp theo nhanh nếu muốn
      if (this.stage === 'STAGE_1_FOREST_EDGE' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        this.enterStage2Aerial();
        return;
      }
      if (this.stage === 'STAGE_2_AERIAL' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        this.enterStage3InCar();
        return;
      }

      // Ở Cảnh 4 (Khi đã hiện nút Tiếp Tục trên màn hình Title Card)
      if (this.stage === 'STAGE_4_RISING_SKY') {
        if ((e.key === 'Enter' || e.key === ' ') && this.stageTimer > 2.2) {
          e.preventDefault();
          this.finishAndStartInvestigation();
        }
        return;
      }

      // Ở Cảnh 3 (Trong buồng lái xe cảnh sát):
      if (e.code === 'KeyG') {
        e.preventDefault();
        playerInventory.cycleInventoryState();
        return;
      }

      if (e.code.startsWith('Digit')) {
        const num = parseInt(e.code.replace('Digit', ''), 10);
        if (num >= 1 && num <= 9) {
          playerInventory.selectSlot(num - 1);
        }
      }

      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        if (playerInventory.isReadingDoc || playerInventory.isReadingCaseFile) {
          playerInventory.closeCaseFileModal();
          return;
        }
        if (this.seatFocusTarget && this.interactWithPassengerSeat()) {
          return;
        }
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
      if (this.isPaused || this.stage !== 'STAGE_3_IN_CAR') return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;

      // Giới hạn góc xoay mượt mà để thấy trọn vẹn ghế phụ, súng lục, biên bản mà không xuyên vào cột xe
      this.targetRotation.yaw = -nx * 1.15;
      this.targetRotation.pitch = -ny * 0.42 - 0.06;
    };
    window.addEventListener('mousemove', this.onMouseMove);
  }

  setupLighting() {
    // 1. Ánh sáng bầu trời đêm mưa bão & chớp giật (Lightning)
    this.ambientLight = new THREE.AmbientLight(0x283655, 1.8);
    this.scene.add(this.ambientLight);

    this.moonDir = new THREE.DirectionalLight(0x6688bb, 1.35);
    this.moonDir.position.set(12, 32, -25);
    this.scene.add(this.moonDir);

    // 2. Đèn trần nội thất xe ấm áp (Dome Light - Chỉ bật khi ở trong xe STAGE_3)
    this.domeLight = new THREE.PointLight(0xffeedd, 3.2, 4.5, 1.0);
    this.domeLight.position.set(0.0, 1.48, 0.05);
    this.scene.add(this.domeLight);

    // 3. Đèn chiếu sáng khu vực ghế phụ (Làm rõ khẩu súng lục, biên bản và đèn pin)
    this.passLight = new THREE.PointLight(0xfff6e5, 3.0, 3.5, 1.0);
    this.passLight.position.set(0.45, 1.25, 0.15);
    this.scene.add(this.passLight);

    // 4. Đèn hắt sáng cụm đồng hồ và màn hình cảnh sát
    this.dashGlow = new THREE.PointLight(0x00e5ff, 1.5, 2.2);
    this.dashGlow.position.set(-0.36, 1.02, -0.28);
    this.scene.add(this.dashGlow);

    // 5. Đèn pha kép xe cảnh sát chiếu sáng con đường nhựa phía trước
    this.headlights = new THREE.SpotLight(0xfffbe6, 15.0, 85, Math.PI / 3.4, 0.35, 0.9);
    this.headlights.position.set(0, 0.85, -2.0);
    this.headlightTarget = new THREE.Object3D();
    this.headlightTarget.position.set(0, 0.1, -38);
    this.scene.add(this.headlightTarget);
    this.headlights.target = this.headlightTarget;
    this.scene.add(this.headlights);

    // 6. Còi hú cảnh sát Đỏ / Xanh trên nóc xe
    this.sirenLight = new THREE.PointLight(0xff1e1e, 5.5, 32);
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
    this.pistolGroup = pistolGroup;

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
    this.clipGroup = clipGroup;

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

    // 4. HIỆN TRƯỜNG XE TẢI NEXUS ĐÂM GỐC CÂY BÊN ĐẦU ĐƯỜNG MÒN (XUẤT HIỆN Ở CÂU 10 & CẢNH 4)
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

    this.hazardLight = new THREE.PointLight(0xff9900, 5.2, 20);
    this.hazardLight.position.set(0, 1.3, -1.6);
    this.crashedTruckGroup.add(this.hazardLight);

    // Đám khói dày đặc bốc lên từ nắp ca-pô xe tải Nexus gặp nạn (dùng cho Cảnh 3 & Cảnh 4 khi camera bay lên trời!)
    this.crashSmokeNodes = [];
    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0x262932,
      roughness: 0.95,
      transparent: true,
      opacity: 0.65
    });
    for (let s = 0; s < 18; s++) {
      const puff = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.45 + (s % 4) * 0.22, 1),
        smokeMat
      );
      puff.position.set(
        (Math.random() - 0.5) * 1.2,
        1.5 + s * 0.65,
        -1.4 + (Math.random() - 0.5) * 1.1
      );
      puff.userData = {
        baseY: 1.4,
        speed: 1.3 + (s % 5) * 0.25,
        phase: s * 0.7
      };
      this.crashedTruckGroup.add(puff);
      this.crashSmokeNodes.push(puff);
    }

    this.scene.add(this.crashedTruckGroup);
  }

  // ===========================================================================
  // DỰNG CÁC MÔ HÌNH 3D CHO 4 CẢNH ĐIỆN ẢNH MỞ ĐẦU & HIỆN TÊN GAME:
  // 1. Xe Cảnh Sát Tuần Tra 3D ngoại thất (chạy ngang từ phải sang trái ở Cảnh 1, chạy dưới đường ở Cảnh 2, chớp đèn ở Cảnh 4)
  // 2. Bìa rừng tiền cảnh góc thấp (Đá rêu, cỏ dương xỉ, biển báo đường rừng cho Cảnh 1)
  // 3. Đường chân trời Thành Phố rực sáng phía xa xa (Cảnh 2)
  // 4. Bóng Căn Biệt Thự Gothic khổng lồ gần đường chân trời (Cảnh 2 & Cảnh 4)
  // ===========================================================================
  buildCinematic3DAssets() {
    // -------------------------------------------------------------------------
    // 1. XE CẢNH SÁT TUẦN TRA 3D NGOẠI THẤT (EXTERIOR 3D POLICE INTERCEPTOR)
    // Mặc định mũi xe hướng về trục -Z (khi xoay rotation.y = Math.PI / 2 sẽ chạy từ Phải +X sang Trái -X!)
    // -------------------------------------------------------------------------
    this.exteriorPoliceCar = new THREE.Group();
    this.policeWheels = [];

    const blackPaintMat = new THREE.MeshStandardMaterial({ color: 0x10141f, roughness: 0.25, metalness: 0.6 });
    const whitePaintMat = new THREE.MeshStandardMaterial({ color: 0xf0f5fc, roughness: 0.28, metalness: 0.35 });
    const glassDarkMat = new THREE.MeshStandardMaterial({ color: 0x09101c, roughness: 0.12, metalness: 0.85 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x151619, roughness: 0.85 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xb8c4d4, roughness: 0.3, metalness: 0.75 });

    // Thân dưới xe cảnh sát (Lower Chassis)
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.66, 4.75), blackPaintMat);
    chassis.position.set(0, 0.62, 0);
    this.exteriorPoliceCar.add(chassis);

    // Khoang cửa trắng đặc trưng Police Interceptor
    const whiteDoorSection = new THREE.Mesh(new THREE.BoxGeometry(1.99, 0.58, 2.25), whitePaintMat);
    whiteDoorSection.position.set(0, 0.64, 0.05);
    this.exteriorPoliceCar.add(whiteDoorSection);

    // Cabin kính & Mui xe trắng
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.56, 2.35), glassDarkMat);
    cabin.position.set(0, 1.20, 0.12);
    this.exteriorPoliceCar.add(cabin);

    const roofTop = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.08, 1.95), whitePaintMat);
    roofTop.position.set(0, 1.49, 0.12);
    this.exteriorPoliceCar.add(roofTop);

    // Cản sắt húc phía trước mũi xe (Police Push Bumper / Bullbar)
    const pushBarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.14), blackPaintMat);
    pushBarL.position.set(-0.38, 0.62, -2.42);
    const pushBarR = pushBarL.clone();
    pushBarR.position.x = 0.38;
    const pushCross = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.10, 0.12), blackPaintMat);
    pushCross.position.set(0, 0.72, -2.44);
    this.exteriorPoliceCar.add(pushBarL, pushBarR, pushCross);

    // 4 Bánh xe 3D xoay tròn khi xe chạy
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.28, 12);
    rimGeo.rotateZ(Math.PI / 2);
    [
      [-0.96, 0.38, -1.48],
      [0.96, 0.38, -1.48],
      [-0.96, 0.38, 1.48],
      [0.96, 0.38, 1.48]
    ].forEach(([wx, wy, wz]) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(wx, wy, wz);
      wGroup.add(new THREE.Mesh(wheelGeo, tireMat));
      wGroup.add(new THREE.Mesh(rimGeo, rimMat));
      this.exteriorPoliceCar.add(wGroup);
      this.policeWheels.push(wGroup);
    });

    // Cụm đèn còi hú Cảnh Sát trên nóc xe (Đỏ & Xanh phát sáng rực rỡ)
    const lightbarBase = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.06, 0.28), rimMat);
    lightbarBase.position.set(0, 1.56, 0.05);
    this.exteriorPoliceCar.add(lightbarBase);

    this.sirenDomeRedMat = new THREE.MeshBasicMaterial({ color: 0xff1822 });
    this.sirenDomeBlueMat = new THREE.MeshBasicMaterial({ color: 0x1866ff });
    const domeRed = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.12, 0.24), this.sirenDomeRedMat);
    domeRed.position.set(-0.32, 1.63, 0.05);
    const domeBlue = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.12, 0.24), this.sirenDomeBlueMat);
    domeBlue.position.set(0.32, 1.63, 0.05);
    this.exteriorPoliceCar.add(domeRed, domeBlue);

    // Đèn pha kép phía trước + Luồng sáng Volumetric chiếu xuyên sương mù
    const headLampMat = new THREE.MeshBasicMaterial({ color: 0xfffce6 });
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xddeeff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    [-0.68, 0.68].forEach((hx) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.08), headLampMat);
      lamp.position.set(hx, 0.72, -2.38);
      this.exteriorPoliceCar.add(lamp);

      const beamCone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 19.0, 16, 1, true), coneMat);
      beamCone.rotation.x = -Math.PI / 2;
      beamCone.position.set(hx, 0.62, -11.8);
      this.exteriorPoliceCar.add(beamCone);
    });

    // Đèn hậu đỏ phía đuôi xe
    const tailLampMat = new THREE.MeshBasicMaterial({ color: 0xff1118 });
    [-0.72, 0.72].forEach((tx) => {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.08), tailLampMat);
      tail.position.set(tx, 0.74, 2.38);
      this.exteriorPoliceCar.add(tail);
    });

    this.scene.add(this.exteriorPoliceCar);

    // -------------------------------------------------------------------------
    // 2. TIỀN CẢNH BÌA RỪNG GÓC THẤP CHO CẢNH 1 (LOW-ANGLE FOREST EDGE FOREGROUND)
    // Đặt sát vị trí camera thấp bên bìa rừng + một tuyến đường ngang để xe cảnh sát phóng từ Phải sang Trái!
    // -------------------------------------------------------------------------
    this.stage1Group = new THREE.Group();

    // Mặt đường nhựa chạy ngang (Đông - Tây) trước ống kính góc thấp ở Cảnh 1
    const crossRoad = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 11.5),
      new THREE.MeshStandardMaterial({ color: 0x131722, roughness: 0.22, metalness: 0.32 })
    );
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.set(0, 0.03, -12.5);
    this.stage1Group.add(crossRoad);

    // Vạch kẻ vàng giữa đường ngang Cảnh 1
    const crossStripeMat = new THREE.MeshBasicMaterial({ color: 0xffcc33 });
    for (let cx = -48; cx <= 48; cx += 6.5) {
      const cs = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.22), crossStripeMat);
      cs.rotation.x = -Math.PI / 2;
      cs.position.set(cx, 0.045, -12.5);
      this.stage1Group.add(cs);
    }

    // Các tảng đá rêu phong, bụi dương xỉ & gốc thông sát ống kính thấp bên bìa rừng
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x1c2226, roughness: 0.9 });
    const fernMat = new THREE.MeshStandardMaterial({ color: 0x122b1a, roughness: 0.8, side: THREE.DoubleSide });
    [
      [-1.4, 0.18, -5.2, 0.55],
      [1.8, 0.22, -5.6, 0.68],
      [2.6, 0.15, -4.8, 0.42],
      [-2.5, 0.28, -6.2, 0.75]
    ].forEach(([rx, ry, rz, rScale]) => {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rScale, 1), rockMat);
      rock.scale.set(1.3, 0.65, 1.1);
      rock.position.set(rx, ry, rz);
      this.stage1Group.add(rock);
    });

    // Bụi cỏ rừng & lá dương xỉ ngay sát ống kính góc thấp
    for (let f = 0; f < 22; f++) {
      const fx = -3.8 + (f / 22) * 7.6;
      const fz = -4.5 - (f % 3) * 0.65;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65 + (f % 3) * 0.18, 4), fernMat);
      blade.position.set(fx, 0.28, fz);
      blade.rotation.z = (f % 2 === 0 ? 1 : -1) * 0.22;
      this.stage1Group.add(blade);
    }

    this.scene.add(this.stage1Group);

    // -------------------------------------------------------------------------
    // 3. THÀNH PHỐ RỰC SÁNG PHÍA XA XA ĐƯỜNG CHÂN TRỜI (DISTANT HORIZON CITY SKYLINE - CẢNH 2)
    // -------------------------------------------------------------------------
    this.distantCityGroup = new THREE.Group();
    this.distantCityGroup.position.set(-28, 0, -148);

    // Tạo Texture cửa sổ các tòa cao ốc thành phố phát sáng ban đêm
    const cityWinCanvas = document.createElement('canvas');
    cityWinCanvas.width = 128;
    cityWinCanvas.height = 256;
    const cwCtx = cityWinCanvas.getContext('2d');
    cwCtx.fillStyle = '#070b14';
    cwCtx.fillRect(0, 0, 128, 256);
    for (let wy = 10; wy < 246; wy += 12) {
      for (let wx = 8; wx < 120; wx += 14) {
        if (Math.random() > 0.32) {
          cwCtx.fillStyle = Math.random() > 0.25 ? '#ffdd88' : '#77ddff';
          cwCtx.fillRect(wx, wy, 8, 6);
        }
      }
    }
    const cityWinTex = new THREE.CanvasTexture(cityWinCanvas);
    cityWinTex.wrapS = THREE.RepeatWrapping;
    cityWinTex.wrapT = THREE.RepeatWrapping;

    const buildingMat = new THREE.MeshBasicMaterial({ map: cityWinTex });
    const darkTowerMat = new THREE.MeshBasicMaterial({ color: 0x090e1a });

    // Vầng hào quang ánh đèn đô thị phía chân trời xa
    const cityGlowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(95, 28),
      new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.16,
        depthWrite: false
      })
    );
    cityGlowPlane.position.set(0, 12, -4);
    this.distantCityGroup.add(cityGlowPlane);

    // Dựng 20 tòa nhà chọc trời cao thấp tạo đường chân trời thành phố phía xa
    for (let b = 0; b < 20; b++) {
      const bw = 3.2 + (b % 3) * 1.4;
      const bh = 10.0 + ((b * 7) % 18) * 1.45;
      const bd = 3.2 + (b % 2) * 1.5;
      const bx = -38 + b * 4.1;
      const bz = (b % 3) * -2.5;

      const tower = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), b % 4 === 0 ? darkTowerMat : buildingMat);
      tower.position.set(bx, bh / 2, bz);
      this.distantCityGroup.add(tower);

      // Đèn báo hiệu đỏ trên đỉnh các tòa tháp cao
      if (bh > 22) {
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 4.5, 6), darkTowerMat);
        spire.position.set(bx, bh + 2.2, bz);
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.32, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xff2222 })
        );
        beacon.position.set(bx, bh + 4.5, bz);
        this.distantCityGroup.add(spire, beacon);
      }
    }

    this.scene.add(this.distantCityGroup);

    // -------------------------------------------------------------------------
    // 4. BÓNG CĂN BIỆT THỰ GOTHIC ĐỒ SỘ GẦN ĐƯỜNG CHÂN TRỜI (MANSION SILHOUETTE - CẢNH 2 & CẢNH 4)
    // -------------------------------------------------------------------------
    this.horizonMansionGroup = new THREE.Group();
    const silhouetteMat = new THREE.MeshStandardMaterial({
      color: 0x05060b,
      roughness: 0.9,
      metalness: 0.1
    });
    const eerieWindowMat = new THREE.MeshBasicMaterial({ color: 0xd94b18 });
    const crimsonWindowMat = new THREE.MeshBasicMaterial({ color: 0xb81118 });

    // Đồi đá rừng nâng cao thế đất của Biệt Thự
    const mansionHill = new THREE.Mesh(new THREE.ConeGeometry(28, 7.5, 12), silhouetteMat);
    mansionHill.position.set(0, 2.2, 0);
    this.horizonMansionGroup.add(mansionHill);

    // Khối Dinh Thự Trung Tâm & 2 Cánh Đông - Tây
    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(22, 11.5, 11), silhouetteMat);
    mainHall.position.set(0, 9.5, 0);
    this.horizonMansionGroup.add(mainHall);

    // Mái dốc Mansard cổ điển
    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(16.5, 6.2, 4), silhouetteMat);
    mainRoof.rotation.y = Math.PI / 4;
    mainRoof.position.set(0, 18.2, 0);
    this.horizonMansionGroup.add(mainRoof);

    // 2 Tháp Đầu Hồi (Left & Right Gothic Gables)
    [-9.5, 9.5].forEach((gx) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(6.8, 13.5, 12.2), silhouetteMat);
      wing.position.set(gx, 10.5, 0.5);
      const wingSpire = new THREE.Mesh(new THREE.ConeGeometry(5.6, 6.8, 4), silhouetteMat);
      wingSpire.rotation.y = Math.PI / 4;
      wingSpire.position.set(gx, 20.4, 0.5);
      this.horizonMansionGroup.add(wing, wingSpire);
    });

    // Tháp Chuông Trung Tâm Cao Vút (Central Gothic Bell Tower Spire)
    const bellTower = new THREE.Mesh(new THREE.BoxGeometry(5.2, 18.5, 5.2), silhouetteMat);
    bellTower.position.set(0, 14.5, -1.0);
    const bellSpire = new THREE.Mesh(new THREE.ConeGeometry(4.4, 9.5, 4), silhouetteMat);
    bellSpire.rotation.y = Math.PI / 4;
    bellSpire.position.set(0, 28.2, -1.0);
    this.horizonMansionGroup.add(bellTower, bellSpire);

    // Vầng trăng/mây bão ma mị phía sau lưng Biệt Thự giúp nổi bật Cái Bóng To (Silhouette) giữa bầu trời đêm!
    const moonBackdrop = new THREE.Mesh(
      new THREE.CircleGeometry(24, 32),
      new THREE.MeshBasicMaterial({
        color: 0x3b1522,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      })
    );
    moonBackdrop.position.set(0, 16.5, -8.5);
    this.horizonMansionGroup.add(moonBackdrop);

    // Vài ô cửa sổ tầng trên lập lòe ánh đèn đỏ cam ma mị trên bóng đen biệt thự
    [
      [-9.5, 12.5, 6.65],
      [9.5, 12.5, 6.65],
      [0, 18.5, 1.65],
      [-4.2, 9.8, 5.55],
      [4.2, 9.8, 5.55]
    ].forEach(([wx, wy, wz], idx) => {
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(1.15, 2.05),
        idx % 2 === 0 ? crimsonWindowMat : eerieWindowMat
      );
      win.position.set(wx, wy, wz);
      this.horizonMansionGroup.add(win);
    });

    this.scene.add(this.horizonMansionGroup);
  }

  // ===========================================================================
  // CHUYỂN ĐỔI GIỮA 4 CẢNH ĐIỆN ẢNH 3D (STAGE 1 -> STAGE 2 -> STAGE 3 -> STAGE 4)
  // ===========================================================================

  // CẢNH 1: Góc nhìn thấp bên bìa rừng -> Có ánh sáng quét tới -> Xe cảnh sát chạy ngang từ Phải sang Trái
  enterStage1ForestEdge() {
    this.stage = 'STAGE_1_FOREST_EDGE';
    this.stageTimer = 0;

    // Ẩn nội thất buồng lái, thành phố xa & bóng biệt thự để tập trung góc nhìn thấp bên bìa rừng
    this.carInterior.visible = false;
    this.domeLight.visible = false;
    this.passLight.visible = false;
    this.dashGlow.visible = false;

    this.stage1Group.visible = true;
    this.exteriorPoliceCar.visible = true;
    this.distantCityGroup.visible = false;
    this.horizonMansionGroup.visible = false;
    this.crashedTruckGroup.visible = false;

    // Đặt xe cảnh sát ở bên Phải khung hình (x = +42), xoay mũi xe hướng sang Trái (-X: rotation.y = Math.PI / 2)
    this.exteriorPoliceCar.position.set(42.0, 0, -12.5);
    this.exteriorPoliceCar.rotation.set(0, Math.PI / 2, 0);

    // Đặt Camera ở vị trí GÓC NHÌN THẤP BÊN BÌA RỪNG (Low-angle forest edge shot)
    this.camera.position.set(0.8, 0.52, -3.6);
    this.camera.lookAt(3.5, 0.85, -12.5);

    if (this.letterboxWrapperEl) this.letterboxWrapperEl.classList.remove('cinematic-letterbox-hidden');
    if (this.captionTextEl) {
      this.captionTextEl.textContent = 'BÌA RỪNG QUỐC LỘ CŨ — ÁNH ĐÈN TUẦN TRA XÉ TOẠC MÀN ĐÊM MƯA BÃO...';
    }
    if (this.btnSkipCinematic) this.btnSkipCinematic.style.display = 'block';
    this.hintMouselookEl.style.display = 'none';
    this.dialogueBoxEl.style.display = 'none';
  }

  // CẢNH 2: Đổi góc nhìn từ trên cao -> Thấy xe cảnh sát đang chạy phía dưới, xa xa chân trời là Thành Phố, gần chân trời là bóng Biệt Thự
  enterStage2Aerial() {
    this.stage = 'STAGE_2_AERIAL';
    this.stageTimer = 0;

    this.carInterior.visible = false;
    this.domeLight.visible = false;
    this.passLight.visible = false;
    this.dashGlow.visible = false;

    this.stage1Group.visible = false;
    this.exteriorPoliceCar.visible = true;
    this.distantCityGroup.visible = true;
    this.horizonMansionGroup.visible = true;
    this.crashedTruckGroup.visible = false;

    // Đặt Bóng Biệt Thự gần đường chân trời bên phải tuyến đường rừng
    this.horizonMansionGroup.position.set(22.0, 0, -92.0);
    this.horizonMansionGroup.scale.set(0.95, 0.95, 0.95);

    // Đặt Xe Cảnh Sát chạy dọc con đường rừng phía dưới (hướng về -Z)
    this.exteriorPoliceCar.position.set(0, 0, -8.0);
    this.exteriorPoliceCar.rotation.set(0, 0, 0);

    // Đặt Camera ở GÓC NHÌN TỪ TRÊN CAO (High Aerial View)
    this.camera.position.set(-4.5, 22.5, 14.0);
    this.camera.lookAt(0, 2.0, -65.0);

    if (this.letterboxWrapperEl) this.letterboxWrapperEl.classList.remove('cinematic-letterbox-hidden');
    if (this.captionTextEl) {
      this.captionTextEl.textContent = 'PHÍA XA CHÂN TRỜI LÀ THÀNH PHỐ... VÀ BÓNG ĐEN BIỆT THỰ ÔNG BÌNH ĐANG CHỜ ĐỢI.';
    }
    if (this.btnSkipCinematic) this.btnSkipCinematic.style.display = 'block';
    audioManager.playRadioBeep();
  }

  // CẢNH 3: Đổi góc nhìn vào trong xe -> Bắt đầu trải nghiệm buồng lái 3D như thiết lập
  enterStage3InCar() {
    this.stage = 'STAGE_3_IN_CAR';
    this.stageTimer = 0;

    this.stage1Group.visible = false;
    this.exteriorPoliceCar.visible = false;
    this.distantCityGroup.visible = false;
    this.horizonMansionGroup.visible = false;

    this.carInterior.visible = true;
    this.domeLight.visible = true;
    this.passLight.visible = true;
    this.dashGlow.visible = true;

    // Đưa đèn pha và còi hú về vị trí chuẩn theo buồng lái
    this.headlights.position.set(0, 0.85, -2.0);
    this.headlightTarget.position.set(0, 0.1, -38.0);
    this.sirenLight.position.set(0, 1.75, -0.2);

    // Vị trí mắt Sĩ quan An ngồi ghế lái bên trái
    this.camera.position.set(-0.36, 1.18, 0.28);
    this.camera.rotation.order = 'YXZ';
    this.targetRotation = { yaw: 0, pitch: -0.06 };
    this.currentRotation = { yaw: 0, pitch: -0.06 };

    // Ẩn thanh đen điện ảnh, hiện hộp thoại bộ đàm & hướng dẫn rê chuột
    if (this.letterboxWrapperEl) this.letterboxWrapperEl.classList.add('cinematic-letterbox-hidden');
    if (this.btnSkipCinematic) this.btnSkipCinematic.style.display = 'none';
    this.hintMouselookEl.style.display = 'flex';
    this.dialogueBoxEl.style.display = 'block';

    audioManager.playRadioBeep();
  }

  // CẢNH 4: Sau khi ấn [E] ra ngoài kiểm tra -> Đổi góc nhìn từ từ cao lên trời, thấy bóng Biệt Thự to,
  // xe cảnh sát chớp đèn, khói của xe gặp nạn và tên game hiện ra ở giữa thật ngầu + nút [TIẾP TỤC]!
  enterStage4RisingSky() {
    this.stage = 'STAGE_4_RISING_SKY';
    this.stageTimer = 0;

    // Ẩn nội thất trong xe và ẩn UI hội thoại
    this.carInterior.visible = false;
    this.domeLight.visible = false;
    this.passLight.visible = false;
    this.dashGlow.visible = false;

    this.hintMouselookEl.style.display = 'none';
    this.dialogueBoxEl.style.display = 'none';
    this.seatPromptEl.style.display = 'none';
    this.stepoutBannerEl.style.display = 'none';

    // Bật 2 dải đen điện ảnh (không có nút skip, nhường chỗ cho Title Card & nút Tiếp Tục ở giữa)
    if (this.letterboxWrapperEl) this.letterboxWrapperEl.classList.remove('cinematic-letterbox-hidden');
    if (this.btnSkipCinematic) this.btnSkipCinematic.style.display = 'none';
    if (this.captionTextEl) {
      this.captionTextEl.textContent = 'HIỆN TRƯỜNG ĐẦU ĐƯỜNG MÒN RỪNG CẤM — SĨ QUAN AN BƯỚC XUỐNG XE...';
    }

    // Hiện Xe Cảnh Sát 3D đang đỗ chớp đèn Đỏ/Xanh dưới đường
    this.exteriorPoliceCar.visible = true;
    this.exteriorPoliceCar.position.set(-2.4, 0, -6.5);
    this.exteriorPoliceCar.rotation.set(0, -0.22, 0);

    // Hiện Xe Tải Giao Hàng Nexus gặp nạn đang bốc khói nghi ngút và nháy đèn cứu hộ
    this.crashedTruckGroup.visible = true;
    this.crashedTruckGroup.position.set(3.2, 0, -14.8);
    this.crashedTruckGroup.rotation.y = -0.48;

    // Hiện CÁI BÓNG TO CỦA BIỆT THỰ (Giant Mansion Silhouette) sừng sững phía trên rừng thông!
    this.horizonMansionGroup.visible = true;
    this.horizonMansionGroup.position.set(0, 1.5, -72.0);
    this.horizonMansionGroup.scale.set(1.45, 1.45, 1.45);

    // Đặt Camera bắt đầu từ cửa xe cảnh sát, chuẩn bị từ từ bay cao lên trời
    this.camera.position.set(-1.2, 1.75, -1.2);
    this.camera.lookAt(0, 3.2, -32.0);

    // Phát âm thanh sấm sét / nhạc hiệu kịch tính và hiện Title Card "BLOODFIEND - HUYẾT QUỶ" ở giữa màn hình
    audioManager.playDramaticImpact();
    setTimeout(() => {
      if (this.epicTitleOverlayEl && this.stage === 'STAGE_4_RISING_SKY') {
        this.epicTitleOverlayEl.classList.add('visible');
      }
    }, 1100);
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
    this.stageTimer += delta;

    // Hiệu ứng chớp sét (Lightning Flash) làm nổi bật bóng Biệt Thự & rừng đêm
    this.lightningTimer -= delta;
    if (this.lightningTimer <= 0) {
      this.lightningFlashIntensity = 3.2;
      this.lightningTimer = 4.5 + Math.random() * 5.0;
    }
    if (this.lightningFlashIntensity > 0) {
      this.lightningFlashIntensity = Math.max(0, this.lightningFlashIntensity - delta * 8.5);
    }
    this.moonDir.intensity = 1.35 + this.lightningFlashIntensity;

    // Còi cảnh sát nhấp nháy Đỏ / Xanh luân phiên
    const sirenTime = now * 0.009;
    const isRedSiren = Math.sin(sirenTime) > 0;
    this.sirenLight.color.setHex(isRedSiren ? 0xff1e1e : 0x1866ff);
    if (this.sirenDomeRedMat && this.sirenDomeBlueMat) {
      this.sirenDomeRedMat.color.setHex(isRedSiren ? 0xff2222 : 0x440508);
      this.sirenDomeBlueMat.color.setHex(!isRedSiren ? 0x1888ff : 0x051844);
    }
    if (this.hazardLight) {
      this.hazardLight.intensity = Math.sin(now * 0.012) > 0 ? 5.2 : 0.25;
    }

    // Cập nhật khói bốc lên từ xe tải Nexus gặp nạn (nếu đang hiển thị)
    if (this.crashedTruckGroup && this.crashedTruckGroup.visible && this.crashSmokeNodes) {
      for (let i = 0; i < this.crashSmokeNodes.length; i++) {
        const puff = this.crashSmokeNodes[i];
        puff.position.y += puff.userData.speed * delta;
        puff.position.x += Math.sin(now * 0.0025 + puff.userData.phase) * 0.55 * delta;
        const heightProgress = (puff.position.y - 1.4) / 12.0;
        const sc = 0.65 + heightProgress * 2.2;
        puff.scale.set(sc, sc, sc);
        if (puff.position.y > 13.5) {
          puff.position.y = 1.4;
          puff.position.x = (Math.random() - 0.5) * 0.9;
        }
      }
    }

    // Xoay bánh xe cảnh sát 3D
    if (this.exteriorPoliceCar && this.exteriorPoliceCar.visible && this.policeWheels) {
      const wheelSpinSpeed = this.stage === 'STAGE_4_RISING_SKY' ? 0 : 18.0 * delta;
      for (let w of this.policeWheels) {
        w.rotation.x -= wheelSpinSpeed;
      }
    }

    // =========================================================================
    // XỬ LÝ TỪNG GIAI ĐOẠN ĐIỆN ẢNH 3D (STAGE 1 -> 2 -> 3 -> 4)
    // =========================================================================
    if (this.stage === 'STAGE_1_FOREST_EDGE') {
      // CẢNH 1: Góc nhìn thấp bên bìa rừng -> Ánh sáng quét từ Phải sang -> Xe cảnh sát phóng ngang từ Phải (+X) sang Trái (-X)
      if (this.stageTimer < 0.85) {
        // 0.0s .. 0.85s: Ánh đèn pha và đèn còi cảnh sát từ bên phải chiếu sáng mặt đường nhựa ướt mưa trước khi xe lao vào khung hình
        const preX = 36.0 - this.stageTimer * 10.0;
        this.exteriorPoliceCar.position.set(preX, 0, -12.5);
        this.headlights.position.set(preX - 2.0, 0.9, -12.5);
        this.headlightTarget.position.set(preX - 28.0, 0.1, -12.5);
        this.sirenLight.position.set(preX, 2.0, -12.5);
        this.camera.position.set(0.8, 0.52, -3.6);
        this.camera.lookAt(4.5, 0.85, -12.5);
      } else {
        // Xe cảnh sát lao vút ngang qua trước ống kính từ Phải (+27.5) sang Trái (-44)
        const passTime = this.stageTimer - 0.85;
        const carX = 27.5 - passTime * 19.5;
        this.exteriorPoliceCar.position.set(carX, 0, -12.5);
        this.headlights.position.set(carX - 2.0, 0.9, -12.5);
        this.headlightTarget.position.set(carX - 28.0, 0.1, -12.5);
        this.sirenLight.position.set(carX, 2.0, -12.5);

        // Độ rung áp lực gió khi xe cảnh sát vụt ngang qua sát camera bên bìa rừng
        const distToCam = Math.abs(carX);
        const shake = distToCam < 9.0 ? (1.0 - distToCam / 9.0) * 0.045 : 0;
        this.camera.position.set(
          0.8 + Math.sin(now * 0.06) * shake,
          0.52 + Math.cos(now * 0.08) * shake,
          -3.6
        );
        // Camera lia nhẹ theo hướng xe chạy từ phải sang trái
        const lookX = THREE.MathUtils.clamp(carX * 0.35, -8.5, 6.0);
        this.camera.lookAt(lookX, 0.88, -12.5);

        // Khi chiếc xe đi hết khung hình bên trái -> Đổi sang Cảnh 2 (Góc nhìn từ trên cao)!
        if (carX < -42.0) {
          this.enterStage2Aerial();
        }
      }
    } else if (this.stage === 'STAGE_2_AERIAL') {
      // CẢNH 2: Góc nhìn từ trên cao -> Thấy xe cảnh sát đang chạy phía dưới, xa xa chân trời là Thành Phố, gần chân trời là bóng Biệt Thự
      const t = Math.min(this.stageTimer / 6.2, 1.0);
      const smoothT = t * t * (3 - 2 * t);

      // Xe cảnh sát chạy dọc con đường rừng bên dưới
      const carZ = -6.0 - this.stageTimer * 3.2;
      const carSwayX = Math.sin(this.stageTimer * 1.6) * 0.35;
      this.exteriorPoliceCar.position.set(carSwayX, 0, carZ);
      this.headlights.position.set(carSwayX, 0.9, carZ - 2.2);
      this.headlightTarget.position.set(carSwayX, 0.1, carZ - 34.0);
      this.sirenLight.position.set(carSwayX, 2.2, carZ);

      // Dịch chuyển hàng cây và vạch kẻ đường để tạo cảm giác xe đang phóng nhanh qua rừng
      for (let s of this.stripes) {
        s.position.z += 22.0 * delta;
        if (s.position.z > 12) s.position.z = -98;
      }
      for (let tr of this.trees) {
        tr.position.z += 22.0 * delta;
        if (tr.position.z > 12) tr.position.z = -100;
      }

      // Camera từ trên cao lướt theo xe cảnh sát và hạ dần xuống gần nóc xe trước khi vào Cảnh 3 (trong xe)
      const camX = THREE.MathUtils.lerp(-4.2, 0.0, smoothT);
      const camY = THREE.MathUtils.lerp(22.0, 11.5, smoothT);
      const camZ = THREE.MathUtils.lerp(14.5, 1.5, smoothT);
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(
        THREE.MathUtils.lerp(-2.0, 4.0, smoothT),
        THREE.MathUtils.lerp(4.5, 3.0, smoothT),
        -75.0
      );

      if (this.stageTimer >= 6.2) {
        this.enterStage3InCar();
      }
    } else if (this.stage === 'STAGE_3_IN_CAR') {
      // CẢNH 3: Góc nhìn bên trong buồng lái xe cảnh sát
      this.currentRotation.yaw = THREE.MathUtils.lerp(this.currentRotation.yaw, this.targetRotation.yaw, 0.12);
      this.currentRotation.pitch = THREE.MathUtils.lerp(this.currentRotation.pitch, this.targetRotation.pitch, 0.12);

      const engineVib = Math.sin(now * 0.035) * 0.0018;
      this.camera.rotation.y = this.currentRotation.yaw;
      this.camera.rotation.x = this.currentRotation.pitch + engineVib;

      // Kiểm tra hướng nhìn của người chơi sang ghế phụ (yaw < -0.22) để hiện nút Nhặt Súng [E] hoặc Cầm Tập Hồ Sơ Đọc [E]
      if (this.currentRotation.yaw < -0.22 && !playerInventory.isReadingDoc && !playerInventory.isReadingCaseFile) {
        if (!playerInventory.hasPickedPistolInCar && this.currentRotation.yaw > -0.62) {
          this.seatFocusTarget = 'pistol';
          this.seatPromptEl.textContent = '🔫 [E] NHẶT SÚNG LỤC CẢNH SÁT BỎ VÀO TÚI ĐỒ (100 VIÊN ĐẠN)';
          this.seatPromptEl.style.display = 'block';
        } else {
          this.seatFocusTarget = 'clipboard';
          this.seatPromptEl.textContent = '📋 [E] CẦM TẬP HỒ SƠ VỤ ÁN LÊN ĐỌC';
          this.seatPromptEl.style.display = 'block';
        }
      } else {
        this.seatFocusTarget = null;
        if (this.seatPromptEl) this.seatPromptEl.style.display = 'none';
      }

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

      // Tự động chạy hội thoại (Auto-Advance)
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
    } else if (this.stage === 'STAGE_4_RISING_SKY') {
      // CẢNH 4: Sau khi ấn [E] ra ngoài kiểm tra -> Camera từ từ bay cao lên trời,
      // thấy bóng Biệt Thự to phía trước, xe cảnh sát chớp đèn bên dưới, khói của xe gặp nạn bốc lên & Tên Game hiện ra ở giữa!
      const riseProgress = Math.min(this.stageTimer / 6.5, 1.0);
      const easeOut = 1 - Math.pow(1 - riseProgress, 3);

      const camX = THREE.MathUtils.lerp(-1.2, 0.0, easeOut) + Math.sin(now * 0.0008) * 0.35;
      const camY = THREE.MathUtils.lerp(1.75, 16.5, easeOut);
      const camZ = THREE.MathUtils.lerp(-1.2, 11.5, easeOut);
      this.camera.position.set(camX, camY, camZ);

      const lookY = THREE.MathUtils.lerp(2.5, 8.8, easeOut);
      const lookZ = THREE.MathUtils.lerp(-22.0, -52.0, easeOut);
      this.camera.lookAt(0, lookY, lookZ);

      // Đèn còi xe cảnh sát & đèn pha chiếu sáng hiện trường bên dưới
      this.sirenLight.position.set(-2.4, 2.1, -6.5);
      this.headlights.position.set(-2.2, 0.9, -8.5);
      this.headlightTarget.position.set(2.5, 0.5, -16.0);
    }

    // Mưa rơi xuyên suốt cả 4 cảnh
    if (this.rainSystem) {
      const positions = this.rainSystem.geometry.attributes.position.array;
      const rainZSpeed = this.stage === 'STAGE_3_IN_CAR' ? this.carSpeed * 0.6 : 2.5;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 18 * delta;
        positions[i + 1] += rainZSpeed * delta;
        if (positions[i] < 0 || positions[i + 1] > 8) {
          positions[i] = 8 + Math.random() * 8;
          positions[i + 1] = -Math.random() * 45;
        }
      }
      this.rainSystem.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

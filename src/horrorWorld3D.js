// Thế Giới 3D Góc Nhìn Thứ Nhất Trau Chuốt (High-Polish Horror World) - Three.js
import * as THREE from 'three';
import { audioManager } from './audio.js';
import { VHSPlayer } from './vhsPlayer.js';
import {
  playerInventory,
  HOSOSO_VU_AN_DEFAULT
} from './playerInventoryAndCharacter.js';
import { buildMansionInterior } from './mansionInterior3D.js';

export class HorrorWorld3D {
  constructor(canvas, onReturnToMenu) {
    this.canvas = canvas;
    this.onReturnToMenu = onReturnToMenu;

    this.mode = 'survival';
    this.isFlying = false;
    this.isGrounded = true;
    this.verticalVelocity = 0;

    // Góc nhìn thứ nhất cố định
    this.cameraViewMode = 'first-person';

    // Danh sách hộp va chạm vật lý AABB (chống đi xuyên tường, cây cối, xe cộ và nội thất)
    this.colliders = [];
    this.interactables = [];
    this.thrownItems = [];
    this.bulletImpacts = [];
    this.raycaster = new THREE.Raycaster();

    // Thiết lập Three.js Scene, Camera & WebGL Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040307);
    this.scene.fog = new THREE.FogExp2(0x040307, 0.042);

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 220);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1.0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = false;

    // Vị trí mắt thật của nhân vật Sĩ quan An
    this.playerPos = new THREE.Vector3(0, 1.68, 2.5);
    this.camera.position.copy(this.playerPos);
    this.cameraRotation = { yaw: 0, pitch: 0 };
    this.flashlightTargetPos = new THREE.Vector3();

    // Biến trạng thái người chơi
    this.keys = {};
    this.hasKnife = playerInventory.hasItem('combat_knife');
    this.hasWatchedVideo = false;
    this.hasInspectedTruck = false;
    this.isFlashlightOn = true;
    this.moveSpeed = 4.5;
    this.stepTimer = 0;
    this.headBobTimer = 0;
    this.currentFloorLabel = 'BÌA RỪNG CẤM';

    // Khởi tạo giao diện Túi Đồ 9 ô [G] & Hồ Sơ Vụ Án
    playerInventory.initUI();
    playerInventory.onNotification = (msg) => this.showMonologue(msg, 4500);
    playerInventory.onEquipChange = () => this.syncEquippedViewmodels();

    // Tạo Canvas Textures thủ công cho độ chân thực cao (Nexus Logistics, Hộp Thuốc Y Tế, Đá Gothic, Gỗ Lim)
    this.textures = this.generateProceduralTextures();
    this.textures.mansionBrick = this.textures.stoneBrick;

    // UI Overlay
    this.createUIOverlay();

    // Thiết lập Ánh sáng & Cảnh quan
    this.setupLighting();
    this.buildWorld();
    this.buildFirstPersonKnife(); // Xây dựng mô hình dao, súng lục 100 viên & tập hồ sơ góc nhìn thứ nhất
    this.syncEquippedViewmodels();

    // Thiết lập Tương tác & Phím điều khiển
    this.setupInteractions();
    this.setupControls();

    this.clock = new THREE.Clock();
    this.isRunning = true;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Lời dẫn đầu game
    this.showMonologue("An: 'Đã tới bìa rừng... Bấm [G] để bật/ẩn thanh túi đồ 9 ô, hoặc lại gần xe cảnh sát bấm [E] nếu chưa lấy Súng & Hồ sơ.'", 7500);
  }

  // Hàm tiện ích đăng ký hộp va chạm vật lý AABB (chống đi xuyên vật thể)
  addCollider(minX, maxX, minY, maxY, minZ, maxZ, label = 'prop') {
    this.colliders.push({ minX, maxX, minY, maxY, minZ, maxZ, label });
  }

  showNotification(text) {
    this.showMonologue(text, 6000);
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

    // 7. Texture Hộp Thuốc Y Tế & Bảo Quản Huyết Thanh Nexus (Detailed Pharmaceutical MedBox)
    const medCanvas = document.createElement('canvas');
    medCanvas.width = 256;
    medCanvas.height = 256;
    const mCtx = medCanvas.getContext('2d');
    mCtx.fillStyle = '#eef3f9';
    mCtx.fillRect(0, 0, 256, 256);
    // Dải xanh y tế Nexus trên và dưới
    mCtx.fillStyle = '#0e2d5c';
    mCtx.fillRect(0, 0, 256, 48);
    mCtx.fillRect(0, 210, 256, 46);
    mCtx.fillStyle = '#1e68cc';
    mCtx.fillRect(0, 48, 256, 8);
    // Chữ NEXUS BIOPHARMA
    mCtx.fillStyle = '#ffffff';
    mCtx.font = 'bold 22px Arial, sans-serif';
    mCtx.textAlign = 'center';
    mCtx.fillText('NEXUS BIOPHARMA', 128, 32);
    // Chữ thập y tế màu đỏ nổi bật bên trái
    mCtx.fillStyle = '#d91b24';
    mCtx.fillRect(28, 86, 54, 18);
    mCtx.fillRect(46, 68, 18, 54);
    // Thông tin nhãn thuốc & mã vạch bên phải
    mCtx.fillStyle = '#0e2d5c';
    mCtx.textAlign = 'left';
    mCtx.font = 'bold 17px monospace';
    mCtx.fillText('SERUM H-04 (50ml)', 96, 84);
    mCtx.fillStyle = '#8a1117';
    mCtx.font = 'bold 14px monospace';
    mCtx.fillText('☣ BIO-HAZARD LV.4', 96, 108);
    mCtx.fillStyle = '#2b3a4a';
    mCtx.font = '13px monospace';
    mCtx.fillText('STORAGE: -20°C COLD', 96, 128);
    mCtx.fillText('LOT: #NX-1998-B09', 28, 158);
    // Mã vạch (Barcode)
    for (let bx = 28; bx < 220; bx += (bx % 3 === 0 ? 6 : 4)) {
      mCtx.fillStyle = '#111111';
      mCtx.fillRect(bx, 170, bx % 2 === 0 ? 3 : 1.5, 28);
    }
    mCtx.fillStyle = '#a8d1ff';
    mCtx.textAlign = 'center';
    mCtx.font = 'bold 14px Arial, sans-serif';
    mCtx.fillText('STERILE MEDICAL COLD-CHAIN', 128, 238);
    // Viền khung kim loại quanh hộp thuốc
    mCtx.strokeStyle = '#6c7c90';
    mCtx.lineWidth = 6;
    mCtx.strokeRect(3, 3, 250, 250);
    const nexusMedBox = new THREE.CanvasTexture(medCanvas);
    nexusMedBox.colorSpace = THREE.SRGBColorSpace;

    // 8. Texture Thùng Carton Vận Chuyển Dược Phẩm Nexus (Detailed Pharmaceutical Shipping Carton)
    const cartonCanvas = document.createElement('canvas');
    cartonCanvas.width = 256;
    cartonCanvas.height = 256;
    const cCtx = cartonCanvas.getContext('2d');
    cCtx.fillStyle = '#9c6b3b';
    cCtx.fillRect(0, 0, 256, 256);
    cCtx.strokeStyle = '#633f1d';
    cCtx.lineWidth = 6;
    cCtx.strokeRect(4, 4, 248, 248);
    // Băng keo niêm phong Nexus ở giữa
    cCtx.fillStyle = '#d8c29d';
    cCtx.fillRect(0, 114, 256, 28);
    cCtx.fillStyle = '#0f2b5c';
    cCtx.font = 'bold 15px Arial, sans-serif';
    cCtx.textAlign = 'center';
    cCtx.fillText('NEXUS SEALED • DO NOT TAMPER', 128, 133);
    // Nhãn vận đơn trắng dán trên thùng
    cCtx.fillStyle = '#f5f5f0';
    cCtx.fillRect(24, 24, 130, 74);
    cCtx.fillStyle = '#b81414';
    cCtx.font = 'bold 14px monospace';
    cCtx.textAlign = 'left';
    cCtx.fillText('⚠ FRAGILE VIALS', 32, 44);
    cCtx.fillStyle = '#111';
    cCtx.font = '12px monospace';
    cCtx.fillText('TO: DR. BINH ESTATE', 32, 64);
    cCtx.fillText('QTY: 24 AMPULES', 32, 82);
    const nexusCarton = new THREE.CanvasTexture(cartonCanvas);
    nexusCarton.colorSpace = THREE.SRGBColorSpace;

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
      doorWood,
      nexusMedBox,
      nexusCarton
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

      <!-- Góc trên bên phải: Nút mở Menu Tạm Dừng [ESC] -->
      <div class="fp-mode-badge">
        <button class="pixel-btn btn-secondary" id="fp-btn-pause" style="padding: 8px 14px; font-size: 0.72rem; border-color: #8c6d3b; color: #e2c893;">
          ⚜ MENU [ESC]
        </button>
      </div>

      <div class="fp-hud-bottom">
        <div class="fp-inventory">
          <div class="fp-slot active" id="slot-flashlight">⚜ 🔦 ĐÈN PIN [F: BẬT]</div>
          <div class="fp-slot" id="slot-knife">⚜ 🎒 THANH 9 Ô [G] • 1-9 CHỌN Ô</div>
        </div>
        <div class="fp-help">
          [WASD] Di chuyển | [G] Ẩn/Hiện thanh 9 ô | [1-9] Chọn ô | [Q] Ném đồ | [CLICK] Bắn/Đọc/Chém | [E] Tương tác
        </div>
      </div>

      <!-- Menu Tạm Dừng Cổ Kính Gothic [ESC] -->
      <div class="fp-story-modal" id="fp-pause-modal" style="display: none;">
        <div class="fp-modal-card gothic-pause-card">
          <div class="gothic-ornament">⚜ ❖ ⚜</div>
          <h2 id="fp-pause-title">TẠM DỪNG ĐIỀU TRA</h2>
          <p style="color: #c8b69e; font-size: 1.25rem; margin-bottom: 22px; line-height: 1.5;">
            Hồ sơ vụ án: <strong>Biệt Thự Bác Sĩ Bình (Khu Rừng Cấm)</strong>
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
    this.dirLight.castShadow = (this.mode === 'creative');
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.bias = -0.001;
    this.scene.add(this.dirLight);

    // ĐÈN PIN CHIẾN THUẬT SIÊU SÁNG (Tactical Torch - Tắt dynamic shadow để 60FPS mượt mà)
    this.flashlight = new THREE.SpotLight(0xfff8e7, 5.5, 38, Math.PI / 5.2, 0.35, 1.1);
    this.flashlight.position.copy(this.camera.position);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.flashlight.castShadow = false;
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
      this.dirLight.castShadow = true;

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
      this.dirLight.castShadow = false;

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

    // Đất rừng bùn lầy bao la (Chia quanh móng Biệt Thự x: -24..24, z: -99..-63 để KHÔNG BAO GIỜ che lấp cầu thang xuống Hầm B1!)
    const forestGroundMat = new THREE.MeshStandardMaterial({
      map: this.textures.mud,
      roughness: 0.92,
      metalness: 0.05
    });
    this.textures.mud.repeat.set(24, 32);
    const addForestGroundPatch = (cx, cz, w, d) => {
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(w, d), forestGroundMat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(cx, 0, cz);
      this.scene.add(patch);
    };
    addForestGroundPatch(0, 6.0, 200, 138);     // Toàn bộ rừng & quốc lộ phía trước biệt thự (z = -63 .. +75)
    addForestGroundPatch(0, -142.0, 200, 86);   // Rừng phía sau biệt thự (z = -185 .. -99)
    addForestGroundPatch(-62.0, -81.0, 76, 36); // Rừng bên cánh Tây biệt thự (x = -100 .. -24, z = -99 .. -63)
    addForestGroundPatch(62.0, -81.0, 76, 36);  // Rừng bên cánh Đông biệt thự (x = 24 .. 100, z = -99 .. -63)

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

    // 5. Rừng thông rậm rạp bao bọc hai bên con đường mòn và bao quanh biệt thự (Tối ưu GPU bằng InstancedMesh: 690 meshes -> chỉ còn 6 draw calls!)
    this.pineTrunkGeo = new THREE.CylinderGeometry(0.28, 0.48, 9, 7);
    this.pineTrunkMat = new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.95 });
    this.pineFolMat = new THREE.MeshStandardMaterial({ color: 0x09140c, roughness: 0.88 });
    this.pineConeGeos = [
      new THREE.ConeGeometry(3.0, 3.2, 7),
      new THREE.ConeGeometry(2.52, 3.2, 7),
      new THREE.ConeGeometry(2.04, 3.2, 7),
      new THREE.ConeGeometry(1.56, 3.2, 7),
      new THREE.ConeGeometry(1.08, 3.2, 7)
    ];

    const pineTransforms = [];
    for (let i = 0; i < 115; i++) {
      const z = -115 + Math.random() * 130;
      const side = Math.random() > 0.5 ? 1 : -1;
      const minX = (z > -45 && z < -2) ? 4.8 : 9.5;
      const x = side * (minX + Math.random() * 45);
      if (z > -3.0 && z < 10.5) continue;
      if (Math.abs(x) < 42 && z <= -45 && z >= -95) continue;
      const scale = 0.85 + Math.random() * 0.65;
      pineTransforms.push({ x, z, scale });
      const r = 0.42 * scale;
      this.addCollider(x - r, x + r, 0, 6.0, z - r, z + r, 'pine_tree');
    }

    const pCount = pineTransforms.length;
    const trunkInst = new THREE.InstancedMesh(this.pineTrunkGeo, this.pineTrunkMat, pCount);
    const coneInsts = this.pineConeGeos.map(geo => new THREE.InstancedMesh(geo, this.pineFolMat, pCount));
    const dummy = new THREE.Object3D();

    for (let idx = 0; idx < pCount; idx++) {
      const { x, z, scale } = pineTransforms[idx];
      dummy.position.set(x, 4.5 * scale, z);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(idx, dummy.matrix);

      for (let l = 0; l < 5; l++) {
        dummy.position.set(x, (4.2 + l * 1.9) * scale, z);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        coneInsts[l].setMatrixAt(idx, dummy.matrix);
      }
    }
    trunkInst.instanceMatrix.needsUpdate = true;
    this.scene.add(trunkInst);
    coneInsts.forEach(ci => {
      ci.instanceMatrix.needsUpdate = true;
      this.scene.add(ci);
    });

    // 6. Cây Đại Thụ & Thi Thể Người Giao Hàng Rơi Xuống bên vệ đường mòn
    this.buildCorpseTree(-2.6, 0, -29);

    // 7. Vệt Máu Visceral Dẫn Từ Xe Tải -> Thi Thể -> Cổng Sắt -> Thềm Cửa Biệt Thự
    this.buildVisceralBloodTrail();

    // 8. CỔNG SẮT CŨ KỸ RỈ SÉT & SÂN BIỆT THỰ BỎ HOANG ĐẦY CỎ DẠI, VẾT MÁU, ĐÀI PHUN NƯỚC MÁU
    this.buildAbandonedCourtyardAndGate();

    // 9. CĂN BIỆT THỰ HUYẾT QUỶ ĐỒ SỘ, GOTHIC CỔ KÍNH & BỆ THỀM THẤP DỄ BƯỚC VÀO
    this.buildMansionEntrance(0, 0, -75);

    // 10. Hạt mưa rơi rả rích trong không gian (Tối ưu hóa GPU Buffer)
    const rainGeo = new THREE.BufferGeometry();
    const rainCount = 1200;
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 85;
      rainPositions[i + 1] = Math.random() * 32;
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

    // Súng lục & Tập hồ sơ vụ án đặt trên ghế phụ bên trong xe cảnh sát (hiển thị nếu chưa nhặt)
    this.cruiserCaseFileMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.04, 0.42),
      new THREE.MeshStandardMaterial({ color: 0xd8c298, roughness: 0.7 })
    );
    this.cruiserCaseFileMesh.position.set(0.45, 0.96, -0.15);
    this.cruiserCaseFileMesh.visible = !playerInventory.hasItem('case_file');
    car.add(this.cruiserCaseFileMesh);

    this.cruiserPistolMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.12, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x22262e, metalness: 0.85, roughness: 0.25 })
    );
    this.cruiserPistolMesh.position.set(0.25, 0.98, 0.12);
    this.cruiserPistolMesh.visible = !playerInventory.hasItem('service_pistol');
    car.add(this.cruiserPistolMesh);

    this.scene.add(car);
    this.addCollider(x - 1.1, x + 1.1, 0, 2.0, z - 2.35, z + 2.35, 'police_car');
  }

  // XE GIAO HÀNG NEXUS - THÙNG XE RỖNG THẤY TOÀN BỘ BÊN TRONG & CÁC HỘP THUỐC CHI TIẾT
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
    const cargoDomeLight = new THREE.PointLight(0xffddaa, 3.6, 7.5);
    cargoDomeLight.position.set(0, 2.65, 2.0);
    truck.add(cargoDomeLight);

    // ========================================================
    // 3. CHI TIẾT HỘP THUỐC Y TẾ NEXUS, KHAY ỐNG NGHIỆM HUYẾT THANH & THIẾT BỊ TRONG THÙNG XE
    // ========================================================
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x3b4452, metalness: 0.85, roughness: 0.28 });
    const medBoxMat = new THREE.MeshStandardMaterial({
      map: this.textures.nexusMedBox,
      roughness: 0.35,
      metalness: 0.15
    });
    const medLidMat = new THREE.MeshStandardMaterial({ color: 0x0e2d5c, roughness: 0.3, metalness: 0.4 });
    const redCrossMat = new THREE.MeshBasicMaterial({ color: 0xe61924 });
    const latchMat = new THREE.MeshStandardMaterial({ color: 0xc8d2dc, metalness: 0.9, roughness: 0.2 });
    const vialRedMat = new THREE.MeshBasicMaterial({ color: 0xff1838 });
    const vialCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0d8 });

    // 4 Thanh trụ đứng của giá kệ y tế
    [[-1.16, 0.3], [-0.74, 0.3], [-1.16, 3.3], [-0.74, 3.3]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.85, 0.04), rackMat);
      post.position.set(px, 1.4, pz);
      truck.add(post);
    });

    for (let sh = 0; sh < 3; sh++) {
      const shelfY = 0.88 + sh * 0.56;
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.035, 3.25), rackMat);
      shelf.position.set(-0.95, shelfY, 1.8);
      truck.add(shelf);

      // Các hộp thuốc chuyên dụng Nexus Biopharma (có nắp xanh, chốt khóa kim loại, chữ thập đỏ & khay ống huyết thanh)
      for (let kb = 0; kb < 3; kb++) {
        const boxZ = 0.75 + kb * 0.92;
        const medGroup = new THREE.Group();
        medGroup.position.set(-0.94, shelfY + 0.16, boxZ);
        medGroup.rotation.y = (kb === 1 && sh === 1) ? 0.18 : -0.05;

        // Thân hộp thuốc có nhãn NEXUS BIOPHARMA / SERUM H-04 / BIOHAZARD
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.44), medBoxMat);
        medGroup.add(body);

        // Nắp hộp bảo quản lạnh màu xanh đậm + tay xách y tế
        const lid = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.045, 0.46), medLidMat);
        lid.position.y = 0.135;
        medGroup.add(lid);

        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.16), latchMat);
        handle.position.set(0, 0.17, 0);
        medGroup.add(handle);

        // 2 Chốt gài kim loại mặt bên phải (hướng vào lòng thùng xe)
        [-0.12, 0.12].forEach(lz => {
          const latch = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.04), latchMat);
          latch.position.set(0.185, 0.06, lz);
          medGroup.add(latch);
        });

        // Biểu tượng chữ thập y tế nổi trên mặt hộp
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.03, 0.09), redCrossMat);
        crossH.position.set(0.185, -0.02, 0);
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.09, 0.03), redCrossMat);
        crossV.position.set(0.185, -0.02, 0);
        medGroup.add(crossH, crossV);

        truck.add(medGroup);

        // Đặt thêm các khay ống nghiệm thủy tinh chứa Huyết thanh H-04 phát sáng xen kẽ giữa các hộp thuốc
        if (kb < 2) {
          const rackTray = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.32), rackMat);
          rackTray.position.set(-0.92, shelfY + 0.04, boxZ + 0.46);
          truck.add(rackTray);

          for (let v = 0; v < 4; v++) {
            const vial = new THREE.Mesh(
              new THREE.CylinderGeometry(0.024, 0.024, 0.19, 8),
              (v + sh) % 2 === 0 ? vialRedMat : vialCyanMat
            );
            vial.position.set(
              -0.98 + (v % 2) * 0.11,
              shelfY + 0.13,
              boxZ + 0.39 + Math.floor(v / 2) * 0.12
            );
            truck.add(vial);

            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.03, 8), latchMat);
            cap.position.set(vial.position.x, shelfY + 0.23, vial.position.z);
            truck.add(cap);
          }
        }
      }
    }

    // Thùng giữ nhiệt lạnh y tế (Bio-Specimen Cold Storage Chest) bị bật nắp trên sàn xe, lộ các ống thuốc bên trong
    const cooler = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.5, 0.62),
      new THREE.MeshStandardMaterial({ color: 0x16468c, roughness: 0.35 })
    );
    cooler.position.set(0.3, 0.65, 1.5);
    cooler.rotation.y = 0.35;
    cooler.rotation.z = 0.25;
    truck.add(cooler);

    // Các lọ thuốc huyết thanh lăn lóc trên sàn thùng xe quanh thùng lạnh
    for (let sv = 0; sv < 6; sv++) {
      const spilledVial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, 0.22, 8),
        sv % 2 === 0 ? vialRedMat : vialCyanMat
      );
      spilledVial.rotation.z = Math.PI / 2;
      spilledVial.rotation.y = sv * 0.7;
      spilledVial.position.set(-0.1 + (sv % 3) * 0.28, 0.51, 1.2 + Math.floor(sv / 3) * 0.55);
      truck.add(spilledVial);
    }

    // Vũng dung dịch mẫu sinh học phát sáng mờ loang lổ trên sàn xe
    const bioPuddle = new THREE.Mesh(
      new THREE.CircleGeometry(0.75, 12),
      new THREE.MeshBasicMaterial({ color: 0x33ff88, transparent: true, opacity: 0.65 })
    );
    bioPuddle.rotation.x = -Math.PI / 2;
    bioPuddle.position.set(0.2, 0.49, 1.6);
    truck.add(bioPuddle);

    // Kiện hàng carton dược phẩm Nexus có tem nhãn vận đơn trên sàn xe và rơi vãi ra ngoài
    const boxMat = new THREE.MeshStandardMaterial({
      map: this.textures.nexusCarton,
      roughness: 0.8
    });
    for (let b = 0; b < 7; b++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.48), boxMat);
      if (b < 3) {
        box.position.set(0.1 + (b % 2) * 0.45, 0.65, 2.6 + b * 0.45);
      } else {
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
    // Đăng ký vật lý cho đầu xe tải & gốc cây (chừa phần đuôi xe để người chơi có thể tiến sát quan sát hộp thuốc)
    this.addCollider(x - 1.3, x + 2.2, 0, 3.0, z - 3.4, z + 1.8, 'nexus_truck');
  }

  // CÂY THÔNG TỰ NHIÊN NHIỀU TẦNG CÀNH LÁ (Tái sử dụng Geometry & Material tối ưu draw call)
  buildPineTree(x, y, z, scale = 1) {
    const tree = new THREE.Group();
    tree.position.set(x, y, z);
    tree.scale.set(scale, scale, scale);

    const trunk = new THREE.Mesh(this.pineTrunkGeo, this.pineTrunkMat);
    trunk.position.y = 4.5;
    tree.add(trunk);

    for (let l = 0; l < 5; l++) {
      const fol = new THREE.Mesh(this.pineConeGeos[l], this.pineFolMat);
      fol.position.y = 4.2 + l * 1.9;
      tree.add(fol);
    }

    this.scene.add(tree);
    const r = 0.42 * scale;
    this.addCollider(x - r, x + r, 0, 6.0, z - r, z + r, 'pine_tree');
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

    // 1. NỀN SÂN ĐÁ CỔ NỨT VỠ & RÊU PHONG (Chia quanh chân móng Biệt Thự x: -24..24, z: -99..-63 để KHÔNG che lấp Cầu Thang Hầm B1!)
    this.textures.stone.repeat.set(14, 10);
    const addCourtyardPatch = (cx, cz, w, d) => {
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(w, d), darkStoneMat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(cx, 0.015, cz);
      courtGroup.add(patch);
    };
    addCourtyardPatch(0, -54.5, 88, 17);     // Sân chính phía trước Biệt Thự (z = -63 .. -46)
    addCourtyardPatch(-34.0, -81.0, 20, 36); // Sân bên hông Cánh Tây (x = -44 .. -24, z = -99 .. -63)
    addCourtyardPatch(34.0, -81.0, 20, 36);  // Sân bên hông Cánh Đông (x = 24 .. 44, z = -99 .. -63)

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

    // Hàng rào sắt mũi giáo cũ kỹ chạy dọc mặt tiền sân (Gộp các song sắt thành InstancedMesh để tăng FPS tối đa)
    const picketTransforms = [];
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
        const rotZ = Math.random() < 0.18 ? (Math.random() - 0.5) * 0.22 : 0;
        picketTransforms.push({ x: fx + sb, y: 1.55, z: gateZ, rotZ });
      }

      // Trụ đá ngăn cách mỗi nhịp rào
      const fencePost = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.8, 0.65), mossyStoneMat);
      fencePost.position.set(fx + 2.2, 1.4, gateZ);
      courtGroup.add(fencePost);
    }

    const picketGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.95, 6);
    const picketInst = new THREE.InstancedMesh(picketGeo, rustyIronMat, picketTransforms.length);
    const dummyPicket = new THREE.Object3D();
    picketTransforms.forEach((pt, idx) => {
      dummyPicket.position.set(pt.x, pt.y, pt.z);
      dummyPicket.rotation.set(0, 0, pt.rotZ);
      dummyPicket.scale.set(1, 1, 1);
      dummyPicket.updateMatrix();
      picketInst.setMatrixAt(idx, dummyPicket.matrix);
    });
    picketInst.instanceMatrix.needsUpdate = true;
    courtGroup.add(picketInst);

    // 3. CỎ DẠI 3D MỌC UM TÙM HOANG PHẾ KHẮP SÂN (Giữ nguyên 100% số lượng bụi cỏ, dùng InstancedMesh gộp 800 lá cỏ chỉ còn 4 draw calls!)
    const grassColors = [0x1c2b14, 0x253318, 0x2e3015, 0x162410];
    const grassMats = grassColors.map(col => new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.9,
      side: THREE.DoubleSide
    }));
    const grassBuckets = [[], [], [], []];

    for (let g = 0; g < 145; g++) {
      const gx = (Math.random() - 0.5) * 56;
      const gz = -46.5 - Math.random() * 15.5;
      if (Math.abs(gx) < 1.1 && Math.random() < 0.6) continue;

      const bucketIdx = g % grassMats.length;
      const bladeCount = 4 + (g % 4);

      for (let b = 0; b < bladeCount; b++) {
        const bladeH = 0.35 + Math.random() * 0.55;
        grassBuckets[bucketIdx].push({
          x: gx + (Math.random() - 0.5) * 0.28,
          y: 0.01 + bladeH / 2,
          z: gz + (Math.random() - 0.5) * 0.28,
          scaleY: bladeH,
          rx: (Math.random() - 0.5) * 0.45,
          rz: (Math.random() - 0.5) * 0.45
        });
      }
    }

    const baseBladeGeo = new THREE.ConeGeometry(0.08, 1.0, 4);
    const dummyBlade = new THREE.Object3D();
    grassBuckets.forEach((bucket, bIdx) => {
      if (bucket.length === 0) return;
      const inst = new THREE.InstancedMesh(baseBladeGeo, grassMats[bIdx], bucket.length);
      bucket.forEach((bl, idx) => {
        dummyBlade.position.set(bl.x, bl.y, bl.z);
        dummyBlade.rotation.set(bl.rx, 0, bl.rz);
        dummyBlade.scale.set(1, bl.scaleY, 1);
        dummyBlade.updateMatrix();
        inst.setMatrixAt(idx, dummyBlade.matrix);
      });
      inst.instanceMatrix.needsUpdate = true;
      courtGroup.add(inst);
    });

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
    // Đăng ký vật lý cho Cổng Sắt, Hàng Rào Mặt Tiền & Đài Phun Nước Máu (chừa cổng giữa x: -3.1..3.1 để đi qua)
    this.addCollider(-46, -3.1, 0, 3.5, -46.35, -45.65, 'courtyard_fence_L');
    this.addCollider(3.1, 46, 0, 3.5, -46.35, -45.65, 'courtyard_fence_R');
    this.addCollider(-9.5, -4.1, 0, 2.2, -55.5, -50.1, 'blood_fountain');
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
    // 1. DỰNG TOÀN BỘ VỎ TƯỜNG RỖNG & NỘI THẤT 3 TẦNG (1F, 2F, B1 BASEMENT)
    // Theo đúng 3 bản vẽ mặt bằng trong thư mục picture & Kịch bản!
    // =========================================================================
    this.mansionInteriorGroup = new THREE.Group();
    mansion.add(this.mansionInteriorGroup);
    buildMansionInterior(this, this.mansionInteriorGroup);

    // Phào chỉ đá cổ điển chạy dọc 4 mặt tường NGOÀI (Rỗng ở giữa để KHÔNG BAO GIỜ chắn cầu thang đôi lên Tầng 2!)
    [7.06, 13.6].forEach(cy => {
      const ledgeFront = new THREE.Mesh(new THREE.BoxGeometry(49.2, 0.42, 0.65), stoneTrimMat);
      ledgeFront.position.set(0, cy, 12.15);
      const ledgeBack = new THREE.Mesh(new THREE.BoxGeometry(49.2, 0.42, 0.65), stoneTrimMat);
      ledgeBack.position.set(0, cy, -24.15);
      const ledgeWest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 36.8), stoneTrimMat);
      ledgeWest.position.set(-24.15, cy, -6.0);
      const ledgeEast = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 36.8), stoneTrimMat);
      ledgeEast.position.set(24.15, cy, -6.0);
      mansion.add(ledgeFront, ledgeBack, ledgeWest, ledgeEast);
    });

    // Đá ốp góc tường cổ kính (Corner Quoins)
    [-24.05, 24.05].forEach(qx => {
      for (let qy = 1.0; qy < 13.5; qy += 1.6) {
        const quoin = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.65), stoneTrimMat);
        quoin.position.set(qx, qy, 12.0);
        mansion.add(quoin);
      }
    });

    // Mái ngói Slate Mansard dốc đứng tòa trung tâm & hai cánh
    const centerRoof = new THREE.Mesh(new THREE.ConeGeometry(22, 9.5, 4), roofMat);
    centerRoof.position.set(0, 18.4, -6.0);
    centerRoof.rotation.y = Math.PI / 4;
    mansion.add(centerRoof);

    // THÁP CHUÔNG GOTHIC CAO VÚT Ở TRUNG TÂM
    const spireTower = new THREE.Mesh(new THREE.BoxGeometry(6.5, 11, 6.5), stoneWallMat);
    spireTower.position.set(0, 20.5, 2.0);
    mansion.add(spireTower);

    const spireCone = new THREE.Mesh(new THREE.ConeGeometry(4.4, 13, 8), roofMat);
    spireCone.position.set(0, 31.5, 2.0);
    mansion.add(spireCone);

    const vane = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5), ironMat);
    vane.position.set(0, 38.5, 2.0);
    mansion.add(vane);

    // ========================================================
    // 2. MÁI CÁNH TÂY & CÁNH ĐÔNG CÙNG THÁP CANH GÓC (TURRETS)
    // ========================================================
    [-16, 16].forEach((wx, wIdx) => {
      const wingRoof = new THREE.Mesh(new THREE.ConeGeometry(14, 7.5, 4), roofMat);
      wingRoof.position.set(wx, 17.3, -6.0);
      wingRoof.rotation.y = Math.PI / 4;
      mansion.add(wingRoof);

      const tx = wIdx === 0 ? -25.2 : 25.2;
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 15, 8), stoneWallMat);
      turret.position.set(tx, 7.5, 11.2);
      mansion.add(turret);

      const turretCone = new THREE.Mesh(new THREE.ConeGeometry(3.1, 6.8, 8), roofMat);
      turretCone.position.set(tx, 18.2, 11.2);
      mansion.add(turretCone);
    });

    // 4 Ống khói gạch cao kiểu Victoria trên mái nhà
    [[-10, 19, -5], [10, 19, -5], [-20, 18, 2], [20, 18, 2]].forEach(([cx, cy, cz]) => {
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.5, 1.4), stoneWallMat);
      chimney.position.set(cx, cy, cz);
      mansion.add(chimney);
    });

    // =========================================================================
    // 3. BỆ HIÊN NHÀ THẤP CHÂN THỰC (CHỈ CAO 0.26M - DƯỚI ĐẦU GỐI NGƯỜI CHƠI!)
    // Và 2 bậc tam cấp thấp giúp người chơi bước lên hiên nhà cực kỳ tự nhiên!
    // =========================================================================
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(22, 0.26, 6.6), stoneTrimMat);
    terrace.position.set(0, 0.13, 15.1); // Trải từ z = 11.8 đến z = 18.4 (world z = -63.2 đến -56.6)
    terrace.receiveShadow = true;
    mansion.add(terrace);

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

    // Mái vòm hiên tam giác kiểu Gothic (Đặt hoàn toàn từ z = 12.25 ra ngoài z = 18.25 để KHÔNG đâm xuyên tường mặt tiền vào Đại Sảnh!)
    const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(21.5, 1.1, 6.0), stoneTrimMat);
    porticoRoof.position.set(0, 9.8, 15.25);
    mansion.add(porticoRoof);

    const pedimentGeo = new THREE.ConeGeometry(11.5, 4.2, 4);
    pedimentGeo.rotateY(Math.PI / 4);
    pedimentGeo.scale(1.0, 1.0, 0.34);
    const pediment = new THREE.Mesh(pedimentGeo, stoneTrimMat);
    pediment.position.set(0, 12.3, 15.25);
    mansion.add(pediment);

    // =========================================================================
    // 4. CỔNG VÒM ĐÁ GOTHIC MỞ THÔNG & CỬA ĐÔI GỖ LIM CHẠM KHẮC (MỞ ĐỂ ĐI VÀO ĐẠI SẢNH)
    // =========================================================================
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0.26, 12.0); // Đặt chuẩn trên mặt sàn hiên y = 0.26m

    [-2.55, 2.55].forEach(jx => {
      const jambPillar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 5.2, 0.95), stoneTrimMat);
      jambPillar.position.set(jx, 2.6, 0.25);
      portalGroup.add(jambPillar);

      [-0.28, 0.28].forEach(offset => {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 5.0, 10), stoneTrimMat);
        shaft.position.set(jx + offset, 2.5, 0.68);
        portalGroup.add(shaft);
      });
    });

    const archLintel = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.75, 1.05), stoneTrimMat);
    archLintel.position.set(0, 5.35, 0.32);
    portalGroup.add(archLintel);

    const portalThresholdLight = new THREE.PointLight(0xff9933, 3.8, 12, 1.3);
    portalThresholdLight.position.set(0, 3.8, 1.8);
    portalGroup.add(portalThresholdLight);

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

    // Hai cánh cửa đôi gỗ lim mở rộng vào phía trong để người chơi bước thẳng vào Đại Sảnh Tầng 1!
    const doorLHinge = new THREE.Group();
    doorLHinge.position.set(-2.15, 2.5, 0.12);
    doorLHinge.rotation.y = 1.15; // Mở vào trong bên trái
    const doorLMesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 5.0, 0.2), doorMat);
    doorLMesh.position.set(1.05, 0, 0);
    doorLHinge.add(doorLMesh);
    const knockerRingL = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 10, 20), brassMat);
    knockerRingL.position.set(1.72, -0.35, 0.14);
    doorLHinge.add(knockerRingL);
    portalGroup.add(doorLHinge);

    const doorRHinge = new THREE.Group();
    doorRHinge.position.set(2.15, 2.5, 0.12);
    doorRHinge.rotation.y = -1.25; // Mở rộng vào trong bên phải
    const doorRMesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 5.0, 0.2), doorMat);
    doorRMesh.position.set(-1.05, 0, 0);
    doorRHinge.add(doorRMesh);
    const knockerRingR = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 10, 20), brassMat);
    knockerRingR.position.set(-1.72, -0.35, 0.14);
    doorRHinge.add(knockerRingR);
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
    // 5. HỆ THỐNG CỬA SỔ CŨ NÁT, KÍNH VỠ & ĐÓNG VÁN GỖ CHÉO KINH DỊ BÊN NGOÀI BIỆT THỰ
    // =========================================================================
    const windowPositions = [
      // Tầng 1 - Mặt tiền (z = 12.26)
      { pos: [-8.8, 3.6, 12.26], boarded: true },
      { pos: [8.8, 3.6, 12.26], boarded: true },
      { pos: [-16.5, 3.6, 12.26], boarded: true },
      { pos: [-21.5, 3.6, 12.26], boarded: false },
      { pos: [16.5, 3.6, 12.26], boarded: true },
      { pos: [21.5, 3.6, 12.26], boarded: false },
      // Tầng 2 - Mặt tiền (z = 12.26)
      { pos: [-8.8, 10.2, 12.26], boarded: false },
      { pos: [-3.8, 10.2, 12.26], boarded: true },
      { pos: [3.8, 10.2, 12.26], boarded: false },
      { pos: [8.8, 10.2, 12.26], boarded: false },
      { pos: [-16.5, 10.2, 12.26], boarded: false },
      { pos: [-21.5, 10.2, 12.26], boarded: true },
      { pos: [16.5, 10.2, 12.26], boarded: false },
      { pos: [21.5, 10.2, 12.26], boarded: false },
      // Cửa sổ hông trái (x = -24.26) & phải (x = +24.26)
      { pos: [-24.26, 3.6, -4], boarded: true },
      { pos: [-24.26, 10.2, -4], boarded: false },
      { pos: [24.26, 3.6, -4], boarded: true },
      { pos: [24.26, 10.2, -4], boarded: false },
      // Cửa sổ mặt sau (z = -24.26)
      { pos: [-10, 3.6, -24.26], boarded: true },
      { pos: [0, 10.2, -24.26], boarded: false },
      { pos: [10, 3.6, -24.26], boarded: true }
    ];

    windowPositions.forEach(({ pos: [wx, wy, wz], boarded }, idx) => {
      const winGroup = new THREE.Group();
      winGroup.position.set(wx, wy, wz);
      if (Math.abs(wx) > 23.5) {
        winGroup.rotation.y = wx < 0 ? -Math.PI / 2 : Math.PI / 2;
      } else if (wz < -20) {
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

  // =========================================================================
  // DỰNG VŨ KHÍ & VẬT PHẨM TRÊN TAY GÓC NHÌN THỨ NHẤT (DAO GĂM, SÚNG LỤC 100 VIÊN, TẬP HỒ SƠ)
  // =========================================================================
  buildFirstPersonKnife() {
    // 1. DAO GĂM SINH TỒN (FPS KNIFE)
    this.fpsKnife = new THREE.Group();
    this.fpsKnife.position.set(0.32, -0.26, -0.52);
    this.fpsKnife.rotation.set(-0.25, 0.45, -0.35);
    this.fpsKnife.visible = false;

    this.isSlashing = false;
    this.slashTimer = 0;

    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xf0f4f8,
      metalness: 0.95,
      roughness: 0.12
    });
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.38, 0.075), bladeMat);
    blade.position.set(0, 0.19, 0);
    this.fpsKnife.add(blade);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 4), bladeMat);
    tip.position.set(0, 0.44, 0);
    tip.rotation.y = Math.PI / 4;
    this.fpsKnife.add(tip);

    const guardMat = new THREE.MeshStandardMaterial({ color: 0xc9933b, metalness: 0.8, roughness: 0.25 });
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.025, 0.15), guardMat);
    this.fpsKnife.add(guard);

    const handleMat = new THREE.MeshStandardMaterial({ color: 0x16141a, roughness: 0.85 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.2, 12), handleMat);
    handle.position.set(0, -0.1, 0);
    this.fpsKnife.add(handle);

    const pommel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.035, 12), guardMat);
    pommel.position.set(0, -0.21, 0);
    this.fpsKnife.add(pommel);
    this.camera.add(this.fpsKnife);

    // 2. SÚNG LỤC CẢNH SÁT GLOCK 19 CHI TIẾT (FPS SERVICE PISTOL - 100 VIÊN ĐẠN)
    this.fpsPistol = new THREE.Group();
    this.fpsPistol.position.set(0.28, -0.24, -0.48);
    this.fpsPistol.visible = false;
    this.pistolRecoilTimer = 0;

    const gunSlideMat = new THREE.MeshStandardMaterial({ color: 0x1e222a, metalness: 0.88, roughness: 0.24 });
    const gunFrameMat = new THREE.MeshStandardMaterial({ color: 0x121418, metalness: 0.4, roughness: 0.7 });
    const sightMat = new THREE.MeshBasicMaterial({ color: 0x33ff66 });

    this.pistolSlideMesh = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.068, 0.34), gunSlideMat);
    this.pistolSlideMesh.position.set(0, 0.04, -0.04);
    this.fpsPistol.add(this.pistolSlideMesh);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.36, 12), gunSlideMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, -0.06);
    this.fpsPistol.add(barrel);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.19, 0.085), gunFrameMat);
    grip.position.set(0, -0.06, 0.06);
    grip.rotation.x = 0.24;
    this.fpsPistol.add(grip);

    // Thước ngắm dạ quang Tritium xanh lá
    const rearSightL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.01), sightMat);
    rearSightL.position.set(-0.014, 0.08, 0.11);
    const rearSightR = rearSightL.clone();
    rearSightR.position.x = 0.014;
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.014, 0.012), sightMat);
    frontSight.position.set(0, 0.08, -0.19);
    this.fpsPistol.add(rearSightL, rearSightR, frontSight);

    // Tia lửa đầu nòng & Đèn chớp Muzzle Flash khi bắn
    this.muzzleFlashMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.22, 8),
      new THREE.MeshBasicMaterial({ color: 0xffcc33, transparent: true, opacity: 0.9 })
    );
    this.muzzleFlashMesh.rotation.x = -Math.PI / 2;
    this.muzzleFlashMesh.position.set(0, 0.04, -0.32);
    this.muzzleFlashMesh.visible = false;
    this.fpsPistol.add(this.muzzleFlashMesh);

    this.muzzleFlashLight = new THREE.PointLight(0xffaa22, 0, 14);
    this.muzzleFlashLight.position.set(0, 0.06, -0.35);
    this.fpsPistol.add(this.muzzleFlashLight);

    this.camera.add(this.fpsPistol);

    // 3. TẬP HỒ SƠ VỤ ÁN CẦM TRÊN TAY (FPS CASE FILE CLIPBOARD)
    this.fpsClipboard = new THREE.Group();
    this.fpsClipboard.position.set(0.28, -0.25, -0.46);
    this.fpsClipboard.rotation.set(0.35, -0.35, -0.1);
    this.fpsClipboard.visible = false;

    const boardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.34, 0.016),
      new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.75 })
    );
    const paperMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.23, 0.30, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xf6eedc })
    );
    paperMesh.position.z = 0.006;
    const clipMetal = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.035, 0.028),
      new THREE.MeshStandardMaterial({ color: 0xc0c8d0, metalness: 0.85, roughness: 0.2 })
    );
    clipMetal.position.set(0, 0.15, 0.012);
    this.fpsClipboard.add(boardMesh, paperMesh, clipMetal);
    this.camera.add(this.fpsClipboard);

    this.scene.add(this.camera);
  }

  // ĐỒNG BỘ VẬT PHẨM ĐANG CẦM TRÊN TAY VỚI Ô ĐANG CHỌN TRONG TÚI ĐỒ [1-9]
  syncEquippedViewmodels() {
    const activeItem = playerInventory.getActiveItem();
    this.hasKnife = playerInventory.hasItem('combat_knife');

    const holdingPistol = !!(activeItem && (activeItem.id === 'pistol' || activeItem.id === 'service_pistol'));
    const holdingKnife = !!(activeItem && (activeItem.id === 'combat_knife' || activeItem.id === 'knife'));
    const holdingDoc = !!(activeItem && (activeItem.id === 'case_file' || activeItem.isDocument || activeItem.type === 'document'));

    if (this.fpsPistol) this.fpsPistol.visible = holdingPistol;
    if (this.fpsKnife) this.fpsKnife.visible = holdingKnife;
    if (this.fpsClipboard) this.fpsClipboard.visible = holdingDoc;

    if (this.slotKnifeEl) {
      if (holdingPistol) {
        this.slotKnifeEl.textContent = `⚜ 🔫 SÚNG LỤC (${playerInventory.pistolAmmo}/${playerInventory.maxPistolAmmo} VIÊN) [CLICK: BẮN | Q: NÉM]`;
        this.slotKnifeEl.classList.add('active');
      } else if (holdingDoc) {
        this.slotKnifeEl.textContent = `⚜ 📋 ${activeItem.name} [CLICK/E: ĐỌC | Q: NÉM]`;
        this.slotKnifeEl.classList.add('active');
      } else if (holdingKnife) {
        this.slotKnifeEl.textContent = `⚜ 🗡 DAO GĂM SINH TỒN [CLICK: CHÉM | Q: NÉM]`;
        this.slotKnifeEl.classList.add('active');
      } else if (activeItem) {
        this.slotKnifeEl.textContent = `⚜ 🎒 ĐANG CẦM: ${activeItem.name} [Q: NÉM]`;
        this.slotKnifeEl.classList.add('active');
      } else {
        this.slotKnifeEl.textContent = `⚜ ✋ TAY KHÔNG [BẤM G MỞ TÚI ĐỒ • 1-9 CHỌN Ô]`;
        this.slotKnifeEl.classList.remove('active');
      }
    }
  }

  // HÀNH ĐỘNG BẮN SÚNG LỤC CẢNH SÁT (100 VIÊN ĐẠN, BẮN HẾT BÁO HẾT ĐẠN!)
  shootPistol() {
    if (playerInventory.pistolAmmo <= 0) {
      audioManager.playEmptyGunClick();
      this.showMonologue('⚠️ SÚNG LỤC ĐÃ HẾT ĐẠN! (0/100 viên) — Không thể bắn tiếp!', 3500);
      return;
    }

    playerInventory.pistolAmmo -= 1;
    playerInventory.renderUI();
    this.syncEquippedViewmodels();

    audioManager.playGunshot();
    this.pistolRecoilTimer = 0.001;
    if (this.muzzleFlashMesh) this.muzzleFlashMesh.visible = true;
    if (this.muzzleFlashLight) this.muzzleFlashLight.intensity = 14.0;

    // Bắn tia Raycast từ tâm ngắm để tạo tia lửa đạn găm vào tường/đồ vật
    const aimDir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(this.cameraRotation.pitch, this.cameraRotation.yaw, 0, 'YXZ'));
    this.raycaster.set(this.playerPos, aimDir);
    this.raycaster.far = 65;

    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    for (const h of hits) {
      // Bỏ qua chính nhân vật và vũ khí trên tay
      let obj = h.object;
      let ignore = false;
      while (obj) {
        if (obj === this.camera || obj === this.playerAvatar || obj === this.rainSystem) {
          ignore = true;
          break;
        }
        obj = obj.parent;
      }
      if (!ignore && h.distance > 0.5) {
        const spark = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffcc44 })
        );
        spark.position.copy(h.point);
        this.scene.add(spark);
        this.bulletImpacts.push({ mesh: spark, timer: 0.35 });
        break;
      }
    }

    if (playerInventory.pistolAmmo === 0) {
      this.showMonologue('⚠️ ĐÃ BẮN HẾT VIÊN ĐẠN CUỐI CÙNG! Súng lục đã hết đạn (0/100 viên)!', 5000);
    }
  }

  // HÀNH ĐỘNG BẤM PHÍM [Q] NÉM ĐỒ ĐANG CẦM TRÊN TAY RA ĐẤT (CÓ VẬT LÝ RƠI & NHẶT LẠI ĐƯỢC BẰNG [E])
  throwActiveItem() {
    const dropped = playerInventory.dropActiveItem();
    if (!dropped) {
      this.showMonologue('🎒 Bạn đang để tay không — hãy chọn ô có vật phẩm [1-9] rồi bấm [Q] để ném!', 3200);
      return;
    }

    audioManager.playKnifeSlash();
    this.syncEquippedViewmodels();

    // Tạo mô hình 3D đại diện cho vật phẩm vừa ném ra
    const dropGroup = new THREE.Group();
    let mesh;
    if (dropped.id === 'pistol' || dropped.id === 'service_pistol') {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.14, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x222832, metalness: 0.85, roughness: 0.25 })
      );
    } else if (dropped.id === 'combat_knife' || dropped.id === 'knife') {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.06, 0.46),
        new THREE.MeshStandardMaterial({ color: 0xd8e2ec, metalness: 0.9, roughness: 0.15 })
      );
    } else if (dropped.id === 'case_file' || dropped.isDocument || dropped.type === 'document') {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.04, 0.48),
        new THREE.MeshStandardMaterial({ color: 0xd8b888, roughness: 0.7 })
      );
    } else {
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.35, 10),
        new THREE.MeshBasicMaterial({ color: 0xff2255 })
      );
    }
    dropGroup.add(mesh);

    // Vòng sáng nhỏ dưới vật phẩm bị ném để dễ tìm lại trong đêm
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.28, 16),
      new THREE.MeshBasicMaterial({ color: 0x66ccff, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.05;
    dropGroup.add(ring);

    const forward = new THREE.Vector3(0, 0, -1).applyEuler(
      new THREE.Euler(this.cameraRotation.pitch, this.cameraRotation.yaw, 0, 'YXZ')
    );
    dropGroup.position.copy(this.playerPos).addScaledVector(forward, 0.7);
    this.scene.add(dropGroup);

    const floorY = this.getGroundElevation(this.playerPos.x, this.playerPos.z, this.playerPos.y - 1.68) + 0.08;
    const velocity = forward.clone().multiplyScalar(6.5);
    velocity.y += 2.6;

    const interactRecord = {
      mesh: mesh,
      label: `⚜ [E] Nhặt lại ${dropped.name}`,
      distance: 3.6,
      onInteract: () => {
        if (playerInventory.addItem(dropped)) {
          audioManager.playPickup();
          this.scene.remove(dropGroup);
          const idx = this.interactables.indexOf(interactRecord);
          if (idx !== -1) this.interactables.splice(idx, 1);
          this.syncEquippedViewmodels();
          this.showMonologue(`🎒 Đã nhặt lại [${dropped.name}] vào túi đồ!`, 3500);
        }
      }
    };
    this.interactables.push(interactRecord);

    this.thrownItems.push({
      group: dropGroup,
      velocity,
      floorY,
      landed: false
    });

    this.showMonologue(`💨 Đã ném [${dropped.name}] ra phía trước! (Lại gần bấm [E] nếu muốn nhặt lại)`, 4000);
  }

  // Hành động vung dao chém (Knife Slash Attack)
  slashKnife() {
    if (this.isSlashing) return;
    this.isSlashing = true;
    this.slashTimer = 0;
    audioManager.playKnifeSlash();
  }

  setupInteractions() {
    // Giữ nguyên các điểm tương tác nội thất & manh mối C1-C5 đã được thêm từ buildMansionInterior()
    const outdoorInteractables = [
      // 0. Nhặt Súng Lục Cảnh Sát (100 viên) & Tập Hồ Sơ Vụ Án tại Xe Cảnh Sát (nếu chưa nhặt lúc ngồi trong xe)
      {
        pos: new THREE.Vector3(-2.4, 1.2, 2.6),
        radius: 4.2,
        prompt: () => {
          const needGun = !playerInventory.hasItem('service_pistol');
          const needFile = !playerInventory.hasItem('case_file');
          if (needGun && needFile) return '⚜ [E] Nhặt Súng Lục Cảnh Sát (100 viên) & Cầm Tập Hồ Sơ Vụ Án lên đọc';
          if (needGun) return '⚜ [E] Nhặt Súng Lục Cảnh Sát (100 viên đạn) bỏ vào túi đồ';
          if (needFile) return '⚜ [E] Cầm Tập Hồ Sơ Vụ Án #NX-2026-884 lên đọc';
          return null;
        },
        action: () => {
          const needGun = !playerInventory.hasItem('service_pistol');
          const needFile = !playerInventory.hasItem('case_file');
          if (needGun) {
            playerInventory.addItem({
              id: 'service_pistol',
              name: 'Súng Lục Cảnh Sát Glock 19',
              type: 'weapon',
              count: 1,
              description: 'Súng ngắn trang bị tiêu chuẩn của Sĩ quan An. Băng đạn đặc biệt 100 viên (Click chuột trái để bắn, bấm Q để ném).'
            });
            if (this.cruiserPistolMesh) this.cruiserPistolMesh.visible = false;
          }
          if (needFile) {
            playerInventory.addItem({
              id: 'case_file',
              name: 'Hồ Sơ Vụ Án #NX-2026-884',
              type: 'document',
              count: 1,
              description: 'Tập hồ sơ điều tra mật về vụ mất tích xe tải dược phẩm Nexus và Biệt thự Ông Bình.',
              documentData: HOSOSO_VU_AN_DEFAULT
            });
            if (this.cruiserCaseFileMesh) this.cruiserCaseFileMesh.visible = false;
            playerInventory.openCaseFileModal(HOSOSO_VU_AN_DEFAULT);
          } else {
            audioManager.playPickup();
          }
          this.syncEquippedViewmodels();
          this.showMonologue('🔫 Đã trang bị Súng Lục Cảnh Sát (100 viên đạn) & Hồ Sơ Vụ Án vào túi đồ! Bấm [G] để xem túi đồ.', 5500);
        }
      },
      // 1. Kiểm tra Cabin & Các Hộp Thuốc Y Tế trong Thùng Xe Tải Nexus
      {
        pos: new THREE.Vector3(1.2, 1.4, -10.5),
        radius: 4.5,
        prompt: "⚜ [E] Khảo sát các hộp thuốc Serum H-04 trong xe giao hàng Nexus",
        action: () => {
          this.hasInspectedTruck = true;
          audioManager.playClick();
          this.showMonologue("An: 'Trên kệ xe chất đầy các hộp thuốc lạnh NEXUS BIOPHARMA — SERUM H-04 kèm cảnh báo độc성 sinh học cấp 4! Nhiều ống huyết thanh đã bị đập vỡ...'", 7000);
        }
      },
      // 2. Rút Dao Găm trên Thân Cây
      {
        pos: new THREE.Vector3(-2.0, 1.4, -29.2),
        radius: 3.4,
        prompt: () => playerInventory.hasItem('combat_knife') ? null : "⚜ [E] Rút cây dao găm sinh tồn bỏ vào túi đồ",
        action: () => {
          if (playerInventory.hasItem('combat_knife')) return;
          this.hasKnife = true;
          audioManager.playPickup();
          if (this.knifeObject) this.knifeObject.visible = false;
          playerInventory.addItem({
            id: 'combat_knife',
            name: 'Dao Găm Sinh Tồn Bowie',
            type: 'weapon',
            count: 1,
            description: 'Con dao đi rừng sắc bén rút từ gốc cây đại thụ. Nhấp chuột trái để vung dao tự vệ hoặc bấm [Q] để ném.'
          });
          this.syncEquippedViewmodels();
          this.showMonologue("An: 'Đã cất Dao Găm Sinh Tồn vào túi đồ! Bấm phím số [1-9] để đổi qua lại giữa Súng Lục, Hồ Sơ và Dao Găm.'", 6500);
        }
      },
      // 3. Mở Băng Ghi Hình Máy Quay (VHS Player)
      {
        pos: new THREE.Vector3(-1.0, 0.8, -28.2),
        radius: 3.4,
        prompt: "⚜ [E] Mở xem đoạn băng ghi hình trong máy quay Handycam",
        action: () => {
          this.isViewingVHS = true;
          document.exitPointerLock?.();
          new VHSPlayer(() => {
            this.isViewingVHS = false;
            this.hasWatchedVideo = true;
            this.showMonologue("An: 'Trời đất ơi... Thực thể bóng đen với hai con mắt đỏ rực đó... Nó vừa lao vào Quyết rồi kéo xác vào căn biệt thự phía trước!'", 7500);
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
          this.showMonologue("An: 'Chiếc xe lăn của tiểu thư Linh Chi bị bỏ lại giữa sân cỏ hoang... Cạnh bên là những bông Hoa Phục Sinh trắng muốt mọc lên từ vũng máu!'", 7000);
        }
      }
    ];

    this.interactables.push(...outdoorInteractables);
  }

  setupControls() {
    this.onKeyDown = (e) => {
      // Nếu đang mở Hồ Sơ Vụ Án, bấm ESC hoặc E sẽ đóng Hồ Sơ
      if (playerInventory.isReadingCaseFile) {
        if (e.code === 'Escape' || e.code === 'KeyE') {
          e.preventDefault();
          playerInventory.closeCaseFileModal();
          this.canvas.requestPointerLock?.();
        }
        return;
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        // Nếu đang mở cửa sổ Túi đồ lớn (uiState === 2), ESC sẽ đóng túi đồ trước
        if (playerInventory.uiState === 2) {
          playerInventory.cycleInventoryState(); // 2 -> 0
          this.canvas.requestPointerLock?.();
          return;
        }
        this.togglePauseMenu();
        return;
      }

      if (this.isPaused || this.isViewingVHS || (this.storyModalEl && this.storyModalEl.style.display === 'flex')) {
        return;
      }

      // Phím [G]: Ẩn / Hiện thanh 9 ô bên dưới (2 trạng thái gọn nhẹ, không khóa di chuyển)
      if (e.code === 'KeyG') {
        e.preventDefault();
        playerInventory.cycleInventoryState();
        return;
      }

      // Phím [Q]: Ném vật phẩm đang cầm trên tay ra phía trước
      if (e.code === 'KeyQ') {
        e.preventDefault();
        this.throwActiveItem();
        return;
      }

      // Phím số [1 - 9]: Chọn nhanh 9 ô trong thanh Hotbar
      if (e.code.startsWith('Digit')) {
        const num = parseInt(e.code.replace('Digit', ''), 10);
        if (num >= 1 && num <= 9) {
          playerInventory.selectSlot(num - 1);
          this.syncEquippedViewmodels();
        }
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

      if (e.code === 'Space') {
        // Nhảy khi đứng trên mặt đất
        if (this.isGrounded) {
          this.verticalVelocity = 6.8;
          this.isGrounded = false;
          audioManager.playJump();
        }
      }

      if (e.code === 'KeyE') {
        if (this.activeInteractable) {
          if (this.activeInteractable.action) {
            this.activeInteractable.action();
          } else if (this.activeInteractable.onInteract) {
            this.activeInteractable.onInteract();
          }
          return;
        }
        // Nếu không đứng gần vật thể nào mà trên tay đang cầm Tập Hồ Sơ / Tài liệu -> Mở đọc ngay!
        const activeItem = playerInventory.getActiveItem();
        if (activeItem && (activeItem.id === 'case_file' || activeItem.isDocument || activeItem.type === 'document')) {
          document.exitPointerLock?.();
          playerInventory.openCaseFileModal(activeItem.documentData || activeItem || HOSOSO_VU_AN_DEFAULT);
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
        // Không tự bật Pause nếu người chơi đang mở Túi Đồ lớn (uiState === 2), đang đọc Hồ Sơ hoặc xem VHS
        if (
          this.hasLockedOnce &&
          !this.isViewingVHS &&
          playerInventory.uiState !== 2 &&
          !playerInventory.isReadingCaseFile &&
          (!this.storyModalEl || this.storyModalEl.style.display === 'none')
        ) {
          this.togglePauseMenu(true);
        }
      }
    };

    this.onMouseMove = (e) => {
      if (this.isPaused || playerInventory.uiState === 2 || playerInventory.isReadingCaseFile) return;
      if (document.pointerLockElement === this.canvas) {
        const sensitivity = 0.0022;
        this.cameraRotation.yaw -= e.movementX * sensitivity;
        this.cameraRotation.pitch -= e.movementY * sensitivity;
        this.cameraRotation.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.cameraRotation.pitch));
      }
    };

    this.onMouseDown = (e) => {
      if (this.isPaused || this.isViewingVHS || playerInventory.uiState === 2 || playerInventory.isReadingCaseFile) return;
      if (document.pointerLockElement !== this.canvas) {
        this.canvas.requestPointerLock?.();
        return;
      }
      if (e.button === 0) {
        const activeItem = playerInventory.getActiveItem();
        if (activeItem && (activeItem.id === 'pistol' || activeItem.id === 'service_pistol')) {
          this.shootPistol();
        } else if (activeItem && (activeItem.id === 'case_file' || activeItem.isDocument || activeItem.type === 'document')) {
          document.exitPointerLock?.();
          playerInventory.openCaseFileModal(activeItem.documentData || activeItem || HOSOSO_VU_AN_DEFAULT);
        } else if (activeItem && (activeItem.id === 'combat_knife' || activeItem.id === 'knife')) {
          this.slashKnife();
        }
      }
    };

    this.onWheel = (e) => {
      if (this.isPaused || playerInventory.uiState === 2 || playerInventory.isReadingCaseFile) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const nextSlot = (playerInventory.selectedSlot + dir + 9) % 9;
      playerInventory.selectSlot(nextSlot);
      this.syncEquippedViewmodels();
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('wheel', this.onWheel);

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
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.onResize);
    document.exitPointerLock?.();
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
  }

  // =========================================================================
  // TÍNH TOÁN CAO ĐỘ MẶT SÀN 3 TẦNG BIỆT THỰ (1F: 0.26m | 2F: 7.06m | B1: -6.20m) & CẦU THANG
  // =========================================================================
  getGroundElevation(x, z, currentFeetY = 0) {
    // 1. Bậc tam cấp và hiên trước Biệt Thự (x: -11..11, z: -63.0..-55.4)
    if (Math.abs(x) <= 11.0 && z > -63.0 && z <= -55.4) {
      if (z <= -56.6) return 0.26;
      const t = (-55.4 - z) / (-56.6 - (-55.4));
      return THREE.MathUtils.clamp(t, 0, 1) * 0.26;
    }

    // 2. Bên trong phạm vi Biệt Thự (x: -24.2..24.2, z: -99.2..-63.0)
    // التọa độ Local so với tâm Biệt Thự (0, 0, -75): lx = x, lz = z + 75 (lz nằm trong [-24, +12])
    if (Math.abs(x) <= 24.2 && z <= -62.8 && z >= -99.2) {
      const lx = x;
      const lz = z + 75.0;

      // A. Cầu thang đôi Đại Sảnh (Grand Twin Staircases: nối Tầng 1 y=0.26 và Tầng 2 y=7.06)
      // Nằm ở lx thuộc [-6.9, -4.1] hoặc [4.1, 6.9], lz từ +4.5 (y=0.26) đến -3.5 (y=7.06)
      const onGrandStairX = (lx >= -6.9 && lx <= -4.1) || (lx >= 4.1 && lx <= 6.9);
      if (onGrandStairX && lz <= 4.7 && lz >= -3.7 && currentFeetY > -1.2) {
        const stairT = THREE.MathUtils.clamp((4.5 - lz) / (4.5 - (-3.5)), 0, 1);
        return 0.26 + stairT * (7.06 - 0.26);
      }

      // B. Cầu thang phụ B bên Cánh Tây (Service Stair B: nối Tầng 1 y=0.26 xuống Hầm B1 y=-6.20)
      // Nằm ở lx thuộc [-16.0, -12.0], lz từ +2.0 (y=0.26) xuống -6.5 (y=-6.20)
      const onBasementStairX = (lx >= -16.0 && lx <= -12.0);
      if (onBasementStairX && lz <= 2.2 && lz >= -6.7 && currentFeetY < 3.5) {
        const bStairT = THREE.MathUtils.clamp((2.0 - lz) / (2.0 - (-6.5)), 0, 1);
        return 0.26 + bStairT * (-6.20 - 0.26);
      }

      // C. Xác định mặt sàn theo tầng hiện tại của người chơi
      if (currentFeetY >= 4.6) {
        return 7.06; // Đang ở trên Tầng 2 (2F)
      }
      if (currentFeetY <= -1.8) {
        return -6.20; // Đang ở dưới Tầng Hầm (B1 Basement)
      }
      return 0.26; // Đang ở Tầng 1 (1F Ground Floor)
    }

    return 0.0; // Mặt đất rừng tự nhiên bên ngoài
  }

  // GIẢI QUYẾT VA CHẠM VẬT LÝ AABB (KHÔNG CHO ĐI XUYÊN TƯỜNG, ĐỒ VẬT, CÂY CỐI, XE CỘ)
  resolveCollisions(pos, feetY, radius = 0.38) {
    const pMinY = feetY + 0.25;
    const pMaxY = feetY + 1.55;

    for (let i = 0; i < this.colliders.length; i++) {
      const box = this.colliders[i];
      // Chỉ xét các vật cản có cùng độ cao tầng với người chơi
      if (pMaxY <= box.minY || pMinY >= box.maxY) continue;
      // Broad-phase: bỏ qua ngay các vật cản ở xa hơn 6.5m
      if (Math.abs(pos.x - (box.minX + box.maxX) * 0.5) > 6.5 || Math.abs(pos.z - (box.minZ + box.maxZ) * 0.5) > 6.5) continue;

      const expMinX = box.minX - radius;
      const expMaxX = box.maxX + radius;
      const expMinZ = box.minZ - radius;
      const expMaxZ = box.maxZ + radius;

      if (pos.x > expMinX && pos.x < expMaxX && pos.z > expMinZ && pos.z < expMaxZ) {
        const penLeft = pos.x - expMinX;
        const penRight = expMaxX - pos.x;
        const penFront = pos.z - expMinZ;
        const penBack = expMaxZ - pos.z;

        const minPen = Math.min(penLeft, penRight, penFront, penBack);
        if (minPen === penLeft) pos.x = expMinX;
        else if (minPen === penRight) pos.x = expMaxX;
        else if (minPen === penFront) pos.z = expMinZ;
        else pos.z = expMaxZ;
      }
    }
  }

  updatePlayer(delta) {
    if (this.isPaused || playerInventory.uiState === 2 || playerInventory.isReadingCaseFile) return;

    const currentFeetY = this.playerPos.y - 1.68;
    const currentGroundY = this.getGroundElevation(this.playerPos.x, this.playerPos.z, currentFeetY);
    const naturalEyeY = currentGroundY + 1.68;
    let isMovingHorizontally = false;
    const isRunning = this.keys['ShiftLeft'] || this.keys['ShiftRight'];

    if (this.isFlying) {
      // ==========================================
      // CHẾ ĐỘ BAY LƯỢN SÁNG TẠO (CREATIVE FLIGHT)
      // ==========================================
      const forward = new THREE.Vector3(0, 0, -1).applyEuler(
        new THREE.Euler(this.cameraRotation.pitch, this.cameraRotation.yaw, 0, 'YXZ')
      );
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotation.yaw);

      const flySpeed = isRunning ? 22.0 : 12.0;
      const flyMove = new THREE.Vector3();

      if (this.keys['KeyW'] || this.keys['ArrowUp']) flyMove.add(forward);
      if (this.keys['KeyS'] || this.keys['ArrowDown']) flyMove.sub(forward);
      if (this.keys['KeyD'] || this.keys['ArrowRight']) flyMove.add(right);
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) flyMove.sub(right);
      if (this.keys['Space']) flyMove.y += 1.0;
      if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) flyMove.y -= 1.0;

      if (flyMove.lengthSq() > 0) {
        isMovingHorizontally = true;
        flyMove.normalize();
        this.playerPos.addScaledVector(flyMove, flySpeed * delta);
      }
      this.playerPos.y = Math.max(naturalEyeY, Math.min(55, this.playerPos.y));
    } else {
      // ==========================================
      // DI CHUYỂN DƯỚI ĐẤT, LÊN XUỐNG CẦU THANG & VA CHẠM VẬT LÝ
      // ==========================================
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotation.yaw);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotation.yaw);

      const currentSpeed = isRunning ? this.moveSpeed * 1.65 : this.moveSpeed;
      const moveVector = new THREE.Vector3();
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveVector.add(forward);
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveVector.sub(forward);
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveVector.add(right);
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveVector.sub(right);

      if (moveVector.lengthSq() > 0) {
        isMovingHorizontally = true;
        moveVector.normalize();

        // Tách bước di chuyển X và Z kèm giải quyết va chạm AABB mượt mà
        this.playerPos.x += moveVector.x * currentSpeed * delta;
        this.resolveCollisions(this.playerPos, this.playerPos.y - 1.68);
        this.playerPos.z += moveVector.z * currentSpeed * delta;
        this.resolveCollisions(this.playerPos, this.playerPos.y - 1.68);

        if (this.isGrounded) {
          this.headBobTimer += delta * (isRunning ? 13 : 8.5);
          this.stepTimer += delta;
          if (this.stepTimer > (isRunning ? 0.32 : 0.48)) {
            if (Math.abs(currentGroundY) > 0.15) {
              audioManager.playFootstepWood();
            } else {
              audioManager.playFootstepMud();
            }
            this.stepTimer = 0;
          }
        }
      }

      // Cập nhật lại cao độ sàn sau khi bước lên/xuống bậc cầu thang
      const updatedGroundY = this.getGroundElevation(this.playerPos.x, this.playerPos.z, this.playerPos.y - 1.68);
      const targetEyeY = updatedGroundY + 1.68;

      if (this.isGrounded && Math.abs(targetEyeY - this.playerPos.y) < 1.35) {
        // Leo cầu thang mượt mà
        this.playerPos.y = THREE.MathUtils.lerp(this.playerPos.y, targetEyeY, 0.45);
      } else {
        this.verticalVelocity -= 18.0 * delta;
        this.playerPos.y += this.verticalVelocity * delta;
        if (this.playerPos.y <= targetEyeY) {
          this.playerPos.y = targetEyeY;
          this.verticalVelocity = 0;
          this.isGrounded = true;
        }
      }
    }

    // Giới hạn biên bản đồ rộng lớn
    this.playerPos.x = Math.max(-45.5, Math.min(45.5, this.playerPos.x));
    this.playerPos.z = Math.max(-105, Math.min(12, this.playerPos.z));

    // ==========================================
    // CẬP NHẬT VỊ TRÍ CAMERA GÓC NHÌN THỨ NHẤT
    // ==========================================
    const bobOffset = (this.isGrounded && isMovingHorizontally)
      ? Math.sin(this.headBobTimer) * 0.048
      : 0;

    this.camera.position.set(this.playerPos.x, this.playerPos.y + bobOffset, this.playerPos.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.cameraRotation.yaw;
    this.camera.rotation.x = this.cameraRotation.pitch;

    // Đèn pin chiếu theo hướng nhìn của Sĩ quan An
    this.flashlight.position.copy(this.playerPos);
    const lookDir = new THREE.Vector3(0, 0, -1).applyEuler(
      new THREE.Euler(this.cameraRotation.pitch, this.cameraRotation.yaw, 0, 'YXZ')
    );
    this.flashlightTargetPos.lerp(this.playerPos.clone().add(lookDir), 0.3);
    this.flashlightTarget.position.copy(this.flashlightTargetPos);

    // ==========================================
    // CẬP NHẬT HOẠT ẢNH VŨ KHÍ GÓC NHÌN THỨ NHẤT (DAO, SÚNG LỤC, HỒ SƠ)
    // ==========================================
    const swayX = Math.cos(this.headBobTimer * 0.5) * 0.014;
    const swayY = Math.sin(this.headBobTimer) * 0.016;

    if (this.fpsKnife && this.fpsKnife.visible) {
      if (this.isSlashing) {
        this.slashTimer += delta * 7.5;
        if (this.slashTimer > Math.PI) {
          this.isSlashing = false;
          this.slashTimer = 0;
        }
        const s = Math.sin(this.slashTimer);
        this.fpsKnife.position.set(0.32 - s * 0.22, -0.26 - s * 0.15, -0.52 - s * 0.18);
        this.fpsKnife.rotation.set(-0.25 + s * 0.85, 0.45 - s * 1.2, -0.35 - s * 0.4);
      } else {
        this.fpsKnife.position.set(0.32 + swayX, -0.26 + swayY, -0.52);
        this.fpsKnife.rotation.set(-0.25, 0.45 + swayX * 2, -0.35);
      }
    }

    if (this.fpsPistol && this.fpsPistol.visible) {
      if (this.pistolRecoilTimer > 0) {
        this.pistolRecoilTimer += delta * 12;
        if (this.pistolRecoilTimer > 0.22) {
          if (this.muzzleFlashMesh) this.muzzleFlashMesh.visible = false;
          if (this.muzzleFlashLight) this.muzzleFlashLight.intensity = 0;
        }
        if (this.pistolRecoilTimer >= Math.PI) {
          this.pistolRecoilTimer = 0;
          if (this.pistolSlideMesh) this.pistolSlideMesh.position.z = -0.04;
        } else {
          const r = Math.sin(this.pistolRecoilTimer);
          this.fpsPistol.position.set(0.28, -0.24 + r * 0.045, -0.48 + r * 0.08);
          this.fpsPistol.rotation.set(r * 0.28, 0, 0);
          if (this.pistolSlideMesh) this.pistolSlideMesh.position.z = -0.04 + r * 0.055;
        }
      } else {
        this.fpsPistol.position.set(0.28 + swayX, -0.24 + swayY, -0.48);
        this.fpsPistol.rotation.set(0, swayX * 1.2, 0);
      }
    }

    if (this.fpsClipboard && this.fpsClipboard.visible) {
      this.fpsClipboard.position.set(0.28 + swayX * 0.8, -0.25 + swayY * 0.8, -0.46);
    }

    // Cập nhật vật lý bay & rơi của các vật phẩm bị ném bằng phím [Q]
    for (let i = 0; i < this.thrownItems.length; i++) {
      const ti = this.thrownItems[i];
      if (!ti.landed) {
        ti.velocity.y -= 16.0 * delta;
        ti.group.position.addScaledVector(ti.velocity, delta);
        ti.group.rotation.x += delta * 6.0;
        ti.group.rotation.y += delta * 4.5;
        const groundAtItem = this.getGroundElevation(ti.group.position.x, ti.group.position.z, ti.group.position.y) + 0.08;
        if (ti.group.position.y <= groundAtItem) {
          ti.group.position.y = groundAtItem;
          ti.group.rotation.set(0, ti.group.rotation.y, 0);
          ti.landed = true;
          audioManager.playFootstepMud();
        }
      }
    }

    // Cập nhật tia lửa đạn bắn trúng mục tiêu
    for (let i = this.bulletImpacts.length - 1; i >= 0; i--) {
      const imp = this.bulletImpacts[i];
      imp.timer -= delta;
      imp.mesh.scale.multiplyScalar(0.92);
      if (imp.timer <= 0) {
        this.scene.remove(imp.mesh);
        this.bulletImpacts.splice(i, 1);
      }
    }
  }

  checkInteractions() {
    this.activeInteractable = null;
    let closestDist = Infinity;
    const playerPos = this.playerPos;
    const tmpPos = new THREE.Vector3();

    for (let item of this.interactables) {
      let itemPos = item.pos;
      const radius = item.radius || item.distance || 4.0;
      if (!itemPos && item.mesh) {
        item.mesh.getWorldPosition(tmpPos);
        itemPos = tmpPos;
      }
      if (!itemPos) continue;

      const dist = playerPos.distanceTo(itemPos);
      if (dist < radius && dist < closestDist) {
        const rawPrompt = item.prompt || item.label;
        const text = typeof rawPrompt === 'function' ? rawPrompt() : rawPrompt;
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

  // TỐI ƯU HÓA HIỆU NĂNG: QUẢN LÝ ĐÈN, NỘI THẤT & MƯA THEO VỊ TRÍ NGƯỜI CHƠI (DYNAMIC CULLING)
  updateLightCulling() {
    const isOutdoors = this.playerPos.z > -46 || Math.abs(this.playerPos.x) > 23.5 || this.playerPos.z < -98;
    if (this.rainSystem) {
      this.rainSystem.visible = (this.mode === 'survival' && isOutdoors);
    }

    // Khi người chơi còn đang ở xa ngoài Quốc lộ / đầu đường mòn (z > -36), tạm ẩn nội thất bên trong biệt thự để tăng tốc độ khung hình tối đa
    if (this.mansionInteriorGroup) {
      this.mansionInteriorGroup.visible = (this.playerPos.z <= -36 || this.mode === 'creative');
    }

    if (!this.interiorLights || this.interiorLights.length === 0) return;

    let activeFloor = 'floor1';
    if (isOutdoors) {
      activeFloor = 'outdoors';
    } else if (this.playerPos.y < 0.2) {
      activeFloor = 'basement';
    } else if (this.playerPos.y >= 6.8) {
      activeFloor = 'floor2';
    } else {
      activeFloor = 'floor1';
    }

    for (let i = 0; i < this.interiorLights.length; i++) {
      const item = this.interiorLights[i];
      if (isOutdoors) {
        item.light.visible = (item.floor === 'floor1' && this.playerPos.z <= -45 && this.playerPos.z >= -62);
      } else {
        item.light.visible = (item.floor === activeFloor);
      }
    }
  }

  animate() {
    if (!this.isRunning) return;
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const now = Date.now();

    this.updatePlayer(delta);
    this.checkInteractions();
    this.updateLightCulling();

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

    // Hoạt ảnh mưa rơi tối ưu (dịch chuyển nhóm hạt, không tốn bus buffer GPU)
    if (this.rainSystem && this.rainSystem.visible) {
      this.rainSystem.position.y -= delta * 20;
      if (this.rainSystem.position.y < -32) {
        this.rainSystem.position.y = 0;
      }
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

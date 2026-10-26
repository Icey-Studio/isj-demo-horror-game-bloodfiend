// Hệ thống Cutscene Mở Đầu - Chế độ Sinh Tồn (Survival Mode Opening)
import { audioManager } from './audio.js';

export class IntroCutscene {
  constructor(canvas, onStartFirstPerson, onReturnToMenu) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onStartFirstPerson = onStartFirstPerson;
    this.onReturnToMenu = onReturnToMenu;

    // Kích thước canvas pixel retro
    this.width = 360;
    this.height = 202;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Các trạng thái phân cảnh
    this.STATE_1_FOREST_EDGE = 1;
    this.STATE_2_AERIAL = 2;
    this.STATE_3_IN_CAR = 3;
    this.STATE_4_RISING_SKY = 4;
    this.currentState = this.STATE_1_FOREST_EDGE;

    this.stateTimer = 0;
    this.fadeAlpha = 1.0;
    this.isFadingIn = true;
    this.isFadingOut = false;
    this.nextState = null;

    // --- Biến Phân Cảnh 1: Bìa rừng xe chạy ngang ---
    this.car1X = this.width + 40;
    this.car1Speed = 2.4;
    this.sirenFlash1 = 0;

    // --- Biến Phân Cảnh 2: Góc nhìn trên cao ---
    this.car2Progress = 0; // 0 to 1 dọc theo cung đường

    // --- Biến Phân Cảnh 3: Trong xe cảnh sát ---
    this.cameraPan = 0;
    this.targetCameraPan = 0;
    this.wiperAngle = 0;
    this.wiperDir = 1;
    this.roadOffset = 0;

    // Hội thoại trong xe
    this.dialogueIndex = 0;
    this.dialogueCharIndex = 0;
    this.dialogueTimer = 0;
    this.isTyping = false;
    this.showCrashedTruck = false;

    this.dialogues = [
      { speaker: "TỔNG ĐÀI", text: "Tuần tra số 7, đây là Tổng đài. An, ca trực đêm của cậu thế nào rồi?" },
      { speaker: "AN", text: "Nghe rõ, Tổng đài. Tôi đang đi tuần trên cung đường rừng quốc lộ cũ." },
      { speaker: "TỔNG ĐÀI", text: "Cơn bão đang đổ bộ đấy, đường trơn và sương mù dày lắm. Kiểm tra xong thì về đồn sớm." },
      { speaker: "AN", text: "Rõ. Thời tiết ở đây tệ thật, đèn pha chỉ rọi được vài mét trước mặt..." },
      // Sau câu này An quay đầu nhìn ghế phụ & cửa xe
      { speaker: "TỔNG ĐÀI", text: "À mà này An, bên bưu cục vừa báo một chiếc xe tải giao hàng đã mất tín hiệu định vị ở khu vực đó." },
      { speaker: "AN", text: "Giao hàng giữa đêm bão trong rừng sâu sao? Ai lại đặt hàng ở đây chứ?" },
      { speaker: "TỔNG ĐÀI", text: "Đơn hàng định kỳ gửi đến khu biệt thự biệt lập của gia đình ông Bình... nơi từng có nhiều lời đồn lạ." },
      { speaker: "AN", text: "Biệt thự ông Bình? Nơi đó nằm sâu tít trong bìa rừng, đường đi dốc và hiểm trở lắm." },
      { speaker: "TỔNG ĐÀI", text: "Cứ để mắt quan sát nhé An. Có gì bất thường thì lập tức báo lại ngay." },
      { speaker: "AN", text: "Hiểu rồi, tôi đang qua khúc cua dẫn vào con đường mòn..." },
      // Khi đến đây: Xuất hiện xe đâm gốc cây bốc khói
      { speaker: "AN", text: "Khoan đã!... Có một chiếc xe tải bên vệ đường! Nó đâm thẳng vào gốc cây và đang bốc khói dữ dội!" }
    ];

    // --- Biến Phân Cảnh 4: Camera nâng dần lên trời & hiện tựa game ---
    this.cameraLiftY = 0;
    this.titleOpacity = 0;
    this.titleImpactPlayed = false;
    this.smokeParticles = [];
    for (let i = 0; i < 30; i++) {
      this.smokeParticles.push({
        x: 160 + (Math.random() * 16 - 8),
        y: 135 + Math.random() * 10,
        radius: 2 + Math.random() * 4,
        speedY: 0.4 + Math.random() * 0.6,
        alpha: 0.7 + Math.random() * 0.3
      });
    }

    // Mưa rơi toàn cảnh
    this.raindrops = [];
    for (let i = 0; i < 80; i++) {
      this.raindrops.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        len: 4 + Math.random() * 6,
        speed: 8 + Math.random() * 4
      });
    }

    this.sirenTimer = 0;
    this.lightningAlpha = 0;
    this.nextLightning = Date.now() + 6000;

    // Lắng nghe click chuột chuyển hội thoại
    this.handleClick = this.handleClick.bind(this);
    this.handleKey = this.handleKey.bind(this);
    window.addEventListener('click', this.handleClick);
    window.addEventListener('keydown', this.handleKey);

    this.animate = this.animate.bind(this);
    this.isRunning = true;
    this.animId = requestAnimationFrame(this.animate);
  }

  destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('click', this.handleClick);
    window.removeEventListener('keydown', this.handleKey);
  }

  handleKey(e) {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
      this.handleClick();
    } else if (e.key === 'Escape') {
      if (this.onReturnToMenu) {
        this.destroy();
        this.onReturnToMenu();
      }
    }
  }

  handleClick(e) {
    if (this.currentState === this.STATE_4_RISING_SKY && this.titleOpacity > 0.4) {
      // Nhấn chuột để bước xuống xe vào góc nhìn thứ nhất
      if (this.onStartFirstPerson) {
        this.destroy();
        this.onStartFirstPerson();
        return;
      }
    }
    if (this.currentState === this.STATE_3_IN_CAR) {
      const currentDialogue = this.dialogues[this.dialogueIndex];
      // Nếu đang gõ dở thì click sẽ hiện full câu luôn
      if (this.dialogueCharIndex < currentDialogue.text.length) {
        this.dialogueCharIndex = currentDialogue.text.length;
        return;
      }

      // Sang câu tiếp theo
      if (this.dialogueIndex < this.dialogues.length - 1) {
        this.dialogueIndex++;
        this.dialogueCharIndex = 0;
        audioManager.playRadioBeep();

        // Sau 4 câu thoại: An quay qua quay lại nhìn cửa & ghế phụ
        if (this.dialogueIndex === 4) {
          this.targetCameraPan = 40; // Quay sang phải nhìn súng, đèn pin trên ghế phụ
          setTimeout(() => {
            this.targetCameraPan = -25; // Liếc sang trái nhìn cửa sổ
            setTimeout(() => {
              this.targetCameraPan = 0; // Nhìn lại phía trước
            }, 800);
          }, 900);
        }

        // Đủ 10 câu (chuẩn bị tới câu 11): Hiện xe gặp nạn bốc khói
        if (this.dialogueIndex === 10) {
          this.showCrashedTruck = true;
        }
      } else {
        // Đã hết 11 câu thoại -> Chuyển sang Phân Cảnh 4: Nâng camera lên trời
        this.transitionTo(this.STATE_4_RISING_SKY);
      }
    } else if (this.currentState === this.STATE_2_AERIAL) {
      // Cho phép click bỏ qua đoạn nhìn từ trên cao
      this.transitionTo(this.STATE_3_IN_CAR);
    }
  }

  transitionTo(nextState) {
    if (this.isFadingOut) return;
    this.isFadingOut = true;
    this.nextState = nextState;
  }

  update() {
    // Cập nhật mưa
    for (let drop of this.raindrops) {
      drop.y += drop.speed;
      drop.x -= 1.2;
      if (drop.y > this.height) {
        drop.y = -5;
        drop.x = Math.random() * (this.width + 40);
      }
    }

    // Còi cảnh sát nhấp nháy
    this.sirenTimer += 0.2;
    this.sirenFlash1 = Math.sin(this.sirenTimer) > 0 ? 1 : 0;

    // Sấm chớp ngẫu nhiên
    if (Date.now() > this.nextLightning) {
      this.lightningAlpha = 0.8;
      audioManager.playThunder();
      this.nextLightning = Date.now() + 8000 + Math.random() * 7000;
    }
    if (this.lightningAlpha > 0) {
      this.lightningAlpha -= 0.04;
      if (this.lightningAlpha < 0) this.lightningAlpha = 0;
    }

    // Hiệu ứng Fade in/out
    if (this.isFadingIn) {
      this.fadeAlpha -= 0.05;
      if (this.fadeAlpha <= 0) {
        this.fadeAlpha = 0;
        this.isFadingIn = false;
      }
    } else if (this.isFadingOut) {
      this.fadeAlpha += 0.05;
      if (this.fadeAlpha >= 1) {
        this.fadeAlpha = 1;
        this.isFadingOut = false;
        this.currentState = this.nextState;
        this.isFadingIn = true;
        this.stateTimer = 0;
      }
    }

    this.stateTimer++;

    // Cập nhật từng phân cảnh
    switch (this.currentState) {
      case this.STATE_1_FOREST_EDGE:
        this.car1X -= this.car1Speed;
        // Khi xe chạy hết góc nhìn trái (-100px) thì đổi góc nhìn
        if (this.car1X < -110 && !this.isFadingOut) {
          this.transitionTo(this.STATE_2_AERIAL);
        }
        break;

      case this.STATE_2_AERIAL:
        this.car2Progress += 0.0035;
        if (this.car2Progress >= 1.0 && !this.isFadingOut) {
          this.transitionTo(this.STATE_3_IN_CAR);
        }
        break;

      case this.STATE_3_IN_CAR:
        // Cần gạt nước
        this.wiperAngle += 0.08 * this.wiperDir;
        if (this.wiperAngle > 0.8) this.wiperDir = -1;
        if (this.wiperAngle < -0.8) this.wiperDir = 1;

        // Vạch kẻ đường lao tới
        this.roadOffset = (this.roadOffset + 4) % 40;

        // Xoay đầu camera mượt mà
        this.cameraPan += (this.targetCameraPan - this.cameraPan) * 0.1;

        // Hiệu ứng chữ gõ máy (typewriter)
        const curText = this.dialogues[this.dialogueIndex].text;
        if (this.dialogueCharIndex < curText.length) {
          this.dialogueCharIndex++;
        }
        break;

      case this.STATE_4_RISING_SKY:
        // Camera từ từ nâng cao lên trời
        if (this.cameraLiftY < 80) {
          this.cameraLiftY += 0.45;
        } else {
          // Hiện tựa game
          if (this.titleOpacity < 1) {
            this.titleOpacity += 0.03;
            if (!this.titleImpactPlayed && this.titleOpacity > 0.4) {
              audioManager.playDramaticImpact();
              this.titleImpactPlayed = true;
            }
          }
        }

        // Khói xe bốc lên
        for (let p of this.smokeParticles) {
          p.y -= p.speedY;
          p.x += Math.sin(p.y * 0.1) * 0.3;
          p.radius += 0.08;
          p.alpha -= 0.008;
          if (p.alpha <= 0) {
            p.y = 135;
            p.x = 160 + (Math.random() * 14 - 7);
            p.radius = 2 + Math.random() * 3;
            p.alpha = 0.8;
          }
        }
        break;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#08060d';
    ctx.fillRect(0, 0, this.width, this.height);

    switch (this.currentState) {
      case this.STATE_1_FOREST_EDGE:
        this.drawScene1(ctx);
        break;
      case this.STATE_2_AERIAL:
        this.drawScene2(ctx);
        break;
      case this.STATE_3_IN_CAR:
        this.drawScene3(ctx);
        break;
      case this.STATE_4_RISING_SKY:
        this.drawScene4(ctx);
        break;
    }

    // Hiệu ứng sấm chớp
    if (this.lightningAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningAlpha * 0.5})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Màn đen chuyển cảnh Fade
    if (this.fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  // ==========================================
  // PHÂN CẢNH 1: BÌA RỪNG (GÓC THẤP XE CHẠY NGANG)
  // ==========================================
  drawScene1(ctx) {
    // Bầu trời đêm
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#0a0814');
    grad.addColorStop(1, '#1c152b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Rừng cây rậm phía sau
    ctx.fillStyle = '#0f0c1c';
    for (let x = 0; x < this.width + 40; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x - 12, 130);
      ctx.lineTo(x, 40 + Math.sin(x) * 15);
      ctx.lineTo(x + 12, 130);
      ctx.fill();
    }

    // Mặt đường nhựa thấp
    ctx.fillStyle = '#100e17';
    ctx.fillRect(0, 130, this.width, 72);

    // Vạch kẻ đường ngắt quãng
    ctx.fillStyle = '#4a4459';
    for (let rx = 10; rx < this.width; rx += 45) {
      ctx.fillRect(rx, 165, 25, 4);
    }

    // Hàng cây tiền cảnh sát mép đường
    ctx.fillStyle = '#06050a';
    ctx.fillRect(20, 30, 24, 110);
    ctx.fillRect(290, 10, 30, 130);

    // Luồng sáng đèn pha xe chiếu quét trước đầu xe (từ phải sang trái)
    ctx.fillStyle = 'rgba(255, 245, 180, 0.25)';
    ctx.beginPath();
    ctx.moveTo(this.car1X - 5, 148);
    ctx.lineTo(this.car1X - 110, 130);
    ctx.lineTo(this.car1X - 120, 185);
    ctx.lineTo(this.car1X - 5, 160);
    ctx.fill();

    // VẼ CHIẾC XE CẢNH SÁT (Pixel Police Cruiser)
    const cx = this.car1X;
    const cy = 135;

    // Thân xe
    ctx.fillStyle = '#1a1824'; // Đen
    ctx.fillRect(cx, cy + 10, 80, 22);

    // Nắp ca-pô & cốp xe
    ctx.fillRect(cx - 8, cy + 18, 10, 14);

    // Cửa trắng ở giữa có huy hiệu
    ctx.fillStyle = '#e0e2db';
    ctx.fillRect(cx + 25, cy + 10, 30, 20);

    // Dòng chữ / Huy hiệu cảnh sát
    ctx.fillStyle = '#112244';
    ctx.fillRect(cx + 34, cy + 17, 12, 5);

    // Cửa kính xe
    ctx.fillStyle = '#3a4b60';
    ctx.fillRect(cx + 18, cy + 3, 44, 9);

    // Bánh xe đang quay
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx + 16, cy + 32, 7, 0, Math.PI * 2);
    ctx.arc(cx + 64, cy + 32, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#777';
    ctx.beginPath();
    ctx.arc(cx + 16, cy + 32, 3, 0, Math.PI * 2);
    ctx.arc(cx + 64, cy + 32, 3, 0, Math.PI * 2);
    ctx.fill();

    // Đèn pha trước
    ctx.fillStyle = '#fff8b0';
    ctx.fillRect(cx - 8, cy + 19, 4, 6);

    // Đèn hậu đỏ
    ctx.fillStyle = '#e63946';
    ctx.fillRect(cx + 78, cy + 19, 3, 5);

    // CÒI CẢNH SÁT TRÊN NÓC XE (Nhấp nháy Đỏ / Xanh)
    ctx.fillStyle = this.sirenFlash1 ? '#ff1a1a' : '#1a75ff';
    ctx.fillRect(cx + 36, cy - 1, 8, 4);

    // Hào quang còi cảnh sát
    ctx.fillStyle = this.sirenFlash1 ? 'rgba(255, 30, 30, 0.35)' : 'rgba(30, 120, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(cx + 40, cy + 1, 35, 0, Math.PI * 2);
    ctx.fill();

    // Mưa rơi
    this.drawRain(ctx);
  }

  // ==========================================
  // PHÂN CẢNH 2: GÓC NHÌN TRÊN CAO (AERIAL VIEW)
  // ==========================================
  drawScene2(ctx) {
    // 1. Phía xa đường chân trời: Ánh sáng thành phố rực rỡ
    const horizonGrad = ctx.createLinearGradient(0, 0, 0, 80);
    horizonGrad.addColorStop(0, '#0a0915');
    horizonGrad.addColorStop(0.7, '#241b38');
    horizonGrad.addColorStop(1, '#4a2840'); // Ánh vàng hồng mờ của đô thị phía xa
    ctx.fillStyle = horizonGrad;
    ctx.fillRect(0, 0, this.width, 70);

    // Bóng đường chân trời thành phố (Skyline buildings)
    ctx.fillStyle = '#1c1526';
    for (let bx = 160; bx < this.width; bx += 8) {
      const bh = 15 + Math.sin(bx * 0.4) * 12;
      ctx.fillRect(bx, 60 - bh, 6, bh);
      // Đèn vàng lấm chấm thành phố
      if (Math.sin(bx) > 0) {
        ctx.fillStyle = '#ffcf56';
        ctx.fillRect(bx + 2, 60 - bh + 4, 2, 2);
        ctx.fillStyle = '#1c1526';
      }
    }

    // 2. Gần đường chân trời (bên trái): Bóng căn biệt thự nguy nga bí ẩn
    ctx.fillStyle = '#0b0813';
    const mx = 45;
    const my = 35;
    // Tháp nhọn biệt thự
    ctx.fillRect(mx + 10, my, 18, 30);
    ctx.beginPath();
    ctx.moveTo(mx + 8, my);
    ctx.lineTo(mx + 19, my - 16);
    ctx.lineTo(mx + 30, my);
    ctx.fill();
    // Thân biệt thự
    ctx.fillRect(mx + 28, my + 10, 45, 22);

    // 3. Toàn cảnh thung lũng rừng thông nhìn từ trên cao
    ctx.fillStyle = '#07050d';
    ctx.fillRect(0, 68, this.width, this.height - 68);

    // Tán cây rừng rậm nhìn từ trên
    for (let tx = 0; tx < this.width; tx += 12) {
      for (let ty = 72; ty < this.height; ty += 12) {
        ctx.fillStyle = (tx + ty) % 24 === 0 ? '#0d0b17' : '#05040a';
        ctx.fillRect(tx, ty, 10, 10);
      }
    }

    // 4. Con đường quanh co uốn lượn xuyên rừng
    ctx.strokeStyle = '#221e2e';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(340, 200);
    ctx.bezierCurveTo(240, 170, 180, 140, 140, 110);
    ctx.bezierCurveTo(100, 80, 90, 75, mx + 50, my + 25);
    ctx.stroke();

    // Vạch vàng giữa đường
    ctx.strokeStyle = '#665533';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Chiếc xe cảnh sát nhỏ bé đang chạy dọc theo con đường
    // Tính toán toạ độ nội suy trên đường
    const t = this.car2Progress;
    // Điểm nội suy đơn giản trên đường
    const carX = 340 * (1 - t) + 120 * t;
    const carY = 200 * (1 - t) + 100 * t;

    // Luồng đèn pha xe chiếu về phía trước
    ctx.fillStyle = 'rgba(255, 240, 170, 0.4)';
    ctx.beginPath();
    ctx.moveTo(carX, carY);
    ctx.lineTo(carX - 25, carY - 20);
    ctx.lineTo(carX - 10, carY - 32);
    ctx.fill();

    // Chiếc xe (sprite nhỏ 8x5)
    ctx.fillStyle = '#fff';
    ctx.fillRect(carX - 4, carY - 2, 8, 5);
    ctx.fillStyle = '#111';
    ctx.fillRect(carX - 2, carY - 2, 4, 5);

    // Còi chớp đỏ xanh
    ctx.fillStyle = this.sirenFlash1 ? '#ff2222' : '#2255ff';
    ctx.fillRect(carX - 1, carY - 3, 3, 2);

    // Chữ chú thích góc màn hình
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px monospace';
    ctx.fillText('[TUẦN TRA BÌA RỪNG PHÍA TÂY - 20:30]', 15, 190);

    this.drawRain(ctx);
  }

  // ==========================================
  // PHÂN CẢNH 3: GÓC NHÌN TRONG XE (FIRST-PERSON COCKPIT)
  // ==========================================
  drawScene3(ctx) {
    const pan = this.cameraPan;

    // 1. Nhìn qua kính chắn gió: Con đường tối đen và cây cối lướt qua
    ctx.fillStyle = '#0a0812';
    ctx.fillRect(0, 0, this.width, 130);

    // Hai hàng cây lướt qua ngoài cửa kính
    ctx.fillStyle = '#06050b';
    for (let i = 0; i < 4; i++) {
      const treeX = ((i * 100 - this.roadOffset * 2) % 360) - 20;
      ctx.fillRect(treeX - pan, 20, 30, 90);
      ctx.fillRect(360 - treeX - pan, 20, 30, 90);
    }

    // Mặt đường phía trước
    ctx.fillStyle = '#14111d';
    ctx.beginPath();
    ctx.moveTo(110 - pan, 120);
    ctx.lineTo(170 - pan, 60);
    ctx.lineTo(190 - pan, 60);
    ctx.lineTo(250 - pan, 120);
    ctx.fill();

    // Luồng đèn pha chiếu rọi mặt đường
    ctx.fillStyle = 'rgba(255, 248, 200, 0.3)';
    ctx.beginPath();
    ctx.moveTo(130 - pan, 120);
    ctx.lineTo(175 - pan, 62);
    ctx.lineTo(185 - pan, 62);
    ctx.lineTo(230 - pan, 120);
    ctx.fill();

    // Vạch kẻ đường lao tới
    ctx.fillStyle = '#fff';
    const wy = 60 + (this.roadOffset / 40) * 60;
    const ww = 2 + (this.roadOffset / 40) * 6;
    ctx.fillRect(180 - pan - ww / 2, wy, ww, 8);

    // --- NẾU ĐÃ ĐẾN CÂU 10: XUẤT HIỆN XE TẢI ĐÂM GỐC CÂY BỐC KHÓI ---
    if (this.showCrashedTruck) {
      const truckX = 220 - pan;
      const truckY = 55;

      // Gốc cây to bên đường
      ctx.fillStyle = '#1c130d';
      ctx.fillRect(truckX + 22, truckY - 25, 16, 45);

      // Thân xe tải giao hàng (bị đâm móp đầu)
      ctx.fillStyle = '#8b5a2b'; // Màu thùng hàng
      ctx.fillRect(truckX - 18, truckY - 6, 26, 20);
      ctx.fillStyle = '#cfd2cd'; // Đầu xe bẹp dúm
      ctx.fillRect(truckX + 8, truckY - 2, 16, 16);

      // Đèn xi-nhan nguy hiểm nhấp nháy màu hổ phách
      if (Math.sin(Date.now() * 0.01) > 0) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(truckX + 22, truckY + 2, 3, 3);
        ctx.fillRect(truckX - 16, truckY + 2, 3, 3);
      }

      // Khói đen bốc lên từ đầu xe
      ctx.fillStyle = 'rgba(60, 60, 60, 0.6)';
      for (let s = 0; s < 5; s++) {
        const sy = truckY - 10 - s * 7;
        const sx = truckX + 18 + Math.sin(Date.now() * 0.005 + s) * 5;
        ctx.beginPath();
        ctx.arc(sx, sy, 4 + s * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Giọt nước mưa bám trên kính chắn gió
    ctx.fillStyle = 'rgba(200, 220, 255, 0.35)';
    for (let w = 0; w < 25; w++) {
      ctx.fillRect((w * 17) % this.width, (w * 13) % 115, 2, 5);
    }

    // Cần gạt nước trên kính
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(130 - pan, 125);
    ctx.lineTo(130 - pan + Math.cos(this.wiperAngle) * 65, 125 - Math.sin(this.wiperAngle) * 55);
    ctx.stroke();

    // 2. KHUNG NỘI THẤT TRONG XE CẢNH SÁT (Cockpit & Dashboard)
    // Kính chiếu hậu ở trên
    ctx.fillStyle = '#1c1a24';
    ctx.fillRect(145 - pan, 10, 70, 20);
    ctx.fillStyle = '#2c3545';
    ctx.fillRect(148 - pan, 13, 64, 14);

    // Táp-lô xe cảnh sát
    ctx.fillStyle = '#121018';
    ctx.fillRect(0, 115, this.width, 87);

    // Vô lăng bên trái
    const steerX = 85 - pan;
    const steerY = 145;
    ctx.strokeStyle = '#2d273a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(steerX, steerY, 32, 0, Math.PI * 2);
    ctx.stroke();
    // Chấu vô lăng
    ctx.fillStyle = '#221e2c';
    ctx.fillRect(steerX - 25, steerY - 3, 50, 6);

    // Bảng đồng hồ tốc độ phát sáng xanh mờ
    ctx.fillStyle = '#1f353d';
    ctx.fillRect(steerX - 22, 120, 44, 12);
    ctx.fillStyle = '#38b000';
    ctx.fillRect(steerX - 10, 124, 20, 4);

    // BỘ ĐÀM CẢNH SÁT Ở GIỮA TÁP-LÔ
    ctx.fillStyle = '#1e1c26';
    ctx.fillRect(170 - pan, 125, 45, 26);
    // Dây xoắn bộ đàm
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(175 - pan, 148);
    ctx.lineTo(170 - pan, 160);
    ctx.lineTo(180 - pan, 168);
    ctx.stroke();
    // Đèn LED đỏ nhấp nháy trên bộ đàm khi có tiếng nói
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(205 - pan, 130, 4, 4);

    // KHẨU SÚNG LỤC (Pistol) nằm trên táp-lô
    ctx.fillStyle = '#2e2b38';
    ctx.fillRect(225 - pan, 132, 22, 7);
    ctx.fillRect(238 - pan, 138, 7, 12); // Báng súng
    ctx.fillStyle = '#1a1820';
    ctx.fillRect(228 - pan, 134, 16, 4);

    // ĐÈN PIN CẢNH SÁT (Tactical Flashlight) trên ghế phụ
    ctx.fillStyle = '#444';
    ctx.fillRect(260 - pan, 136, 32, 8);
    ctx.fillStyle = '#222';
    ctx.fillRect(256 - pan, 134, 6, 12); // Đầu đèn pin

    // Cửa kính ghế phụ (nhìn thấy khi quay đầu)
    if (pan > 15) {
      ctx.fillStyle = '#1b1824';
      ctx.fillRect(310 - pan, 20, 70, 95);
      // Mưa đập vào kính cửa bên
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(320 - pan, 40, 2, 8);
      ctx.fillRect(335 - pan, 60, 2, 10);
    }

    // 3. KHUNG HỘI THOẠI (DIALOGUE BOX) PIXEL CỰC ĐẸP
    const curDialogue = this.dialogues[this.dialogueIndex];
    this.drawDialogueBox(ctx, curDialogue.speaker, curDialogue.text.substring(0, this.dialogueCharIndex));
  }

  // Vẽ Khung Hội Thoại Retro Pixel
  drawDialogueBox(ctx, speaker, text) {
    const boxX = 14;
    const boxY = 135;
    const boxW = this.width - 28;
    const boxH = 60;

    // Hộp đen viền đôi
    ctx.fillStyle = 'rgba(10, 8, 14, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    ctx.strokeStyle = speaker === "AN" ? '#8b0000' : '#c9933b';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Thẻ tên người nói
    ctx.fillStyle = speaker === "AN" ? '#8b0000' : '#3d2d14';
    ctx.fillRect(boxX + 10, boxY - 10, 85, 14);
    ctx.fillStyle = '#fff';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillText(speaker, boxX + 16, boxY - 1);

    // Nội dung câu thoại
    ctx.fillStyle = '#f0f2eb';
    ctx.font = '13px "VT323", monospace';
    
    // Tự ngắt dòng văn bản
    this.wrapText(ctx, text, boxX + 14, boxY + 18, boxW - 28, 15);

    // Mũi tên nhấp nháy báo bấm chuột để tiếp tục
    if (Math.sin(Date.now() * 0.008) > 0) {
      ctx.fillStyle = '#ffd166';
      ctx.fillText('▼ [Click / Space]', boxX + boxW - 95, boxY + boxH - 6);
    }
  }

  // Tự động ngắt dòng văn bản
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  // ==========================================
  // PHÂN CẢNH 4: CAMERA NÂNG LÊN TRỜI & HIỆN TÊN GAME
  // ==========================================
  drawScene4(ctx) {
    const lift = this.cameraLiftY;

    // 1. Phía dưới: Xe cảnh sát dừng cạnh xe tải bị tai nạn
    const groundY = 120 + lift;

    ctx.fillStyle = '#08060c';
    ctx.fillRect(0, groundY - 40, this.width, 150);

    // Mặt đường
    ctx.fillStyle = '#110e1a';
    ctx.fillRect(0, groundY, this.width, 60);

    // Xe cảnh sát đỗ chéo
    ctx.fillStyle = '#fff';
    ctx.fillRect(60, groundY + 10, 45, 18);
    ctx.fillStyle = '#111';
    ctx.fillRect(72, groundY + 10, 20, 18);

    // Đèn còi cảnh sát chớp sáng rọi vào rừng
    ctx.fillStyle = this.sirenFlash1 ? 'rgba(255, 30, 30, 0.4)' : 'rgba(30, 100, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(82, groundY + 18, 45, 0, Math.PI * 2);
    ctx.fill();

    // Xe tải gặp nạn đâm gốc cây
    ctx.fillStyle = '#654321';
    ctx.fillRect(150, groundY + 5, 40, 24);
    // Gốc cây to
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(182, groundY - 30, 22, 60);

    // Đèn xi-nhan nguy hiểm chớp vàng
    if (Math.sin(Date.now() * 0.01) > 0) {
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(152, groundY + 8, 4, 4);
    }

    // Khói đen bốc lên từ vụ tai nạn
    ctx.fillStyle = 'rgba(70, 70, 80, 0.55)';
    for (let p of this.smokeParticles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y + lift * 0.8, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. PHÍA TRÊN BẦU TRỜI: BÓNG KHỔNG LỒ CỦA BIỆT THỰ HUYẾT QUỶ
    // Khi camera nâng lên, bóng biệt thự to lớn dần lộ ra
    const mansionY = -40 + lift * 0.8;
    ctx.fillStyle = '#050409';

    // Tháp nhọn đồ sộ
    ctx.fillRect(140, mansionY + 20, 50, 90);
    ctx.beginPath();
    ctx.moveTo(130, mansionY + 20);
    ctx.lineTo(165, mansionY - 45);
    ctx.lineTo(200, mansionY + 20);
    ctx.fill();

    // Cánh trái & cánh phải biệt thự khổng lồ
    ctx.fillRect(80, mansionY + 50, 60, 60);
    ctx.fillRect(190, mansionY + 50, 75, 60);

    // Mái ngói nhọn như răng cưa quái vật
    ctx.beginPath();
    ctx.moveTo(70, mansionY + 50);
    ctx.lineTo(110, mansionY + 10);
    ctx.lineTo(140, mansionY + 50);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(190, mansionY + 50);
    ctx.lineTo(230, mansionY + 15);
    ctx.lineTo(270, mansionY + 50);
    ctx.fill();

    // Mưa dông bão tố
    this.drawRain(ctx);

    // 3. HIỆN TÊN GAME NGẦU VÀ CÁC NÚT BẤM (TITLE CARD)
    if (this.titleOpacity > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this.titleOpacity * 0.75})`;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.save();
      ctx.globalAlpha = this.titleOpacity;

      // Chữ BLOODFIEND đỏ rực máu có đổ bóng kinh dị
      ctx.fillStyle = '#ff2a2a';
      ctx.font = '22px "Press Start 2P", monospace';
      ctx.textAlign = 'center';

      // Bóng đen chữ
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.fillText('BLOODFIEND', this.width / 2, 65);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffd166';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText('HUYẾT QUỶ', this.width / 2, 85);

      ctx.fillStyle = '#a0aab2';
      ctx.font = '13px "VT323", monospace';
      ctx.fillText('"Ánh Sáng Là Sinh Mạng Duy Nhất"', this.width / 2, 105);

      // NÚT "BƯỚC XUỐNG XE & ĐIỀU TRA (GÓC NHÌN THỨ NHẤT)"
      const btnW = 210;
      const btnH = 28;
      const btnX = (this.width - btnW) / 2;
      const btnY = 125;

      ctx.fillStyle = '#8b0000';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = '#ff2a2a';
      ctx.lineWidth = 2;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.fillStyle = '#ffffff';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('▶ XUỐNG XE & ĐIỀU TRA', this.width / 2, btnY + 17);

      // Chú thích vào góc nhìn thứ nhất
      ctx.fillStyle = '#ffd166';
      ctx.font = '12px "VT323", monospace';
      ctx.fillText('(Click chuột để bắt đầu Góc Nhìn Thứ 1)', this.width / 2, btnY + 38);

      // Nút "QUAY LẠI MENU"
      ctx.fillStyle = '#888899';
      ctx.font = '12px "VT323", monospace';
      ctx.fillText('[ Hoặc bấm ESC để Quay Lại Menu ]', this.width / 2, 185);

      ctx.restore();
    }
  }

  // Vẽ các hạt mưa
  drawRain(ctx) {
    ctx.strokeStyle = 'rgba(170, 190, 230, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let drop of this.raindrops) {
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 2, drop.y + drop.len);
    }
    ctx.stroke();
  }

  animate() {
    if (!this.isRunning) return;
    this.update();
    this.draw();
    this.animId = requestAnimationFrame(this.animate);
  }
}

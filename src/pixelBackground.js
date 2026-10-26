// Canvas Pixel Art Horror Scene - Nền hoạt ảnh kinh dị 2D Pixel
import { audioManager } from './audio.js';

export class PixelBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Độ phân giải pixel gốc thấp (Retro Pixel Look 320x180)
    this.width = 360;
    this.height = 202;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Hạt mưa
    this.raindrops = [];
    this.maxRain = 140;
    for (let i = 0; i < this.maxRain; i++) {
      this.raindrops.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        len: 4 + Math.random() * 6,
        speed: 7 + Math.random() * 5
      });
    }

    // Lớp sương mù trôi lơ lửng
    this.fogOffset1 = 0;
    this.fogOffset2 = 0;

    // Trạng thái sấm chớp
    this.lightningIntensity = 0;
    this.nextLightningTime = Date.now() + 5000 + Math.random() * 6000;

    // Đèn cửa sổ nhấp nháy
    this.windowFlicker = 1;
    this.nextFlicker = Date.now() + 200;

    this.isRunning = true;
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  destroy() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
  }

  triggerLightning() {
    this.lightningIntensity = 1.0;
    audioManager.playThunder();
    this.nextLightningTime = Date.now() + 7000 + Math.random() * 9000;
  }

  update() {
    const now = Date.now();

    // Cập nhật mưa
    for (let drop of this.raindrops) {
      drop.y += drop.speed;
      drop.x -= 1.2; // Gió thổi nghiêng
      if (drop.y > this.height) {
        drop.y = -10;
        drop.x = Math.random() * (this.width + 40);
      }
    }

    // Sương mù trôi
    this.fogOffset1 += 0.25;
    this.fogOffset2 += 0.45;
    if (this.fogOffset1 > this.width) this.fogOffset1 = 0;
    if (this.fogOffset2 > this.width) this.fogOffset2 = 0;

    // Sấm chớp
    if (now > this.nextLightningTime) {
      this.triggerLightning();
    }
    if (this.lightningIntensity > 0) {
      this.lightningIntensity -= 0.05;
      if (this.lightningIntensity < 0) this.lightningIntensity = 0;
    }

    // Đèn cửa sổ lập lòe
    if (now > this.nextFlicker) {
      this.windowFlicker = Math.random() > 0.3 ? (0.6 + Math.random() * 0.4) : 0.15;
      this.nextFlicker = now + 100 + Math.random() * 400;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    // 1. Bầu trời đêm bão giông
    let skyColorTop = '#0a0812';
    let skyColorBottom = '#181224';
    if (this.lightningIntensity > 0.4) {
      skyColorTop = '#3a354d';
      skyColorBottom = '#5a5472';
    } else if (this.lightningIntensity > 0.1) {
      skyColorTop = '#221e33';
      skyColorBottom = '#332c4a';
    }

    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, skyColorTop);
    skyGrad.addColorStop(1, skyColorBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Mặt trăng máu le lói sau mây đen
    ctx.fillStyle = this.lightningIntensity > 0.2 ? '#e2e8f0' : '#882222';
    ctx.beginPath();
    ctx.arc(this.width - 65, 45, 18, 0, Math.PI * 2);
    ctx.fill();

    // Vệt mây che trăng
    ctx.fillStyle = 'rgba(10, 8, 18, 0.7)';
    ctx.fillRect(this.width - 90, 40, 55, 6);
    ctx.fillRect(this.width - 75, 49, 45, 4);

    // 3. Rặng cây rừng rậm phía xa (Background trees)
    ctx.fillStyle = this.lightningIntensity > 0.2 ? '#252136' : '#0e0b17';
    this.drawForest(ctx, 110, 24);

    // 4. Biệt thự ma ám (The Haunted Mansion Silhouette)
    this.drawMansion(ctx);

    // 5. Rặng cây u ám phía trước (Foreground trees)
    ctx.fillStyle = this.lightningIntensity > 0.2 ? '#1b1726' : '#06050a';
    this.drawForest(ctx, 135, 36);

    // 6. Đồi đất và hàng rào gai
    ctx.fillStyle = '#050407';
    ctx.fillRect(0, 155, this.width, this.height - 155);

    // Hàng rào kim loại rỉ sét
    this.drawFence(ctx);

    // 7. Sương mù trôi lơ lửng (Pixel mist)
    this.drawMist(ctx);

    // 8. Hạt mưa rơi
    ctx.strokeStyle = this.lightningIntensity > 0.2 ? 'rgba(220, 230, 255, 0.75)' : 'rgba(140, 160, 200, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let drop of this.raindrops) {
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 2, drop.y + drop.len);
    }
    ctx.stroke();

    // 9. Vết máu nhỏ giọt trên kính góc màn hình
    this.drawBloodDrips(ctx);
  }

  // Vẽ bóng dáng Biệt thự cổ kính
  drawMansion(ctx) {
    const x = 70;
    const y = 80;

    ctx.fillStyle = this.lightningIntensity > 0.3 ? '#211d2e' : '#0b0912';

    // Thân nhà chính
    ctx.fillRect(x, y + 25, 120, 55);

    // Tháp nhọn bên trái
    ctx.fillRect(x - 15, y + 5, 30, 75);
    // Mái chóp tháp
    ctx.beginPath();
    ctx.moveTo(x - 20, y + 5);
    ctx.lineTo(x, y - 28);
    ctx.lineTo(x + 20, y + 5);
    ctx.fill();

    // Mái nhà chính chữ V
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 25);
    ctx.lineTo(x + 75, y - 10);
    ctx.lineTo(x + 135, y + 25);
    ctx.fill();

    // Cột ống khói
    ctx.fillRect(x + 95, y - 15, 12, 35);

    // Cánh phải biệt thự
    ctx.fillRect(x + 105, y + 35, 45, 45);

    // Ánh sáng cửa sổ lập lòe (Căn phòng của Chi hoặc phòng thí nghiệm)
    if (this.windowFlicker > 0.2) {
      ctx.fillStyle = `rgba(255, 180, 50, ${this.windowFlicker * 0.9})`;
      // Cửa sổ tầng 2
      ctx.fillRect(x + 65, y + 32, 10, 14);
      // Cửa sổ tháp
      ctx.fillStyle = `rgba(255, 60, 60, ${this.windowFlicker * 0.8})`;
      ctx.fillRect(x - 5, y + 20, 10, 14);
    }
  }

  // Vẽ rặng cây rùng rợn
  drawForest(ctx, baseY, treeHeight) {
    for (let i = 0; i < this.width + 30; i += 18) {
      const h = treeHeight + Math.sin(i * 0.5) * 8;
      ctx.beginPath();
      ctx.moveTo(i - 10, baseY);
      ctx.lineTo(i, baseY - h);
      ctx.lineTo(i + 10, baseY);
      ctx.fill();
    }
  }

  // Hàng rào gai sắt
  drawFence(ctx) {
    ctx.strokeStyle = '#121017';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 162);
    ctx.lineTo(this.width, 162);
    ctx.stroke();

    for (let fx = 10; fx < this.width; fx += 14) {
      ctx.beginPath();
      ctx.moveTo(fx, 172);
      ctx.lineTo(fx, 155);
      // Đỉnh nhọn hàng rào
      ctx.lineTo(fx - 2, 158);
      ctx.moveTo(fx, 155);
      ctx.lineTo(fx + 2, 158);
      ctx.stroke();
    }
  }

  // Sương mù pixel
  drawMist(ctx) {
    ctx.fillStyle = 'rgba(25, 20, 35, 0.35)';
    ctx.fillRect(0, 145, this.width, 35);
    ctx.fillStyle = 'rgba(40, 30, 55, 0.25)';
    ctx.fillRect(0, 158, this.width, 30);
  }

  // Vệt máu khô và nhỏ giọt ở góc
  drawBloodDrips(ctx) {
    ctx.fillStyle = 'rgba(139, 0, 0, 0.7)';
    // Vết máu bên góc trái
    ctx.fillRect(0, 0, 15, 4);
    ctx.fillRect(4, 4, 4, 18);
    ctx.fillRect(5, 22, 2, 8);

    ctx.fillRect(18, 0, 20, 3);
    ctx.fillRect(25, 3, 5, 12);
  }

  animate() {
    if (!this.isRunning) return;
    this.update();
    this.draw();
    this.animId = requestAnimationFrame(this.animate);
  }
}


# ✨ Quy Chuẩn Mã Nguồn Sạch (Clean Code Guidelines)
**Dự án:** Bloodfiend – Huyết Quỷ (`isj-demo-horror-game-bloodfiend`)  
**Đơn vị phát triển:** Icey Studio (Founder chính: `MinhPhuc00Ne` / `Jos`) & Bloodfiend Development Team (`MinhPhuc00Ne / Jos`, `LynnieSepearl`, `Zanny2006`, `QuytFen`)

---

## 1. Mục Tiêu Clean Code Trong Dự Án Game 3D
Trong phát triển game 3D trên nền tảng Web với **Three.js**, mã nguồn rất dễ trở nên rối rắm nếu toàn bộ hình học, ánh sáng và vật lý bị viết dồn vào một hàm duy nhất. Tài liệu này đặt ra các quy tắc viết **Clean Code** giúp mã nguồn của **Bloodfiend – Huyết Quỷ** luôn rõ ràng, dễ hiểu và đạt hiệu năng cao.

---

## 2. Các Quy Tắc Cốt Lõi

### 2.1. Chia Nhỏ Hàm Dựng Hình Theo Cụm Thực Thể (Modular Scene Builders)
Không bao giờ khởi tạo toàn bộ thế giới 3D trong `constructor`. Hãy chia `buildWorld()` thành các phương thức con độc lập, mỗi phương thức chịu trách nhiệm dựng một cụm kiến trúc hoặc thực thể hoàn chỉnh:

```javascript
// ✅ TỐT: Hàm buildWorld() đóng vai trò như một mục lục rõ ràng
buildWorld() {
  this.buildHighwayAndForestGround();
  this.buildPoliceCruiser(-2.0, 0, 2.0);
  this.buildCrashedDeliveryTruck(1.2, 0, -11.0);
  this.buildCorpseTree(-2.6, 0, -29);
  this.buildVisceralBloodTrail();
  this.buildMansionEntrance(0, 0, -75);
}
```

### 2.2. Tổ Chức Phân Cấp Bằng `THREE.Group` (Hierarchical Grouping)
Khi dựng một vật thể phức tạp (như chiếc máy quay Handycam, khẩu súng lục, thùng xe tải Nexus hay cánh cửa biệt thự mở hé), luôn gom các bộ phận con vào một `THREE.Group`:
- Giúp di chuyển, xoay hoặc ẩn/hiện toàn bộ vật thể chỉ bằng một dòng lệnh (`this.knifeObject.visible = false`).
- Cho phép tạo khớp xoay tự nhiên (như khớp bản lề màn hình LCD máy quay `screenHinge` hoặc khớp bản lề cửa lâu đài `doorRHinge`).

```javascript
// ✅ TỐT: Dùng Group làm bản lề để xoay cánh cửa mở hé tự nhiên
const doorRHinge = new THREE.Group();
doorRHinge.position.set(2.35, 4.65, 0.12);
doorRHinge.rotation.y = -0.58; // Xoay cả cụm cửa theo trục bản lề
doorRHinge.add(doorR);
portalGroup.add(doorRHinge);
```

### 2.3. Chuyển Động Độc Lập Với Tốc Độ Khung Hình (Frame-Rate Independence)
Mọi phép tính di chuyển, trọng lực, hoạt ảnh vung dao hoặc xe chạy bắt buộc phải nhân với biến thời gian `delta` (thời gian trôi qua giữa 2 khung hình) và giới hạn trần `Math.min(clock.getDelta(), 0.1)` để tránh lỗi xuyên tường khi người chơi chuyển tab:

```javascript
// ✅ TỐT: Luôn giới hạn delta và nhân với tốc độ
const delta = Math.min(this.clock.getDelta(), 0.1);
this.verticalVelocity -= 18.0 * delta;
this.camera.position.y += this.verticalVelocity * delta;
```

### 2.4. Dọn Dẹp Tài Nguyên & Sự Kiện Triệt Để (`destroy()`)
Mỗi khi người chơi chuyển từ cảnh Lái Xe sang Thế Giới 3D hoặc thoát ra Menu chính, phương thức `destroy()` bắt buộc phải:
1. Đặt cờ `this.isRunning = false` để ngắt vòng lặp `requestAnimationFrame`.
2. Gỡ bỏ toàn bộ sự kiện gắn trên `window` (`keydown`, `keyup`, `mousemove`, `resize`, `click`).
3. Thoát chế độ khóa con trỏ chuột (`document.exitPointerLock?.()`).
4. Xóa phần tử giao diện DOM Overlay của phân cảnh đó khỏi `document.body`.

```javascript
destroy() {
  this.isRunning = false;
  window.removeEventListener('keydown', this.onKeyDown);
  window.removeEventListener('keyup', this.onKeyUp);
  window.removeEventListener('mousemove', this.onMouseMove);
  window.removeEventListener('resize', this.onResize);
  document.exitPointerLock?.();
  if (this.uiContainer && this.uiContainer.parentNode) {
    this.uiContainer.parentNode.removeChild(this.uiContainer);
  }
}
```

### 2.5. Tái Sử Dụng Vật Liệu & Họa Tiết (Material & Texture Reuse)
Không khởi tạo mới `THREE.MeshStandardMaterial` hoặc `THREE.CanvasTexture` bên trong vòng lặp `for`. Hãy khởi tạo vật liệu một lần bên ngoài vòng lặp rồi dùng chung cho các `Mesh` cùng loại để tiết kiệm bộ nhớ GPU và giảm số lệnh gọi vẽ (Draw Calls):

```javascript
// ✅ TỐT: Khởi tạo vật liệu 1 lần ngoài vòng lặp
const guardMat = new THREE.MeshStandardMaterial({ color: 0xa0a8b4, metalness: 0.85, roughness: 0.25 });
for (let gz = -35; gz <= 45; gz += 4.0) {
  const railR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 4.0), guardMat);
  this.scene.add(railR);
}
```

### 2.6. Sử Dụng Guard Clauses (Điều Kiện Chặn Sớm)
Tránh lồng ghép `if...else` quá sâu (Arrow Anti-Pattern). Sử dụng lệnh `return` sớm ở đầu hàm để mã nguồn phẳng và dễ đọc:

```javascript
// ✅ TỐT: Kiểm tra điều kiện chặn ngay đầu hàm
slashKnife() {
  if (!this.hasKnife || this.isSlashing) return;
  this.isSlashing = true;
  this.slashTimer = 0;
  audioManager.playKnifeSlash();
}
```

---

## 3. Danh Sách Kiểm Tra (Clean Code Checklist) Trước Khi Commit
- [ ] Không còn câu lệnh `console.log()` thừa dùng để debug tạm thời.
- [ ] Đã kiểm tra lệnh `npm run build` thành công 100% không có lỗi cú pháp.
- [ ] Mọi sự kiện `window.addEventListener` đều có `window.removeEventListener` tương ứng trong hàm `destroy()`.
- [ ] Chú thích phân đoạn rõ ràng bằng tiếng Việt cho từng khu vực kiến trúc 3D hoặc giai đoạn hoạt cảnh.

---

*Bản quyền © 2026 Icey Studio And Bloodfiend Development Team ( LynnieSepearl; Zanny2006; QuytFen )*


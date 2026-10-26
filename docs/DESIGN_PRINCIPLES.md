# 🏛️ Nguyên Lý Thiết Kế Phần Mềm (Design Principles)
**Dự án:** Bloodfiend – Huyết Quỷ (`isj-demo-horror-game-bloodfiend`)  
**Đơn vị phát triển:** Icey Studio (Founder chính: `MinhPhuc00Ne` / `Jos`) & Bloodfiend Development Team (`MinhPhuc00Ne / Jos`, `LynnieSepearl`, `Zanny2006`, `QuytFen`)

---

## 1. Triết Lý Thiết Kế Cốt Lõi
**Bloodfiend – Huyết Quỷ** được xây dựng trên nền tảng Web hiện đại (Vite + Three.js + Web Audio API) với mục tiêu:
- **Trải nghiệm kinh dị nhập vai mượt mà (60 FPS)**: Chuyển đổi linh hoạt giữa không gian 2D Pixel Art và 3D Góc nhìn thứ nhất (First-Person) mà không cần tải lại trang.
- **Tự chủ tài nguyên (Procedural Generation)**: Tự sinh (procedural) toàn bộ hiệu ứng âm thanh bằng Web Audio API và hệ thống họa tiết (Canvas Textures) để giảm dung lượng tải về tối đa và đảm bảo game hoạt động tức thì.
- **Kiến trúc Mô-đun độc lập**: Mỗi phân cảnh là một thực thể khép kín, tự quản lý vòng đời (khởi tạo – cập nhật – hủy bỏ).

---

## 2. Áp Dụng Nguyên Lý S.O.L.I.D Trong Dự Án

### 2.1. Single Responsibility Principle (SRP - Nguyên lý Đơn trách nhiệm)
Mỗi lớp (Class) và mỗi module chỉ đảm nhận **một trách nhiệm duy nhất**:
- [`main.js`](../src/main.js): Đóng vai trò là **App Controller / Scene Router**, quản lý trạng thái Menu chính và điều phối chuyển cảnh giữa 2D và 3D.
- [`audio.js`](../src/audio.js): Chuyên trách tổng hợp âm thanh thời gian thực (tiếng mưa, tiếng bước chân bùn, tiếng quái vật gầm rú, tiếng vung dao, tiếng nhiễu VHS) qua `AudioManager`.
- [`drivingScene3D.js`](../src/drivingScene3D.js): Chỉ phụ trách phân cảnh buồng lái xe cảnh sát tuần tra, hội thoại bộ đàm tự động và tương tác xoay đầu trong cabin.
- [`horrorWorld3D.js`](../src/horrorWorld3D.js): Phụ trách thế giới mở 3D góc nhìn thứ nhất, vật lý di chuyển/nhảy/bay lượn, kho đồ (Inventory) và khám phá Biệt Thự Huyết Quỷ.
- [`vhsPlayer.js`](../src/vhsPlayer.js): Phụ trách tái hiện đoạn băng ghi hình Found-Footage 3D kết hợp lớp phủ nhiễu sóng CRT 2D.

### 2.2. Open/Closed Principle (OCP - Nguyên lý Đóng/Mở)
Các hệ thống trong game được thiết kế để **mở rộng tính năng mới dễ dàng mà không làm biến đổi cấu trúc lõi**:
- **Hệ thống tương tác (`this.interactables`) trong `HorrorWorld3D`**:
  Được thiết kế theo cấu trúc mảng các đối tượng cấu hình `{ pos, radius, prompt, action }`. Khi cần thêm một vật phẩm mới (ví dụ: chìa khóa hầm ngầm, mảnh nhật ký), lập trình viên chỉ cần thêm một phần tử mới vào danh sách mà không phải sửa đổi hàm kiểm tra khoảng cách `checkInteractions()`.

```javascript
// Dễ dàng mở rộng các điểm tương tác mới mà không cần sửa hàm checkInteractions()
this.interactables = [
  {
    pos: new THREE.Vector3(1.2, 1.4, -10.5),
    radius: 4.5,
    prompt: "[E] Khảo sát hiện trường xe giao hàng Nexus gặp nạn",
    action: () => this.inspectNexusTruck()
  },
  // Có thể thêm vật phẩm mới tại đây...
];
```

### 2.3. Liskov Substitution & Interface Consistency (Tính Nhất Quán Giao Diện Cảnh)
Mọi lớp phân cảnh (`PixelBackground`, `DrivingScene3D`, `HorrorWorld3D`, `VHSPlayer`) đều tuân thủ một hợp đồng vòng đời (Lifecycle Contract) đồng nhất:
1. `constructor(canvas, callbacks, options)`: Nhận Canvas và khởi tạo Scene.
2. `animate()`: Vòng lặp kết xuất (`requestAnimationFrame`) tính toán theo `delta` time.
3. `destroy()`: Giải phóng toàn bộ Event Listeners, hủy DOM Overlay và dừng vòng lặp render để chống rò rỉ bộ nhớ (Memory Leak).

### 2.4. Separation of Concerns (Tách Biệt Mối Quan Tâm)
- **Tách biệt Đồ họa 3D (WebGL) và Giao diện HUD (HTML/CSS)**:
  - Thay vì vẽ chữ 2D đè lên mặt phẳng 3D gây mờ nhòe và tốn chi phí dựng hình, toàn bộ giao diện hội thoại, tâm ngắm (`#fp-crosshair`), thanh trang bị (`.fp-inventory-bar`) và thông báo tương tác đều được quản lý bằng lớp phủ DOM/CSS sắc nét nằm trên tầng `<canvas>`.
- **Tách biệt Chế độ chơi (`survival` vs `creative`)**:
  - Hàm `applyGameMode(mode)` tách biệt rõ cấu hình ánh sáng, sương mù và cơ chế vật lý (trọng lực sinh tồn so với bay lượn tự do kiểu Minecraft).

---

## 3. Các Nguyên Tắc Thực Hành Khác

### 3.1. D.R.Y (Don't Repeat Yourself - Không lặp lại mã nguồn)
- Các họa tiết bề mặt (nhựa đường, bùn đất, vỏ cây, gạch đá Gothic, kim loại thùng xe) được tạo thông qua hàm sinh nhiễu dùng chung `createNoiseTexture(w, h, baseColor, noiseColor, roughness)` trong `generateProceduralTextures()`.
- Các mô hình lặp lại nhiều lần như cây thông 5 tầng (`buildPineTree(x, y, z, scale)`), cột đèn, lan can hộ lan, cửa sổ Gothic đều được đóng gói thành hàm tạo mẫu có tham số hóa vị trí và tỉ lệ.

### 3.2. K.I.S.S (Keep It Simple, Stupid - Giữ sự đơn giản & Hiệu quả)
- Sử dụng hệ thống va chạm hộp giới hạn (AABB - Axis-Aligned Bounding Box) và hàm nội suy độ cao mặt sàn `getGroundElevation(x, z)` cho bậc thang & thềm hiên biệt thự. Giải pháp này giúp tốc độ tính toán cực nhanh, không gây giật khung hình như các thư viện vật lý nặng nề nhưng vẫn đảm bảo cảm giác leo bậc thang chân thực.

### 3.3. Quản Lý Ngữ Cảnh Canvas Sạch Sẽ (Clean Context Switching)
Một `<canvas>` trong trình duyệt không thể khởi tạo đồng thời cả ngữ cảnh `2d` và `webgl`. Do đó, nguyên lý chuyển cảnh của dự án là sử dụng hàm `resetCanvas()` để tạo mới phần tử `<canvas>` sạch trước mỗi lần chuyển giữa Menu 2D và Thế giới 3D.

---

*Bản quyền © 2026 Icey Studio And Bloodfiend Development Team ( LynnieSepearl; Zanny2006; QuytFen )*


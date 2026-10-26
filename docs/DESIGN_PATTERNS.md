# 🧩 Các Mẫu Thiết Kế Phần Mềm (Design Patterns)
**Dự án:** Bloodfiend – Huyết Quỷ (`isj-demo-horror-game-bloodfiend`)  
**Đơn vị phát triển:** Icey Studio (Founder chính: `MinhPhuc00Ne` / `Jos`) & Bloodfiend Development Team (`MinhPhuc00Ne / Jos`, `LynnieSepearl`, `Zanny2006`, `QuytFen`)

---

## 1. Giới Thiệu
Tài liệu này mô tả chi tiết các **Mẫu Thiết Kế Phần Mềm (Design Patterns)** thuộc nhóm *Creational*, *Structural*, *Behavioral* và *Game Programming Patterns* được áp dụng trực tiếp trong mã nguồn của **Bloodfiend – Huyết Quỷ**.

---

## 2. Danh Mục Các Design Patterns Đang Sử Dụng

| Nhóm Pattern | Tên Pattern | Vị trí áp dụng trong dự án | Mục đích chính |
| :--- | :--- | :--- | :--- |
| **Creational** | **Singleton** | `src/audio.js` (`audioManager`) | Đảm bảo chỉ có duy nhất một `AudioContext` và một bộ quản lý âm thanh trên toàn ứng dụng. |
| **Creational** | **Builder / Factory Method** | `src/horrorWorld3D.js`, `src/drivingScene3D.js` | Tách quá trình lắp ráp các mô hình 3D phức tạp và tự sinh họa tiết (`generateProceduralTextures`) thành từng bước rõ ràng. |
| **Structural** | **Composite (Scene Graph)** | Toàn bộ các cụm `THREE.Group` | Quản lý cấu trúc phân cấp cha - con của các thực thể 3D (máy quay, cửa biệt thự, xe tải Nexus, dao găm). |
| **Behavioral** | **State Pattern** | `HorrorWorld3D` (`survival` / `creative`), `VHSPlayer` (6 giai đoạn băng) | Thay đổi hành vi di chuyển, ánh sáng và kịch bản hoạt ảnh dựa theo trạng thái hiện tại. |
| **Behavioral** | **Command / Action Table** | `HorrorWorld3D.setupInteractions()` | Đóng gói mỗi điểm tương tác `[E]` thành một đối tượng chứa điều kiện hiển thị và hàm thực thi độc lập. |
| **Game Pattern** | **Game Loop & Time Delta** | `animate()` trong mọi lớp Scene | Duy trì vòng lặp cập nhật trạng thái và kết xuất đồ họa mượt mà theo thời gian thực. |

---

## 3. Phân Tích Chi Tiết & Ví Dụ Thực Tế

### 3.1. Singleton Pattern – Quản Lý Âm Thanh Tập Trung (`audioManager`)
Trình duyệt giới hạn số lượng `AudioContext` hoạt động cùng lúc. Do đó, lớp `AudioManager` trong [`src/audio.js`](../src/audio.js) được khởi tạo thành một thực thể đơn nhất (`export const audioManager = new AudioManager()`) và được import trực tiếp vào tất cả các phân cảnh:

```javascript
// src/audio.js
class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.masterVolume = 0.7;
  }
  // ...
}
export const audioManager = new AudioManager();
```

### 3.2. Composite Pattern – Đồ Thị Cảnh Phân Cấp (`THREE.Group`)
Mọi thực thể phức hợp trong thế giới 3D đều áp dụng **Composite Pattern** thông qua `THREE.Group`. Một nhóm cha có thể chứa nhiều bộ phận con và các nhóm khớp nối cháu:
- **Ví dụ thực tế – Máy quay Handycam (`camcorderGroup`)**:
  - `corpseGroup` (Nhóm gốc cây đại thụ & hiện trường thi thể)
    - `camcorderGroup` (Thân máy quay, ống kính, ống ngắm EVF, đèn LED đỏ)
      - `screenHinge` (Khớp bản lề xoay 85 độ)
        - `screenFrame` (Vỏ màn hình)
        - `lcdScreen` (Mặt kính hiển thị sóng tĩnh & chữ `● REC`)
        - `lcdGlow` (Đèn hắt sáng xanh lơ từ màn hình)

Nhờ Composite Pattern, khi xoay `camcorderGroup`, toàn bộ ống kính, màn hình lật và đèn LED đều di chuyển đồng bộ trong không gian 3D.

### 3.3. Builder & Factory Pattern – Tự Sinh Họa Tiết & Dựng Hình (`generateProceduralTextures`)
Thay vì tải hàng chục file ảnh nặng nề từ mạng, phương thức `generateProceduralTextures()` đóng vai trò như một **Texture Factory** sử dụng HTML5 `<canvas>` ẩn để vẽ và đóng gói thành các `THREE.CanvasTexture`:
- Tự sinh họa tiết nhựa đường, bùn đất, vỏ cây thông, đá rêu bằng thuật toán nhiễu hạt (`createNoiseTexture`).
- Tự vẽ bảng hiệu **NEXUS PHARMACEUTICAL LOGISTICS**, vách kim loại dập sóng bên trong thùng xe, cửa sổ kính màu Gothic và vân gỗ lim chạm khắc cửa lâu đài.

### 3.4. State Pattern – Chuyển Đổi Chế Độ Chơi & Kịch Bản Thời Gian VHS
1. **Trạng thái Chế độ chơi (`survival` vs `creative`)**:
   Trong `HorrorWorld3D`, phương thức `applyGameMode(mode)` và `updatePlayer(delta)` thay đổi hoàn toàn cơ chế điều khiển dựa theo trạng thái:
   - Khi `this.mode === 'survival'`: Bầu trời đêm sương mù dày đặc (`FogExp2`), bật đèn pin chiến thuật, áp dụng trọng lực rơi tự do và sát thương tâm lý.
   - Khi `this.mode === 'creative'`: Bầu trời ban ngày sáng rõ, cho phép nhấp đúp `Space` để bật/tắt trạng thái bay lượn tự do (`this.isFlying`) giống Minecraft.
2. **Trạng thái Tuyến thời gian trong `VHSPlayer`**:
   Vòng lặp `animate()` của `VHSPlayer` chia tiến trình phát băng thành 6 trạng thái nối tiếp nhau dựa trên `elapsed`:
   - `0.0s – 4.5s`: Trạng thái chạy trốn trong rừng (rung lắc camera + tiếng thở dốc).
   - `4.5s – 7.8s`: Trạng thái đứng im đảo mắt tìm kiếm xung quanh.
   - `7.8s – 9.6s`: Trạng thái quay đầu 180° phát hiện bóng đen mắt đỏ rình rập.
   - `9.6s – 9.98s`: Trạng thái **Jump-scare Blitz** (bóng đen lao vồ thần tốc trong 0.38 giây).
   - `9.98s – 13.5s`: Trạng thái máy quay rơi xuống bùn và máu bắn lên ống kính.
   - `13.5s – 18.5s`: Trạng thái nhiễu sóng từ tính và mất tín hiệu (`NO SIGNAL`).

### 3.5. Command Pattern – Hệ Thống Điểm Tương Tác (`this.interactables`)
Mỗi hành động tương tác khi nhấn phím `[E]` được đóng gói thành một đối tượng Command độc lập trong danh sách `this.interactables`:

```javascript
{
  pos: new THREE.Vector3(-2.0, 1.4, -29.2),
  radius: 3.2,
  prompt: () => this.hasKnife ? null : "[E] Rút cây dao găm sinh tồn",
  action: () => {
    this.hasKnife = true;
    audioManager.playPickup();
    this.knifeObject.visible = false;
    this.fpsKnife.visible = true;
  }
}
```
Vòng lặp `checkInteractions()` chỉ cần kiểm tra khoảng cách từ người chơi tới `item.pos` và gọi `item.action()` khi người chơi nhấn phím `[E]`, hoàn toàn tách biệt logic kiểm tra va chạm khỏi logic xử lý cốt truyện.

---

*Bản quyền © 2026 Icey Studio And Bloodfiend Development Team ( LynnieSepearl; Zanny2006; QuytFen )*


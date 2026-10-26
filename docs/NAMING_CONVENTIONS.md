# 📏 Quy Ước Đặt Tên (Naming Conventions)
**Dự án:** Bloodfiend – Huyết Quỷ (`isj-demo-horror-game-bloodfiend`)  
**Đơn vị phát triển:** Icey Studio (Founder chính: `MinhPhuc00Ne` / `Jos`) & Bloodfiend Development Team (`MinhPhuc00Ne / Jos`, `LynnieSepearl`, `Zanny2006`, `QuytFen`)

---

## 1. Mục Đích
Tài liệu này quy định bộ quy chuẩn đặt tên thống nhất cho toàn bộ mã nguồn, tài nguyên 3D/2D, âm thanh, biến trạng thái và cấu trúc thư mục trong dự án **Bloodfiend – Huyết Quỷ**. Việc tuân thủ quy ước giúp mã nguồn dễ đọc, dễ bảo trì và thuận tiện khi phối hợp giữa các thành viên trong nhóm.

---

## 2. Tổng Quan Quy Chuẩn Đặt Tên

| Thành phần | Quy chuẩn (Case Style) | Ví dụ chuẩn trong dự án | Ví dụ sai (Không dùng) |
| :--- | :--- | :--- | :--- |
| **Tên File JavaScript** | `camelCase.js` | `horrorWorld3D.js`, `drivingScene3D.js`, `vhsPlayer.js`, `pixelBackground.js` | `HorrorWorld3D.js`, `driving_scene.js` |
| **Tên File Tài liệu** | `UPPER_SNAKE_CASE.md` | `NAMING_CONVENTIONS.md`, `ARCHITECTURE_MODEL.md`, `README.md` | `namingConventions.md` |
| **Tên File Tài nguyên (Assets)** | `kebab-case.ext` | `nexus-logo.png`, `logo.png` | `NexusLogo.PNG`, `logo_nexus.png` |
| **Lớp (Classes)** | `PascalCase` | `HorrorWorld3D`, `DrivingScene3D`, `VHSPlayer`, `AudioManager`, `PixelBackground` | `horrorWorld3D`, `vhs_player` |
| **Phương thức & Hàm (Methods/Functions)** | `camelCase` (Động từ đầu) | `buildCrashedDeliveryTruck()`, `setupLighting()`, `calculateGroundY()`, `slashKnife()` | `CrashedDeliveryTruck()`, `setup_lighting()` |
| **Biến & Thuộc tính (Variables/Properties)** | `camelCase` (Danh từ) | `cameraRotation`, `verticalVelocity`, `flashlightTarget`, `smokeNodes` | `Camera_Rotation`, `vel_y` |
| **Biến Boolean (Cờ trạng thái)** | `is...`, `has...`, `can...` | `isRunning`, `isFlying`, `isGrounded`, `hasKnife`, `hasWatchedVideo`, `isMuted` | `flying`, `knifeStatus`, `videoWatched` |
| **Hằng số (Constants)** | `UPPER_SNAKE_CASE` | `MAX_PITCH_ANGLE`, `DEFAULT_MOVE_SPEED` | `maxPitchAngle` |
| **ID & Class CSS / DOM** | `kebab-case` | `#pixel-canvas`, `.fp-inventory-bar`, `.driving-dialogue-box`, `#fp-mode-pill` | `#pixelCanvas`, `.fp_inventory_bar` |

---

## 3. Quy Ước Chi Tiết Theo Từng Thành Phần

### 3.1. Lớp (Classes) & Module
- Sử dụng **PascalCase**, tên lớp phải là **danh từ** mô tả rõ thực thể hoặc phân cảnh mà lớp đó quản lý.
- Nếu lớp gắn liền với không gian kết xuất 3D, hậu tố `3D` được viết hoa:
  - `DrivingScene3D`: Phân cảnh buồng lái xe cảnh sát góc nhìn thứ nhất 3D.
  - `HorrorWorld3D`: Thế giới kinh dị góc nhìn thứ nhất 3D ngoài trời và khuôn viên biệt thự.
  - `VHSPlayer`: Trình phát băng ghi hình máy quay VHS 3D kết hợp lớp phủ CRT 2D.
  - `PixelBackground`: Cảnh nền 2D Pixel Art cho Menu chính.
  - `AudioManager`: Bộ điều phối âm thanh thủ tục (Web Audio API Synthesizer).

### 3.2. Hàm & Phương Thức (Functions & Methods)
Tên phương thức bắt buộc bắt đầu bằng một **động từ** thể hiện rõ hành động:
- **`build...`**: Khởi tạo và lắp ráp các khối Mesh 3D phức hợp vào Scene.
  - Ví dụ: `buildWorld()`, `buildPoliceCruiser()`, `buildCrashedDeliveryTruck()`, `buildCorpseTree()`, `buildMansionEntrance()`, `buildFirstPersonKnife()`.
- **`setup...`**: Thiết lập hệ thống, ánh sáng, sự kiện điều khiển hoặc tương tác.
  - Ví dụ: `setupLighting()`, `setupControls()`, `setupInteractions()`, `setupMouseLook()`.
- **`update...`**: Cập nhật trạng thái mỗi khung hình (frame) hoặc cập nhật giao diện UI.
  - Ví dụ: `updatePlayer(delta)`, `updateModeUI()`, `updateAudioUI(isPlaying)`.
- **`play...`**: Phát hiệu ứng âm thanh từ `AudioManager`.
  - Ví dụ: `playKnifeSlash()`, `playMonsterShriek()`, `playFootstepMud()`, `playVhsStaticBurst()`.
- **`get...` / `calculate...`**: Tính toán và trả về giá trị.
  - Ví dụ: `getGroundElevation(x, z)`, `generateProceduralTextures()`.

### 3.3. Biến & Thuộc Tính Three.js (3D Objects)
Để phân biệt rõ giữa hình học (`Geometry`), vật liệu (`Material`), lưới (`Mesh`), nhóm (`Group`) và ánh sáng (`Light`) trong Three.js, sử dụng hậu tố chuẩn:
- **Geometry**: Hậu tố `Geo` -> `roadGeo`, `forestGroundGeo`, `rainGeo`, `bloodGeo`.
- **Material**: Hậu tố `Mat` -> `stoneWallMat`, `nexusJacketMat`, `knifeBladeMat`, `gunMetalMat`.
- **Texture**: Hậu tố `Texture` hoặc đặt trong `this.textures` -> `nexusLogoTexture`, `gaugeTexture`, `this.textures.camcorderLcd`.
- **Group**: Hậu tố `Group` -> `corpseGroup`, `camcorderGroup`, `knifeGroup`, `pistolGroup`, `portalGroup`.
- **Light**: Hậu tố `Light` hoặc `Glow` -> `ambientLight`, `dirLight`, `domeLight`, `lcdGlow`, `sirenRed`.
- **DOM Elements**: Hậu tố `El` hoặc `Btn` -> `promptEl`, `monologueEl`, `crosshairEl`, `slotKnifeEl`, `escBtn`.

### 3.4. Quy Ước CSS & Giao Diện (DOM / UI)
Sử dụng tiền tố theo phân cảnh (Namespace Prefix) để tránh xung đột kiểu dáng giữa các màn hình:
- **`pixel-...`**: Các thành phần thuộc Menu chính 2D (`pixel-btn`, `pixel-modal`, `pixel-title`).
- **`driving-...`**: Giao diện trong phân cảnh lái xe cảnh sát (`driving-dialogue-box`, `driving-stepout-banner`, `driving-speaker-badge`).
- **`fp-...`**: Giao diện HUD góc nhìn thứ nhất 3D (`fp-crosshair`, `fp-inventory-bar`, `fp-monologue-box`, `fp-mode-pill`).
- **`vhs-...`**: Giao diện máy quay băng từ VHS (`vhs-overlay`, `vhs-rec-dot`, `vhs-sub-box`).

---

## 4. Ngôn Ngữ Trong Mã Nguồn & Chú Thích
1. **Tên định danh trong code (Identifiers)**: Viết bằng **tiếng Anh** chuẩn xác, ngắn gọn, giàu ngữ nghĩa (`hasInspectedTruck`, `flashlightTargetPos`, `crashedTruckMesh`).
2. **Chú thích (Comments) & Chuỗi hiển thị (UI Strings / Dialogues)**: Viết bằng **tiếng Việt** rõ ràng, giàu cảm xúc để phục vụ cốt truyện và giúp các thành viên nắm bắt nhanh logic từng khu vực.

---

*Bản quyền © 2026 Icey Studio And Bloodfiend Development Team ( LynnieSepearl; Zanny2006; QuytFen )*


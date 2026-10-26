# 📚 Trung Tâm Tài Liệu Kỹ Thuật – BLOODFIEND (HUYẾT QUỶ)
**Dự án:** Bloodfiend – Huyết Quỷ (`isj-demo-horror-game-bloodfiend`)  
**Đơn vị phát triển:** Icey Studio (Founder chính: `MinhPhuc00Ne` / `Jos`) & Bloodfiend Development Team (`MinhPhuc00Ne / Jos`, `LynnieSepearl`, `Zanny2006`, `QuytFen`)

![Nexus Logistics Logo](./picture/logo.png)

---

## 1. Giới Thiệu Dự Án
**Bloodfiend – Huyết Quỷ** là trò chơi kinh dị sinh tồn và điều tra góc nhìn thứ nhất trên nền tảng Web, kết hợp linh hoạt giữa phong cách **2D Retro Pixel Art** (Menu & CRT Overlay) và không gian **3D WebGL (Three.js)** chân thực.

Người chơi vào vai sĩ quan tuần tra **An** đi điều tra vụ mất tích bí ẩn của chiếc xe tải giao hàng thuộc tập đoàn dược phẩm **Nexus** trên cung đường rừng dẫn vào **Đại Biệt Thự Huyết Quỷ**.

---

## 2. Danh Mục Tài Liệu Trong Thư Mục `docs/`

| STT | Tài liệu | Mô tả nội dung |
| :---: | :--- | :--- |
| 1 | **[NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)** | Quy ước đặt tên cho File, Class, Method, Biến 3D Three.js và Hệ thống CSS/DOM. |
| 2 | **[DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md)** | Các nguyên lý thiết kế phần mềm cốt lõi: S.O.L.I.D, D.R.Y, K.I.S.S và tách biệt tầng hiển thị. |
| 3 | **[CLEAN_CODE.md](./CLEAN_CODE.md)** | Quy chuẩn viết mã sạch trong phát triển game 3D, quản lý bộ nhớ GPU và dọn dẹp sự kiện. |
| 4 | **[ARCHITECTURE_MODEL.md](./ARCHITECTURE_MODEL.md)** | Mô hình kiến trúc 4 tầng, sơ đồ luồng chuyển đổi trạng thái 2D/3D và cấu trúc thư mục. |
| 5 | **[DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md)** | Phân tích chi tiết các mẫu thiết kế: Singleton, Composite, Factory, State, Command & Game Loop. |
| 6 | **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Hướng dẫn cài đặt môi trường, quy trình Git, cách thêm mô hình 3D, điểm tương tác và âm thanh. |
| 7 | **[LICENSE.md](./LICENSE.md)** | Giấy phép mã nguồn mở MIT License (Bản gốc tiếng Anh & Bản dịch tiếng Việt). |
| 8 | **[Game Script/Bloodfiend - Huyết Quỷ.md](./Game%20Script/Bloodfiend%20-%20Huy%E1%BA%BFt%20Qu%E1%BB%B7.md)** | Kịch bản cốt truyện gốc, hồ sơ nhân vật và bối cảnh thế giới Huyết Quỷ. |

---

## 3. Tóm Tắt Kiến Trúc & Công Nghệ Sử Dụng
- **Bundler & Dev Server:** Vite `^6.2.0`
- **3D Engine:** Three.js (`^0.186.1`) với `ACESFilmicToneMapping`, `PCFSoftShadowMap` và `FogExp2`.
- **2D Rendering:** HTML5 Canvas 2D API (Menu Pixel Art & Hiệu ứng nhiễu băng từ VHS).
- **Audio Engine:** Web Audio API Procedural Synthesizer (`src/audio.js`) – Tự tổng hợp 100% âm thanh thời gian thực.

---

## 4. Đội Ngũ Sáng Lập & Bản Quyền (Founder & Copyright)
- **Đơn vị chủ quản:** **Icey Studio** — **Founder chính:** **MinhPhuc00Ne (Jos)**
- **Đội ngũ phát triển Bloodfiend:** **MinhPhuc00Ne (Jos)**, **LynnieSepearl**, **Zanny2006**, **QuytFen**

Phân phối dưới giấy phép **[Giấy Phép MIT (MIT License)](./LICENSE.md)**.  
`Bản quyền (c) 2026 Icey Studio (Founder: MinhPhuc00Ne / Jos) Và Đội Ngũ Phát Triển Bloodfiend (MinhPhuc00Ne / Jos; LynnieSepearl; Zanny2006; QuytFen)`


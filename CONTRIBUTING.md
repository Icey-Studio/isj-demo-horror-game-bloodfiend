# 🤝 Hướng Dẫn Đóng Góp Dự Án (Contributing Guide)
**Dự án:** Bloodfiend – Huyết Quỷ (`isj-demo-horror-game-bloodfiend`)  
**Đơn vị phát triển:** Icey Studio (Founder chính: `MinhPhuc00Ne` / `Jos`) & Bloodfiend Development Team (`MinhPhuc00Ne / Jos`, `LynnieSepearl`, `Zanny2006`, `QuytFen`)

---

Chào mừng bạn đến với dự án **Bloodfiend – Huyết Quỷ**! Tài liệu này hướng dẫn quy trình thiết lập môi trường, tiêu chuẩn đóng góp mã nguồn, thiết kế cảnh 3D và quy ước làm việc nhóm dành cho các thành viên phát triển.

---

## 1. Đội Ngũ Sáng Lập & Phát Triển Cốt Lõi (Founder & Core Development Team)
- **Đơn vị chủ quản:** **Icey Studio**
- **Nhà sáng lập chính (Founder Icey Studio):** **MinhPhuc00Ne (Jos)**
- **Nhóm phát triển Bloodfiend:**
  - **MinhPhuc00Ne (Jos)** — *Founder Icey Studio*
  - **LynnieSepearl** — *Thành viên phát triển*
  - **Zanny2006** — *Thành viên phát triển*
  - **QuytFen** — *Thành viên phát triển*

---

## 2. Yêu Cầu Môi Trường & Cài Đặt Nhanh

### 2.1. Công cụ cần thiết
- **Node.js**: Phiên bản `>= 18.x` (khuyến nghị `20.x LTS`)
- **Trình quản lý gói**: `npm` (đi kèm Node.js)
- **Trình duyệt hỗ trợ WebGL 2.0 & Web Audio API**: Google Chrome, Microsoft Edge, Firefox hoặc Brave.

### 2.2. Các bước chạy dự án tại máy cục bộ (Local)
```bash
# 1. Di chuyển vào thư mục dự án
cd isj-demo-horror-game-bloodfiend

# 2. Cài đặt các thư viện phụ thuộc (Three.js, Vite)
npm install

# 3. Khởi chạy máy chủ phát triển (Development Server có Hot-Reload)
npm run dev

# 4. Kiểm tra đóng gói bản dựng Production
npm run build
```

---

## 3. Quy Trình Đóng Góp (Git Workflow)

### 3.1. Quy ước đặt tên Nhánh (Branch Naming)
Khi phát triển tính năng mới hoặc sửa lỗi, hãy tạo nhánh mới từ `main` theo cấu trúc:
- `feat/<ten-tinh-nang>`: Thêm tính năng, bối cảnh 3D hoặc cơ chế mới (VD: `feat/mansion-interior-foyer`, `feat/vhs-camcorder-3d`).
- `fix/<ten-loi>`: Sửa lỗi hiển thị, va chạm hoặc âm thanh (VD: `fix/porch-player-elevation`).
- `docs/<noi-dung>`: Cập nhật tài liệu thiết kế hoặc kịch bản (VD: `docs/architecture-and-patterns`).
- `refactor/<phan-he>`: Tối ưu hóa mã nguồn và hiệu năng dựng hình.

### 3.2. Quy ước Thông điệp Commit (Conventional Commits)
Viết thông điệp commit rõ ràng bằng tiếng Việt hoặc tiếng Anh theo định dạng:
```text
<loại>: <mô tả ngắn gọn thay đổi>

Ví dụ:
feat: thiết kế thùng xe giao hàng Nexus rỗng nhìn rõ kệ hàng bên trong
fix: nâng tầm mắt người chơi chuẩn xác khi bước lên bậc thang thềm biệt thự
docs: bổ sung tài liệu kiến trúc và quy chuẩn Clean Code tiếng Việt
```

---

## 4. Liên Kết Hệ Thống Tài Liệu Kỹ Thuật
Trước khi gửi yêu cầu gộp nhánh (Pull Request), hãy tham khảo bộ tài liệu chuẩn trong thư mục `docs/`:
- [Quy Ước Đặt Tên (Naming Conventions)](./docs/NAMING_CONVENTIONS.md)
- [Nguyên Lý Thiết Kế (Design Principles)](./docs/DESIGN_PRINCIPLES.md)
- [Quy Chuẩn Mã Nguồn Sạch (Clean Code)](./docs/CLEAN_CODE.md)
- [Mô Hình Kiến Trúc (Architecture Model)](./docs/ARCHITECTURE_MODEL.md)
- [Các Mẫu Thiết Kế (Design Patterns)](./docs/DESIGN_PATTERNS.md)
- [Giấy Phép MIT (MIT License)](./LICENSE)

---

*Bản quyền © 2026 Icey Studio (Founder chính: MinhPhuc00Ne / Jos) Và Đội Ngũ Phát Triển Bloodfiend (MinhPhuc00Ne / Jos; LynnieSepearl; Zanny2006; QuytFen)*


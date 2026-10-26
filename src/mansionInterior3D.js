// ============================================================================
// MANSION INTERIOR & ARCHITECTURE 3D BUILDER (1F, 2F, B1 BASEMENT + COLLIDERS)
// Thiết kế chuẩn theo 3 bản vẽ mặt bằng (floor 1.png, floor 2.png, basement.png)
// và Kịch bản chính thức "Bloodfiend - Huyết Quỷ"
// ============================================================================
import * as THREE from 'three';
import { playerInventory } from './playerInventoryAndCharacter.js';
import { audioManager } from './audio.js';

// Tọa độ tâm Biệt Thự trong thế giới (World Space)
export const MANSION_ORIGIN = { x: 0, y: 0, z: -75 };

// Dữ liệu nội dung 5 Manh Mối Cốt Truyện (C1 - C5) & Băng Ghi Âm trong Biệt Thự
export const MANSION_CLUE_DOCUMENTS = {
  C1: {
    title: 'TÀI LIỆU MẬT C1 — HỢP ĐỒNG NGẦM TẬP ĐOÀN DƯỢC PHẨM NEXUS',
    code: 'CLUE-C1 // THƯ VIỆN TẦNG 1',
    pages: [
      {
        heading: 'BIÊN BẢN CHUYỂN GIAO MẪU VẬT SINH HỌC (MÃ SỐ: NX-H04)',
        meta: 'Ngày ký: 14/03/1996 • Bên A: Tập đoàn Dược phẩm Nexus • Bên B: Ông Bình (Chủ Biệt Thự)',
        body: `
          <p><strong>1. NỘI DUNG THỎA THUẬN:</strong> Tập đoàn Dược phẩm <strong>Nexus</strong> đồng ý cung cấp định kỳ hợp chất thử nghiệm <em>"Huyết Thanh Tái Tạo Tế Bào H-04"</em> (được chiết xuất từ loài Hoa Phục Sinh biến đổi gen) cho Ông Bình thông qua các chuyến xe tải giao hàng dược phẩm ngụy trang vào ban đêm.</p>
          <p><strong>2. CAM KẾT BẢO MẬT:</strong> Hợp chất H-04 đang trong giai đoạn thử nghiệm độc tính cao, đã bị Bộ Y Tế cấm lưu hành do gây đột biến cấu trúc máu và hủy hoại hệ thần kinh trung ương. Mọi sự cố phát sinh tại Biệt thự Rừng Cấm sẽ do Bên B hoàn toàn chịu trách nhiệm.</p>
          <p><strong>3. GHI CHÚ VIẾT TAY CỦA ÔNG BÌNH:</strong> <em>"Bọn Nexus chỉ coi con gái tôi là vật thí nghiệm miễn phí cho chúng... Nhưng tôi không còn lựa chọn nào khác. Bác sĩ nói Chi chỉ còn sống được 3 tuần nữa nếu không có H-04."</em></p>
        `,
        stamp: 'TỐI MẬT - NEXUS'
      }
    ]
  },
  C2: {
    title: 'NHẬT KÝ CÁ NHÂN CỦA ÔNG BÌNH (C2) — PHÒNG LÀM VIỆC TẦNG 2',
    code: 'CLUE-C2 // PHÒNG ÔNG BÌNH (2F)',
    pages: [
      {
        heading: 'TRÍCH ĐOẠN NHẬT KÝ: TÌNH THƯƠNG HÓA CUỒNG VỌNG',
        meta: 'Người viết: Ông Bình • Địa điểm: Phòng làm việc Tầng 2',
        body: `
          <p><strong>Ngày 12 tháng 6:</strong> Chi lại ho ra máu suốt đêm. Nhìn con bé gầy rộc đi trên chiếc giường trắng, tim tôi như bị ai bóp nghẹt. Vợ tôi đã mất vì căn bệnh quái ác này, tôi tuyệt đối không để thần chết cướp nốt đứa con gái duy nhất của mình.</p>
          <p><strong>Ngày 28 tháng 8:</strong> Liều Huyết thanh H-04 thứ 12 đã giúp Chi đứng dậy đi lại được! Nhưng ánh mắt con bé trong gương... có lúc đỏ rực lên như máu. Con bé bắt đầu sợ ánh sáng mặt trời và chỉ đòi ăn thịt sống.</p>
          <p><strong>Ngày 19 tháng 10:</strong> Tôi đã xây dựng xong Phòng Thí Nghiệm Ngầm dưới Tầng Hầm B1 (đi xuống từ Cầu Thang Phụ B bên cánh Tây). Nếu huyết thanh của Nexus cần máu tươi làm chất xúc tác... tôi sẽ tự tay điều chế nó cho con gái mình.</p>
        `,
        stamp: 'NHẬT KÝ GIA ĐÌNH'
      }
    ]
  },
  C3: {
    title: 'HỒ SƠ DỰ ÁN HUYẾT QUỶ (C3) — VĂN PHÒNG NGHIÊN CỨU HẦM B1',
    code: 'CLUE-C3 // TẦNG HẦM B1',
    pages: [
      {
        heading: 'BÁO CÁO PHÂN TÍCH ĐỘT BIẾN KÝ SINH TRÙNG MÁU H-04',
        meta: 'Phòng Thí Nghiệm Ngầm B1 • Chuyên viên ghi chép: Ông Bình',
        body: `
          <p><strong>KẾT QUẢ THÍ NGHIỆM TRÊN ĐỘNG VẬT:</strong> Hợp chất chiết xuất từ rễ <em>Hoa Phục Sinh (Resurrection Flower)</em> trồng tại Nhà Kính Tầng 1 khi kết hợp với Huyết thanh Nexus H-04 không hề chữa khỏi bệnh suy tủy. Thay vào đó, nó biến tế bào máu thành một dạng thực thể ký sinh khát máu cực độ.</p>
          <p><strong>TRIỆU CHỨNG GIAI ĐOẠN CUỐI:</strong> Vật chủ tăng trưởng chiều cao bất thường, lớp biểu bì hấp thụ ánh sáng tạo thành bóng đen đặc quánh, hai đồng tử phát sáng màu đỏ máu và sở hữu tốc độ lao vồ vượt xa giới hạn sinh học của con người.</p>
          <p><strong>CẢNH BÁO:</strong> <em>"Các mẫu thuốc giả của Nexus gửi tới trong chuyến hàng tối nay chỉ là nước cất pha chất an thần! Chúng định thủ tiêu kết quả thí nghiệm và bỏ mặc con gái tôi phát điên!"</em></p>
        `,
        stamp: 'BIOHAZARD LEVEL 4'
      }
    ]
  },
  C4: {
    title: 'BỆNH ÁN ĐIỀU TRỊ CỦA CHI (C4) — PHÒNG ĐIỀU TRỊ TẦNG 2',
    code: 'CLUE-C4 // PHÒNG ĐIỀU TRỊ (2F)',
    pages: [
      {
        heading: 'PHIẾU THEO DÕI SINH HIỆU BỆNH NHÂN: NGUYỄN LINH CHI (19 TUỔI)',
        meta: 'Khu Điều Trị Cánh Đông Tầng 2 • Tình trạng: Biến đổi hoàn toàn',
        body: `
          <p><strong>NHỊP TIM:</strong> 0 bpm (Ngừng đập tự nhiên từ ngày 02/10 — cơ thể vận hành hoàn toàn bằng tuần hoàn ký sinh H-04).</p>
          <p><strong>NHIỆT ĐỘ CƠ THỂ:</strong> 14.2°C (Lạnh như băng).</p>
          <p><strong>GHI CHÚ Y KHOA:</strong> Dây trói da trên giường bệnh đã bị xé đứt. Bệnh nhân không còn nhận thức được giọng nói của người thân khi cơn đói huyết tương bùng phát. Tuy nhiên, khi nghe tiếng hộp nhạc cũ hoặc nhìn thấy bức tranh gia đình ở Phòng Sinh Hoạt Chung, thực thể vẫn khựng lại và rơi nước mắt máu.</p>
        `,
        stamp: 'HỒ SƠ BỆNH ÁN'
      }
    ]
  },
  C5: {
    title: 'NHỮNG DÒNG CHỮ CÀO TRÊN TƯỜNG CỦA CHI (C5) — PHÒNG CÁCH LY 2F',
    code: 'CLUE-C5 // PHÒNG CÁCH LY (2F)',
    pages: [
      {
        heading: 'LỜI CẦU CỨU CUỐI CÙNG CỦA CHI TRƯỚC KHI MẤT KIỂM SOÁT',
        meta: 'Được viết bằng móng tay và máu khô trên bức tường sắt Phòng Cách Ly',
        body: `
          <p style="font-style:italic; color:#7a0912; font-size:16px; line-height:1.8;">"Ba ơi... làm ơn đừng tiêm thứ thuốc màu đỏ đó vào người con nữa...<br/>
          Trong đầu con có tiếng gào thét bắt con phải xé xác mọi thứ...<br/>
          Con đau lắm... Con không muốn biến thành quái vật ăn thịt người...<br/>
          Ba ơi, hãy để con được ngủ yên bên mẹ đi mà... Giải thoát cho con..."</p>
          <p><strong>NHẬN ĐỊNH CỦA SĨ QUAN AN:</strong> Chi không phải là một con quỷ tàn độc từ đầu — cô ấy là nạn nhân đáng thương của sự mù quáng từ người cha và tội ác dược phẩm của Tập đoàn Nexus.</p>
        `,
        stamp: 'BẰNG CHỨNG TỘI ÁC'
      }
    ]
  },
  CORE_LOG: {
    title: 'BẢN GHI ÂM CUỐI CÙNG CỦA ÔNG BÌNH — PHÒNG THÍ NGHIỆM LÕI (CORE LAB B1)',
    code: 'AUDIO-LOG // CORE LAB B1',
    pages: [
      {
        heading: 'LỜI THÚ TỘI TRƯỚC BỂ KÍNH SINH HỌC CHỨA CHI',
        meta: 'Thu âm lúc 19:45 tối 26/10 • Ngay trước khi xe tải Nexus gặp nạn',
        body: `
          <p><strong>[Tiếng thở dốc và tiếng kính vỡ vang lên trong băng]:</strong></p>
          <p><em>"Chi đã phá vỡ lồng cách ly ở Tầng 2 khi cơn đói phát tác... Hai người giao hàng của Nexus là Quý và Quyết vừa chạy trốn vào rừng sau khi thấy con bé lao ra. Tôi đã cố đưa Chi trở lại Bể Chứa Sinh Học ở tầng hầm này, nhưng chính tôi cũng đã bị thương quá nặng..."</em></p>
          <p><em>"Nếu có sĩ quan cảnh sát nào tìm thấy nơi này... Mẫu Huyết Thanh Gốc H-04 nằm trong Phòng Lạnh Bảo Quản ngay cạnh đây, còn Chìa Khóa Cổng Phụ (K5) để thoát khỏi biệt thự nằm trên bàn điều khiển. Xin hãy vạch trần Tập đoàn Nexus... và xin hãy tha thứ cho người cha tội lỗi này!"</em></p>
        `,
        stamp: 'CHỨNG CỨ QUAN TRỌNG'
      }
    ]
  }
};

export function buildMansionInterior(world, mansionGroup) {
  const ox = MANSION_ORIGIN.x;
  const oz = MANSION_ORIGIN.z;

  // Hàm tiện ích đăng ký AABB Collider theo tọa độ Local của Biệt thự -> chuyển sang World Space
  const addLocalCollider = (minX, maxX, minY, maxY, minZ, maxZ, label = 'mansion') => {
    world.addCollider(
      ox + minX,
      ox + maxX,
      minY,
      maxY,
      oz + minZ,
      oz + maxZ,
      label
    );
  };

  // Hàm tiện ích tạo bức tường có độ dày, tự động gắn vật lý chống đi xuyên
  const createWall = (x, y, z, w, h, d, mat, collide = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mansionGroup.add(mesh);
    if (collide) {
      addLocalCollider(x - w / 2, x + w / 2, y, y + h, z - d / 2, z + d / 2, 'wall');
    }
    return mesh;
  };

  // Hàm tạo tường có chừa ô cửa đi lại (Doorway Wall)
  const createWallWithDoor = (x, y, z, length, h, thickness, alongZ, doorOffset, doorWidth, doorHeight, mat, trimMat) => {
    const halfLen = length / 2;
    const dStart = doorOffset - doorWidth / 2;
    const dEnd = doorOffset + doorWidth / 2;

    // Phần tường 1: từ -halfLen đến dStart
    const len1 = dStart - (-halfLen);
    if (len1 > 0.1) {
      const c1 = -halfLen + len1 / 2;
      if (alongZ) {
        createWall(x, y, z + c1, thickness, h, len1, mat, true);
      } else {
        createWall(x + c1, y, z, len1, h, thickness, mat, true);
      }
    }

    // Phần tường 2: từ dEnd đến +halfLen
    const len2 = halfLen - dEnd;
    if (len2 > 0.1) {
      const c2 = dEnd + len2 / 2;
      if (alongZ) {
        createWall(x, y, z + c2, thickness, h, len2, mat, true);
      } else {
        createWall(x + c2, y, z, len2, h, thickness, mat, true);
      }
    }

    // Phần tường phía trên cửa (Lintel)
    const topH = h - doorHeight;
    if (topH > 0.1) {
      if (alongZ) {
        createWall(x, y + doorHeight, z + doorOffset, thickness, topH, doorWidth, mat, false);
      } else {
        createWall(x + doorOffset, y + doorHeight, z, doorWidth, topH, thickness, mat, false);
      }
    }

    // Khung gỗ bao quanh cửa + cánh cửa mở hé nghệ thuật
    if (trimMat) {
      const frame = new THREE.Group();
      const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, doorHeight, 0.42), trimMat);
      const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, doorHeight, 0.42), trimMat);
      post1.position.set(-doorWidth / 2, doorHeight / 2, 0);
      post2.position.set(doorWidth / 2, doorHeight / 2, 0);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 0.3, 0.2, 0.44), trimMat);
      lintel.position.set(0, doorHeight, 0);
      frame.add(post1, post2, lintel);

      // Cánh cửa mở hé 75 độ để người chơi đi qua thoải mái mà vẫn chân thực
      const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(doorWidth * 0.85, doorHeight - 0.1, 0.09), trimMat);
      doorLeaf.position.set(-doorWidth * 0.15, (doorHeight - 0.1) / 2, doorWidth * 0.4);
      doorLeaf.rotation.y = 1.28;
      frame.add(doorLeaf);

      if (alongZ) {
        frame.position.set(x, y, z + doorOffset);
        frame.rotation.y = Math.PI / 2;
      } else {
        frame.position.set(x + doorOffset, y, z);
      }
      mansionGroup.add(frame);
    }
  };

  // ==========================================================================
  // VẬT LIỆU KIẾN TRÚC & NỘI THẤT CỔ ĐIỂN CHÂN THỰC
  // ==========================================================================
  const extWallMat = new THREE.MeshStandardMaterial({
    map: world.textures.mansionBrick,
    roughness: 0.9,
    metalness: 0.12
  });
  const wallpaperMat = new THREE.MeshStandardMaterial({
    color: 0x3b2d28,
    roughness: 0.85
  });
  const wainscotWoodMat = new THREE.MeshStandardMaterial({
    color: 0x26150d,
    roughness: 0.65,
    metalness: 0.1
  });
  const labWallMat = new THREE.MeshStandardMaterial({
    color: 0x2a3338,
    roughness: 0.55,
    metalness: 0.35
  });
  const marbleFloorTex = createCheckeredMarbleTexture();
  const foyerFloorMat = new THREE.MeshStandardMaterial({
    map: marbleFloorTex,
    roughness: 0.35,
    metalness: 0.15
  });
  const woodFloorTex = createHardwoodFloorTexture();
  const woodFloorMat = new THREE.MeshStandardMaterial({
    map: woodFloorTex,
    roughness: 0.55,
    metalness: 0.08
  });
  const labFloorTex = createLabTileTexture();
  const basementFloorMat = new THREE.MeshStandardMaterial({
    map: labFloorTex,
    roughness: 0.45,
    metalness: 0.25
  });
  const velvetRedMat = new THREE.MeshStandardMaterial({ color: 0x5e0b12, roughness: 0.8 });
  const darkLeatherMat = new THREE.MeshStandardMaterial({ color: 0x24140e, roughness: 0.5, metalness: 0.1 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xb8923a, roughness: 0.3, metalness: 0.85 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x99a3ad, roughness: 0.28, metalness: 0.85 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.32,
    roughness: 0.1,
    metalness: 0.2
  });
  const bloodMat = new THREE.MeshStandardMaterial({ color: 0x4a0307, roughness: 0.25 });

  // ==========================================================================
  // 1. VỎ NGOÀI BIỆT THỰ RỖNG BÊN TRONG (HOLLOW EXTERIOR SHELL: X -24..24, Z -24..12)
  // ==========================================================================
  const H1 = 6.8; // Chiều cao Tầng 1 (từ 0.26 đến 7.06)
  const H2 = 6.5; // Chiều cao Tầng 2 (từ 7.06 đến 13.56)
  const HB = 6.46; // Chiều cao Tầng Hầm B1 (từ -6.20 đến 0.26)

  // Tường mặt tiền phía Nam (z = 12.0), chừa cổng chính rộng 4.4m ở giữa (x = -2.2 .. +2.2)
  createWallWithDoor(0, 0.26, 12.0, 48.0, H1 + H2, 0.45, false, 0, 4.4, 5.2, extWallMat, null);
  // Tường hậu phía Bắc (z = -24.0)
  createWall(0, 0.26, -24.0, 48.0, H1 + H2, 0.45, extWallMat, true);
  // Tường biên phía Tây (x = -24.0)
  createWall(-24.0, 0.26, -6.0, 0.45, H1 + H2, 36.0, extWallMat, true);
  // Tường biên phía Đông (x = +24.0)
  createWall(24.0, 0.26, -6.0, 0.45, H1 + H2, 36.0, extWallMat, true);

  // Tường bao Tầng Hầm B1 (y = -6.20 .. 0.26)
  createWall(0, -6.20, 12.0, 48.0, HB, 0.5, labWallMat, true);
  createWall(0, -6.20, -24.0, 48.0, HB, 0.5, labWallMat, true);
  createWall(-24.0, -6.20, -6.0, 0.5, HB, 36.0, labWallMat, true);
  createWall(24.0, -6.20, -6.0, 0.5, HB, 36.0, labWallMat, true);

  // ==========================================================================
  // 2. SÀN NHÀ & TRẦN NHÀ BA TẦNG (CHỪA LỖ CẦU THANG ĐỂ ĐI LÊN XUỐNG)
  // ==========================================================================
  // --- SÀN TẦNG 1 (y = 0.26) ---
  // Lỗ cầu thang phụ B xuống tầng hầm nằm ở x: -16.0 .. -12.0, z: -6.5 .. 2.0
  // Chia sàn Tầng 1 thành các tấm xung quanh lỗ thang B1:
  const addFloorSlab = (x1, x2, z1, z2, y, thickness, mat) => {
    const w = x2 - x1;
    const d = z2 - z1;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, thickness, d), mat);
    slab.position.set((x1 + x2) / 2, y - thickness / 2, (z1 + z2) / 2);
    slab.receiveShadow = true;
    mansionGroup.add(slab);
  };

  // Sàn Đá Hoa Cương Đại Sảnh 1F (x: -8..8, z: -24..12)
  addFloorSlab(-8, 8, -24, 12, 0.26, 0.26, foyerFloorMat);
  // Sàn Cánh Đông 1F (x: 8..24, z: -24..12)
  addFloorSlab(8, 24, -24, 12, 0.26, 0.26, woodFloorMat);
  // Sàn Cánh Tây 1F (chừa ô cầu thang hầm x: -16..-12, z: -6.5..2.0)
  addFloorSlab(-24, -16, -24, 12, 0.26, 0.26, woodFloorMat);
  addFloorSlab(-12, -8, -24, 12, 0.26, 0.26, woodFloorMat);
  addFloorSlab(-16, -12, 2.0, 12, 0.26, 0.26, woodFloorMat);
  addFloorSlab(-16, -12, -24, -6.5, 0.26, 0.26, woodFloorMat);

  // --- SÀN TẦNG 2 (y = 7.06) ---
  // Chừa thông tầng Đại Sảnh (x: -7..7, z: -3.5..10.5) để thấy cầu thang đôi và đèn chùm
  addFloorSlab(-24, -7, -24, 12, 7.06, 0.28, woodFloorMat); // Toàn bộ Cánh Tây 2F
  addFloorSlab(7, 24, -24, 12, 7.06, 0.28, woodFloorMat);   // Toàn bộ Cánh Đông 2F
  addFloorSlab(-7, 7, -24, -3.5, 7.06, 0.28, woodFloorMat); // Hành lang Bắc & Phòng Sinh Hoạt Gia Đình 2F
  addFloorSlab(-7, 7, 10.5, 12, 7.06, 0.28, woodFloorMat);  // Ban công nhỏ sát tường Nam 2F

  // --- TRẦN TẦNG 2 (y = 13.56) ---
  addFloorSlab(-24, 24, -24, 12, 13.56, 0.3, wallpaperMat);

  // --- SÀN TẦNG HẦM B1 (y = -6.20) ---
  addFloorSlab(-24, 24, -24, 12, -6.20, 0.3, basementFloorMat);

  // ==========================================================================
  // 3. HỆ THỐNG CẦU THANG 3 TẦNG (1F <-> 2F VÀ 1F <-> B1 BASEMENT)
  // ==========================================================================
  // 3A. CẦU THANG ĐÔI ĐẠI SẢNH (GRAND TWIN STAIRCASES: 1F y=0.26 -> 2F y=7.06)
  // Đi từ z = +4.5 (y = 0.26) lên phía Bắc tới z = -3.5 (y = 7.06) tại x = -6.8..-4.2 và x = +4.2..+6.8
  const buildStairFlight = (minX, maxX, startZ, endZ, startY, endY, stepsCount, mat, carpetMat) => {
    const width = maxX - minX;
    const centerX = (minX + maxX) / 2;
    const stepD = (endZ - startZ) / stepsCount;
    const stepH = (endY - startY) / stepsCount;

    for (let i = 0; i < stepsCount; i++) {
      const sy = startY + (i + 0.5) * stepH;
      const sz = startZ + (i + 0.5) * stepD;
      const stepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, stepH, Math.abs(stepD) + 0.08),
        mat
      );
      stepMesh.position.set(centerX, sy, sz);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      mansionGroup.add(stepMesh);

      if (carpetMat) {
        const runner = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.58, stepH + 0.02, Math.abs(stepD) + 0.1),
          carpetMat
        );
        runner.position.set(centerX, sy + 0.01, sz);
        mansionGroup.add(runner);
      }

      // Con tiện lan can gỗ hai bên bậc thang
      if (i % 2 === 0) {
        [-width / 2 + 0.1, width / 2 - 0.1].forEach((bx) => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.95, 6), mat);
          post.position.set(centerX + bx, sy + stepH / 2 + 0.45, sz);
          mansionGroup.add(post);
        });
      }
    }
  };

  // Cầu thang đôi lên Tầng 2
  buildStairFlight(-6.8, -4.2, 4.5, -3.5, 0.26, 7.06, 22, wainscotWoodMat, velvetRedMat);
  buildStairFlight(4.2, 6.8, 4.5, -3.5, 0.26, 7.06, 22, wainscotWoodMat, velvetRedMat);

  // Lan can bảo vệ quanh khoảng thông tầng Tầng 2 (Atrium Railing)
  createWall(-4.1, 7.06, 3.5, 0.18, 1.05, 14.0, wainscotWoodMat, true);
  createWall(4.1, 7.06, 3.5, 0.18, 1.05, 14.0, wainscotWoodMat, true);
  createWall(0, 7.06, -3.5, 8.4, 1.05, 0.18, wainscotWoodMat, false); // Phía Bắc thông tầng mở lối cho cầu thang

  // 3B. CẦU THANG PHỤ B XUỐNG TẦNG HẦM B1 (SERVICE STAIR B: 1F y=0.26 -> B1 y=-6.20)
  // Nằm tại x = -16.0 .. -12.0, đi từ z = +2.0 (y = 0.26) xuống phía Bắc z = -6.5 (y = -6.20)
  buildStairFlight(-15.8, -12.2, 2.0, -6.5, 0.26, -6.20, 22, steelMat, null);
  // Tường bao hai bên hố thang hầm B1 trên Tầng 1 để người chơi không rơi ngang xuống hố
  createWall(-16.0, 0.26, -2.25, 0.22, 1.2, 8.5, wainscotWoodMat, true);
  createWall(-12.0, 0.26, -2.25, 0.22, 1.2, 8.5, wainscotWoodMat, true);

  // ==========================================================================
  // 4. VÁCH NGĂN CÁC PHÒNG & NỘI THẤT TẦNG 1 (1F — y = 0.26)
  // ==========================================================================
  // Tường dọc ngăn cách Đại Sảnh / Trung tâm với Cánh Tây (x = -8.0) và Cánh Đông (x = +8.0)
  createWallWithDoor(-8.0, 0.26, 4.0, 16.0, H1, 0.35, true, 2.0, 2.6, 3.4, wallpaperMat, wainscotWoodMat);
  createWallWithDoor(-8.0, 0.26, -14.0, 20.0, H1, 0.35, true, 0.0, 2.6, 3.4, wallpaperMat, wainscotWoodMat);

  createWallWithDoor(8.0, 0.26, 4.0, 16.0, H1, 0.35, true, 2.0, 2.8, 3.4, wallpaperMat, wainscotWoodMat);
  createWallWithDoor(8.0, 0.26, -14.0, 20.0, H1, 0.35, true, 0.0, 2.8, 3.4, wallpaperMat, wainscotWoodMat);

  // Vách ngăn ngang ở Trung tâm 1F: Đại Sảnh -> Phòng Khách (z = -4.0) -> Nhà Nguyện (z = -15.0)
  createWallWithDoor(0, 0.26, -4.0, 16.0, H1, 0.35, false, 0, 3.8, 4.0, wallpaperMat, wainscotWoodMat);
  createWallWithDoor(0, 0.26, -15.0, 16.0, H1, 0.35, false, 0, 3.4, 3.8, wallpaperMat, wainscotWoodMat);

  // Vách ngăn ngang ở Cánh Tây 1F: Nhà Kính (Conservatory, z: 3..12) | Hành lang Thang B1 & Phòng Lưu | Thư Viện (z: -24..-7)
  createWallWithDoor(-16.0, 0.26, 3.0, 16.0, H1, 0.32, false, 4.5, 2.4, 3.2, wallpaperMat, wainscotWoodMat);
  createWallWithDoor(-16.0, 0.26, -7.0, 16.0, H1, 0.32, false, 4.5, 2.4, 3.2, wallpaperMat, wainscotWoodMat);

  // Vách ngăn ngang ở Cánh Đông 1F: Nhà Bếp (z: 2..12) | Phòng Ăn Lớn (Grand Dining Hall, z: -24..2)
  createWallWithDoor(16.0, 0.26, 2.0, 16.0, H1, 0.32, false, 0, 3.0, 3.4, wallpaperMat, wainscotWoodMat);

  // --- NỘI THẤT PHÒNG 1.1: ĐẠI SẢNH CHÍNH (GRAND FOYER) ---
  // Thảm nhung đỏ trải từ cửa chính tới chân cầu thang
  const foyerCarpet = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.03, 14.5), velvetRedMat);
  foyerCarpet.position.set(0, 0.28, 4.2);
  mansionGroup.add(foyerCarpet);

  // Đèn chùm pha lê lớn treo giữa thông tầng Đại Sảnh
  const chandelier = new THREE.Group();
  chandelier.position.set(0, 9.2, 3.5);
  const chanChain = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 8), brassMat);
  chanChain.position.y = 2.1;
  const chanRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 10, 24), brassMat);
  chanRing1.rotation.x = Math.PI / 2;
  const chanRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 10, 20), brassMat);
  chanRing2.rotation.x = Math.PI / 2;
  chanRing2.position.y = 0.55;
  chandelier.add(chanChain, chanRing1, chanRing2);
  const candleBulbMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
  for (let c = 0; c < 12; c++) {
    const ang = (c / 12) * Math.PI * 2;
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.32, 6), candleBulbMat);
    candle.position.set(Math.cos(ang) * 1.6, 0.2, Math.sin(ang) * 1.6);
    chandelier.add(candle);
  }
  const foyerLight = new THREE.PointLight(0xffaa55, 8.5, 28);
  foyerLight.position.set(0, -0.3, 0);
  chandelier.add(foyerLight);
  mansionGroup.add(chandelier);

  // Bàn tròn trung tâm Đại Sảnh có bình hoa cổ
  createRoundTableWithVase(mansionGroup, addLocalCollider, 0, 0.26, 4.8, wainscotWoodMat, brassMat);

  // Thi thể nhân viên giao hàng Quý nằm gục trên vũng máu gần lối rẽ Cánh Tây Đại Sảnh
  const victimGroup = new THREE.Group();
  victimGroup.position.set(-5.2, 0.28, 7.2);
  const bloodPool = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.02, 18), bloodMat);
  const bodyTorso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 1.05), new THREE.MeshStandardMaterial({ color: 0x163860, roughness: 0.8 }));
  bodyTorso.position.set(0, 0.16, 0);
  bodyTorso.rotation.y = 0.4;
  const bodyHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0xc89d7c }));
  bodyHead.position.set(0.25, 0.18, -0.58);
  victimGroup.add(bloodPool, bodyTorso, bodyHead);
  mansionGroup.add(victimGroup);

  world.interactables.push({
    mesh: bodyTorso,
    label: '[E] Khám nghiệm thi thể nhân viên giao hàng Quý (Nexus Logistics)',
    distance: 4.5,
    onInteract: () => {
      audioManager.playPageTurn();
      world.showNotification('🔍 Thi thể nhân viên Quý: Trên ngực áo có thẻ Nexus Logistics và vết móng vuốt xé rách. Tay anh ta chỉ về phía Cánh Tây (Thư viện & Cầu thang hầm B1).');
    }
  });

  // --- NỘI THẤT PHÒNG 1.2: PHÒNG KHÁCH TRUNG TÂM (SITTING ROOM, x: -7..7, z: -15..-4) ---
  // Lò sưởi đá cổ kính rực lửa ở bức tường phía Đông (x = 7.2, z = -9.5)
  buildFireplace(mansionGroup, addLocalCollider, 7.1, 0.26, -9.5, -Math.PI / 2, extWallMat, brassMat);
  // Bộ ghế Sofa da Chesterfield + Bàn trà giữa phòng khách
  buildSofaSet(mansionGroup, addLocalCollider, 0, 0.26, -9.5, darkLeatherMat, wainscotWoodMat, velvetRedMat);

  // --- NỘI THẤT PHÒNG 1.3: NHÀ NGUYỆN GIA TỘC (CHAPEL, x: -7..7, z: -24..-15) ---
  buildChapelInterior(mansionGroup, addLocalCollider, 0, 0.26, -19.5, wainscotWoodMat, velvetRedMat, brassMat);

  // --- NỘI THẤT PHÒNG 1.4: NHÀ KÍNH THỰC VẬT (CONSERVATORY, x: -24..-8, z: 3..12) ---
  buildConservatoryRoom(mansionGroup, addLocalCollider, world, -16.0, 0.26, 7.5, wainscotWoodMat, glassMat);

  // --- NỘI THẤT PHÒNG 1.5: THƯ VIỆN CỔ & PHÒNG LƯU (LIBRARY & STUDY, x: -24..-8, z: -24..-7) ---
  buildLibraryRoom(mansionGroup, addLocalCollider, world, -16.0, 0.26, -15.5, wainscotWoodMat, darkLeatherMat, brassMat);

  // --- NỘI THẤT PHÒNG 1.6: NHÀ BẾP & KHO (KITCHEN, x: 8..24, z: 2..12) ---
  buildKitchenRoom(mansionGroup, addLocalCollider, 16.0, 0.26, 7.0, steelMat, wainscotWoodMat, bloodMat);

  // --- NỘI THẤT PHÒNG 1.7: PHÒNG ĂN ĐẠI TIỆC (GRAND DINING HALL, x: 8..24, z: -24..2) ---
  buildGrandDiningHall(mansionGroup, addLocalCollider, 16.0, 0.26, -11.0, wainscotWoodMat, velvetRedMat, brassMat, steelMat);

  // ==========================================================================
  // 5. VÁCH NGĂN CÁC PHÒNG & NỘI THẤT TẦNG 2 (2F — y = 7.06)
  // ==========================================================================
  // Tường dọc hai bên hành lang trung tâm Tầng 2 (x = -7.0 và x = +7.0)
  createWallWithDoor(-7.0, 7.06, -6.0, 36.0, H2, 0.32, true, 6.0, 2.4, 3.2, wallpaperMat, wainscotWoodMat);
  createWallWithDoor(7.0, 7.06, -6.0, 36.0, H2, 0.32, true, 6.0, 2.4, 3.2, wallpaperMat, wainscotWoodMat);

  // Cánh Tây Tầng 2: Phòng Làm Việc Ông Bình (z: 0..12) | Phòng Ngủ Chính Master Bedroom (z: -24..0)
  createWallWithDoor(-15.5, 7.06, 0.0, 17.0, H2, 0.32, false, 4.5, 2.4, 3.2, wallpaperMat, wainscotWoodMat);

  // Cánh Đông Tầng 2: Phòng Ngủ Của Chi (z: 2..12) | Phòng Điều Trị (z: -11..2) | Phòng Cách Ly (z: -24..-11)
  createWallWithDoor(15.5, 7.06, 2.0, 17.0, H2, 0.32, false, -4.5, 2.4, 3.2, wallpaperMat, wainscotWoodMat);
  createWallWithDoor(15.5, 7.06, -11.0, 17.0, H2, 0.32, false, -4.5, 2.4, 3.2, wallpaperMat, wainscotWoodMat);

  // --- NỘI THẤT PHÒNG 2.1: PHÒNG SINH HOẠT GIA ĐÌNH & BỨC TRANH CỦA CHI (x: -7..7, z: -24..-4) ---
  buildFamilyLounge2F(mansionGroup, addLocalCollider, world, 0, 7.06, -14.0, wainscotWoodMat, velvetRedMat, brassMat);

  // --- NỘI THẤT PHÒNG 2.2: PHÒNG LÀM VIỆC CỦA ÔNG BÌNH (BÌNH'S STUDY, x: -24..-7, z: 0..12) ---
  buildBinhStudy2F(mansionGroup, addLocalCollider, world, -15.5, 7.06, 6.0, wainscotWoodMat, darkLeatherMat, brassMat);

  // --- NỘI THẤT PHÒNG 2.3: PHÒNG NGỦ CHÍNH (MASTER BEDROOM, x: -24..-7, z: -24..0) ---
  buildMasterBedroom2F(mansionGroup, addLocalCollider, -15.5, 7.06, -12.0, wainscotWoodMat, velvetRedMat, brassMat);

  // --- NỘI THẤT PHÒNG 2.4: PHÒNG NGỦ CỦA CHI (CHI'S BEDROOM, x: 7..24, z: 2..12) ---
  buildChiBedroom2F(mansionGroup, addLocalCollider, 15.5, 7.06, 7.0, wainscotWoodMat, brassMat);

  // --- NỘI THẤT PHÒNG 2.5: PHÒNG ĐIỀU TRỊ Y TẾ (TREATMENT ROOM, x: 7..24, z: -11..2) ---
  buildTreatmentRoom2F(mansionGroup, addLocalCollider, world, 15.5, 7.06, -4.5, steelMat, bloodMat);

  // --- NỘI THẤT PHÒNG 2.6: PHÒNG CÁCH LY KIÊN CỐ CỦA CHI (ISOLATION ROOM, x: 7..24, z: -24..-11) ---
  buildIsolationRoom2F(mansionGroup, addLocalCollider, world, 15.5, 7.06, -17.5, steelMat, bloodMat);

  // ==========================================================================
  // 6. VÁCH NGĂN & NỘI THẤT TẦNG HẦM BÍ MẬT (B1 BASEMENT — y = -6.20)
  // ==========================================================================
  // Tường ngăn Cánh Tây Hầm (Hầm Rượu & Văn Phòng Nghiên Cứu) với Phòng Thí Nghiệm Chính (x = -7.0)
  createWallWithDoor(-7.0, -6.20, -6.0, 36.0, HB, 0.35, true, -2.0, 2.8, 3.4, labWallMat, steelMat);
  // Tường ngăn Phòng Thí Nghiệm Chính với Phòng Thí Nghiệm Lõi (Core Lab, x = +7.0)
  createWallWithDoor(7.0, -6.20, -6.0, 36.0, HB, 0.35, true, -2.0, 3.2, 3.6, labWallMat, steelMat);

  // --- NỘI THẤT HẦM B1.1: HẦM RƯỢU CŨ & VĂN PHÒNG NGHIÊN CỨU (x: -24..-7, z: -24..12) ---
  buildBasementWestWing(mansionGroup, addLocalCollider, world, -16.5, -6.20, -6.0, wainscotWoodMat, steelMat);

  // --- NỘI THẤT HẦM B1.2: PHÒNG THÍ NGHIỆM CHÍNH & PHÒNG LẠNH MẪU H-04 (x: -7..7, z: -24..12) ---
  buildBasementMainLab(mansionGroup, addLocalCollider, world, 0, -6.20, -6.0, steelMat, glassMat, bloodMat);

  // --- NỘI THẤT HẦM B1.3: PHÒNG THÍ NGHIỆM LÕI & BỂ CHỨA SINH HỌC CỦA CHI (CORE LAB, x: 7..24, z: -24..12) ---
  buildBasementCoreLab(mansionGroup, addLocalCollider, world, 15.5, -6.20, -6.0, steelMat, glassMat, brassMat);

  // Biển chỉ dẫn phát sáng tại Cầu thang chính & Cầu thang phụ B
  createFloatingSign(mansionGroup, 0, 3.8, -2.8, '▲ CẦU THANG ĐÔI LÊN TẦNG 2 (2F)');
  createFloatingSign(mansionGroup, -14.0, 3.2, 2.2, '▼ CẦU THANG PHỤ B XUỐNG HẦM THÍ NGHIỆM (B1)');
}

// ============================================================================
// CÁC HÀM Dựng NỘI THẤT CHI TIẾT TỪNG PHÒNG (FURNITURE & CLUE BUILDERS)
// ============================================================================

function createDocumentProp(mansionGroup, world, x, y, z, clueKey, labelText) {
  const docGroup = new THREE.Group();
  docGroup.position.set(x, y, z);

  // Bìa hồ sơ / cuốn sổ nằm trên bàn
  const folder = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.04, 0.62),
    new THREE.MeshStandardMaterial({ color: 0xc8a26e, roughness: 0.7 })
  );
  const page = new THREE.Mesh(
    new THREE.PlaneGeometry(0.38, 0.52),
    new THREE.MeshBasicMaterial({ color: 0xfff8e7 })
  );
  page.rotation.x = -Math.PI / 2;
  page.position.y = 0.025;

  // Vòng sáng vàng chỉ điểm manh mối quan trọng
  const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.36, 20),
    new THREE.MeshBasicMaterial({ color: 0xffcc44, side: THREE.DoubleSide })
  );
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = 0.03;

  const pointLight = new THREE.PointLight(0xffbb44, 2.2, 5.5);
  pointLight.position.set(0, 0.45, 0);

  docGroup.add(folder, page, glowRing, pointLight);
  mansionGroup.add(docGroup);

  const clueData = MANSION_CLUE_DOCUMENTS[clueKey];
  world.interactables.push({
    mesh: folder,
    label: labelText,
    distance: 4.2,
    onInteract: () => {
      audioManager.playPageTurn();
      playerInventory.openCaseFileModal(clueData);
      // Tự động lưu vào túi đồ nếu chưa có
      const itemId = `clue_${clueKey.toLowerCase()}`;
      if (!playerInventory.hasItem(itemId)) {
        playerInventory.addItem({
          id: itemId,
          name: clueData.title,
          type: 'document',
          count: 1,
          description: `Tài liệu manh mối thu thập tại Biệt thự (${clueData.code}). Nhấp chuột trái hoặc bấm [E] để đọc lại.`,
          documentData: clueData
        });
      }
    }
  });
}

function createRoundTableWithVase(group, addCol, x, y, z, woodMat, brassMat) {
  const tGroup = new THREE.Group();
  tGroup.position.set(x, y, z);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.12, 20), woodMat);
  top.position.y = 0.85;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 0.85, 12), woodMat);
  pillar.position.y = 0.42;
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.55, 12), brassMat);
  vase.position.y = 1.18;
  tGroup.add(top, pillar, vase);
  group.add(tGroup);
  addCol(x - 1.3, x + 1.3, y, y + 1.2, z - 1.3, z + 1.3, 'table');
}

function buildFireplace(group, addCol, x, y, z, rotY, stoneMat, brassMat) {
  const fp = new THREE.Group();
  fp.position.set(x, y, z);
  fp.rotation.y = rotY;

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.4, 0.9), stoneMat);
  body.position.y = 1.2;
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.2, 0.7), stoneMat);
  chimney.position.y = 4.5;
  const hearth = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.65), new THREE.MeshBasicMaterial({ color: 0x110502 }));
  hearth.position.set(0, 0.65, 0.16);
  const fireGlow = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff5511 }));
  fireGlow.position.set(0, 0.38, 0.25);
  const fireLight = new THREE.PointLight(0xff6622, 6.5, 16);
  fireLight.position.set(0, 0.8, 0.8);

  fp.add(body, chimney, hearth, fireGlow, fireLight);
  group.add(fp);
  addCol(x - 0.9, x + 0.9, y, y + 3.0, z - 1.4, z + 1.4, 'fireplace');
}

function buildSofaSet(group, addCol, x, y, z, leatherMat, woodMat, rugMat) {
  const sGroup = new THREE.Group();
  sGroup.position.set(x, y, z);

  // Thảm Ba Tư lớn
  const rug = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.03, 6.4), rugMat);
  rug.position.y = 0.02;
  sGroup.add(rug);

  // Bàn trà gỗ ở giữa
  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.52, 1.2), woodMat);
  coffeeTable.position.y = 0.26;
  sGroup.add(coffeeTable);
  addCol(x - 1.1, x + 1.1, y, y + 0.6, z - 0.6, z + 0.6, 'coffee_table');

  // Hai ghế Sofa lớn đối diện nhau
  [-2.3, 2.3].forEach((sz) => {
    const sofa = new THREE.Group();
    sofa.position.set(0, 0, sz);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.48, 1.05), leatherMat);
    seat.position.y = 0.24;
    const back = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.95, 0.28), leatherMat);
    back.position.set(0, 0.52, sz < 0 ? -0.4 : 0.4);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 1.05), leatherMat);
    armL.position.set(-1.5, 0.36, 0);
    const armR = armL.clone();
    armR.position.x = 1.5;
    sofa.add(seat, back, armL, armR);
    sGroup.add(sofa);
    addCol(x - 1.6, x + 1.6, y, y + 1.0, z + sz - 0.55, z + sz + 0.55, 'sofa');
  });

  group.add(sGroup);
}

function buildChapelInterior(group, addCol, x, y, z, woodMat, velvetMat, brassMat) {
  const cGroup = new THREE.Group();
  cGroup.position.set(x, y, z);

  // Bàn thờ Nhà Nguyện (Altar)
  const altar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.15, 1.2), woodMat);
  altar.position.set(0, 0.58, -3.2);
  const altarCloth = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.9, 1.24), velvetMat);
  altarCloth.position.set(0, 0.68, -3.2);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.8, 0.14), brassMat);
  crossV.position.set(0, 2.1, -3.5);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.14), brassMat);
  crossH.position.set(0, 2.4, -3.5);
  const chapelLight = new THREE.PointLight(0xffaa44, 5.5, 16);
  chapelLight.position.set(0, 2.8, -2.2);
  cGroup.add(altar, altarCloth, crossV, crossH, chapelLight);
  addCol(x - 1.8, x + 1.8, y, y + 1.5, z - 3.8, z - 2.6, 'altar');

  // 4 hàng ghế gỗ cầu nguyện (Chapel Pews) hai bên lối đi
  for (let row = 0; row < 2; row++) {
    [-2.4, 2.4].forEach((px) => {
      const pew = new THREE.Group();
      const rz = 0.2 + row * 2.1;
      pew.position.set(px, 0, rz);
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.48, 0.65), woodMat);
      bench.position.y = 0.24;
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.95, 0.14), woodMat);
      back.position.set(0, 0.48, 0.28);
      pew.add(bench, back);
      cGroup.add(pew);
      addCol(x + px - 1.3, x + px + 1.3, y, y + 1.0, z + rz - 0.35, z + rz + 0.35, 'pew');
    });
  }

  group.add(cGroup);
}

function buildConservatoryRoom(group, addCol, world, x, y, z, woodMat, glassMat) {
  const gGroup = new THREE.Group();
  gGroup.position.set(x, y, z);

  // Ánh sáng sinh học xanh trắng ma mị của Nhà Kính Hoa Phục Sinh
  const bioLight = new THREE.PointLight(0x66ffcc, 6.0, 18);
  bioLight.position.set(0, 3.2, 0);
  gGroup.add(bioLight);

  // 2 Bồn trồng Hoa Phục Sinh (Resurrection Flowers) phát sáng
  const flowerMat = new THREE.MeshBasicMaterial({ color: 0xd8fff4 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x1b4d2e, roughness: 0.8 });

  [-3.2, 3.2].forEach((bx) => {
    const planter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 5.2), woodMat);
    planter.position.set(bx, 0.38, 0);
    gGroup.add(planter);
    addCol(x + bx - 1.1, x + bx + 1.1, y, y + 0.9, z - 2.6, z + 2.6, 'planter');

    for (let f = 0; f < 10; f++) {
      const fx = bx + (Math.random() - 0.5) * 1.4;
      const fz = (Math.random() - 0.5) * 4.2;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.65, 6), stemMat);
      stem.position.set(fx, 1.05, fz);
      const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), flowerMat);
      blossom.scale.set(1.2, 0.7, 1.2);
      blossom.position.set(fx, 1.4, fz);
      gGroup.add(stem, blossom);
    }
  });

  group.add(gGroup);

  world.interactables.push({
    mesh: gGroup.children[1],
    label: '[E] Quan sát Vườn Hoa Phục Sinh biến đổi gen (Nhà Kính Tầng 1)',
    distance: 4.5,
    onInteract: () => {
      audioManager.playPageTurn();
      world.showNotification('🌺 Hoa Phục Sinh (Resurrection Flower): Loài hoa trắng phát sáng trong bóng tối, rễ của chúng tiết ra dịch đỏ tươi như máu — nguyên liệu thô của Huyết thanh H-04.');
    }
  });
}

function buildLibraryRoom(group, addCol, world, x, y, z, woodMat, leatherMat, brassMat) {
  const lGroup = new THREE.Group();
  lGroup.position.set(x, y, z);

  const libLight = new THREE.PointLight(0xffaa55, 6.5, 20);
  libLight.position.set(0, 4.2, 0);
  lGroup.add(libLight);

  // 4 Dãy kệ sách gỗ sồi cao kịch trần
  const bookColors = [0x6b1d1d, 0x1d3b5c, 0x244728, 0x5c431d];
  [-6.8, 6.8].forEach((sx) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.9, 5.2, 12.0), woodMat);
    shelf.position.set(sx, 2.6, 0);
    lGroup.add(shelf);
    addCol(x + sx - 0.5, x + sx + 0.5, y, y + 5.2, z - 6.0, z + 6.0, 'bookshelf');

    // Các hàng sách màu cổ điển trên kệ
    for (let row = 0; row < 5; row++) {
      const bookRow = new THREE.Mesh(
        new THREE.BoxGeometry(0.96, 0.42, 11.2),
        new THREE.MeshStandardMaterial({ color: bookColors[row % bookColors.length], roughness: 0.75 })
      );
      bookRow.position.set(sx, 0.8 + row * 0.95, 0);
      lGroup.add(bookRow);
    }
  });

  // Bàn đọc sách lớn ở trung tâm Thư Viện
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.85, 1.8), woodMat);
  desk.position.set(0, 0.42, 0);
  const bankerLamp = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.25, 12), new THREE.MeshBasicMaterial({ color: 0x22cc66 }));
  bankerLamp.position.set(-1.1, 1.15, -0.4);
  lGroup.add(desk, bankerLamp);
  addCol(x - 1.7, x + 1.7, y, y + 0.95, z - 0.9, z + 0.9, 'library_desk');

  group.add(lGroup);

  // Đặt Manh Mối C1 trên bàn Thư Viện
  createDocumentProp(
    group,
    world,
    x,
    y + 0.86,
    z,
    'C1',
    '[E] Đọc Tài Liệu Mật C1: Hợp Đồng Ngầm Tập Đoàn Dược Phẩm Nexus'
  );
}

function buildKitchenRoom(group, addCol, x, y, z, steelMat, woodMat, bloodMat) {
  const kGroup = new THREE.Group();
  kGroup.position.set(x, y, z);

  const kLight = new THREE.PointLight(0xddeeff, 5.0, 16);
  kLight.position.set(0, 4.0, 0);
  kGroup.add(kLight);

  // Bàn sơ chế inox ở giữa bếp có vết máu tươi
  const island = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 1.6), steelMat);
  island.position.set(0, 0.45, 0);
  const bloodStain = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.02, 14), bloodMat);
  bloodStain.position.set(0.4, 0.91, 0.1);
  kGroup.add(island, bloodStain);
  addCol(x - 2.1, x + 2.1, y, y + 0.95, z - 0.8, z + 0.8, 'kitchen_island');

  // Kệ tủ bếp sát tường Đông
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 7.5), woodMat);
  counter.position.set(6.8, 0.48, 0);
  kGroup.add(counter);
  addCol(x + 6.2, x + 7.4, y, y + 1.0, z - 3.8, z + 3.8, 'kitchen_counter');

  group.add(kGroup);
}

function buildGrandDiningHall(group, addCol, x, y, z, woodMat, velvetMat, brassMat, steelMat) {
  const dGroup = new THREE.Group();
  dGroup.position.set(x, y, z);

  const dLight = new THREE.PointLight(0xff9944, 7.0, 24);
  dLight.position.set(0, 4.8, 0);
  dGroup.add(dLight);

  // Bàn tiệc đại sảnh dài 10m
  const banquetTable = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.85, 10.5), woodMat);
  banquetTable.position.set(0, 0.42, 0);
  const tableRunner = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.87, 10.2), velvetMat);
  tableRunner.position.set(0, 0.43, 0);
  dGroup.add(banquetTable, tableRunner);
  addCol(x - 1.35, x + 1.35, y, y + 0.95, z - 5.3, z + 5.3, 'banquet_table');

  // Chân nến bạc trên bàn tiệc
  [-3.2, 0, 3.2].forEach((cz) => {
    const candelabra = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 0.65, 10), brassMat);
    candelabra.position.set(0, 1.15, cz);
    dGroup.add(candelabra);
  });

  // 10 Ghế tựa lưng cao hai bên bàn tiệc
  for (let i = -2; i <= 2; i++) {
    [-1.85, 1.85].forEach((cx) => {
      const chair = new THREE.Group();
      chair.position.set(cx, 0, i * 2.0);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.48, 0.65), woodMat);
      seat.position.y = 0.24;
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.15, 0.62), velvetMat);
      back.position.set(cx < 0 ? -0.28 : 0.28, 0.58, 0);
      chair.add(seat, back);
      dGroup.add(chair);
    });
  }

  group.add(dGroup);
}

function buildFamilyLounge2F(group, addCol, world, x, y, z, woodMat, velvetMat, brassMat) {
  const fGroup = new THREE.Group();
  fGroup.position.set(x, y, z);

  const lLight = new THREE.PointLight(0xffbb66, 6.0, 18);
  lLight.position.set(0, 4.2, 0);
  fGroup.add(lLight);

  // Đàn Dương Cầm Cổ (Grand Piano)
  const piano = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 2.6), woodMat);
  piano.position.set(-3.2, 0.48, 0);
  fGroup.add(piano);
  addCol(x - 4.3, x - 2.1, y, y + 1.1, z - 1.3, z + 1.3, 'piano');

  // BỨC TRANH SƠN DẦU GIA ĐÌNH HẠNH PHÚC (Trên tường Bắc z = -9.6 của phòng)
  const frame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 0.16), brassMat);
  frame.position.set(0, 2.6, -9.6);
  const paintTex = createFamilyPaintingTexture();
  const canvasMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 2.4),
    new THREE.MeshBasicMaterial({ map: paintTex })
  );
  canvasMesh.position.set(0, 2.6, -9.5);
  fGroup.add(frame, canvasMesh);

  group.add(fGroup);

  world.interactables.push({
    mesh: frame,
    label: '[E] Ngắm bức tranh sơn dầu "Gia Đình Ông Bình & Chi Dưới Nắng Ấm"',
    distance: 5.0,
    onInteract: () => {
      audioManager.playPageTurn();
      world.showNotification('🖼️ Bức tranh vẽ Chi mặc váy trắng mỉm cười rạng rỡ bên cha mẹ dưới vườn hoa đầy nắng. Phía dưới khung tranh khắc dòng chữ: "Con gái yêu dấu Linh Chi — Ánh sáng duy nhất của ba mẹ".');
    }
  });
}

function buildBinhStudy2F(group, addCol, world, x, y, z, woodMat, leatherMat, brassMat) {
  const bGroup = new THREE.Group();
  bGroup.position.set(x, y, z);

  const sLight = new THREE.PointLight(0xffaa44, 5.5, 16);
  sLight.position.set(0, 3.8, 0);
  bGroup.add(sLight);

  // Bàn làm việc của Ông Bình
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.85, 1.5), woodMat);
  desk.position.set(0, 0.42, 0);
  const chair = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.25, 0.85), leatherMat);
  chair.position.set(0, 0.62, -1.2);
  bGroup.add(desk, chair);
  addCol(x - 1.5, x + 1.5, y, y + 0.95, z - 0.8, z + 0.8, 'binh_desk');

  group.add(bGroup);

  // Manh Mối C2: Nhật Ký Cá Nhân Của Ông Bình
  createDocumentProp(
    group,
    world,
    x,
    y + 0.86,
    z,
    'C2',
    '[E] Đọc Nhật Ký Của Ông Bình (C2): Bi Kịch Gia Đình & Phòng Hầm B1'
  );
}

function buildMasterBedroom2F(group, addCol, x, y, z, woodMat, velvetMat, brassMat) {
  const mGroup = new THREE.Group();
  mGroup.position.set(x, y, z);

  const mLight = new THREE.PointLight(0xff9955, 5.0, 18);
  mLight.position.set(0, 4.0, 0);
  mGroup.add(mLight);

  // Giường 4 cọc hoàng gia (Four-Poster Canopy Bed)
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.68, 3.8), velvetMat);
  mattress.position.set(-2.5, 0.34, 0);
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.4, 3.8), woodMat);
  headboard.position.set(-4.0, 1.2, 0);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 4.0), velvetMat);
  canopy.position.set(-2.5, 3.2, 0);
  mGroup.add(mattress, headboard, canopy);

  [[-4.0, -1.8], [-4.0, 1.8], [-1.0, -1.8], [-1.0, 1.8]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8), woodMat);
    post.position.set(px, 1.6, pz);
    mGroup.add(post);
  });
  addCol(x - 4.2, x - 0.8, y, y + 2.5, z - 1.9, z + 1.9, 'master_bed');

  // Tủ quần áo cổ lớn
  const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 1.1), woodMat);
  wardrobe.position.set(2.5, 1.6, -6.5);
  mGroup.add(wardrobe);
  addCol(x + 1.3, x + 3.7, y, y + 3.2, z - 7.1, z - 5.9, 'wardrobe');

  group.add(mGroup);
}

function buildChiBedroom2F(group, addCol, x, y, z, woodMat, brassMat) {
  const cGroup = new THREE.Group();
  cGroup.position.set(x, y, z);

  const cLight = new THREE.PointLight(0xffccaa, 5.0, 15);
  cLight.position.set(0, 3.8, 0);
  cGroup.add(cLight);

  // Giường trắng của Chi
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xeee8e0, roughness: 0.7 });
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.62, 3.0), whiteMat);
  bed.position.set(2.8, 0.31, 0);
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.78, 1.2), woodMat);
  table.position.set(-2.2, 0.39, 1.5);
  const musicBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.28), brassMat);
  musicBox.position.set(-2.2, 0.9, 1.5);
  cGroup.add(bed, table, musicBox);
  addCol(x + 1.6, x + 4.0, y, y + 0.9, z - 1.5, z + 1.5, 'chi_bed');

  group.add(cGroup);
}

function buildTreatmentRoom2F(group, addCol, world, x, y, z, steelMat, bloodMat) {
  const tGroup = new THREE.Group();
  tGroup.position.set(x, y, z);

  const medLight = new THREE.PointLight(0xaaddff, 5.5, 16);
  medLight.position.set(0, 3.8, 0);
  tGroup.add(medLight);

  // Giường bệnh y tế dính máu và giá treo truyền dịch IV
  const medBed = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 2.8), steelMat);
  medBed.position.set(0, 0.38, 0);
  const bloodSheet = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 1.6), bloodMat);
  bloodSheet.position.set(0, 0.77, -0.2);
  const ivPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.1, 8), steelMat);
  ivPole.position.set(1.1, 1.05, -1.1);
  const sideTable = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.82, 0.85), steelMat);
  sideTable.position.set(2.4, 0.41, 0);
  tGroup.add(medBed, bloodSheet, ivPole, sideTable);
  addCol(x - 0.75, x + 0.75, y, y + 0.9, z - 1.4, z + 1.4, 'med_bed');
  addCol(x + 1.8, x + 3.0, y, y + 0.9, z - 0.45, z + 0.45, 'med_table');

  group.add(tGroup);

  // Manh Mối C4: Bệnh Án Điều Trị Của Chi
  createDocumentProp(
    group,
    world,
    x + 2.4,
    y + 0.84,
    z,
    'C4',
    '[E] Đọc Hồ Sơ Bệnh Án Của Chi (C4) — Phòng Điều Trị Tầng 2'
  );
}

function buildIsolationRoom2F(group, addCol, world, x, y, z, steelMat, bloodMat) {
  const iGroup = new THREE.Group();
  iGroup.position.set(x, y, z);

  const redLight = new THREE.PointLight(0xff2222, 6.0, 16);
  redLight.position.set(0, 3.8, 0);
  iGroup.add(redLight);

  // Song sắt nhà giam cách ly bị bẻ cong ở giữa phòng
  for (let b = -6; b <= 6; b++) {
    if (b === 0 || b === 1) continue; // Khe song sắt bị Chi xé toạc thoát ra
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5.8, 8), steelMat);
    bar.position.set(b * 0.65, 2.9, 1.8);
    iGroup.add(bar);
  }

  // Bàn sắt ghi chú bên ngoài lồng cách ly
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.82, 0.9), steelMat);
  desk.position.set(-2.5, 0.41, 3.2);
  iGroup.add(desk);

  group.add(iGroup);

  // Manh Mối C5: Những dòng chữ tuyệt vọng của Chi cào trên tường
  createDocumentProp(
    group,
    world,
    x - 2.5,
    y + 0.84,
    z + 3.2,
    'C5',
    '[E] Đọc Những Dòng Chữ Tuyệt Vọng Của Chi Trên Tường (C5)'
  );
}

function buildBasementWestWing(group, addCol, world, x, y, z, woodMat, steelMat) {
  const wGroup = new THREE.Group();
  wGroup.position.set(x, y, z);

  const bLight = new THREE.PointLight(0xffaa55, 5.5, 20);
  bLight.position.set(0, 4.2, -6.0);
  wGroup.add(bLight);

  // Các thùng gỗ ủ rượu vang lớn (Old Wine Cellar)
  for (let i = 0; i < 4; i++) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.4, 14), woodMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(-4.5, 0.75, -12.0 + i * 2.4);
    wGroup.add(barrel);
    addCol(x - 5.3, x - 3.7, y, y + 1.5, z - 12.8 + i * 2.4, z - 11.2 + i * 2.4, 'wine_barrel');
  }

  // Bàn Văn Phòng Nghiên Cứu (Research Office)
  const officeDesk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.85, 1.4), steelMat);
  officeDesk.position.set(1.5, 0.42, -8.5);
  wGroup.add(officeDesk);
  addCol(x + 0.1, x + 2.9, y, y + 0.95, z - 9.2, z - 7.8, 'research_desk');

  group.add(wGroup);

  // Manh Mối C3: Hồ sơ Dự Án Huyết Quỷ (Project Bloodfiend)
  createDocumentProp(
    group,
    world,
    x + 1.5,
    y + 0.86,
    z - 8.5,
    'C3',
    '[E] Đọc Hồ Sơ Dự Án Huyết Quỷ H-04 (C3) — Văn Phòng Nghiên Cứu B1'
  );
}

function buildBasementMainLab(group, addCol, world, x, y, z, steelMat, glassMat, bloodMat) {
  const lGroup = new THREE.Group();
  lGroup.position.set(x, y, z);

  const labLight1 = new THREE.PointLight(0x88ddff, 7.0, 24);
  labLight1.position.set(0, 4.8, 4.0);
  const labLight2 = new THREE.PointLight(0x88ddff, 7.0, 24);
  labLight2.position.set(0, 4.8, -8.0);
  lGroup.add(labLight1, labLight2);

  // 2 Bàn thí nghiệm inox lớn + giá ống nghiệm phát sáng đỏ
  [-3.5, 3.5].forEach((lz) => {
    const labBench = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 1.5), steelMat);
    labBench.position.set(0, 0.45, lz);
    lGroup.add(labBench);
    addCol(x - 2.6, x + 2.6, y, y + 1.0, z + lz - 0.75, z + lz + 0.75, 'lab_bench');

    for (let v = -3; v <= 3; v++) {
      const vial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.38, 8),
        new THREE.MeshBasicMaterial({ color: v % 2 === 0 ? 0xff1133 : 0x00ffcc })
      );
      vial.position.set(v * 0.55, 1.1, lz);
      lGroup.add(vial);
    }
  });

  // Tủ Lạnh Bảo Quản Mẫu Huyết Thanh Gốc H-04 (Sample Cold Room Cryo-Unit)
  const cryoUnit = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.4, 1.2), steelMat);
  cryoUnit.position.set(0, 1.2, -14.5);
  const serumTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.65, 12),
    new THREE.MeshBasicMaterial({ color: 0xff0044 })
  );
  serumTube.position.set(0, 1.35, -13.8);
  lGroup.add(cryoUnit, serumTube);
  addCol(x - 0.9, x + 0.9, y, y + 2.4, z - 15.1, z - 13.9, 'cryo_unit');

  group.add(lGroup);

  world.interactables.push({
    mesh: serumTube,
    label: '[E] Thu giữ Mẫu Huyết Thanh Gốc H-04 (Bằng chứng vật lý tố cáo Nexus)',
    distance: 4.5,
    onInteract: () => {
      if (playerInventory.hasItem('nexus_serum_h04')) {
        world.showNotification('🧪 Bạn đã thu giữ Mẫu Huyết Thanh Gốc H-04 trong túi đồ rồi!');
        return;
      }
      audioManager.playObjectiveComplete();
      playerInventory.addItem({
        id: 'nexus_serum_h04',
        name: 'Ống Huyết Thanh Gốc H-04 (Nexus)',
        type: 'evidence',
        count: 1,
        description: 'Mẫu hợp chất sinh học cấm do Tập đoàn Dược phẩm Nexus cung cấp trái phép cho Ông Bình. Bằng chứng thép để đưa Nexus ra ánh sáng pháp luật.'
      });
      serumTube.visible = false;
      world.showNotification('🧪 ĐÃ THU GIỮ BẰNG CHỨNG VẬT LÝ: Ống Huyết Thanh Gốc H-04! (Bấm [G] để xem trong túi đồ)');
    }
  });
}

function buildBasementCoreLab(group, addCol, world, x, y, z, steelMat, glassMat, brassMat) {
  const cGroup = new THREE.Group();
  cGroup.position.set(x, y, z);

  // BỂ CHỨA SINH HỌC KHỔNG LỒ CỦA CHI (CHI — CONTAINMENT TANK) Ở GIỮA CORE LAB
  const basePedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 0.75, 24), steelMat);
  basePedestal.position.set(0, 0.38, 0);
  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.65, 24), steelMat);
  topCap.position.set(0, 5.2, 0);

  // Cột dung dịch sinh học phát sáng xanh-đỏ ma mị
  const fluidCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(2.25, 2.25, 4.4, 24),
    new THREE.MeshBasicMaterial({
      color: 0x00d8ff,
      transparent: true,
      opacity: 0.38
    })
  );
  fluidCylinder.position.set(0, 2.8, 0);

  // Kính cường lực của bể chứa (đã có vết nứt lớn vì Chi vừa thoát ra)
  const outerGlass = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 4.5, 24), glassMat);
  outerGlass.position.set(0, 2.8, 0);

  const coreLight = new THREE.PointLight(0x00eeff, 12.0, 28);
  coreLight.position.set(0, 3.0, 0);

  cGroup.add(basePedestal, topCap, fluidCylinder, outerGlass, coreLight);
  addCol(x - 2.5, x + 2.5, y, y + 5.5, z - 2.5, z + 2.5, 'containment_tank');

  // 4 Đèn pha công suất lớn (Floodlights L1 - L4) chiếu vào bể chứa như trong bản vẽ basement.png
  [[-5.2, -5.2], [5.2, -5.2], [-5.2, 5.2], [5.2, 5.2]].forEach(([fx, fz]) => {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.25, 2.4, 8), steelMat);
    stand.position.set(fx, 1.2, fz);
    const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.35), brassMat);
    lampHead.position.set(fx, 2.45, fz);
    lampHead.lookAt(x, y + 2.5, z);
    cGroup.add(stand, lampHead);
  });

  // Bàn điều khiển trung tâm (Control Console) có Băng Ghi Âm Lời Thú Tội Của Ông Bình & Chìa Khóa K5
  const consoleTable = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.95, 1.2), steelMat);
  consoleTable.position.set(-4.2, 0.48, 0);
  cGroup.add(consoleTable);
  addCol(x - 5.8, x - 2.6, y, y + 1.1, z - 0.65, z + 0.65, 'core_console');

  group.add(cGroup);

  // Đặt Bản Ghi Âm Lời Thú Tội Cuối Cùng Của Ông Bình trên Bàn điều khiển Core Lab
  createDocumentProp(
    group,
    world,
    x - 4.2,
    y + 0.96,
    z,
    'CORE_LOG',
    '[E] Nghe/Đọc Bản Ghi Âm Cuối Cùng Của Ông Bình Tại Core Lab (B1)'
  );
}

function createFloatingSign(group, x, y, z, text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(18, 10, 12, 0.88)';
  ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 88);
  ctx.fillStyle = '#ffdd88';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 48);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.64), mat);
  sign.position.set(x, y, z);
  group.add(sign);
}

// ============================================================================
// PROCEDURAL TEXTURES CHO SÀN ĐÁ MARBLE, SÀN GỖ SỒI, SÀN LAB & TRANH GIA ĐÌNH
// ============================================================================
function createCheckeredMarbleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#d8d2c7' : '#1e1c1a';
      ctx.fillRect(c * 64, r * 64, 64, 64);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 14);
  return tex;
}

function createHardwoodFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3a2214';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#24130a';
  ctx.lineWidth = 3;
  for (let y = 0; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 14);
  return tex;
}

function createLabTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#252d32';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#161b1e';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 128, 128);
  ctx.strokeRect(128, 0, 128, 128);
  ctx.strokeRect(0, 128, 128, 128);
  ctx.strokeRect(128, 128, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  return tex;
}

function createFamilyPaintingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  // Bầu trời ấm áp và vườn hoa nắng ấm
  const sky = ctx.createLinearGradient(0, 0, 0, 200);
  sky.addColorStop(0, '#f4c884');
  sky.addColorStop(1, '#fae5b8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 320);

  ctx.fillStyle = '#3d6336';
  ctx.fillRect(0, 200, 512, 120);

  // Hoa trắng nở rộ dưới vườn
  for (let i = 0; i < 65; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#ffddaa';
    ctx.beginPath();
    ctx.arc(Math.random() * 512, 210 + Math.random() * 100, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hình bóng Ông Bình, Bà Bình và cô con gái Linh Chi mặc váy trắng ở giữa
  // Ông Bình (trái)
  ctx.fillStyle = '#2a2421';
  ctx.fillRect(165, 115, 46, 125);
  ctx.fillStyle = '#e0b899';
  ctx.beginPath();
  ctx.arc(188, 92, 22, 0, Math.PI * 2);
  ctx.fill();

  // Linh Chi mặc váy trắng ở giữa
  ctx.fillStyle = '#fff9f0';
  ctx.beginPath();
  ctx.moveTo(256, 120);
  ctx.lineTo(222, 245);
  ctx.lineTo(290, 245);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2ceb0';
  ctx.beginPath();
  ctx.arc(256, 102, 20, 0, Math.PI * 2);
  ctx.fill();

  // Người mẹ (phải)
  ctx.fillStyle = '#6e242b';
  ctx.fillRect(305, 122, 44, 120);
  ctx.fillStyle = '#ecc4a4';
  ctx.beginPath();
  ctx.arc(327, 98, 21, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3a1f10';
  ctx.font = 'italic bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Gia Đình Ông Bình & Ái Nữ Linh Chi (1995)', 256, 298);

  return new THREE.CanvasTexture(canvas);
}


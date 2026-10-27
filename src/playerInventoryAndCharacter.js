// Hệ thống Túi Đồ 9 Ô & Toàn Phần (Phím G - 3 trạng thái), Đọc Hồ Sơ Vụ Án,
// và Mô Hình Nhân Vật Cảnh Sát An (Thiết kế theo chân dung Founder MinhPhuc00Ne / Jos)
import * as THREE from 'three';
import { audioManager } from './audio.js';

export const HOSOSO_VU_AN_DEFAULT = {
  id: 'case_file',
  name: 'Hồ Sơ Vụ Án #NX-2026-884',
  icon: '📋',
  desc: 'Tập hồ sơ điều động khẩn cấp từ Tổng Đài Đồn Cảnh Sát số 7 về chiếc xe tải dược phẩm Nexus mất liên lạc gần Biệt Thự Bác Sĩ Bình.',
  pages: [
    {
      title: 'TRANG 1: LỆNH ĐIỀU ĐỘNG KHẨN CẤP #NX-2026-884',
      stamp: 'KHẨN CẤP - MẬT',
      content: `
        <div class="case-doc-header">
          <div><strong>ĐƠN VỊ:</strong> ĐỒN CẢNH SÁT KHU VỰC 07</div>
          <div><strong>NGÀY GIỜ:</strong> 26/10/2026 — 20:30 ĐÊM</div>
          <div><strong>SĨ QUAN PHỤ TRÁCH:</strong> AN (MÃ HIỆU: PATROL-07)</div>
        </div>
        <hr class="case-doc-divider"/>
        <h4>1. TÓM TẮT SỰ VIỆC</h4>
        <p>Vào lúc <strong>19:45</strong> tối nay, hệ thống giám sát hành trình của Tập đoàn Dược phẩm <strong>NEXUS LOGISTICS</strong> phát tín hiệu cầu cứu khẩn cấp từ xe tải vận chuyển mẫu sinh học mang biển số <strong>NX-884</strong>.</p>
        <p>Hai nhân viên giao hàng trên chuyến xe gồm <strong>Phúc</strong> và <strong>Quý</strong> được giao nhiệm vụ vận chuyển định kỳ các thùng vật tư y tế và hóa chất bảo quản lạnh vào <strong>Dinh thự biệt lập của Tiến sĩ Bình</strong> (nằm sâu trong con đường mòn Rừng Cấm).</p>
        <h4>2. HIỆN TƯỢNG BẤT THƯỜNG</h4>
        <ul>
          <li>Tín hiệu định vị GPS của xe tải dừng đột ngột ngay ngã rẽ từ Quốc lộ chính vào đường mòn đất dẫn tới biệt thự ông Bình.</li>
          <li>Cuộc gọi bộ đàm cuối cùng từ tài xế Quý chỉ kéo dài 4 giây với tiếng kính vỡ và tiếng gào thét thất thanh trước khi mất sóng.</li>
          <li>Gia đình Tiến sĩ Bình (cùng con gái là bé <strong>Chi</strong> và người giúp việc <strong>dì Hạnh</strong>) đã cắt đứt liên lạc với bên ngoài suốt 2 tuần qua.</li>
        </ul>
      `
    },
    {
      title: 'TRANG 2: HỒ SƠ NHÂN THÂN TIẾN SĨ BÌNH & BÉ CHI',
      stamp: 'HỒ SƠ Y TẾ',
      content: `
        <div class="case-doc-header">
          <div><strong>ĐỐI TƯỢNG:</strong> TS. NGUYỄN VĂN BÌNH (52 TUỔI)</div>
          <div><strong>CHUYÊN MÔN:</strong> CÔNG NGHỆ SINH HỌC & DƯỢC LIỆU CỔ</div>
        </div>
        <hr class="case-doc-divider"/>
        <h4>1. LỊCH SỬ NGHIÊN CỨU</h4>
        <p>Tiến sĩ Bình từng là chuyên gia hàng đầu tại viện nghiên cứu dược liệu. Sau khi con gái duy nhất của ông là <strong>Chi (16 tuổi)</strong> được chẩn đoán mắc chứng ung thư máu giai đoạn cuối không đáp ứng phác đồ điều trị, ông Bình đã xin nghỉ việc và đưa con về căn biệt thự cổ của dòng họ trong rừng sâu.</p>
        <h4>2. NGHI VẤN VỀ "HOA HỒI SINH"</h4>
        <p>Theo nguồn tin từ các đồng nghiệp cũ, ông Bình đã tự ý mở lại một hang động bị phong tỏa từ thời Thế chiến II để tìm kiếm một loài thực vật ký sinh cổ xưa được gọi là <strong>"Hoa Hồi Sinh"</strong> — loài hoa trắng mọc trên xương thú có khả năng tái tạo mô chết nhưng gây biến đổi tế bào cực kỳ nguy hiểm.</p>
        <p style="color:#8b0000; font-weight:bold;">⚠️ CHỈ THỊ CHO SĨ QUAN AN: Mang theo Súng Lục Tuần Tra (100 viên đạn) và Đèn Pin Chiến Thuật. Khảo sát xe tải Nexus, lần theo dấu vết và báo cáo ngay khi tiếp cận biệt thự!</p>
      `
    }
  ]
};

class PlayerInventoryManager {
  constructor() {
    // 9 ô thanh trang bị nhanh (Hotbar)
    this.hotbar = new Array(9).fill(null);
    // 27 ô kho đồ mở rộng (3 hàng x 9 cột)
    this.storage = new Array(27).fill(null);

    // Trang bị mặc định đầu game: Ô 1 là Đèn Pin Chiến Thuật
    this.hotbar[0] = {
      id: 'flashlight',
      name: 'Đèn Pin Chiến Thuật',
      icon: '🔦',
      count: 1,
      desc: 'Đèn pin cảnh sát công suất cao. Nhấn [F] để bật/tắt nguồn sáng khống chế bóng tối.'
    };

    this.selectedSlot = 0; // 0..8
    // Trạng thái hiển thị phím G:
    // 0: Ẩn hoàn toàn
    // 1: Hiện thanh 9 ô phía dưới (Hotbar)
    // 2: Hiện toàn bộ Túi Đồ + Khung Nhân Vật Cảnh Sát An
    this.uiState = 0;

    this.pistolAmmo = 100;
    this.maxPistolAmmo = 100;
    this.hasPickedPistolInCar = false;
    this.hasPickedCaseFileInCar = false;

    this.onEquipChange = null;
    this.onDropItemRequest = null;

    this.portraitCanvas = null;
    this.mousePos = { x: 0.5, y: 0.5 };
    this.initDOM();
  }

  resetForNewGame() {
    this.hotbar = new Array(9).fill(null);
    this.storage = new Array(27).fill(null);
    this.hotbar[0] = {
      id: 'flashlight',
      name: 'Đèn Pin Chiến Thuật',
      icon: '🔦',
      count: 1,
      desc: 'Đèn pin cảnh sát công suất cao. Nhấn [F] để bật/tắt nguồn sáng.'
    };
    this.selectedSlot = 0;
    this.uiState = 0;
    this.pistolAmmo = 100;
    this.hasPickedPistolInCar = false;
    this.hasPickedCaseFileInCar = false;
    this.renderUI();
  }

  initUI() {
    this.initDOM();
  }

  get isReadingCaseFile() {
    return !!this.isReadingDoc;
  }

  initDOM() {
    if (document.getElementById('bf-inventory-system')) return;

    this.rootEl = document.createElement('div');
    this.rootEl.id = 'bf-inventory-system';
    this.rootEl.innerHTML = `
      <!-- THANH 9 Ô HOTBAR DƯỚI ĐÁY MÀN HÌNH (Hiện/Ẩn khi bấm phím G) -->
      <div class="mc-hotbar-wrapper" id="mc-hotbar-wrapper" style="display: none;">
        <div class="mc-selected-item-label" id="mc-selected-item-label">Đèn Pin Chiến Thuật</div>
        <div class="mc-hotbar-grid" id="mc-hotbar-grid"></div>
        <div class="mc-hotbar-subhint">[1-9 / Lăn chuột] Chọn ô • [Click Trái] Dùng/Bắn/Đọc • [Q] Ném đồ • [G] Ẩn/Hiện thanh 9 ô</div>
      </div>

      <!-- BẢNG TÚI ĐỒ ĐẦY ĐỦ + NHÂN VẬT CẢNH SÁT AN (Hiện khi uiState === 2) -->
      <div class="mc-full-inventory-backdrop" id="mc-full-inventory-backdrop" style="display: none;">
        <div class="mc-inventory-window">
          <div class="mc-inv-header">
            <span>⚜ TÚI ĐỒ & TRANG BỊ SĨ QUAN TUẦN TRA AN</span>
            <span class="mc-inv-close-hint">[Nhấn G lần nữa để đóng & ẩn thanh 9 ô]</span>
          </div>

          <!-- Khu vực nửa trên: Khung trang bị giáp + Thông tin chi tiết vật phẩm -->
          <div class="mc-inv-top-section">
            <!-- 4 Ô Trang phục Cảnh Sát -->
            <div class="mc-armor-column">
              <div class="mc-slot armor-equipped" title="Mái tóc đen rẽ ngôi 6/4"><span class="slot-icon">💇🏻‍♂️</span></div>
              <div class="mc-slot armor-equipped" title="Áo sơ mi trắng Cảnh Sát & Cà vạt đen + Huy hiệu"><span class="slot-icon">👔</span></div>
              <div class="mc-slot armor-equipped" title="Quần âu chiến thuật Cảnh Sát & Đai đeo súng"><span class="slot-icon">👖</span></div>
              <div class="mc-slot armor-equipped" title="Giày da tuần tra chống trượt"><span class="slot-icon">👞</span></div>
            </div>

            <!-- Khung Chi Tiết Vật Phẩm Đang Chọn (Mở rộng sang trọng, đậm chất RPG/Survival) -->
            <div class="mc-item-inspector" id="mc-item-inspector">
              <div class="mc-inspector-title" id="mc-insp-title">Đèn Pin Chiến Thuật</div>
              <div class="mc-inspector-desc" id="mc-insp-desc">Đèn pin cảnh sát công suất cao. Nhấn [F] để bật/tắt nguồn sáng.</div>
              <div class="mc-inspector-actions" id="mc-insp-actions"></div>
            </div>
          </div>

          <!-- Khu vực nửa dưới: 27 Ô Kho Đồ (3 hàng x 9 cột) -->
          <div class="mc-storage-label">KHO ĐỒ CÁ NHÂN (27 Ô)</div>
          <div class="mc-storage-grid" id="mc-storage-grid"></div>

          <!-- 9 Ô Thanh Trang Bị Nhanh trong bảng -->
          <div class="mc-storage-label" style="margin-top: 10px;">THANH TRANG BỊ NHANH (9 Ô - PHÍM 1..9)</div>
          <div class="mc-hotbar-grid in-modal" id="mc-modal-hotbar-grid"></div>
        </div>
      </div>

      <!-- MODAL CẦM ĐỌC TẬP HỒ SƠ VỤ ÁN / GHI CHÉP MANH MỐI -->
      <div class="case-file-modal-backdrop" id="case-file-modal" style="display: none;">
        <div class="case-clipboard-board">
          <div class="case-metal-clip">HỒ SƠ ĐIỀU TRA CẢNH SÁT</div>
          <div class="case-paper-sheet">
            <div class="case-stamp-badge" id="case-doc-stamp">KHẨN CẤP</div>
            <h2 class="case-doc-title" id="case-doc-title">HỒ SƠ VỤ ÁN</h2>
            <div class="case-doc-body" id="case-doc-body"></div>
            <div class="case-doc-footer">
              <div class="case-page-controls" id="case-page-controls"></div>
              <button class="pixel-btn btn-primary" id="case-doc-close-btn" style="padding: 10px 20px; font-size: 0.78rem;">
                CẤT HỒ SƠ VÀO TÚI ĐỒ [E / ESC]
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.rootEl);

    this.hotbarWrapperEl = this.rootEl.querySelector('#mc-hotbar-wrapper');
    this.hotbarGridEl = this.rootEl.querySelector('#mc-hotbar-grid');
    this.selectedLabelEl = this.rootEl.querySelector('#mc-selected-item-label');
    this.fullInvBackdropEl = this.rootEl.querySelector('#mc-full-inventory-backdrop');
    this.storageGridEl = this.rootEl.querySelector('#mc-storage-grid');
    this.modalHotbarGridEl = this.rootEl.querySelector('#mc-modal-hotbar-grid');
    this.inspTitleEl = this.rootEl.querySelector('#mc-insp-title');
    this.inspDescEl = this.rootEl.querySelector('#mc-insp-desc');
    this.inspActionsEl = this.rootEl.querySelector('#mc-insp-actions');

    this.caseModalEl = this.rootEl.querySelector('#case-file-modal');
    this.caseTitleEl = this.rootEl.querySelector('#case-doc-title');
    this.caseStampEl = this.rootEl.querySelector('#case-doc-stamp');
    this.caseBodyEl = this.rootEl.querySelector('#case-doc-body');
    this.casePageControlsEl = this.rootEl.querySelector('#case-page-controls');
    this.caseCloseBtnEl = this.rootEl.querySelector('#case-doc-close-btn');

    this.caseCloseBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeCaseFileModal();
    });

    window.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX / Math.max(1, window.innerWidth);
      this.mousePos.y = e.clientY / Math.max(1, window.innerHeight);
    });

    this.renderUI();
  }

  // Bấm phím G: Chuyển đổi 2 trạng thái gọn nhẹ (0: Ẩn thanh 9 ô <-> 1: Hiện thanh 9 ô)
  cycleInventoryState() {
    this.uiState = this.uiState === 0 ? 1 : 0;
    audioManager.playHover();
    this.renderUI();
    return this.uiState;
  }

  addItem(rawItemData) {
    const normalizedId = rawItemData.id === 'service_pistol' ? 'pistol' : rawItemData.id;
    const itemData = {
      ...rawItemData,
      id: normalizedId,
      icon: rawItemData.icon || (
        normalizedId === 'pistol' ? '🔫'
          : normalizedId === 'combat_knife' || normalizedId === 'knife' ? '🗡️'
          : normalizedId === 'nexus_serum_h04' ? '🧪'
          : '📋'
      ),
      desc: rawItemData.desc || rawItemData.description || '',
      pages: rawItemData.pages || rawItemData.documentData?.pages || null,
      isDocument: !!(rawItemData.isDocument || rawItemData.type === 'document' || rawItemData.pages || rawItemData.documentData)
    };

    // Kiểm tra xem đã có vật phẩm trùng id trong hotbar chưa
    const existingIdx = this.hotbar.findIndex(it => it && it.id === itemData.id);
    if (existingIdx !== -1) {
      this.hotbar[existingIdx] = { ...this.hotbar[existingIdx], ...itemData };
      this.selectedSlot = existingIdx;
      this.renderUI();
      if (this.onEquipChange) this.onEquipChange(this.getActiveItem());
      return true;
    }

    // Tìm ô trống đầu tiên trong 9 ô hotbar
    const emptyHotbarIdx = this.hotbar.findIndex(it => it === null);
    if (emptyHotbarIdx !== -1) {
      this.hotbar[emptyHotbarIdx] = { ...itemData };
      this.selectedSlot = emptyHotbarIdx;
      this.renderUI();
      if (this.onEquipChange) this.onEquipChange(this.getActiveItem());
      return true;
    }

    // Nếu 9 ô hotbar đầy, thêm vào 27 ô kho đồ
    const emptyStorageIdx = this.storage.findIndex(it => it === null);
    if (emptyStorageIdx !== -1) {
      this.storage[emptyStorageIdx] = { ...itemData };
      this.renderUI();
      return true;
    }
    return false;
  }

  getActiveItem() {
    return this.hotbar[this.selectedSlot] || null;
  }

  hasItem(itemId) {
    const targetIds = (itemId === 'pistol' || itemId === 'service_pistol')
      ? ['pistol', 'service_pistol']
      : (itemId === 'knife' || itemId === 'combat_knife')
      ? ['knife', 'combat_knife']
      : [itemId];
    return (
      this.hotbar.some(it => it && targetIds.includes(it.id)) ||
      this.storage.some(it => it && targetIds.includes(it.id))
    );
  }

  selectSlot(index) {
    if (index < 0 || index > 8) return;
    this.selectedSlot = index;
    audioManager.playHover();
    this.renderUI();
    if (this.onEquipChange) {
      this.onEquipChange(this.getActiveItem());
    }
  }

  // Ném vật phẩm đang cầm trên tay ra ngoài (Phím Q)
  dropActiveItem() {
    const active = this.hotbar[this.selectedSlot];
    if (!active) return null;

    const dropped = { ...active };
    this.hotbar[this.selectedSlot] = null;
    this.renderUI();
    if (this.onEquipChange) {
      this.onEquipChange(null);
    }
    return dropped;
  }

  // Mở đọc Tập Hồ Sơ Vụ Án hoặc Ghi Chép Manh Mối
  openCaseFileModal(docObject = HOSOSO_VU_AN_DEFAULT, onCloseCallback = null) {
    this.activeDoc = docObject;
    this.activeDocPage = 0;
    this.onDocCloseCallback = onCloseCallback;
    this.isReadingDoc = true;
    document.exitPointerLock?.();
    audioManager.playPageTurn();
    this.caseModalEl.style.display = 'flex';
    this.renderCaseDocPage();
  }

  renderCaseDocPage() {
    if (!this.activeDoc) return;
    const pages = this.activeDoc.pages || this.activeDoc.documentData?.pages || [
      { title: this.activeDoc.name || this.activeDoc.title, stamp: 'TÀI LIỆU MẬT', content: `<p>${this.activeDoc.desc || ''}</p>` }
    ];
    const page = pages[this.activeDocPage] || pages[0];
    this.caseTitleEl.textContent = page.title || page.heading || this.activeDoc.title || this.activeDoc.name || 'HỒ SƠ VỤ ÁN';
    this.caseStampEl.textContent = page.stamp || 'HỒ SƠ VỤ ÁN';
    const metaHtml = page.meta ? `<div class="case-page-meta">${page.meta}</div>` : '';
    this.caseBodyEl.innerHTML = `${metaHtml}${page.content || page.body || ''}`;

    this.casePageControlsEl.innerHTML = '';
    if (pages.length > 1) {
      pages.forEach((p, idx) => {
        const btn = document.createElement('button');
        btn.className = `pixel-btn ${idx === this.activeDocPage ? 'btn-primary' : 'btn-secondary'}`;
        btn.style.padding = '6px 12px';
        btn.style.fontSize = '0.7rem';
        btn.textContent = `TRANG ${idx + 1}/${pages.length}`;
        btn.onclick = (e) => {
          e.stopPropagation();
          this.activeDocPage = idx;
          audioManager.playPageTurn();
          this.renderCaseDocPage();
        };
        this.casePageControlsEl.appendChild(btn);
      });
    }
  }

  closeCaseFileModal() {
    if (!this.isReadingDoc) return;
    this.isReadingDoc = false;
    this.caseModalEl.style.display = 'none';
    audioManager.playPageTurn();
    if (this.onDocCloseCallback) {
      const cb = this.onDocCloseCallback;
      this.onDocCloseCallback = null;
      cb();
    }
  }

  renderUI() {
    if (!this.rootEl) return;

    // Ẩn/hiện thanh 9 ô dưới đáy khi bấm phím G (bỏ bảng túi đồ lớn theo yêu cầu)
    this.hotbarWrapperEl.style.display = (this.uiState === 1) ? 'flex' : 'none';
    if (this.fullInvBackdropEl) {
      this.fullInvBackdropEl.style.display = 'none';
    }

    const activeItem = this.getActiveItem();
    if (activeItem) {
      const isPistol = activeItem.id === 'pistol' || activeItem.id === 'service_pistol';
      const ammoSuffix = isPistol ? ` [${this.pistolAmmo}/${this.maxPistolAmmo} VIÊN]` : '';
      this.selectedLabelEl.textContent = `${activeItem.icon} ${activeItem.name}${ammoSuffix}`;
      this.inspTitleEl.textContent = `${activeItem.icon} ${activeItem.name}${ammoSuffix}`;
      this.inspDescEl.textContent = activeItem.desc || '';
      this.inspActionsEl.innerHTML = '';

      if (activeItem.pages || activeItem.id === 'case_file' || activeItem.isDocument) {
        const readBtn = document.createElement('button');
        readBtn.className = 'pixel-btn btn-primary';
        readBtn.style.padding = '7px 14px';
        readBtn.style.fontSize = '0.7rem';
        readBtn.textContent = '📖 MỞ ĐỌC HỒ SƠ';
        readBtn.onclick = (e) => {
          e.stopPropagation();
          this.uiState = 1;
          this.renderUI();
          this.openCaseFileModal(activeItem.documentData || activeItem);
        };
        this.inspActionsEl.appendChild(readBtn);
      }
    } else {
      this.selectedLabelEl.textContent = 'Tay Không (Chưa cầm vật phẩm)';
      this.inspTitleEl.textContent = 'Ô Trống';
      this.inspDescEl.textContent = 'Click vào một ô có vật phẩm hoặc nhấn phím [1-9] để trang bị lên tay.';
      this.inspActionsEl.innerHTML = '';
    }

    // Render 9 ô Hotbar dưới đáy và 9 ô Hotbar trong Modal
    const renderHotbarTarget = (container) => {
      container.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const item = this.hotbar[i];
        const isPistol = item && (item.id === 'pistol' || item.id === 'service_pistol');
        const slotEl = document.createElement('div');
        slotEl.className = `mc-slot ${i === this.selectedSlot ? 'selected' : ''}`;
        slotEl.innerHTML = `
          <span class="mc-slot-key">${i + 1}</span>
          ${item ? `<span class="slot-icon">${item.icon}</span>` : ''}
          ${isPistol ? `<span class="mc-slot-count">${this.pistolAmmo}</span>` : ''}
        `;
        slotEl.title = item ? `${item.name} - ${item.desc}` : `Ô trang bị nhanh ${i + 1}`;
        slotEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectSlot(i);
        });
        container.appendChild(slotEl);
      }
    };

    renderHotbarTarget(this.hotbarGridEl);
    renderHotbarTarget(this.modalHotbarGridEl);

    // Render 27 ô Kho Đồ (3x9)
    this.storageGridEl.innerHTML = '';
    for (let s = 0; s < 27; s++) {
      const item = this.storage[s];
      const slotEl = document.createElement('div');
      slotEl.className = 'mc-slot';
      slotEl.innerHTML = item ? `<span class="slot-icon">${item.icon}</span>` : '';
      slotEl.title = item ? item.name : 'Ô kho đồ trống';
      slotEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item) {
          // Chuyển vật phẩm từ kho xuống ô đang chọn trên Hotbar
          const currentHotbarItem = this.hotbar[this.selectedSlot];
          this.hotbar[this.selectedSlot] = item;
          this.storage[s] = currentHotbarItem;
          audioManager.playClick();
          this.renderUI();
          if (this.onEquipChange) this.onEquipChange(this.getActiveItem());
        }
      });
      this.storageGridEl.appendChild(slotEl);
    }
  }

  // Vẽ chân dung Sĩ Quan Cảnh Sát An trong khung Nhân Vật của Túi Đồ (Giống ảnh chân dung Founder MinhPhuc00Ne / Jos)
  drawOfficerAnPortrait() {
    return;
    const ctx = this.portraitCanvas.getContext('2d');
    const w = this.portraitCanvas.width;
    const h = this.portraitCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Nền khung nhân vật tối sâu kiểu trưng bày nhân vật
    const bgGrad = ctx.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h / 2, 135);
    bgGrad.addColorStop(0, '#1e2436');
    bgGrad.addColorStop(1, '#090a10');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Góc nghiêng đầu nhẹ theo vị trí chuột (giống hệt nhân vật trong túi đồ Minecraft!)
    const lookX = (this.mousePos.x - 0.5) * 10;
    const lookY = (this.mousePos.y - 0.5) * 6;

    const cx = w / 2 + lookX * 0.35;

    // 1. QUẦN ÂU CẢNH SÁT XANH ĐEN & THẮT LƯNG CHIẾN THUẬT
    ctx.fillStyle = '#111622';
    ctx.fillRect(cx - 32, 206, 28, 44);
    ctx.fillRect(cx + 4, 206, 28, 44);

    // Thắt lưng da cảnh sát & Khóa đồng
    ctx.fillStyle = '#0a0b0e';
    ctx.fillRect(cx - 35, 196, 70, 12);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(cx - 8, 197, 16, 10);

    // 2. ÁO SƠ MI TRẮNG NGẮN TAY CÓ TÚI NGỰC & CÀ VẠT ĐEN (Giống hệt ảnh mẫu người dùng gửi!)
    ctx.fillStyle = '#f2f5fa';
    ctx.beginPath();
    ctx.moveTo(cx - 44, 118);
    ctx.lineTo(cx + 44, 118);
    ctx.lineTo(cx + 36, 198);
    ctx.lineTo(cx - 36, 198);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d0d7e2';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tay áo sơ mi trắng hai bên & Cánh tay
    ctx.fillStyle = '#f2f5fa';
    ctx.fillRect(cx - 58, 120, 18, 42);
    ctx.fillRect(cx + 40, 120, 18, 42);

    // Cánh tay da người trẻ trung
    ctx.fillStyle = '#f0c4a8';
    ctx.fillRect(cx - 56, 162, 14, 42);
    ctx.fillRect(cx + 42, 162, 14, 42);

    // Cầu vai Cảnh Sát (Police Epaulets màu xanh đen viền vàng trên hai vai áo sơ mi trắng)
    ctx.fillStyle = '#141e38';
    ctx.fillRect(cx - 46, 114, 24, 9);
    ctx.fillRect(cx + 22, 114, 24, 9);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 46, 114, 24, 9);
    ctx.strokeRect(cx + 22, 114, 24, 9);

    // Túi áo ngực trái + Huy hiệu Cảnh Sát Vàng (Golden Police Shield Badge)
    ctx.strokeStyle = '#c8d0dc';
    ctx.strokeRect(cx + 12, 144, 20, 22);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(cx + 22, 136, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9e7218';
    ctx.stroke();

    // Cổ và Cổ áo sơ mi trắng bẻ nhọn
    ctx.fillStyle = '#ebbc9e';
    ctx.fillRect(cx - 13, 98, 26, 22);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - 18, 106);
    ctx.lineTo(cx - 3, 125);
    ctx.lineTo(cx - 14, 128);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 18, 106);
    ctx.lineTo(cx + 3, 125);
    ctx.lineTo(cx + 14, 128);
    ctx.closePath();
    ctx.fill();

    // CÀ VẠT ĐEN THẮT CHỈNH TỀ GIỮA NGỰC (Đặc trưng nổi bật trong ảnh chân dung!)
    ctx.fillStyle = '#121318';
    ctx.beginPath();
    ctx.moveTo(cx - 6, 116);
    ctx.lineTo(cx + 6, 116);
    ctx.lineTo(cx + 4, 125);
    ctx.lineTo(cx - 4, 125);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - 4, 125);
    ctx.lineTo(cx + 4, 125);
    ctx.lineTo(cx + 9, 178);
    ctx.lineTo(cx, 190);
    ctx.lineTo(cx - 9, 178);
    ctx.closePath();
    ctx.fill();

    // 3. KHUÔN MẶT ĐIỂN TRAI CHÂU Á & MÁI TÓC ĐEN RẼ NGÔI 6/4 HÀN QUỐC (Theo sát ảnh mẫu)
    const hx = cx + lookX * 0.4;
    const hy = 66 + lookY * 0.35;

    // Đôi tai
    ctx.fillStyle = '#ebbc9e';
    ctx.beginPath();
    ctx.ellipse(hx - 28, hy + 4, 5, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(hx + 28, hy + 4, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Khuôn mặt thon gọn nam tính
    ctx.fillStyle = '#f4cbb0';
    ctx.beginPath();
    ctx.moveTo(hx - 26, hy - 14);
    ctx.quadraticCurveTo(hx - 27, hy + 18, hx - 16, hy + 30);
    ctx.quadraticCurveTo(hx, hy + 40, hx + 16, hy + 30);
    ctx.quadraticCurveTo(hx + 27, hy + 18, hx + 26, hy - 14);
    ctx.quadraticCurveTo(hx, hy - 32, hx - 26, hy - 14);
    ctx.closePath();
    ctx.fill();

    // Hồng nhẹ tự nhiên ở hai bên má
    ctx.fillStyle = 'rgba(218, 125, 115, 0.22)';
    ctx.beginPath();
    ctx.arc(hx - 15, hy + 11, 7, 0, Math.PI * 2);
    ctx.arc(hx + 15, hy + 11, 7, 0, Math.PI * 2);
    ctx.fill();

    // Lông mày đen rậm nam tính
    ctx.strokeStyle = '#181416';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(hx - 19, hy - 5);
    ctx.quadraticCurveTo(hx - 11, hy - 8, hx - 5, hy - 5);
    ctx.moveTo(hx + 5, hy - 5);
    ctx.quadraticCurveTo(hx + 11, hy - 8, hx + 19, hy - 5);
    ctx.stroke();

    // Đôi mắt sáng có thần nhìn theo trỏ chuột
    const eyeOffsetX = lookX * 0.18;
    const eyeOffsetY = lookY * 0.15;
    [-12, 12].forEach(ex => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(hx + ex, hy + 2, 6.2, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Con ngươi nâu đen sâu
      ctx.fillStyle = '#1c120e';
      ctx.beginPath();
      ctx.arc(hx + ex + eyeOffsetX, hy + 2 + eyeOffsetY, 3.1, 0, Math.PI * 2);
      ctx.fill();

      // Đốm sáng mắt long lanh
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx + ex - 1 + eyeOffsetX, hy + 1 + eyeOffsetY, 1.1, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sống mũi cao tự nhiên
    ctx.strokeStyle = '#d49e80';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(hx, hy + 1);
    ctx.lineTo(hx - 1.5, hy + 14);
    ctx.lineTo(hx + 2.5, hy + 15);
    ctx.stroke();

    // Đôi môi hồng tự nhiên mỉm cười nhẹ điềm tĩnh (giống hệt biểu cảm trong ảnh!)
    ctx.fillStyle = '#c86d68';
    ctx.beginPath();
    ctx.ellipse(hx, hy + 23, 8.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8f423e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hx - 9, hy + 22.5);
    ctx.quadraticCurveTo(hx, hy + 24.5, hx + 9, hy + 22.5);
    ctx.stroke();

    // MÁI TÓC ĐEN DÀY RẼ NGÔI 6/4 BỒNG BỀNH RỦ XUỐNG TRÁN (Đặc trưng nhất trong bức ảnh!)
    ctx.fillStyle = '#111116';
    ctx.beginPath();
    // Khối tóc phồng trên đỉnh đầu và hai bên thái dương
    ctx.arc(hx, hy - 10, 31, Math.PI * 0.88, Math.PI * 2.12);
    // Mái bên trái rủ cong xuống chạm lông mày
    ctx.quadraticCurveTo(hx + 28, hy - 2, hx + 25, hy + 4);
    ctx.quadraticCurveTo(hx + 14, hy - 4, hx + 4, hy - 14);
    // Khe rẽ ngôi lệch nhẹ bên trên trán
    ctx.quadraticCurveTo(hx - 2, hy - 6, hx - 12, hy - 1);
    ctx.quadraticCurveTo(hx - 22, hy - 3, hx - 28, hy + 5);
    ctx.closePath();
    ctx.fill();

    // Các lọn tóc mái uốn nhẹ phủ xuống trán
    ctx.strokeStyle = '#1f2029';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx + 3, hy - 26);
    ctx.quadraticCurveTo(hx + 16, hy - 12, hx + 18, hy - 2);
    ctx.moveTo(hx - 2, hy - 26);
    ctx.quadraticCurveTo(hx - 14, hy - 12, hx - 16, hy - 1);
    ctx.stroke();
  }
}

export const playerInventory = new PlayerInventoryManager();

// ============================================================================
// HÀM DỰNG MÔ HÌNH 3D CHÂN THỰC TỪ ẢNH THẬT /humanb.jpg (DÙNG CHO GÓC NHÌN [U] & TRƯNG BÀY 3D)
// Kết hợp giải phẫu 3D mượt mà (Smooth Organic Mesh: Đầu oval, mũi nổi 3D, tai, tóc 6/4 uốn lọn,
// thân hình vai rộng, tay áo sơ mi trắng ngắn tay, cà vạt đen 3D) và Photo-Mapping trực tiếp từ /humanb.jpg!
// ============================================================================
export function createOfficerAn3DCharacter() {
  const group = new THREE.Group();

  // 1. Tạo Canvas Texture Khuôn Mặt 512x512 (Có fallback sắc nét + Tự động nạp ảnh thật /humanb.jpg)
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 512;
  faceCanvas.height = 512;
  const fCtx = faceCanvas.getContext('2d');

  // Màu da nền đồng bộ hoàn hảo với tông da thật trong ảnh humanb.jpg
  fCtx.fillStyle = '#e8c3b0';
  fCtx.fillRect(0, 0, 512, 512);

  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;

  // 2. Tạo Canvas Texture Áo Sơ Mi Trắng Ngắn Tay + Cà Vạt Đen 512x512 (Tự động nạp từ /humanb.jpg)
  const shirtCanvas = document.createElement('canvas');
  shirtCanvas.width = 512;
  shirtCanvas.height = 512;
  const sCtx = shirtCanvas.getContext('2d');
  sCtx.fillStyle = '#eff2f9';
  sCtx.fillRect(0, 0, 512, 512);

  // Vẽ sẵn nếp áo sơ mi trắng, túi ngực trái và cà vạt đen trước khi ảnh nạp xong
  sCtx.strokeStyle = '#d4dbe8';
  sCtx.lineWidth = 4;
  sCtx.strokeRect(305, 190, 95, 110); // Túi ngực trái giống ảnh humanb.jpg

  const shirtTex = new THREE.CanvasTexture(shirtCanvas);
  shirtTex.colorSpace = THREE.SRGBColorSpace;

  // Nạp ảnh thật /humanb.jpg để ánh xạ (Photo-Projection) khuôn mặt thật và áo sơ mi thật lên mô hình 3D
  const humanImg = new Image();
  humanImg.crossOrigin = 'anonymous';
  humanImg.onload = () => {
    const iw = humanImg.width;
    const ih = humanImg.height;

    // A. Ánh xạ khuôn mặt thật từ /humanb.jpg vào chính giữa UV mặt trước của khối đầu 3D
    // Trong Cylinder/Sphere UV, mặt trước (-Z) nằm ở trung tâm u = 0.5
    fCtx.fillStyle = '#e8c3b0';
    fCtx.fillRect(0, 0, 512, 512);

    // Vẽ vùng da mặt mở rộng rồi làm mềm viền (feathering) để hòa quyện 100% vào đầu 3D
    fCtx.save();
    fCtx.beginPath();
    fCtx.ellipse(256, 262, 165, 205, 0, 0, Math.PI * 2);
    fCtx.clip();
    // Đảo chiều ngang UV trên mặt trụ phía trước (-Z) để giữ đúng chiều trái-phải như trong ảnh gốc humanb.jpg
    fCtx.translate(512, 0);
    fCtx.scale(-1, 1);
    // Vùng khuôn mặt trong humanb.jpg: x từ 45.5% đến 69.5%, y từ 21.5% đến 48.5%
    fCtx.drawImage(
      humanImg,
      iw * 0.455,
      ih * 0.215,
      iw * 0.24,
      ih * 0.27,
      90,
      52,
      332,
      415
    );
    fCtx.restore();

    // Làm dịu viền chuyển tiếp giữa ảnh mặt thật và màu da quanh thái dương/cằm
    const grad = fCtx.createRadialGradient(256, 262, 115, 256, 262, 185);
    grad.addColorStop(0, 'rgba(232, 195, 176, 0)');
    grad.addColorStop(0.75, 'rgba(232, 195, 176, 0.15)');
    grad.addColorStop(1, 'rgba(232, 195, 176, 1)');
    fCtx.fillStyle = grad;
    fCtx.fillRect(0, 0, 512, 512);
    faceTex.needsUpdate = true;

    // B. Ánh xạ phần thân áo sơ mi trắng + cà vạt đen thật từ /humanb.jpg
    sCtx.fillStyle = '#eff2f9';
    sCtx.fillRect(0, 0, 512, 512);
    // Vùng áo sơ mi & cà vạt trong humanb.jpg: x từ 27% đến 73%, y từ 49% đến 98%
    sCtx.drawImage(
      humanImg,
      iw * 0.27,
      ih * 0.49,
      iw * 0.46,
      ih * 0.49,
      0,
      0,
      512,
      512
    );
    shirtTex.needsUpdate = true;
  };
  humanImg.src = '/humanb.jpg';

  // Vật liệu PBR tự nhiên
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xe8c3b0,
    roughness: 0.58,
    metalness: 0.04
  });
  const photoFaceMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.52,
    metalness: 0.04
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x141318,
    roughness: 0.72,
    metalness: 0.12
  });
  const whiteShirtMat = new THREE.MeshStandardMaterial({
    color: 0xf1f4fb,
    roughness: 0.62,
    metalness: 0.03
  });
  const photoShirtMat = new THREE.MeshStandardMaterial({
    map: shirtTex,
    roughness: 0.58,
    metalness: 0.04
  });
  const blackTieMat = new THREE.MeshStandardMaterial({
    color: 0x15161c,
    roughness: 0.38,
    metalness: 0.18
  });
  const darkSlacksMat = new THREE.MeshStandardMaterial({
    color: 0x161922,
    roughness: 0.7,
    metalness: 0.08
  });
  const leatherShoeMat = new THREE.MeshStandardMaterial({
    color: 0x0c0d10,
    roughness: 0.28,
    metalness: 0.35
  });

  // ==========================================================================
  // 1. CỔ & ĐẦU 3D GIẢI PHẪU TỰ NHIÊN + MÁI TÓC ĐEN RẼ NGÔI 6/4 BỒNG BỀNH
  // ==========================================================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.49, 0);

  // Cổ người tự nhiên nối liền đầu và cổ áo sơ mi
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.072, 0.14, 18), skinMat);
  neckMesh.position.set(0, -0.14, 0.01);
  headGroup.add(neckMesh);

  // Khối hộp sọ & gương mặt Oval tự nhiên (Xoay mặt chính của Sphere/Cylinder về hướng -Z)
  const craniumGeo = new THREE.SphereGeometry(0.142, 28, 24);
  craniumGeo.scale(0.96, 1.18, 0.98);
  const craniumMesh = new THREE.Mesh(craniumGeo, skinMat);
  headGroup.add(craniumMesh);

  // Lớp mặt nạ 3D cong nhẹ ôm sát phía trước mặt (-Z) hiển thị ảnh khuôn mặt thật từ /humanb.jpg
  const faceMaskGeo = new THREE.CylinderGeometry(0.138, 0.122, 0.27, 28, 1, true, Math.PI * 0.68, Math.PI * 0.64);
  faceMaskGeo.scale(0.98, 1.0, 0.92);
  const faceMaskMesh = new THREE.Mesh(faceMaskGeo, photoFaceMat);
  faceMaskMesh.position.set(0, -0.01, -0.012);
  headGroup.add(faceMaskMesh);

  // Sống mũi 3D nổi nhẹ giúp góc nhìn nghiêng 3/4 có chiều sâu thật như người thật
  const noseBridge = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.055, 10), skinMat);
  noseBridge.position.set(0, -0.008, -0.142);
  noseBridge.rotation.x = -0.18;
  headGroup.add(noseBridge);

  // Hai vành tai 3D hai bên thái dương
  [-0.136, 0.136].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), skinMat);
    ear.scale.set(0.45, 1.15, 0.7);
    ear.position.set(ex, -0.005, 0.005);
    headGroup.add(ear);
  });

  // MÁI TÓC ĐEN 6/4 BỒNG BỀNH ĐIÊU KHẮC 3D (Sát theo kiểu tóc trong ảnh /humanb.jpg)
  const hairGroup = new THREE.Group();

  // Vòm tóc dày trên đỉnh đầu & sau gáy
  const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.154, 24, 20), hairMat);
  hairCrown.scale.set(1.02, 1.06, 1.05);
  hairCrown.position.set(0, 0.042, 0.018);
  hairGroup.add(hairCrown);

  // Phần tóc gáy cắt gọn ôm cổ
  const hairNape = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.105, 0.14, 16), hairMat);
  hairNape.position.set(0, -0.035, 0.045);
  hairGroup.add(hairNape);

  // Các lọn tóc mái rẽ ngôi 6/4 uốn cong rủ xuống trán và hai bên thái dương
  const createCurvedHairLock = (x, y, z, rx, ry, rz, sx, sy, sz) => {
    const lock = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 12), hairMat);
    lock.scale.set(sx, sy, sz);
    lock.position.set(x, y, z);
    lock.rotation.set(rx, ry, rz);
    hairGroup.add(lock);
  };

  // Mái bên trái (phần 6 - dày và uốn phồng nhẹ qua chân mày)
  createCurvedHairLock(-0.058, 0.095, -0.105, 0.35, 0.2, 0.32, 1.25, 0.85, 0.95);
  createCurvedHairLock(-0.105, 0.055, -0.075, 0.2, 0.35, 0.48, 0.95, 1.15, 0.9);
  // Mái giữa rủ nhẹ xuống trán (như trong ảnh humanb.jpg)
  createCurvedHairLock(-0.012, 0.072, -0.132, 0.42, 0.05, 0.12, 0.55, 0.95, 0.55);
  // Mái bên phải (phần 4 - ôm gọn thái dương phải)
  createCurvedHairLock(0.065, 0.092, -0.102, 0.35, -0.2, -0.35, 1.15, 0.85, 0.92);
  createCurvedHairLock(0.108, 0.052, -0.072, 0.2, -0.35, -0.5, 0.9, 1.12, 0.88);

  headGroup.add(hairGroup);

  // Đèn trợ sáng dịu nhẹ chiếu riêng cho gương mặt khi người chơi bật góc nhìn thứ 3 [U]
  const faceFillLight = new THREE.PointLight(0xfff6eb, 1.2, 2.4);
  faceFillLight.position.set(0, 0.08, -0.65);
  headGroup.add(faceFillLight);

  group.add(headGroup);

  // ==========================================================================
  // 2. THÂN TRÊN: ÁO SƠ MI TRẮNG NGẮN TAY + CỔ BẺ 3D + CÀ VẠT ĐEN NỔI 3D (GIỐNG ẢNH)
  // ==========================================================================
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 1.03, 0);

  // Thân áo sơ mi trắng có phom vai rộng nam tính, hơi thuôn nhẹ ở eo
  const chestGeo = new THREE.CylinderGeometry(0.215, 0.182, 0.58, 24);
  chestGeo.scale(1.06, 1.0, 0.62);
  const chestBackMesh = new THREE.Mesh(chestGeo, whiteShirtMat);
  torsoGroup.add(chestBackMesh);

  // Mặt trước ngực áo ánh xạ trực tiếp từ bức ảnh /humanb.jpg
  const frontChestGeo = new THREE.PlaneGeometry(0.41, 0.56, 8, 8);
  // Uốn cong nhẹ mặt áo theo lồng ngực
  const posAttr = frontChestGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const px = posAttr.getX(i);
    posAttr.setZ(i, Math.cos(px * 4.2) * 0.025);
  }
  frontChestGeo.computeVertexNormals();
  const frontChestMesh = new THREE.Mesh(frontChestGeo, photoShirtMat);
  frontChestMesh.position.set(0, 0, -0.105);
  frontChestMesh.rotation.y = Math.PI; // Hướng mặt ra phía trước (-Z)
  torsoGroup.add(frontChestMesh);

  // Cổ áo sơ mi trắng bẻ chữ V nổi khối 3D
  [-0.058, 0.058].forEach((cx, idx) => {
    const collarWing = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.065, 0.025), whiteShirtMat);
    collarWing.position.set(cx, 0.275, -0.095);
    collarWing.rotation.z = idx === 0 ? -0.42 : 0.42;
    collarWing.rotation.y = idx === 0 ? 0.25 : -0.25;
    torsoGroup.add(collarWing);
  });

  // Cà vạt đen 3D nổi khối trên ngực áo (Nút thắt Windsor + Thân cà vạt đen giống hệt ảnh humanb.jpg)
  const tieKnot = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.055, 6), blackTieMat);
  tieKnot.rotation.z = Math.PI;
  tieKnot.scale.set(1.1, 1.0, 0.55);
  tieKnot.position.set(0, 0.245, -0.122);
  torsoGroup.add(tieKnot);

  const tieBlade = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.42, 0.016), blackTieMat);
  tieBlade.position.set(0, 0.02, -0.124);
  torsoGroup.add(tieBlade);

  const tieTip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.06, 4), blackTieMat);
  tieTip.rotation.z = Math.PI;
  tieTip.rotation.y = Math.PI / 4;
  tieTip.scale.set(1.0, 1.0, 0.35);
  tieTip.position.set(0, -0.215, -0.124);
  torsoGroup.add(tieTip);

  group.add(torsoGroup);

  // ==========================================================================
  // 3. HAI CÁNH TAY: TAY ÁO SƠ MI TRẮNG NGẮN TAY RỘNG + CẲNG TAY & BÀN TAY TRẦN
  // ==========================================================================
  const createRealisticArm = (isRight) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(isRight ? 0.255 : -0.255, 1.27, 0);

    // Khớp vai tròn
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.078, 14, 14), whiteShirtMat);
    armPivot.add(shoulder);

    // Ống tay áo sơ mi trắng ngắn tay hơi xòe tự nhiên như trong ảnh humanb.jpg
    const shortSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.086, 0.24, 16), whiteShirtMat);
    shortSleeve.position.set(0, -0.11, 0);
    shortSleeve.rotation.z = isRight ? -0.06 : 0.06;
    armPivot.add(shortSleeve);

    // Cẳng tay trần màu da tự nhiên
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.044, 0.29, 16), skinMat);
    forearm.position.set(0, -0.34, 0);
    armPivot.add(forearm);

    // Bàn tay 3D
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 12), skinMat);
    hand.scale.set(0.85, 1.25, 0.65);
    hand.position.set(0, -0.50, 0);
    armPivot.add(hand);

    return armPivot;
  };

  const leftArm = createRealisticArm(false);
  const rightArm = createRealisticArm(true);
  group.add(leftArm, rightArm);

  // Vũ khí cầm trên tay phải ở góc nhìn thứ 3
  const tpPistol = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.13, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x222832, metalness: 0.75, roughness: 0.25 })
  );
  tpPistol.position.set(0, -0.50, -0.11);
  tpPistol.visible = false;
  rightArm.add(tpPistol);

  // ==========================================================================
  // 4. HÔNG, QUẦN ÂU TỐI MÀU & GIÀY DA ĐEN LỊCH LÃM
  // ==========================================================================
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.18, 0.14, 20), darkSlacksMat);
  pelvis.scale.set(1.05, 1.0, 0.64);
  pelvis.position.set(0, 0.72, 0);
  group.add(pelvis);

  const createRealisticLeg = (isRight) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(isRight ? 0.105 : -0.105, 0.68, 0);

    // Ống quần âu suông lịch sự
    const trouserLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.076, 0.58, 16), darkSlacksMat);
    trouserLeg.position.set(0, -0.29, 0);
    legPivot.add(trouserLeg);

    // Giày tây da đen bóng có mũi giày bo tròn
    const shoeHeel = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.075, 0.11, 14), leatherShoeMat);
    shoeHeel.position.set(0, -0.62, 0.01);
    const shoeToe = new THREE.Mesh(new THREE.SphereGeometry(0.074, 14, 12), leatherShoeMat);
    shoeToe.scale.set(0.95, 0.65, 1.55);
    shoeToe.position.set(0, -0.635, -0.055);
    legPivot.add(shoeHeel, shoeToe);

    return legPivot;
  };

  const leftLeg = createRealisticLeg(false);
  const rightLeg = createRealisticLeg(true);
  group.add(leftLeg, rightLeg);

  let walkPhase = 0;

  group.setHeldItem = (itemId) => {
    tpPistol.visible = !!(itemId === 'pistol' || itemId === 'service_pistol' || itemId === 'combat_knife' || itemId === 'knife');
  };

  group.updateAnimation = (delta, isMoving, isRunning, pitch = 0) => {
    headGroup.rotation.x = THREE.MathUtils.clamp(pitch * 0.65, -0.5, 0.5);
    if (isMoving) {
      walkPhase += delta * (isRunning ? 13 : 8.5);
      const swing = Math.sin(walkPhase) * (isRunning ? 0.62 : 0.42);
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.72;
      rightArm.rotation.x = tpPistol.visible ? 0.45 + swing * 0.15 : swing * 0.72;
    } else {
      // Nhịp thở tự nhiên khi đứng yên
      const breath = Math.sin(performance.now() * 0.0025) * 0.015;
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.2);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.2);
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, breath, 0.2);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, tpPistol.visible ? 0.45 : -breath, 0.2);
    }
  };

  group.userData = {
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    tpPistol
  };

  return group;
}


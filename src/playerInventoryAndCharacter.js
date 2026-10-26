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
      <!-- THANH 9 Ô HOTBAR DƯỚI ĐÁY MÀN HÌNH (Hiện khi uiState === 1 hoặc 2) -->
      <div class="mc-hotbar-wrapper" id="mc-hotbar-wrapper" style="display: none;">
        <div class="mc-selected-item-label" id="mc-selected-item-label">Đèn Pin Chiến Thuật</div>
        <div class="mc-hotbar-grid" id="mc-hotbar-grid"></div>
        <div class="mc-hotbar-subhint">[1-9 / Lăn chuột] Chọn ô • [Q] Ném đồ đang cầm • [G] Mở túi đồ / Ẩn thanh</div>
      </div>

      <!-- BẢNG TÚI ĐỒ ĐẦY ĐỦ + NHÂN VẬT CẢNH SÁT AN (Hiện khi uiState === 2) -->
      <div class="mc-full-inventory-backdrop" id="mc-full-inventory-backdrop" style="display: none;">
        <div class="mc-inventory-window">
          <div class="mc-inv-header">
            <span>⚜ TÚI ĐỒ & TRANG BỊ SĨ QUAN TUẦN TRA AN</span>
            <span class="mc-inv-close-hint">[Nhấn G lần nữa để đóng & ẩn thanh 9 ô]</span>
          </div>

          <!-- Khu vực nửa trên: Khung trang bị giáp + Mô hình Nhân vật Cảnh Sát + Thông tin chi tiết -->
          <div class="mc-inv-top-section">
            <!-- 4 Ô Trang phục Cảnh Sát -->
            <div class="mc-armor-column">
              <div class="mc-slot armor-equipped" title="Mái tóc đen rẽ ngôi 6/4"><span class="slot-icon">💇🏻‍♂️</span></div>
              <div class="mc-slot armor-equipped" title="Áo sơ mi trắng Cảnh Sát & Cà vạt đen + Huy hiệu"><span class="slot-icon">👔</span></div>
              <div class="mc-slot armor-equipped" title="Quần âu chiến thuật Cảnh Sát & Đai đeo súng"><span class="slot-icon">👖</span></div>
              <div class="mc-slot armor-equipped" title="Giày da tuần tra chống trượt"><span class="slot-icon">👞</span></div>
            </div>

            <!-- Ô Xem Trước Nhân Vật Cảnh Sát An (Vẽ theo ảnh chân dung MinhPhuc00Ne / Jos) -->
            <div class="mc-character-preview-box" id="mc-character-preview-box">
              <canvas id="mc-character-canvas" width="210" height="250"></canvas>
              <div class="mc-char-nametag">SĨ QUAN AN (PATROL-07)</div>
            </div>

            <!-- Ô Tay Phụ & Khung Chi Tiết Vật Phẩm Đang Chọn -->
            <div class="mc-item-inspector" id="mc-item-inspector">
              <div class="mc-inspector-title" id="mc-insp-title">Đèn Pin Chiến Thuật</div>
              <div class="mc-inspector-desc" id="mc-insp-desc">Đèn pin cảnh sát công suất cao. Nhấn [F] để bật/tắt.</div>
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
    this.portraitCanvas = this.rootEl.querySelector('#mc-character-canvas');

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
      if (this.uiState === 2) {
        this.drawOfficerAnPortrait();
      }
    });

    this.renderUI();
  }

  // Chu trình 3 trạng thái khi bấm phím G:
  // Lần 1 (0 -> 1): Hiện thanh 9 ô bên dưới
  // Lần 2 (1 -> 2): Mở toàn bộ túi đồ + Nhân vật Cảnh Sát An
  // Lần 3 (2 -> 0): Đóng túi đồ và ẩn luôn thanh 9 ô
  cycleInventoryState(canvasForPointerLock = null) {
    this.uiState = (this.uiState + 1) % 3;
    audioManager.playClick();

    if (this.uiState === 2) {
      document.exitPointerLock?.();
      this.drawOfficerAnPortrait();
    } else if (this.uiState === 0 && canvasForPointerLock) {
      canvasForPointerLock.requestPointerLock?.();
    }
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

    // Ẩn/hiện theo đúng 3 trạng thái của phím G:
    // uiState === 0: Không hiện gì
    // uiState === 1: Chỉ hiện thanh 9 ô dưới đáy
    // uiState === 2: Hiện bảng túi đồ đầy đủ + thanh 9 ô
    this.hotbarWrapperEl.style.display = (this.uiState === 1 || this.uiState === 2) ? 'flex' : 'none';
    this.fullInvBackdropEl.style.display = (this.uiState === 2) ? 'flex' : 'none';

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
    if (!this.portraitCanvas) return;
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
// HÀM DỰNG MÔ HÌNH 3D NHÂN VẬT CẢNH SÁT AN (DÙNG KHI ẤN PHÍM [U] ĐỔI GÓC NHÌN)
// Thiết kế theo đúng bức ảnh chân dung người dùng gửi:
// Tóc đen hai mái 6/4 bồng bềnh, gương mặt sáng, áo sơ mi trắng Cảnh Sát + cà vạt đen,
// cầu vai cảnh sát, huy hiệu vàng trên ngực, đai đeo súng & quần âu xanh đen.
// ============================================================================
export function createOfficerAn3DCharacter() {
  const group = new THREE.Group();

  // Tạo Canvas Texture khuôn mặt của An (MinhPhuc00Ne / Jos) cho khối đầu 3D
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 256;
  faceCanvas.height = 256;
  const fCtx = faceCanvas.getContext('2d');
  fCtx.fillStyle = '#f2c8ad';
  fCtx.fillRect(0, 0, 256, 256);

  // Hồng nhẹ hai bên má
  fCtx.fillStyle = 'rgba(215, 120, 110, 0.25)';
  fCtx.beginPath();
  fCtx.arc(68, 150, 24, 0, Math.PI * 2);
  fCtx.arc(188, 150, 24, 0, Math.PI * 2);
  fCtx.fill();

  // Lông mày đen đậm
  fCtx.fillStyle = '#151318';
  fCtx.fillRect(52, 92, 52, 10);
  fCtx.fillRect(152, 92, 52, 10);

  // Đôi mắt hai mí sắc nét
  [78, 178].forEach(ex => {
    fCtx.fillStyle = '#ffffff';
    fCtx.beginPath();
    fCtx.ellipse(ex, 118, 22, 13, 0, 0, Math.PI * 2);
    fCtx.fill();
    fCtx.fillStyle = '#1b110c';
    fCtx.beginPath();
    fCtx.arc(ex, 118, 11, 0, Math.PI * 2);
    fCtx.fill();
    fCtx.fillStyle = '#ffffff';
    fCtx.beginPath();
    fCtx.arc(ex - 4, 114, 4, 0, Math.PI * 2);
    fCtx.fill();
  });

  // Sống mũi & Môi mỉm cười nhẹ giống ảnh
  fCtx.strokeStyle = '#c99274';
  fCtx.lineWidth = 5;
  fCtx.beginPath();
  fCtx.moveTo(128, 115);
  fCtx.lineTo(123, 162);
  fCtx.lineTo(136, 165);
  fCtx.stroke();

  fCtx.fillStyle = '#c46862';
  fCtx.beginPath();
  fCtx.ellipse(128, 196, 28, 10, 0, 0, Math.PI * 2);
  fCtx.fill();

  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;

  // Tạo Canvas Texture Áo Sơ Mi Trắng + Cà Vạt Đen + Huy Hiệu Cảnh Sát
  const shirtCanvas = document.createElement('canvas');
  shirtCanvas.width = 256;
  shirtCanvas.height = 256;
  const sCtx = shirtCanvas.getContext('2d');
  sCtx.fillStyle = '#f2f5fa';
  sCtx.fillRect(0, 0, 256, 256);

  // Cổ áo sơ mi trắng chữ V
  sCtx.strokeStyle = '#c5cdd9';
  sCtx.lineWidth = 4;
  sCtx.strokeRect(165, 65, 55, 62); // Túi áo ngực

  // Huy hiệu cảnh sát ngôi sao vàng trên ngực áo
  sCtx.fillStyle = '#ffd166';
  sCtx.beginPath();
  sCtx.arc(192, 45, 15, 0, Math.PI * 2);
  sCtx.fill();

  // Cà vạt đen chạy dọc chính giữa ngực áo
  sCtx.fillStyle = '#121318';
  sCtx.beginPath();
  sCtx.moveTo(112, 8);
  sCtx.lineTo(144, 8);
  sCtx.lineTo(136, 32);
  sCtx.lineTo(120, 32);
  sCtx.closePath();
  sCtx.fill();

  sCtx.beginPath();
  sCtx.moveTo(120, 32);
  sCtx.lineTo(136, 32);
  sCtx.lineTo(146, 195);
  sCtx.lineTo(128, 224);
  sCtx.lineTo(110, 195);
  sCtx.closePath();
  sCtx.fill();

  const shirtTex = new THREE.CanvasTexture(shirtCanvas);
  shirtTex.colorSpace = THREE.SRGBColorSpace;

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0c4a8, roughness: 0.65 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.8 });
  const whiteShirtMat = new THREE.MeshStandardMaterial({ color: 0xf2f5fa, roughness: 0.6 });
  const frontShirtMat = new THREE.MeshStandardMaterial({ map: shirtTex, roughness: 0.55 });
  const navyPantsMat = new THREE.MeshStandardMaterial({ color: 0x121826, roughness: 0.75 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x0a0b0e, roughness: 0.4, metalness: 0.2 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.8, roughness: 0.25 });

  // 1. ĐẦU & MÁI TÓC ĐEN RẼ NGÔI 6/4 (Head & Layered Curtain Hair)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.48, 0);

  const headMaterials = [
    skinMat, // right
    skinMat, // left
    hairMat, // top
    skinMat, // bottom
    skinMat, // back (+z)
    new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.6 }) // front (-z là hướng nhìn của nhân vật)
  ];
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.30, 0.28), headMaterials);
  headGroup.add(headMesh);

  // Phần tóc đen dày phía trên, sau gáy và hai lọn mái 6/4 rủ trước trán
  const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.305, 0.11, 0.305), hairMat);
  hairTop.position.set(0, 0.12, 0);
  headGroup.add(hairTop);

  const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.24, 0.08), hairMat);
  hairBack.position.set(0, 0.04, 0.12);
  headGroup.add(hairBack);

  // Lọn tóc mái rẽ ngôi 6/4 trước trán
  const bangLeft = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.11, 0.05), hairMat);
  bangLeft.position.set(-0.075, 0.08, -0.145);
  bangLeft.rotation.z = 0.18;
  headGroup.add(bangLeft);

  const bangRight = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.10, 0.05), hairMat);
  bangRight.position.set(0.08, 0.085, -0.145);
  bangRight.rotation.z = -0.15;
  headGroup.add(bangRight);

  group.add(headGroup);

  // 2. THÂN TRÊN: ÁO SƠ MI TRẮNG CẢNH SÁT + CÀ VẠT ĐEN + CẦU VAI
  const torsoMaterials = [
    whiteShirtMat,
    whiteShirtMat,
    whiteShirtMat,
    whiteShirtMat,
    whiteShirtMat, // mặt lưng (+z)
    frontShirtMat  // mặt ngực có cà vạt đen (-z)
  ];
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.22), torsoMaterials);
  torso.position.set(0, 1.04, 0);
  torso.castShadow = true;
  group.add(torso);

  // Cầu vai Cảnh Sát hai bên vai
  [-0.16, 0.16].forEach(ex => {
    const epaulet = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.18), navyPantsMat);
    epaulet.position.set(ex, 1.33, 0);
    group.add(epaulet);
    const goldStrip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.185), goldMat);
    goldStrip.position.set(ex, 1.33, 0);
    group.add(goldStrip);
  });

  // Đai lưng chiến thuật Cảnh Sát + Bao súng bên hông
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.07, 0.24), bootMat);
  belt.position.set(0, 0.75, 0);
  group.add(belt);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.25), goldMat);
  buckle.position.set(0, 0.75, 0);
  group.add(buckle);

  // 3. HAI CÁNH TAY (Tay áo sơ mi trắng ngắn tay + Cánh tay trần giống ảnh)
  const createArm = (isRight) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(isRight ? 0.29 : -0.29, 1.26, 0);

    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.14), whiteShirtMat);
    sleeve.position.set(0, -0.09, 0);
    armPivot.add(sleeve);

    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.32, 0.115), skinMat);
    forearm.position.set(0, -0.34, 0);
    armPivot.add(forearm);

    return armPivot;
  };

  const leftArm = createArm(false);
  const rightArm = createArm(true);
  group.add(leftArm);
  group.add(rightArm);

  // Vũ khí cầm trên tay phải ở góc nhìn thứ 3
  const tpPistol = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.14, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x88929e, metalness: 0.5, roughness: 0.3 })
  );
  tpPistol.position.set(0, -0.48, -0.12);
  rightArm.add(tpPistol);

  // 4. HAI CHÂN (Quần âu Cảnh Sát xanh đen & Giày da đen)
  const createLeg = (isRight) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(isRight ? 0.11 : -0.11, 0.72, 0);

    const trouser = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.58, 0.18), navyPantsMat);
    trouser.position.set(0, -0.29, 0);
    legPivot.add(trouser);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.25), bootMat);
    boot.position.set(0, -0.65, -0.03);
    legPivot.add(boot);

    return legPivot;
  };

  const leftLeg = createLeg(false);
  const rightLeg = createLeg(true);
  group.add(leftLeg);
  group.add(rightLeg);

  let walkPhase = 0;

  group.setHeldItem = (itemId) => {
    tpPistol.visible = !!(itemId === 'pistol' || itemId === 'service_pistol' || itemId === 'combat_knife' || itemId === 'knife');
  };

  group.updateAnimation = (delta, isMoving, isRunning, pitch = 0) => {
    headGroup.rotation.x = THREE.MathUtils.clamp(pitch * 0.65, -0.5, 0.5);
    if (isMoving) {
      walkPhase += delta * (isRunning ? 13 : 8.5);
      const swing = Math.sin(walkPhase) * (isRunning ? 0.65 : 0.45);
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.75;
      rightArm.rotation.x = tpPistol.visible ? 0.45 + swing * 0.15 : swing * 0.75;
    } else {
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.2);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.2);
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, 0.2);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, tpPistol.visible ? 0.45 : 0, 0.2);
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


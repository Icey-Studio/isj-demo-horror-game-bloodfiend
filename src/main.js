import './style.css';
import { audioManager } from './audio.js';
import { PixelBackground } from './pixelBackground.js';
import { DrivingScene3D } from './drivingScene3D.js';
import { HorrorWorld3D } from './horrorWorld3D.js';

// Khởi tạo Game Menu & Controller Chuyển Đổi Linh Hoạt 2D / 3D
document.addEventListener('DOMContentLoaded', () => {
  let canvas = document.getElementById('pixel-canvas');
  let currentBackground = new PixelBackground(canvas);
  let currentDrivingScene = null;
  let currentWorld3D = null;

  // Hàm làm mới Canvas để chuyển đổi mượt mà giữa Context 2D và WebGL 3D
  function resetCanvas() {
    const oldCanvas = document.getElementById('pixel-canvas');
    if (oldCanvas && oldCanvas.parentNode) {
      const newCanvas = document.createElement('canvas');
      newCanvas.id = 'pixel-canvas';
      oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
      canvas = newCanvas;
      return newCanvas;
    }
    return canvas;
  }

  // Tham chiếu các phần tử DOM
  const mainMenu = document.getElementById('main-menu');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');
  const audioLabel = document.getElementById('audio-label');

  const btnPlay = document.getElementById('btn-play');
  const btnSettings = document.getElementById('btn-settings');
  const btnLore = document.getElementById('btn-lore');

  const modalModeSelect = document.getElementById('modal-mode-select');
  const modalSettings = document.getElementById('modal-settings');
  const modalLore = document.getElementById('modal-lore');

  const volumeSlider = document.getElementById('master-volume');
  const volumeValText = document.getElementById('volume-val');
  const crtToggle = document.getElementById('crt-toggle');
  const crtOverlay = document.querySelector('.crt-overlay');

  const gameTransition = document.getElementById('game-transition');
  const transitionTitle = document.getElementById('transition-mode-title');
  const transitionDesc = document.getElementById('transition-mode-desc');
  const btnStartGameplay = document.getElementById('btn-start-gameplay');

  let selectedMode = 'survival';

  // Quản lý âm thanh
  audioToggleBtn.addEventListener('click', () => {
    const isPlaying = audioManager.toggleMute();
    updateAudioUI(isPlaying);
  });

  function updateAudioUI(isPlaying) {
    audioIcon.textContent = isPlaying ? '🔊' : '🔇';
    audioLabel.textContent = isPlaying ? 'Âm Thanh: BẬT' : 'Âm Thanh: TẮT';
  }

  // Hiệu ứng âm thanh nút bấm
  const allButtons = document.querySelectorAll('.pixel-btn, .pixel-icon-btn, .modal-close');
  allButtons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      audioManager.playHover();
    });
    btn.addEventListener('click', () => {
      audioManager.playClick();
    });
  });

  // Mở các Modal
  btnPlay.addEventListener('click', () => {
    openModal(modalModeSelect);
  });

  btnSettings.addEventListener('click', () => {
    openModal(modalSettings);
  });

  btnLore.addEventListener('click', () => {
    openModal(modalLore);
  });

  // Đóng Modal khi bấm nút đóng hoặc nút quay lại
  document.querySelectorAll('[data-close]').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      const modalId = closeBtn.getAttribute('data-close');
      const targetModal = document.getElementById(modalId);
      if (targetModal) closeModal(targetModal);
    });
  });

  // Đóng modal khi bấm phím ESC (nếu menu đang mở)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainMenu.style.display !== 'none') {
      const activeModal = document.querySelector('.pixel-modal.active');
      if (activeModal) closeModal(activeModal);
    }
  });

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
  }

  // Tùy chỉnh Cài đặt
  volumeSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    volumeValText.textContent = `${val}%`;
    audioManager.setVolume(val / 100);
  });

  crtToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      crtOverlay.style.display = 'block';
    } else {
      crtOverlay.style.display = 'none';
    }
  });

  // Xử lý chọn Chế độ chơi: Sinh Tồn hoặc Sáng Tạo
  document.querySelectorAll('.btn-select-mode').forEach(btn => {
    btn.addEventListener('click', (e) => {
      selectedMode = btn.getAttribute('data-mode');
      closeModal(modalModeSelect);

      if (selectedMode === 'survival') {
        // Vào thẳng Hoạt cảnh Trong Xe 3D Góc Nhìn Thứ Nhất!
        start3DDrivingScene();
      } else {
        // Chế độ Sáng Tạo: Vào thẳng không gian 3D First-Person để tự do bay lượn & khảo sát biệt thự
        startFirstPersonMode('creative');
      }
    });
  });

  // 1. Khởi động Hoạt Cảnh Trong Xe 3D Góc Nhìn Thứ Nhất (3D In-Car Driving Scene)
  function start3DDrivingScene() {
    if (audioManager.isMuted) {
      audioManager.toggleMute();
      updateAudioUI(true);
    }

    mainMenu.style.display = 'none';
    gameTransition.classList.remove('active');

    if (currentBackground) {
      currentBackground.destroy();
      currentBackground = null;
    }

    const freshCanvas = resetCanvas();

    currentDrivingScene = new DrivingScene3D(
      freshCanvas,
      // Khi xe dừng và hoàn tất hội thoại -> Bước xuống xe vào 3D First-Person!
      () => {
        startFirstPersonMode('survival');
      },
      // Quay lại Menu nếu người chơi bấm ESC
      () => {
        returnToMainMenu();
      }
    );
  }

  // 2. Khởi động Khám Phá 3D Góc Nhìn Thứ Nhất Ngoài Xe (First-Person 3D World)
  function startFirstPersonMode(mode = 'survival') {
    if (audioManager.isMuted) {
      audioManager.toggleMute();
      updateAudioUI(true);
    }

    if (currentDrivingScene) {
      currentDrivingScene.destroy();
      currentDrivingScene = null;
    }
    if (currentBackground) {
      currentBackground.destroy();
      currentBackground = null;
    }

    mainMenu.style.display = 'none';
    gameTransition.classList.remove('active');

    const freshCanvas = resetCanvas();

    currentWorld3D = new HorrorWorld3D(freshCanvas, () => {
      returnToMainMenu();
    }, { mode });
  }

  // 3. Quay lại Menu Chính (2D Pixel Art)
  function returnToMainMenu() {
    if (currentDrivingScene) {
      currentDrivingScene.destroy();
      currentDrivingScene = null;
    }
    if (currentWorld3D) {
      currentWorld3D.destroy();
      currentWorld3D = null;
    }

    const freshCanvas = resetCanvas();
    mainMenu.style.display = 'flex';
    currentBackground = new PixelBackground(freshCanvas);
  }

  // Nút bắt đầu từ màn hình chuyển tiếp Sáng Tạo
  btnStartGameplay.addEventListener('click', () => {
    startFirstPersonMode(selectedMode);
  });
});

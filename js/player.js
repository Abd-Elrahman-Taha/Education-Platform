/* ==========================================================================
   Syntax EdTech - DRM Video Player & Dynamic HTML5 Canvas Watermark Overlay
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initDRMPlayer();
});

window.initDRMPlayerCanvas = function() {
  const canvas = document.getElementById('watermark-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let x = 30;
  let y = 50;
  let dx = 1.8;
  let dy = 1.4;

  const studentName = "أحمد محمد محمود (الطالب)";
  const studentCode = "CODE: #94021";
  const ipAddress = "IP: 197.34.88.12";

  function resizeCanvas() {
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function drawWatermark() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw translucent background container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, 220, 52, 10);
    ctx.fill();
    ctx.stroke();

    // Draw text inside canvas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '600 12px Cairo, sans-serif';
    ctx.fillText(`${studentName}`, x + 12, y + 20);
    
    ctx.fillStyle = '#67E8F9';
    ctx.font = '700 11px monospace';
    ctx.fillText(`${studentCode} • ${ipAddress}`, x + 12, y + 38);

    // Bounce physics
    if (x + 220 >= canvas.width || x <= 0) dx = -dx;
    if (y + 52 >= canvas.height || y <= 0) dy = -dy;

    x += dx;
    y += dy;

    requestAnimationFrame(drawWatermark);
  }

  drawWatermark();
};

function initDRMPlayer() {
  const playBtn = document.getElementById('drm-play-btn');
  const video = document.getElementById('drm-video-element');
  const sourceSelect = document.getElementById('drm-source-select');

  if (playBtn && video) {
    playBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play().catch(() => showToast("Simulated Video Stream Active"));
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        showToast("DRM Secure Stream Playing with Dynamic Watermark");
      } else {
        video.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
    });
  }

  if (sourceSelect) {
    sourceSelect.addEventListener('change', (e) => {
      showToast(`Switched DRM Video Source to: ${e.target.value}`);
    });
  }

  // Prevent right-click on video container to deter basic scraping
  const videoContainer = document.querySelector('.drm-player-container');
  if (videoContainer) {
    videoContainer.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}

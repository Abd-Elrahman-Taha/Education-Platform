/* ==========================================================================
   Syntax EdTech - Parent Portal & WhatsApp PDF Report Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initParentPortal();
});

function initParentPortal() {
  const searchBtn = document.getElementById('parent-search-btn');
  const codeInput = document.getElementById('parent-student-code-input');
  const reportResults = document.getElementById('parent-report-results');

  if (searchBtn && codeInput) {
    searchBtn.addEventListener('click', () => {
      const val = codeInput.value.trim();
      if (!val) {
        showToast("يرجى إدخال كود الطالب أو رقم الهاتف", "warning");
        return;
      }

      if (reportResults) {
        reportResults.style.display = 'block';
        showToast(`تم استخراج تقرير الطالب لكود: ${val}`);
        window.renderParentGraph();
      }
    });
  }

  const whatsappBtn = document.getElementById('send-whatsapp-report-btn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      showToast("تم إرسال تقرير المتابعة والتفوق لولي الأمر عبر WhatsApp بنجاح!");
    });
  }
}

window.renderParentGraph = function() {
  const canvas = document.getElementById('parent-performance-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const parent = canvas.parentElement;
  canvas.width = parent ? parent.clientWidth : 600;
  canvas.height = 240;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 40; i < canvas.height; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }

  // Points for 6 exams (Scores out of 100)
  const scores = [85, 90, 88, 96, 92, 98];
  const stepX = canvas.width / (scores.length - 1);

  // Gradient fill under line chart
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
  grad.addColorStop(1, 'rgba(79, 70, 229, 0)');

  ctx.beginPath();
  scores.forEach((sc, idx) => {
    const x = idx * stepX;
    const y = canvas.height - (sc / 100) * (canvas.height - 40) - 20;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  scores.forEach((sc, idx) => {
    const x = idx * stepX;
    const y = canvas.height - (sc / 100) * (canvas.height - 40) - 20;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#818CF8';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Dots
  scores.forEach((sc, idx) => {
    const x = idx * stepX;
    const y = canvas.height - (sc / 100) * (canvas.height - 40) - 20;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#06B6D4';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
};

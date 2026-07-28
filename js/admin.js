/* ==========================================================================
   Syntax EdTech - Admin & Assistant Control Panel JS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAdminPanel();
});

function initAdminPanel() {
  const genScratchBtn = document.getElementById('admin-generate-scratch-btn');
  const exportExcelBtn = document.getElementById('admin-export-excel-btn');
  const toggleStudentStatusBtns = document.querySelectorAll('.student-status-toggle');

  if (genScratchBtn) {
    genScratchBtn.addEventListener('click', () => {
      const count = document.getElementById('scratch-card-count-input')?.value || 100;
      showToast(`تم توليد ${count} كارت شحن بنجاح وتصدير كشوفات السنتر Excel!`);
    });
  }

  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
      showToast("جاري تصدير كشوفات الطلاب المفلترة طبقاً لـ 60+ فلتر محدد...");
    });
  }

  toggleStudentStatusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const isBlocked = btn.classList.contains('blocked');
      if (isBlocked) {
        btn.classList.remove('blocked');
        btn.innerHTML = '<i class="fas fa-check-circle"></i> مفعل';
        btn.style.color = 'var(--success)';
        showToast("تم تفعيل حساب الطالب بنجاح");
      } else {
        btn.classList.add('blocked');
        btn.innerHTML = '<i class="fas fa-ban"></i> محظور';
        btn.style.color = 'var(--danger)';
        showToast("تم حظر الطالب ومنعه من دخول الدروس", "warning");
      }
    });
  });
}

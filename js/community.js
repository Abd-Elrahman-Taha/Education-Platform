/* ==========================================================================
   Syntax EdTech - Student Public Community Q&A Feed JS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initCommunityFeed();
});

function initCommunityFeed() {
  const shareBtns = document.querySelectorAll('.post-share-btn');
  const pdfExportBtns = document.querySelectorAll('.post-pdf-btn');

  shareBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const shareModal = document.getElementById('community-share-modal');
      if (shareModal) shareModal.classList.add('active');
    });
  });

  pdfExportBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      showToast("جاري تحضير وتنزيل السؤال والإجابة كملف PDF تنسيقي...");
    });
  });

  const copyShareLinkBtn = document.getElementById('copy-share-link-btn');
  if (copyShareLinkBtn) {
    copyShareLinkBtn.addEventListener('click', () => {
      navigator.clipboard.writeText("https://syntax-edtech.eg/post/894021");
      showToast("تم نسخ رابط السؤال! يتعين على الزائر تسجبل الدخول لرؤية المنشور الكامل.");
    });
  }
}

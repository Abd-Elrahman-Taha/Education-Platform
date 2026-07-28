/* ==========================================================================
   Syntax EdTech - Bubble Sheet & Standard Exam Engine JS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initExamEngine();
  initAntiCheating();
});

let examTabWarnings = 0;
let examTimerSeconds = 30 * 60; // 30 minutes
let timerInterval = null;

function initExamEngine() {
  const modeBtns = document.querySelectorAll('.exam-mode-btn');
  const bubbleLayout = document.getElementById('bubble-sheet-mode-view');
  const singleLayout = document.getElementById('single-question-mode-view');

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode');

      if (mode === 'bubble') {
        if (bubbleLayout) bubbleLayout.style.display = 'grid';
        if (singleLayout) singleLayout.style.display = 'none';
        showToast("Switched to Bubble Sheet Split PDF Mode");
      } else {
        if (bubbleLayout) bubbleLayout.style.display = 'none';
        if (singleLayout) singleLayout.style.display = 'block';
        showToast("Switched to Single Question Mode");
      }
    });
  });

  // Interactive Bubble Circle Click Handlers
  const bubbleCircles = document.querySelectorAll('.bubble-circle');
  bubbleCircles.forEach(circle => {
    circle.addEventListener('click', () => {
      const parentRow = circle.closest('.bubble-question-row');
      if (parentRow) {
        const rowCircles = parentRow.querySelectorAll('.bubble-circle');
        rowCircles.forEach(c => c.classList.remove('selected'));
        circle.classList.add('selected');
      }
    });
  });

  // Submit Exam Trigger
  const submitExamBtn = document.getElementById('submit-exam-btn');
  if (submitExamBtn) {
    submitExamBtn.addEventListener('click', () => {
      finishExam();
    });
  }

  startExamTimer();
}

function startExamTimer() {
  const timerDisplay = document.getElementById('exam-timer-display');
  if (!timerDisplay) return;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    examTimerSeconds--;
    const mins = Math.floor(examTimerSeconds / 60);
    const secs = examTimerSeconds % 60;
    timerDisplay.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (examTimerSeconds <= 0) {
      clearInterval(timerInterval);
      showToast("Time Expired! Auto-submitting exam...", "warning");
      finishExam();
    }
  }, 1000);
}

// Tab Switch Anti-Cheating Detector
function initAntiCheating() {
  document.addEventListener('visibilitychange', () => {
    const examSection = document.getElementById('view-assessment');
    if (examSection && examSection.style.display !== 'none') {
      if (document.hidden) {
        examTabWarnings++;
        const alertBox = document.getElementById('cheating-alert-modal');
        if (alertBox) {
          alertBox.style.display = 'block';
          document.getElementById('warning-count-num').innerText = examTabWarnings;
        }

        if (examTabWarnings >= 3) {
          showToast("Maximum tab switch violations reached! Exam auto-submitted.", "danger");
          finishExam();
        } else {
          showToast(`Warning ${examTabWarnings}/3: Tab switching during exam is prohibited!`, "danger");
        }
      }
    }
  });
}

function finishExam() {
  clearInterval(timerInterval);
  const resultModal = document.getElementById('exam-result-modal');
  if (resultModal) {
    resultModal.classList.add('active');
  }
}

/* ==========================================================================
   Syntax EdTech - Main App Controller & Theme Router
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initModuleSwitcher();
  initModals();
  initStatsCounter();
  initFAQAccordion();
  initPricingToggle();
  initKeyboardShortcuts();
});

// Theme Switcher (Dark / Light persistence)
function initThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('syntax_theme') || 'dark';
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('syntax_theme', newTheme);
      updateThemeIcon(newTheme);
      showToast(`Switched to ${newTheme.toUpperCase()} mode`);
    });
  }
}

function updateThemeIcon(theme) {
  const iconSpan = document.querySelector('#theme-toggle-btn i');
  if (iconSpan) {
    iconSpan.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// Top Module View Switcher (Landing, DRM Player, Bubble Sheet, AI Tutor, Parent Portal, Community, Admin)
function initModuleSwitcher() {
  const switcherBtns = document.querySelectorAll('.module-btn');
  const viewSections = document.querySelectorAll('.app-view-section');

  switcherBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-view');
      
      switcherBtns.forEach(b => b.classList.remove('active'));
      btn.classList.addClass ? btn.classList.addClass('active') : btn.classList.add('active');

      viewSections.forEach(section => {
        if (section.id === targetView) {
          section.style.display = 'block';
          section.classList.add('fade-in-up');
        } else {
          section.style.display = 'none';
        }
      });

      // Trigger re-render or canvas updates for specific views
      if (targetView === 'view-drm-player' && window.initDRMPlayerCanvas) {
        window.initDRMPlayerCanvas();
      } else if (targetView === 'view-parent-portal' && window.renderParentGraph) {
        window.renderParentGraph();
      }
    });
  });
}

// Global Modal Management
function initModals() {
  const modalTriggers = document.querySelectorAll('[data-modal]');
  const modalCloses = document.querySelectorAll('.modal-close, .modal-overlay');

  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const targetModalId = trigger.getAttribute('data-modal');
      const modal = document.getElementById(targetModalId);
      if (modal) {
        modal.classList.add('active');
      }
    });
  });

  modalCloses.forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      if (e.target === closeBtn) {
        const activeModals = document.querySelectorAll('.modal-overlay.active');
        activeModals.forEach(m => m.classList.remove('active'));
      }
    });
  });
}

// Animated Statistics Counter
function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-number');
  let started = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !started) {
        started = true;
        statNumbers.forEach(num => {
          const target = parseInt(num.getAttribute('data-target') || '100');
          let count = 0;
          const step = Math.ceil(target / 40);
          const timer = setInterval(() => {
            count += step;
            if (count >= target) {
              num.innerText = target.toLocaleString() + '+';
              clearInterval(timer);
            } else {
              num.innerText = count.toLocaleString() + '+';
            }
          }, 30);
        });
      }
    });
  }, { threshold: 0.5 });

  const statsSec = document.querySelector('.stats-section');
  if (statsSec) observer.observe(statsSec);
}

// FAQ Accordion Toggle
function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    }
  });
}

// Pricing Monthly/Yearly Toggle
function initPricingToggle() {
  const toggleSwitch = document.getElementById('pricing-switch');
  const priceAmounts = document.querySelectorAll('.price-amount');

  if (toggleSwitch) {
    toggleSwitch.addEventListener('click', () => {
      toggleSwitch.classList.toggle('active');
      const isYearly = toggleSwitch.classList.contains('active');
      
      priceAmounts.forEach(amt => {
        const monthlyPrice = amt.getAttribute('data-monthly');
        const yearlyPrice = amt.getAttribute('data-yearly');
        amt.innerText = isYearly ? yearlyPrice : monthlyPrice;
      });

      showToast(isYearly ? "Yearly Billing Selected (20% Discount Applied)" : "Monthly Billing Selected");
    });
  }
}

// Keyboard Shortcut listener (Ctrl + K for Search Modal)
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchModal = document.getElementById('search-modal');
      if (searchModal) searchModal.classList.toggle('active');
    }
  });
}

// Global Toast Notification Helper
window.showToast = function(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fas fa-check-circle" style="color: var(--primary-light)"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

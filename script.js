// ===== Press ticker seamless loop (duplicate items) =====
(() => {
  const list = document.querySelector('.press-ticker-list');
  if (!list) return;
  const clone = list.cloneNode(true);
  // Unwrap: append children of clone into original list
  while (clone.firstElementChild) list.appendChild(clone.firstElementChild);
})();

// ===== Product detail modal =====
(() => {
  const openModal = (id) => {
    const m = document.getElementById('modal-' + id);
    if (!m) return;
    m.hidden = false;
    document.body.classList.add('modal-open');
  };
  const closeAll = () => {
    document.querySelectorAll('.p-modal').forEach(m => m.hidden = true);
    document.body.classList.remove('modal-open');
  };
  document.querySelectorAll('.card-modal').forEach(c => {
    c.addEventListener('click', () => openModal(c.dataset.modal));
  });
  document.querySelectorAll('.p-modal-close, .p-modal-bg').forEach(el => {
    el.addEventListener('click', closeAll);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
})();

// ===== Scroll-triggered fade-up =====
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ===== Smooth scroll for anchors =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', ev => {
    const id = a.getAttribute('href');
    if (id.length > 1 && document.querySelector(id)) {
      ev.preventDefault();
      document.querySelector(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ===== Mobile menu drawer =====
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
// 旧バージョンのインラインスタイルをリセット
if (links) links.removeAttribute('style');
if (toggle && links) {
  // バックドロップ生成
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);

  const openMenu = () => {
    links.classList.add('is-open');
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    toggle.textContent = '✕';
  };
  const closeMenu = () => {
    links.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    toggle.textContent = '☰';
  };

  toggle.addEventListener('click', () => {
    links.classList.contains('is-open') ? closeMenu() : openMenu();
  });
  backdrop.addEventListener('click', closeMenu);
}

// ===== Newsletter form (stub) =====
document.querySelectorAll('form.form-row').forEach(f => {
  f.addEventListener('submit', ev => {
    ev.preventDefault();
    const btn = f.querySelector('button');
    const input = f.querySelector('input');
    const original = btn.innerText;
    btn.innerText = 'Thanks! ✓';
    btn.disabled = true;
    if (input) input.value = '';
    setTimeout(() => {
      btn.innerText = original;
      btn.disabled = false;
    }, 3200);
  });
});

// ===== Close mobile menu on nav link click =====
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    if (window.innerWidth <= 960) {
      const links = document.querySelector('.nav-links');
      const backdrop = document.querySelector('.nav-backdrop');
      const toggle = document.querySelector('.nav-toggle');
      if (links) links.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
      if (toggle) toggle.textContent = '☰';
      document.body.style.overflow = '';
    }
  });
});

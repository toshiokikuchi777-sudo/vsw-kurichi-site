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

// ===== Mobile menu toggle =====
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => {
    const open = links.style.display === 'flex';
    if (open) {
      links.removeAttribute('style');
    } else {
      Object.assign(links.style, {
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        top: '68px',
        left: '0',
        right: '0',
        background: 'rgba(255,247,230,.98)',
        padding: '18px 24px',
        borderBottom: '1px solid rgba(26,22,19,.12)'
      });
    }
  });
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

// ===== Force metaverse video autoplay (mobile autoplay fallback) =====
(() => {
  const v = document.getElementById('metaverse-video');
  if (!v) return;
  v.muted = true;
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  const tryPlay = () => {
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };
  v.addEventListener('loadedmetadata', tryPlay);
  v.addEventListener('canplay', tryPlay);
  if (v.readyState >= 2) tryPlay();
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) tryPlay(); });
    }, { threshold: 0.1 });
    vio.observe(v);
  }
  ['touchstart', 'click', 'scroll'].forEach(ev => {
    document.addEventListener(ev, tryPlay, { once: true, passive: true });
  });
})();

// ===== Close mobile menu on nav link click =====
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    if (links && window.innerWidth <= 960) links.removeAttribute('style');
  });
});

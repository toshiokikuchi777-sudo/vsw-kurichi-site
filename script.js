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
    btn.innerText = 'Thanks!';
    btn.disabled = true;
  });
});

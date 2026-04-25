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
  // nav-links の元の位置を記憶（閉じる時に戻す）
  const linksParent = links.parentElement;
  const linksNext   = links.nextSibling;

  // バックドロップ生成
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);

  const openMenu = () => {
    // backdrop-filter 親の影響を回避するため body 直下へ移動
    if (links.parentElement !== document.body) {
      document.body.appendChild(links);
    }
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
    // 元の位置へ戻す
    if (links.parentElement === document.body) {
      linksNext ? linksParent.insertBefore(links, linksNext)
                : linksParent.appendChild(links);
    }
  };

  toggle.addEventListener('click', () => {
    links.classList.contains('is-open') ? closeMenu() : openMenu();
  });
  backdrop.addEventListener('click', closeMenu);
}

// ===== Contact modal (Web3Forms) =====
(() => {
  const modal    = document.getElementById('contactModal');
  const openBtn  = document.getElementById('contactOpenBtn');
  const closeBtn = document.getElementById('contactModalClose');
  const bg       = document.getElementById('contactModalBg');
  const form     = document.getElementById('contactForm');
  const submitBtn= document.getElementById('contactSubmitBtn');
  const success  = document.getElementById('contactSuccess');
  if (!modal) return;

  const open  = () => { modal.hidden = false; document.body.classList.add('modal-open'); };
  const close = () => { modal.hidden = true;  document.body.classList.remove('modal-open'); };

  if (openBtn)  openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (bg)       bg.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      submitBtn.textContent = '送信中…';
      submitBtn.disabled = true;

      const data = new FormData(form);
      try {
        const res  = await fetch('https://api.web3forms.com/submit', { method:'POST', body: data });
        const json = await res.json();
        if (json.success) {
          form.hidden = true;
          if (success) success.hidden = false;
        } else {
          alert('送信に失敗しました。直接 info@vsw.co.jp へご連絡ください。');
          submitBtn.textContent = '送信する →';
          submitBtn.disabled = false;
        }
      } catch {
        alert('通信エラーが発生しました。直接 info@vsw.co.jp へご連絡ください。');
        submitBtn.textContent = '送信する →';
        submitBtn.disabled = false;
      }
    });
  }
})();

// ===== Close mobile menu on nav link click =====
// links は openMenu で body に移動されているので document.querySelectorAll で取得
document.addEventListener('click', (e) => {
  const a = e.target.closest('.nav-links a');
  if (!a || window.innerWidth > 960) return;
  const toggle = document.querySelector('.nav-toggle');
  if (toggle) toggle.click(); // closeMenu を呼ぶ
});

/* =====================================================
   KURICHI BRANCH ─ LP main.js
   - IntersectionObserver scroll reveal
   - SVG inner animations injection (handle/belt/conveyor)
   - Hand-crank interaction (hover/click speeds up)
   - Inquiry & Register form handlers
   ===================================================== */

(() => {
  'use strict';

  /* ---------- 1. Scroll reveal ---------- */
  const scenes = document.querySelectorAll('[data-scene]');
  if ('IntersectionObserver' in window && scenes.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    scenes.forEach((s) => io.observe(s));
  } else {
    scenes.forEach((s) => s.classList.add('is-visible'));
  }

  /* ---------- 2. Inject animations into the vending SVG ---------- */
  const vmObject = document.querySelector('.vm-svg');
  if (vmObject) {
    const inject = () => {
      const doc = vmObject.contentDocument;
      if (!doc || !doc.documentElement) return;

      // Avoid double-injection
      if (doc.getElementById('kb-style')) return;

      const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
      style.id = 'kb-style';
      style.textContent = `
        :root { --kb-speed: 1; }
        .kb-rotor { transform-origin: 220px 30px; animation: kb-rotor-spin 6s linear infinite; }
        @keyframes kb-rotor-spin {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.7); opacity: 0.6; }
        }
        .kb-rotor-glow { animation: kb-glow 2s ease-in-out infinite; transform-origin: 220px 30px; }
        @keyframes kb-glow {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.4; }
        }

        /* Production line conveyor */
        .kb-line { animation: kb-line-move calc(14s / var(--kb-speed)) linear infinite; }
        @keyframes kb-line-move {
          from { transform: translateX(0); }
          to   { transform: translateX(400px); }
        }

        /* Belt treads */
        .kb-belt > g { animation: kb-belt-move calc(0.6s / var(--kb-speed)) linear infinite; }
        @keyframes kb-belt-move {
          from { transform: translateX(0); }
          to   { transform: translateX(-24px); }
        }

        /* Hanging lamps blink */
        .kb-blink { animation: kb-blink 1.4s ease-in-out infinite; }
        .kb-blink-alt { animation: kb-blink 1.4s ease-in-out infinite; animation-delay: 0.7s; }
        @keyframes kb-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }

        /* REC indicator */
        .kb-rec { animation: kb-blink 1s steps(2) infinite; }

        /* Screen shine */
        .kb-screen-shine { animation: kb-shine 8s ease-in-out infinite; opacity: 0.5; }
        @keyframes kb-shine {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.5; }
        }

        /* Harichi walks */
        .kb-harichi-track { animation: kb-walk calc(12s / var(--kb-speed)) linear infinite; }
        @keyframes kb-walk {
          from { transform: translateX(-60px); }
          to   { transform: translateX(380px); }
        }
        .kb-harichi { animation: kb-bounce 0.45s ease-in-out infinite; transform-origin: center bottom; }
        @keyframes kb-bounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        .kb-leg-l { animation: kb-leg 0.45s ease-in-out infinite; transform-origin: -4px 16px; }
        .kb-leg-r { animation: kb-leg 0.45s ease-in-out infinite; animation-delay: 0.225s; transform-origin: 4px 16px; }
        @keyframes kb-leg {
          0%, 100% { transform: rotate(-15deg); }
          50%      { transform: rotate(15deg); }
        }

        /* Handle rotation (driven by --kb-speed) */
        .kb-handle { transform-origin: 0 0; animation: kb-spin calc(2.4s / var(--kb-speed)) linear infinite; }
        @keyframes kb-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .kb-handle-group { cursor: pointer; }
        .kb-handle-group:hover { filter: drop-shadow(0 0 8px rgba(230,57,70,0.5)); }

        /* Key press */
        .kb-key { cursor: pointer; transition: fill 0.15s; }
        .kb-key:hover { fill: #ffeccb; }
        .kb-key:active { fill: #ffc23c; }

        /* Top sub badge - subtle wobble */
        .kb-badge { animation: kb-wobble 4s ease-in-out infinite; transform-origin: 392px 120px; }
        @keyframes kb-wobble {
          0%, 100% { transform: rotate(0deg); }
          50%      { transform: rotate(3deg); }
        }

        /* Belt frame fallbacks hide if real images loaded.
           We can't reliably check broken <image> tags inside SVG via CSS,
           so we leave fallbacks always visible underneath. When real PNGs
           are present in assets/img/, they sit on top. */
      `;
      doc.documentElement.appendChild(style);

      // Hand crank interactivity: speed up on hover, lock fast on click
      const handleGroup = doc.querySelector('.kb-handle-group');
      const root = doc.documentElement;
      let locked = false;
      let lockTimer = null;

      const setSpeed = (s) => {
        if (locked) return;
        root.style.setProperty('--kb-speed', String(s));
      };

      if (handleGroup) {
        handleGroup.addEventListener('mouseenter', () => setSpeed(2.4));
        handleGroup.addEventListener('mouseleave', () => setSpeed(1));
        handleGroup.addEventListener('click', () => {
          locked = true;
          root.style.setProperty('--kb-speed', '4');
          clearTimeout(lockTimer);
          lockTimer = setTimeout(() => {
            locked = false;
            root.style.setProperty('--kb-speed', '1');
          }, 3500);
        });
      }

      // Default speed
      root.style.setProperty('--kb-speed', '1');
    };

    if (vmObject.contentDocument && vmObject.contentDocument.readyState === 'complete') {
      inject();
    } else {
      vmObject.addEventListener('load', inject);
    }
  }

  /* ---------- 3. Inquiry form handler (no backend, captures locally) ---------- */
  const inquiryForm = document.getElementById('inquiry-form');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = document.getElementById('form-note');
      const required = ['company', 'name', 'type', 'contact'];
      const missing = required.filter((id) => {
        const el = document.getElementById(id);
        return !el || !el.value.trim();
      });
      if (missing.length) {
        if (note) {
          note.textContent = '※ 必須項目を入力してください: ' + missing.join(' / ');
          note.style.color = '#e63946';
        }
        return;
      }
      if (note) {
        note.textContent = '✓ 送信ありがとうございます。担当者からご連絡いたします。（※デモ：実送信は未接続）';
        note.style.color = '#6ec4a7';
      }
      inquiryForm.reset();
    });
  }

  /* ---------- 4. Register form handler ---------- */
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('reg-email');
      const note = document.getElementById('register-note');
      if (!email || !email.value.trim() || !/.+@.+\..+/.test(email.value)) {
        if (note) {
          note.textContent = '※ メールアドレスを正しく入力してください';
          note.style.color = '#e63946';
          note.style.opacity = '1';
        }
        return;
      }
      if (note) {
        note.textContent = '✓ REGISTERED. SEE YOU AT THE BRANCH.';
        note.style.color = '#1a1613';
        note.style.opacity = '1';
        note.style.fontWeight = '700';
      }
      registerForm.reset();
    });
  }

  /* ---------- 5. Smooth-scroll polyfill for older browsers (basic) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      const tgt = document.querySelector(href);
      if (!tgt) return;
      e.preventDefault();
      tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

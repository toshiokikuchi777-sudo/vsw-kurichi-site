(() => {
  document.querySelectorAll('.flavor-carousel').forEach(region => {
    const slides = [...region.querySelectorAll('.flavor-slide')];
    const count = region.querySelector('.flavor-count');
    const play = region.querySelector('.flavor-play');
    const stage = region.querySelector('.flavor-stage');
    let index = 0;
    let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer;
    let hovered = false;
    function schedule() {
      clearInterval(timer);
      play.textContent = playing ? '自動再生を停止' : '自動再生する';
      if (playing && !document.hidden && !hovered) timer = setInterval(() => show(index + 1), 5000);
    }
    function show(next, announce = false) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.hidden = i !== index; });
      count.textContent = `${index + 1} / ${slides.length} · ${index === 0 ? '包材あり' : '包材なし'}`;
      if (announce) region.querySelector('.flavor-status').textContent = count.textContent;
    }
    function manual(delta) { playing = false; show(index + delta, true); schedule(); }
    region.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => manual(Number(button.dataset.step))));
    play.addEventListener('click', () => { playing = !playing; schedule(); });
    region.addEventListener('focusin', event => { if (event.target !== play) { playing = false; schedule(); } });
    region.addEventListener('mouseenter', () => { hovered = true; schedule(); });
    region.addEventListener('mouseleave', () => { hovered = false; schedule(); });
    document.addEventListener('visibilitychange', schedule);
    let touch;
    stage.addEventListener('touchstart', event => { const t = event.changedTouches[0]; touch = { x: t.clientX, y: t.clientY }; }, { passive: true });
    stage.addEventListener('touchend', event => {
      if (!touch) return;
      const t = event.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) manual(dx < 0 ? 1 : -1);
      touch = null;
    }, { passive: true });
    schedule();
  });
})();

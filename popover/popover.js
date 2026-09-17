(() => {
  const region = document.querySelector('.slideshow');
  const slides = [...region.querySelectorAll('.poster-slide')];
  const count = document.querySelector('#poster-count');
  const play = document.querySelector('#poster-play');
  let index = 0;
  let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer;
  function show(next, announce = false) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    count.textContent = `${index + 1} / ${slides.length}`;
    if (announce) document.querySelector('#poster-status').textContent = `広告 ${count.textContent}`;
  }
  function schedule() {
    clearInterval(timer);
    play.textContent = playing ? '自動再生を停止' : '自動再生する';
    if (playing && !document.hidden) timer = setInterval(() => show(index + 1), 6000);
  }
  function manual(delta) { playing = false; show(index + delta, true); schedule(); }
  document.querySelector('#poster-prev').addEventListener('click', () => manual(-1));
  document.querySelector('#poster-next').addEventListener('click', () => manual(1));
  play.addEventListener('click', () => { playing = !playing; schedule(); });
  region.addEventListener('focusin', () => { playing = false; schedule(); });
  region.addEventListener('mouseenter', () => clearInterval(timer));
  region.addEventListener('mouseleave', schedule);
  document.addEventListener('visibilitychange', schedule);
  let touchStart;
  region.addEventListener('touchstart', e => { touchStart = e.changedTouches[0].clientX; }, { passive: true });
  region.addEventListener('touchend', e => { const delta = e.changedTouches[0].clientX - touchStart; if (Math.abs(delta) > 50) manual(delta < 0 ? 1 : -1); }, { passive: true });
  schedule();
})();

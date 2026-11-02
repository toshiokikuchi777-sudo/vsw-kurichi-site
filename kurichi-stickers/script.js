(() => {
  const characters = window.KURICHI_CHARACTERS || [];
  const dialog = document.querySelector('#character-dialog');
  const cards = [...document.querySelectorAll('.card')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const faces = [...document.querySelectorAll('[data-face]')];
  let index = 0;
  let face = 'front';
  let activeFilter = 'all';
  let opener = null;
  const setFilter = (filter) => {
    activeFilter = filter;
    filters.forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    cards.forEach(card => { card.hidden = filter !== 'all' && card.dataset.category !== filter; });
    document.querySelector('#filter-status').textContent = `${cards.filter(card => !card.hidden).length}種類を表示`;
  };
  filters.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  const render = () => {
    const character = characters[index];
    if (!character) return;
    const image = document.querySelector('#dialog-image');
    image.src = character[face];
    image.alt = `${character.name}のシール${face === 'front' ? '表' : '裏'}`;
    document.querySelector('#dialog-number').textContent = `NO. ${character.id} / ${character.category === 'harichi' ? 'HARICHI' : 'KURICHI'}`;
    document.querySelector('#dialog-name').textContent = character.name;
    document.querySelector('#dialog-role').textContent = character.role;
    document.querySelector('#dialog-chapter').textContent = character.chapter;
    document.querySelector('#dialog-story').textContent = character.story.join('\n');
    document.querySelector('#dialog-skill').textContent = character.skill;
    faces.forEach(button => {
      const active = button.dataset.face === face;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };
  document.querySelectorAll('.card-button').forEach(button => button.addEventListener('click', () => {
    index = characters.findIndex(character => character.id === button.dataset.id);
    if (index < 0) return;
    opener = button;
    face = 'front';
    render();
    dialog.showModal();
    dialog.querySelector('.dialog-close').focus();
  }));
  faces.forEach(button => button.addEventListener('click', () => { face = button.dataset.face; render(); }));
  const moveCharacter = (step) => {
    const visible = characters.filter(character => activeFilter === 'all' || character.category === activeFilter);
    const current = visible.findIndex(character => character.id === characters[index].id);
    const next = visible[(current + step + visible.length) % visible.length];
    index = characters.findIndex(character => character.id === next.id);
    face = 'front';
    render();
  };
  document.querySelector('#prev-character').addEventListener('click', () => moveCharacter(-1));
  document.querySelector('#next-character').addEventListener('click', () => moveCharacter(1));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { if (opener) opener.focus(); });
  document.querySelectorAll('a[href="#collection"]').forEach(link => {
    link.addEventListener('click', () => setFilter(link.closest('.harichi') ? 'harichi' : 'all'));
  });
})();

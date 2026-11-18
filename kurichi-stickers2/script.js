(() => {
  const people = window.NY_CHARACTERS || [];
  const gallery = document.querySelector('#gallery');
  const dialog = document.querySelector('#character-dialog');
  if (!gallery || !dialog || people.length !== 11) return;

  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const boroughJa = { Manhattan: 'マンハッタン', Brooklyn: 'ブルックリン', Queens: 'クイーンズ' };
  const personById = new Map(people.map(person => [person.id, person]));
  const buttons = [...document.querySelectorAll('[data-filter]')];
  let activeFilter = 'all';
  let currentId = people[0].id;
  let face = 'front';
  let opener = null;

  gallery.innerHTML = people.map(person => `
    <li data-borough="${escapeHtml(person.borough)}">
      <button class="card-button" type="button" data-open-id="${escapeHtml(person.id)}" aria-label="${escapeHtml(person.name + person.reading)}のシールとプロフィールを見る">
        <span class="card-art">
          <span class="art-fallback" aria-hidden="true">${escapeHtml(person.roman)}<small>NO. ${escapeHtml(person.id)}</small></span>
          <img src="${escapeHtml(person.front)}" alt="" width="900" height="900" loading="lazy">
          <span class="card-number">NO. ${escapeHtml(person.id)}</span><span class="card-arrow" aria-hidden="true">↗</span>
        </span>
        <span class="card-info"><strong>${escapeHtml(person.name)}<small>${escapeHtml(person.reading)}</small></strong><span>${escapeHtml(person.neighborhoodEn.toUpperCase())}</span></span>
        <span class="card-role">${escapeHtml(person.role)} / ${escapeHtml(boroughJa[person.borough])}</span>
      </button>
    </li>`).join('');

  function addImageFallback(image) {
    image.addEventListener('error', () => image.classList.add('image-failed'));
  }
  document.querySelectorAll('.hero-person img, .gallery img').forEach(addImageFallback);
  const dialogImage = document.querySelector('#dialog-image');
  addImageFallback(dialogImage);
  dialogImage.addEventListener('load', () => dialogImage.classList.remove('image-failed'));

  function visiblePeople() {
    return people.filter(person => activeFilter === 'all' || person.borough === activeFilter);
  }
  function setFilter(filter) {
    activeFilter = filter;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    gallery.querySelectorAll('li').forEach(item => { item.hidden = filter !== 'all' && item.dataset.borough !== filter; });
    const count = visiblePeople().length;
    document.querySelector('#filter-status').textContent = filter === 'all' ? '全11人を表示しています' : `${boroughJa[filter]}の${count}人を表示しています`;
    document.querySelector('.collection-count').textContent = `${filter === 'all' ? 'ALL' : filter.toUpperCase()} ${String(count).padStart(2, '0')} / 11`;
  }
  buttons.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));

  function render() {
    const person = personById.get(currentId);
    if (!person) return;
    dialogImage.classList.remove('image-failed');
    dialogImage.src = person[face];
    dialogImage.alt = `${person.name}（${person.reading}）のシール${face === 'front' ? '表' : '裏'}`;
    document.querySelector('#dialog-id').textContent = `NO. ${person.id} / ${person.borough.toUpperCase()}`;
    document.querySelector('#dialog-roman').textContent = person.roman;
    document.querySelector('#dialog-name').innerHTML = `${escapeHtml(person.name)} <small>${escapeHtml(person.reading)}</small>`;
    document.querySelector('#dialog-summary').textContent = person.id === '11'
      ? `${person.neighborhood}に暮らす、Vswの看板娘。`
      : `${person.neighborhood}に暮らし、${person.role}で働く。`;
    document.querySelector('#dialog-role').textContent = person.role;
    document.querySelector('#dialog-neighborhood').textContent = `${person.neighborhood} / ${boroughJa[person.borough]}`;
    document.querySelector('#dialog-hobby').textContent = person.hobby;
    document.querySelector('#dialog-favorite-kurichi').textContent = person.favorite_kurichi;
    document.querySelector('#dialog-personality').textContent = person.personality;
    document.querySelector('#dialog-story').textContent = person.back_text;
    document.querySelectorAll('[data-face]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.face === face)));
    const related = document.querySelector('#dialog-connections');
    related.replaceChildren();
    person.connections.forEach(connection => {
      if (connection.id === 'all') return;
      const friend = personById.get(connection.id);
      if (!friend) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.relatedId = friend.id;
      const name = document.createElement('strong');
      name.textContent = `${friend.name}（${friend.reading}）↗`;
      const detail = document.createElement('small');
      detail.textContent = connection.detail;
      button.append(name, detail);
      related.append(button);
    });
    const list = visiblePeople();
    document.querySelector('#dialog-position').textContent = `${String(list.findIndex(item => item.id === person.id) + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
  }
  function openPerson(id, trigger) {
    if (!personById.has(id)) return;
    const person = personById.get(id);
    if (activeFilter !== 'all' && person.borough !== activeFilter) setFilter('all');
    if (!dialog.open) opener = trigger || document.activeElement;
    currentId = id;
    face = 'front';
    render();
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('.dialog-close').focus();
    dialog.scrollTop = 0;
  }
  function move(step) {
    const list = visiblePeople();
    const currentIndex = list.findIndex(person => person.id === currentId);
    currentId = list[(currentIndex + step + list.length) % list.length].id;
    face = 'front';
    render();
    dialog.scrollTop = 0;
  }
  document.addEventListener('click', event => {
    const card = event.target.closest('[data-open-id]');
    if (card) openPerson(card.dataset.openId, card);
    const related = event.target.closest('[data-related-id]');
    if (related) openPerson(related.dataset.relatedId, related);
  });
  document.querySelectorAll('[data-face]').forEach(button => button.addEventListener('click', () => {
    face = button.dataset.face;
    render();
    dialog.scrollTop = 0;
  }));
  document.querySelector('#prev-character').addEventListener('click', () => move(-1));
  document.querySelector('#next-character').addEventListener('click', () => move(1));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  dialog.addEventListener('close', () => {
    if (opener && opener.isConnected && !opener.closest('[hidden]')) opener.focus();
    else document.querySelector('#collection-title').focus?.();
    opener = null;
  });
})();

const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');

function closeMenu() {
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'メニューを開く');
  primaryNav?.classList.remove('is-open');
}

menuToggle?.addEventListener('click', () => {
  const nextOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(nextOpen));
  menuToggle.setAttribute('aria-label', nextOpen ? 'メニューを閉じる' : 'メニューを開く');
  primaryNav.classList.toggle('is-open', nextOpen);
});

primaryNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});
document.addEventListener('click', (event) => {
  if (primaryNav?.classList.contains('is-open') && !primaryNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
});

const flavors = {
  plain: { name: 'PLAIN', image: 'assets/plain.webp', alt: 'プレーンのWoopee #kurichi', description: 'クリームチーズのコクを、まっすぐ楽しむ。まずはここから、王道のひとくち。', index: '01' },
  lemon: { name: 'LEMON', image: 'assets/lemon.webp', alt: 'レモンのWoopee #kurichi', description: 'レモンの爽やかさで、後味まで軽やか。気分を切り替えたい日に。', index: '02' },
  cranberry: { name: 'CRANBERRY NUTS', image: 'assets/cranberry.webp', alt: 'クランベリーナッツのWoopee #kurichi', description: '果実の甘酸っぱさと、クルミの食感。ちょっと欲張りな組み合わせ。', index: '03' },
  rumraisin: { name: 'RUM RAISIN', image: 'assets/rumraisin.webp', alt: 'ラムレーズンのWoopee #kurichi', description: 'ラムレーズンの風味が広がる、ゆっくり味わいたいひとくち。', index: '04' },
  chocolate: { name: 'CHOCOLATE', image: 'assets/chocolate.webp', alt: 'チョコのWoopee #kurichi', description: 'チョコのコクと、クリームチーズのなめらかさ。甘いひとときを、ひとくちに。', index: '05' },
  strawberry: { name: 'STRAWBERRY', image: 'assets/strawberry.webp', alt: 'いちごのWoopee #kurichi', description: 'いちごの甘酸っぱさと、クリームチーズのまろやかさ。やさしいピンクのひとくち。', index: '06' }
};

const flavorSection = document.querySelector('.flavors');
const flavorTabs = [...document.querySelectorAll('.flavor-tab')];
const flavorPanel = document.querySelector('#flavor-panel');
const flavorImage = document.querySelector('#flavor-image');
const flavorName = document.querySelector('#flavor-name');
const flavorDescription = document.querySelector('#flavor-description');
const flavorIndex = document.querySelector('#flavor-index');
const flavorOverline = document.querySelector('.flavor-panel-overline');

function selectFlavor(tab, focus = false) {
  const flavor = flavors[tab.dataset.flavor];
  if (!flavor) return;
  flavorTabs.forEach((item) => {
    const selected = item === tab;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  flavorSection.dataset.flavor = tab.dataset.flavor;
  flavorPanel.setAttribute('aria-labelledby', tab.id);
  flavorImage.src = flavor.image;
  flavorImage.alt = flavor.alt;
  flavorName.textContent = flavor.name;
  flavorDescription.textContent = flavor.description;
  flavorIndex.textContent = `${flavor.index} / ${String(Object.keys(flavors).length).padStart(2, '0')}`;
  flavorOverline.textContent = `YOUR CURRENT CRAVING / ${flavor.index}`;
  if (focus) tab.focus();
}

flavorTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectFlavor(tab));
  tab.addEventListener('keydown', (event) => {
    let nextIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % flavorTabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + flavorTabs.length) % flavorTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = flavorTabs.length - 1;
    else return;
    event.preventDefault();
    selectFlavor(flavorTabs[nextIndex], true);
  });
});

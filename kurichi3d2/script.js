'use strict';

const planImage = '09_five_column_plan.svg?v=20261001-category-price';
const views = {
  overview: {
    image: planImage,
    caption: '470×458mm基準 / 左右コの字パーツ案',
    alt: '470×458mm内に右コの字パーツを縦3つ、左に反転コの字パーツを縦3つ配置した冷凍庫ディスプレイ案',
    title: '既存版と同じ470×458mm内に収める。',
    copy: '右側にはコの字型パーツを縦に3つ、左側には反転させたコの字型パーツを縦に3つ配置します。中央の縦棒・縦仕切りは今は入れません。'
  },
  fitting: {
    image: planImage,
    caption: '札の差し替え / 可変配置',
    alt: '5列の各位置へ商品札とカテゴリー札を差し替えられる構成',
    title: '固定の区切りではなく、着脱札で種類を増減する。',
    copy: '商品数が変わっても使えるよう、札は正面から着脱する前提です。既存版と同じ商品札75×23mm、カテゴリー札100×28mmを基準にし、中央は仕切らず、商品・種類・予備札を置ける余白として残します。'
  },
  label: {
    image: planImage,
    caption: 'カテゴリー配置 / 中央にも装着',
    alt: '各段の左、中央、右にカテゴリー札を付けた構成',
    title: 'カテゴリー札を真ん中にも付けられるようにする。',
    copy: 'クラシック、ふわもち、ウーピーは各段の左・中央・右に配置できる想定です。限定・米粉も差し替え札として中央付近に置けるようにします。'
  },
  joint: {
    image: planImage,
    caption: '中央部 / 縦棒なし',
    alt: '中央の縦棒や縦仕切りを入れない構成',
    title: '真ん中の縦棒は今は入れない。',
    copy: '旧案のように中央で左右を強く分けると、売場の真ん中が使いにくくなります。Ver.2では左右のコの字パーツを独立して見せ、中央の縦棒はなしで検討します。'
  },
  side: {
    image: planImage,
    caption: '側面イメージ / 薄型フレーム',
    alt: '冷凍庫ガラス面に薄く取り付ける5列ディスプレイ枠',
    title: 'ガラス面の邪魔にならない薄型のまま整理する。',
    copy: '基本は既存案と同じく、ガラス面に対して薄く、PLA / 6mm基準で札を正面から交換できる方向です。5列にしても出っ張りを増やしすぎず、冷凍庫内の商品視認性を優先します。'
  },
  price: {
    image: planImage,
    caption: '価格札 / カテゴリー札の下に配置',
    alt: 'カテゴリー札それぞれの下に価格札を配置した図',
    title: '価格は前の設計と同じく、カテゴリー札の下に置く。',
    copy: '価格札は商品札ごとではなく、前の設計と同じようにカテゴリー札の下へ配置します。Ver.2のモックでは¥550を初期表示にし、必要に応じて¥600へ切り替えられる想定です。'
  },
  keeper: {
    image: planImage,
    caption: '運用メモ / 使いやすさ優先',
    alt: '横5列でカテゴリー札を差し替える運用メモ',
    title: '売場で迷わず差し替えられることを優先する。',
    copy: '左右のコの字パーツを縦3つずつに分け、外寸は既存版と同じ470×458mmに合わせます。まずは縦仕切りなしで見え方を確認し、保持方法は次の試作で詰めます。'
  }
};

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panel = document.getElementById('drawing-panel');
const image = document.getElementById('drawing-image');
const imageButton = document.getElementById('image-button');
const dialog = document.getElementById('image-dialog');
let activeView = views.overview;

function selectTab(tab, focus = false) {
  activeView = views[tab.dataset.view];
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  }
  panel.setAttribute('aria-labelledby', tab.id);
  image.src = 'assets/' + activeView.image;
  image.alt = activeView.alt;
  imageButton.setAttribute('aria-label', activeView.caption + 'を拡大する');
  document.getElementById('drawing-caption').textContent = activeView.caption;
  document.getElementById('drawing-subtitle').textContent = activeView.title;
  document.getElementById('drawing-copy').textContent = activeView.copy;
  if (focus) tab.focus();
}

for (const tab of tabs) {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    const i = tabs.indexOf(tab);
    if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectTab(tabs[next], true);
    }
  });
}

function openImage() {
  document.getElementById('dialog-title').textContent = activeView.caption;
  const enlarged = document.getElementById('dialog-image');
  enlarged.src = 'assets/' + activeView.image;
  enlarged.alt = activeView.alt;
  dialog.showModal();
  document.body.classList.add('dialog-open');
  document.querySelector('.dialog-image-wrap').scrollTo(0, 0);
}

selectTab(tabs[0]);
imageButton.addEventListener('click', openImage);
document.getElementById('enlarge').addEventListener('click', openImage);
document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }
});

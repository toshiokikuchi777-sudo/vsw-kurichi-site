const stage = document.querySelector('#model-stage');
const status = document.querySelector('#model-status');
const fallback = document.querySelector('#model-fallback');
const explode = document.querySelector('#model-explode');
const buttons = [...document.querySelectorAll('[data-camera]')];
const toggles = [...document.querySelectorAll('[data-part]')];
const reset = document.querySelector('#model-reset');
const priceSelect = document.querySelector('#model-price');
window.__kurichi3d = { ready: false, partCount: 0 };
let renderer;

function fail(error) {
  console.error('KURICH 3D:', error);
  status.textContent = '3Dを表示できません';
  fallback.hidden = false;
  [...buttons, ...toggles, reset, explode, priceSelect].forEach(el => el.disabled = true);
  window.__kurichi3d.ready = false;
  window.__kurichi3d.error = String(error);
}

async function start() {
  const [THREE, { OrbitControls }] = await Promise.all([
    import('three'),
    import('./vendor/OrbitControls.js')
  ]);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xeaf0f1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', 'KURICHフレーム左右コの字パーツ案。ドラッグで回転、ホイールまたはピンチで拡大。視点ボタンでも操作できます。');
  canvas.setAttribute('role', 'img');
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fail(new Error('WebGL context lost')); });
  stage.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 1, 6000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.minDistance = 120;
  controls.maxDistance = 2600;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x62717a, 2.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.3);
  key.position.set(240, 430, 680);
  scene.add(key);
  const back = new THREE.DirectionalLight(0xffffff, 1.5);
  back.position.set(-360, 140, -520);
  scene.add(back);

  let visible = true;
  const render = () => { if (visible && !document.hidden) renderer.render(scene, camera); };
  controls.addEventListener('change', render);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; render(); }).observe(stage);
  document.addEventListener('visibilitychange', render);

  const materials = {
    frame: new THREE.MeshStandardMaterial({ color: 0xd9232e, roughness: .65, metalness: .05 }),
    connector: new THREE.MeshStandardMaterial({ color: 0xd9232e, roughness: .65 }),
    label: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .72 }),
    price: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .72 }),
    bar: new THREE.MeshStandardMaterial({ color: 0xd9232e, roughness: .65 })
  };
  const shadow = new THREE.MeshStandardMaterial({ color: 0x33404a, roughness: .9 });
  const meshes = [];

  const addBox = (type, name, x, y, z, w, h, d, dx = 0, dy = 0, dz = 90, material = materials[type]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.userData = { type, base: mesh.position.clone(), offset: new THREE.Vector3(dx, dy, dz) };
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  };

  const makeTextTexture = (lines, options = {}) => {
    const width = options.width || 512;
    const height = options.height || 220;
    const canvas2d = document.createElement('canvas');
    canvas2d.width = width;
    canvas2d.height = height;
    const ctx = canvas2d.getContext('2d');
    ctx.fillStyle = options.background || '#ffffff';
    ctx.fillRect(0, 0, width, height);
    if (options.border) {
      ctx.strokeStyle = options.border;
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, width - 10, height - 10);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = options.color || '#111111';
    ctx.font = options.font || '700 48px sans-serif';
    const lineGap = options.lineGap || 58;
    const top = height / 2 - ((lines.length - 1) * lineGap) / 2;
    lines.forEach((line, index) => ctx.fillText(line, width / 2, top + index * lineGap));
    const texture = new THREE.CanvasTexture(canvas2d);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  };

  const addPlate = (type, name, x, y, z, w, h, d, lines, options = {}, dx = 0, dy = 0, dz = 110) => {
    addBox(type, name, x, y, z, w, h, d, dx, dy, dz);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(w * .92, h * .82),
      new THREE.MeshBasicMaterial({ map: makeTextTexture(lines, options) })
    );
    face.position.set(x, y, z + d / 2 + .08);
    face.name = name + ' 表示面';
    face.userData = { type, base: face.position.clone(), offset: new THREE.Vector3(dx, dy, dz + 1) };
    scene.add(face);
    meshes.push(face);
    return face;
  };

  const outerW = 470;
  const outerH = 458;
  const rail = 15;
  const columns = 5;
  const colW = outerW / columns;
  const rowY = [108, -44, -196];
  const productNames = [
    ['NY', '#クリチ'],
    ['抹茶', 'あんこ'],
    ['いちじく', 'ナッツ'],
    ['ブルー', 'ベリー'],
    ['ウーピー', '#クリチ'],
    ['プレミアム', '限定'],
    ['米粉', '#クリチ']
  ];
  const categories = [
    { label: 'クラシック', x: -156, y: 196, accent: false },
    { label: 'クラシック', x: 0, y: 202, accent: false },
    { label: 'クラシック', x: 156, y: 196, accent: false },
    { label: 'ふわもち', x: -156, y: 44, accent: false },
    { label: 'ふわもち', x: 0, y: 44, accent: false },
    { label: 'ふわもち', x: 156, y: 44, accent: false },
    { label: 'ウーピー', x: -156, y: -108, accent: false },
    { label: 'ウーピー', x: 0, y: -108, accent: false },
    { label: 'ウーピー', x: 156, y: -108, accent: false },
    { label: '限定', x: -52, y: -214, accent: false },
    { label: '米粉', x: 52, y: -214, accent: true }
  ];

  const rowHeight = outerH / 3;
  const rowCenters = [rowHeight, 0, -rowHeight];
  const uHeight = rowHeight;
  const armLength = 220;
  rowCenters.forEach((y, index) => {
    const top = y + uHeight / 2 - rail / 2;
    const bottom = y - uHeight / 2 + rail / 2;
    addBox('frame', `左反転コの字 ${index + 1} 縦`, -outerW / 2, y, 0, rail, uHeight, 8, -42, (1 - index) * 28, 85);
    addBox('frame', `左反転コの字 ${index + 1} 上`, -outerW / 2 + armLength / 2, top, 0, armLength, rail, 8, -18, (1 - index) * 28, 85);
    addBox('frame', `左反転コの字 ${index + 1} 下`, -outerW / 2 + armLength / 2, bottom, 0, armLength, rail, 8, -18, (1 - index) * 28, 85);
    addBox('frame', `右コの字 ${index + 1} 縦`, outerW / 2, y, 0, rail, uHeight, 8, 42, (1 - index) * 28, 85);
    addBox('frame', `右コの字 ${index + 1} 上`, outerW / 2 - armLength / 2, top, 0, armLength, rail, 8, 18, (1 - index) * 28, 85);
    addBox('frame', `右コの字 ${index + 1} 下`, outerW / 2 - armLength / 2, bottom, 0, armLength, rail, 8, 18, (1 - index) * 28, 85);
  });

  rowY.forEach((y, rowIndex) => {
    for (let col = 0; col < columns; col++) {
      const product = productNames[(rowIndex * columns + col) % productNames.length];
      const x = -outerW / 2 + colW / 2 + col * colW;
      addPlate('label', `商品札 ${rowIndex + 1}-${col + 1}`, x, y, 7, 75, 23, 4, product, { font: '800 44px sans-serif', lineGap: 48 }, (col - 2) * 18, (1 - rowIndex) * 30, 130);
      addPlate('price', `価格 ${rowIndex + 1}-${col + 1}`, x + 23, y - 35, 11, 38, 22, 3, ['¥' + priceSelect.value], { font: '800 72px sans-serif', width: 420, height: 180 }, (col - 2) * 18, (1 - rowIndex) * 30, 150);
    }
  });

  categories.forEach((category, index) => {
    addPlate('bar', `カテゴリー ${category.label}`, category.x, category.y, 13, 100, 28, 4, [category.label], {
      background: category.accent ? '#f7f2d0' : '#ffffff',
      border: '#d9232e',
      font: '800 52px sans-serif',
      width: 620,
      height: 180
    }, (index - 2.5) * 12, 35, 145);
  });

  addBox('connector', '縦仕切りなし確認用ベース', 0, 0, -7, outerW - 18, outerH - 18, 3, 0, 0, -45, shadow);

  const priceFaces = meshes.filter(mesh => mesh.name.startsWith('価格 ') && mesh.material.map);
  const rebuildPrices = () => {
    priceFaces.forEach(mesh => {
      mesh.material.map.dispose();
      mesh.material.map = makeTextTexture(['¥' + priceSelect.value], { font: '800 72px sans-serif', width: 420, height: 180 });
      mesh.material.needsUpdate = true;
    });
    render();
  };
  priceSelect.addEventListener('change', rebuildPrices);

  let preset = 'oblique';
  const fitDistance = () => {
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    return Math.max(330 / Math.tan(half), 330 / (Math.tan(half) * camera.aspect));
  };
  const setView = name => {
    preset = name;
    const d = fitDistance();
    const direction = name === 'front' ? new THREE.Vector3(0, 0, 1) : name === 'rear' ? new THREE.Vector3(0, 0, -1) : name === 'side' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(.65, .4, 1).normalize();
    controls.target.set(0, 0, 0);
    camera.position.copy(direction.multiplyScalar(d));
    camera.up.set(0, 1, 0);
    camera.lookAt(controls.target);
    controls.update();
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.camera === name)));
    render();
  };

  controls.addEventListener('start', () => {
    preset = null;
    buttons.forEach(b => b.setAttribute('aria-pressed', 'false'));
  });

  const resize = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (preset) setView(preset);
    else render();
  };
  new ResizeObserver(resize).observe(stage);
  buttons.forEach(b => b.addEventListener('click', () => setView(b.dataset.camera)));

  const updateExplosion = () => {
    const t = Number(explode.value) / 100;
    meshes.forEach(m => {
      const { base, offset, type } = m.userData;
      m.position.copy(base).add(new THREE.Vector3(offset.x * t, offset.y * t, 0));
      const travel = type === 'label' || type === 'price' || type === 'bar' ? Math.max(0, (t - .35) / .65) : t;
      m.position.z += offset.z * travel;
    });
    document.querySelector('#explode-value').textContent = `${explode.value}%`;
    canvas.dataset.explode = explode.value;
    render();
  };
  explode.addEventListener('input', updateExplosion);
  toggles.forEach(toggle => {
    toggle.addEventListener('change', () => {
      meshes.filter(m => m.userData.type === toggle.dataset.part).forEach(m => { m.visible = toggle.checked; });
      render();
    });
  });
  reset.addEventListener('click', () => {
    priceSelect.value = '550';
    rebuildPrices();
    explode.value = '0';
    updateExplosion();
    toggles.forEach(t => { t.checked = true; });
    meshes.forEach(m => { m.visible = true; });
    setView('oblique');
  });

  [...buttons, ...toggles, reset, explode, priceSelect].forEach(el => { el.disabled = false; });
  status.textContent = `${meshes.length}パーツ / 470×458mm基準・左右コの字各3個`;
  status.dataset.ready = 'true';
  canvas.dataset.ready = 'true';
  canvas.dataset.partCount = String(meshes.length);
  window.__kurichi3d = { ready: true, partCount: meshes.length, scene, camera, controls, meshes, renderer };
  resize();
}

start().catch(fail);

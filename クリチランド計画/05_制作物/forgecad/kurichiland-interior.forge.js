/* =====================================================================
   KURICHI LAND — 内装レイアウト模型 v2（吹き抜け整合版）  ForgeCAD
   ---------------------------------------------------------------------
   単位: mm。座標 +X=東 / +Y=南(正面・テラス・川) / +Z=上。box/cylinderは底面Z=0・XY中心。
   ★前面コの字の吹き抜け(6.0×7.0m)と整合。2Fの室・什器は必ずコの字の3辺
    （奥ブロック＋東西ウイング）に配置し、吹き抜けの上には一切置かない。
   骨組み(柱＋床)＋ゾーンカーペット(平面図の凡例色)＋主要什器＋市松床(テクスチャ)。
   実行: forgecad run kurichiland-interior.forge.js
   ===================================================================== */

const W = 14000, D = 14400, F1 = 4500, F2 = 4200, SLAB = 260;
const VW = 6000, VD = 7000;                       // 吹き抜け（前面コの字）

// ---------- 色（平面図の凡例と同じ） ----------
const ZC = {
  factory:"#ffd9a8", counter:"#ffe08a", diner:"#fff0bf", star:"#ffd2cc",
  retail:"#e7f0d6", seat:"#f3ecdd", hall:"#f5efe3", boh:"#e3ddd4",
  cold:"#d7e8f2", core:"#d6d0c6", wc:"#e7e6ef",
};
const RED = "#E3261D", CHROME = "#d4d8dc", WHITE = "#fdfaf2", GLASS = "#cfe4ee", PINK = "#f0b0a8";
const col = "#cf7a72", slabC = "#ededed", stairC = "#c9b48f", RAIL = "#c9ccd0";
const chrome = { roughness: 0.22, metalness: 0.85 };
const glassM = { roughness: 0.08, metalness: 0.1 };

// ---------- 平面図座標(m: 西北origin) → モデル座標(mm・中心原点) ----------
const RX = (x, w) => (x + w/2) * 1000 - W/2;       // ゾーン中心X
const RY = (y, h) => (y + h/2) * 1000 - D/2;       // ゾーン中心Y
const PX = (px) => px * 1000 - W/2;                // 点X
const PY = (py) => py * 1000 - D/2;                // 点Y

// ---------- 骨組み（柱＋床スラブ） ----------
const voidCy = D/2 - VD/2;                          // 3700
const voidCut = box(VW, VD, F2 + SLAB + 800).translate(0, voidCy, F1);
const floor1 = box(W, D, 200).color(slabC);
const floor2 = box(W, D, SLAB).translate(0, 0, F1).color(slabC).subtract(voidCut);
const roof   = box(W + 300, D + 300, SLAB).translate(0, 0, F1 + F2).color(slabC).subtract(voidCut);
const colXs = [-6300, -2100, 2100, 6300], colYs = [-6300, -2100, 2100, 6300];
const inVoid = (x, y) => Math.abs(x) < VW/2 + 50 && y > voidCy - VD/2 - 50 && y < voidCy + VD/2 + 50;
const columns = {}; let ci = 0;
for (const x of colXs) for (const y of colYs) {
  if (inVoid(x, y)) continue;
  columns["柱_" + (++ci)] = cylinder(F1 + F2, 190, 190).translate(x, y, 0).color(col);
}

// ---------- ゾーンカーペット ----------
// 1F: [x,y,w,h,色]。2F: 同上（voidで自動的に穴があく＝吹き抜け）
function carpet(z, sub) {
  return (x, y, w, h, c) => {
    let b = box(w*1000 - 60, h*1000 - 60, 30).translate(RX(x,w), RY(y,h), z).color(c);
    return sub ? b.subtract(voidCut) : b;
  };
}
const c1 = carpet(200, false), c2 = carpet(F1 + SLAB, true);

// ==== 1F ゾーン（背面BOH帯／中間FACTORY帯／前面ホール＋ウイング） ====
const z1 = {
  "1F_搬入ゴミ":    c1(0,   0,   3.0, 4.5, ZC.boh),
  "1F_冷凍冷蔵":    c1(3.0, 0,   2.5, 4.5, ZC.cold),
  "1F_厨房":       c1(5.5, 0,   5.0, 4.5, ZC.boh),
  "1F_WC":        c1(10.5,0,   1.5, 4.5, ZC.wc),
  "1F_階段室":     c1(12.0,0,   2.0, 4.5, ZC.core),
  "1F_西_待合席":   c1(0,   4.5, 5.5, 2.9, ZC.seat),
  "1F_FACTORY":   c1(5.5, 4.5, 5.0, 2.9, ZC.factory),
  "1F_東_物販導入": c1(10.5,4.5, 3.5, 2.9, ZC.retail),
  "1F_西ウイング_席": c1(0,  7.4, 4.0, 7.0, ZC.seat),   // west wing
  "1F_東ウイング_物販": c1(10.0,7.4, 4.0, 7.0, ZC.retail), // east wing
  "1F_ホール(吹抜)": c1(4.0, 7.4, 6.0, 7.0, ZC.hall),   // 吹き抜け土間（1Fは床あり）
};

// 市松床（テクスチャ）：エントランス（前面中央）
const texEnt = Import.image("./checker_ent.png");
let entFloor = box(6000 - 80, 3400 - 60, 32).translate(0, PY(12.7), 205);
entFloor = entFloor.wrapTexture(texEnt, Wrap.flat({ onto: "top" })).color("#ffffff");

// ==== 2F ゾーン（奥ブロック＋東西ウイングのみ・吹き抜け上は無し） ====
const z2 = {
  "2F_事務休憩在庫":  c2(0,   0,   5.5, 4.5, ZC.boh),
  "2F_軽ドリンクバー": c2(5.5, 0,   5.0, 4.5, ZC.counter),
  "2F_WC":         c2(10.5,0,   1.5, 4.5, ZC.wc),
  "2F_階段室":      c2(12.0,0,   2.0, 4.5, ZC.core),
  "2F_キャラ展示":   c2(0,   4.5, 7.0, 2.9, ZC.star),
  "2F_ダイナー奥":   c2(7.0, 4.5, 7.0, 2.9, ZC.diner),
  "2F_西ウイング_グッズ": c2(0, 7.4, 4.0, 7.0, ZC.retail),  // west wing
  "2F_東ウイング_ダイナー": c2(10.0,7.4, 4.0, 7.0, ZC.diner), // east wing（東窓・川ビュー）
};

// ---------- 1F 什器（すべて1F床上・吹き抜け直下＝二層吹抜ホールでOK） ----------
// メインカウンター・受渡し（ホール中央・客側=+Y）
const ctrY = PY(9.6);
const counterBody = box(5000, 700, 850).translate(0, ctrY, 230).color(RED);
const counterTop  = box(5200, 1000, 60).translate(0, ctrY + 60, 1080).color(WHITE);
const stools = {};
[-1800, -600, 600, 1800].forEach((dx, i) => {
  stools["スツール_"+(i+1)+"_柱"] = cylinder(600, 45, 45).translate(dx, ctrY + 950, 230).color(CHROME).material(chrome);
  stools["スツール_"+(i+1)+"_座"] = cylinder(85, 175, 185).translate(dx, ctrY + 950, 830).color(RED);
});
// FACTORY（見せる仕上げ・ガラス箱）
const factory = box(4700, 2500, 2600).translate(0, PY(5.95), 230).color(GLASS).material(glassM);
// 車顔ショーケース（エントランス前面）
const showcase = box(3000, 1500, 1800).translate(0, PY(13.4), 230).color(RED);
const showWin  = box(3060, 900, 700).translate(0, PY(13.4), 1130).color("#2a2e35");
// 東ウイング 物販棚×3（東窓沿い）
const shelvesE = {};
[8.6, 10.9, 13.2].forEach((py, i) => {
  shelvesE["物販棚_"+(i+1)] = box(500, 1900, 1800).translate(PX(12.6), PY(py), 230).color(RED);
});
// 西ウイング 待合ベンチ×2
const benchW = {};
[9.0, 12.0].forEach((py, i) => {
  benchW["待合ベンチ_"+(i+1)] = box(2600, 500, 430).translate(PX(2.0), PY(py), 230).color(RED);
});
// 吹き抜け中央：大ぬいぐるみ＋オープン階段
const bigPlush = box(2400, 2400, 4000).translate(0, voidCy, 200).color(PINK);
const STAIR_N = 14, rise = F1 / STAIR_N, tread = 380, stX = VW/2 - 900;
let stair = null;
for (let i = 0; i < STAIR_N; i++) {
  const step = box(1300, tread, rise).translate(stX, (D/2 - VD + 1300) + i * tread, i * rise + 200);
  stair = stair ? stair.union(step) : step;
}
stair = stair.color(stairC);

// ---------- 2F 什器（コの字の3辺のみ・吹き抜け上には置かない） ----------
const Z2F = F1 + SLAB + 30;
// 軽ドリンクバー（奥ブロック）
const drinkBar = box(4500, 600, 1000).translate(0, PY(2.2), Z2F).color(RED);
// キャラ展示台×3（奥ブロック西・ガラスケース）
const peds = {};
[[PX(1.5),PY(5.9)],[PX(3.5),PY(5.9)],[PX(5.5),PY(5.9)]].forEach((p, i) => {
  peds["展示台_"+(i+1)]   = box(600, 600, 900).translate(p[0], p[1], Z2F).color(WHITE);
  peds["展示ケース_"+(i+1)] = box(540, 540, 500).translate(p[0], p[1], Z2F + 900).color(GLASS).material(glassM);
});
// グッズ棚×2（西ウイング）
const goodsW = {};
[9.2, 12.6].forEach((py, i) => {
  goodsW["グッズ棚_"+(i+1)] = box(1900, 450, 1800).translate(PX(2.0), PY(py), Z2F).color(RED);
});
// ダイナー席：東ウイング（丸卓×3）＋奥ダイナー（丸卓×3）＝吹き抜けを避けて配置
const tables = {};
const T = [[12.0,8.8],[12.0,11.1],[12.0,13.4],   // 東ウイング（x=12>10 ＝ void外）
           [8.5,5.9],[11.0,5.9],[13.0,5.9]];      // 奥ダイナー（y=5.9<7.4 ＝ void外）
T.forEach((p, i) => {
  tables["2F卓_"+(i+1)+"_柱"] = cylinder(700, 55, 45).translate(PX(p[0]), PY(p[1]), Z2F).color(CHROME).material(chrome);
  tables["2F卓_"+(i+1)+"_天板"] = cylinder(40, 430, 430).translate(PX(p[0]), PY(p[1]), Z2F + 700).color(WHITE);
});
// 吹き抜けのギャラリー手すり（北・東・西の縁）
const rails = {
  "手すり_北": box(VW + 200, 90, 1000).translate(0, PY(7.4), Z2F).color(RAIL).material(chrome),
  "手すり_西": box(90, VD, 1000).translate(PX(4.0), voidCy, Z2F).color(RAIL).material(chrome),
  "手すり_東": box(90, VD, 1000).translate(PX(10.0), voidCy, Z2F).color(RAIL).material(chrome),
};

// ---------- 出力 ----------
return Object.assign({
  "1F 床": floor1, "2F 床(コの字)": floor2, "屋根(コの字)": roof,
}, columns, z1, {
  "1F_市松_エントランス": entFloor,
}, z2, {
  "カウンター本体": counterBody, "カウンター天板": counterTop,
}, stools, {
  "FACTORYガラス": factory, "車顔ショーケース": showcase, "ショーケース窓": showWin,
}, shelvesE, benchW, {
  "大ぬいぐるみ": bigPlush, "階段": stair, "2F_ドリンクバー": drinkBar,
}, peds, goodsW, tables, rails);

/* =====================================================================
   KURICHI LAND — 内装レイアウト模型（フロアプラン3D化） ForgeCAD
   ---------------------------------------------------------------------
   単位: mm。座標 +X=東 / +Y=南(正面) / +Z=上。box/cylinderは底面Z=0・XY中心。
   柱＋床スラブの骨組みに、実寸平面図(kurichiland-plan)のゾーンを
   色カーペットとして敷き、主要什器をボリュームで配置。壁なし＝中が見える。
   市松床(入口ホール/エントランス)はチェッカーテクスチャ。
   実行: forgecad run kurichiland-interior.forge.js
   ===================================================================== */

const W  = 14000, D = 14400, F1 = 4500, F2 = 4200, SLAB = 260;
const VW = 7000, VD = 9900;

// ---------- 色（平面図の凡例と同じ） ----------
const ZC = {
  factory:"#ffd9a8", counter:"#ffe08a", diner:"#fff0bf", star:"#ffd2cc",
  retail:"#e7f0d6", seat:"#f3ecdd", hall:"#f5efe3", boh:"#e3ddd4",
  cold:"#d7e8f2", core:"#d6d0c6", wc:"#e7e6ef",
};
const RED = "#E3261D", CHROME = "#d4d8dc", WHITE = "#fdfaf2", GLASS = "#cfe4ee", PINK = "#f0b0a8";
const col = "#cf7a72", slabC = "#ededed", stairC = "#c9b48f";
const chrome = { roughness: 0.22, metalness: 0.85 };
const glassM = { roughness: 0.08, metalness: 0.1 };

// ---------- 平面図座標(m: 西北origin) → モデル座標(mm) 変換 ----------
const ZX = (x, w) => (x + w/2) * 1000 - W/2;
const ZY = (y, h) => (y + h/2) * 1000 - D/2;

// ---------- 骨組み（柱＋スラブ：柱だけ模型と同じ） ----------
const voidCy = D/2 - VD/2;
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

// ---------- ゾーンカーペット（1F: z=200..230 / 2F: z=F1+SLAB..+30） ----------
function carpet1(x, y, w, h, c) { return box(w*1000 - 60, h*1000 - 60, 30).translate(ZX(x,w), ZY(y,h), 200).color(c); }
function carpet2(x, y, w, h, c) { return box(w*1000 - 60, h*1000 - 60, 30).translate(ZX(x,w), ZY(y,h), F1 + SLAB).color(c).subtract(voidCut); }

const z1 = {
  "1F_搬入通用口":  carpet1(0,   0,   3.0, 4.5, ZC.boh),
  "1F_冷凍冷蔵":    carpet1(3.0, 0,   2.5, 4.5, ZC.cold),
  "1F_厨房":       carpet1(5.5, 0,   5.0, 4.5, ZC.boh),
  "1F_WC":        carpet1(10.5,0,   1.5, 4.5, ZC.wc),
  "1F_階段室":     carpet1(12.0,0,   2.0, 4.5, ZC.core),
  "1F_FACTORY":   carpet1(5.5, 4.5, 5.0, 4.0, ZC.factory),
  "1F_スタンディング": carpet1(0, 4.5, 5.5, 5.5, ZC.seat),
  "1F_物販展示":    carpet1(10.5,4.5, 3.5, 9.9, ZC.retail),
  "1F_カウンターゾーン": carpet1(5.5, 8.5, 5.0, 2.5, ZC.counter),
};
// 市松床（テクスチャ）: 入口ホール＋エントランス
const texHall = Import.image("./checker_hall.png");
const texEnt  = Import.image("./checker_ent.png");
let hallFloor = box(5.0*1000 - 60, 3.4*1000 - 60, 30).translate(ZX(5.5,5.0), ZY(11,3.4), 200);
hallFloor = hallFloor.wrapTexture(texHall, Wrap.flat({ onto: "top" })).color("#ffffff");
let entFloor = box(5.5*1000 - 60, 4.4*1000 - 60, 30).translate(ZX(0,5.5), ZY(10,4.4), 200);
entFloor = entFloor.wrapTexture(texEnt, Wrap.flat({ onto: "top" })).color("#ffffff");

const z2 = {
  "2F_事務休憩":   carpet2(0,   0,   5.5, 3.0, ZC.boh),
  "2F_軽ドリンク":  carpet2(5.5, 0,   5.0, 3.0, ZC.counter),
  "2F_WC":        carpet2(10.5,0,   1.5, 4.5, ZC.wc),
  "2F_階段室":     carpet2(12.0,0,   2.0, 4.5, ZC.core),
  "2F_キャラ展示":  carpet2(0,   3.0, 6.0, 6.0, ZC.star),
  "2F_グッズショップ": carpet2(0, 9.0, 6.0, 5.4, ZC.retail),
  "2F_回廊":       carpet2(6.0, 3.0, 4.5, 1.5, ZC.hall),
  "2F_ダイナー席":  carpet2(6.0, 4.5, 8.0, 9.9, ZC.diner),
};

// ---------- 1F 什器 ----------
// メインカウンター（counter.glb の簡易版・客側=+Y南）
const ctrX = ZX(5.5,5.0), ctrY = ZY(8.5,0.7) + 100;
const counterBody = box(5000, 700, 850).translate(ctrX, ctrY, 230).color(RED);
const counterTop  = box(5200, 1000, 60).translate(ctrX, ctrY + 60, 230 + 850).color(WHITE);
// スツール×4（客側）
const stools = {};
[-1800, -600, 600, 1800].forEach((dx, i) => {
  stools["スツール_" + (i+1) + "_柱"] = cylinder(600, 45, 45).translate(ctrX + dx, ctrY + 900, 230).color(CHROME).material(chrome);
  stools["スツール_" + (i+1) + "_座"] = cylinder(85, 175, 185).translate(ctrX + dx, ctrY + 900, 830).color(RED);
});
// FACTORY（見せる仕上げ・ガラスの箱）
const factory = box(4700, 3700, 2500).translate(ZX(5.5,5.0), ZY(4.5,4.0), 230).color(GLASS).material(glassM);
// 物販棚×3（東壁沿い）
const shelves = {};
[5.0, 8.3, 11.6].forEach((y, i) => {   // ゾーン4.5..14.4内に収める（棚2.4長）
  shelves["物販棚_" + (i+1)] = box(500, 2400, 1800).translate(ZX(10.5,3.5) + 1200, ZY(y,2.4), 230).color(RED);
});
// 車顔ショーケース（エントランス）
const showcase = box(3000, 1600, 1800).translate(ZX(0,5.5), ZY(10,4.4) + 300, 230).color(RED);
const showWin  = box(3060, 1000, 700).translate(ZX(0,5.5), ZY(10,4.4) + 300, 230 + 900).color("#2a2e35");
// 吹き抜けの大ぬいぐるみ＋階段
const bigPlush = box(2400, 2400, 4000).translate(0, voidCy, 200).color(PINK);
const STAIR_N = 14, rise = F1 / STAIR_N, tread = 380, stX = VW/2 - 900;
let stair = null;
for (let i = 0; i < STAIR_N; i++) {
  const step = box(1400, tread, rise).translate(stX, (D/2 - VD + 1400) + i * tread, i * rise);
  stair = stair ? stair.union(step) : step;
}
stair = stair.color(stairC);

// ---------- 2F 什器 ----------
const drinkBar = box(4500, 600, 1000).translate(ZX(5.5,5.0), ZY(0,3.0) + 900, F1 + SLAB + 30).color(RED);
// キャラ展示台×3（ガラスケース）
const peds = {};
[[-4500,4500],[-2800,5600],[-4500,7400]].forEach((p, i) => {
  const px = p[0], py = p[1] - D/2;
  peds["展示台_" + (i+1)] = box(600, 600, 900).translate(px, py, F1 + SLAB + 30).color(WHITE);
  peds["展示ケース_" + (i+1)] = box(540, 540, 500).translate(px, py, F1 + SLAB + 30 + 900).color(GLASS).material(glassM);
});
// グッズ棚×2
const goods1 = box(1800, 450, 1800).translate(ZX(0,6.0) - 800, ZY(9,5.4), F1 + SLAB + 30).color(RED);
const goods2 = box(450, 2600, 1800).translate(ZX(0,6.0) - 2500, ZY(9,5.4), F1 + SLAB + 30).color(RED);
// ダイナー席（丸テーブル×6・川ビュー側）
const tables = {};
[[7.5,6.0],[10.0,6.0],[12.5,6.0],[7.5,9.0],[10.0,9.0],[12.5,9.0]].forEach((p, i) => {
  const tx = p[0]*1000 - W/2, ty = p[1]*1000 - D/2;
  tables["2Fテーブル_" + (i+1) + "_柱"] = cylinder(700, 55, 45).translate(tx, ty, F1 + SLAB + 30).color(CHROME).material(chrome);
  tables["2Fテーブル_" + (i+1) + "_天板"] = cylinder(40, 450, 450).translate(tx, ty, F1 + SLAB + 30 + 700).color(WHITE);
});

// ---------- 出力 ----------
return Object.assign({
  "1F 床": floor1,
  "2F 床(コの字)": floor2,
  "屋根(コの字)": roof,
}, columns, z1, {
  "1F_市松_入口ホール": hallFloor,
  "1F_市松_エントランス": entFloor,
}, z2, {
  "カウンター本体": counterBody,
  "カウンター天板": counterTop,
}, stools, {
  "FACTORYガラス": factory,
}, shelves, {
  "車顔ショーケース": showcase,
  "ショーケース窓":  showWin,
  "大ぬいぐるみ":   bigPlush,
  "階段":          stair,
  "2F_ドリンクバー": drinkBar,
}, peds, {
  "2F_グッズ棚_1":  goods1,
  "2F_グッズ棚_2":  goods2,
}, tables);

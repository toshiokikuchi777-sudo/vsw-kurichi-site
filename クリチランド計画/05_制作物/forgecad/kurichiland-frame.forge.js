/* =====================================================================
   KURICHI LAND — 柱だけ模型（構造がわかる版）  ForgeCAD .forge.js
   ---------------------------------------------------------------------
   単位: mm。座標 +X=東 / +Y=南(正面) / +Z=上。box/cylinder は底面Z=0・XY中心。
   壁を取り払い「床スラブ＋柱＋吹き抜け＋階段＋什器」を透かして見せる構造模型。
   実行: forgecad run kurichiland-frame.forge.js
   ===================================================================== */

// ---------- パラメータ（白模型と共通） ----------
const W  = Param.number("建物 幅 東西",   14000, { min: 8000, max: 20000, unit: "mm" });
const D  = Param.number("建物 奥行 南北", 14400, { min: 8000, max: 20000, unit: "mm" });
const F1 = Param.number("1F 階高",         4500, { min: 3000, max: 6000,  unit: "mm" });
const F2 = Param.number("2F 階高",         4200, { min: 3000, max: 6000,  unit: "mm" });
const SLAB= Param.number("スラブ厚",        260, { min: 100,  max: 500,   unit: "mm" });
const VW = Param.number("吹き抜け 幅",      7000, { min: 3000, max: 12000, unit: "mm" });
const VD = Param.number("吹き抜け 奥行",    9900, { min: 3000, max: 14000, unit: "mm" });
const TW = Param.number("テラス 幅",       20000, { min: 10000,max: 40000, unit: "mm" });
const TD = Param.number("テラス 奥行",      9000, { min: 4000, max: 20000, unit: "mm" });
const COLR= Param.number("柱 半径",         190, { min: 100,  max: 400,   unit: "mm" });

// ---------- 色 ----------
const C = {
  slab:"#ededed", col:"#cf7a72", plinth:"#c9c9c9", lawn:"#b9d3a2", deck:"#d8c197",
  plush:"#f0b0a8", stair:"#c9b48f", car:"#E3261D", carWin:"#2a2e35", wheel:"#333333",
};

// ---------- 敷地・基礎・デッキ（白模型と同じ土台） ----------
const site   = box(TW + 4000, D + TD + 4000, 300).translate(0, TD/2, -300).color(C.lawn);
const plinth = box(W + 700, D + 700, 320).translate(0, 0, -300).color(C.plinth);
const deck   = box(TW * 0.72, TD, 180).translate(0, D/2 + TD/2, 0).color(C.deck);

// ---------- 吹き抜け(コの字)の抜き型 ----------
const voidCy = D/2 - VD/2;
const voidCut = box(VW, VD, F2 + SLAB + 800).translate(0, voidCy, F1);

// ---------- 床スラブ（1F土間 / 2Fコの字 / 屋根コの字） ----------
const floor1 = box(W, D, 200).translate(0, 0, 0).color(C.slab);                             // 0..200
const floor2 = box(W, D, SLAB).translate(0, 0, F1).color(C.slab).subtract(voidCut);         // F1..F1+SLAB
const roof   = box(W + 300, D + 300, SLAB).translate(0, 0, F1 + F2).color(C.slab).subtract(voidCut);

// ---------- 柱（グリッド／吹き抜け内は抜く） ----------
const COLH = F1 + F2;                        // 0 → 屋根下端
const colX = [-6300, -2100, 2100, 6300];
const colY = [-6300, -2100, 2100, 6300];
const inVoid = (x, y) => Math.abs(x) < VW/2 + 50 && y > voidCy - VD/2 - 50 && y < voidCy + VD/2 + 50;
const columns = {};
let ci = 0;
for (const x of colX) for (const y of colY) {
  if (inVoid(x, y)) continue;
  columns["柱_" + (++ci)] = cylinder(COLH, COLR, COLR).translate(x, y, 0).color(C.col);
}

// ---------- 吹き抜け中央：大ぬいぐるみ ＋ オープン階段 ----------
const bigPlush = box(2400, 2400, 4000).translate(0, voidCy, 0).color(C.plush);
const STAIR_N = 14, rise = F1 / STAIR_N, tread = 380, stX = VW/2 - 900;
let stair = null;
for (let i = 0; i < STAIR_N; i++) {
  const step = box(1400, tread, rise).translate(stX, (D/2 - VD + 1400) + i * tread, i * rise);
  stair = stair ? stair.union(step) : step;
}
stair = stair.color(C.stair);

// ---------- キッチンカー（前庭・西寄り） ----------
const carY = D/2 + TD * 0.55, carX = -TW * 0.28;
const carBody = box(4200, 2000, 2000).translate(carX, carY, 180 + 520).color(C.car);
const carWin  = box(4260, 1400, 700).translate(carX, carY, 180 + 1500).color(C.carWin);
const wheel = (dx, dy) => cylinder(360, 320, 320).rotateY(90).translate(carX + dx, carY + dy, 180 + 320).color(C.wheel);

// ---------- 出力 ----------
return Object.assign({
  "敷地(芝生)":  site,
  "基礎":       plinth,
  "テラスデッキ": deck,
  "1F 床":      floor1,
  "2F 床(コの字)": floor2,
  "屋根(コの字)": roof,
}, columns, {
  "大ぬいぐるみ": bigPlush,
  "階段":        stair,
  "キッチンカー_車体": carBody,
  "キッチンカー_窓":   carWin,
  "車輪_前":     wheel( 1400, -1050),
  "車輪_後":     wheel(-1400, -1050),
});

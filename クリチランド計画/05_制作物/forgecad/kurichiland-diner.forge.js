/* =====================================================================
   KURICHI LAND — 建物 ダイナー外装（アメリカンダイナー版）  ForgeCAD
   ---------------------------------------------------------------------
   単位: mm。座標 +X=東 / +Y=南(正面・テラス・川) / +Z=上。box/cylinderは底面Z=0・XY中心。
   白模型v2をベースに外装をダイナー化:
   クリーム壁＋赤帯／赤白ストライプ庇／VSWロゴ丸看板(テクスチャ)／市松エントランス。
   実行: forgecad run kurichiland-diner.forge.js
   ===================================================================== */

// ---------- パラメータ（白模型と共通） ----------
const W    = Param.number("建物 幅 東西",   14000, { min: 8000,  max: 20000, unit: "mm" });
const D    = Param.number("建物 奥行 南北", 14400, { min: 8000,  max: 20000, unit: "mm" });
const F1   = Param.number("1F 階高",         4500, { min: 3000,  max: 6000,  unit: "mm" });
const F2   = Param.number("2F 階高",         4200, { min: 3000,  max: 6000,  unit: "mm" });
const SLAB = Param.number("屋根スラブ厚",     300, { min: 100,   max: 600,   unit: "mm" });
const VW   = Param.number("吹き抜け 幅",      7000, { min: 3000,  max: 12000, unit: "mm" });
const VD   = Param.number("吹き抜け 奥行",    9900, { min: 3000,  max: 14000, unit: "mm" });
const TW   = Param.number("テラス 幅",       20000, { min: 10000, max: 40000, unit: "mm" });
const TD   = Param.number("テラス 奥行",      9000, { min: 4000,  max: 20000, unit: "mm" });
const DOORW= Param.number("入口 幅",          4200, { min: 2000,  max: 8000,  unit: "mm" });
const DOORH= Param.number("入口 高",          3200, { min: 2400,  max: 4400,  unit: "mm" });
const SIGN_R=Param.number("看板 半径",        1500, { min: 800,   max: 2400,  unit: "mm" });

// ---------- 色（ダイナーパレット） ----------
const C = {
  cream:"#fdf6e6", cream2:"#f6eeda", band:"#E3261D", roof:"#d9d9d9", plinth:"#c9c9c9",
  lawn:"#b9d3a2", deck:"#d8c197", plush:"#f0b0a8", stair:"#c9b48f",
  red:"#E3261D", white:"#fdfaf2", ink:"#1c1a17", chrome:"#d4d8dc",
  car:"#E3261D", carWin:"#2a2e35", wheel:"#333333", glass:"#bcd6e2",
};
const chrome = { roughness: 0.22, metalness: 0.85 };
const glassWall = { roughness: 0.1, metalness: 0.0, opacity: 0.20 };   // ★透明な壁（中を見せる）

// ---------- 敷地・基礎・デッキ（白模型v2と同じ土台） ----------
const site   = box(TW + 4000, D + TD + 4000, 300).translate(0, TD/2, -300).color(C.lawn);
const plinth = box(W + 700, D + 700, 320).translate(0, 0, -300).color(C.plinth);
const deck   = box(TW * 0.72, TD, 180).translate(0, D/2 + TD/2, 0).color(C.deck);

// ---------- 吹き抜け(コの字)・入口の抜き型 ----------
const voidCy  = D/2 - VD/2;
const voidCut = box(VW, VD, F2 + SLAB + 800).translate(0, voidCy, F1);
const doorCut = box(DOORW, 3000, DOORH).translate(0, D/2, 0);

// ---------- 本体（クリーム壁） ----------
const f1   = box(W, D, F1).translate(0, 0, 0).color(C.cream).material(glassWall).subtract(doorCut);
const band = box(W + 320, D + 320, 420).translate(0, 0, F1 - 210).color(C.band).subtract(voidCut); // ★赤帯（ダイナーのライン）
const bandChrome = box(W + 380, D + 380, 70).translate(0, 0, F1 + 215).color(C.chrome).material(chrome)
  .subtract(voidCut);                                                    // 赤帯上のクロームトリム
const f2   = box(W, D, F2).translate(0, 0, F1).color(C.cream2).material(glassWall).subtract(voidCut);
const roof = box(W + 300, D + 300, SLAB).translate(0, 0, F1 + F2).color(C.roof).subtract(voidCut);
// 屋根の赤コーピング（縁どり）
const coping = box(W + 460, D + 460, 140).translate(0, 0, F1 + F2 + SLAB)
  .subtract(box(W - 200, D - 200, 400).translate(0, 0, F1 + F2 + SLAB - 100))
  .subtract(voidCut).color(C.red);

// ---------- 入口まわり：赤白ストライプの庇（キャノピー） ----------
const AWN_W = DOORW + 1600, AWN_D = 1500, AWN_T = 240;
const awnY = D/2 + AWN_D/2 - 100, awnZ = DOORH + 300;
const NST = 7, STW = AWN_W / NST;
const awning = {};
for (let i = 0; i < NST; i++) {
  const x = -AWN_W/2 + STW/2 + i * STW;
  awning["庇_" + (i+1)] = box(STW, AWN_D, AWN_T).translate(x, awnY, awnZ)
    .color(i % 2 === 0 ? C.red : C.white);
}

// ---------- VSWロゴ 丸看板（テクスチャ）＋クロームリング ----------
const logo = Import.image("./Vsw.svg.png");
const signZ = F1 + F2/2 - SIGN_R + 600;                     // 2F壁面の中央あたり
const signRing = cylinder(120, SIGN_R + 90, SIGN_R + 90).rotateX(-90)
  .translate(0, D/2 + 60, signZ + SIGN_R).color(C.chrome).material(chrome);
let signFace = cylinder(140, SIGN_R, SIGN_R).rotateX(-90)
  .translate(0, D/2 + 120, signZ + SIGN_R);
signFace = signFace.wrapTexture(logo, Wrap.flat({ onto: "front" })).color("#ffffff");

// ---------- 市松エントランス（黒白チェッカーの土間） ----------
const TILE = 700, TROWS = 2, TCOLS = 8;
const checker = {};
for (let r = 0; r < TROWS; r++) for (let c = 0; c < TCOLS; c++) {
  const x = -(TCOLS/2 - 0.5 - c) * TILE;
  const y = D/2 + TILE/2 + r * TILE;
  checker["市松_" + (r*TCOLS+c+1)] = box(TILE, TILE, 40).translate(x, y, 180)
    .color((r + c) % 2 === 0 ? C.ink : C.white);
}

// ---------- 1F 正面のショーウィンドウ帯（ガラス） ----------
const winL = box((W - DOORW)/2 - 1200, 120, 2200).translate(-(DOORW/2 + (W - DOORW)/4 + 300), D/2 + 40, 800).color(C.glass).material({ roughness: .1, metalness: .1 });
const winR = box((W - DOORW)/2 - 1200, 120, 2200).translate( (DOORW/2 + (W - DOORW)/4 + 300), D/2 + 40, 800).color(C.glass).material({ roughness: .1, metalness: .1 });

// ---------- 吹き抜けの主役＋階段（内観の目印） ----------
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
  "敷地(芝生)":     site,
  "基礎":          plinth,
  "テラスデッキ":   deck,
  "1F 壁(クリーム)": f1,
  "赤帯":          band,
  "クロームトリム":  bandChrome,
  "2F コの字":      f2,
  "屋根":          roof,
  "屋根コーピング":  coping,
}, awning, {
  "看板リング":     signRing,
  "看板(VSWロゴ)":  signFace,
}, checker, {
  "窓_西":         winL,
  "窓_東":         winR,
  "大ぬいぐるみ":   bigPlush,
  "階段":          stair,
  "キッチンカー_車体": carBody,
  "キッチンカー_窓":   carWin,
  "車輪_前":       wheel( 1400, -1050),
  "車輪_後":       wheel(-1400, -1050),
});

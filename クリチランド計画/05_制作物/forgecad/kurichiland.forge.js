/* =====================================================================
   KURICHI LAND — 白模型 v2（ボリューム確認用）  ForgeCAD .forge.js
   ---------------------------------------------------------------------
   単位: mm （1 m = 1000 mm）
   座標: +X=東 / -X=西 / +Y=南（正面・前庭・入口・川） / -Y=北（背面） / +Z=上
   ★このForgeCADは box(w,d,h) / cylinder(h,rb,rt) とも「底面 Z=0・XY中心」。
     底面を Z0 に置くには translate の z を Z0 にするだけ（+h/2 は不要）。
   目的: 2階建てのボリューム／テラス／吹き抜け(コの字)／地面の関係を正しく確認
   実行: forgecad run kurichiland.forge.js
   ===================================================================== */

// ---------- パラメータ（workbenchで調整可） ----------
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

// ---------- 色 ----------
const C = {
  mass:"#f4f4f4", mass2:"#e9e9e9", band:"#dedede", roof:"#d7d7d7", plinth:"#c9c9c9",
  lawn:"#b9d3a2", deck:"#d8c197", plush:"#f0b0a8", stair:"#c9b48f",
  car:"#E3261D", carWin:"#2a2e35", wheel:"#333333",
};

// ---------- 敷地・地面（緑の芝生：一番下に敷いて浮きを防ぐ） ----------
const siteCy = (TD) / 2;                       // 前庭ぶん前方に寄せた中心
const site = box(TW + 4000, D + TD + 4000, 300).translate(0, siteCy, -300).color(C.lawn); // -300..0

// ---------- 基礎（建物直下の少し大きいプリンス） ----------
const plinth = box(W + 700, D + 700, 320).translate(0, 0, -300).color(C.plinth);           // -300..20

// ---------- 吹き抜け(コの字)の抜き型：前面(+Y)へ開口・2F〜屋根を貫く ----------
const voidCy = D/2 - VD/2;                      // 前面edgeに到達＝コの字開口
const voidCut = box(VW, VD, F2 + SLAB + 800).translate(0, voidCy, F1);

// ---------- 入口の抜き型（1F 正面中央の大開口） ----------
const doorCut = box(DOORW, 3000, DOORH).translate(0, D/2, 0);

// ---------- 1F（フルフロア − 入口） ----------
const f1 = box(W, D, F1).translate(0, 0, 0).color(C.mass).subtract(doorCut);               // 0..F1

// ---------- 階間スラブ帯（2階建てに見せる水平ライン・少し庇状に出す） ----------
const band = box(W + 260, D + 260, 160).translate(0, 0, F1 - 80).color(C.band).subtract(voidCut);

// ---------- 2F（フル − 吹き抜け ＝ コの字） ----------
const f2 = box(W, D, F2).translate(0, 0, F1).color(C.mass2).subtract(voidCut);             // F1..F1+F2

// ---------- 屋根（吹き抜け上は開放） ----------
const roof = box(W + 300, D + 300, SLAB).translate(0, 0, F1 + F2).color(C.roof).subtract(voidCut);

// ---------- テラスデッキ（前庭・木調の一段） ----------
const deck = box(TW * 0.72, TD, 180).translate(0, D/2 + TD/2, 0).color(C.deck);            // 0..180

// ---------- 吹き抜け中央：大きなクリチのぬいぐるみ（主役・2Fから見下ろせる） ----------
const bigPlush = box(2400, 2400, 4000).translate(0, voidCy, 0).color(C.plush);             // 0..4000

// ---------- 吹き抜けのオープン階段（1F→2F・東寄り） ----------
const STAIR_N = 14, rise = F1 / STAIR_N, tread = 380, stX = VW/2 - 900;
let stair = null;
for (let i = 0; i < STAIR_N; i++) {
  const step = box(1400, tread, rise).translate(stX, (D/2 - VD + 1400) + i * tread, i * rise);
  stair = stair ? stair.union(step) : step;
}
stair = stair.color(C.stair);

// ---------- キッチンカー（前庭・西寄り） ----------
const carY = D/2 + TD * 0.55, carX = -TW * 0.28;
const carBody = box(4200, 2000, 2000).translate(carX, carY, 180 + 520).color(C.car);       // 車体
const carWin  = box(4260, 1400, 700).translate(carX, carY, 180 + 1500).color(C.carWin);    // 窓帯
const wheel = (dx, dy) => cylinder(360, 320, 320).rotateY(90)
  .translate(carX + dx, carY + dy, 180 + 320).color(C.wheel);

// ---------- 出力（部品ツリー） ----------
return {
  "敷地(芝生)":       site,
  "基礎":            plinth,
  "テラスデッキ":     deck,
  "1F ボリューム":    f1,
  "階間スラブ帯":     band,
  "2F コの字":        f2,
  "屋根":            roof,
  "大ぬいぐるみ":     bigPlush,
  "階段":            stair,
  "キッチンカー_車体": carBody,
  "キッチンカー_窓":   carWin,
  "車輪_前":         wheel( 1400, -1050),
  "車輪_後":         wheel(-1400, -1050),
};

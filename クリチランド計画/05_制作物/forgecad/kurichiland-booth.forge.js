/* =====================================================================
   KURICHI LAND — ダイナーブース席セット（対面ソファ＋テーブル） ForgeCAD
   ---------------------------------------------------------------------
   単位: mm。box/cylinder は底面Z=0・XY中心。roundedRect().extrude() も底面Z=0。
   アメリカンダイナー定番: 赤ビニールのハイバックソファ×2（対面）＋
   白天板×赤エッジのペデスタルテーブル（クローム柱）。
   実行: forgecad run kurichiland-booth.forge.js
   ===================================================================== */

// ---------- パラメータ ----------
const BW      = Param.number("ブース幅",       1200, { min: 900,  max: 1600, unit: "mm" }); // X方向
const SEAT_H  = Param.number("座面高",          430, { min: 380,  max: 480,  unit: "mm" });
const SEAT_D  = Param.number("座 奥行",         480, { min: 400,  max: 560,  unit: "mm" });
const BACK_H  = Param.number("背 高(全高)",    1050, { min: 850,  max: 1300, unit: "mm" });
const BACK_T  = Param.number("背 厚",           110, { min: 80,   max: 160,  unit: "mm" });
const TBL_W   = Param.number("テーブル幅",     1100, { min: 800,  max: 1400, unit: "mm" }); // X方向
const TBL_D   = Param.number("テーブル奥行",    620, { min: 500,  max: 800,  unit: "mm" }); // Y方向
const TBL_H   = Param.number("テーブル高",      740, { min: 680,  max: 780,  unit: "mm" });

// ---------- 色 ----------
const RED = "#E3261D", CHROME = "#d4d8dc", WHITE = "#fdfaf2", INK = "#241f1a";
const vinyl  = { roughness: 0.45 };
const chrome = { roughness: 0.22, metalness: 0.85 };
const gloss  = { roughness: 0.3 };

// ====== ベンチ（1台分を関数化。dir=+1: 前向き(+Y向き・南側に座る), -1: 対面 ======
// ソファ中心線: 座の前端がテーブル端に少し(50mm)かかる位置
const seatFrontY = TBL_D / 2 - 50;                    // dir=+1 側の座の前端
function bench(dir) {
  const seatY = dir * (seatFrontY + SEAT_D / 2);      // 座の中心Y
  const backY = dir * (seatFrontY + SEAT_D + BACK_T / 2); // 背の中心Y
  // 台座（腰壁・ビニール巻き）
  const plinth = box(BW, SEAT_D, SEAT_H - 90).translate(0, seatY, 0).color(RED).material(vinyl);
  // 座クッション（角丸・前に少しはみ出す）
  const cushion = roundedRect(BW, SEAT_D + 60, 60).extrude(110)
    .translate(0, seatY - dir * 20, SEAT_H - 110).color(RED).material(vinyl);
  // 背（ハイバック・縦ロール感は角丸で表現）
  // rotateX(90)後: 高さはZ中心振り分け・厚みはY 0..-BACK_T → 中心合わせで+BACK_T/2
  const back = roundedRect(BW, BACK_H, 55).extrude(BACK_T)
    .rotateX(90)
    .translate(0, backY + BACK_T / 2, BACK_H / 2 + 5)
    .color(RED).material(vinyl);
  // クロームのトップレール
  const rail = box(BW, BACK_T + 30, 45).translate(0, backY, BACK_H).color(CHROME).material(chrome);
  return { plinth, cushion, back, rail };
}
const A = bench( 1);   // 南側（+Y）
const B = bench(-1);   // 北側（-Y）

// ====== ペデスタルテーブル ======
const top   = roundedRect(TBL_W, TBL_D, 70).extrude(30).translate(0, 0, TBL_H - 30).color(WHITE).material(gloss);
const edge  = roundedRect(TBL_W + 30, TBL_D + 30, 80).extrude(40)
  .translate(0, 0, TBL_H - 70).color(RED).material(gloss);           // 赤エッジ層（天板の下に重ねる2層レトロ）
const stem  = cylinder(TBL_H - 40 - 35, 55, 45).translate(0, 0, 35).color(CHROME).material(chrome);
const foot  = cylinder(35, 260, 230).color(CHROME).material(chrome);

// ---------- 出力 ----------
return {
  "ソファ南_台座":   A.plinth,
  "ソファ南_座":     A.cushion,
  "ソファ南_背":     A.back,
  "ソファ南_レール": A.rail,
  "ソファ北_台座":   B.plinth,
  "ソファ北_座":     B.cushion,
  "ソファ北_背":     B.back,
  "ソファ北_レール": B.rail,
  "テーブル天板":    top,
  "テーブル赤エッジ": edge,
  "テーブル柱":      stem,
  "テーブルベース":  foot,
};

/* =====================================================================
   KURICHI LAND — ダイナーテーブル（自立4人卓） ForgeCAD
   ---------------------------------------------------------------------
   単位: mm。box/cylinder は底面Z=0・XY中心。
   ブース卓と同じ意匠（白天板×赤エッジ×クロームペデスタル）の自立版。
   ダイナーチェア(座450)×4 と組む。実行: forgecad run kurichiland-table.forge.js
   ===================================================================== */

const TW = Param.number("天板 幅",   1200, { min: 700, max: 1600, unit: "mm" });
const TD = Param.number("天板 奥行",  750, { min: 600, max: 1200, unit: "mm" });
const TH = Param.number("天板 高",    740, { min: 680, max: 780,  unit: "mm" });

const RED = "#E3261D", CHROME = "#d4d8dc", WHITE = "#fdfaf2";
const chrome = { roughness: 0.22, metalness: 0.85 };
const gloss  = { roughness: 0.3 };

// 白天板（角丸）＋赤エッジ層（2層レトロ）
const top  = roundedRect(TW, TD, 90).extrude(30).translate(0, 0, TH - 30).color(WHITE).material(gloss);
const edge = roundedRect(TW + 30, TD + 30, 100).extrude(40).translate(0, 0, TH - 70).color(RED).material(gloss);

// クロームペデスタル（テーパー柱＋十字ベース）
const stem = cylinder(TH - 70 - 40, 60, 48).translate(0, 0, 40).color(CHROME).material(chrome);
const baseDisc = cylinder(40, 280, 240).color(CHROME).material(chrome);
const footX = box(760, 90, 55).translate(0, 0, 0).color(CHROME).material(chrome);
const footY = box(90, 560, 55).translate(0, 0, 0).color(CHROME).material(chrome);

return {
  "天板":       top,
  "赤エッジ":    edge,
  "柱":         stem,
  "ベース盤":    baseDisc,
  "ベース脚_X":  footX,
  "ベース脚_Y":  footY,
};

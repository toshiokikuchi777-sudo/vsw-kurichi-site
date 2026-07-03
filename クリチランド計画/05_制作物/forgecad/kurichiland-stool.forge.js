/* =====================================================================
   KURICHI LAND — カウンタースツール（アメリカンダイナー） ForgeCAD
   ---------------------------------------------------------------------
   単位: mm。box/cylinder は底面Z=0・XY中心。
   クローム柱＋赤ビニール座＋フットリング。カウンター(h≈1000)用に座面680。
   実行: forgecad run kurichiland-stool.forge.js
   ===================================================================== */

const SEAT_H  = Param.number("座面高",     680, { min: 580, max: 780, unit: "mm" });
const SEAT_R  = Param.number("座 半径",    185, { min: 140, max: 240, unit: "mm" });
const SEAT_T  = Param.number("座 厚",       85, { min: 50,  max: 120, unit: "mm" });
const COL_R   = Param.number("柱 半径",     45, { min: 30,  max: 70,  unit: "mm" });
const BASE_R  = Param.number("ベース半径", 200, { min: 150, max: 280, unit: "mm" });
const RING_Z  = Param.number("フットリング高", 220, { min: 120, max: 350, unit: "mm" });

const RED = "#E3261D", CHROME = "#d4d8dc";
const vinyl  = { roughness: 0.45 };
const chrome = { roughness: 0.22, metalness: 0.85 };

// ベース（床の円盤・クローム）
const base = cylinder(45, BASE_R, BASE_R * 0.82).color(CHROME).material(chrome);

// 柱（クローム）
const col = cylinder(SEAT_H - SEAT_T - 45, COL_R, COL_R).translate(0, 0, 45).color(CHROME).material(chrome);

// フットリング（足のせ・クローム）
const ring = cylinder(30, BASE_R - 15, BASE_R - 15)
  .subtract(cylinder(50, BASE_R - 65, BASE_R - 65).translate(0, 0, -10))
  .translate(0, 0, RING_Z).color(CHROME).material(chrome);

// 座下のクロームバンド（回転盤）
const band = cylinder(28, SEAT_R - 12, SEAT_R - 12).translate(0, 0, SEAT_H - SEAT_T - 28).color(CHROME).material(chrome);

// 座面（赤ビニール・少し裾すぼまり＝クッションのふくらみ表現）
const seat = cylinder(SEAT_T, SEAT_R * 0.94, SEAT_R).translate(0, 0, SEAT_H - SEAT_T).color(RED).material(vinyl);

return {
  "ベース":        base,
  "柱":           col,
  "フットリング":   ring,
  "座下バンド":     band,
  "座面":         seat,
};

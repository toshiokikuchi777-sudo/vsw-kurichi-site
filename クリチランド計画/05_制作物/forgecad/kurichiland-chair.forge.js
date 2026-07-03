/* =====================================================================
   KURICHI LAND — ダイナーチェア（赤・レトロポップ）  ForgeCAD .forge.js
   ---------------------------------------------------------------------
   単位: mm / 角度: 度。box・cylinder は「底面 Z=0・XY中心」。
   人間工学: 座面高 450 / 座面 460x460 / 背もたれ上端 ~850。
   実行: forgecad run kurichiland-chair.forge.js   /  forgecad show ... で画像
   ===================================================================== */

// ---------- パラメータ（workbenchで調整可） ----------
const SEAT_H = Param.number("座面高",       450, { min: 400, max: 520, unit: "mm" });
const SEAT_W = Param.number("座面 幅",      460, { min: 380, max: 560, unit: "mm" });
const SEAT_D = Param.number("座面 奥行",    460, { min: 380, max: 560, unit: "mm" });
const SEAT_T = Param.number("座面 厚",       55, { min: 30,  max: 90,  unit: "mm" });
const SEAT_R = Param.number("座面 角R",      70, { min: 10,  max: 120, unit: "mm" });
const BACK_W = Param.number("背 幅",        430, { min: 300, max: 540, unit: "mm" });
const BACK_H = Param.number("背 高",        400, { min: 250, max: 520, unit: "mm" });
const BACK_T = Param.number("背 厚",         48, { min: 25,  max: 80,  unit: "mm" });
const BACK_R = Param.number("背 角R",        60, { min: 10,  max: 120, unit: "mm" });
const BACK_TILT = Param.number("背 傾き",     7, { min: 0,   max: 20,  unit: "deg" });
const LEG_H  = Param.number("脚 高",        395, { min: 300, max: 470, unit: "mm" }); // 座面下端まで
const LEG_RB = Param.number("脚 下半径",     13, { min: 6,   max: 30,  unit: "mm" });
const LEG_RT = Param.number("脚 上半径",     19, { min: 6,   max: 34,  unit: "mm" });
const LEG_INSET = Param.number("脚 内側入れ", 62, { min: 30, max: 120, unit: "mm" });
const RUNG_Z = Param.number("貫(ぬき) 高",  150, { min: 80,  max: 300, unit: "mm" });

// ---------- 色 ----------
const RED = "#E3261D", METAL = "#c9ccd0", RUNG = "#b7bbc0";

// ---------- 座面（角丸パネル） ----------
const seat = roundedRect(SEAT_W, SEAT_D, SEAT_R).extrude(SEAT_T)
  .translate(0, 0, SEAT_H - SEAT_T)
  .color(RED).material({ roughness: 0.5 });

// ---------- 背もたれ（角丸・後傾） ----------
// 縦パネル: 430(x) × BACK_T(y) × BACK_H(z)。roundedRectを立てて角丸を効かせる。
let back = roundedRect(BACK_W, BACK_H, BACK_R).extrude(BACK_T) // XY面: 幅×高、厚みZ
  .rotateX(90)                                                  // 立てる: 高さ→Z
  .rotateX(BACK_TILT)                                           // 後傾（top を -Y=後ろへ）
  .translate(0, -(SEAT_D / 2 - BACK_T), SEAT_H + BACK_H / 2)    // 背面(-Y)・座面上へ
  .color(RED).material({ roughness: 0.5 });

// ---------- 脚（4本・テーパー） ----------
const lx = SEAT_W / 2 - LEG_INSET, ly = SEAT_D / 2 - LEG_INSET;
const legAt = (sx, sy) => cylinder(LEG_H, LEG_RB, LEG_RT)
  .translate(sx * lx, sy * ly, 0).color(METAL).material({ roughness: 0.35, metalness: 0.7 });

// ---------- 貫（脚をつなぐ横桟：ダイナー感＆補強） ----------
const rungX = (yy) => box(2 * lx + 2 * LEG_RT, 16, 16).translate(0, yy * ly, RUNG_Z).color(RUNG);
const rungY = (xx) => box(16, 2 * ly + 2 * LEG_RT, 16).translate(xx * lx, 0, RUNG_Z).color(RUNG);

// ---------- 出力 ----------
return {
  "座面":     seat,
  "背もたれ":  back,
  "脚_前右":   legAt( 1,  1),
  "脚_前左":   legAt(-1,  1),
  "脚_後右":   legAt( 1, -1),
  "脚_後左":   legAt(-1, -1),
  "貫_前":     rungX( 1),
  "貫_後":     rungX(-1),
  "貫_左":     rungY(-1),
  "貫_右":     rungY( 1),
};

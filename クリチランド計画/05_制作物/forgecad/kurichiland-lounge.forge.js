/* =====================================================================
   KURICHI LAND — ラウンジチェア（リラックス／赤レトロポップ） ForgeCAD
   ---------------------------------------------------------------------
   単位: mm / 角度: 度。roundedRect().extrude() は底面 Z=0。
   cylinder(h, rBottom, rTop) は底面 Z=0・XY中心。
   コンセプト: 低め・広め・厚クッション・後傾18°・アーム付き＋オットマン(足のせ)。
   実行: forgecad run kurichiland-lounge.forge.js
   ===================================================================== */

// ---------- パラメータ（workbenchで調整可） ----------
const SEAT_H   = Param.number("座面高",       400, { min: 360, max: 460, unit: "mm" });
const SEAT_W   = Param.number("座面 幅",      580, { min: 480, max: 680, unit: "mm" });
const SEAT_D   = Param.number("座面 奥行",    560, { min: 480, max: 680, unit: "mm" });
const SEAT_T   = Param.number("座面 厚",       95, { min: 60,  max: 140, unit: "mm" });
const SEAT_R   = Param.number("座面 角R",      95, { min: 20,  max: 150, unit: "mm" });
const BACK_W   = Param.number("背 幅",        560, { min: 400, max: 660, unit: "mm" });
const BACK_H   = Param.number("背 高",        500, { min: 350, max: 640, unit: "mm" });
const BACK_T   = Param.number("背 厚",         95, { min: 60,  max: 140, unit: "mm" });
const BACK_R   = Param.number("背 角R",        90, { min: 20,  max: 150, unit: "mm" });
const BACK_TILT= Param.number("背 傾き",       18, { min: 8,   max: 28,  unit: "deg" });
const ARM_TOP  = Param.number("肘掛 高",      620, { min: 540, max: 720, unit: "mm" });
const ARM_W    = Param.number("肘掛 幅",       80, { min: 50,  max: 130, unit: "mm" });
const ARM_L    = Param.number("肘掛 長",      500, { min: 380, max: 620, unit: "mm" });
const ARM_T    = Param.number("肘掛 厚",       65, { min: 40,  max: 100, unit: "mm" });
const ARM_R    = Param.number("肘掛 角R",      32, { min: 10,  max: 60,  unit: "mm" });
const LEG_RB   = Param.number("脚 下半径",     15, { min: 8,   max: 30,  unit: "mm" });
const LEG_RT   = Param.number("脚 上半径",     22, { min: 8,   max: 36,  unit: "mm" });
const LEG_INSET= Param.number("脚 内側入れ",   70, { min: 40,  max: 140, unit: "mm" });
const OTTOMAN  = true;   // 足のせオットマンを前に置く

// ---------- 色 ----------
const RED = "#E3261D", METAL = "#c9ccd0";
const soft = { roughness: 0.55 };
const chrome = { roughness: 0.35, metalness: 0.7 };

// ---------- 座面（厚クッション・角丸） ----------
const seat = roundedRect(SEAT_W, SEAT_D, SEAT_R).extrude(SEAT_T)
  .translate(0, 0, SEAT_H - SEAT_T).color(RED).material(soft);

// ---------- 背もたれ（厚・後傾18°） ----------
const back = roundedRect(BACK_W, BACK_H, BACK_R).extrude(BACK_T)
  .rotateX(90)                                    // 立てる
  .rotateX(BACK_TILT)                             // 後傾（top を -Y=後ろへ）
  .translate(0, -(SEAT_D / 2 - BACK_T * 0.6), SEAT_H + BACK_H / 2 - 40)
  .color(RED).material(soft);

// ---------- 脚（4本・テーパークローム・座面下端まで） ----------
const legH = SEAT_H - SEAT_T;
const lx = SEAT_W / 2 - LEG_INSET, ly = SEAT_D / 2 - LEG_INSET;
const legAt = (sx, sy) => cylinder(legH, LEG_RB, LEG_RT)
  .translate(sx * lx, sy * ly, 0).color(METAL).material(chrome);

// ---------- 肘掛（赤パッド＋前後の金属ポスト） ----------
const armX = SEAT_W / 2 - ARM_W / 2 + 25;
const armPad = (sx) => roundedRect(ARM_W, ARM_L, ARM_R).extrude(ARM_T)
  .translate(sx * armX, -20, ARM_TOP - ARM_T).color(RED).material(soft);
const armPostH = (ARM_TOP - ARM_T) - legH;
const armPost = (sx, fy) => cylinder(armPostH, 13, 16)
  .translate(sx * armX, fy * (ARM_L / 2 - 60) - 20, legH).color(METAL).material(chrome);

// ---------- 出力 ----------
const out = {
  "座面":       seat,
  "背もたれ":    back,
  "脚_前右":     legAt( 1,  1),
  "脚_前左":     legAt(-1,  1),
  "脚_後右":     legAt( 1, -1),
  "脚_後左":     legAt(-1, -1),
  "肘掛_右":     armPad( 1),
  "肘掛_左":     armPad(-1),
  "肘ポスト_右前": armPost( 1,  1),
  "肘ポスト_右後": armPost( 1, -1),
  "肘ポスト_左前": armPost(-1,  1),
  "肘ポスト_左後": armPost(-1, -1),
};

// ---------- オットマン（足のせ・前方 +Y） ----------
if (OTTOMAN) {
  const oH = 380, oW = SEAT_W - 60, oD = 420, oT = 90;
  const oy = SEAT_D / 2 + 300;
  out["オットマン座"] = roundedRect(oW, oD, 80).extrude(oT)
    .translate(0, oy, oH - oT).color(RED).material(soft);
  const olx = oW / 2 - 70, oly = oD / 2 - 70;
  const oLeg = (sx, sy) => cylinder(oH - oT, LEG_RB, LEG_RT)
    .translate(sx * olx, oy + sy * oly, 0).color(METAL).material(chrome);
  out["オ脚_前右"] = oLeg( 1,  1);
  out["オ脚_前左"] = oLeg(-1,  1);
  out["オ脚_後右"] = oLeg( 1, -1);
  out["オ脚_後左"] = oLeg(-1, -1);
}

return out;

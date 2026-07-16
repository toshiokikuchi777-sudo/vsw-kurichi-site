/* =====================================================================
   りんご（Apple） ForgeCAD
   単位: mm。sphere は中心が原点、cylinder は底面Z=0・XY中心。
   実行: forgecad run apple.forge.js
   ===================================================================== */

const BODY_R = Param.number("果実半径", 40, { min: 30, max: 60, unit: "mm" });

const RED      = "#cc1122";
const RED_DARK = "#8b0a1a";
const GREEN    = "#3d7a2a";
const BROWN    = "#5c3317";

const fruitMat = { roughness: 0.45, metalness: 0.0 };
const stemMat  = { roughness: 0.7, metalness: 0.0 };
const leafMat  = { roughness: 0.5, metalness: 0.0 };

// --- 果実本体（球を少し上下から潰す表現として、2つの球を重ねる） ---
const bodyMain = sphere(BODY_R, 48)
  .translate(0, 0, BODY_R + 5)
  .color(RED)
  .material(fruitMat);

// 底部の凹みを作るカッター
const bottomDent = sphere(12, 32)
  .translate(0, 0, 2)
  .color(RED);

const body = bodyMain.subtract(bottomDent);

// 上部の凹み（ヘタ周り）
const topDent = sphere(10, 32)
  .translate(0, 0, BODY_R * 2 + 5)
  .color(RED);

const bodyFinal = body.subtract(topDent);

// --- 茎（ヘタ） ---
const stem = cylinder(18, 2.5, 1.8)
  .translate(0, 0, BODY_R * 2 - 2)
  .color(BROWN)
  .material(stemMat);

// --- 葉 ---
const leafShape = sphere(12, 32)
  .translate(8, 0, BODY_R * 2 + 8)
  .color(GREEN)
  .material(leafMat);

// 葉を薄く切るためのカッター（上下からスライス）
const leafCutTop = box(30, 30, 20)
  .translate(8, 0, BODY_R * 2 + 18)
  .color(GREEN);

const leafCutBot = box(30, 30, 20)
  .translate(8, 0, BODY_R * 2 - 8)
  .color(GREEN);

const leaf = leafShape.subtract(leafCutTop).subtract(leafCutBot);

return {
  "果実": bodyFinal,
  "茎": stem,
  "葉": leaf,
};
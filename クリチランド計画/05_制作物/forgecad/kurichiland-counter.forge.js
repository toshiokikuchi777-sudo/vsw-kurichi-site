/* =====================================================================
   KURICHI LAND — メインカウンター（1F受渡し・W5000） ForgeCAD
   ---------------------------------------------------------------------
   単位: mm。box/cylinder は底面Z=0・XY中心。
   フロアプラン「メインカウンター・受渡し 5.0×2.5m」用。
   赤ビニール前板＋クロームリブ＋白天板＋フットレール。スツール(座680)と対。
   客側=+Y（南）。実行: forgecad run kurichiland-counter.forge.js
   ===================================================================== */

const CW = Param.number("カウンター幅", 5000, { min: 2000, max: 8000, unit: "mm" });
const CD = Param.number("本体奥行",      700, { min: 500,  max: 1000, unit: "mm" });
const CH = Param.number("天板高",       1000, { min: 900,  max: 1150, unit: "mm" });

const RED = "#E3261D", CHROME = "#d4d8dc", WHITE = "#fdfaf2", INK = "#1c1a17";
const chrome = { roughness: 0.22, metalness: 0.85 };
const vinyl  = { roughness: 0.45 };
const gloss  = { roughness: 0.3 };

// 台輪（キック・黒）
const kick = box(CW - 120, CD - 120, 150).color(INK);

// 本体（赤ビニール前板）
const body = box(CW, CD, CH - 150 - 60).translate(0, 0, 150).color(RED).material(vinyl);

// クロームの縦リブ（前面 +Y側・ダイナー流のフルーティング）
const ribs = {};
const NR = 11, pitch = (CW - 400) / (NR - 1);
for (let i = 0; i < NR; i++) {
  const x = -(CW - 400)/2 + i * pitch;
  ribs["リブ_" + (i+1)] = box(60, 40, CH - 150 - 120).translate(x, CD/2 + 8, 180)
    .color(CHROME).material(chrome);
}

// 白天板（客側へオーバーハング）
const top = box(CW + 200, CD + 320, 60).translate(0, 60, CH - 60).color(WHITE).material(gloss);
// 天板の赤エッジ層
const edge = box(CW + 260, CD + 380, 36).translate(0, 60, CH - 96).color(RED).material(gloss);

// フットレール（客側・クロームパイプ）
const rail = box(CW - 500, 70, 70).translate(0, CD/2 + 260, 170).color(CHROME).material(chrome);
const railFoot = (sx) => box(70, 260, 60).translate(sx * (CW/2 - 400), CD/2 + 160, 60).color(CHROME).material(chrome);
// レール脚は床から: 支柱
const railPost = (sx) => box(60, 60, 170).translate(sx * (CW/2 - 400), CD/2 + 260, 0).color(CHROME).material(chrome);

// バックカウンター（厨房側の作業台・ステンレス）
const backTop = box(CW - 800, 600, 40).translate(0, -CD/2 - 500, 860).color(CHROME).material(chrome);
const backBody = box(CW - 800, 600, 860).translate(0, -CD/2 - 500, 0).color("#e8e6df");

return Object.assign({
  "台輪":         kick,
  "本体(赤)":     body,
}, ribs, {
  "白天板":       top,
  "赤エッジ":     edge,
  "フットレール":  rail,
  "レール支柱_西": railPost(-1),
  "レール支柱_東": railPost( 1),
  "バック作業台":  backBody,
  "バック天板":    backTop,
});

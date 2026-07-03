/* =====================================================================
   KURICHI LAND — 2F ミュージアム什器セット（展示台＋グッズ棚） ForgeCAD
   ---------------------------------------------------------------------
   単位: mm。box/cylinder は底面Z=0・XY中心。
   左: キャラ展示台（白ペデスタル＋ガラスケース）×クリチ模型用
   右: グッズ棚（赤フレーム3段・販売ぬいぐるみ 大中小）
   実行: forgecad run kurichiland-display.forge.js
   ===================================================================== */

const PED_W = Param.number("展示台 幅",   600, { min: 400, max: 900,  unit: "mm" });
const PED_H = Param.number("展示台 高",   900, { min: 600, max: 1100, unit: "mm" });
const CASE_H= Param.number("ケース高",    550, { min: 300, max: 800,  unit: "mm" });
const SH_W  = Param.number("棚 幅",      1800, { min: 1200,max: 2400, unit: "mm" });
const SH_D  = Param.number("棚 奥行",     450, { min: 350, max: 600,  unit: "mm" });
const SH_H  = Param.number("棚 高",      1800, { min: 1400,max: 2200, unit: "mm" });

const RED = "#E3261D", WHITE = "#fdfaf2", GLASS = "#cfe4ee", PINK = "#f0b0a8";
const gloss = { roughness: 0.3 };
const glassM = { roughness: 0.08, metalness: 0.1 };

// ---------- 展示台（西側 x=-900） ----------
const px = -900;
const ped  = box(PED_W, PED_W, PED_H).translate(px, 0, 0).color(WHITE).material(gloss);
const pedTop = box(PED_W + 60, PED_W + 60, 30).translate(px, 0, PED_H).color(RED).material(gloss);
const caseG = box(PED_W - 60, PED_W - 60, CASE_H).translate(px, 0, PED_H + 30).color(GLASS).material(glassM);
// 中の展示物（クリチ模型のダミー）
const item = box(220, 220, 260).translate(px, 0, PED_H + 40).color(PINK);

// ---------- グッズ棚（東側 x=+700・赤フレーム3段） ----------
const sx = 700;
const side = (dx) => box(50, SH_D, SH_H).translate(sx + dx, 0, 0).color(RED).material(gloss);
const backP = box(SH_W - 100, 30, SH_H).translate(sx, -SH_D/2 + 15, 0).color(WHITE).material(gloss);
const shelf = (z) => box(SH_W - 100, SH_D - 60, 35).translate(sx, 10, z).color(RED).material(gloss);
// 棚上のぬいぐるみ 大中小（ダミー）
const plush = (dx, z, s) => box(s, s, s * 1.15).translate(sx + dx, 20, z).color(PINK);

return {
  "展示台":       ped,
  "展示台トップ":  pedTop,
  "ガラスケース":  caseG,
  "展示物(模型)":  item,
  "棚_側板西":    side(-(SH_W/2 - 25)),
  "棚_側板東":    side( (SH_W/2 - 25)),
  "棚_背板":      backP,
  "棚板_下":      shelf(420),
  "棚板_中":      shelf(950),
  "棚板_上":      shelf(1450),
  "ぬいぐるみ大":  plush(-450, 455, 420),
  "ぬいぐるみ中":  plush( 100, 985, 300),
  "ぬいぐるみ小":  plush( 500, 1485, 200),
};

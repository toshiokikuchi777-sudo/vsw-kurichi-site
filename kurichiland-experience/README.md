# クリチランド ｜ 体験できるWebGL空間

石家庄 Neverland 滹沱河集 の中心に出店する「KURICHI LAND（約650㎡）」を、ブラウザで歩いて体験できる3Dデモ。
確定コンセプト（赤黄レトロポップ・食べられるキャラIP空間／KURICHI FACTORY＋KURICHI GARDEN／木・緑・水でNeverlandと調和）に準拠。Three.js製・ライブラリ同梱でオフライン動作。

## 起動方法（重要）

ESモジュールを使うため、`index.html` を**ダブルクリックでは開けません**（ローカルサーバが必要）。

```bash
# このフォルダ内で実行
cd "クリチランド計画/05_制作物/kurichiland-webgl"
python3 -m http.server 8000
# ブラウザで http://localhost:8000/ を開く
```

※ Claude Code のプレビューパネルからも閲覧可。

## 操作

- **マウス**：ドラッグ＝見回す／ホイール＝ズーム／右ドラッグ＝平行移動
- **キーボード**：`W A S D`＝移動／`Q E`＝上下／`Shift`＝加速／矢印キーも可
- **スマホ**：1本指＝見回す／2本指＝ズーム・移動
- **下部ボタン**：全体／入口／FACTORY／GARDEN／フォトスポット へ視点移動、全画面

## 構成（コードの当たり）
- `index.html` … シーン全体（1ファイル完結）
- `lib/three.module.js`, `lib/jsm/controls/OrbitControls.js` … 同梱ライブラリ

## 空間の中身
- **KURICHI FACTORY（屋内200㎡）**：マーキー看板／ガラスストアフロント／メインカウンター＋Got KURICHI?／メニュー／グッズ棚／KURICHI FACTORYガラス区画／ボクセルキャラ像
- **KURICHI GARDEN（屋外450㎡）**：ウッドデッキ／丸テーブル＋赤チェア＋ロゴパラソル／プランター花壇／石畳の小道
- **アイコン**：入口の車顔ショーケース／赤いサインポール／Got KURICHI? フォトスポット
- **環境**：河心島（川に浮かぶ島）＋砂浜／緑＆ピンク（粉黛芝風）の植栽＝Neverlandの生態トーン

## カスタムの勘所（次の改善）
- 配色：`COL` オブジェクト（赤=`red` / 黄=`yellow` / クリーム=`cream` ほか）
- 視点プリセット：`VIEWS` オブジェクト
- 什器の差し替え：`carShowcase()` / `mascot()` / `tableSet()` など各ファクトリ関数
- 実ロゴ・キャラ画像を貼る場合：`canvasFromText` をテクスチャ読込（`THREE.TextureLoader`）に置換し、`assets/3d/` のボクセル素材や既存ブース3Dを流用

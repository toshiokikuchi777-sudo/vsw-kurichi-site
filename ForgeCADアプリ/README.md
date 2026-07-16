# ForgeCADアプリ（クリチランド建築シミュレータ＋テキストスパイラル）

このフォルダが**アプリの入口**。人間もAIも、まずここを読むこと。
他のAIアシスタント（Cursor / ChatGPT / Claude等）が作業を引き継ぐための仕様書を兼ねる。

## 1. フォルダ構成と起動

```
VSW-site-20260417/                  ← サイトルート（このフォルダの親。ここをHTTP配信する）
├── ForgeCADアプリ/                 ← ★このフォルダ＝入口
│   ├── ForgeCAD起動.command        ← ダブルクリック→建築シミュレータが開く
│   ├── スパイラル起動.command      ← ダブルクリック→テキストスパイラルが開く
│   ├── ai-bridge.py                ← AIブリッジ（port 8788・下記§5）
│   ├── アプリ本体 →                ← kurichiland-forge/ へのエイリアス
│   ├── 使い方.txt                  ← エンドユーザー向けの説明
│   └── README.md                   ← 本書
└── kurichiland-forge/              ← アプリ本体（すべて単一HTML方式）
    ├── index.html                  ← 建築シミュレータ（約6,800行・Three.js r160）
    ├── text-spiral.html            ← テキストスパイラル（約2,900行）
    ├── lib/                        ← three.module.js r160・jsm各種・three-bvh-csg
    ├── *.glb                       ← カタログモデル58種（mm単位・Z-up）
    ├── generated/                  ← AI生成GLBの出力先
    ├── photos/                     ← カメラ撮影の保存先
    └── manifest.webmanifest ほか   ← PWA用（icon-192/512.png）
```

- **起動は .command のダブルクリックだけ**。サイトルートで `python3 -m http.server 8787` を起動し、
  ai-bridge.py（8788）も自動起動し、ブラウザで開く。
- 手動起動する場合: サイトルートで `python3 -m http.server 8787` →
  `http://localhost:8787/kurichiland-forge/index.html`
- **file:// では動かない**（ES Modules）。必ずHTTPサーバ経由。
- PWA: 開いた状態でChrome「インストール」/Safari「Dockに追加」でアプリ化できる。

## 2. 絶対に守るルール

1. **git push しない**（このアプリ群はローカル運用。vsw.co.jp のGitHub Pagesと同居しているため、
   push すると意図せず公開される・デプロイが壊れることがある）
2. index.html / text-spiral.html は**単一HTMLに全実装**が入っている。外部JSファイルへ分割しない
3. 同一ファイルへの並行編集禁止（AIエージェントを複数使う場合は必ず直列に）
4. 編集後は必ず: `<script type="module">` 部分を抽出して `node --check`、id重複チェック、
   ブラウザでコンソールエラーゼロ確認
5. lib/ 配下のthree.js関連は **r160固定**。追加のexamplesモジュールが必要なら
   `https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/...` から取得し、
   import文を `'three'` → `'../../three.module.js'` に書き換えて配置する（前例: GLTFExporter・RoomEnvironment）

## 3. 建築シミュレータ（index.html）のアーキテクチャ

### 3.1 desc体系（最重要）
すべての配置物はJSON記述子 `desc` で表現され、`buildItemFromDesc(desc, depth)`（async）が再構築を担う。
**新しいアイテム種を足すときは、この分岐と保存系に追加するだけでよい**（保存/復元/JSON入出力/複製/
配列複製/ユニット化/CSG/爆発図が自動で対応される）。

| kind | 内容 | 主なフィールド |
|---|---|---|
| glb | カタログモデル | file |
| genglb | AI生成GLB | file('generated/xx.glb'), name |
| prim | プリミティブ | type(box/cyl/cone/sphere), params{w,d,h,r,radius,height}, color |
| csg | ブーリアン結果 | op, a, b（再帰desc） |
| text | 板テキスト | text, size, color, bold, bend, font |
| textDecal | 曲面貼付テキスト | text, size, …, origin, normal, tangent（再投影で復元） |
| text3d | 立体文字 | text, size, color, bold, depth, bevel, bend, font |
| unit | ユニット（グループ） | name, children[{desc,p,q,s,c,o,mp}]（再帰・深さ16制限） |
| sketch | スケッチ押し出し | mode(solid/wall), points[[x,z]…], smooth, height, bevel, thick, upright |
| figure | スケール人形 | height |

- 保存: `currentSnapshotRaw()` → localStorage `kland-edit:{モデルfile}:{プリセット名}`
  - baseEdits[パーツ名] = {p,q,s,c(色),o(不透明度),v(表示),mp(マテリアルプリセット)}
  - added[] = {desc,p,q,s,c,o,v,mp}
- 復元: `applySnapshot(data)`（**async・Promise.all**。await後は `myIndex!==curIndex` ガード必須＝モデル切替レース対策）
- 単位は**mm**・床は y=0。GLBはZ-up→表示時に `rotation.x=-Math.PI/2`

### 3.2 モードフラグ（相互排他）
`editMode / measureMode / textPasteMode / sketchMode / areaMode / paintMode / walkOn / explodeOn / planMode`
- 新モードを足すときは「他モードの入口で自分をOFF・自分の入口で他をOFF・`load(i)` でリセット・
  クリック選択ハンドラのスキップ条件に追加」の4点セットを必ず実装（計測モードの実装が完全な見本）
- Escは各モードが個別にリスナーを持つ（stopPropagationしない紳士協定）

### 3.3 マテリアル系の要注意ポイント
- 色/質感編集は `forEachMeshMat(obj, fn)` 経由のみ。clone-once（`userData.matCloned`）＋
  **シェーディング退避中（origMatStore）は退避側を編集**し、solid中は `o.material` へ即同期する
- `MAT_PRESETS`: wood_light/wood_dark/metal_steel/metal_gold/fabric/tile_white/glass/neon（テクスチャは共有キャッシュ）
- 質感編集時は `ensureSolidForMatEdit()` が自動でソリッド表示に切替える
- **GLBキャッシュ(glbCache)とgeometryは共有**。`geometry.dispose()` は `userData.__privateGeo===true` のものだけ許可
- Line/Helper類（計測線・面積・BoxHelper・寸法線）は削除時に geometry/material の dispose 必須

### 3.4 UIレイアウト
- 左=ギャラリー#side（◀タブで開閉・`body.side-collapsed`で`--side:0`）＋編集パネル#editPanel（左ドック・✎タブ）
- 上=マテリアルバー#matBar＋作成ドック#createDock（文字/箱/円柱/円錐/球/カーブ/立体文字/人形/🤖AI）
- 右=ツールバー#viewBar（5グループ・開閉可）＋開閉パネル群（right:84px・closeOtherPanels()で排他）
- UI状態は localStorage `kland-ui-*` に永続化。トグルONは黄背景(#FFC20E)が慣習
- キーボード: 1/3/7/0(ビュー) 5(投影) Z(シェーディング) G/R/S(移動回転拡縮) F(注視) Shift+D(複製)
  X/Del(削除) H/Alt+H(隠す/全表示) Cmd+Z/Cmd+Shift+Z(undo/redo・常時有効)。
  **e.key と e.code を併用**（IME対策）・INPUT/TEXTAREA/SELECTフォーカス中は無視

### 3.5 QA用API
`window.__editor` に全機能のフックがある（テストはこれ経由が最速）。例:
`select(name) / addPrim / addText3d / applyMatPreset / setShading / walkToggle / explodeSet /
groupSelection / sketchQuickShape / aiApplyOps(json) / exportGlb / …`
- 罠: `selectMultiple([2件以上])` はパーツをanchorへ再親子化する。解除は必ず `deselect()` を使う
- バックグラウンドタブではsetTimeoutスロットリング＆RAF停止でraycastが空振りする。描画させてから叩く

## 4. テキストスパイラル（text-spiral.html）

ことばを立体文字化して螺旋状に泳がせるVJ的アプリ。`window.__textSpiral` がQA API。
- 🌀スパイラル⇄🌊海モード（creature別遊泳・深度層システム）
- 背景プリセット＋🎥ライブ映像背景（カメラ追従の背面クワッド・coverクロップ・
  映像フィルター=tint/mono シェーダ・localStorage `kland-vf`）
- 📷カメラ撮影→ai-bridge /photo→photos/へ保存→ポラロイド投入（一覧は GET /photos）
- 🔧AI生成: ai-bridge /model → 進行表示（Matrixコードレイン演出）→ 生成GLBをセンター表示
  （センター高さは `controls.target.y`＝画面中心固定）
- 質感: gold/silver/rainbow/neon/glass/pearl、スタイル: normal/袋文字/dance、40語上限

## 5. AIブリッジ（ai-bridge.py・port 8788・127.0.0.1限定）

このMacの **Claude Code CLI（定額プラン）** をヘッドレス呼び出しする小型HTTPサーバ。APIキー不要。

| エンドポイント | 用途 |
|---|---|
| GET /health | {ok, claude, forgecad, nested} 死活・環境確認 |
| POST /ai {prompt} | claude -p 直呼び（シミュレータ🤖モードA・スパイラルの色判定） |
| POST /ai {word} | ことば→色/質感判定（スパイラル用・フォールバック辞書内蔵） |
| POST /model {prompt, mock, baseId} | .forge.js生成→forgecad検証→GLB書出しジョブ開始→{id} |
| GET /model/status?id= | {stage, detail, elapsed, done, glbUrl, error}（1.5sポーリング推奨） |
| GET /model/log?id=&offset= | claudeストリーミングログの増分取得 |
| POST /photo {dataUrl} | 撮影画像を photos/ へ保存 |
| GET /photos | 保存済み写真一覧（新しい順50件） |

実装上の教訓（変更時は厳守）:
- `subprocess.Popen` は **stdin=DEVNULL 必須**（claudeが入力待ちで永久停止する）
- stderr は別スレッドでドレイン（パイプ詰まり防止）・**ThreadingHTTPServer 必須**
- 「Not logged in」→ ターミナルで `claude` → `/login`（アプリ版とターミナル版は別ログイン）
- 開発AIセッション内からブリッジを起動しない（ネスト制限。/healthの nested:true で検知可能）。
  ユーザーのFinderダブルクリック起動なら問題ない
- 生成GLB等の静的ファイルはブリッジ(8788)ではなく**サイトサーバ(8787)が配信**する。
  フロントからは相対パス（'generated/xx.glb'）でfetchすること

## 6. 変更フロー（AIアシスタント向けチェックリスト）

1. 該当ファイルを読み、§3の規約（desc体系・モード4点セット・dispose規約）に沿って設計
2. 編集（単一HTML内。並行編集禁止）
3. 構文検証:
   ```bash
   python3 - <<'EOF'
   import re
   html = open('kurichiland-forge/index.html').read()
   open('/tmp/mod.mjs','w').write(re.findall(r'<script type="module">(.*?)</script>', html, re.S)[-1])
   ids = re.findall(r'id="([^"]+)"', html)
   print('dup ids:', {i for i in ids if ids.count(i)>1} or 'none')
   EOF
   node --check /tmp/mod.mjs
   ```
4. ブラウザ実機確認（コンソールエラーゼロ・`__editor`/`__textSpiral` APIで機能テスト）
5. テストで作った localStorage（kland-edit:* / kland-unitlib）は掃除する（kland-ui-*/kland-unit等の設定系は残す）
6. **push しない**

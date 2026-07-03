# クリチランド ｜ ForgeCAD 白模型

`kurichiland.forge.js` … クリチランドの白模型（ボリューム／テラス／吹き抜け(コの字)／什器の簡易確認）。単位 mm。

## セットアップ（初回のみ）
```bash
npm install -g forgecad
forgecad skill install --target claude   # Claude Code 用スキルを ~/.agents/skills へ
# forgecad.io で無料アカウント作成（ログインが要る場合）
```

## 実行
```bash
cd "クリチランド計画/05_制作物/forgecad"
forgecad run kurichiland.forge.js          # 検証＋評価
forgecad studio .                          # ブラウザのworkbenchで見る（パラメータ調整）
forgecad render 3d kurichiland.forge.js    # 3Dレンダー
forgecad inspect collisions kurichiland.forge.js
# STEP出力は Pro:  forgecad export step kurichiland.forge.js
```

## この白模型に入っているもの
基礎／テラス(緑)／1Fボリューム／2Fコの字（吹き抜け）／屋根／中央の大ぬいぐるみ／カウンター／車顔ショーケース／2F展示台(東西)／吹き抜けの階段。
すべて `Param.number(...)` でworkbenchから寸法調整可（建物14.0×14.4m・1F階高4.5m・2F4.2m・吹き抜け7.0×9.9m・テラス26×9m）。

## 想定される初回の微調整（ForgeCADループで直す）
公開ドキュメントのAPIに合わせて書いていますが、実行環境が無いため未検証。最初の `forgecad run` で以下が出たら教えてください（すぐ直します）：
- `.union(...)` の名称/引数が違う（階段のステップ結合。→ `union([...])` や別関数の可能性）
- `box()` が「原点中心」でなく「隅原点」だった（→ translate の z を `+h/2` から `0` 等に調整）
- `.color("#hex")` / `Param.number` のシグネチャ差異
- 単位が m 指定可（`unit:"m"`）なら数値を 1/1000 に

推奨ループ：`forgecad run` → 出たエラー/レンダー画像を貼る → こちらで `.forge.js` を修正 → 再実行。

## 費用感
- **まず無料枠でOK**（白模型・ボリューム確認・workbench・基本run）。
- **Pro検討タイミング**：STEP出力で施工/設計へ渡す・商用本格運用・アセンブリ管理・高品質レンダー/レポート・製造検証。

# 作業ログ — Vsw株式会社 / #クリチ プロジェクト

> フォルダ内部常駐の作業記録。フォルダ移動・リネーム耐性あり。

---

## 📌 案件サマリー

- **会社**: Vsw株式会社（Vsw Inc.）
- **ブランド**: #クリチ（KURICHI）= クリームチーズバーガー
- **コピー**: "KURICHI" a nickname for cream cheese in Japan
- **ポジショニング**: NY発・大阪生まれ
- **著作権**: ユーザー本人保有
- **開始**: 継続運用中
- **ステータス**: 🟢 Active（公開運用中 + アソビ座組進行中）

### 公開
- Site: https://toshiokikuchi777-sudo.github.io/vsw-kurichi-site/
- Repo: https://github.com/toshiokikuchi777-sudo/vsw-kurichi-site
- Shop: https://vswferdinand.base.shop/

---

## 🎯 次アクション

🔥 **アソビシステム差込座組の特約店契約書ドラフトを個人宛に送付**（2026-04-22 宿題）

---

## ⏳ 未確定・未着手

### アソビシステム座組（最優先）
- [ ] 特約店契約書ドラフト（ハリチ君向け）
- [ ] フルーツジッパー（FJ）コラボ企画書
- [ ] 原宿商店会 / アソビ本社設置の具体合意
- [ ] 横浜オフィスのみ販売なしルールと特約店制度の整合

### サイト側
- [ ] 英語版（海外・NY・中国向け）
- [ ] Company / News 個別ページ化
- [ ] Press/Blog 追加記事
- [ ] ショップ詳細ページ・オンライン注文導線強化
- [ ] KURICHI LAND の Roblox 実装連携

---

## 📅 履歴

### 2026-04-30
- **about.html リニューアル**
  - WHO WE ARE → image-1-2.jpg を右に2カラム化
  - FLAGSHIP BRAND → thaw-hero.jpg / hte-hero.jpg + thaw-colorful.jpg 横並び追加
  - FEATURES → 商品ショーケース3カード追加（NY/赤レンガ/SOICHI、modal画像使用）
  - BUSINESS → story-panfes / image-5-1 / image-5-2 の3枚並びを追加
  - OUR STRENGTHS → story-kirara.jpg を右に2カラム化
  - voxel-character はページ最下部へ移動（印刷時非表示）
  - 印刷CSS圧縮で PDF 8ページ → 6ページに収束
  - vsw-company-profile.pdf 再生成（Chrome headless）

### 2026-04-30 ブログ追加
- **blog/shanghai-panfes-2026.html** 新規追加
  - 上海野雀真香面包节（4/30〜5/4・上海环宇城MAX）出店レポ
  - 写真6枚（img-01〜06、1546/1547/1559/IMG_2461/IMG_2464の組合せ確定）
  - 國見クリチ現地参戦の記載
- index.html 反映済（News & Blog グリッド最上段 + Press Ticker 先頭）

### 2026-04-29
- index.html の商品セクション(#KURICHI LINEUP)削除
- 商品モーダルのスマホ表示改善（aspect-ratio 1/1, gap/padding/font-size拡大）

### 2026-04-22
- アソビシステム差込座組 合意（誕生日会食・エイベックス系先輩と）
- 特約店契約書ドラフト送付が宿題として発生
- ハンバーガーメニュー タップ領域 32px/48px 拡大
- WORK_LOG.md導入

### 〜 2026-04
- ブロンズアワード2025 / シルバーアワード2026 受賞
- 2025年代表取締役2名新規加入、國見きらら 2025.07 正式加入
- 画像13MB→1.3MB圧縮、SEO完備、モバイルBP整備

---

## 📁 フォルダ構成

- 本体: `~/Desktop/VSW-site-20260417/`（デスクトップ同期・gitリポ）
- 実作業: `~/Vswサイト/.claude/worktrees/hungry-jemison/`（worktree）
- フロー: worktreeで編集 → `cp`でデスクトップ同期 → commit → push → GitHub Pages自動反映

---

## 🏗 サイト構造

```
/ (index.html)             Hero + Clips + Song + KURICHI LAND + Products + Story + News + Shop + Contact + Company
/how-to-eat.html           美味しい食べ方ガイド
/press/ (index + 6本)      kobe-pan-fest / silver-award-2026 / nationwide-pan-fest /
                            kirara-join / toshin-partnership / new-directors
/blog/ (index + 6本)       bronze-award-2025 / panfes-2025-yokohama / kurichi-land-project /
                            kurichi-land-sandbox / sandbox-possibilities / nyc-tshirt
/404.html, /sitemap.xml, /robots.txt
```

---

## 🎨 デザイントークン（style.css :root）

- `--cream`: ベース背景
- `--cheese`: イエロー系アクセント
- `--tomato`: レッド系プライマリ
- `--char`: 文字・ボーダー濃色
- フォント: Noto Sans JP / Playfair Display / Montserrat

---

## 💡 留意事項・判断メモ（重要）

### 表記ルール（過去ミスあり）
- ❌ 横浜発 / 横浜本拠 と書かない
- ✅ **横浜はオフィスのみ・販売なし**。shop一覧で "事務所のみ" ラベル必須
- ✅ 生まれの物語は **NY発・大阪生まれ** で統一

### 運用の癖
- 短文指示・高速反復を好む
- **画像はトリミングしない**。差し替えはそのまま使う
- 既存文言は尊重・コピペOK（著作権は本人）
- 可読性最優先、装飾より情報
- 単一フォルダ構成（HTML/CSS/JS/assets同一フォルダ）
- プレビュー: `python -m http.server 8765`

---

## 🔥 アソビシステム座組（詳細は project_kurichi_asobisystem.md）

- **キーマン**: ライブスター社長 × エイベックス先輩 → アソビTOPへ直差込
- **コラボ候補**: フルーツジッパー（FJ）
- **特約店候補**: ハリチ君
- **設置候補**: 原宿商店会 / アソビシステム本社
- **モデル**: IP × F&B × 特約店制度で継続収益

# VSW ― #クリチ

Vsw株式会社 クリームチーズバーガー「#クリチ」ブランドサイト。

## 構成

```
.
├── index.html          # トップページ
├── style.css           # スタイル
├── script.js           # インタラクション
├── assets/             # 画像・動画・3Dアセット
│   ├── *.png / *.gif   # ブランド画像
│   ├── 3d/             # ボクセル素材・アニメGIFロゴ
│   └── videos/         # MP4（縦型Clips×3、メタバース紹介）
├── blog/               # ブログ記事ページ（7件）
├── press/              # プレスリリース（6件）
└── やったこと.md       # 制作ログ
```

## ローカルで見る

```bash
python3 -m http.server 8765
```

ブラウザで http://localhost:8765 を開く。

## 主な特徴

- Spline 3Dシーンをヒーロー全面に埋め込み
- The Sandbox メタバース連携（KURICHI LAND）
- レスポンシブ対応（デスクトップ / タブレット / スマホ）
- プレス・ブログ記事の個別ページ
- 動画（縦型Clips + メタバース紹介）

## デプロイ

GitHub Pages / Netlify / Vercel / Cloudflare Pages などの静的ホスティングに対応しています。

## ライセンス / 著作権

© Vsw,Inc. All rights reserved.

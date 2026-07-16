#!/bin/bash
# ForgeCAD ギャラリー（クリチランド建築シミュレータ）起動ランチャー
# ダブルクリックするとローカルサーバを立ち上げてブラウザで開きます

PORT=8787
URL="http://localhost:${PORT}/kurichiland-forge/index.html"

# サイトルート（このフォルダの1つ上＝VSW-site-20260417）へ移動
cd "$(dirname "$0")/.." || exit 1

# サーバが未起動なら起動（既に動いていればそのまま使う）
if ! lsof -i :${PORT} >/dev/null 2>&1; then
  nohup python3 -m http.server ${PORT} >/dev/null 2>&1 &
  sleep 1
fi

# AIブリッジ（🤖ウィンドウ用・ローカル専用）も未起動なら起動
if ! lsof -i :8788 >/dev/null 2>&1; then
  nohup python3 "$(dirname "$0")/ai-bridge.py" >/dev/null 2>&1 &
fi

open "${URL}"

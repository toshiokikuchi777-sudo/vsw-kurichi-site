#!/bin/bash
# ForgeCAD テキストスパイラル 起動ランチャー
# ダブルクリックするとローカルサーバとAIブリッジを立ち上げてブラウザで開きます
#
# 観客スマホ参加（QRコードから say.html を開いて言葉を送る機能）は既定で有効。
# 会場外に一切公開したくない場合（ローカルのみで使いたい場合）は、
# 下の2行を次のように変更してください：
#   1) http.server の起動行から "--bind 0.0.0.0" を削除
#   2) AI_BRIDGE_LAN=1 を外して `nohup python3 "$(dirname "$0")/ai-bridge.py" ...` に戻す

PORT=8787
URL="http://localhost:${PORT}/kurichiland-forge/text-spiral.html"

# サイトルート（このフォルダの1つ上＝VSW-site-20260417）へ移動
cd "$(dirname "$0")/.." || exit 1

# サーバが未起動なら起動（既に動いていればそのまま使う）
# --bind 0.0.0.0 でLAN内スマホからも say.html にアクセスできるようにする
if ! lsof -i :${PORT} >/dev/null 2>&1; then
  nohup python3 -m http.server ${PORT} --bind 0.0.0.0 >/dev/null 2>&1 &
  sleep 1
fi

# AIブリッジ（ことばの意味から色・質感をAIが決める機能／観客の言葉受付）も未起動なら起動
# AI_BRIDGE_LAN=1 で0.0.0.0バインド（観客参加を有効化）。/ai /model /photo等はローカル限定のまま。
if ! lsof -i :8788 >/dev/null 2>&1; then
  AI_BRIDGE_LAN=1 nohup python3 "$(dirname "$0")/ai-bridge.py" >/dev/null 2>&1 &
fi

open "${URL}"

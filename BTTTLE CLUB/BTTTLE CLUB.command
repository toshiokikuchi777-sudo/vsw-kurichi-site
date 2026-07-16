#!/bin/bash
# BTTTLE CLUB 起動ランチャー
# ダブルクリックすると、このフォルダ自身をローカルサーバとAIブリッジで立ち上げてブラウザで開きます。
# フォルダごとどこへ移動しても、このファイルをダブルクリックすれば動きます（相対パス完結）。
#
# 観客スマホ参加（QRコードから say.html を開いて言葉を送る機能）は既定で有効。
# 会場外に一切公開したくない場合（ローカルのみで使いたい場合）は、
# 下の2行を次のように変更してください：
#   1) http.server の起動行から "--bind 0.0.0.0" を削除
#   2) AI_BRIDGE_LAN=1 を外して `nohup python3 "$(dirname "$0")/ai-bridge.py" ...` に戻す

PORT=8799
BRIDGE_PORT=8798
URL="http://localhost:${PORT}/index.html"

# このフォルダ自身をサーブする（BTTTLE CLUBはどこに置いても自己完結で動く）
cd "$(dirname "$0")" || exit 1

# BTTTLE CLUB専用ポート（8799/8798）を使用。VSWサイトやForgeCAD系ランチャー（8787/8788）とは
# 完全に別ポートなので、他のサーバが起動中でも誤って別サイトが開くことはない。
if ! lsof -i :${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  nohup python3 -m http.server ${PORT} --bind 0.0.0.0 >/dev/null 2>&1 &
  sleep 1
fi

# AIブリッジ（ことばの意味から色・質感をAIが決める機能／観客の言葉受付）も未起動なら起動
# AI_BRIDGE_LAN=1 で0.0.0.0バインド（観客参加を有効化）。/ai /model /photo等はローカル限定のまま。
# BTTTLE CLUB専用の8798番ポートを使うため、ForgeCAD系ランチャーのブリッジ(8788)とは独立して動く。
if ! lsof -i :${BRIDGE_PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  AI_BRIDGE_LAN=1 AI_BRIDGE_PORT=${BRIDGE_PORT} nohup python3 "$(dirname "$0")/ai-bridge.py" >/dev/null 2>&1 &
fi

open "${URL}"

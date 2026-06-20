#!/bin/bash
# 販売店向けダウンロードページ用：プレビューサムネイル生成
# 画像=sips / 動画ポスター=ffmpeg / PDF=qlmanage
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
POP="$ROOT/KURICHI_POP"
OUT="$ROOT/assets/dealer/thumbs"
mkdir -p "$OUT"

img() { # src out  (max 800px, jpeg)
  sips -s format jpeg -Z 800 "$1" --out "$OUT/$2" >/dev/null 2>&1 \
    && echo "IMG  ok  $2" || echo "IMG  NG  $2  ($1)"
}
vid() { # src out  (poster frame @0.6s, width 800)
  ffmpeg -y -ss 0.6 -i "$1" -frames:v 1 -vf "scale=800:-2" "$OUT/$2" >/dev/null 2>&1 \
    && echo "VID  ok  $2" || echo "VID  NG  $2  ($1)"
}
pdf() { # src out  (qlmanage 800px -> rename)
  rm -f "$OUT/_ql.png"
  qlmanage -t -s 800 -o "$OUT" "$1" >/dev/null 2>&1
  local gen="$OUT/$(basename "$1").png"
  if [ -f "$gen" ]; then
    sips -s format jpeg "$gen" --out "$OUT/$2" >/dev/null 2>&1
    rm -f "$gen"
    echo "PDF  ok  $2"
  else
    echo "PDF  NG  $2  ($1)"
  fi
}

### 新商品 KURICHI POP (20260620) ###
A="$POP/20260620KURICHI_POP"
img "$A/pop/NYクリチBK.png"   ny-bk1.jpg
img "$A/pop/NYクリチBK2.png"  ny-bk2.jpg
img "$A/pop/pannofes.jpg"     pop-pannofes.jpg
pdf "$A/pop/カラフル.pdf"      pop-colorful.jpg
pdf "$A/KURICHI_説明.pdf"      doc-setsumei.jpg
pdf "$A/COMIC.pdf"            doc-comic.jpg
for n in 9 10 11 12 13 14 15 16 18; do img "$A/KURICHI_photo/kurichi_hasaba${n}.jpg" "photo-${n}.jpg"; done
img "$A/KURICHI_photo/kurichi_hasaba17.JPG" "photo-17.jpg"
img "$A/パンのフェス2026/story-panfes.jpg"  story-panfes.jpg
img "$A/パンのフェス2026/story-shojo.jpg"   story-shojo.jpg
vid "$A/パンのフェス2026/instagram6.MP4"     vid-panfes6.jpg

### ふわもち#クリチ (20260606) ###
B="$POP/20260606ふわもちクリチ"
for n in 01 02 03 04 05 06 07 08; do img "$B/ふわもち-${n}.jpg" "fuwa-${n}.jpg"; done
for n in 1 2 3 4; do img "$B/ふわもち${n}.png" "fuwa-p${n}.jpg"; done
pdf "$B/ふわもち.pdf"  doc-fuwa.jpg
vid "$B/ふわもち.MP4"  vid-fuwa.jpg

### SNS動画素材 (KURICHI_movie) ###
C="$POP/KURICHI_movie"
for n in 1 2 3 4 5 7 8 9; do vid "$C/instagram${n}.MP4" "vid-ig${n}.jpg"; done

echo "---- done ----"
ls "$OUT" | wc -l

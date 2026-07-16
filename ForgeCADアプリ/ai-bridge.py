#!/usr/bin/env python3
"""ForgeCAD AIブリッジ（ローカル専用）
アプリ内の🤖ウィンドウから受けた指示を、このMacのClaude Code CLI（定額プラン）へ
ヘッドレスで渡し、返答をそのまま返す小さなHTTPサーバ。外部公開はしない（127.0.0.1のみ）。

エンドポイント:
  GET  /health              → {"ok": true, "claude": true, "forgecad": true}
  POST /ai  {"prompt":}     → {"ok": true, "text": "...Claudeの返答..."}
                               （既存：ForgeCADエディタの🤖チャット窓が使用）
  POST /ai  {"word":}       → {"color":"#hex","material":"gold|silver|rainbow|neon|glass|pearl",
                                "style":"normal|outline|dance",
                                "creature":"fish|octopus|squid|seaweed|jelly|none","reason":"..."}
                               （text-spiral.html のことば→色/質感/海モード遊泳種別 判定が使用。
                                 creatureは既存フィールドへの追加のみで後方互換。
                                 promptとwordのどちらが来たかで挙動を自動切替する）
  POST /ai  {"assoc":"海","avoid":["クジラ",...]}
                             → {"word":"...","reason":"一言(20字以内)"}
                               text-spiral.html のY3(AI連想モード)が使用。種語から連想される
                               日本語1語（avoidリスト以外・2〜8文字・名詞中心）と理由を返す。
                               失敗/抽出不能は500 {"error":...}（アプリ側にフォールバック辞書あり）。
                               assoc/word/promptは排他優先で、assocが来ていれば最優先で処理する。
  POST /model {"prompt":,"mock":bool,"baseId":"..."(省略可)}
                             → {"id": "..."}  ジョブを起動して即座にIDを返す。
                               実処理はバックグラウンドスレッドで進む（同時実行は1件・キュー直列）。
                               text-spiral.html の「🔧 つくるものを入力」機能が使用。
                               baseId指定時は generated/<baseId>/model.forge.js を読み、
                               既存コードを指示に従って修正する「修正チャット」ジョブになる
                               （ジョブ結果に refined:true, baseId を含める）。
  GET  /model/status?id=…   → {"stage":..., "detail":..., "elapsed":..., "done":bool,
                                "glbUrl":"...", "error":"...", "refined":bool, "baseId":"..."}
  GET  /model/log?id=…&from=<offset>
                             → {"text":"<offsetから先の増分ログ>", "next":<新offset>, "done":bool}
                               design/validate/repair/export各段階の進行テキストを逐次追記したバッファを
                               増分取得する。text-spiral.html のMatrixコードレイン演出が使用。
  POST /photo {"dataUrl":"data:image/jpeg;base64,..."}
                             → {"ok": true, "url":"/kurichiland-forge/photos/photo-....jpg", "name":"..."}
                               kurichiland-forge/photos/ に保存する。
                               text-spiral.html のカメラ撮影機能が使用。
  GET  /photos               → {"photos":[{"url":..., "name":..., "mtime":...}, ...]}（新しい順・上限50件）

  --- 観客スマホ参加（LANモード）向け ---
  POST /say  {"word":"..."}  → {"ok":true}
                               観客が say.html から送る言葉を受け付けメモリキューへ積む。
                               1〜20文字・タグ文字<>除去・IPごと3秒に1回のレート制限（超過は429）。
  GET  /say/queue?from=<seq> → {"items":[{"seq":n,"word":"..."}],"next":<最新seq+1>}
                               text-spiral.html 側のポーリングが使用（ローカル専用）。
  GET  /lanip                 → {"ip":"192.168.x.x"|null,"lan":bool}
                               サーバのLAN IP自己申告（ローカル専用・QRコード生成に使用）。

  環境変数 AI_BRIDGE_LAN=1 を指定すると 0.0.0.0 にバインドし、同一LAN上のスマホから
  say.html にアクセスできるようになる（既定は127.0.0.1のみ＝完全ローカル）。
  LANバインド時は /say系・/health・OPTIONS以外の全エンドポイントを127.0.0.1からのアクセスのみに制限する
  （観客に生成AI機能（/ai /model /photo等）を触らせないための安全策）。
"""
import base64
import json
import os
import random
import re
import shutil
import socket
import subprocess
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get("AI_BRIDGE_PORT", "8788") or "8788")  # 既定は8788（実運用）。テスト起動はAI_BRIDGE_PORT=8789等で変更可
LAN_MODE = os.environ.get("AI_BRIDGE_LAN", "") == "1"  # 1のとき0.0.0.0バインド（観客スマホ参加を有効化）
BIND_HOST = "0.0.0.0" if LAN_MODE else "127.0.0.1"
TIMEOUT_SEC = 180
WORD_TIMEOUT_SEC = 30
CLAUDE_MODEL_TIMEOUT_SEC = 180
FORGECAD_TIMEOUT_SEC = 120
MAX_REPAIR_ATTEMPTS = 2  # claude -p での初回生成に加え、最大2回まで修正再試行
MOCK_STAGE_DELAY_SEC = 2
JOB_LOG_MAX_BYTES = 256 * 1024  # ジョブごとのログバッファ上限（超過時は先頭を捨てる）
MOCK_LOG_CHUNK_MIN = 6
MOCK_LOG_CHUNK_MAX = 18
MOCK_LOG_DELAY_MIN_SEC = 0.05
MOCK_LOG_DELAY_MAX_SEC = 0.1

MATERIAL_KINDS = {"gold", "silver", "rainbow", "neon", "glass", "pearl"}
STYLE_KINDS = {"normal", "outline", "dance"}
CREATURE_KINDS = {"fish", "octopus", "squid", "seaweed", "jelly", "none"}

# ---------------------------------------------------------------------------
# 観客スマホ参加（/say）関連の定数
# ---------------------------------------------------------------------------
SAY_MAX_CHARS = 20
SAY_QUEUE_MAX = 500          # メモリキューの上限件数（古い順に破棄）
SAY_RATE_LIMIT_SEC = 3.0     # IPごとの最小送信間隔
SAY_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")  # 改行以外の制御文字
SAY_TAG_CHARS_RE = re.compile(r"[<>]")

STAGE_LABELS = {
    "queued": "順番待ち",
    "design": "AI設計中",
    "validate": "検証中",
    "repair": "修正中",
    "export": "書き出し中",
    "done": "完成",
    "error": "エラー",
}

# ---------------------------------------------------------------------------
# パス関連
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# ai-bridge.py は "ForgeCADアプリ/" 直下、kurichiland-forge/ は兄弟ディレクトリ
SITE_ROOT = os.path.dirname(SCRIPT_DIR)
FORGE_DIR = os.path.join(SITE_ROOT, "kurichiland-forge")
GENERATED_DIR = os.path.join(FORGE_DIR, "generated")
FALLBACK_GLB = os.path.join(FORGE_DIR, "stool.glb")
PHOTOS_DIR = os.path.join(FORGE_DIR, "photos")

GENERATED_MAX_AGE_SEC = 7 * 24 * 3600

# ---------------------------------------------------------------------------
# 写真保存関連
# ---------------------------------------------------------------------------
PHOTO_MAX_BYTES = 8 * 1024 * 1024  # 8MB
PHOTO_LIST_LIMIT = 50
PHOTO_DATA_URL_RE = re.compile(r"^data:image/(jpeg|jpg|png);base64,(.+)$", re.S)


def ensure_photos_dir():
    os.makedirs(PHOTOS_DIR, exist_ok=True)


def save_photo_data_url(data_url):
    """data URLをバリデートして photos/ に保存する。
    戻り値: (ok, result) ok=Trueなら result={"url":..., "name":...}、Falseならresult=エラーメッセージ。
    """
    if not isinstance(data_url, str) or not data_url:
        return False, "dataUrlが空です"
    m = PHOTO_DATA_URL_RE.match(data_url.strip())
    if not m:
        return False, "dataUrlの形式が不正です（image/jpeg または image/png のみ対応）"
    ext = "jpg" if m.group(1) in ("jpeg", "jpg") else "png"
    b64_payload = m.group(2)
    # 概算サイズチェック（base64は元データの約4/3倍）
    if len(b64_payload) > PHOTO_MAX_BYTES * 4 // 3 + 1024:
        return False, "画像サイズが大きすぎます（上限8MB）"
    try:
        raw = base64.b64decode(b64_payload, validate=True)
    except Exception:  # noqa: BLE001
        return False, "base64データのデコードに失敗しました"
    if len(raw) > PHOTO_MAX_BYTES:
        return False, "画像サイズが大きすぎます（上限8MB）"
    if len(raw) < 16:
        return False, "画像データが空です"

    ensure_photos_dir()
    ts = time.strftime("%Y%m%d-%H%M%S")
    name = f"photo-{ts}.{ext}"
    path = os.path.join(PHOTOS_DIR, name)
    # 同秒衝突対策
    n = 1
    while os.path.exists(path):
        name = f"photo-{ts}-{n}.{ext}"
        path = os.path.join(PHOTOS_DIR, name)
        n += 1
    try:
        with open(path, "wb") as f:
            f.write(raw)
    except Exception as e:  # noqa: BLE001
        return False, f"保存に失敗しました: {str(e)[:200]}"

    return True, {"url": "/kurichiland-forge/photos/" + name, "name": name}


def list_photos():
    ensure_photos_dir()
    items = []
    try:
        for name in os.listdir(PHOTOS_DIR):
            if not re.match(r"^photo-[0-9\-]+\.(jpg|png)$", name):
                continue
            path = os.path.join(PHOTOS_DIR, name)
            try:
                mtime = os.path.getmtime(path)
            except OSError:
                continue
            items.append({"url": "/kurichiland-forge/photos/" + name, "name": name, "mtime": mtime})
    except Exception:  # noqa: BLE001
        pass
    items.sort(key=lambda x: x["mtime"], reverse=True)
    return items[:PHOTO_LIST_LIMIT]


# ---------------------------------------------------------------------------
# 観客スマホ参加（/say）: メモリキュー・レート制限
# ---------------------------------------------------------------------------
SAY_LOCK = threading.Lock()
SAY_QUEUE = []          # [{"seq": int, "word": str}, ...]（古い順・上限SAY_QUEUE_MAX）
SAY_NEXT_SEQ = 1
SAY_LAST_SEEN = {}       # ip -> 最終受理時刻（time.time()）


def sanitize_say_word(raw):
    """観客からの言葉をバリデート・サニタイズする。
    戻り値: (ok, word_or_error)
    """
    if not isinstance(raw, str):
        return False, "wordが不正です"
    w = raw.strip()
    w = SAY_CONTROL_CHARS_RE.sub("", w)
    w = w.replace("\n", " ").replace("\r", " ")
    w = SAY_TAG_CHARS_RE.sub("", w)
    w = w.strip()
    if not w:
        return False, "言葉が空です"
    if len(w) > SAY_MAX_CHARS:
        return False, f"言葉は{SAY_MAX_CHARS}文字以内にしてください"
    return True, w


def say_check_rate_limit(ip):
    """レート制限チェック。okならTrueで受理時刻を記録、超過ならFalse。"""
    now = _now()
    with SAY_LOCK:
        last = SAY_LAST_SEEN.get(ip)
        if last is not None and (now - last) < SAY_RATE_LIMIT_SEC:
            return False
        SAY_LAST_SEEN[ip] = now
        return True


def say_enqueue(word):
    """キューへ積み、振られたseqを返す。"""
    global SAY_NEXT_SEQ
    with SAY_LOCK:
        seq = SAY_NEXT_SEQ
        SAY_NEXT_SEQ += 1
        SAY_QUEUE.append({"seq": seq, "word": word})
        if len(SAY_QUEUE) > SAY_QUEUE_MAX:
            del SAY_QUEUE[0:len(SAY_QUEUE) - SAY_QUEUE_MAX]
        return seq


def say_get_from(from_seq):
    """from_seqより後（seq > from_seq）の項目と、次回問い合わせ用のnextを返す。"""
    with SAY_LOCK:
        items = [dict(item) for item in SAY_QUEUE if item["seq"] > from_seq]
        next_seq = SAY_NEXT_SEQ
        return items, next_seq


def get_lan_ip():
    """このマシンのLAN IPを自己申告する（実際に接続はしない・UDPソケットでルーティング先を確認するだけ）。"""
    s = None
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(1)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        return ip
    except Exception:  # noqa: BLE001
        return None
    finally:
        if s is not None:
            try:
                s.close()
            except Exception:  # noqa: BLE001
                pass


def find_claude():
    """claudeバイナリの場所を探す。PATH→既知の候補パスの順。"""
    found = shutil.which("claude")
    if found:
        return found
    candidates = [
        os.path.expanduser("~/.local/bin/claude"),
        "/usr/local/bin/claude",
        "/opt/homebrew/bin/claude",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None


def find_forgecad():
    """forgecadバイナリの場所を探す。"""
    found = shutil.which("forgecad")
    if found:
        return found
    candidates = [
        "/opt/homebrew/bin/forgecad",
        "/usr/local/bin/forgecad",
        os.path.expanduser("~/.local/bin/forgecad"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None


CLAUDE = find_claude()
FORGECAD = find_forgecad()


def extract_json_object(text):
    """応答テキストから最初の{...}ブロックを抽出してパースする。"""
    if not text:
        return None
    # ```json ... ``` のようなコードフェンスがあれば中身を優先的に見る
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.S)
    candidates = []
    if fence:
        candidates.append(fence.group(1))
    # 最初の { から対応する } までを素朴に探す（ネスト対応）
    start = text.find("{")
    if start != -1:
        depth = 0
        for i in range(start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    candidates.append(text[start:i + 1])
                    break
    for cand in candidates:
        try:
            return json.loads(cand)
        except Exception:  # noqa: BLE001
            continue
    return None


def extract_forge_code(text):
    """claudeの応答から .forge.js コードを抽出する。
    ```js / ```javascript / ```forge / 無指定のコードフェンスを優先し、
    フェンスが無ければ応答全体をコードとみなす（コードのみ返す前提のプロンプトのため）。
    """
    if not text:
        return None
    fence = re.search(r"```(?:js|javascript|forge)?\s*\n(.*?)```", text, re.S)
    if fence:
        code = fence.group(1).strip()
        if code:
            return code
    stripped = text.strip()
    return stripped or None


# ---------------------------------------------------------------------------
# ForgeCAD API チートシート（プロンプトに埋め込む few-shot 込みの規約）
# 参考: クリチランド計画/05_制作物/forgecad/kurichiland-drum.forge.js,
#       kurichiland-display.forge.js から実APIを確認して作成。
# ---------------------------------------------------------------------------
FORGE_API_CHEATSHEET = '''
【ForgeCAD .forge.js API規約（厳守）】
- 単位は mm。原点接地・XY中心が基本（box/cylinder/sphere は底面 z=0 が原点）。
- ファイル全体で1つの forge.js。末尾で `return { "パーツ名": shape, ... };` として
  オブジェクトを1つだけ export する（名前は日本語可、キー重複不可）。
- プリミティブ:
  - `box(width, depth, height)` — 底面中心が原点、Z=0が底
  - `cylinder(height, radiusBottom, radiusTop)` — 底面中心が原点、Z=0が底（radiusBottom===radiusTopで円柱）
  - `sphere(radius, segments)` — 中心が原点
- 変形・仕上げ（メソッドチェーン）:
  - `.translate(x, y, z)`
  - `.color("#rrggbb")`
  - `.material({ roughness: 0..1, metalness: 0..1 })`
- ブーリアン演算:
  - `shapeA.subtract(shapeB)` / `shapeA.union(shapeB)` / `shapeA.intersect(shapeB)`
- パラメータ（任意・複雑なモデルのみ推奨、シンプルな時は省略可）:
  - `Param.number("表示名", デフォルト値, { min: 数値, max: 数値, unit: "mm" })`
- モデル全体のスケール感の目安: 家具・什器クラスは高さ300〜1800mm程度。
- コメントは任意だが先頭に1行、モデル名と実行コマンド例を書くと良い。

【few-shot 例（実際に forgecad run で検証済み）】
```js
/* =====================================================================
   樽スツール（ドラム缶風レトロ椅子） ForgeCAD
   単位: mm。box/cylinder は底面Z=0・XY中心。
   実行: forgecad run kurichiland-drum.forge.js
   ===================================================================== */

const BODY_H   = Param.number("胴体高",     360, { min: 280, max: 450, unit: "mm" });
const BODY_R   = Param.number("胴体半径",   200, { min: 160, max: 260, unit: "mm" });

const RED = "#E3261D", WHITE = "#fdfaf2";
const metal = { roughness: 0.55, metalness: 0.35 };

const baseRing = cylinder(30, 185, 185).color("#1c1a17").material(metal);
const body = cylinder(BODY_H, BODY_R, BODY_R).translate(0, 0, 30).color(RED).material(metal);
const rib1 = cylinder(25, 204, 204).translate(0, 0, 150).color(WHITE).material(metal);

return {
  "台輪": baseRing,
  "胴体": body,
  "リブ帯": rib1,
};
```

【出力ルール】
- 上記API規約に厳密準拠した .forge.js コードのみを、```js コードフェンス1つで返してください。
- 説明文・前置き・後書きは一切書かないでください。コードのみです。
- import文や require は使わないでください（box/cylinder/sphere/Param はグローバルに用意されています）。
'''


def build_design_prompt(user_prompt):
    return (
        f"「{user_prompt}」の3Dモデルを ForgeCAD の .forge.js スクリプトとして書いてください。\n"
        + FORGE_API_CHEATSHEET
    )


def build_repair_prompt(user_prompt, prev_code, error_log):
    return (
        f"以下の ForgeCAD .forge.js スクリプトを `forgecad run` で検証したところエラーになりました。"
        f"エラー内容を踏まえてコードを修正してください。題材は「{user_prompt}」の3Dモデルです。\n\n"
        "【エラーログ】\n" + (error_log or "(詳細不明)")[:2000] + "\n\n"
        "【現在のコード】\n```js\n" + (prev_code or "")[:4000] + "\n```\n"
        + FORGE_API_CHEATSHEET
    )


def build_refine_prompt(user_prompt, base_code):
    """修正チャット（W1）：既存の.forge.jsを、指示に従って修正して全文を返させるプロンプト。"""
    return (
        "以下の既存の ForgeCAD .forge.js を、指示『" + user_prompt + "』に従って修正し、"
        "ファイル全文（修正後の完全な .forge.js コード）を返してください。API規約は既存のものと同じです。\n\n"
        "【既存の .forge.js】\n```js\n" + (base_code or "")[:6000] + "\n```\n"
        + FORGE_API_CHEATSHEET
    )


# ---------------------------------------------------------------------------
# /model ジョブ管理（メモリ保持・同時実行1・キュー直列）
# ---------------------------------------------------------------------------
JOBS = {}
JOBS_LOCK = threading.Lock()
JOB_QUEUE_LOCK = threading.Lock()  # 実行を直列化するための実行ロック（キュー代わり）


def _now():
    return time.time()


def _set_job(job_id, **kwargs):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if not job:
            return
        job.update(kwargs)


def _get_job(job_id):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        return dict(job) if job else None


# ---------------------------------------------------------------------------
# ジョブログバッファ（Matrixコードレイン演出向け・逐次追記＋増分取得）
# 「絶対オフセット」で管理する：先頭を捨てても既にconsumeされたfromの整合性が保てるよう、
# _log_base[job_id] に「バッファ先頭が全体の何バイト目か」を保持し、
# 実際のバッファ文字列は job["log"] に持つ。
# ---------------------------------------------------------------------------
JOB_LOG_LOCK = threading.Lock()
_job_log_buf = {}   # job_id -> str（現在保持しているログ文字列）
_job_log_base = {}  # job_id -> int（バッファ先頭が全体の何バイト目に相当するか）


def _log_init(job_id):
    with JOB_LOG_LOCK:
        _job_log_buf[job_id] = ""
        _job_log_base[job_id] = 0


def _log_append(job_id, text):
    if not text:
        return
    with JOB_LOG_LOCK:
        buf = _job_log_buf.get(job_id, "")
        base = _job_log_base.get(job_id, 0)
        buf += text
        if len(buf) > JOB_LOG_MAX_BYTES:
            overflow = len(buf) - JOB_LOG_MAX_BYTES
            buf = buf[overflow:]
            base += overflow
        _job_log_buf[job_id] = buf
        _job_log_base[job_id] = base


def _log_get_from(job_id, from_offset):
    """絶対オフセットfrom_offset以降の増分テキストと、新しい絶対オフセットを返す。"""
    with JOB_LOG_LOCK:
        buf = _job_log_buf.get(job_id)
        if buf is None:
            return None
        base = _job_log_base.get(job_id, 0)
        total_len = base + len(buf)
        start = max(0, from_offset - base)
        start = min(start, len(buf))
        text = buf[start:]
        return {"text": text, "next": total_len}


def _log_cleanup(job_id):
    with JOB_LOG_LOCK:
        _job_log_buf.pop(job_id, None)
        _job_log_base.pop(job_id, None)


def _run_claude_env():
    # 入れ子起動ガード対策：CLAUDE関連の環境変数は全て除去して子プロセスへ渡す
    return {k: v for k, v in os.environ.items() if not k.startswith("CLAUDE") and k != "AI_AGENT"}


def run_claude_headless(prompt, timeout_sec):
    if not CLAUDE:
        raise RuntimeError("claude CLIが見つかりません")
    result = subprocess.run(
        [CLAUDE, "-p", prompt, "--output-format", "text"],
        capture_output=True, text=True, timeout=timeout_sec,
        cwd=os.path.expanduser("~"), env=_run_claude_env(),
    )
    return result


class _FakeResult:
    """subprocess.CompletedProcess互換の軽量な戻り値（ストリーミング実行用）。"""

    def __init__(self, returncode, stdout, stderr):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


def run_claude_headless_streaming(prompt, timeout_sec, on_delta=None):
    """claude -p を stream-json + --include-partial-messages でPopen起動し、
    content_block_delta の text_delta を逐次 on_delta(text) へ渡しながら実行する。
    最終的な全文は type:"result" イベントの result フィールド（無ければ蓄積したtext_deltaの結合）から得る。
    パース失敗行は無視して頑健に処理する。
    戻り値: _FakeResult（.returncode / .stdout(全文) / .stderr）
    """
    if not CLAUDE:
        raise RuntimeError("claude CLIが見つかりません")
    proc = subprocess.Popen(
        [CLAUDE, "-p", prompt, "--output-format", "stream-json", "--verbose", "--include-partial-messages"],
        stdin=subprocess.DEVNULL,  # stdinを閉じないとclaudeが入力待ちで永久停止する
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        cwd=os.path.expanduser("~"), env=_run_claude_env(),
        bufsize=1,
    )
    start = _now()
    accumulated = []
    stderr_chunks = []
    final_result_text = None
    timed_out = False

    def _stderr_reader():
        # stderrを読み捨てないとパイプが詰まりclaude側がブロックする
        try:
            for line in iter(proc.stderr.readline, ""):
                if not line:
                    break
                if len(stderr_chunks) < 200:
                    stderr_chunks.append(line)
        except Exception:  # noqa: BLE001
            pass

    def _reader():
        nonlocal final_result_text
        try:
            for line in iter(proc.stdout.readline, ""):
                if not line:
                    break
                line = line.strip()
                if not line:
                    continue
                try:
                    evt = json.loads(line)
                except Exception:  # noqa: BLE001
                    continue  # 壊れた行は無視して続行
                try:
                    etype = evt.get("type")
                    if etype == "stream_event":
                        inner = evt.get("event") or {}
                        if inner.get("type") == "content_block_delta":
                            delta = inner.get("delta") or {}
                            if delta.get("type") == "text_delta":
                                frag = delta.get("text") or ""
                                if frag:
                                    accumulated.append(frag)
                                    if on_delta:
                                        on_delta(frag)
                    elif etype == "result":
                        final_result_text = evt.get("result")
                except Exception:  # noqa: BLE001
                    continue
        except Exception:  # noqa: BLE001
            pass

    reader_thread = threading.Thread(target=_reader, daemon=True)
    reader_thread.start()
    stderr_thread = threading.Thread(target=_stderr_reader, daemon=True)
    stderr_thread.start()

    try:
        proc.wait(timeout=timeout_sec)
    except subprocess.TimeoutExpired:
        timed_out = True
        proc.kill()
        try:
            proc.wait(timeout=5)
        except Exception:  # noqa: BLE001
            pass
    reader_thread.join(timeout=5)
    stderr_thread.join(timeout=5)
    stderr_text = "".join(stderr_chunks)

    if timed_out:
        raise subprocess.TimeoutExpired([CLAUDE, "-p"], timeout_sec)

    stdout_text = final_result_text if final_result_text is not None else "".join(accumulated)
    returncode = proc.returncode if proc.returncode is not None else 1
    return _FakeResult(returncode, stdout_text, stderr_text)


def run_forgecad_validate(forge_path):
    """`forgecad run <file>` で検証する。戻り値: (ok, log)"""
    if not FORGECAD:
        raise RuntimeError("forgecad CLIが見つかりません")
    result = subprocess.run(
        [FORGECAD, "run", forge_path],
        capture_output=True, text=True, timeout=FORGECAD_TIMEOUT_SEC,
    )
    log = (result.stdout or "") + "\n" + (result.stderr or "")
    ok = result.returncode == 0
    return ok, log.strip()


def run_forgecad_export_glb(forge_path, out_path):
    """`forgecad export glb <file> --output <path>` でGLBを書き出す。戻り値: (ok, log)"""
    if not FORGECAD:
        raise RuntimeError("forgecad CLIが見つかりません")
    result = subprocess.run(
        [FORGECAD, "export", "glb", forge_path, "--output", out_path],
        capture_output=True, text=True, timeout=FORGECAD_TIMEOUT_SEC,
    )
    log = (result.stdout or "") + "\n" + (result.stderr or "")
    ok = result.returncode == 0 and os.path.exists(out_path)
    return ok, log.strip()


def ensure_generated_dir():
    os.makedirs(GENERATED_DIR, exist_ok=True)


def cleanup_old_generated():
    """起動時に7日超の古いジョブ成果物を掃除する。"""
    try:
        if not os.path.isdir(GENERATED_DIR):
            return
        cutoff = _now() - GENERATED_MAX_AGE_SEC
        for name in os.listdir(GENERATED_DIR):
            path = os.path.join(GENERATED_DIR, name)
            try:
                mtime = os.path.getmtime(path)
            except OSError:
                continue
            if mtime < cutoff:
                if os.path.isdir(path):
                    shutil.rmtree(path, ignore_errors=True)
                else:
                    os.remove(path)
    except Exception:  # noqa: BLE001
        pass


def _mock_stream_code_sample(job_id, seconds):
    """mockモードのdesign段階向け：実在の.forge.jsから数十行をダミーのコード風テキストとして
    50〜100msごとに小刻みにログへ逐次追記する（/model/logの増分取得を検証できるようにするため）。
    """
    sample = None
    ref_path = os.path.join(GENERATED_DIR, "7c79079d3bc4", "model.forge.js")
    try:
        if os.path.exists(ref_path):
            with open(ref_path, "r", encoding="utf-8") as f:
                sample = f.read()
    except Exception:  # noqa: BLE001
        sample = None
    if not sample:
        sample = (
            "// mock design stream\n"
            "const BODY_R = Param.number(\"サイズ\", 40, { min: 20, max: 80 });\n"
            "const body = sphere(BODY_R, 48).translate(0,0,BODY_R).color('#cc1122');\n"
            "return { \"本体\": body };\n"
        )
    end_time = time.time() + seconds
    pos = 0
    n = len(sample)
    while time.time() < end_time:
        remain = end_time - time.time()
        if remain <= 0:
            break
        chunk_len = random.randint(MOCK_LOG_CHUNK_MIN, MOCK_LOG_CHUNK_MAX)
        chunk = sample[pos:pos + chunk_len]
        if not chunk:
            pos = 0
            chunk = sample[pos:pos + chunk_len]
        pos += len(chunk)
        if pos >= n:
            pos = 0
        _log_append(job_id, chunk)
        time.sleep(random.uniform(MOCK_LOG_DELAY_MIN_SEC, MOCK_LOG_DELAY_MAX_SEC))


def run_model_job(job_id, user_prompt, mock, base_id=None):
    """バックグラウンドスレッドで実行するジョブ本体。
    base_id指定時は generated/<base_id>/model.forge.js を読み込み、既存コードを
    指示に従って修正する「修正チャット」ジョブとして動く（W1）。
    """
    ensure_generated_dir()
    job_dir = os.path.join(GENERATED_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    forge_path = os.path.join(job_dir, "model.forge.js")
    glb_path = os.path.join(GENERATED_DIR, job_id + ".glb")
    is_refine = bool(base_id)

    base_code = None
    if is_refine:
        base_forge_path = os.path.join(GENERATED_DIR, base_id, "model.forge.js")
        try:
            with open(base_forge_path, "r", encoding="utf-8") as f:
                base_code = f.read()
        except Exception:  # noqa: BLE001
            base_code = None
        if not base_code:
            _set_job(job_id, stage="error", done=True,
                     error="修正対象の既存モデル（baseId=" + str(base_id) + "）が見つかりません")
            return

    use_mock = mock or not CLAUDE or not FORGECAD

    try:
        if use_mock:
            reason = []
            if mock:
                reason.append("mock指定")
            if not CLAUDE:
                reason.append("claude CLI未検出")
            if not FORGECAD:
                reason.append("forgecad CLI未検出")
            detail_suffix = "（" + "・".join(reason) + "）" if reason else ""

            design_label = ("AIが修正案を設計中…" if is_refine else "AIが設計中…") + detail_suffix
            _set_job(job_id, stage="design", detail=design_label)
            _log_append(job_id, "\n=== design " + ("修正チャット" if is_refine else "AI設計") + " ===\n")
            _mock_stream_code_sample(job_id, MOCK_STAGE_DELAY_SEC)
            _set_job(job_id, stage="validate", detail="ForgeCADで検証中…" + detail_suffix)
            _log_append(job_id, "\n=== forgecad run 検証 ===\n")
            time.sleep(MOCK_STAGE_DELAY_SEC)
            _log_append(job_id, "validate ok (mock)\n")
            _set_job(job_id, stage="export", detail="GLBへ書き出し中…" + detail_suffix)
            _log_append(job_id, "\n=== forgecad export glb ===\n")
            time.sleep(MOCK_STAGE_DELAY_SEC)
            if not os.path.exists(FALLBACK_GLB):
                _log_append(job_id, "error: fallback glb missing\n")
                _set_job(job_id, stage="error", done=True,
                         error="モック用の代役モデル(stool.glb)が見つかりません")
                return
            shutil.copyfile(FALLBACK_GLB, glb_path)
            # mockでも修正チャットの体裁を保つため、baseのコードをそのままコピーしておく
            try:
                with open(forge_path, "w", encoding="utf-8") as f:
                    f.write(base_code if is_refine and base_code else "// mock generated\n")
            except Exception:  # noqa: BLE001
                pass
            _log_append(job_id, "export ok (mock)\n")
            done_kwargs = dict(stage="done", done=True, detail="完成", name=user_prompt,
                                glbUrl="/kurichiland-forge/generated/" + job_id + ".glb")
            if is_refine:
                done_kwargs["refined"] = True
                done_kwargs["baseId"] = base_id
            _set_job(job_id, **done_kwargs)
            return

        # ---- 実運用パス（claude + forgecad）----
        design_label = ("AIが「" + user_prompt + "」で修正案を設計中…") if is_refine else ("AIが「" + user_prompt + "」を設計中…")
        _set_job(job_id, stage="design", detail=design_label)
        _log_append(job_id, "\n=== design " + ("修正チャット: " + user_prompt if is_refine else "AI設計: " + user_prompt) + " ===\n")
        prompt = build_refine_prompt(user_prompt, base_code) if is_refine else build_design_prompt(user_prompt)

        def _on_delta(frag):
            _log_append(job_id, frag)

        result = run_claude_headless_streaming(prompt, CLAUDE_MODEL_TIMEOUT_SEC, on_delta=_on_delta)
        combined_out = (result.stdout or "") + (result.stderr or "")
        # claude CLIは未ログインでも exit 0 で "Not logged in" を返すため、出力文字列でも判定する
        if "Not logged in" in combined_out or "/login" in combined_out:
            _set_job(job_id, stage="error", done=True,
                     error="Claudeへのログインが必要です。ターミナルを開いて claude と打ち、/login でログインしてから再度お試しください")
            return
        if result.returncode != 0:
            snippet = (result.stderr or result.stdout or "").strip().splitlines()
            snippet = (snippet[0][:120] if snippet else "詳細不明")
            _set_job(job_id, stage="error", done=True,
                     error="AI設計に失敗しました（claude CLI: " + snippet + "）")
            return
        code = extract_forge_code(result.stdout)
        if not code:
            _set_job(job_id, stage="error", done=True,
                     error="AI応答からコードを抽出できませんでした")
            return

        last_log = ""
        ok = False
        for attempt in range(MAX_REPAIR_ATTEMPTS + 1):
            with open(forge_path, "w", encoding="utf-8") as f:
                f.write(code)
            stage = "validate" if attempt == 0 else "repair"
            label = "検証中…" if attempt == 0 else f"修正中…（{attempt}回目）"
            _set_job(job_id, stage=stage, detail=label)
            _log_append(job_id, "\n=== forgecad run 検証" + ("" if attempt == 0 else f"（{attempt}回目）") + " ===\n")
            try:
                ok, last_log = run_forgecad_validate(forge_path)
            except subprocess.TimeoutExpired:
                ok, last_log = False, "forgecad run がタイムアウトしました"
            _log_append(job_id, (last_log or "") + "\n")
            if ok:
                break
            if attempt >= MAX_REPAIR_ATTEMPTS:
                break
            # 修正を依頼して再試行
            _set_job(job_id, stage="repair", detail=f"エラーを修正中…（{attempt + 1}回目）")
            _log_append(job_id, "\n=== repair 修正依頼（" + str(attempt + 1) + "回目） ===\n")
            repair_prompt = build_repair_prompt(user_prompt, code, last_log)
            try:
                rresult = run_claude_headless_streaming(repair_prompt, CLAUDE_MODEL_TIMEOUT_SEC, on_delta=_on_delta)
            except subprocess.TimeoutExpired:
                break
            if rresult.returncode != 0:
                break
            new_code = extract_forge_code(rresult.stdout)
            if not new_code:
                break
            code = new_code

        if not ok:
            _set_job(job_id, stage="error", done=True,
                     error="ForgeCADの検証に失敗しました: " + (last_log[:200] if last_log else "詳細不明"))
            return

        _set_job(job_id, stage="export", detail="GLBへ書き出し中…")
        _log_append(job_id, "\n=== forgecad export glb ===\n")
        try:
            eok, elog = run_forgecad_export_glb(forge_path, glb_path)
        except subprocess.TimeoutExpired:
            eok, elog = False, "forgecad export glb がタイムアウトしました"
        _log_append(job_id, (elog or "") + "\n")
        if not eok:
            _set_job(job_id, stage="error", done=True,
                     error="GLB書き出しに失敗しました: " + (elog[:200] if elog else "詳細不明"))
            return

        done_kwargs = dict(stage="done", done=True, detail="完成", name=user_prompt,
                            glbUrl="/kurichiland-forge/generated/" + job_id + ".glb")
        if is_refine:
            done_kwargs["refined"] = True
            done_kwargs["baseId"] = base_id
        _set_job(job_id, **done_kwargs)

    except Exception as e:  # noqa: BLE001
        _log_append(job_id, "\nERROR: " + str(e)[:300] + "\n")
        _set_job(job_id, stage="error", done=True, error=str(e)[:300])


def start_model_job(user_prompt, mock, base_id=None):
    job_id = uuid.uuid4().hex[:12]
    with JOBS_LOCK:
        JOBS[job_id] = {
            "id": job_id,
            "prompt": user_prompt,
            "stage": "queued",
            "detail": "順番待ち…",
            "startedAt": _now(),
            "done": False,
            "glbUrl": None,
            "error": None,
            "name": user_prompt,
            "refined": bool(base_id),
            "baseId": base_id,
        }
    _log_init(job_id)

    def _worker():
        # 同時実行1件（キュー直列）
        with JOB_QUEUE_LOCK:
            run_model_job(job_id, user_prompt, mock, base_id=base_id)

    t = threading.Thread(target=_worker, daemon=True)
    t.start()
    return job_id


# ---------------------------------------------------------------------------
# HTTPハンドラ
# ---------------------------------------------------------------------------

# LANバインド時に観客(非ローカルIP)からのアクセスを許可するエンドポイント。
# これに一致しないパスは、LANモードでは127.0.0.1からのアクセスのみ許可する（403で拒否）。
# 例: /say は許可するが /say/queue はローカル専用（完全一致優先で判定する）。
LAN_OPEN_EXACT_PATHS = {"/health", "/say"}


def _is_local_addr(ip):
    return ip in ("127.0.0.1", "::1", "localhost")


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _client_ip(self):
        try:
            return self.client_address[0]
        except Exception:  # noqa: BLE001
            return None

    def _enforce_lan_guard(self, path):
        """LANバインド時、観客に開放しないエンドポイントへの非ローカルアクセスを403で拒否する。
        戻り値: True=通過してよい, False=既に403応答済みで呼び出し元は処理を中断すべき。
        （OPTIONSプリフライトはブラウザが送るだけで実害が無いため対象外＝do_OPTIONSでは呼ばない）
        """
        if not LAN_MODE:
            return True
        if path in LAN_OPEN_EXACT_PATHS:
            return True
        ip = self._client_ip()
        if _is_local_addr(ip):
            return True
        self._send(403, {"ok": False, "error": "forbidden"})
        return False

    def do_OPTIONS(self):
        self._send(200, {"ok": True})

    def do_GET(self):
        parsed = urlparse(self.path)
        if not self._enforce_lan_guard(parsed.path):
            return
        if parsed.path == "/health":
            # nested: 開発セッション(Claude Code)内から起動されたブリッジはclaude認証を引き継げない。
            # trueの場合、アプリ側は「スパイラル起動.commandから起動し直して」と案内する。
            self._send(200, {"ok": True, "claude": bool(CLAUDE), "forgecad": bool(FORGECAD),
                             "nested": bool(os.environ.get("CLAUDECODE")), "lan": LAN_MODE})
        elif parsed.path == "/model/status":
            self._handle_model_status(parsed)
        elif parsed.path == "/model/log":
            self._handle_model_log(parsed)
        elif parsed.path == "/photos":
            self._handle_photos_list()
        elif parsed.path == "/say/queue":
            self._handle_say_queue(parsed)
        elif parsed.path == "/lanip":
            self._handle_lanip()
        else:
            self._send(404, {"ok": False, "error": "not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        if not self._enforce_lan_guard(parsed.path):
            return
        if self.path == "/ai":
            self._handle_ai()
        elif self.path == "/model":
            self._handle_model_create()
        elif self.path == "/photo":
            self._handle_photo_save()
        elif self.path == "/say":
            self._handle_say_post()
        else:
            self._send(404, {"ok": False, "error": "not found"})

    def _handle_ai(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b""
            data = json.loads(raw or b"{}")
        except Exception as e:  # noqa: BLE001
            self._send(400, {"ok": False, "error": "invalid json: " + str(e)[:200]})
            return

        assoc_in = data.get("assoc")
        word = (data.get("word") or "").strip()
        prompt_in = (data.get("prompt") or "").strip()

        if isinstance(assoc_in, str) and assoc_in.strip():
            avoid = data.get("avoid")
            avoid_list = [str(a) for a in avoid if isinstance(a, (str, int, float))] if isinstance(avoid, list) else []
            self._handle_assoc(assoc_in.strip(), avoid_list)
        elif word:
            self._handle_word(word)
        elif prompt_in:
            self._handle_prompt(prompt_in)
        else:
            self._send(400, {"ok": False, "error": "prompt is empty"})

    def _run_claude(self, prompt, timeout_sec):
        return run_claude_headless(prompt, timeout_sec)

    def _handle_prompt(self, prompt):
        """既存契約：ForgeCADエディタの🤖チャット窓向け。{"ok":true,"text":...} を返す。"""
        try:
            result = self._run_claude(prompt, TIMEOUT_SEC)
            if result.returncode != 0:
                self._send(500, {"ok": False, "error": (result.stderr or "claude CLI error")[:500]})
                return
            self._send(200, {"ok": True, "text": result.stdout})
        except subprocess.TimeoutExpired:
            self._send(504, {"ok": False, "error": "タイムアウトしました（指示を短くして再試行してください）"})
        except Exception as e:  # noqa: BLE001
            self._send(500, {"ok": False, "error": str(e)[:500]})

    def _handle_word(self, word):
        """text-spiral.html 向け：単語の意味・情緒から色/質感/スタイルを判定しJSONのみ返す。"""
        prompt = (
            "単語の意味・情緒から色と質感を決めJSONのみ返す: "
            '{"color":"#hex","material":"gold|silver|rainbow|neon|glass|pearl",'
            '"style":"normal|outline|dance",'
            '"creature":"fish|octopus|squid|seaweed|jelly|none","reason":"一言"}。'
            "creatureは、その言葉が海の生き物や海藻などの海洋植物を指す場合のみ該当する種類を、"
            "そうでなければ none を入れてください（タコ→octopus、イカ→squid、"
            "海藻/わかめ/昆布のような海藻類→seaweed、クラゲ→jelly、"
            "マグロ/サメ/金魚など一般的な魚→fish）。"
            "他の説明文は一切書かず、JSONオブジェクト1つだけを出力してください。"
            "単語: " + word
        )
        try:
            result = self._run_claude(prompt, WORD_TIMEOUT_SEC)
            if result.returncode != 0:
                self._send(500, {"error": (result.stderr or "claude CLI error")[:500]})
                return
            obj = extract_json_object(result.stdout)
            if not obj:
                self._send(500, {"error": "AI応答からJSONを抽出できませんでした"})
                return
            color = obj.get("color")
            material = obj.get("material")
            style = obj.get("style") or "normal"
            creature = obj.get("creature") or "none"
            reason = obj.get("reason") or ""
            if not isinstance(color, str) or not re.match(r"^#[0-9a-fA-F]{3,6}$", color):
                self._send(500, {"error": "colorが不正です"})
                return
            if material not in MATERIAL_KINDS:
                self._send(500, {"error": "materialが不正です"})
                return
            if style not in STYLE_KINDS:
                style = "normal"
            if creature not in CREATURE_KINDS:
                creature = "none"
            self._send(200, {"color": color, "material": material, "style": style,
                              "creature": creature, "reason": reason})
        except subprocess.TimeoutExpired:
            self._send(504, {"error": "タイムアウトしました"})
        except Exception as e:  # noqa: BLE001
            self._send(500, {"error": str(e)[:500]})

    def _handle_assoc(self, seed_word, avoid_list):
        """text-spiral.html のY3(AI連想モード)向け：種語から連想される日本語1語をJSONのみ返す。
        失敗/抽出不能は500 {"error":...}（アプリ側にフォールバック辞書があるため呼び出し元で吸収される）。
        """
        seed_word = seed_word[:24]
        avoid_clean = [str(a).strip()[:24] for a in (avoid_list or []) if str(a).strip()][:20]
        avoid_note = "、".join(avoid_clean) if avoid_clean else "（なし）"
        prompt = (
            "「" + seed_word + "」から連想される日本語の言葉を1つだけ考え、JSONのみ返す: "
            '{"word":"...","reason":"一言(20字以内)"}。'
            "条件: wordは2〜8文字・名詞中心・既に出た言葉と重複しないこと。"
            "既に出た言葉（避けてください）: " + avoid_note + "。"
            "他の説明文は一切書かず、JSONオブジェクト1つだけを出力してください。"
        )
        try:
            result = self._run_claude(prompt, WORD_TIMEOUT_SEC)
            if result.returncode != 0:
                self._send(500, {"error": (result.stderr or "claude CLI error")[:500]})
                return
            obj = extract_json_object(result.stdout)
            if not obj:
                self._send(500, {"error": "AI応答からJSONを抽出できませんでした"})
                return
            word = obj.get("word")
            reason = obj.get("reason") or ""
            if not isinstance(word, str):
                self._send(500, {"error": "wordが不正です"})
                return
            word = SAY_TAG_CHARS_RE.sub("", SAY_CONTROL_CHARS_RE.sub("", word)).strip()
            if not word or len(word) > 20:
                self._send(500, {"error": "wordの長さが不正です"})
                return
            avoid_set = set(avoid_clean)
            if word in avoid_set:
                self._send(500, {"error": "avoidリストと重複しています"})
                return
            if not isinstance(reason, str):
                reason = ""
            reason = SAY_TAG_CHARS_RE.sub("", SAY_CONTROL_CHARS_RE.sub("", reason)).strip()[:40]
            self._send(200, {"word": word, "reason": reason})
        except subprocess.TimeoutExpired:
            self._send(504, {"error": "タイムアウトしました"})
        except Exception as e:  # noqa: BLE001
            self._send(500, {"error": str(e)[:500]})

    def _handle_model_create(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b""
            data = json.loads(raw or b"{}")
        except Exception as e:  # noqa: BLE001
            self._send(400, {"ok": False, "error": "invalid json: " + str(e)[:200]})
            return

        user_prompt = (data.get("prompt") or "").strip()
        mock = bool(data.get("mock"))
        base_id_raw = data.get("baseId")
        base_id = base_id_raw.strip() if isinstance(base_id_raw, str) else None
        if base_id and not re.match(r"^[0-9a-fA-F]{6,32}$", base_id):
            self._send(400, {"ok": False, "error": "baseIdの形式が不正です"})
            return
        if not user_prompt:
            self._send(400, {"ok": False, "error": "prompt is empty"})
            return
        if len(user_prompt) > 60:
            user_prompt = user_prompt[:60]
        if base_id:
            base_forge_path = os.path.join(GENERATED_DIR, base_id, "model.forge.js")
            if not os.path.exists(base_forge_path):
                self._send(404, {"ok": False, "error": "修正対象のモデル（baseId）が見つかりません"})
                return

        job_id = start_model_job(user_prompt, mock, base_id=base_id or None)
        self._send(200, {"ok": True, "id": job_id})

    def _handle_model_status(self, parsed):
        qs = parse_qs(parsed.query or "")
        job_id = (qs.get("id") or [""])[0]
        job = _get_job(job_id) if job_id else None
        if not job:
            self._send(404, {"ok": False, "error": "job not found"})
            return
        stage = job.get("stage", "queued")
        resp = {
            "ok": True,
            "stage": stage,
            "stageLabel": STAGE_LABELS.get(stage, stage),
            "detail": job.get("detail") or "",
            "elapsed": round(_now() - job.get("startedAt", _now()), 1),
            "done": bool(job.get("done")),
            "name": job.get("name"),
        }
        if job.get("glbUrl"):
            resp["glbUrl"] = job["glbUrl"]
        if job.get("error"):
            resp["error"] = job["error"]
        if job.get("refined"):
            resp["refined"] = True
            resp["baseId"] = job.get("baseId")
        self._send(200, resp)

    def _handle_model_log(self, parsed):
        """W2: ジョブの進行ログを増分取得する（Matrixコードレイン演出向け）。"""
        qs = parse_qs(parsed.query or "")
        job_id = (qs.get("id") or [""])[0]
        from_raw = (qs.get("from") or ["0"])[0]
        try:
            from_offset = max(0, int(from_raw))
        except (TypeError, ValueError):
            from_offset = 0
        job = _get_job(job_id) if job_id else None
        if not job:
            self._send(404, {"ok": False, "error": "job not found"})
            return
        chunk = _log_get_from(job_id, from_offset)
        if chunk is None:
            # ログバッファが無い（既にクリーンアップ済み等）場合は空応答で返す
            self._send(200, {"text": "", "next": from_offset, "done": bool(job.get("done"))})
            return
        self._send(200, {"text": chunk["text"], "next": chunk["next"], "done": bool(job.get("done"))})

    def _handle_photo_save(self):
        """text-spiral.html のカメラ撮影機能向け：dataURLを受け取りphotos/へ保存する。"""
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > (PHOTO_MAX_BYTES * 4 // 3) + 4096:
                self._send(413, {"ok": False, "error": "リクエストが大きすぎます"})
                return
            raw = self.rfile.read(length) if length else b""
            data = json.loads(raw or b"{}")
        except Exception as e:  # noqa: BLE001
            self._send(400, {"ok": False, "error": "invalid json: " + str(e)[:200]})
            return

        try:
            ok, result = save_photo_data_url(data.get("dataUrl"))
        except Exception as e:  # noqa: BLE001
            self._send(500, {"ok": False, "error": "保存中にエラーが発生しました: " + str(e)[:200]})
            return

        if not ok:
            self._send(400, {"ok": False, "error": result})
            return
        self._send(200, {"ok": True, "url": result["url"], "name": result["name"]})

    def _handle_photos_list(self):
        try:
            photos = list_photos()
        except Exception as e:  # noqa: BLE001
            self._send(500, {"ok": False, "error": str(e)[:300]})
            return
        self._send(200, {"photos": photos})

    def _handle_say_post(self):
        """say.html 向け：観客の言葉を受け付けキューへ積む。"""
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b""
            data = json.loads(raw or b"{}")
        except Exception as e:  # noqa: BLE001
            self._send(400, {"ok": False, "error": "invalid json: " + str(e)[:200]})
            return

        ip = self._client_ip() or "unknown"
        if not say_check_rate_limit(ip):
            self._send(429, {"error": "少し待ってね"})
            return

        ok, result = sanitize_say_word(data.get("word"))
        if not ok:
            self._send(400, {"ok": False, "error": result})
            return

        say_enqueue(result)
        self._send(200, {"ok": True})

    def _handle_say_queue(self, parsed):
        """text-spiral.html のポーリング向け：from以降の新着ワードを返す（ローカル専用）。"""
        qs = parse_qs(parsed.query or "")
        from_raw = (qs.get("from") or ["0"])[0]
        try:
            from_seq = max(0, int(from_raw))
        except (TypeError, ValueError):
            from_seq = 0
        items, next_seq = say_get_from(from_seq)
        self._send(200, {"items": items, "next": next_seq})

    def _handle_lanip(self):
        """QRコード生成向け：サーバのLAN IPを自己申告する（ローカル専用）。"""
        ip = get_lan_ip()
        self._send(200, {"ip": ip, "lan": LAN_MODE})

    def log_message(self, *args):  # 静かに
        pass


if __name__ == "__main__":
    ensure_generated_dir()
    ensure_photos_dir()
    cleanup_old_generated()
    server = ThreadingHTTPServer((BIND_HOST, PORT), Handler)  # 単一スレッドだと1接続の停止で全APIが道連れになる
    lan_note = ""
    if LAN_MODE:
        lan_ip = get_lan_ip()
        lan_note = f" [LANモード有効: 観客は http://{lan_ip or BIND_HOST}:{PORT}/kurichiland-forge/say.html から参加可能]"
    print(
        f"ForgeCAD AI bridge on http://{BIND_HOST}:{PORT} "
        f"(claude={'found' if CLAUDE else 'NOT FOUND'}, forgecad={'found' if FORGECAD else 'NOT FOUND'})"
        f"{lan_note}"
    )
    server.serve_forever()

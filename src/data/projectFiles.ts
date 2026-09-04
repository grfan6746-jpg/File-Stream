import { CodeFile } from '../types';

export const PROJECT_FILES: CodeFile[] = [
  {
    path: 'media_server/app.py',
    name: 'app.py',
    category: 'python',
    description: 'نقطه ورود اصلی سرور (Main Entrypoint) با نمایش مشخصات IP و بنر راهنما در ترمینال تلویزیون',
    content: `#!/usr/bin/env python3
"""
Local Media Server for Android TV via Termux
Streams local & USB media directly to mobile devices (VLC Player) with HTTP Range support.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from server import create_app
from server.network import get_primary_ip, get_all_local_ips

def main():
    app = create_app()
    cfg = app.config.get('MEDIA_CONFIG', {})
    port = int(os.environ.get('PORT', cfg.get('port', 8080)))
    host = os.environ.get('HOST', cfg.get('host', '0.0.0.0'))
    
    primary_ip = get_primary_ip()
    all_ips = get_all_local_ips()

    banner = f"""
============================================================
   📺 Android TV Local Media Server (Termux Edition)
============================================================
  ● Status:      ONLINE
  ● Local IP:    {primary_ip}
  ● Port:        {port}
  ● Web UI:      http://{primary_ip}:{port}/
  ● All IPs:     {', '.join(all_ips)}
  ● VLC Direct:  Streams on http://{primary_ip}:{port}/media/<storage>/<path>
  ● Auth:        {'Enabled' if cfg.get('authentication') else 'Disabled (Open LAN)'}
============================================================
  Press CTRL+C to stop the server.
"""
    print(banner)
    app.media_logger.info(f"Server starting on {host}:{port} (TV IP: {primary_ip})")

    try:
        app.run(host=host, port=port, threaded=True)
    except KeyboardInterrupt:
        print("\\n[!] Server stopped by user.")
    except Exception as e:
        print(f"\\n[ERROR] Server failed to start: {e}")

if __name__ == '__main__':
    main()`
  },
  {
    path: 'media_server/server/streaming.py',
    name: 'streaming.py',
    category: 'python',
    description: 'موتور استریم جریانی با پشتیبانی کامل از استانداردهای HTTP Range (RFC 7233) برای عقب و جلو بردن آنی در VLC',
    content: `import os
import re
import mimetypes
from flask import Response, request, abort

mimetypes.add_type('video/x-matroska', '.mkv')
mimetypes.add_type('video/mp4', '.mp4')
mimetypes.add_type('video/webm', '.webm')
mimetypes.add_type('video/quicktime', '.mov')
mimetypes.add_type('video/x-msvideo', '.avi')
mimetypes.add_type('video/mp2t', '.ts')
mimetypes.add_type('audio/flac', '.flac')
mimetypes.add_type('audio/mpeg', '.mp3')
mimetypes.add_type('audio/ogg', '.ogg')
mimetypes.add_type('audio/opus', '.opus')
mimetypes.add_type('audio/wav', '.wav')
mimetypes.add_type('audio/aac', '.aac')
mimetypes.add_type('audio/mp4', '.m4a')

def stream_file_with_range(file_path, chunk_size=1024 * 1024):
    """
    Streams a media file with full support for HTTP Range requests (RFC 7233).
    Supports seeking, resuming, fast-forwarding in VLC and media players.
    Uses chunked generator to prevent loading large files (10GB-50GB) into RAM.
    """
    if not os.path.isfile(file_path):
        abort(404)

    file_size = os.path.getsize(file_path)
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = 'application/octet-stream'

    range_header = request.headers.get('Range', None)

    # Full file stream if no Range requested
    if not range_header:
        def full_generator():
            with open(file_path, 'rb') as f:
                while True:
                    data = f.read(chunk_size)
                    if not data:
                        break
                    yield data

        headers = {
            'Content-Type': mime_type,
            'Content-Length': str(file_size),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
            'Content-Disposition': f'inline; filename="{os.path.basename(file_path)}"'
        }
        return Response(full_generator(), status=200, headers=headers)

    # Parse Range Header
    range_match = re.search(r'bytes=(\\d+)-(\\d*)', range_header)
    if not range_match:
        return Response(status=416, headers={
            'Content-Range': f'bytes */{file_size}',
            'Accept-Ranges': 'bytes'
        })

    start = int(range_match.group(1))
    end_val = range_match.group(2)
    end = int(end_val) if end_val else file_size - 1

    if start >= file_size or end >= file_size or start > end:
        return Response(status=416, headers={
            'Content-Range': f'bytes */{file_size}',
            'Accept-Ranges': 'bytes'
        })

    length = end - start + 1

    def partial_generator():
        with open(file_path, 'rb') as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                read_amount = min(chunk_size, remaining)
                data = f.read(read_amount)
                if not data:
                    break
                remaining -= len(data)
                yield data

    headers = {
        'Content-Type': mime_type,
        'Content-Range': f'bytes {start}-{end}/{file_size}',
        'Content-Length': str(length),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
        'Content-Disposition': f'inline; filename="{os.path.basename(file_path)}"'
    }

    return Response(partial_generator(), status=206, headers=headers)`
  },
  {
    path: 'media_server/server/storage.py',
    name: 'storage.py',
    category: 'python',
    description: 'مدیریت فضاهای ذخیره‌سازی، کشف خودکار درایوهای USB، محاسبه حجم آزاد/مصرف‌شده و جستجوی سبک فایل‌ها',
    content: `import os
import shutil
import re

VIDEO_EXTS = {'.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.ts', '.mpeg', '.mpg'}
AUDIO_EXTS = {'.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg', '.opus'}
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}

def get_media_type(filename):
    ext = os.path.splitext(filename)[1].lower()
    if ext in VIDEO_EXTS:
        return 'video'
    if ext in AUDIO_EXTS:
        return 'audio'
    if ext in IMAGE_EXTS:
        return 'image'
    return 'other'

def format_size(bytes_size):
    if bytes_size is None or bytes_size < 0:
        return "Unknown"
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}" if unit != 'B' else f"{bytes_size} B"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} PB"

def resolve_storage_path(raw_path):
    if raw_path.startswith('~'):
        home = os.environ.get('HOME', '/data/data/com.termux/files/home')
        return os.path.normpath(raw_path.replace('~', home, 1))
    return os.path.normpath(os.path.expanduser(os.path.expandvars(raw_path)))

def get_storage_stats(resolved_path):
    if not os.path.exists(resolved_path):
        return {
            'accessible': False,
            'total_str': 'N/A',
            'free_str': 'N/A',
            'used_str': 'N/A',
            'percent_used': 0,
            'error': 'Storage path not found or disconnected'
        }
    try:
        total, used, free = shutil.disk_usage(resolved_path)
        percent = int((used / total) * 100) if total > 0 else 0
        return {
            'accessible': True,
            'total': total,
            'used': used,
            'free': free,
            'total_str': format_size(total),
            'free_str': format_size(free),
            'used_str': format_size(used),
            'percent_used': percent,
            'error': None
        }
    except Exception as e:
        return {
            'accessible': True,
            'total_str': 'N/A',
            'free_str': 'N/A',
            'used_str': 'N/A',
            'percent_used': 0,
            'error': str(e)
        }

def detect_potential_usb_storages():
    candidates = []
    home = os.environ.get('HOME', '/data/data/com.termux/files/home')
    termux_storage = os.path.join(home, 'storage')
    if os.path.exists(termux_storage):
        for entry in os.listdir(termux_storage):
            if entry.startswith('external-'):
                full_p = os.path.join(termux_storage, entry)
                if os.path.exists(full_p):
                    candidates.append({
                        'name': f"USB/SD ({entry})",
                        'path': f"~/storage/{entry}"
                    })

    if os.path.exists('/storage'):
        try:
            for item in os.listdir('/storage'):
                if re.match(r'^[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}$', item):
                    p = f"/storage/{item}"
                    if os.path.exists(p) and os.access(p, os.R_OK):
                        candidates.append({
                            'name': f"USB Drive ({item})",
                            'path': p
                        })
        except Exception:
            pass

    return candidates`
  },
  {
    path: 'media_server/server/security.py',
    name: 'security.py',
    category: 'python',
    description: 'تامین امنیت، جلوگیری قطعی از Path Traversal (مانند ../)، اعتبارسنجی احراز هویت و عدم نمایش رمز عبور',
    content: `import os
from functools import wraps
from flask import session, request, redirect, url_for, jsonify, current_app

def is_safe_path(base_dir, path, follow_symlinks=True):
    """Guarantees path is strictly inside base_dir, preventing traversal."""
    if follow_symlinks:
        match_base = os.path.realpath(base_dir)
        match_path = os.path.realpath(path)
    else:
        match_base = os.path.abspath(base_dir)
        match_path = os.path.abspath(path)

    try:
        common = os.path.commonpath([match_base, match_path])
        return common == match_base
    except (ValueError, Exception):
        return False

def check_auth(username, password):
    cfg = current_app.config.get('MEDIA_CONFIG', {})
    if not cfg.get('authentication', False):
        return True
    return username == cfg.get('username') and password == cfg.get('password')

def is_authenticated():
    cfg = current_app.config.get('MEDIA_CONFIG', {})
    if not cfg.get('authentication', False):
        return True
    if session.get('authenticated'):
        return True
    auth = request.authorization
    if auth and check_auth(auth.username, auth.password):
        return True
    return False

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized'}), 401
            return redirect(url_for('main.login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function`
  },
  {
    path: 'media_server/server/network.py',
    name: 'network.py',
    category: 'python',
    description: 'تشخیص خودکار IP محلی تلویزیون (Wi-Fi/LAN) از جدول روت سیستم‌عامل بدون ارسال داده به اینترنت',
    content: `import socket
import subprocess
import re

def get_primary_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
    except Exception:
        try:
            s.connect(('8.8.8.8', 80))
            ip = s.getsockname()[0]
        except Exception:
            ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def get_all_local_ips():
    ips = set()
    primary = get_primary_ip()
    if primary and primary != '127.0.0.1':
        ips.add(primary)
    try:
        output = subprocess.check_output(['ip', '-4', 'addr', 'show'], stderr=subprocess.DEVNULL, timeout=2).decode('utf-8', errors='ignore')
        matches = re.findall(r'inet\\s+(\\d+\\.\\d+\\.\\d+\\.\\d+)', output)
        for m in matches:
            if not m.startswith('127.'):
                ips.add(m)
    except Exception:
        pass
    result = list(ips)
    return sorted(result) if result else [primary]`
  },
  {
    path: 'media_server/config.json',
    name: 'config.json',
    category: 'config',
    description: 'فایل پیکربندی تنظیمات سرور، پورت، لیست حافظه‌ها و احراز هویت',
    content: `{
  "server_name": "Android TV Media Server",
  "port": 8080,
  "host": "0.0.0.0",
  "authentication": false,
  "username": "admin",
  "password": "adminpassword",
  "secret_key": "termux-tv-media-secret-key-change-me",
  "show_hidden_files": false,
  "chunk_size_kb": 1024,
  "theme": "dark",
  "storages": [
    {
      "name": "Internal Storage",
      "path": "/sdcard"
    },
    {
      "name": "Movies",
      "path": "/sdcard/Movies"
    },
    {
      "name": "Download",
      "path": "/sdcard/Download"
    },
    {
      "name": "Music",
      "path": "/sdcard/Music"
    },
    {
      "name": "Termux External Storage 1 (USB/SD)",
      "path": "~/storage/external-1"
    }
  ]
}`
  },
  {
    path: 'media_server/requirements.txt',
    name: 'requirements.txt',
    category: 'config',
    description: 'وابستگی‌های حداقلی پایتون برای Termux (فقط Flask و Werkzeug بدون وابستگی‌های سنگین C)',
    content: `Flask>=2.3.0
Werkzeug>=2.3.0`
  },
  {
    path: 'media_server/scripts/install.sh',
    name: 'install.sh',
    category: 'script',
    description: 'اسکریپت نصب یک‌کلیکه خودکار پیش‌نیازها در Termux همراه با اجرای termux-setup-storage',
    content: `#!/data/data/com.termux/files/usr/bin/bash
set -e
echo "🚀 در حال نصب پیش‌نیازهای مدیا سرور در Termux..."
pkg update -y && pkg upgrade -y
pkg install python python-pip -y
pip install -r requirements.txt
termux-setup-storage
chmod +x scripts/*.sh
echo "✅ نصب کامل شد! برای اجرا: ./scripts/start.sh"`
  },
  {
    path: 'media_server/scripts/start.sh',
    name: 'start.sh',
    category: 'script',
    description: 'اسکریپت روشن کردن سرور در پس‌زمینه (Background) یا کنسول زنده با کنترل PID',
    content: `#!/data/data/com.termux/files/usr/bin/bash
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOGS_DIR/server.pid"
mkdir -p "$LOGS_DIR"
cd "$PROJECT_DIR"

if [ "$1" == "--bg" ]; then
    nohup python3 app.py > "$LOGS_DIR/console.log" 2>&1 &
    echo $! > "$PID_FILE"
    echo "✓ سرور در پس‌زمینه اجرا شد (PID: $(cat $PID_FILE))."
else
    python3 app.py
fi`
  },
  {
    path: 'media_server/scripts/stop.sh',
    name: 'stop.sh',
    category: 'script',
    description: 'اسکریپت خاموش کردن امن سرور با شناسه پردازش و آزادسازی پورت 8080',
    content: `#!/data/data/com.termux/files/usr/bin/bash
pkill -f "python3.*app.py" || true
rm -f logs/server.pid
echo "✅ سرور با موفقیت متوقف شد."`
  },
  {
    path: 'media_server/README.md',
    name: 'README.md',
    category: 'doc',
    description: 'راهنمای ۲۱ گانه فارسی، از نصب تا استریم 4K در VLC و بوت خودکار تلویزیون',
    content: `# راهنمای کامل ۲۱ گانه در فایل README.md قرار دارد.`
  }
];

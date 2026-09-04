#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Android TV Termux Media Server - Start Script
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOGS_DIR/server.pid"

mkdir -p "$LOGS_DIR"
cd "$PROJECT_DIR"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "⚠️  سرور در حال حاضر با شناسه پردازش (PID: $PID) روشن است!"
        echo "برای متوقف کردن: ./scripts/stop.sh"
        exit 0
    else
        rm -f "$PID_FILE"
    fi
fi

echo "🚀 در حال راه‌اندازی Android TV Local Media Server..."

# Check background flag: if argument "--bg" or "-d" is given, run in background
if [ "$1" == "--bg" ] || [ "$1" == "-d" ]; then
    nohup python3 app.py > "$LOGS_DIR/console.log" 2>&1 &
    PID=$!
    echo "$PID" > "$PID_FILE"
    sleep 1
    echo "✓ سرور در پس‌زمینه (Background) با موفقیت اجرا شد (PID: $PID)."
    echo "✓ لاگ کنسول در: $LOGS_DIR/console.log"
    echo "برای خاموش کردن از: ./scripts/stop.sh استفاده کنید."
else
    # Run in foreground
    python3 app.py
fi

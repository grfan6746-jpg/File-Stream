#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Android TV Termux Media Server - Stop Script
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOGS_DIR/server.pid"

STOPPED=0

# Check PID file first
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "🛑 در حال توقف سرور (PID: $PID)..."
        kill "$PID" 2>/dev/null || kill -9 "$PID" 2>/dev/null
        rm -f "$PID_FILE"
        STOPPED=1
    else
        rm -f "$PID_FILE"
    fi
fi

# Also check for any lingering app.py processes
PIDS=$(pgrep -f "python3.*app.py" || true)
if [ -n "$PIDS" ]; then
    echo "🛑 متوقف کردن پردازش‌های باقیمانده Flask..."
    pkill -f "python3.*app.py" 2>/dev/null || true
    STOPPED=1
fi

if [ $STOPPED -eq 1 ]; then
    echo "✅ سرور با موفقیت متوقف (خاموش) شد."
else
    echo "ℹ️  هیچ سرور فعالی برای توقف پیدا نشد."
fi

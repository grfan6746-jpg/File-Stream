#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Android TV Termux Media Server - Automatic Installer
# ==============================================================================

set -e

echo ""
echo "============================================================"
echo " 🚀 نصب و راه‌اندازی Local Media Server روی Android TV (Termux)"
echo "============================================================"
echo ""

echo "[1/4] در حال بروزرسانی مخازن Termux..."
pkg update -y
pkg upgrade -y

echo ""
echo "[2/4] در حال نصب Python و ابزارهای مورد نیاز..."
pkg install python python-pip -y

echo ""
echo "[3/4] در حال نصب کتابخانه‌های پایتون (Flask & Werkzeug)..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "[4/4] تنظیم دسترسی حافظه تلویزیون در Termux..."
echo "اکنون دستور termux-setup-storage اجرا می‌شود."
echo "لطفاً در پیام باز شده روی تلویزیون گزینه 'Allow' یا 'مجاز است' را با کنترل انتخاب کنید."
echo ""
termux-setup-storage

chmod +x "$SCRIPT_DIR/start.sh"
chmod +x "$SCRIPT_DIR/stop.sh"

echo ""
echo "============================================================"
echo " ✅ نصب با موفقیت انجام شد!"
echo " برای روشن کردن سرور دستور زیر را اجرا کنید:"
echo " ./scripts/start.sh"
echo "============================================================"
echo ""

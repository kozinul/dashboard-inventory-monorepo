#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="/srv/inventory-app"
SCRIPT_DIR="$PROJECT_DIR/scripts"

DEPLOY_SCRIPT="$SCRIPT_DIR/deploy.sh"
LOGROTATE_FILE="$SCRIPT_DIR/logrotate.conf"

CRON_FILE="/etc/cron.d/inventory-auto-deploy"

echo "========================================"
echo " Dashboard Inventory Installer"
echo "========================================"

#
# Root Check
#

if [ "$EUID" -ne 0 ]; then
    echo "Jalankan menggunakan sudo."
    exit 1
fi

#
# Dependency Check
#

echo
echo "Checking dependencies..."

REQUIRED_COMMANDS=(
    git
    docker
    flock
    logrotate
)

for cmd in "${REQUIRED_COMMANDS[@]}"
do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "ERROR : $cmd belum terinstall."
        exit 1
    fi
done

echo "OK"

#
# Permission
#

echo
echo "Setting executable permission..."

chmod +x "$DEPLOY_SCRIPT"

#
# Log Directory
#

echo
echo "Preparing log..."

touch "$SCRIPT_DIR/deploy.log"

#
# Install Logrotate
#

echo
echo "Installing logrotate..."

ln -sf "$LOGROTATE_FILE" \
/etc/logrotate.d/inventory-deploy

#
# Install Cron
#

echo
echo "Installing cron..."

cat > "$CRON_FILE" <<EOF
*/5 * * * * root $DEPLOY_SCRIPT
EOF

chmod 644 "$CRON_FILE"

#
# Reload Cron
#

if systemctl is-active --quiet crond; then
    systemctl reload crond
fi

echo
echo "========================================"
echo "Installation Completed"
echo "========================================"

echo
echo "Deploy Script : $DEPLOY_SCRIPT"
echo "Cron File     : $CRON_FILE"
echo "Log File      : $SCRIPT_DIR/deploy.log"
echo "Logrotate     : installed"
#!/usr/bin/env bash

set -e

echo "Removing auto deploy..."

rm -f /etc/cron.d/inventory-auto-deploy
rm -f /etc/logrotate.d/inventory-deploy

echo "Done."
#!/usr/bin/env bash
# MedipolDate günlük veritabanı yedeği.
# Kurulum: DEPLOY.md, adım 10.
set -euo pipefail

APP_DIR="/var/www/medipoldate"
DEST="/var/backups/medipoldate"
KEEP_DAYS=14

mkdir -p "$DEST"
STAMP="$(date +%Y%m%d-%H%M)"
OUT="$DEST/medipoldate-$STAMP.sqlite"

# .backup komutu uygulama çalışırken bile tutarlı bir kopya alır
sqlite3 "$APP_DIR/data/medipoldate.sqlite" ".backup '$OUT'"
gzip -f "$OUT"

# eski yedekleri sil
find "$DEST" -name 'medipoldate-*.sqlite.gz' -mtime +"$KEEP_DAYS" -delete

echo "Yedek alındı: $OUT.gz"

#!/usr/bin/env bash
# =============================================================
# AquaGuard — Əl ilə Deploy Skripti
# İstifadə: ./deploy/deploy.sh
# =============================================================
set -euo pipefail

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-178.105.207.145}"
DEPLOY_PATH="${DEPLOY_PATH:-/root/polad}"

echo "Deploya başlanır → $SSH_USER@$SSH_HOST:$DEPLOY_PATH"

ssh "$SSH_USER@$SSH_HOST" bash << REMOTE
set -e
cd $DEPLOY_PATH

echo "--- Git pull ---"
git pull origin main

echo "--- Backend dependencies ---"
npm ci --prefix backend

echo "--- Frontend build ---"
npm ci --prefix citizen-frontend && npm run build --prefix citizen-frontend
npm ci --prefix admin-panel     && npm run build --prefix admin-panel

echo "--- PM2 restart ---"
pm2 describe aquaguard > /dev/null 2>&1 \
    && pm2 restart aquaguard \
    || pm2 start backend/src/server.js --name aquaguard

pm2 save
echo "Deploy tamamlandı!"
REMOTE

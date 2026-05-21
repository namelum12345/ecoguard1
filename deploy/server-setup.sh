#!/usr/bin/env bash
# =============================================================
# AquaGuard — Serverdə İlk Quraşdırma (bir dəfəlik icra edin)
# İstifadə: bash server-setup.sh
# =============================================================
set -euo pipefail

REPO_URL="https://github.com/YOUR_ORG/YOUR_REPO.git"   # << dəyişin
DEPLOY_PATH="/root/polad"
NODE_VERSION="20"

echo "========================================="
echo "  AquaGuard Server Setup"
echo "========================================="

# ── 1. System paketləri ──────────────────────────────────────
echo "[1/7] Sistem paketləri yenilənir..."
apt-get update -y
apt-get install -y git curl build-essential

# ── 2. Node.js ───────────────────────────────────────────────
echo "[2/7] Node.js $NODE_VERSION quraşdırılır..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
fi
node -v && npm -v

# ── 3. PM2 ───────────────────────────────────────────────────
echo "[3/7] PM2 quraşdırılır..."
npm install -g pm2
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# ── 4. Layihəni klonlayın ────────────────────────────────────
echo "[4/7] Repo klonlanır..."
mkdir -p "$(dirname "$DEPLOY_PATH")"
if [ -d "$DEPLOY_PATH/.git" ]; then
    echo "  Repo artıq var, pull edilir..."
    git -C "$DEPLOY_PATH" pull origin main
else
    git clone "$REPO_URL" "$DEPLOY_PATH"
fi

cd "$DEPLOY_PATH"

# ── 5. Backend .env faylı ────────────────────────────────────
echo "[5/7] .env faylı yaradılır..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo ""
    echo "  !! backend/.env faylını redaktə edin:"
    echo "     nano $DEPLOY_PATH/backend/.env"
    echo ""
fi

# ── 6. Asılılıqlar ───────────────────────────────────────────
echo "[6/7] Asılılıqlar quraşdırılır, frontend build edilir..."
npm ci --prefix backend
npm ci --prefix citizen-frontend && npm run build --prefix citizen-frontend
npm ci --prefix admin-panel     && npm run build --prefix admin-panel

# ── 7. PM2 ilə başlat ────────────────────────────────────────
echo "[7/7] PM2 prosesi başladılır..."
pm2 describe aquaguard > /dev/null 2>&1 \
    && pm2 restart aquaguard \
    || pm2 start backend/src/server.js \
         --name aquaguard \
         --cwd "$DEPLOY_PATH" \
         --log /var/log/aquaguard.log \
         --time

pm2 save

# ── Nginx konfiqurasiyası ────────────────────────────────────
echo ""
echo "========================================="
echo "  Nginx konfiqurasiyası üçün:"
echo "========================================="
echo "  cp $DEPLOY_PATH/deploy/nginx-ecoguard.online.conf \\"
echo "     /etc/nginx/sites-available/aquaguard"
echo "  ln -sf /etc/nginx/sites-available/aquaguard \\"
echo "         /etc/nginx/sites-enabled/aquaguard"
echo "  nginx -t && systemctl reload nginx"
echo ""
echo "  SSL üçün: certbot --nginx -d ecoguard.online"
echo ""
echo "  Setup tamamlandı!"

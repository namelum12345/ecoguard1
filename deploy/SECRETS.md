# GitHub Secrets Konfiqurasiyası

GitHub reponu açın → **Settings → Secrets and variables → Actions → New repository secret**

## Əlavə edilməli olan Secrets

| Secret adı | Nümunə dəyər | Açıqlama |
|---|---|---|
| `SSH_HOST` | `178.105.207.145` | Serverın IP ünvanı və ya domeni |
| `SSH_USER` | `root` | SSH istifadəçi adı |
| `SSH_PASSWORD` | `...` | SSH şifrəsi |
| `DEPLOY_PATH` | `/root/polad` | Serverdə layihənin yolu |
| `VITE_API_BASE` | `https://ecoguard.online` | Frontend API URL (prod üçün) |
| `BACKEND_ENV` | *(aşağıya baxın)* | backend/.env faylının içindəkisi |

## BACKEND_ENV nədir?

`BACKEND_ENV` secreti üçün `backend/.env` faylının **bütün içindəkini** kopyalayın:

```
PORT=4100
JWT_SECRET=uzun-təsadüfi-mətn-buraya
JWT_EXPIRES_IN=7d
CITIZEN_ORIGIN=https://ecoguard.online
ADMIN_ORIGIN=https://ecoguard.online
APP_ORIGIN=https://ecoguard.online
ADMIN_BOOTSTRAP_EMAIL=admin@aquaguard.az
ADMIN_BOOTSTRAP_PASSWORD=GüclüŞifrə123!
```

## Deploy axışı

```
git push origin main
        │
        ▼
GitHub Actions işə düşür
        │
        ├─ citizen-frontend build
        ├─ admin-panel build
        │
        ▼
SCP ilə dist faylları serverə köçürülür
        │
        ▼
SSH ilə serverdə:
  git pull → npm ci → pm2 restart
        │
        ▼
Deploy hazır! ✓
```

## Əl ilə deploy (ehtiyac olduqda)

```bash
SSH_USER=root SSH_HOST=ecoguard.online ./deploy/deploy.sh
```

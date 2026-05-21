# EcoGuard

Vətəndaşların şəhərdəki problemləri (mühit çirkliliyi, infrastruktur, su, daşqın və s.) bildirməsi üçün veb platforma.

```
/
├── backend/            Express + SQLite + JWT (API + istəyə görə statik UI)
├── citizen-frontend/   Vite — vətəndaş portalı
└── admin-panel/        Vite — administrator paneli
```

## SSH / server: tək proses

Kökdə bir dəfə asılılıqları qur, frontendləri yığ, backend işə sal — çıxmaq olar (PM2/systemd ilə saxla).

```bash
git clone <repo> && cd EcoGuard
npm run install:all
cp backend/.env.example backend/.env
# backend/.env — CITIZEN_ORIGIN və ADMIN_ORIGIN eyni host olmalıdır (aşağıya bax)
npm run build
npm start    # http://HOST:4100/  və  http://HOST:4100/admin/
```

- Vətəndaş: `http://<HOST>:4100/`
- Admin: `http://<HOST>:4100/admin/`
- API: `http://<HOST>:4100/api/health`

**`.env` (vahid host)** — CORS üçün hər iki origin real brauzer URL-inə uyğun olmalıdır:

```env
CITIZEN_ORIGIN=http://YOUR_SERVER_IP:4100
ADMIN_ORIGIN=http://YOUR_SERVER_IP:4100
```

Domen + HTTPS: hər ikisini `https://ecoguard.online` et. Nginx nümunəsi: `deploy/nginx-ecoguard.online.conf`.

Default admin: `admin@aquaguard.az` / `Admin123!` (.env-də dəyiş)

## Ayrıca inkişaf (3 terminal)

| Modul            | Port | URL                   |
| ---------------- | ---- | --------------------- |
| Backend          | 4100 | http://localhost:4100 |
| Citizen (Vite)   | 5173 | http://localhost:5173 |
| Admin (Vite)     | 5174 | http://localhost:5174 |

Tək komanda ilə hər üçü paralel başlat:

```bash
npm run install:all   # ilk dəfə
npm run dev           # backend + citizen + admin (concurrently)
```

Ayrıca işə salmaq üçün:

```bash
npm run dev:backend
npm run dev:citizen
npm run dev:admin
```

İnkişafda API ünvanı avtomatik `http://localhost:4100`-a düşür; builddə boş saxlanırsa eyni hostdan relative `/api` istifadə olunur.

> **Qeyd:** Port 4000 lokalda Firebase emulator və ya başqa servis tərəfindən tutulursa, EcoGuard default olaraq 4100 istifadə edir. `backend/.env`-də `PORT` ilə dəyişə bilərsiniz.

## Memarlıq qaydaları

- Frontendlər yalnız HTTP API ilə backendə qoşulur.
- Heç bir frontend digərinin kodunu import etmir.
- Backend rol əsaslı icazələri middleware ilə idarə edir.

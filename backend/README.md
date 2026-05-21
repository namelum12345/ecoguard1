# EcoGuard Backend

Minimal Express + SQLite API for the EcoGuard citizen-reports platform.

## Setup

```bash
npm install
cp .env.example .env
npm run dev    # auto-restarts on file change (Node 18+)
# or
npm start
```

Default port: `4000`. A bootstrap admin user is created on first start using
`ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD`.

## API

All authenticated endpoints expect `Authorization: Bearer <token>`.

| Method | Path                          | Auth     | Description                          |
| ------ | ----------------------------- | -------- | ------------------------------------ |
| GET    | `/api/health`                 | -        | Health probe                         |
| POST   | `/api/auth/citizen/register`  | -        | Create citizen account               |
| POST   | `/api/auth/citizen/login`     | -        | Citizen login                        |
| POST   | `/api/auth/admin/login`       | -        | Admin login                          |
| GET    | `/api/auth/me`                | any      | Current user info                    |
| GET    | `/api/reports`                | any      | List (citizen: own / admin: all)     |
| GET    | `/api/reports/stats`          | admin    | Counts per status                    |
| GET    | `/api/reports/:id`            | any      | Single report                        |
| POST   | `/api/reports`                | citizen  | Create report (multipart: `image`)   |
| PATCH  | `/api/reports/:id`            | admin    | Update status / response / reward    |
| GET    | `/uploads/<file>`             | -        | Static image                         |

## Database

SQLite file at `data/aquaguard.db` with two tables:

- `users(id, fullname, email, password, role, created_at)`
- `reports(id, user_id, title, description, image, latitude, longitude, status, admin_response, reward_amount, created_at)`

`status` ∈ `pending | accepted | rejected | completed`.

# Prabisha PM — Internal Project Management System

> **Stack:** Next.js 14 · PostgreSQL · Prisma 5 · Tailwind CSS · JWT Auth  
> **Team:** Prabisha Consulting Ltd · Internal use only

---

## Quick Start

### Option A — Local Development (5 minutes)

**Prerequisites:** Node.js ≥ 18, PostgreSQL running locally

```bash
# 1. Clone / extract the project
cd prabisha-pm

# 2. Install dependencies
npm install

# 3. Copy env file and fill in your values
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL and JWT_SECRET

# 4. Run the one-command setup (migrate + seed)
npm run setup

# 5. Start development server
npm run dev
# → http://localhost:3000
```

---

### Option B — Docker Production (one command)

**Prerequisites:** Docker + Docker Compose

```bash
# 1. Set your secrets (optional — defaults work for first boot)
export DB_PASSWORD="YourSecurePassword123!"
export JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
export APP_URL="https://pm.prabisha.com"    # or your server IP

# 2. Build and start everything
docker-compose up -d

# → App running at http://localhost:3000
# → PostgreSQL running at localhost:5432
# → Auto-migrates and seeds on first boot
```

**Check logs:**
```bash
docker-compose logs -f app   # App logs
docker-compose logs -f db    # Database logs
```

**Stop / restart:**
```bash
docker-compose down          # Stop (data preserved in volume)
docker-compose down -v       # Stop AND delete all data
docker-compose restart app   # Restart app only
```

---

## Default Login Credentials

> **Change all passwords after first login**

| Name | Email | Password |
|---|---|---|
| PK (Admin) | `pk@prabisha.com` | `Prabisha@2026` |
| Dev Team | `dev@prabisha.com` | `Prabisha@2026` |
| Design Team | `design@prabisha.com` | `Prabisha@2026` |
| Content Team | `content@prabisha.com` | `Prabisha@2026` |
| Marketing Team | `marketing@prabisha.com` | `Prabisha@2026` |

---

## Environment Variables

All variables are documented in `.env.example`. Copy it:

```bash
cp .env.example .env.local    # development
cp .env.example .env          # Docker / production
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Min 32-char random string (use `openssl rand -hex 32`) |
| `JWT_EXPIRY` | Optional | Token expiry, default `7d` |
| `NEXT_PUBLIC_APP_URL` | Optional | Your app domain |

**Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# or
openssl rand -hex 32
```

---

## NPM Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run setup` | Install + migrate + seed (first-time setup) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate` | Run pending database migrations |
| `npm run db:push` | Push schema changes without migration files |
| `npm run db:seed` | Seed initial data (team + projects + tasks) |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) at :5555 |
| `npm run db:reset` | ⚠️ Wipe DB and re-seed (dev only) |

---

## Project Structure

```
prabisha-pm/
├── prisma/
│   ├── schema.prisma        ← Database schema (PostgreSQL)
│   └── seed.js              ← Initial data (users, projects, tasks)
│
├── src/
│   ├── middleware.js        ← JWT protection on all routes
│   ├── lib/
│   │   ├── prisma.js        ← Prisma singleton
│   │   ├── auth.js          ← JWT sign/verify, bcrypt helpers
│   │   ├── api.js           ← Client fetch wrapper (auto-token)
│   │   └── constants.js     ← Enums, labels, colour maps, helpers
│   │
│   ├── app/
│   │   ├── layout.js        ← Root layout + font
│   │   ├── globals.css      ← Tailwind + component classes
│   │   ├── page.jsx         ← Overview / KPI dashboard
│   │   ├── login/           ← Login page (public)
│   │   ├── projects/        ← Projects list + detail pages
│   │   ├── tasks/           ← Tasks list + detail pages
│   │   ├── resources/       ← Team workload view
│   │   ├── standup/         ← Daily standup columns
│   │   └── api/             ← REST API routes
│   │       ├── auth/        ← login, logout, me
│   │       ├── dashboard/   ← KPI aggregation
│   │       ├── projects/    ← CRUD + [id]
│   │       ├── tasks/       ← CRUD + [id] + comments + timelogs
│   │       ├── timelogs/    ← POST log time
│   │       ├── comments/    ← POST comment
│   │       └── users/       ← GET list, POST create (admin)
│   │
│   └── components/
│       ├── Layout.jsx       ← Sidebar + header shell
│       ├── Modal.jsx        ← Reusable modal (Esc to close)
│       ├── ProjectForm.jsx  ← Create/edit project form
│       ├── TaskForm.jsx     ← Create/edit task + dep picker
│       └── TimeLogForm.jsx  ← Log hours form
│
├── Dockerfile               ← Multi-stage production image
├── docker-compose.yml       ← Full stack: app + PostgreSQL
├── docker-entrypoint.sh     ← Auto-migrate + seed on boot
├── .env.example             ← All env vars documented
└── README.md                ← This file
```

---

## API Reference

All endpoints require `Authorization: Bearer <token>` header (except `/api/auth/login`).

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login → returns `{ token, user }` |
| POST | `/api/auth/logout` | Clears session cookie |
| GET | `/api/auth/me` | Returns current user |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List all (filter: `?status=&priority=&category=`) |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get one project with all tasks |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project + all tasks |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List all (filter: `?projectId=&status=&priority=&assigneeId=&search=`) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task with time logs + comments |
| PUT | `/api/tasks/:id` | Full update |
| PATCH | `/api/tasks/:id` | Partial update (status, actualHrs) |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/:id/comments` | Task comments |
| GET | `/api/tasks/:id/timelogs` | Task time log history |

### Time Logs & Comments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/timelogs` | Log time (auto-increments task actualHrs) |
| GET | `/api/timelogs?taskId=` | Get logs for a task |
| POST | `/api/comments` | Add comment to task |

### Users (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all active users |
| POST | `/api/users` | Create user (ADMIN role required) |
| PUT | `/api/users/:id` | Update user (ADMIN role required) |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Aggregated KPIs (project + task counts, hours) |

---

## Deploying on Ubuntu Server (Prabisha VPS)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Upload project to server
scp -r prabisha-pm/ user@server:/opt/prabisha-pm/
ssh user@server

# Configure
cd /opt/prabisha-pm
cp .env.example .env
nano .env   # Set DATABASE_URL, JWT_SECRET, APP_URL

# Start
docker-compose up -d

# Set up nginx reverse proxy (optional)
# Point your domain pm.prabisha.com → localhost:3000
```

**Nginx config snippet:**
```nginx
server {
    listen 80;
    server_name pm.prabisha.com;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then add SSL with Certbot:
```bash
sudo certbot --nginx -d pm.prabisha.com
```

---

## Adding a New Team Member

**Via Prisma Studio (recommended):**
```bash
npm run db:studio
# → Open http://localhost:5555 → User table → Add record
```

**Via API (curl):**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Person","email":"new@prabisha.com","password":"Prabisha@2026","role":"DEVELOPER","initials":"NP"}'
```

---

## Database Backup (Production)

```bash
# Manual backup
docker exec prabisha_pm_db pg_dump -U prabisha_pm prabisha_pm > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i prabisha_pm_db psql -U prabisha_pm prabisha_pm < backup_20260323.sql

# Automate with cron (daily at 2am)
0 2 * * * docker exec prabisha_pm_db pg_dump -U prabisha_pm prabisha_pm > /opt/backups/pm_$(date +\%Y\%m\%d).sql
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Invalid credentials` on login | Run `npm run db:seed` to reset users |
| `JWT_SECRET is not set` | Check `.env.local` has JWT_SECRET set |
| `Can't connect to database` | Verify `DATABASE_URL` format and Postgres is running |
| `Prisma Client not generated` | Run `npm run db:generate` |
| `Module not found @/*` | Check `jsconfig.json` has paths configured |
| Docker container crashes | Run `docker-compose logs app` to see error |
| Migrations fail | Run `npx prisma migrate reset` (⚠️ deletes data) |

---

*Prabisha Consulting Ltd · Internal use only · Version 1.0 · March 2026*
"# Project-Management" 

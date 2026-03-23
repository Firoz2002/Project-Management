#!/bin/sh
# ─────────────────────────────────────────────────────────────
# Docker entrypoint — runs on every container start
# 1. Wait for DB to be ready
# 2. Run Prisma migrations (idempotent)
# 3. Seed if no users exist yet
# 4. Start Next.js
# ─────────────────────────────────────────────────────────────

set -e

echo "⏳  Waiting for database..."
until npx prisma db execute --stdin <<EOF 2>/dev/null
SELECT 1;
EOF
do
  echo "  DB not ready, retrying in 3s..."
  sleep 3
done

echo "✅  Database ready"
echo "🔄  Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱  Checking if seed is needed..."
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.user.count().then(c => { console.log(c); p.\$disconnect() })
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "🌱  Seeding initial data..."
  node prisma/seed.js
else
  echo "✅  Data already exists (${USER_COUNT} users), skipping seed"
fi

echo "🚀  Starting Prabisha PM..."
exec node server.js

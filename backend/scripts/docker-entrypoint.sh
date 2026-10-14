#!/bin/sh
set -e

echo "==> Prisma migrate deploy"
npx prisma migrate deploy

echo "==> Prisma db seed (admin / admin)"
npx prisma db seed

echo "==> Starting server"
exec node dist/server.js
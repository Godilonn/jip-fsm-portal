#!/bin/sh
set -e

echo "==> Running database migrations..."
npx drizzle-kit migrate
echo "==> Migrations done."

echo "==> Starting server..."
exec node dist/server.cjs

#!/bin/sh
set -e

echo "==> Pushing database schema..."
npx drizzle-kit push --force
echo "==> Schema pushed."

echo "==> Starting server..."
exec node dist/server.cjs

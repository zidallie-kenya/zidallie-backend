#!/usr/bin/env bash
set -e
echo "🟢 STARTUP SCRIPT VERSION: v2-no-maildev ✅"


/opt/wait-for-it.sh postgres:5432
npm run migration:run
npm run seed:run:relational
# npm run start:prod
npm run test:e2e

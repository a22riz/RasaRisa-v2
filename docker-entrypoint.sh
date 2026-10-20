#!/bin/sh
set -e

PGUSER=postgres
PGDATA=/app/data/postgres

# Initialize and start Postgres (single-container mode)
if [ -z "$SKIP_POSTGRES" ]; then
  # Create data dir owned by postgres
  mkdir -p "$PGDATA"
  chown -R "$PGUSER":"$PGUSER" /app/data

  if [ ! -f "$PGDATA/PG_VERSION" ]; then
    su "$PGUSER" -s /bin/sh -c "initdb -D '$PGDATA' -U rasarisa --auth=trust"

    echo "listen_addresses = '*'" >> "$PGDATA/postgresql.conf"
    echo "port = 5432" >> "$PGDATA/postgresql.conf"
    echo "host all all 0.0.0.0/0 trust" >> "$PGDATA/pg_hba.conf"
  fi

  # Start Postgres
  su "$PGUSER" -s /bin/sh -c "pg_ctl -D '$PGDATA' -l /app/data/postgres.log start -w"

  until pg_isready -h 127.0.0.1 -p 5432; do
    echo "Waiting for Postgres..."
    sleep 1
  done

  # Create database if not exists
  createdb -h 127.0.0.1 -U rasarisa rasarisa 2>/dev/null || true

  # Run migrations + seed
  npx prisma migrate deploy
  npx tsx prisma/seed.ts 2>/dev/null || true
fi

# Start Next.js
exec node server.js

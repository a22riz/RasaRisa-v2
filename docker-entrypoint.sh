#!/bin/sh
set -e

# Initialize and start Postgres (single-container mode)
if [ -z "$SKIP_POSTGRES" ]; then
  PGDATA=/app/data/postgres

  if [ ! -d "$PGDATA" ]; then
    mkdir -p "$PGDATA"
    chown -R nextjs:nodejs "$PGDATA"
    su nextjs -s /bin/sh -c "initdb -D $PGDATA -U rasarisa --auth=trust"

    # Configure for local connections
    echo "listen_addresses = '*'" >> "$PGDATA/postgresql.conf"
    echo "port = 5432" >> "$PGDATA/postgresql.conf"
    echo "host all all 0.0.0.0/0 trust" >> "$PGDATA/pg_hba.conf"
  fi

  # Start Postgres
  su nextjs -s /bin/sh -c "pg_ctl -D $PGDATA -l /app/data/postgres.log start -w"

  # Wait for Postgres
  until su nextjs -s /bin/sh -c "pg_isready -h 127.0.0.1 -p 5432"; do
    echo "Waiting for Postgres..."
    sleep 1
  done

  # Create database if not exists
  su nextjs -s /bin/sh -c "createdb -h 127.0.0.1 -U rasarisa rasarisa 2>/dev/null || true"

  # Run migrations
  su nextjs -s /bin/sh -c "npx prisma migrate deploy"

  # Seed if no admin exists
  su nextjs -s /bin/sh -c "npx tsx prisma/seed.ts 2>/dev/null || true"
fi

# Start Next.js
exec node server.js

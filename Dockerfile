FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# --- deps ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# --- builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# --- runner ---
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Postgres for single-container deploy
RUN apk add --no-cache postgresql postgresql-contrib

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

RUN mkdir -p /app/uploads /app/data
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

ENTRYPOINT ["/app/docker-entrypoint.sh"]

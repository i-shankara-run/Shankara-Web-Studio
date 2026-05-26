# syntax=docker/dockerfile:1.7
#
# Shankara · run — production image for Coolify.
# Builds with bun for speed, runs on Node 22 for Next.js standalone compat.

# ---------- 1. install deps ----------
FROM oven/bun:1.1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------- 2. build ----------
FROM oven/bun:1.1-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# ---------- 3. runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup -S app && adduser -S app -G app

# Next.js standalone output ships only the bits the server needs
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

USER app
EXPOSE 8080

# Standalone bundle includes a server.js entrypoint
CMD ["node", "server.js"]

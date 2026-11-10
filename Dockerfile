# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1


FROM base AS deps

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile


FROM base AS builder

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_USE_API=true
ARG NEXT_PUBLIC_FILES_BASE_URL=/uploads
# API origin for the notifications WebSocket (rewrites cannot proxy it), e.g.
# wss://api.b2b.jupiter.tj/api/v1. Empty = same host as the site.
ARG NEXT_PUBLIC_WS_URL=
# Where /api and /uploads are proxied (baked into the build by next.config.mjs).
ARG BACKEND_INTERNAL_URL=http://backend:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_USE_API=$NEXT_PUBLIC_USE_API
ENV NEXT_PUBLIC_FILES_BASE_URL=$NEXT_PUBLIC_FILES_BASE_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL

RUN node scripts/security-check.mjs
RUN pnpm build


FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache wget \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 4000

CMD ["node", "server.js"]
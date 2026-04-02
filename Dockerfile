# ── Stage 1: Install dependencies ──────────────────────────────────────────────
FROM node:25.8.2-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: Build ─────────────────────────────────────────────────────────────
FROM node:25.8.2-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL_MENU
ARG NEXT_PUBLIC_API_KEY
ARG NEXT_PUBLIC_TABLE_TAP_URL
ARG NEXT_PUBLIC_APP_MODE
ARG NEXT_PUBLIC_API_GATEWAY_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_TABLE_ID
ARG NEXT_PUBLIC_PAYMENT_API_URL

ENV NEXT_PUBLIC_API_URL_MENU=$NEXT_PUBLIC_API_URL_MENU
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY
ENV NEXT_PUBLIC_TABLE_TAP_URL=$NEXT_PUBLIC_TABLE_TAP_URL
ENV NEXT_PUBLIC_APP_MODE=$NEXT_PUBLIC_APP_MODE
ENV NEXT_PUBLIC_API_GATEWAY_URL=$NEXT_PUBLIC_API_GATEWAY_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_TABLE_ID=$NEXT_PUBLIC_TABLE_ID
ENV NEXT_PUBLIC_PAYMENT_API_URL=$NEXT_PUBLIC_PAYMENT_API_URL

RUN npm run build

# ── Stage 3: Run ───────────────────────────────────────────────────────────────
FROM node:25.8.2-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Standalone output — next.config.ts must have output: 'standalone'
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Runtime config injection (replaces the old config.js / nginx CMD trick)
CMD ["node", "server.js"]
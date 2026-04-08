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

# Updated ARGs to match the new naming convention
ARG NEXT_PUBLIC_API_MENU
ARG NEXT_PUBLIC_API_DINE_IN
ARG NEXT_PUBLIC_API_CHECKOUT
ARG NEXT_PUBLIC_API_KEY
ARG NEXT_PUBLIC_APP_MODE
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_TABLE_ID

# Map ARGs to ENVs for Next.js to bake into the build
ENV NEXT_PUBLIC_API_MENU=$NEXT_PUBLIC_API_MENU
ENV NEXT_PUBLIC_API_DINE_IN=$NEXT_PUBLIC_API_DINE_IN
ENV NEXT_PUBLIC_API_CHECKOUT=$NEXT_PUBLIC_API_CHECKOUT
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY
ENV NEXT_PUBLIC_APP_MODE=$NEXT_PUBLIC_APP_MODE
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_TABLE_ID=$NEXT_PUBLIC_TABLE_ID

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
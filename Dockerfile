# ── Stage 1: Install dependencies ──────────────────────────────────────────────
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: Build ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Updated ARGs to match the new naming convention
ARG NEXT_PUBLIC_API_MENU
ARG NEXT_PUBLIC_API_CHECKOUT
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Map ARGs to ENVs for Next.js to bake into the build
# API_KEY and API_DINE_IN are server-only — injected at runtime, not baked in
ENV NEXT_PUBLIC_API_MENU=$NEXT_PUBLIC_API_MENU
ENV NEXT_PUBLIC_API_CHECKOUT=$NEXT_PUBLIC_API_CHECKOUT
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN npm run build

# ── Stage 3: Run ───────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Standalone output — next.config.ts must have output: 'standalone'
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Runtime config injection (replaces the old config.js / nginx CMD trick)
CMD ["node", "server.js"]
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# ===========================================
# DEPS
# ===========================================
FROM base AS deps

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml turbo.json ./
COPY packages/*/package.json packages/
COPY apps/*/package.json apps/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ===========================================
# BUILDER
# ===========================================
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN pnpm -F @bidflow/database prisma generate

# Build all apps and packages
RUN pnpm build

# ===========================================
# DEVELOPMENT
# ===========================================
FROM base AS development

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/turbo.json ./turbo.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps

# Install all deps in workspaces for dev
RUN pnpm install --frozen-lockfile
RUN pnpm -F @bidflow/database prisma generate

# Copy source for development
COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]

# ===========================================
# PRODUCTION
# ===========================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bidflow

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/turbo.json ./turbo.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Copy prisma client
COPY --from=builder /app/packages/database/generated ./packages/database/generated

RUN pnpm prune --prod

USER bidflow

EXPOSE 3000

CMD ["node", "dist/main.js"]
# Use Bun's official image
FROM oven/bun:1 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variable for standalone build
ENV DOCKER_BUILD=true

# Build the Next.js app
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user (Debian/Ubuntu syntax)
RUN groupadd --system --gid 1001 appuser
RUN useradd --system --uid 1001 --gid appuser appuser

# Copy necessary files
COPY --from=builder --chown=appuser:appuser /app/.next/standalone ./
COPY --from=builder --chown=appuser:appuser /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appuser /app/public ./public

USER appuser

EXPOSE 8015

ENV PORT=8015
ENV HOSTNAME="0.0.0.0"

# Start the app
CMD ["bun", "server.js"]
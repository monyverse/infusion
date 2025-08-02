# Multi-stage build for UniteAI Wallet
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl \
    bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development

# Install all dependencies including dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Build NEAR contracts if Rust is available
RUN if command -v cargo >/dev/null 2>&1; then \
        cd near-contracts && cargo build --release --workspace && cd ..; \
    fi

# Compile EVM contracts
RUN npx hardhat compile

# Expose ports
EXPOSE 3000 3003 3004

# Development command
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS builder

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build NEAR contracts if Rust is available
RUN if command -v cargo >/dev/null 2>&1; then \
        cd near-contracts && cargo build --release --workspace && cd ..; \
    fi

# Compile EVM contracts
RUN npx hardhat compile

# Build Next.js application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/src/backend ./src/backend
COPY --from=builder --chown=nextjs:nodejs /app/src/ai ./src/ai
COPY --from=builder --chown=nextjs:nodejs /app/near-contracts/target ./near-contracts/target

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 3000 3003 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3003/api/health || exit 1

# Production command
CMD ["npm", "start"] 
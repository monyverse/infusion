# 🚀 Production Setup Guide - InFusion DeFi Platform

## Overview

This guide covers the complete production deployment setup for the InFusion AI-powered cross-chain DeFi platform.

---

## 📋 **Pre-Deployment Checklist**

### **1. Environment Configuration**
- [ ] Copy `.env.example` to `.env.local` and `.env.production`
- [ ] Obtain all required API keys and secrets
- [ ] Configure RPC endpoints for all supported chains
- [ ] Set up monitoring and analytics services
- [ ] Configure database connections (if using)

### **2. API Keys Required**
- [ ] **WalletConnect Project ID** - [Get from Cloud Dashboard](https://cloud.walletconnect.com/)
- [ ] **1inch API Key** - [Get from 1inch Developer Portal](https://portal.1inch.dev/)
- [ ] **OpenAI API Key** - [Get from OpenAI Platform](https://platform.openai.com/)
- [ ] **Anthropic API Key** - [Get from Anthropic Console](https://console.anthropic.com/)
- [ ] **Alchemy API Key** - [Get from Alchemy Dashboard](https://dashboard.alchemy.com/)
- [ ] **Infura Project ID** - [Get from Infura Dashboard](https://infura.io/)

### **3. External Services**
- [ ] **Sentry** for error tracking
- [ ] **PostHog** for analytics
- [ ] **Redis** for caching (optional)
- [ ] **MongoDB/PostgreSQL** for data persistence (optional)

---

## 🔐 **Security Configuration**

### **Environment Variables Security**

```bash
# Generate secure secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For SESSION_SECRET

# Set secure CORS origins
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com

# Enable security features
NODE_ENV=production
ENABLE_RATE_LIMITING=true
ENABLE_API_VALIDATION=true
```

### **Rate Limiting Configuration**

```javascript
// In your backend configuration
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
}
```

### **API Security Headers**

```javascript
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.1inch.dev", "https://fusion.1inch.io"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
```

---

## 🌐 **Deployment Options**

### **Option 1: Vercel Deployment (Recommended)**

#### **Frontend Deployment**

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy to Vercel**
```bash
vercel --prod
```

3. **Configure Environment Variables in Vercel Dashboard**
- Go to your project settings
- Add all environment variables from `.env.production`
- Ensure `NEXT_PUBLIC_*` variables are properly set

#### **Backend Deployment**

```bash
# Deploy backend as serverless functions
vercel --prod

# Or deploy to a separate service (recommended)
# Use Railway, Render, or DigitalOcean App Platform
```

### **Option 2: Docker Deployment**

#### **Create Docker Configuration**

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### **Docker Compose Configuration**

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### **Option 3: Traditional VPS Deployment**

#### **Server Setup (Ubuntu 22.04)**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install SSL certificate
sudo apt install certbot python3-certbot-nginx -y
```

#### **Application Deployment**

```bash
# Clone repository
git clone https://github.com/your-username/infusion.git
cd infusion

# Install dependencies
npm install

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### **PM2 Configuration**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'infusion-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/infusion',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'infusion-backend',
      script: 'src/backend/simple-server.js',
      cwd: '/path/to/infusion',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    }
  ]
}
```

#### **Nginx Configuration**

```nginx
# /etc/nginx/sites-available/infusion
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 **Monitoring & Analytics**

### **Sentry Error Tracking**

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
});
```

### **PostHog Analytics**

```javascript
// lib/posthog.js
import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug()
    }
  })
}

export default posthog
```

### **Health Check Endpoint**

```javascript
// pages/api/health.js
export default function handler(req, res) {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: true, // Add actual database check
      redis: true,    // Add actual Redis check
      apis: true,     // Add actual API checks
    }
  };

  res.status(200).json(healthCheck);
}
```

---

## 🔧 **Performance Optimization**

### **Next.js Configuration**

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['assets.coingecko.com', 'tokens.1inch.io'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
    }
    return config;
  },
}

module.exports = nextConfig
```

### **Bundle Analysis**

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Analyze bundle
ANALYZE=true npm run build
```

### **Caching Strategy**

```javascript
// lib/cache.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cache = {
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async del(key) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
};
```

---

## 🚦 **CI/CD Pipeline**

### **GitHub Actions Workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Type check
      run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_PROJECT_ID }}
        NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

---

## 📈 **Scaling Considerations**

### **Load Balancing**

```nginx
# nginx load balancer configuration
upstream backend {
    server localhost:3003;
    server localhost:3004;
    server localhost:3005;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

### **Database Scaling**

```javascript
// database/connection.js
import { MongoClient } from 'mongodb';

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false,
};

const client = new MongoClient(process.env.MONGODB_URI, options);
```

### **CDN Configuration**

```javascript
// next.config.js
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.your-domain.com' 
    : '',
  images: {
    loader: 'custom',
    loaderFile: './lib/imageLoader.js',
  },
}
```

---

## 🔍 **Testing Strategy**

### **Unit Tests**

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### **Integration Tests**

```javascript
// tests/integration/api.test.js
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/health';

describe('/api/health', () => {
  it('returns health status', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toMatchObject({
      message: 'OK',
    });
  });
});
```

### **E2E Tests**

```javascript
// cypress/integration/swap.spec.js
describe('Swap Functionality', () => {
  it('should complete a token swap', () => {
    cy.visit('/');
    cy.get('[data-testid=connect-wallet]').click();
    cy.get('[data-testid=metamask]').click();
    cy.get('[data-testid=from-token]').select('USDC');
    cy.get('[data-testid=to-token]').select('ETH');
    cy.get('[data-testid=amount]').type('100');
    cy.get('[data-testid=swap-button]').click();
    cy.get('[data-testid=confirm-swap]').click();
    cy.get('[data-testid=success-message]').should('be.visible');
  });
});
```

---

## 📋 **Production Checklist**

### **Pre-Launch**
- [ ] All environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations completed
- [ ] API rate limits configured
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Security headers implemented
- [ ] Performance optimizations applied
- [ ] Load testing completed
- [ ] Backup strategy implemented

### **Post-Launch**
- [ ] Monitor error rates
- [ ] Check API response times
- [ ] Verify all integrations working
- [ ] Monitor resource usage
- [ ] Set up alerts for critical metrics
- [ ] Document any issues
- [ ] Plan for scaling if needed

---

## 📞 **Support & Maintenance**

### **Log Monitoring**

```bash
# View application logs
pm2 logs infusion-frontend
pm2 logs infusion-backend

# View system logs
sudo journalctl -u nginx -f
sudo tail -f /var/log/nginx/error.log
```

### **Backup Strategy**

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="${MONGODB_URI}" --out="/backups/db_backup_${DATE}"
tar -czf "/backups/db_backup_${DATE}.tar.gz" "/backups/db_backup_${DATE}"
rm -rf "/backups/db_backup_${DATE}"

# Keep only last 7 days of backups
find /backups -name "*.tar.gz" -mtime +7 -delete
```

### **Update Process**

```bash
# Update application
git pull origin main
npm install
npm run build
pm2 restart all
```

---

**🎉 Your InFusion DeFi platform is now production-ready!**

For additional support, please refer to the main documentation or contact the development team.
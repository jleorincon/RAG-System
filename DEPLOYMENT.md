# RAG System Deployment Guide

This guide covers deploying your RAG system to production environments.

## 🚀 Vercel Deployment (Recommended)

Vercel provides the easiest deployment experience for Next.js applications.

### Prerequisites

- Vercel account
- GitHub repository with your RAG system
- Production Supabase project
- OpenAI API key

### Step 1: Prepare for Deployment

1. **Build Test**: Ensure your app builds successfully
   ```bash
   pnpm build
   ```

2. **Environment Variables**: Prepare your production environment variables

### Step 2: Deploy to Vercel

#### Option A: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm build --filter=web`
   - **Output Directory**: `apps/web/.next`

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from the web app directory
cd apps/web
vercel

# Follow the prompts
```

### Step 3: Configure Environment Variables

In your Vercel project settings, add these environment variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-production-openai-key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production

# Vector Search Configuration
EMBEDDING_MODEL=text-embedding-3-small
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
SIMILARITY_THRESHOLD=0.8
```

### Step 4: Domain Configuration

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain (optional)
4. Update `NEXT_PUBLIC_APP_URL` to match your domain

## 🐳 Docker Deployment

For containerized deployments using Docker.

### Dockerfile

Create `Dockerfile` in the root directory:

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

# Copy built application
COPY --from=base /app ./

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  rag-system:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    env_file:
      - .env.production
```

### Deploy with Docker

```bash
# Build and run
docker-compose up --build

# Or build and run separately
docker build -t rag-system .
docker run -p 3000:3000 --env-file .env.production rag-system
```

## ☁️ Cloud Platform Deployment

### AWS (Elastic Beanstalk)

1. **Prepare**: Create a deployment package
   ```bash
   pnpm build
   zip -r deployment.zip . -x "node_modules/*" ".git/*"
   ```

2. **Deploy**: Upload to Elastic Beanstalk
   - Create new application
   - Upload deployment package
   - Configure environment variables

### Google Cloud Platform

1. **App Engine**: Use `app.yaml` configuration
   ```yaml
   runtime: nodejs18
   
   env_variables:
     NODE_ENV: production
     OPENAI_API_KEY: your-key
     # Add other environment variables
   ```

2. **Deploy**:
   ```bash
   gcloud app deploy
   ```

## 🔧 Production Optimizations

### Performance

1. **Enable Compression**: Already configured in `next.config.ts`
2. **Image Optimization**: Configure image domains
3. **Caching**: Set up CDN caching headers
4. **Bundle Analysis**: Analyze bundle size
   ```bash
   ANALYZE=true pnpm build
   ```

### Security

1. **Environment Variables**: Never expose sensitive keys
2. **CORS**: Configure proper CORS settings
3. **Rate Limiting**: Implement API rate limiting
4. **Content Security Policy**: Add CSP headers

### Monitoring

1. **Error Tracking**: Set up error monitoring (Sentry)
2. **Analytics**: Add usage analytics
3. **Performance Monitoring**: Monitor Core Web Vitals
4. **Logging**: Implement structured logging

## 🗄️ Database Considerations

### Supabase Production

1. **Upgrade Plan**: Ensure sufficient resources
2. **Backups**: Enable automatic backups
3. **Monitoring**: Set up database monitoring
4. **Scaling**: Configure auto-scaling if needed

### Connection Pooling

For high-traffic applications:

```typescript
// In your Supabase configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
})
```

## 📊 Monitoring & Maintenance

### Health Checks

Add health check endpoints:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version 
  })
}
```

### Logging

Implement structured logging:

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', message, meta, timestamp: new Date().toISOString() }))
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({ level: 'error', message, error: error?.message, timestamp: new Date().toISOString() }))
  }
}
```

## 🚨 Troubleshooting Deployment

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Environment Variables**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify secrets are properly configured

3. **Database Connection**
   - Test Supabase connection
   - Check network connectivity
   - Verify database migrations are applied

4. **Performance Issues**
   - Monitor response times
   - Check database query performance
   - Optimize API calls

### Debug Steps

1. **Check Logs**: Review deployment and runtime logs
2. **Test Locally**: Reproduce issues in local environment
3. **Environment Parity**: Ensure dev/prod environments match
4. **Monitor Resources**: Check CPU, memory, and database usage

## 📈 Scaling Considerations

### Horizontal Scaling

- **Load Balancing**: Use multiple instances behind a load balancer
- **Database**: Consider read replicas for read-heavy workloads
- **Caching**: Implement Redis for session and query caching

### Vertical Scaling

- **Server Resources**: Increase CPU and memory as needed
- **Database**: Upgrade Supabase plan for more resources
- **CDN**: Use CDN for static assets and API responses

---

🎉 **Your RAG system is now ready for production!** Monitor performance and scale as needed. 
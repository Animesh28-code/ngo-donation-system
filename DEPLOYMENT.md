# Deployment Guide

Instructions for deploying the NGO Donation System to production.

## Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] MongoDB production database set up
- [ ] JWT_SECRET is strong and unique
- [ ] PAYMENT_GATEWAY_SECRET is configured
- [ ] CORS origins updated for production domains
- [ ] SSL/TLS certificates ready for HTTPS

## Backend Deployment

### Option 1: Heroku

```bash
# Install Heroku CLI and login
heroku login

# Create Heroku app
heroku create your-ngo-api

# Set environment variables
heroku config:set MONGO_URI="your_mongodb_uri"
heroku config:set JWT_SECRET="strong_random_secret"
heroku config:set PAYMENT_GATEWAY_SECRET="payment_secret"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main
```

### Option 2: AWS EC2

```bash
# Connect to EC2 instance
ssh -i key.pem ec2-user@your-instance

# Install Node.js and npm
sudo yum update
sudo yum install nodejs npm

# Clone repository
git clone your-repo-url
cd ngo-donation-system/backend

# Install dependencies
npm install

# Create .env file with production values
nano .env

# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start server.js --name "ngo-api"
pm2 startup
pm2 save

# Configure Nginx as reverse proxy
# ... (Nginx config example below)
```

### Option 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t ngo-api .
docker run -p 5000:5000 \
  -e MONGO_URI="mongodb_uri" \
  -e JWT_SECRET="secret" \
  ngo-api
```

## Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

### Option 2: Netlify

```bash
# Build production bundle
npm run build

# Deploy dist folder to Netlify
# Or use Netlify CLI:
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option 3: AWS S3 + CloudFront

```bash
# Build application
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/ --delete

# Invalidate CloudFront cache (optional)
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Environment Configuration

### Backend .env (Production)

```env
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://prod_user:secure_password@prod-cluster.mongodb.net/ngo_system

# JWT
JWT_SECRET=use_very_strong_random_secret_minimum_32_chars
JWT_EXPIRES_IN=7d

# Payment Gateway
PAYMENT_GATEWAY_SECRET=gateway_secret_key_here

# Admin (optional)
ADMIN_EMAIL=admin@ngo.org
ADMIN_PASSWORD=strong_initial_password
```

### Frontend Configuration

Update API base URL for production in `src/services/api.js`:

```javascript
const API_BASE_URL = 'https://api.yourdomain.com/api'  // Production API URL
```

Or use environment variables:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
```

Build command:
```bash
npm run build
```

## Database Setup

### MongoDB Atlas (Recommended)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a project and cluster
3. Add database user
4. Get connection string
5. Whitelist IP addresses
6. Store URI in environment variables

### Self-Hosted MongoDB

```bash
# Install MongoDB
sudo apt-get install mongodb

# Start service
sudo systemctl start mongodb

# Create database
mongo
> use ngo_system
> db.users.createIndex({ email: 1 }, { unique: true })
```

## SSL/TLS Certificate

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure Nginx to use certificate
```

## Nginx Reverse Proxy Configuration

```nginx
# /etc/nginx/sites-available/default

upstream ngo_api {
    server localhost:5000;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://ngo_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Database Backups

### MongoDB Atlas (Automatic)
- Enable automatic backups in cluster settings
- Configure backup retention policy
- Set up alerts for backup failures

### Manual Backup

```bash
# Backup
mongodump --uri="mongodb+srv://..." -o ./backup

# Restore
mongorestore --uri="mongodb+srv://..." ./backup
```

## Monitoring & Logging

### Application Monitoring

```bash
# PM2 Monitoring
pm2 monit

# View logs
pm2 logs ngo-api

# Set up email alerts
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
```

### Error Tracking

Consider services like:
- **Sentry**: `npm install @sentry/node`
- **LogRocket**: For frontend monitoring
- **New Relic**: Full-stack monitoring

## Performance Optimization

### Backend
```javascript
// Compression middleware
const compression = require('compression');
app.use(compression());

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Caching headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600');
  next();
});
```

### Frontend
- Enable minification (Vite does by default)
- Use code splitting
- Optimize images
- Enable gzip compression
- Use CDN for static assets

## Health Checks

Add health check endpoint:

```javascript
// backend/server.js
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});
```

Configure in load balancer or monitoring service to check periodically.

## Update Process

### Zero-Downtime Deployment

```bash
# Using PM2 Cluster Mode
pm2 start server.js -i max --name "ngo-api"
pm2 reload ngo-api  # Graceful reload
```

### Database Migrations

```bash
# Create migration script
node scripts/migrate.js

# Deploy with backup first
mongodump --uri="..." -o ./backup-$(date +%s)
node scripts/migrate.js
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Strong JWT secret (32+ characters)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection/NoSQL injection prevention
- [ ] XSS protection headers
- [ ] CSRF tokens if needed
- [ ] Sensitive data not in logs
- [ ] Regular security updates
- [ ] API authentication on all protected routes

## Rollback Procedure

```bash
# View previous versions
heroku releases

# Rollback to previous release
heroku releases:rollback v123

# Or with PM2
git checkout previous-commit
pm2 restart ngo-api
```

## Monitoring Dashboard Setup

Create a simple status page showing:
- API uptime
- Database connectivity
- Recent donation count
- Total registrations
- Error rates

## Support & Troubleshooting

### High CPU Usage
- Check for infinite loops
- Monitor database queries
- Verify rate limiting works

### Database Connection Issues
- Check connection string
- Verify network access/firewall
- Monitor connection pool

### Slow API Responses
- Check database indexes
- Monitor slow queries
- Optimize hot paths

### Memory Leaks
- Use `clinic.js` for diagnostics
- Check for unclosed connections
- Monitor heap usage

## Scheduled Maintenance

### Daily
- Monitor error logs
- Check system resources
- Verify backups completed

### Weekly
- Review analytics
- Check security logs
- Update dependencies

### Monthly
- Full backup test
- Performance analysis
- Security audit

---

**For more help**: Check the main README.md or contact your DevOps team.

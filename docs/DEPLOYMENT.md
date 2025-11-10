# 🚀 Deployment Guide

## Overview

This guide covers deploying the XRUpgrade Product Configurator to production environments. The application is designed as a static web application that can be deployed to any hosting provider that serves static files.

## Quick Deployment

### Requirements

- **Static file hosting** (no server-side processing required)
- **HTTPS support** (required for AR functionality)
- **CDN support** (recommended for global performance)
- **Gzip compression** (recommended for asset optimization)

### Basic Deployment

```bash
# 1. Prepare for production
npm run build

# 2. Upload entire directory to your hosting provider
# All files: index.html, src/, public/, assets/

# 3. Configure your web server
# - Enable HTTPS
# - Set proper cache headers
# - Enable gzip compression
```

## Hosting Platforms

### Netlify (Recommended for Simplicity)

#### Drag & Drop Deployment

1. Build your project: `npm run build`
2. Create a zip file of your project
3. Go to [Netlify](https://netlify.com)
4. Drag and drop your zip file
5. Your site is live!

#### Git-based Deployment

```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "."

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "*.glb"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.jpg"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=3600"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["admin"]}
```

### Vercel

#### CLI Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure domain
vercel domains add yourdomain.com
```

#### Configuration File

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/.*",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### AWS S3 + CloudFront

#### S3 Bucket Setup

```bash
# Create S3 bucket
aws s3 mb s3://your-configurator-bucket

# Upload files
aws s3 sync . s3://your-configurator-bucket --exclude ".git/*" --exclude "node_modules/*" --exclude "*.md"

# Set bucket policy for public read
aws s3api put-bucket-policy --bucket your-configurator-bucket --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-configurator-bucket/*"
    }
  ]
}'
```

#### CloudFront Distribution

```bash
# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config '{
  "CallerReference": "configurator-'$(date +%s)'",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-your-configurator-bucket",
        "DomainName": "your-configurator-bucket.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-your-configurator-bucket",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    }
  },
  "Comment": "XRUpgrade Product Configurator",
  "Enabled": true
}'
```

### GitHub Pages

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

## Performance Optimization

### Asset Optimization

#### Image Compression

```bash
# Install image optimization tools
npm install -g imagemin-cli imagemin-mozjpeg imagemin-pngquant

# Optimize images
imagemin public/assets/*.jpg --out-dir=public/assets/optimized --plugin=mozjpeg
imagemin public/assets/*.png --out-dir=public/assets/optimized --plugin=pngquant
```

#### 3D Model Optimization

```bash
# Install glTF optimization tools
npm install -g gltf-transform-cli

# Optimize 3D model
gltf-transform optimize public/Weekender.glb public/Weekender-optimized.glb

# Additional compression options
gltf-transform draco public/Weekender.glb public/Weekender-compressed.glb
```

#### JavaScript Minification

```bash
# Install terser for JS minification
npm install -g terser

# JavaScript minification (optional - not part of current build)
# npm install -g terser
# terser src/XRUpgradeConfigurator.js -o src/FloydConfigurator.min.js --compress --mangle
# Note: Current build process focuses on CSS minification and uses modern bundling practices
```

### CDN Configuration

#### Cache Headers Strategy

```nginx
# Nginx configuration
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary "Accept-Encoding";
}

location ~* \.(jpg|jpeg|png|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.(glb|gltf)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Content-Encoding "gzip";
}

location ~* \.(html)$ {
    expires 1h;
    add_header Cache-Control "public";
}

location ~* \.(json)$ {
    expires 1h;
    add_header Cache-Control "public";
}
```

#### CloudFlare Configuration

```javascript
// CloudFlare Worker for additional optimization
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  const newResponse = new Response(response.body, response)
  
  // Add security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff')
  newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add cache headers based on file type
  const url = new URL(request.url)
  const extension = url.pathname.split('.').pop()
  
  if (['js', 'css', 'jpg', 'png', 'glb', 'gltf'].includes(extension)) {
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (['html', 'json'].includes(extension)) {
    newResponse.headers.set('Cache-Control', 'public, max-age=3600')
  }
  
  return newResponse
}
```

## Environment Configuration

### Production Environment Variables

```javascript
// config/production.js
export const productionConfig = {
  API_BASE_URL: 'https://api.yoursite.com',
  CDN_BASE_URL: 'https://cdn.yoursite.com',
  ANALYTICS_ID: 'GA_MEASUREMENT_ID',
  SENTRY_DSN: 'https://your-sentry-dsn',
  VERSION: process.env.npm_package_version,
  ENVIRONMENT: 'production'
};
```

### Configuration Loading

```javascript
// src/config/environment.js
export async function loadEnvironmentConfig() {
  const hostname = window.location.hostname;
  
  let configPath;
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    configPath = 'config/development.json';
  } else if (hostname.includes('staging')) {
    configPath = 'config/staging.json';
  } else {
    configPath = 'config/production.json';
  }
  
  try {
    const response = await fetch(configPath);
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to load environment config, using defaults:', error);
    return getDefaultConfig();
  }
}
```

## Security Configuration

### Content Security Policy

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://unpkg.com https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  media-src 'self';
  object-src 'none';
  child-src 'self';
  frame-src 'self';
  connect-src 'self' https://www.google-analytics.com;
  model-src 'self';
">
```

### HTTP Security Headers

```javascript
// Express.js security middleware (if using server)
app.use((req, res, next) => {
  // HTTPS redirect
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
    return;
  }
  
  // Security headers
  res.set({
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  
  next();
});
```

## Monitoring & Analytics

### Error Tracking with Sentry

```javascript
// src/utils/errorTracking.js
import * as Sentry from '@sentry/browser';

export function initializeErrorTracking() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.npm_package_version,
      integrations: [
        new Sentry.Integrations.BrowserTracing(),
      ],
      tracesSampleRate: 0.1,
    });
  }
}

export function trackError(error, context = {}) {
  Logger.error('Error:', error);
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: context,
      extra: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

### Performance Monitoring

```javascript
// src/utils/performance.js
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observer = null;
    this.initializeObserver();
  }
  
  initializeObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.recordMetric(entry.name, entry.duration);
        });
      });
      
      this.observer.observe({ entryTypes: ['measure', 'navigation'] });
    }
  }
  
  recordMetric(name, value) {
    this.metrics[name] = value;
    
    // Send to analytics
    if (window.gtag) {
      gtag('event', 'timing_complete', {
        name: name,
        value: Math.round(value)
      });
    }
  }
  
  mark(name) {
    performance.mark(name);
  }
  
  measure(name, startMark, endMark) {
    performance.measure(name, startMark, endMark);
  }
}

// Usage in configurator
const monitor = new PerformanceMonitor();

monitor.mark('configurator-start');
// ... configurator initialization
monitor.mark('configurator-ready');
monitor.measure('configurator-init', 'configurator-start', 'configurator-ready');
```

## Backup & Recovery

### Automated Backups

```bash
#!/bin/bash
# scripts/backup.sh

# Backup configuration and assets
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/configurator_$DATE"

mkdir -p $BACKUP_DIR

# Backup source code
tar -czf $BACKUP_DIR/source.tar.gz src/ public/ assets/ *.html *.json *.md

# Backup to cloud storage
aws s3 cp $BACKUP_DIR/ s3://your-backup-bucket/configurator/$DATE/ --recursive

# Clean old backups (keep last 30 days)
find backups/ -type d -mtime +30 -exec rm -rf {} \;
```

### Disaster Recovery Plan

```markdown
# Disaster Recovery Checklist

## Immediate Response (0-1 hour)
- [ ] Assess scope of outage
- [ ] Switch to backup/CDN if available
- [ ] Communicate status to stakeholders

## Short-term Recovery (1-4 hours)
- [ ] Restore from latest backup
- [ ] Verify all assets are accessible
- [ ] Test configurator functionality
- [ ] Check analytics and error tracking

## Post-Recovery (24 hours)
- [ ] Conduct post-mortem analysis
- [ ] Update backup procedures if needed
- [ ] Improve monitoring and alerting
- [ ] Document lessons learned
```

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get install certbot

# Obtain SSL certificate
sudo certbot certonly --webroot -w /var/www/html -d yoursite.com -d www.yoursite.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yoursite.com www.yoursite.com;
    
    ssl_certificate /etc/letsencrypt/live/yoursite.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yoursite.com/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Serve configurator
    root /var/www/configurator;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (if needed)
    location /api/ {
        proxy_pass http://backend-server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yoursite.com www.yoursite.com;
    return 301 https://$server_name$request_uri;
}
```

## Testing Production Deployment

### Pre-deployment Checklist

```bash
# Test deployment script
#!/bin/bash

echo "🧪 Testing production deployment..."

# 1. Build project
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# 2. Test all critical paths
echo "🔍 Testing configurator functionality..."

# Check if all assets are accessible
curl -f https://yoursite.com/public/Weekender.glb > /dev/null
curl -f https://yoursite.com/src/config/floyd-weekender.json > /dev/null

# Test main page loads
curl -f https://yoursite.com/ > /dev/null

# Test HTTPS redirect
curl -I http://yoursite.com/ | grep "301\|302"

# Test security headers
curl -I https://yoursite.com/ | grep -i "x-content-type-options\|x-frame-options"

echo "✅ Production deployment test completed"
```

### Load Testing

```javascript
// scripts/loadTest.js
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Sustained load
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function() {
  // Test main page
  let response = http.get('https://yoursite.com/');
  check(response, {
    'main page loads': (r) => r.status === 200,
    'load time < 3s': (r) => r.timings.duration < 3000,
  });
  
  // Test 3D model
  response = http.get('https://yoursite.com/public/Weekender.glb');
  check(response, {
    'model accessible': (r) => r.status === 200,
  });
  
  // Test configuration
  response = http.get('https://yoursite.com/src/config/floyd-weekender.json');
  check(response, {
    'config accessible': (r) => r.status === 200,
    'valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  });
}
```

## Maintenance & Updates

### Automated Updates

```yaml
# .github/workflows/update.yml
name: Automated Updates

on:
  schedule:
    - cron: '0 2 * * 1' # Every Monday at 2 AM
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Update dependencies
      run: |
        npm update
        npm audit fix
        
    - name: Test updates
      run: |
        npm test
        npm run build
        
    - name: Create pull request
      uses: peter-evans/create-pull-request@v4
      with:
        title: 'chore: automated dependency updates'
        body: 'Automated dependency updates and security fixes'
        branch: automated-updates
```

### Health Check Endpoint

```javascript
// src/utils/healthCheck.js
export class HealthCheck {
  constructor(configurator) {
    this.configurator = configurator;
  }
  
  async runChecks() {
    const results = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {}
    };
    
    try {
      // Test model loading
      results.checks.modelAccess = await this.checkModelAccess();
      
      // Test configuration loading
      results.checks.configAccess = await this.checkConfigAccess();
      
      // Test WebGL support
      results.checks.webglSupport = this.checkWebGLSupport();
      
      // Test performance
      results.checks.performance = await this.checkPerformance();
      
    } catch (error) {
      results.status = 'unhealthy';
      results.error = error.message;
    }
    
    return results;
  }
  
  async checkModelAccess() {
    try {
      const response = await fetch('public/Weekender.glb', { method: 'HEAD' });
      return { status: response.ok ? 'pass' : 'fail', details: response.status };
    } catch (error) {
      return { status: 'fail', details: error.message };
    }
  }
  
  async checkConfigAccess() {
    try {
      const response = await fetch('src/config/floyd-weekender.json');
      const config = await response.json();
      return { 
        status: 'pass', 
        details: { 
          colors: config.colors?.length || 0,
          straps: config.straps?.length || 0,
          environments: config.environments?.length || 0
        }
      };
    } catch (error) {
      return { status: 'fail', details: error.message };
    }
  }
  
  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return { status: gl ? 'pass' : 'fail', details: { supported: !!gl } };
    } catch (error) {
      return { status: 'fail', details: error.message };
    }
  }
  
  async checkPerformance() {
    const start = performance.now();
    // Simulate typical operations
    await new Promise(resolve => setTimeout(resolve, 100));
    const duration = performance.now() - start;
    
    return {
      status: duration < 1000 ? 'pass' : 'warn',
      details: { responseTime: Math.round(duration) }
    };
  }
}

// Usage
window.healthCheck = async () => {
  const healthCheck = new HealthCheck(window.configurator);
  return await healthCheck.runChecks();
};
```

---

This deployment guide provides comprehensive coverage for deploying the XRUpgrade Product Configurator to production environments with proper security, performance optimization, and monitoring considerations. 
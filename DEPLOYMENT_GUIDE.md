# Complete Deployment Guide - Accounting Software
## Self-Hosted Installation on Your Own Server

This guide covers deploying the accounting software with a self-hosted PostgreSQL database on your own Linux server.

---

## 📋 Table of Contents

1. [Server Requirements](#server-requirements)
2. [Option A: PostgreSQL + Node.js Setup](#option-a-postgresql--nodejs-setup)
3. [Option B: Docker Deployment](#option-b-docker-deployment)
4. [Database Migration](#database-migration)
5. [Environment Configuration](#environment-configuration)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🖥️ Server Requirements

### Minimum Specifications:
- **OS:** Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM:** 2GB minimum (4GB recommended)
- **Storage:** 20GB minimum
- **CPU:** 2 cores minimum
- **Network:** Public IP with ports 80, 443, 5432 open

### Software Requirements:
- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Nginx (for reverse proxy)
- PM2 (for process management)
- SSL certificate (Let's Encrypt recommended)

---

## 🔧 Option A: PostgreSQL + Node.js Setup

### Step 1: Update Server & Install Dependencies

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node -v  # Should show v18.x.x
npm -v   # Should show 9.x.x
```

### Step 2: Install PostgreSQL 14

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql-14 postgresql-contrib-14

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql --version
```

### Step 3: Configure PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user (replace with your values)
CREATE DATABASE accounting_db;
CREATE USER accounting_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE accounting_db TO accounting_user;
\c accounting_db
GRANT ALL ON SCHEMA public TO accounting_user;
\q
```

### Step 4: Configure PostgreSQL for Remote Access (if needed)

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Find and modify:
listen_addresses = '*'  # Or your server IP

# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line (replace 0.0.0.0/0 with your IP range for security):
host    all             all             0.0.0.0/0               md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 5: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/accounting-app
cd /var/www/accounting-app

# Clone your project (or upload files via SCP/SFTP)
# Replace with your git repository URL
git clone https://github.com/yourusername/accounting-app.git .

# Or upload files manually:
# scp -r ./local-project-folder/* user@server:/var/www/accounting-app/

# Install dependencies
npm install

# Install PM2 globally for process management
sudo npm install -g pm2
```

### Step 6: Run Database Migrations

```bash
# Install PostgreSQL client tools if not installed
sudo apt install -y postgresql-client

# Navigate to migrations directory
cd /var/www/accounting-app

# Run each migration file in order (they're timestamped)
for file in supabase/migrations/*.sql; do
    echo "Running migration: $file"
    PGPASSWORD='your_secure_password_here' psql -h localhost -U accounting_user -d accounting_db -f "$file"
done

# Or run migrations manually one by one:
PGPASSWORD='your_secure_password_here' psql -h localhost -U accounting_user -d accounting_db -f supabase/migrations/20260321182002_migration_c9b72ce2.sql
# ... repeat for each migration file in chronological order
```

### Step 7: Configure Environment Variables

```bash
cd /var/www/accounting-app

# Create .env.local file
nano .env.local

# Add these variables (modify with your values):
```

```env
# Database Configuration
DATABASE_URL=postgresql://accounting_user:your_secure_password_here@localhost:5432/accounting_db

# Supabase Alternative - Self-Hosted (if using Supabase features)
# Note: This app uses Supabase Auth - you'll need to either:
# 1. Set up self-hosted Supabase (see Option B)
# 2. Use Supabase cloud for auth only
# 3. Replace auth system with custom JWT implementation

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Secret for API authentication (generate a strong random string)
JWT_SECRET=your_very_long_random_secret_key_here_minimum_32_characters

# Application Settings
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
PORT=3000
```

```bash
# Save and close (Ctrl+X, Y, Enter)
```

### Step 8: Build the Application

```bash
cd /var/www/accounting-app

# Build for production
npm run build

# Test the build
npm start

# If it works, stop it (Ctrl+C) and proceed to PM2 setup
```

### Step 9: Setup PM2 Process Manager

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js

# Add this configuration:
```

```javascript
module.exports = {
  apps: [{
    name: 'accounting-app',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/accounting-app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

```bash
# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it outputs (will be something like):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u youruser --hp /home/youruser

# Check status
pm2 status
pm2 logs accounting-app
```

### Step 10: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/accounting-app

# Add this configuration:
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/accounting-app /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### Step 11: Setup SSL Certificate (Let's Encrypt)

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS (recommended)

# Test auto-renewal
sudo certbot renew --dry-run

# Certificate will auto-renew via cron job
```

### Step 12: Configure Firewall

```bash
# If using UFW firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status

# If using iptables or firewalld, adjust accordingly
```

---

## 🐳 Option B: Docker Deployment

### Complete Docker Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install -y docker-compose
```

### Create Docker Configuration Files

```bash
cd /var/www/accounting-app

# Create Dockerfile
nano Dockerfile
```

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

```bash
# Create docker-compose.yml
nano docker-compose.yml
```

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: accounting-db
    restart: always
    environment:
      POSTGRES_DB: accounting_db
      POSTGRES_USER: accounting_user
      POSTGRES_PASSWORD: your_secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - accounting-network

  app:
    build: .
    container_name: accounting-app
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://accounting_user:your_secure_password_here@postgres:5432/accounting_db
      NODE_ENV: production
      NEXT_PUBLIC_APP_URL: https://yourdomain.com
      JWT_SECRET: your_jwt_secret_here
    depends_on:
      - postgres
    networks:
      - accounting-network

  nginx:
    image: nginx:alpine
    container_name: accounting-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - app
    networks:
      - accounting-network

volumes:
  postgres_data:

networks:
  accounting-network:
    driver: bridge
```

```bash
# Create nginx.conf for Docker
nano nginx.conf
```

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

---

## 📊 Database Migration

### Manual Migration Steps

```bash
# Connect to PostgreSQL
PGPASSWORD='your_password' psql -h localhost -U accounting_user -d accounting_db

# Run migrations in order (from supabase/migrations folder)
# The files are timestamped, run them chronologically
```

### Creating Initial Admin User

After migrations, you need to create an admin user:

```sql
-- Connect to database
\c accounting_db

-- Insert admin user (password: Admin123! - hashed)
-- You should change this password after first login
INSERT INTO users (email, password, full_name, role, company_id, is_active)
VALUES (
    'admin@yourdomain.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Password: Admin123!
    'System Administrator',
    'admin',
    NULL,
    true
);
```

---

## 🔐 Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Configure firewall (only allow necessary ports)
- [ ] Setup SSL certificate
- [ ] Regular backups enabled
- [ ] Change default admin password after first login
- [ ] Keep system and dependencies updated
- [ ] Configure fail2ban for brute force protection
- [ ] Set up monitoring and logging

---

## 🔄 Backup & Maintenance

### Database Backup

```bash
# Create backup script
nano /home/youruser/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/youruser/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD='your_password' pg_dump -h localhost -U accounting_user accounting_db > $BACKUP_DIR/accounting_db_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "accounting_db_*.sql" -mtime +7 -delete

echo "Backup completed: accounting_db_$DATE.sql"
```

```bash
# Make executable
chmod +x /home/youruser/backup-db.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add this line:
0 2 * * * /home/youruser/backup-db.sh
```

### Application Updates

```bash
# Stop application
pm2 stop accounting-app

# Pull latest code
cd /var/www/accounting-app
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart application
pm2 restart accounting-app
```

---

## 🐛 Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs accounting-app

# Check Node.js version
node -v

# Rebuild application
cd /var/www/accounting-app
npm run build
pm2 restart accounting-app
```

### Database connection errors

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
PGPASSWORD='your_password' psql -h localhost -U accounting_user -d accounting_db -c "SELECT version();"

# Check pg_hba.conf authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

### Nginx errors

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### SSL certificate issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## 📞 Additional Resources

- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/getting-started/

---

## ✅ Post-Installation Checklist

After completing installation:

1. [ ] Access application at https://yourdomain.com
2. [ ] Login with default admin credentials
3. [ ] Change admin password immediately
4. [ ] Create your company profile
5. [ ] Configure system settings
6. [ ] Test all major features (sales, purchases, reports)
7. [ ] Setup automated backups
8. [ ] Document your custom configuration
9. [ ] Train users on the system

---

**Deployment Guide Version:** 1.0  
**Last Updated:** 2026-03-22  
**Support:** For issues, check logs and troubleshooting section above
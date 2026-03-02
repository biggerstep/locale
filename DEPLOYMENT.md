# Locale Deployment Guide for DigitalOcean

This guide walks through deploying Locale on your **existing** DigitalOcean droplet (that already runs peterbriggs.info) at https://peterbriggs.ai/locale

> **Note**: This guide assumes you're adding Locale to an existing server. Both peterbriggs.info and peterbriggs.ai/locale will run on the same droplet.

## Prerequisites

- ✅ Existing DigitalOcean droplet (running peterbriggs.info)
- Domain `peterbriggs.ai` pointed to your droplet
- Google Maps API key (with Places API, Geocoding API, and Maps JavaScript API enabled)
- SSH access to your droplet

---

## Step 1: Configure DNS

1. Go to your domain registrar or DNS provider for peterbriggs.ai
2. Add/update an A record:
   - **Type**: A
   - **Name**: @ (or peterbriggs.ai)
   - **Value**: Your droplet's IP address (same as peterbriggs.info)
   - **TTL**: 3600 (or default)

3. Wait for DNS propagation (can take up to 48 hours, usually much faster)

Test DNS propagation:
```bash
dig peterbriggs.ai +short
# Should return your droplet's IP address
```

---

## Step 2: Connect to Your Droplet

SSH into your existing droplet:

```bash
ssh root@your_droplet_ip
# Or if you use a non-root user:
# ssh your_username@your_droplet_ip
```

Update system packages:

```bash
sudo apt update
sudo apt upgrade -y
```

---

## Step 3: Install Required Software

Check what's already installed and install missing dependencies:

### Check and install Python 3.11+, pip, and venv

```bash
python3 --version
# If not installed or version < 3.11:
sudo apt install -y python3 python3-pip python3-venv
```

### Check and install Node.js 18+ and npm

```bash
node --version
# If not installed or version < 18:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs
```

### Check nginx (likely already installed for peterbriggs.info)

```bash
nginx -v
# If not installed:
sudo apt install -y nginx
```

### Check and install Certbot for Let's Encrypt

```bash
certbot --version
# If not installed:
sudo apt install -y certbot python3-certbot-nginx
```

### Check git

```bash
git --version
# If not installed:
sudo apt install -y git
```

---

## Step 4: Deploy Application Code

### Clone or upload your repository

```bash
cd /var/www
git clone https://github.com/yourusername/locale.git
# OR upload files via scp/rsync from your local machine:
# rsync -avz /Users/pete/locale/ root@your_droplet_ip:/var/www/locale/
```

### Set ownership

```bash
chown -R www-data:www-data /var/www/locale
cd /var/www/locale
```

---

## Step 6: Configure Environment Variables

Create `.env` file:

```bash
nano /var/www/locale/.env
```

Add your Google API key:

```
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

Save and exit (Ctrl+X, Y, Enter)

Set permissions:

```bash
chmod 600 /var/www/locale/.env
chown www-data:www-data /var/www/locale/.env
```

---

## Step 7: Set Up Python Backend

```bash
cd /var/www/locale

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Test the backend
python3 api_server.py
# Press Ctrl+C to stop after verifying it works
```

---

## Step 8: Build React Frontend

```bash
cd /var/www/locale/locale-app

# Update API_BASE in src/App.js to use relative URL
# Change from: const API_BASE = 'http://10.0.0.203:5001/api';
# To: const API_BASE = '/locale/api';

nano src/App.js
# Make the API_BASE change, then save and exit

# Install dependencies
npm install

# Build production version
npm run build
```

---

## Step 9: Create Systemd Service for Flask API

Create service file:

```bash
nano /etc/systemd/system/locale-api.service
```

Add the following content:

```ini
[Unit]
Description=Locale Flask API Server
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/locale
Environment="PATH=/var/www/locale/venv/bin"
ExecStart=/var/www/locale/venv/bin/python3 /var/www/locale/api_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Save and exit.

Enable and start the service:

```bash
systemctl daemon-reload
systemctl enable locale-api
systemctl start locale-api
systemctl status locale-api
```

---

## Step 8: Configure Nginx

You have two options: create a new config file for peterbriggs.ai, or add to your existing peterbriggs.info config.

### Option A: Create separate config for peterbriggs.ai (Recommended)

Create new nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/peterbriggs.ai
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name peterbriggs.ai www.peterbriggs.ai;

    # Redirect HTTP to HTTPS (will be configured by Certbot)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name peterbriggs.ai www.peterbriggs.ai;

    # SSL certificates (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/peterbriggs.ai/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/peterbriggs.ai/privkey.pem;

    # Root site (you can add a landing page here later)
    root /var/www/html;
    index index.html;

    # Locale React app - serve static files
    location /locale {
        alias /var/www/locale/locale-app/build;
        try_files $uri $uri/ /locale/index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Locale API - proxy to Flask backend
    location /locale/api/ {
        proxy_pass http://127.0.0.1:5001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Main site location
    location / {
        try_files $uri $uri/ =404;
    }
}
```

Save and exit.

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/peterbriggs.ai /etc/nginx/sites-enabled/
```

### Option B: Add to existing config

If you prefer, you can add the Locale locations to your existing peterbriggs.info config. Just add these location blocks to your existing server block:

```nginx
# Locale React app
location /locale {
    alias /var/www/locale/locale-app/build;
    try_files $uri $uri/ /locale/index.html;
}

# Locale API
location /locale/api/ {
    proxy_pass http://127.0.0.1:5001/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

Test nginx configuration:

```bash
sudo nginx -t
```

If successful, reload nginx:

```bash
sudo systemctl reload nginx
```

---

## Step 9: Set Up SSL with Let's Encrypt

If you created a separate config for peterbriggs.ai, run Certbot to get SSL certificates:

```bash
sudo certbot --nginx -d peterbriggs.ai -d www.peterbriggs.ai
```

Follow the prompts:
- Enter your email address (or it may use your existing email)
- Agree to terms of service (if first time)
- Certbot will automatically configure SSL

If you added to existing config, SSL is already configured for peterbriggs.info and you're done!

Test automatic renewal (if not already set up):

```bash
sudo certbot renew --dry-run
```

---

## Step 10: Update React App for Production

Update the built React app to use the correct base path:

```bash
nano /var/www/locale/locale-app/package.json
```

Add `"homepage": "/locale"` to the JSON:

```json
{
  "name": "locale-app",
  "version": "0.1.0",
  "homepage": "/locale",
  ...
}
```

Rebuild the app:

```bash
cd /var/www/locale/locale-app
npm run build
```

---

## Step 11: Configure Flask API for Production

Update `api_server.py` to bind to localhost only:

```bash
sudo nano /var/www/locale/api_server.py
```

Change the last line from:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

To:
```python
app.run(debug=False, host='127.0.0.1', port=5001)
```

Restart the API service:

```bash
sudo systemctl restart locale-api
```

---

## Step 12: Verify Firewall

Check that UFW is configured (likely already set up for peterbriggs.info):

```bash
sudo ufw status
```

Should show:
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
```

If not configured:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Step 13: Verify Deployment

1. Visit https://peterbriggs.ai/locale in your browser
2. Test location searches
3. Check that map markers display correctly
4. Verify climate data loads

Check logs if issues occur:

```bash
# Flask API logs
journalctl -u locale-api -f

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## Maintenance Commands

### Restart services

```bash
systemctl restart locale-api
systemctl restart nginx
```

### View logs

```bash
# API logs
journalctl -u locale-api -f

# Nginx logs
tail -f /var/log/nginx/error.log
```

### Update application

```bash
cd /var/www/locale
git pull  # or rsync files
source venv/bin/activate
pip install -r requirements.txt
cd locale-app
npm install
npm run build
systemctl restart locale-api
```

### Renew SSL certificate (automatic, but manual command)

```bash
certbot renew
```

---

## Troubleshooting

### Issue: API requests fail with CORS errors

Check that Flask CORS is configured correctly in `api_server.py`:
```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
```

### Issue: 404 errors for API endpoints

Check nginx configuration:
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

### Issue: Map doesn't load

Check browser console for API key errors. Verify:
1. `.env` file contains correct API key
2. API key has proper permissions in Google Cloud Console
3. API service is running: `systemctl status locale-api`

### Issue: React app shows blank page

Check:
1. `homepage` field in `package.json` is set to `/locale`
2. App was rebuilt after changing `homepage`
3. Nginx `alias` path is correct
4. Static files exist: `ls -la /var/www/locale/locale-app/build`

---

## Security Best Practices

1. **Keep system updated**:
   ```bash
   apt update && apt upgrade -y
   ```

2. **Restrict API key usage** in Google Cloud Console:
   - Add HTTP referrer restrictions
   - Limit to peterbriggs.ai domain

3. **Monitor logs** regularly:
   ```bash
   journalctl -u locale-api --since "1 hour ago"
   ```

4. **Set up automated backups** of:
   - Application code
   - `.env` file
   - Nginx configuration

5. **Consider using a production WSGI server** like Gunicorn instead of Flask's built-in server:
   ```bash
   pip install gunicorn
   # Update systemd service to use: gunicorn -w 4 -b 127.0.0.1:5001 api_server:app
   ```

---

## Estimated Time

- Initial setup: 30-45 minutes
- DNS propagation: 5 minutes to 48 hours (usually < 1 hour)
- Testing and troubleshooting: 15-30 minutes

**Total: ~1-2 hours**

---

## Cost Estimate

- **DigitalOcean Droplet**: $0 (using existing droplet)
- **Domain**: Already owned
- **Let's Encrypt SSL**: Free
- **Google Maps API**: Pay-as-you-go (likely free tier for personal use)

**Additional monthly cost: $0** 🎉

Your existing droplet should handle both peterbriggs.info and peterbriggs.ai/locale with no issues.

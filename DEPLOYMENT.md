# Locale Deployment Guide for DigitalOcean

Deploys Locale to `https://locale.peterbriggs.info` on the existing DigitalOcean droplet (same one running peterbriggs.info).

## Prerequisites

- Existing DigitalOcean droplet (running peterbriggs.info)
- SSH access to the droplet
- Google Maps API key (Places API, Geocoding API, Maps JavaScript API enabled)

---

## Step 1: Configure DNS

Add a CNAME record for `locale.peterbriggs.info` pointing to the same droplet IP as `peterbriggs.info`:

- **Type**: A
- **Name**: locale
- **Value**: your droplet's IP address
- **TTL**: 3600

Verify propagation:
```bash
dig locale.peterbriggs.info +short
```

---

## Step 2: Connect to the Droplet

```bash
ssh root@your_droplet_ip
sudo apt update && sudo apt upgrade -y
```

---

## Step 3: Install Dependencies

```bash
# Python 3.11+
python3 --version || sudo apt install -y python3 python3-pip python3-venv

# Node.js 18+
node --version || (curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash - && sudo apt install -y nodejs)

# nginx (likely already installed)
nginx -v || sudo apt install -y nginx

# Certbot (likely already installed)
certbot --version || sudo apt install -y certbot python3-certbot-nginx

# git
git --version || sudo apt install -y git
```

---

## Step 4: Deploy Application Code

```bash
cd /var/www
git clone https://github.com/yourusername/locale.git
chown -R www-data:www-data /var/www/locale
```

---

## Step 5: Configure Environment Variables

```bash
nano /var/www/locale/.env
```

```
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

```bash
chmod 600 /var/www/locale/.env
chown www-data:www-data /var/www/locale/.env
```

---

## Step 6: Set Up Python Backend

```bash
cd /var/www/locale
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Quick test — Ctrl+C to stop
python3 api_server.py
```

---

## Step 7: Build React Frontend

No path prefix needed — the app runs at the domain root.

```bash
cd /var/www/locale/locale-app
npm install
npm run build
```

---

## Step 8: Install Systemd Service

```bash
sudo cp /var/www/locale/deploy/do/locale-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable locale-api
sudo systemctl start locale-api
sudo systemctl status locale-api
```

---

## Step 9: Configure Nginx

```bash
sudo cp /var/www/locale/deploy/do/nginx-locale.peterbriggs.info.conf \
    /etc/nginx/sites-available/locale.peterbriggs.info
sudo ln -s /etc/nginx/sites-available/locale.peterbriggs.info \
    /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 10: Set Up SSL

```bash
sudo certbot --nginx -d locale.peterbriggs.info
sudo certbot renew --dry-run
```

---

## Step 11: Verify

Visit `https://locale.peterbriggs.info` and test a location search.

```bash
# Check logs if something's wrong
journalctl -u locale-api -f
tail -f /var/log/nginx/error.log
```

---

## Maintenance

```bash
# Restart services
sudo systemctl restart locale-api
sudo systemctl reload nginx

# Deploy updates
cd /var/www/locale
git pull
source venv/bin/activate
pip install -r requirements.txt
cd locale-app && npm install && npm run build
sudo systemctl restart locale-api
```

---

## Troubleshooting

**CORS errors** — verify `flask_cors` is installed and `CORS(app)` is in `api_server.py`.

**Blank page** — check browser console; verify `npm run build` completed and the build folder exists at `/var/www/locale/locale-app/build`.

**API 502** — check `systemctl status locale-api` and `journalctl -u locale-api`.

**Map doesn't load** — verify the API key in `.env` has Maps JavaScript API enabled.

---

## Security

- Restrict the Google API key to `locale.peterbriggs.info` in Google Cloud Console
- Consider Gunicorn instead of Flask dev server for production:
  ```bash
  pip install gunicorn
  # In locale-api.service, replace ExecStart with:
  # ExecStart=/var/www/locale/venv/bin/gunicorn -w 4 -b 127.0.0.1:5001 api_server:app
  ```

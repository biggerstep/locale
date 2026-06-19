# Deploy

Service and config files for running Locale in each environment.

## macOS (dev — pgb-mm)

Files in `macos/` are launchd agents that auto-start both servers on login.

Paths are hard-coded to `/Users/pete/code/locale`. If the repo moves, update both plists and reload.

**Install:**
```bash
cp deploy/macos/*.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.pete.locale-api.plist
launchctl load ~/Library/LaunchAgents/com.pete.locale-react.plist
```

**Reload after changes:**
```bash
launchctl unload ~/Library/LaunchAgents/com.pete.locale-api.plist
launchctl load  ~/Library/LaunchAgents/com.pete.locale-api.plist
```

## DigitalOcean (production)

Files in `do/` assume the app is deployed to `/var/www/locale` running as `www-data`.

See `DEPLOYMENT.md` for the full step-by-step guide.

**Install systemd service:**
```bash
sudo cp deploy/do/locale-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable locale-api
sudo systemctl start locale-api
```

**Install nginx config:**
```bash
sudo cp deploy/do/nginx-peterbriggs.ai.conf /etc/nginx/sites-available/peterbriggs.ai
sudo ln -s /etc/nginx/sites-available/peterbriggs.ai /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

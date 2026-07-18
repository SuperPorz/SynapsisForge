# Session 35 — Day 91: HTTPS with Let's Encrypt

**Date**: 2026-06-27
**State**: ✅ Completed

## Summary
Completed Day 91 — HTTPS setup with Let's Encrypt on EC2 production instance.

## Work done
- Searched for cheap domain providers → user bought `synapsisforge.shop` on Spaceship (PayPal)
- Pointed A record `synapsisforge.shop` → `51.118.21.90` via Spaceship Advanced DNS
- Installed nginx + certbot on EC2
- Configured nginx as reverse proxy (frontend→8080, backend→3000)
- Changed frontend docker port from `80:80` to `8080:80` in `docker-compose.prod.yml` to free port 80 for nginx host
- Ran Certbot → SSL certificate obtained and auto-renew cron set up
- Updated EC2 security group SSH inbound rule (user has dynamic IP, opened to `0.0.0.0/0`)
- Added `location /api/` proxy to nginx config

## Domain
- **Domain**: `synapsisforge.shop`
- **Registrar**: Spaceship
- **DNS**: A record `@` → `51.118.21.90` (TTL: 5 min)
- **SSL**: Let's Encrypt via Certbot (expires 2026-09-25)

## Config notes
- nginx config at `/etc/nginx/sites-enabled/synapsisforge.shop`
- Frontend Docker container on `8080:80` internally, nginx proxies `/` to it
- Backend Docker container on `3000`, nginx proxies `/api/` to it
- HTTP→301→HTTPS redirect active

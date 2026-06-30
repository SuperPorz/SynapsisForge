# Troubleshooting

## Docker

### Port already in use

If ports 5432, 27017, 6379, 3000, or 8080 are already taken:

```bash
# Check which process is using a port (Windows)
netstat -ano | grep 5432

# Stop the conflicting service or change the port mapping in docker-compose-dev.yaml
```

### Container keeps restarting

```bash
# Check logs
docker compose -f infra/docker-compose-dev.yaml logs backend
```

Common causes:
- PostgreSQL/MongoDB not ready yet (the compose has health checks, wait 10-15s)
- `.env.development` missing required JWT secrets
- MongoDB auth mismatch — ensure `MONGO_USER`/`MONGO_PASS` in `.env.development` match compose defaults (`admin`/`qwerty`)

### `docker compose` command not found

Make sure Docker Desktop is installed and the CLI is available in your PATH. On Windows, use Docker Desktop's bundled CLI or install via Docker's official installer.

### Seed command fails

```bash
# Ensure all containers are healthy first
docker compose -f infra/docker-compose-dev.yaml ps

# Then run the seed
docker compose -f infra/docker-compose-dev.yaml exec backend npx ts-node src/database/seeds/seed.ts
```

If the seed still fails, check backend logs for database connection errors.

## Frontend

### Blank page or API calls failing

The frontend (via nginx) proxies `/api` requests to the backend. If the backend isn't running or the proxy config is wrong, check:

```bash
# Test backend directly
curl http://localhost:3000/api/docs

# Test through nginx
curl http://localhost:8080/api/docs
```

### CORS errors

The backend CORS configuration allows `http://localhost:8080` (the nginx proxy). If accessing the frontend on a different port, update `FRONTEND_URL` in `docker-compose-dev.yaml` and the CORS config.

## Database

### Can't connect to PostgreSQL from host

The PostgreSQL container exposes port 5432. Use these credentials:

```
Host: localhost
Port: 5432
User: admin
Password: qwerty
Database: pg_database
```

### Can't connect to MongoDB from host

```
Host: localhost
Port: 27017
User: admin
Password: qwerty
Authentication database: admin
```

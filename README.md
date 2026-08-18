# exchange-ops-control-center

## Local database

The backend requires PostgreSQL. Start the development database from the repository root:

```bash
docker compose up -d postgres
docker compose ps
```

Wait until the `postgres` service reports `(healthy)`, then start the backend:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The `local` profile points at `localhost:5432` and uses the same non-secret development
credentials as the Compose service, so no `.env` file is needed to run locally. Copy
`.env.example` to `.env` only when you need to override those defaults; `.env` is
git-ignored and must never be committed.

Verify the service:

```bash
curl -i http://localhost:8080/api/v1/health
curl -s "http://localhost:8080/api/v1/events?page=0&size=3&sort=eventTimestamp,desc"
```

Stop the database without deleting data:

```bash
docker compose stop postgres
```

Remove the local database volume deliberately, discarding all local data:

```bash
docker compose down -v
```

## Tests

```bash
cd backend
mvn -B test
mvn -B verify
```

Integration tests use Testcontainers and start their own PostgreSQL container, so they do
not depend on the Compose service.
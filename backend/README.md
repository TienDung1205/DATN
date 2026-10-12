# Bookstore backend

## Run with Docker Compose

From the repository root:

```sh
docker compose up --build
```

The API is available at `http://localhost:8000`; check `http://localhost:8000/health` for its health endpoint. To use another host port, set `BACKEND_PORT` (for example, `BACKEND_PORT=8080 docker compose up --build`). Stop the services with `docker compose down`.

The frontend directory currently has no application source or package manifest, so Compose only starts the backend.

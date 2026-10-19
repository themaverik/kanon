---
name: docker-dev
description: "docker", "compose", "spin up", "bring up", "tear down", "containers", "logs", "restart". Pre-flight check before every docker command. Safe container management, data protection rules.

---

# Docker Dev Skill

Enforces safe Docker practices across all projects. Always runs pre-flight before
any container operation.

## Pre-flight (mandatory, always first)

Before ANY docker command, run:

```bash
docker info > /dev/null 2>&1 && echo "RUNNING" || echo "NOT RUNNING"
```

If NOT RUNNING, stop immediately and say:

```
Docker is not running.
Please start Docker Desktop (or your Docker daemon) and let me know when it's ready.
```

Do not retry. Do not attempt to start Docker. Wait for the user.

## Common Commands

```bash
docker compose up -d                        # start services
docker compose up -d --build                # start with rebuild
docker compose ps                           # check status
docker compose logs --tail 50               # view logs
docker compose logs <service> --tail 100 -f # follow single service
docker compose restart <service>            # restart single service
docker compose down                         # stop (preserves volumes)
docker compose down -v                      # stop + DELETE all data
docker compose build <service> --no-cache   # rebuild single service
```

## Rules

1. Always run pre-flight before any docker command -- no exceptions
2. When a compose file is not obvious, ask the user which one to use
3. After `docker compose up`, run a status check to confirm services are healthy
4. If a project has a project-level docker reference (e.g. `.claude/references/docker-services.md`), read it for project-specific service maps, ports, and workflows

## Data Protection (mandatory, never skip)

Volumes and containers that store databases, files, or persistent state (e.g. postgres, keycloak-db, minio, redis with persistence) are protected. The user may have spent hours running manual or automated tests populating this data -- wiping it without consent is unacceptable.

**Always ask for explicit user confirmation before:**
- `docker compose down -v` or any command that removes volumes
- `docker volume rm`, `docker volume prune`
- `docker system prune`, `docker container prune`, `docker image prune`
- Rebuilding containers that are linked to volumes or store databases/files (e.g. `docker compose up -d --build` on a db service, or `--force-recreate` on storage containers)
- `docker rm` on any container that mounts volumes with persistent data

**Prompt template:**
```
This will delete persistent data (databases, files, stored state).
Affected: <list containers/volumes that will be lost>
Are you sure? This cannot be undone.
```

Do not proceed until the user explicitly confirms. "Yes" in a prior session does not carry over.

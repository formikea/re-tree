# re-tree — top-level dev convenience commands.
# On the host, npm targets run via `docker compose exec` against the `api`
# service (shared node_modules volume). Prefer `npm …` directly when using a
# local Node install instead of Compose for the apps.
#
# Usage:  make <target>        e.g.  make dev   make lint
# List:   make help

IN_CONTAINER := $(shell [ -d /workspaces/re-tree ] && echo 1 || echo 0)

COMPOSE := docker compose

ifeq ($(IN_CONTAINER),1)
  NPM := npm
else
  NPM := $(COMPOSE) exec -T api npm
endif

.PHONY: help up down logs install install-api install-client install-website dev lint typecheck migrate-prisma migrate-prisma-new seed-prisma db-bootstrap shell-api shell-client shell-website shell-db clean

help:
	@echo "re-tree — make targets"
	@echo ""
	@echo "  up / down / logs       compose lifecycle (host only)"
	@echo "  install                npm ci at workspace root"
	@echo "  dev                    start postgres + api + client + website"
	@echo "  lint / typecheck       eslint / tsc --noEmit"
	@echo "  migrate-prisma         Prisma migrate deploy using apps/api/.env"
	@echo "  migrate-prisma-new MSG='...'  Prisma migrate dev --name MSG"
	@echo "  seed-prisma            prisma db seed"
	@echo "  db-bootstrap           generate + migrate + seed"
	@echo "  shell-api / shell-client / shell-website / shell-db"
	@echo "  clean                  drop compose volumes (DESTROYS local db)"

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

dev: up
	@echo "api:     http://localhost:5000"
	@echo "client:  http://localhost:3000"
	@echo "website: http://localhost:3001"
	docker compose logs -f --tail=50 api client website

clean:
	docker compose down -v

install: install-api

install-api install-client install-website:
ifeq ($(IN_CONTAINER),1)
	npm ci --no-audit --no-fund
else
	$(COMPOSE) exec -T api sh -lc "npm ci --no-audit --no-fund"
endif

lint:
	$(NPM) run lint --workspaces --if-present

typecheck:
	$(NPM) run typecheck --workspaces --if-present

migrate-prisma:
	$(NPM) run migrate:deploy -w @re-tree/api

migrate-prisma-new:
	@if [ -z "$(MSG)" ]; then echo "Usage: make migrate-prisma-new MSG='description'"; exit 1; fi
ifeq ($(IN_CONTAINER),1)
	npm run db:migrate -w @re-tree/api -- --name "$(MSG)"
else
	$(COMPOSE) exec -T api sh -lc "npm run db:migrate -w @re-tree/api -- --name \"$(MSG)\""
endif

seed-prisma:
	$(NPM) run db:seed -w @re-tree/api

db-bootstrap:
	$(NPM) run db:bootstrap

shell-api:
	docker compose exec api sh

shell-client:
	docker compose exec client sh

shell-website:
	docker compose exec website sh

shell-db:
	docker compose exec postgres psql -U postgres -d re_tree_db

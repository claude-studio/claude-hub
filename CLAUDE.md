# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A GitHub webhook service that integrates Claude Code with GitHub. When someone mentions the configured bot username in a GitHub issue/PR comment, the system runs Claude Code in a Docker container and posts a response. Also supports auto-tagging issues and automated PR reviews when CI passes.

## Build & Run

```bash
npm run build          # TypeScript → dist/
npm run typecheck      # type-check only (no emit)
npm run dev            # ts-node (no compile needed)
npm run dev:watch      # nodemon + ts-node
npm start              # run compiled dist/
docker compose up -d   # recommended for production
```

### Tests

```bash
npm run test:unit      # fast, no Docker required
npm run test:e2e       # requires Docker
npm run test:coverage  # with coverage
npm run test:ci        # CI: coverage + junit reporter
```

Run a single test file:
```bash
npx jest test/unit/services/claudeService.test.js
npx jest test/unit/core/webhook/WebhookProcessor.test.ts
```

### Lint & Format

```bash
npm run lint           # ESLint auto-fix
npm run lint:check     # check only (CI)
npm run format         # Prettier auto-fix
npm run format:check   # check only (CI)
```

### Docker

```bash
./scripts/build/build.sh claudecode   # build Claude executor image
docker compose logs -f webhook         # tail logs
```

## Architecture

### Webhook Processing Pipeline

```
POST /api/webhooks/:provider
  → webhookRoutes (src/routes/webhooks.ts)
      → validates provider name whitelist (github, claude)
      → WebhookProcessor.processWebhook()
          → signature verification (HMAC-SHA256, timing-safe)
          → GitHubWebhookProvider.parsePayload()  → event type (e.g. issues.opened)
          → WebhookRegistry.getHandlers()          → matched handlers
          → handlers execute in priority order
          → 200 (all success) or 207 Multi-Status (partial)
```

There are two route systems:
- **Legacy**: `src/routes/github.ts` → `src/controllers/githubController.ts` (direct handler)
- **New (modular)**: `src/routes/webhooks.ts` → `src/core/webhook/WebhookProcessor.ts` → provider/handler pattern

New code should use the modular system.

### Key Files

| File | Role |
|------|------|
| `src/index.ts` | Express setup, rate limiting (100/15min general, 50/5min webhook), health check at `/health` |
| `src/core/webhook/WebhookProcessor.ts` | Central dispatch engine |
| `src/core/webhook/WebhookRegistry.ts` | Registers providers and handlers |
| `src/providers/github/GitHubWebhookProvider.ts` | Signature verification, payload parsing |
| `src/providers/github/handlers/IssueHandler.ts` | Auto-tagging logic |
| `src/services/claudeService.ts` | Builds and runs Docker container with Claude Code |
| `src/services/githubService.ts` | Octokit wrapper for GitHub API |
| `src/utils/sanitize.ts` | Input validation + bot mention removal (loop prevention) |
| `src/utils/logger.ts` | Pino logger with credential redaction |

### Claude Execution Flow (claudeService.ts)

`processCommand()` builds a `docker run` command:

```
1. Validate GitHub token
2. Check/build claudecode:latest image
3. Generate prompt based on operationType
4. Run container:
   docker run --rm
     --memory 2g --cpu-shares 1024 --pids-limit 256
     --cap-add NET_ADMIN --cap-add SYS_ADMIN
     -v ${CLAUDE_AUTH_HOST_DIR}:/home/node/.claude
     -e REPO_FULL_NAME, ISSUE_NUMBER, COMMAND, GITHUB_TOKEN, ...
     --entrypoint /scripts/runtime/claudecode-entrypoint.sh
     claudecode:latest
5. Capture stdout, sanitize bot mentions, return
```

**Operation types** control tool allowlists:
- `auto-tagging`: `--allowedTools Read,GitHub` (minimal)
- `pr-review` / `default`: `--allowedTools Bash,Create,Edit,Read,Write,GitHub`

### Docker Images

| Dockerfile | Image | Purpose |
|------------|-------|---------|
| `Dockerfile` | webhook service | 4-stage build; non-root `claudeuser`; runs Express server |
| `Dockerfile.claudecode` | `claudecode:latest` | Claude Code executor; includes `gh` CLI, iptables, zsh; runs as root for cap management |
| `Dockerfile.claude-setup` | setup image | One-time Claude auth setup |

### Event Handlers

| GitHub Event | Handler | Behavior |
|---|---|---|
| `issues.opened` | `IssueHandler` | Runs Claude with minimal tools; applies labels via `gh issue edit`; falls back to keyword matching |
| `check_suite` (success) | `githubController.ts` | Debounced PR review trigger; deduped by commit SHA |
| `issue_comment` / `pull_request_review_comment` | `githubController.ts` | Bot mention → full Claude Code run |

### PR Review Deduplication

`hasReviewedPRAtCommit()` checks if the bot already commented on the same commit SHA, preventing duplicate reviews from multiple `check_suite` events.

## TypeScript Conventions

- Strict mode; `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`
- Prefer `interface` over `type` alias
- Use `unknown` instead of `any`; type imports with `import type`
- All source in `src/`, compiles to `dist/`; test files excluded from tsconfig

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `BOT_USERNAME` | GitHub bot handle (e.g. `@ClaudeBot`) |
| `GITHUB_WEBHOOK_SECRET` | HMAC secret for webhook verification |
| `GITHUB_TOKEN` | GitHub PAT |
| `ANTHROPIC_API_KEY` | Anthropic API key (not needed if using Setup Container auth) |
| `AUTHORIZED_USERS` | Comma-separated GitHub usernames allowed to use the bot |
| `BOT_EMAIL` | Email for git commits made by the bot |

Key optional variables: `PR_REVIEW_WAIT_FOR_ALL_CHECKS` (default `"true"`), `PR_REVIEW_DEBOUNCE_MS` (default `5000`), `PR_REVIEW_MAX_WAIT_MS` (default `1800000`).

## Security Notes

- All webhook signatures verified with `crypto.timingSafeEqual`
- Bot mention strings stripped from Claude output to prevent response loops
- Docker containers are resource-capped and run with minimal capabilities
- Credentials are redacted from logs via Pino `redact` paths and regex patterns in `sanitize.ts`
- Pre-commit hooks (Husky): ESLint + Prettier + TypeScript check

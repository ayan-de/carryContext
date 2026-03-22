# 🚀 Context Carry — Implementation Roadmap

> Status: Phase 1 Complete ✓ | Phase 2 Complete ✓ | Phase 4 In Progress | Phase 3 (Pending)
> Last Updated: 2026-03-22

---

## All Phases Overview

| # | Phase | Timeline | Goal |
|---|-------|----------|------|
| 1 | **Core Engine + CLI** | Weeks 1-2 | `ctx save` / `ctx load` working, .md brain, Anthropic summariser |
| 2 | **Claude Code Plugin** | Weeks 3-4 | Hooks wired, auto-save on Stop, auto-inject on UserPromptSubmit |
| 3 | **MCP Server** | Weeks 5-6 | Agent-agnostic bridge, Cursor + Windsurf support |
| 4 | **VS Code Dashboard** | Weeks 7-9 | Visual session explorer, status bar, diff view |
| 5 | **Chrome Extension** | Weeks 10-12 | Claude.ai + ChatGPT + Gemini injection via native messaging |
| 6 | **Context Intelligence** | Weeks 13-15 | Scoring algo, semantic search, relevance ranking |
| 7 | **Testing Suite** | Weeks 16-17 | Unit, integration, e2e coverage |
| 8 | **DevOps + CI/CD** | Weeks 18-19 | GitHub Actions, release pipeline, npm publish |

---

## Phase 1: Core Engine + CLI (Weeks 1-2)

**Goal**: `ctx save` stores a compressed .md snapshot. `ctx load` prints it back. The file brain is alive.

```
User runs `ctx save`
  → watcher.ts detects project name + git branch
    → summariser.ts calls Anthropic API with session content
      → storage.ts writes LATEST.md + timestamped archive
        → index.md updated
          → Done. Brain saved.

User opens new terminal / new chat
  → runs `ctx load`
    → storage.ts reads LATEST.md for current project+branch
      → injector.ts formats preamble string
        → printed to stdout
          → paste into any AI chat. Done.
```

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 1.1 | Init Turborepo monorepo with pnpm workspaces | `turbo.json`, `pnpm-workspace.yaml`, root `package.json` | ✅ |
| 1.2 | Scaffold `packages/types` — shared TS interfaces | `packages/types/src/index.ts` | ✅ |
| 1.3 | Scaffold `packages/core` with tsconfig | `packages/core/package.json`, `packages/core/tsconfig.json` | ✅ |
| 1.4 | Scaffold `apps/cli` with commander entry point | `apps/cli/src/index.ts`, `apps/cli/package.json` | ✅ |
| 1.5 | Build `watcher.ts` — detect project name + git branch | `packages/core/src/watcher.ts` | ✅ |
| 1.6 | Build `storage.ts` — read/write .md files with gray-matter | `packages/core/src/storage.ts` | ✅ |
| 1.7 | Build `summariser.ts` — compress session via Anthropic API | `packages/core/src/summariser.ts` | ✅ |
| 1.8 | Build `injector.ts` — format LATEST.md as context preamble | `packages/core/src/injector.ts` | ✅ |
| 1.9 | Build `scorer.ts` — rank sessions by relevance to current context | `packages/core/src/scorer.ts` | ✅ |
| 1.10 | Wire `ctx save` command | `apps/cli/src/commands/save.ts` | ✅ |
| 1.11 | Wire `ctx load` command | `apps/cli/src/commands/load.ts` | ✅ |
| 1.12 | Wire `ctx list` command | `apps/cli/src/commands/list.ts` | ✅ |
| 1.13 | Wire `ctx search <query>` command — grep across all sessions | `apps/cli/src/commands/search.ts` | ✅ |
| 1.14 | Wire `ctx status` command — show active project + last saved | `apps/cli/src/commands/status.ts` | ✅ |
| 1.15 | Wire `ctx clear` command — with confirmation prompt | `apps/cli/src/commands/clear.ts` | ✅ |
| 1.16 | Bootstrap `~/.contextcarry/` folder on first run | `packages/core/src/storage.ts` | ✅ |
| 1.17 | Write `config.json` schema + reader | `packages/core/src/config.ts` | ✅ |
| 1.18 | Write `index.md` updater — master session registry | `packages/core/src/storage.ts` | ✅ |
| 1.19 | Add `ctx` binary to PATH via `package.json` bin field | `apps/cli/package.json` | ✅ |
| 1.20 | Manual end-to-end test: save → load → verify preamble | — | ✅ |

---

## Phase 2: Claude Code Plugin (Weeks 3-4)

**Goal**: Zero user friction. Claude Code automatically saves context when it stops and injects it when a new chat begins.

```
Claude Code session ends
  → Stop hook fires
    → ctx save --auto --stdin
      → reads transcript from stdin
        → summariser compresses it
          → LATEST.md written silently

New Claude Code chat starts
  → UserPromptSubmit hook fires
    → ctx load --inject
      → LATEST.md read for current project+branch
        → preamble prepended to user's first message
          → Claude sees full context. User types nothing extra.
```

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 2.1 | Add `--auto` flag to `ctx save` — silent mode, reads stdin | `apps/cli/src/commands/save.ts` | ✅ |
| 2.2 | Add `--inject` flag to `ctx load` — outputs preamble to stdout | `apps/cli/src/commands/load.ts` | ✅ |
| 2.3 | Build `transcript.ts` — parse Claude Code JSONL transcript files | `packages/core/src/transcript.ts` | ✅ |
| 2.4 | Build `ctx hook` command — processes Stop hook payload from stdin | `apps/cli/src/commands/hook.ts` | ✅ |
| 2.5 | Wire `Stop` hook → `ctx hook` via `ctx init` | `apps/cli/src/commands/init.ts` | ✅ |
| 2.6 | Merge hook config into `~/.claude/settings.json` (idempotent) | `apps/cli/src/commands/init.ts` | ✅ |
| 2.7 | Build `/ctx-save` slash command — Claude summarizes + saves mid-session | `~/.claude/commands/ctx-save.md` | ✅ |
| 2.8 | Build `/ctx-load` slash command — loads and displays saved context | `~/.claude/commands/ctx-load.md` | ✅ |
| 2.9 | Build `/ctx-status` slash command — shows active context status | `~/.claude/commands/ctx-status.md` | ✅ |
| 2.10 | Build `ctx init` — installs hooks + slash commands end-to-end | `apps/cli/src/commands/init.ts` | ✅ |
| 2.11 | Add `claudeSessionId` to `SessionMetadata` — track Claude session per save | `packages/types/src/index.ts` | ✅ |
| 2.12 | Graceful fallback — save raw transcript if no API key on Stop hook | `apps/cli/src/commands/hook.ts` | ✅ |
| 2.13 | Wire real `summarizeSessionFull` from core into `ctx save` (remove mock) | `apps/cli/src/commands/save.ts` | ✅ |

---

## Phase 3: MCP Server (Weeks 5-6)

**Goal**: Any MCP-capable editor (Cursor, Windsurf, Cline, Zed, Continue, Roo Code) connects with a single config line and gets full context carry. One server, every agent.

**Transport**: stdio (standard for local MCP servers — editor spawns the process, communicates via stdin/stdout)

**SDK**: `fastmcp` (high-level TypeScript framework over `@modelcontextprotocol/sdk` — cleaner tool definitions with Zod schemas, built-in error handling, stdio transport out of the box)

**Project Resolution**: Every tool accepts an optional `cwd` parameter. If provided, the server uses it to detect project name + git branch via `watcher.ts`. If omitted, falls back to `process.cwd()` (works when the editor spawns the server with a `cwd` config).

```
Editor opens project
  → mcp config spawns contextcarry server (stdio transport)
    → MCP handshake over stdin/stdout

Agent calls load_context({ cwd: "/path/to/project" })
  → watcher.ts detects project + branch from cwd
    → storage.ts reads LATEST.md
      → returns context string to agent
        → agent sees full project history. Done.

Agent calls save_context({ cwd: "/path/to/project", transcript: "..." })
  → watcher.ts detects project + branch from cwd
    → summariser.ts compresses transcript via AI provider
      → storage.ts writes LATEST.md + archive
        → context saved. Done.
```

**Editor config example (universal)**:
```json
{
  "mcpServers": {
    "contextcarry": {
      "command": "npx",
      "args": ["contextcarry-mcp"],
      "cwd": "/path/to/project"
    }
  }
}
```

**Error Handling**: All tools return structured MCP errors for: missing API key, storage dir not bootstrapped, invalid project/branch, provider failures. Config is read via `config.ts` from `~/.contextcarry/config.json` (same path as CLI).

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 3.1 | Scaffold `apps/mcp` with `fastmcp` + Zod, stdio transport | `apps/mcp/package.json`, `apps/mcp/tsconfig.json`, `apps/mcp/src/index.ts` | ✅ |
| 3.2 | Define `cwd` param contract — all tools accept optional `cwd`, fallback to `process.cwd()` | `apps/mcp/src/utils/resolve-project.ts` | ✅ |
| 3.3 | Build shared error handler — maps core errors to FastMCP `UserError` responses | `apps/mcp/src/utils/error-handler.ts` | ✅ |
| 3.4 | Implement `save_context` MCP tool — accepts raw transcript, runs AI summarisation | `apps/mcp/src/tools/save.ts` | ✅ |
| 3.5 | Implement `load_context` MCP tool — returns LATEST.md formatted as preamble | `apps/mcp/src/tools/load.ts` | ✅ |
| 3.6 | Implement `list_sessions` MCP tool — returns sessions for project/branch | `apps/mcp/src/tools/list.ts` | ✅ |
| 3.7 | Implement `search_context` MCP tool — grep across all sessions | `apps/mcp/src/tools/search.ts` | ✅ |
| 3.8 | Implement `get_status` MCP tool — active project, branch, last saved timestamp | `apps/mcp/src/tools/status.ts` | ✅ |
| 3.9 | Implement `clear_context` MCP tool — clear saved context for project/branch with confirmation flag | `apps/mcp/src/tools/clear.ts` | ✅ |
| 3.10 | Implement `delete_session` MCP tool — delete a specific session by ID | `apps/mcp/src/tools/delete.ts` | ✅ |
| 3.11 | Add `ctx mcp` CLI command to start MCP server (delegates to `apps/mcp` entry point) | `apps/cli/src/commands/mcp.ts` | ✅ |
| 3.12 | Add `contextcarry-mcp` standalone bin entry for `npx` invocation | `apps/mcp/package.json` (bin field) | ✅ |
| 3.13 | Write Cursor integration config template | `docs/integrations/cursor.md` | ⬜ |
| 3.14 | Write Windsurf integration config template | `docs/integrations/windsurf.md` | ⬜ |
| 3.15 | Write Cline integration config template | `docs/integrations/cline.md` | ⬜ |
| 3.16 | Write Zed integration config template | `docs/integrations/zed.md` | ⬜ |
| 3.17 | Write Continue integration config template | `docs/integrations/continue.md` | ⬜ |
| 3.18 | Write Roo Code integration config template | `docs/integrations/roo-code.md` | ⬜ |
| 3.19 | Test: editor connects via stdio → MCP handshake succeeds | — | ⬜ |
| 3.20 | Test: `load_context` returns LATEST.md content correctly | — | ⬜ |
| 3.21 | Test: `load_context` returns graceful empty response when no context exists | — | ⬜ |
| 3.22 | Test: `save_context` with transcript → LATEST.md written + summarised | — | ⬜ |
| 3.23 | Test: `search_context` returns matching sessions | — | ⬜ |
| 3.24 | Test: `clear_context` removes context and returns confirmation | — | ⬜ |
| 3.25 | Test: error responses for missing API key, invalid cwd, no sessions | — | ⬜ |

---

## Phase 4: VS Code Dashboard (Weeks 7-9)

**Goal**: Visual layer for managing contexts. The MCP server (Phase 3) handles all AI agent communication — this extension gives humans a GUI to see, browse, and manage their saved contexts.

**Architecture**: Extension connects to `@contextcarry/core` directly (shared package). No CLI shelling, no duplicate logic.

```
VS Code opens
  → extension activates
    → detects workspace + git branch via core/watcher
      → status bar shows "Context: my-app/main ✓"

User clicks status bar (or opens sidebar)
  → Session Explorer panel opens
    → lists all sessions for current project
      → click to preview, compare, or delete

User clicks "Save Context" button
  → core/storage writes LATEST.md
    → toast: "Context saved for my-app/main"
      → sidebar refreshes automatically
```

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 4.1 | Scaffold VS Code extension project | `apps/vscode/package.json`, `apps/vscode/src/extension.ts` | ✅ |
| 4.2 | Build activation handler — detects workspace + branch via `@contextcarry/core` | `apps/vscode/src/extension.ts` | ✅ |
| 4.3 | Build status bar item — shows provider + model from config.json | `apps/vscode/src/statusBar.ts` | ✅ |
| 4.4 | Build Session Explorer sidebar — TreeView: Project → Branch → Session | `apps/vscode/src/views/sessionExplorer.ts` | ✅ |
| 4.5 | Build session preview — click a session to view its .md in editor | `apps/vscode/src/extension.ts` | ✅ |
| 4.6 | Build session diff — compare two sessions side-by-side via QuickPick | `apps/vscode/src/extension.ts` | ✅ |
| 4.7 | Build `Context Carry: Save` command palette command | `apps/vscode/src/commands/save.ts` | ⬜ |
| 4.8 | Build `Context Carry: Delete Session` command with confirmation | `apps/vscode/src/extension.ts` | ✅ |
| 4.9 | Build notification toasts — "Context saved", "Context loaded" | `apps/vscode/src/extension.ts` | ✅ |
| 4.10 | Write VS Code marketplace manifest (contributes: views, commands, statusBar) | `apps/vscode/package.json` | ✅ |
| 4.11 | Test: VS Code loads → status bar shows active context | — | ⬜ |
| 4.12 | Test: Session Explorer lists correct sessions + preview works | — | ⬜ |
| 4.13 | Test: Diff view shows changes between two sessions | — | ⬜ |

---

## Phase 5: Chrome Extension (Weeks 10-12)

**Goal**: Claude.ai, ChatGPT, Gemini, Perplexity — one extension, all web AI chats get context carry via native messaging.

```
User opens claude.ai
  → content script activates
    → detects current project via native messaging to local daemon
      → shows floating "⚡ Context Ready" button

User clicks button (or presses Ctrl+Shift+K)
  → extension calls native messaging host
    → daemon reads LATEST.md
      → returns context string
        → extension injects into chat input
          → user hits send — AI sees full context
```

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 5.1 | Scaffold Chrome extension with Manifest V3 | `extension/manifest.json`, `extension/src/` | ⬜ |
| 5.2 | Build native messaging host — stdin/stdout bridge to CLI | `apps/cli/src/native-host.ts`, `extension/host/install.sh` | ⬜ |
| 5.3 | Register native messaging host manifest | `extension/host/com.contextcarry.json` | ⬜ |
| 5.4 | Build background service worker | `extension/src/background.ts` | ⬜ |
| 5.5 | Build site adapter map — DOM selectors per AI chat site | `extension/src/adapters/index.ts` | ⬜ |
| 5.6 | Build claude.ai adapter | `extension/src/adapters/claude.ts` | ⬜ |
| 5.7 | Build ChatGPT adapter | `extension/src/adapters/chatgpt.ts` | ⬜ |
| 5.8 | Build Gemini adapter | `extension/src/adapters/gemini.ts` | ⬜ |
| 5.9 | Build content script — inject button + keyboard shortcut | `extension/src/content.ts` | ⬜ |
| 5.10 | Build popup UI — show active context, quick save | `extension/src/popup/popup.html`, `extension/src/popup/popup.ts` | ⬜ |
| 5.11 | Build context injector — insert preamble into chat input | `extension/src/injector.ts` | ⬜ |
| 5.12 | Add `ctx host install` command — installs native messaging host | `apps/cli/src/commands/host.ts` | ⬜ |
| 5.13 | Write host install script for Mac/Linux/Windows | `extension/host/install.sh`, `extension/host/install.ps1` | ⬜ |
| 5.14 | Test: claude.ai → button appears → context injected | — | ⬜ |
| 5.15 | Test: ChatGPT → context injected correctly | — | ⬜ |
| 5.16 | Test: native messaging host survives browser restart | — | ⬜ |

---

## Phase 6: Context Intelligence (Weeks 13-15)

**Goal**: The right context surfaces automatically. Scorer gets smarter. Search becomes semantic.

```
User switches to feature/payments branch
  → scorer.ts evaluates all sessions
    → ranks by: branch match, recency, file overlap, keyword similarity
      → top session loaded automatically
        → no manual `ctx load` needed ever again
```

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 6.1 | Improve `scorer.ts` — branch + recency + file overlap scoring | `packages/core/src/scorer.ts` | ⬜ |
| 6.2 | Add keyword extraction to summariser output | `packages/core/src/summariser.ts` | ⬜ |
| 6.3 | Build local keyword index — `~/.contextcarry/search-index.json` | `packages/core/src/indexer.ts` | ⬜ |
| 6.4 | Improve `ctx search` — use keyword index for fast lookup | `apps/cli/src/commands/search.ts` | ⬜ |
| 6.5 | Add auto-load on branch switch — watcher detects git checkout | `packages/core/src/watcher.ts` | ⬜ |
| 6.6 | Build context size budget — truncate preamble to token limit | `packages/core/src/injector.ts` | ⬜ |
| 6.7 | Add `ctx config set max-tokens <n>` command | `apps/cli/src/commands/config.ts` | ⬜ |
| 6.8 | Build session archiver — move old sessions to `archive/` | `packages/core/src/storage.ts` | ⬜ |
| 6.9 | Add `ctx stats` command — sessions saved, tokens compressed | `apps/cli/src/commands/stats.ts` | ⬜ |
| 6.10 | Add optional embedding support via Ollama (local) | `packages/core/src/embeddings.ts` | ⬜ |

---

## Phase 7: Testing Suite (Weeks 16-17)

**Goal**: Confidence to ship. Every critical path has a test.

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 7.1 | Set up Vitest config across all packages | `vitest.config.ts` (root), per-package configs | ⬜ |
| 7.2 | Write unit tests for `storage.ts` — read/write/archive | `packages/core/tests/storage.test.ts` | ⬜ |
| 7.3 | Write unit tests for `watcher.ts` — project + branch detection | `packages/core/tests/watcher.test.ts` | ⬜ |
| 7.4 | Write unit tests for `scorer.ts` — ranking logic | `packages/core/tests/scorer.test.ts` | ⬜ |
| 7.5 | Write unit tests for `injector.ts` — preamble formatting | `packages/core/tests/injector.test.ts` | ⬜ |
| 7.6 | Mock Anthropic API for summariser tests | `packages/core/tests/mocks/anthropic.ts` | ⬜ |
| 7.7 | Write unit tests for `summariser.ts` with mocked API | `packages/core/tests/summariser.test.ts` | ⬜ |
| 7.8 | Write integration tests for CLI commands | `apps/cli/tests/commands.test.ts` | ⬜ |
| 7.9 | Write integration test: full save → load → inject flow | `apps/cli/tests/e2e.test.ts` | ⬜ |
| 7.10 | Write MCP server tests — tool call in/out | `apps/mcp/tests/tools.test.ts` | ⬜ |
| 7.11 | Set up test coverage reporting | `.nycrc` or `vitest coverage` config | ⬜ |
| 7.12 | Add pre-commit hook — run tests before push | `.husky/pre-push` | ⬜ |

---

## Phase 8: DevOps + CI/CD (Weeks 18-19)

**Goal**: One-command install for users. Automated release pipeline for you.

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 8.1 | Set up GitHub Actions CI — test + lint on every PR | `.github/workflows/ci.yml` | ⬜ |
| 8.2 | Configure Turborepo remote cache for CI speed | `turbo.json`, `.github/workflows/ci.yml` | ⬜ |
| 8.3 | Set up automated npm publish on version tag | `.github/workflows/release.yml` | ⬜ |
| 8.4 | Configure `ctx` binary for npx one-line install | `apps/cli/package.json` (bin + publishConfig) | ⬜ |
| 8.5 | Write install script — `curl \| sh` for Mac/Linux | `scripts/install.sh` | ⬜ |
| 8.6 | Write Windows install script | `scripts/install.ps1` | ⬜ |
| 8.7 | Bundle CLI to single executable via `pkg` or `esbuild` | `apps/cli/package.json` (build script) | ⬜ |
| 8.8 | Set up Homebrew tap formula | `homebrew-contextcarry/Formula/ctx.rb` | ⬜ |
| 8.9 | Write README — quick start, all commands, integration guides | `README.md` | ⬜ |
| 8.10 | Write CONTRIBUTING guide | `CONTRIBUTING.md` | ⬜ |
| 8.11 | Set up GitHub releases with changelog | `.github/workflows/release.yml` | ⬜ |

---

## 📊 Total Progress

```
Phase 1  ████████████████████████   20/20   Core Engine + CLI ✓
Phase 2  █████████████████████████  13/13   Claude Code Plugin ✓
Phase 3  █████████░░░░░░░░░ 12/25  MCP Server
Phase 4  █████████████░░░░  8/13   VS Code Dashboard
Phase 5  ░░░░░░░░░░░░░░░░   0/16   Chrome Extension
Phase 6  ░░░░░░░░░░         0/10   Context Intelligence
Phase 7  ░░░░░░░░░░░░       0/12   Testing Suite
Phase 8  ░░░░░░░░░░░        0/11   DevOps + CI/CD
─────────────────────────────────────────────
Total    ██████████████████████████████░░░░   53/120  steps
```

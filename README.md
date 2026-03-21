# Context Carry

**Save your AI session context. Restore it anywhere.**

[![npm version](https://img.shields.io/npm/v/@thisisayande/contextcarry)](https://www.npmjs.com/package/@thisisayande/contextcarry)
[![license](https://img.shields.io/npm/l/@thisisayande/contextcarry)](./LICENSE)

---

## What is Context Carry?

Context Carry (`ctx`) is a CLI tool that compresses and saves your AI chat session context, then restores it as a preamble in a new conversation — so you never lose progress when a chat window resets.

It auto-detects your project and git branch, uses AI to summarize your session, and stores everything locally in `~/.contextcarry/`.

---

## Installation

```sh
npm install -g @thisisayande/contextcarry
```

Or run without installing:

```sh
npx @thisisayande/contextcarry --help
```

---

## Quick Start

```sh
# 1. Initialize config (sets up API key, default provider)
ctx init

# 2. Save your current session (paste or pipe transcript)
ctx save --stdin

# 3. Load context into your next chat
ctx load
```

---

## Commands Reference

### `ctx save`

Save and compress a session transcript.

| Flag | Description |
|------|-------------|
| `-s, --stdin` | Read transcript from stdin |
| `-a, --auto` | Silent mode (for hooks) |
| `-f, --file <path>` | Read transcript from file |
| `-o, --output <path>` | Custom output file path |
| `-p, --project <name>` | Override project name |
| `-b, --branch <name>` | Override branch name |
| `--provider <name>` | AI provider: `anthropic`, `openai`, `gemini`, `glm`, `grok` (default: `anthropic`) |
| `--api-key <key>` | API key override |
| `--model <name>` | AI model override |
| `--disable-summarization` | Save raw transcript, skip AI compression |

### `ctx load`

Load and display saved context.

| Flag | Description |
|------|-------------|
| `-i, --inject` | Output as injectable preamble (for hooks) |
| `-s, --session <id>` | Load specific session by ID |
| `-f, --format <type>` | `raw`, `preamble`, `json` (default: `preamble`) |
| `-p, --project <name>` | Override project name |
| `-b, --branch <name>` | Override branch name |
| `--max-tokens <n>` | Max tokens for output (default: `8192`) |

### `ctx list` (alias: `ctx ls`)

List saved sessions.

| Flag | Description |
|------|-------------|
| `-p, --project <name>` | Filter by project |
| `-b, --branch <name>` | Filter by branch |
| `-l, --limit <n>` | Limit results |
| `-f, --format <type>` | `table` or `json` (default: `table`) |

### `ctx search <query>` (alias: `ctx grep <query>`)

Search across saved sessions.

| Flag | Description |
|------|-------------|
| `-p, --project <name>` | Filter by project |
| `-b, --branch <name>` | Filter by branch |
| `-l, --limit <n>` | Limit results |
| `--case-sensitive` | Case-sensitive search |

### `ctx status`

Show current context status.

| Flag | Description |
|------|-------------|
| `-j, --json` | Output as JSON |

### `ctx clear`

Clear saved sessions.

| Flag | Description |
|------|-------------|
| `-a, --all` | Clear all sessions for current project |
| `-s, --session <id>` | Clear specific session by ID |
| `-b, --branch <branch>` | Target branch (default: current) |
| `-y, --yes` | Skip confirmation prompt |

### `ctx init`

Initialize configuration.

| Flag | Description |
|------|-------------|
| `-f, --force` | Force overwrite existing config |
| `-s, --skip-hooks` | Skip hook installation |

---

## Storage Layout

Sessions are stored locally under `~/.contextcarry/`:

```
~/.contextcarry/
├── README.md               # Auto-generated
├── index.md                # Session registry
├── config.json             # User configuration
└── <project>/
    └── <branch>/
        ├── LATEST.md       # Most recent session
        └── <id>-<ts>.md    # Archived sessions
```

---

## AI Providers

Context Carry supports multiple AI providers for session summarization.

| Provider | Env Var | Default Model |
|----------|---------|---------------|
| `anthropic` | `ANTHROPIC_API_KEY` | `claude-sonnet-4-6` |
| `openai` | `OPENAI_API_KEY` | `gpt-4o` |
| `gemini` | `GEMINI_API_KEY` | `gemini-2.5-pro` |
| `glm` | `GLM_API_KEY` | `glm-4-plus` |
| `grok` | `GROK_API_KEY` | `grok-beta` |

Set the relevant environment variable or pass `--api-key` at runtime.

---

## Roadmap

See [`apps/docs/implementation_plan.md`](./apps/docs/implementation_plan.md) for the full roadmap, including:

- Claude Code Plugin (hooks, auto-save/inject)
- MCP Server
- VS Code Extension
- Chrome Extension
- Context Intelligence (semantic scoring)

---

## Contributing

1. Clone the repo and install dependencies: `pnpm install`
2. Build all packages: `pnpm build`
3. Link CLI for local testing: `cd apps/cli && pnpm link --global`
4. Run `ctx --help` to verify

PRs and issues welcome.

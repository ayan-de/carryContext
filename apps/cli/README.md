# @contextcarry/cli

> Never lose context across AI chat sessions. Save, restore, and search your conversation history.

**Context Carry** is a CLI tool that saves your AI session context and restores it across new chats. Perfect for developers who work with Claude, ChatGPT, Gemini, or any AI assistant and want to maintain continuity between sessions.

## Quick Start

```bash
# Install globally
npm install -g @contextcarry/cli

# Or use with npx (no install required)
npx @contextcarry/cli --help
```

```bash
# Save your current session context
ctx save

# Load context in a new session
ctx load

# See what's saved
ctx status
```

## Why Context Carry?

- **Never repeat yourself** - Stop re-explaining your project to AI assistants
- **Branch-aware** - Automatically tracks different contexts per git branch
- **Smart compression** - AI-powered summarization compresses hours of work into concise context
- **Search everything** - Find any past session instantly
- **Works offline** - All data stored locally in `~/.contextcarry/`

## Installation

### npm
```bash
npm install -g @contextcarry/cli
```

### pnpm
```bash
pnpm add -g @contextcarry/cli
```

### yarn
```bash
yarn global add @contextcarry/cli
```

## Commands

### `ctx save`

Save your current session context. The CLI detects your project name and git branch automatically.

```bash
# Basic save (interactive)
ctx save

# Read transcript from stdin (for automation)
cat session.txt | ctx save --stdin

# Read from file
ctx save --file ./transcript.txt

# Silent mode (for hooks/scripts)
ctx save --auto --stdin

# Skip AI summarization
ctx save --disable-summarization
```

**Options:**
| Flag | Alias | Description |
|------|-------|-------------|
| `--stdin` | `-s` | Read transcript from stdin |
| `--auto` | `-a` | Silent mode, no output (for hooks) |
| `--file <path>` | `-f` | Read transcript from file |
| `--project <name>` | `-p` | Override project name |
| `--branch <name>` | `-b` | Override branch name |
| `--provider <name>` | | AI provider: `anthropic`, `openai`, `gemini`, `glm`, `grok` |
| `--api-key <key>` | | API key (or use env vars) |
| `--model <name>` | | AI model to use |
| `--disable-summarization` | | Save raw transcript without compression |

---

### `ctx load`

Load and display saved session context for your current project/branch.

```bash
# Load latest context
ctx load

# Load specific session by ID
ctx load --session abc123

# Output as injectable preamble (for hooks)
ctx load --inject

# Output as JSON
ctx load --format json

# Override project/branch
ctx load --project myapp --branch feature/auth
```

**Options:**
| Flag | Alias | Description |
|------|-------|-------------|
| `--inject` | `-i` | Output as injectable preamble (for hooks) |
| `--session <id>` | `-s` | Load specific session by ID |
| `--format <type>` | `-f` | Output format: `raw`, `preamble`, `json` |
| `--project <name>` | `-p` | Override project name |
| `--branch <name>` | `-b` | Override branch name |
| `--max-tokens <n>` | | Maximum tokens for output (default: 8192) |

---

### `ctx list` (alias: `ctx ls`)

List all saved sessions across all projects.

```bash
# List all sessions
ctx list

# Filter by project
ctx list --project myapp

# Filter by branch
ctx list --branch main

# Limit results
ctx list --limit 10

# Output as JSON
ctx list --format json
```

**Options:**
| Flag | Alias | Description |
|------|-------|-------------|
| `--project <name>` | `-p` | Filter by project name |
| `--branch <name>` | `-b` | Filter by branch |
| `--limit <n>` | `-l` | Limit number of results |
| `--format <type>` | `-f` | Output format: `table`, `json` |

---

### `ctx search` (alias: `ctx grep`)

Search across all saved sessions.

```bash
# Search for keyword
ctx search "authentication"

# Case-sensitive search
ctx search "API" --case-sensitive

# Filter by project
ctx search "bug" --project myapp

# Limit results
ctx search "error" --limit 5
```

**Options:**
| Flag | Alias | Description |
|------|-------|-------------|
| `--project <name>` | `-p` | Filter by project name |
| `--branch <name>` | `-b` | Filter by branch |
| `--limit <n>` | `-l` | Limit number of results |
| `--case-sensitive` | `-c` | Enable case-sensitive search |

---

### `ctx status`

Show current project info and context status.

```bash
# Show status
ctx status

# Output as JSON
ctx status --json
```

**Options:**
| Flag | Alias | Description |
|------|-------|-------------|
| `--json` | `-j` | Output as JSON |

---

### `ctx clear`

Clear saved context with confirmation prompt.

```bash
# Clear current branch context
ctx clear

# Clear all sessions for current project
ctx clear --all

# Clear specific session by ID
ctx clear --session abc123

# Clear specific branch
ctx clear --branch feature/old

# Skip confirmation prompt
ctx clear --yes
```

**Options:**
| Flag | Alias | Description |
|------|-------|-------------|
| `--all` | `-a` | Clear all sessions for current project |
| `--session <id>` | `-s` | Clear specific session by ID |
| `--branch <name>` | `-b` | Clear context for specific branch |
| `--yes` | `-y` | Skip confirmation prompt |

---

### `ctx init`

Initialize Context Carry configuration.

```bash
ctx init
```

**Options:**
| Flag | Alias | Description |
|------|-------|-------------|
| `--force` | `-f` | Force overwrite existing configuration |
| `--skip-hooks` | `-s` | Skip hook installation |

---

### `ctx --help`

Show help for all commands.

```bash
ctx --help
ctx save --help
ctx load --help
```

## Environment Variables

Context Carry supports multiple AI providers. Set the appropriate API key:

```bash
# Anthropic (default)
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
OPENAI_API_KEY=sk-...

# Google Gemini
GEMINI_API_KEY=...

# GLM (Zhipu AI)
GLM_API_KEY=...

# Grok (xAI)
GROK_API_KEY=...
```

## Storage

All data is stored locally in `~/.contextcarry/`:

```
~/.contextcarry/
├── README.md           # Auto-generated documentation
├── index.md            # Session registry (YAML frontmatter)
├── config.json         # User configuration
└── <project>/
    └── <branch>/
        ├── LATEST.md   # Most recent session
        └── <id>-<ts>.md # Archived sessions
```

## Workflow Examples

### Daily Development

```bash
# Morning: Start working on a feature
cd ~/projects/myapp
git checkout feature/auth

# End of day: Save your context
ctx save

# Next morning: Load context and continue
ctx load
# Paste the output into your AI chat
```

### Multiple Projects

```bash
# Project A
cd ~/projects/frontend
ctx save

# Project B
cd ~/projects/backend
ctx save

# Later: List all sessions
ctx list
# Filter to specific project
ctx list --project frontend
```

### Searching History

```bash
# Find all sessions mentioning "authentication"
ctx search "authentication"

# Find bug-related sessions in a specific project
ctx search "bug" --project myapp

# Load a specific session found via search
ctx load --session abc123
```

### Integration with Hooks (Phase 2)

```bash
# Auto-save when Claude Code stops
# (requires Phase 2 setup)
ctx save --auto --stdin

# Auto-inject context on new chat
# (requires Phase 2 setup)
ctx load --inject
```

## API Provider Selection

Choose your preferred AI provider for summarization:

```bash
# Use Anthropic (default)
ctx save --provider anthropic

# Use OpenAI
ctx save --provider openai --model gpt-4o

# Use Gemini
ctx save --provider gemini --model gemini-2.5-pro

# Use GLM
ctx save --provider glm --model glm-4-plus

# Use Grok
ctx save --provider grok --model grok-beta
```

## Tips

1. **Save frequently** - Run `ctx save` at natural breakpoints (end of task, before switching branches)
2. **Use descriptive transcripts** - The better your input, the better the AI summary
3. **Search before creating** - Check `ctx search` to see if you've solved a similar problem before
4. **Branch awareness** - Context is tracked per branch, so switching branches loads the right context
5. **Export for sharing** - Use `ctx load --format json` to export context for documentation

## Requirements

- Node.js >= 18
- An API key for at least one supported AI provider

## License

MIT

## Links

- [GitHub Repository](https://github.com/contextcarry/contextcarry)
- [Report Issues](https://github.com/contextcarry/contextcarry/issues)

---

**Built with care by the Context Carry team. Never lose context again.**

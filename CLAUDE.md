# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Context Carry is a CLI tool that saves AI session context and restores it across new chats. The `ctx` binary allows users to save, load, and search session contexts stored as markdown files with YAML frontmatter.

## Commands

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter=@contextcarry/core
pnpm build --filter=@contextcarry/cli

# Lint
pnpm lint

# Type check
pnpm check-types

# Link CLI globally for testing
cd apps/cli && pnpm link --global

# Run CLI
ctx --help
ctx save --help
ctx load --help
```

## Architecture

### Monorepo Structure

```
apps/
  cli/          # Commander-based CLI (@contextcarry/cli)
  docs/         # Implementation plan and docs
  web/          # Future web app
packages/
  core/         # Core business logic (@contextcarry/core)
  types/        # Shared TypeScript interfaces (@contextcarry/types)
  ui/           # Shared UI components
  eslint-config/
  typescript-config/
```

### Core Package Flow

```
ctx save
  → watcher.ts (detect project + git branch)
    → summariser.ts (AI compression via IProvider)
      → storage.ts (write LATEST.md + archive)
        → index.md (session registry updated)

ctx load
  → storage.ts (read LATEST.md)
    → injector.ts (format as preamble)
      → stdout (paste into AI chat)
```

### Key Modules (packages/core/src/)

- **watcher.ts** - Project name + git branch detection
- **storage.ts** - File I/O with gray-matter frontmatter, session registry management
- **summariser.ts** - AI-powered session compression
- **injector.ts** - Format sessions as context preambles
- **scorer.ts** - Rank sessions by relevance
- **config.ts** - Config.json schema + reader with validation
- **provider-factory.ts** - Registry-based factory for AI providers
- **interfaces/provider.ts** - IProvider abstraction (DIP)

### AI Provider Pattern

Providers implement `IProvider` interface. Factory pattern with registry allows adding new providers without modifying existing code:

```typescript
// Create provider
const provider = createProvider({ provider: AIProvider.ANTHROPIC, apiKey: '...' });

// Use via interface
const result = await provider.summarize(transcript);
```

Supported providers: Anthropic, OpenAI, Gemini, GLM, Grok

### Storage Layout (~/.contextcarry/)

```
~/.contextcarry/
├── README.md           # Auto-generated
├── index.md            # Session registry (gray-matter)
├── config.json         # User configuration
└── <project>/
    └── <branch>/
        ├── LATEST.md   # Most recent session
        └── <id>-<ts>.md # Archived sessions
```

### CLI Commands (apps/cli/src/commands/)

- `save.ts` - Save session context
- `load.ts` - Load and display context
- `list.ts` / `ls` - List sessions
- `search.ts` / `grep` - Search across sessions
- `status.ts` - Show current context status
- `clear.ts` - Clear saved context
- `init.ts` - Initialize configuration

## Implementation Status

Phase 1 (Core Engine + CLI) is complete. See `apps/docs/implementation_plan.md` for full roadmap.

Remaining phases:
- Phase 2: Claude Code Plugin (hooks, auto-save/inject)
- Phase 3: MCP Server
- Phase 4: Editor Plugins (VS Code)
- Phase 5: Chrome Extension
- Phase 6: Context Intelligence
- Phase 7: Testing Suite
- Phase 8: DevOps + CI/CD

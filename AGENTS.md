# AGENTS.md

Guidance for agentic coding agents working in this repository.

## Build Commands

```bash
# Install dependencies
pnpm install

# Build all packages (uses Turborepo, respects dependency graph)
pnpm build

# Build a specific package
pnpm build --filter=contextcarry-core
pnpm build --filter=@thisisayande/contextcarry

# Type check all packages
pnpm check-types

# Lint all packages
pnpm lint

# Format all files with Prettier
pnpm format
```

### Testing

Tests use **Vitest**. Each testable package has `"test": "vitest"` in its `package.json`.

```bash
# Run all tests across the monorepo
pnpm -r test

# Run tests for a single package
pnpm --filter contextcarry-core test

# Run a single test file
pnpm --filter contextcarry-core vitest run src/__tests__/storage.test.ts

# Run tests in watch mode
pnpm --filter contextcarry-core vitest
```

> After making changes, always run `pnpm build`, `pnpm lint`, and `pnpm check-types` to verify correctness.

## Project Overview

Context Carry is a CLI tool (`ctx`) that saves AI session context and restores it across new chats. It's a pnpm monorepo using Turborepo.

### Monorepo Layout

```
apps/
  cli/          # Commander-based CLI binary (ctx)
  mcp/          # MCP server
  vscode/       # VS Code extension
  web/          # Web app
packages/
  core/         # Core logic: storage, summarizer, watcher, scorer, providers
  types/        # Shared TypeScript interfaces and enums
  ui/           # Shared UI components
  eslint-config/    # Shared ESLint flat config
  typescript-config/ # Shared tsconfig bases
```

### Data Flow

```
ctx save → watcher (detect project+branch) → summarizer (AI compress) → storage (write .md)
ctx load → storage (read LATEST.md) → injector (format preamble) → stdout
```

## Code Style Guidelines

### TypeScript Configuration

- **Target**: ES2022, **Module**: NodeNext, **ModuleResolution**: NodeNext
- **Strict mode** is enabled with `noUncheckedIndexedAccess`
- All packages use `"type": "module"` (ESM)
- Generate declaration files (`declaration: true`, `declarationMap: true`)

### Imports

- Use `node:` prefix for Node.js built-ins: `import { readFile } from 'node:fs/promises'`
- Use `.js` extension for relative imports within the same package: `import { foo } from './bar.js'`
- Use workspace package names for cross-package imports: `import type { Session } from 'contextcarry-types'`
- Use `import type` for type-only imports
- Group imports: Node built-ins → external packages → internal packages → relative files

```typescript
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { Session, AppConfig } from "contextcarry-types";
import { ContextCarryError, ErrorCode } from "contextcarry-types";

import type { IProvider } from "./interfaces/provider.js";
import { createProvider } from "./provider-factory.js";
```

### Formatting

- Prettier is the formatter (no `.prettierrc` file — uses defaults: 2-space indent, single quotes, trailing commas)
- ESLint with `eslint-config-prettier` disables formatting rules (no conflicts)
- All ESLint rules are downgraded to warnings via `eslint-plugin-only-warn`

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `provider-factory.ts`, `anthropic-provider.ts`)
- **Interfaces**: `PascalCase` with `I` prefix for abstractions (`IProvider`), plain PascalCase for data types (`Session`, `AppConfig`)
- **Classes**: `PascalCase` (e.g., `AnthropicProvider`, `ContextCarryError`)
- **Functions**: `camelCase` (e.g., `saveSession`, `detectProject`, `createProvider`)
- **Constants**: `UPPER_SNAKE_CASE` for module-level constants (`DEFAULT_STORAGE_CONFIG`, `CONFIG_VERSION`)
- **Enums**: `PascalCase` names, `UPPER_SNAKE_CASE` values (`AIProvider.ANTHROPIC`)
- **Types**: `PascalCase` with descriptive suffixes (`ScoringWeights`, `RegistryEntry`, `SaveOptions`)

### Error Handling

- Use the custom `ContextCarryError` class from `contextcarry-types` with `ErrorCode` enum
- Throw `ContextCarryError` for domain errors:
  ```typescript
  throw new ContextCarryError("message", ErrorCode.CONFIG_INVALID, {
    path: configPath,
  });
  ```
- Use `try/catch` without binding for expected failures: `catch { return null; }`
- Always check `error instanceof Error` before accessing `.message`
- Silent catch blocks are acceptable for non-critical operations (cleanup, polling)

### Architecture Patterns

- **SOLID principles**: Provider pattern uses Dependency Inversion (`IProvider` interface), Open/Closed (registry factory)
- **Provider Factory**: New AI providers register via the registry — no switch statements. Add provider class implementing `IProvider`, register in `provider-factory.ts`
- **Module structure**: Each module in `packages/core/src/` is a self-contained unit with exported async functions
- **Storage format**: Markdown files with YAML frontmatter via `gray-matter`
- **CLI commands**: Each command is a separate file in `apps/cli/src/commands/` exporting a Commander `Command` instance
- **No comments in code** unless explicitly asked

### Type Patterns

- Use `type` for object shapes, `interface` for contracts and class implementations
- Use `Record<string, unknown>` for frontmatter data
- Optional properties use `?` suffix (e.g., `apiKey?: string`)
- Use `as const` for typed tuples in validation logic
- Non-null assertions with `!` only after explicit length checks: `entries[0]!`

### Package Exports

- Each package re-exports from `src/index.ts` using `export * from './module.js'`
- `package.json` uses `exports` map with `types` and `import` conditions
- Cross-package references use `workspace:*` protocol

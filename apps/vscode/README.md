# Context Carry for VS Code

**Save and restore AI session context across chats** — a visual dashboard for [Context Carry](https://github.com/thisisayande/carryContext) inside VS Code.

![VS Code](https://img.shields.io/badge/VS%20Code-1.85+-blue?logo=visual-studio-code)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What is Context Carry?

When you start a new AI chat (Claude, ChatGPT, Gemini, etc.), you lose all prior context. Context Carry fixes this by saving compressed session summaries and letting you inject them into new conversations — so the AI picks up right where you left off.

This extension brings the full Context Carry experience into VS Code with a sidebar dashboard.

## Features

### Session Dashboard

Browse all your saved sessions organized by **Project > Branch > Session** in a collapsible tree view, accessible from the Activity Bar.

- View session summaries, timestamps, and IDs at a glance
- Click any session to open it in the editor
- Hover to reveal quick actions

### Search

Real-time search across project names, branch names, and session summaries. Results filter as you type with auto-expanding matches.

### Session Comparison

Compare any two sessions side-by-side using VS Code's built-in diff viewer. Useful for tracking how your project context evolves over time.

### AI Provider Configuration

Switch between AI providers and models directly from the extension footer — no config files needed.

Supported providers:
- **Anthropic** — Claude Sonnet, Haiku, Opus
- **OpenAI** — GPT-4o, GPT-4 Turbo, o1
- **Google Gemini** — 2.0 Flash/Pro, 1.5 Flash/Pro
- **GLM** — GLM-4.5, GLM-4 Plus/Flash
- **Grok** — Grok 3, Grok 3 Mini, Grok 2

### Status Bar

Shows your active AI provider and model at the bottom of the editor.

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type "Context Carry":

| Command | Description |
|---------|-------------|
| **Context Carry: Load Context** | Load saved context into your chat |
| **Context Carry: Save Current Session** | Save the current session |
| **Context Carry: Refresh Sessions** | Refresh the sessions panel |
| **Context Carry: Search Sessions** | Search across all sessions |
| **Context Carry: Delete Session** | Delete a session |
| **Context Carry: Compare Sessions** | Diff two sessions side-by-side |

## Getting Started

1. Install the extension
2. Open the **Context Carry** panel from the Activity Bar (bookmark icon)
3. If you haven't used Context Carry before, install the CLI:
   ```bash
   npm install -g @contextcarry/cli
   ```
4. Save your first session from the terminal:
   ```bash
   ctx save
   ```
5. Your sessions will appear in the VS Code sidebar

## Requirements

- VS Code 1.85 or later
- [Context Carry CLI](https://github.com/thisisayande/carryContext) (`ctx`) installed for saving/loading sessions
- An API key for at least one supported AI provider

## How It Works

Context Carry stores sessions as markdown files with YAML frontmatter in `~/.contextcarry/`, organized by project and git branch:

```
~/.contextcarry/
├── config.json
├── index.md
└── my-project/
    └── main/
        ├── LATEST.md
        └── abc123-1711234567.md
```

The extension reads this storage directory and presents it as an interactive dashboard.

## License

MIT

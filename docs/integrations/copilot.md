# GitHub Copilot Chat Integration (VS Code)

## Setup

### Option 1: Workspace-level (recommended)

Create `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "contextcarry": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@thisisayande/contextcarry-mcp"]
    }
  }
}
```

### Option 2: User-level (global)

Add to your VS Code `settings.json` (`Ctrl+Shift+P` > "Preferences: Open User Settings (JSON)"):

```json
{
  "mcp": {
    "servers": {
      "contextcarry": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@thisisayande/contextcarry-mcp"]
      }
    }
  }
}
```

## Available Tools

Once connected, Copilot has access to these tools:

| Tool | Description |
|------|-------------|
| `save_context` | Save session transcript (with optional AI summarisation) |
| `load_context` | Load the latest saved context for current project/branch |
| `list_sessions` | List all saved sessions, filterable by project/branch |
| `search_context` | Search across sessions by keyword |
| `get_status` | Show current project, branch, and session info |
| `clear_context` | Clear saved context (requires `confirm: true`) |
| `delete_session` | Delete a specific session by ID |

## Usage

After configuring, Copilot can use Context Carry tools in Agent mode. For example:

- **Start of session**: Copilot calls `load_context` to pick up where you left off
- **End of session**: Copilot calls `save_context` with the session transcript
- **Finding past work**: Copilot calls `search_context` with a keyword

## Verify Connection

1. Open the Command Palette (`Ctrl+Shift+P`) and run **"MCP: List Servers"**
2. The `contextcarry` server should appear in the list
3. Open Copilot Chat in Agent mode and ask: "What's my current context carry status?" — it should call `get_status`

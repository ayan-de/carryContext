# Claude Desktop Integration

## Setup

Add the following to your Claude Desktop MCP config:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "contextcarry": {
      "command": "npx",
      "args": ["-y", "@thisisayande/contextcarry-mcp"]
    }
  }
}
```

> **Note**: After saving the config, completely quit and restart Claude Desktop for changes to take effect.

## Available Tools

Once connected, Claude has access to these tools:

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

After configuring, Claude can use Context Carry tools automatically. For example:

- **Start of session**: Claude calls `load_context` to pick up where you left off
- **End of session**: Claude calls `save_context` with the session transcript
- **Finding past work**: Claude calls `search_context` with a keyword

## Verify Connection

1. Open Claude Desktop and start a new conversation
2. Look for the hammer icon indicating MCP tools are available
3. Ask Claude: "What's my current context carry status?" — it should call `get_status`

# Windsurf Integration

## Setup

Add the following to your Windsurf MCP config (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "contextcarry": {
      "command": "npx",
      "args": ["-y", "contextcarry-mcp"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

Replace `/path/to/your/project` with your actual project directory, or omit `cwd` if Windsurf spawns the server from the workspace root.

## Available Tools

Once connected, Cascade has access to these tools:

| Tool | Description |
|------|-------------|
| `save_context` | Save session transcript (with optional AI summarisation) |
| `load_context` | Load the latest saved context for current project/branch |
| `list_sessions` | List all saved sessions, filterable by project/branch |
| `search_context` | Search across sessions by keyword |
| `get_status` | Show current project, branch, and session info |
| `clear_context` | Clear saved context (requires `confirm: true`) |
| `delete_session` | Delete a specific session by ID |

## Verify Connection

1. Open Windsurf and check the MCP server status in settings
2. The `contextcarry` server should show as connected
3. Ask Cascade: "What's my current context carry status?" — it should call `get_status`

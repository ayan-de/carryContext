# Continue Integration

## Setup

Add the following to your Continue config (`~/.continue/config.json`):

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["-y", "contextcarry-mcp"]
        }
      }
    ]
  }
}
```

Continue spawns the MCP server from the workspace root by default.

## Available Tools

Once connected, Continue has access to these tools:

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

1. Open Continue in VS Code
2. Check that the MCP server is connected in settings
3. Ask: "What's my current context carry status?" — it should call `get_status`

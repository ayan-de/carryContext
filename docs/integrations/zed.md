# Zed Integration

## Setup

Add the following to your Zed settings (`~/.config/zed/settings.json`):

```json
{
  "context_servers": {
    "contextcarry": {
      "command": {
        "path": "npx",
        "args": ["-y", "@thisisayande/contextcarry-mcp"]
      }
    }
  }
}
```

Zed spawns the MCP server from the workspace root by default, so `cwd` is typically not needed.

## Available Tools

Once connected, Zed's assistant has access to these tools:

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

1. Open Zed settings and check that the context server is listed
2. Open the assistant panel
3. Ask: "What's my current context carry status?" — it should call `get_status`

# Roo Code Integration

## Setup

Add the following to your Roo Code MCP settings (VS Code: `Roo Code > Settings > MCP Servers`):

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

## Available Tools

Once connected, Roo Code has access to these tools:

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

1. Open Roo Code settings in VS Code
2. Check that `contextcarry` appears in the MCP servers list
3. Ask: "What's my current context carry status?" — it should call `get_status`

# Cursor Integration

## Setup

Add the following to your Cursor MCP config (`.cursor/mcp.json` in your project root, or global settings):

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

Replace `/path/to/your/project` with your actual project directory, or omit `cwd` if you always open Cursor from the project root.

## Available Tools

Once connected, the agent has access to these tools:

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

After configuring, the agent can use Context Carry tools automatically. For example:

- **Start of session**: The agent calls `load_context` to pick up where you left off
- **End of session**: The agent calls `save_context` with the session transcript
- **Finding past work**: The agent calls `search_context` with a keyword

## Verify Connection

1. Open Cursor settings and check MCP server status
2. The `contextcarry` server should show as connected
3. Ask the agent: "What's my current context carry status?" — it should call `get_status`

# Amazon Q Developer Integration

## Setup

Add the following to your Amazon Q MCP config:

- **Global** (all projects): `~/.aws/amazonq/mcp.json`
- **Workspace** (current project): `.amazonq/mcp.json`

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

Both global and workspace configs are optional. If both exist, Amazon Q combines them.

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

1. Open Amazon Q Developer in your IDE or CLI
2. Check that the `contextcarry` MCP server is connected
3. Ask the agent: "What's my current context carry status?" — it should call `get_status`

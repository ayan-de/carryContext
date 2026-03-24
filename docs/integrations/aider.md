# Aider Integration

> **Note**: Aider does not natively support MCP servers yet ([tracking issue](https://github.com/Aider-AI/aider/issues/3314)). The workaround below uses a community-built bridge.

## Setup (via mcpm-aider)

[mcpm-aider](https://github.com/lutzleonhardt/mcpm-aider) is a third-party tool that bridges MCP servers to Aider.

### 1. Install mcpm-aider

```bash
pip install mcpm-aider
```

### 2. Add Context Carry as an MCP server

```bash
mcpm-aider add contextcarry --command "npx -y @thisisayande/contextcarry-mcp"
```

### 3. Run Aider with MCP tools

```bash
mcpm-aider run -- aider
```

## Available Tools

Once connected via the bridge, Aider has access to these tools:

| Tool | Description |
|------|-------------|
| `save_context` | Save session transcript (with optional AI summarisation) |
| `load_context` | Load the latest saved context for current project/branch |
| `list_sessions` | List all saved sessions, filterable by project/branch |
| `search_context` | Search across sessions by keyword |
| `get_status` | Show current project, branch, and session info |
| `clear_context` | Clear saved context (requires `confirm: true`) |
| `delete_session` | Delete a specific session by ID |

## Alternative: AiderDesk

[AiderDesk](https://www.hotovo.com/blog/how-mcp-servers-gave-birth-to-aiderdesks-agent-mode) is a desktop app built on top of Aider that has native MCP support. If you use AiderDesk, you can configure Context Carry directly in its MCP settings.

## Native Support

Native MCP support for Aider is being tracked in:
- [Issue #3314](https://github.com/Aider-AI/aider/issues/3314) — original MCP feature request
- [Issue #4506](https://github.com/aider-ai/aider/issues/4506) — native MCP + agent mode request
- [PR #3672](https://github.com/Aider-AI/aider/pull/3672) — unmerged MCP implementation

This doc will be updated when native support lands.

/**
 * MCP Command - Start the Context Carry MCP server
 *
 * Spawns the MCP server process (apps/mcp) using stdio transport.
 * Editors can also run `npx contextcarry-mcp` directly, but this
 * command lets users start it from the CLI: `ctx mcp`
 */

import { Command } from 'commander';
import { fork } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const mcpCommand = new Command('mcp')
  .description('Start the Context Carry MCP server (stdio transport)')
  .action(async () => {
    // Resolve the MCP server entry point from the sibling package
    let mcpEntry: string;

    try {
      const require = createRequire(import.meta.url);
      mcpEntry = require.resolve('@thisisayande/contextcarry-mcp');
    } catch {
      // Fallback: resolve relative to this package in the monorepo
      const __dirname = dirname(fileURLToPath(import.meta.url));
      mcpEntry = resolve(__dirname, '..', '..', '..', 'mcp', 'dist', 'index.js');
    }

    // Fork the MCP server, piping stdin/stdout through so the editor
    // can communicate with it via stdio transport.
    const child = fork(mcpEntry, [], {
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    });

    child.on('error', (err) => {
      process.stderr.write(`MCP server error: ${err.message}\n`);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code ?? 0);
    });
  });

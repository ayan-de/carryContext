#!/usr/bin/env node

/**
 * Context Carry CLI - Command Line Interface
 *
 * Main entry point for the ctx command
 */

import { Command } from 'commander';
import chalk from 'chalk';
import packageJson from '../package.json' with { type: 'json' };
import { saveCommand } from './commands/save.js';
import { loadCommand } from './commands/load.js';
import { listCommand } from './commands/list.js';
import { searchCommand } from './commands/search.js';
import { statusCommand } from './commands/status.js';
import { clearCommand } from './commands/clear.js';
import { initCommand } from './commands/init.js';
import { hookCommand } from './commands/hook.js';
import { configCommand } from './commands/config.js';
import { mcpCommand } from './commands/mcp.js';
import { initializeStorage, DEFAULT_STORAGE_CONFIG, configExists } from 'contextcarry-core';
import { runProviderSetup } from './commands/init.js';

const program = new Command();

program
  .name('ctx')
  .description('Context Carry - Save and restore AI session context across chats')
  .version(packageJson.version);

// Register commands
program.addCommand(saveCommand);
program.addCommand(loadCommand);
program.addCommand(listCommand);
program.addCommand(searchCommand);
program.addCommand(statusCommand);
program.addCommand(clearCommand);
program.addCommand(initCommand);
program.addCommand(hookCommand);
program.addCommand(configCommand);
program.addCommand(mcpCommand);

// Bootstrap storage + auto-init on first run
program.hook('preAction', async (thisCommand, actionCommand) => {
  await initializeStorage(DEFAULT_STORAGE_CONFIG);

  // Skip auto-init for hook command (called by Claude Code non-interactively)
  const isHookCmd = actionCommand.name() === 'hook';
  const isInitCmd = actionCommand.name() === 'init';

  if (!isHookCmd && !isInitCmd) {
    const hasConfig = await configExists(DEFAULT_STORAGE_CONFIG.dataDir);
    const hasProvider = await configExists(DEFAULT_STORAGE_CONFIG.dataDir).then(async (exists) => {
      if (!exists) return false;
      const { loadConfig } = await import('contextcarry-core');
      const cfg = await loadConfig(DEFAULT_STORAGE_CONFIG.dataDir);
      return !!cfg.defaultProvider;
    });

    if (!hasProvider) {
      console.log(chalk.bold('\nWelcome to Context Carry!'));
      console.log(chalk.gray('First-time setup — this only runs once.\n'));
      await runProviderSetup();
      console.log('');
    }
  }
});

// Handle uncaught errors
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s'), program.args.join(' '));
  console.log('Run %s --help for a list of available commands.', chalk.yellow('ctx --help'));
  process.exit(1);
});

program.parseAsync(process.argv);

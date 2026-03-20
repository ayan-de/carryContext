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
import { initializeStorage, DEFAULT_STORAGE_CONFIG } from '@contextcarry/core';

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

// Bootstrap storage directory on first run before any command executes
program.hook('preAction', async () => {
  await initializeStorage(DEFAULT_STORAGE_CONFIG);
});

// Handle uncaught errors
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s'), program.args.join(' '));
  console.log('Run %s --help for a list of available commands.', chalk.yellow('ctx --help'));
  process.exit(1);
});

program.parseAsync(process.argv);

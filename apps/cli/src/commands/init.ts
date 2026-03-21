/**
 * Init Command - Initialize Context Carry configuration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  initializeStorage,
  DEFAULT_STORAGE_CONFIG,
  saveConfig,
  DEFAULT_CONFIG,
  configExists,
} from 'contextcarry-core';

export const initCommand = new Command('init')
  .description('Initialize Context Carry configuration')
  .option('-f, --force', 'Force overwrite existing configuration')
  .option('-s, --skip-hooks', 'Skip hook installation')
  .action(async (options) => {
    const spinner = ora('Initializing Context Carry...').start();

    try {
      // Create ~/.contextcarry/ directory, README.md, index.md
      await initializeStorage(DEFAULT_STORAGE_CONFIG);

      // Write config.json (skip if exists and --force not set)
      const alreadyExists = await configExists(DEFAULT_STORAGE_CONFIG.dataDir);
      if (alreadyExists && !options.force) {
        spinner.warn(chalk.yellow('Config already exists. Use --force to overwrite.'));
      } else {
        await saveConfig(DEFAULT_CONFIG);
        spinner.succeed(chalk.green('Context Carry initialized'));
      }

      console.log(chalk.gray('\nStorage: ') + chalk.white(DEFAULT_STORAGE_CONFIG.dataDir));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.white('  1. Set your API key: export ANTHROPIC_API_KEY=<key>'));
      console.log(chalk.white('  2. Save context:     ctx save --stdin'));
      console.log(chalk.white('  3. Load context:     ctx load'));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to initialize: ${error}`));
      process.exit(1);
    }
  });

/**
 * Load Command - Load and display session context
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  detectProject,
  loadSession,
  loadSessionById,
  DEFAULT_STORAGE_CONFIG,
} from '@contextcarry/core';
import { formatPreamble } from '@contextcarry/core';

interface LoadCommandOptions {
  inject?: boolean;
  session?: string;
  format?: string;
  project?: string;
  branch?: string;
  maxTokens?: string;
}

export const loadCommand = new Command('load')
  .description('Load and display saved session context')
  .option('-i, --inject', 'Output as injectable preamble (for hooks)')
  .option('-s, --session <id>', 'Load specific session by ID')
  .option('-f, --format <type>', 'Output format: raw, preamble, json', 'preamble')
  .option('-p, --project <name>', 'Project name override')
  .option('-b, --branch <name>', 'Branch name override')
  .option('--max-tokens <number>', 'Maximum tokens for output', '8192')
  .action(async (options: LoadCommandOptions) => {
    const spinner = ora('Loading context...').start();

    try {
      // Detect project info
      let projectInfo;
      try {
        projectInfo = await detectProject();
      } catch (error) {
        spinner?.warn(chalk.yellow('Could not detect project info'));
        projectInfo = {
          name: options.project || 'unknown-project',
          rootPath: process.cwd(),
          branch: options.branch || 'no-branch',
        };
      }

      // Override with command options
      const projectName = options.project || projectInfo.name;
      const branchName = options.branch || projectInfo.branch;

      spinner.text = `Loading context for ${chalk.cyan(projectName)} (${chalk.yellow(branchName)})...`;

      // Load session
      let session;
      if (options.session) {
        // Load specific session by ID
        session = await loadSessionById(options.session, DEFAULT_STORAGE_CONFIG);
      } else {
        // Load latest session for project/branch
        session = await loadSession(projectName, branchName, DEFAULT_STORAGE_CONFIG);
      }

      if (!session) {
        spinner?.warn(chalk.yellow('No saved context found'));

        if (!options.inject) {
          console.log('');
          console.log(chalk.gray('Use `ctx save` to save your current session context.'));
        }
        process.exit(0);
        return;
      }

      spinner.succeed(chalk.green('Context loaded successfully'));

      // Format and output based on options
      const maxTokens = parseInt(options.maxTokens || '8192', 10);

      if (options.inject) {
        // Output as injectable preamble (for hooks)
        const preamble = formatPreamble(session, {
          maxTokens,
          format: 'markdown',
          includeTimestamp: true,
          includeKeywords: true,
          includeFilePaths: true,
        });

        // Output directly to stdout for hooks (no extra formatting)
        process.stdout.write(preamble);
      } else {
        // Output formatted context for user display
        if (options.format === 'json') {
          console.log(JSON.stringify(session, null, 2));
        } else if (options.format === 'raw') {
          console.log(session.summary);
        } else {
          // Default: preamble format
          const preamble = formatPreamble(session, {
            maxTokens,
            format: 'markdown',
            includeTimestamp: true,
            includeKeywords: true,
            includeFilePaths: true,
          });

          console.log('');
          console.log(chalk.bold('📋 Session Context'));
          console.log(chalk.gray('─'.repeat(40)));
          console.log('');
          console.log(preamble);

          // Show additional session info
          console.log('');
          console.log(chalk.bold('Session Details:'));
          console.log(`  ${chalk.cyan('Session ID:')} ${session.id}`);
          console.log(`  ${chalk.cyan('Project:')} ${session.projectName}`);
          console.log(`  ${chalk.cyan('Branch:')} ${session.branch}`);

          if (session.keywords && session.keywords.length > 0) {
            console.log(`  ${chalk.cyan('Keywords:')} ${session.keywords.slice(0, 5).join(', ')}`);
          }

          if (session.filePaths && session.filePaths.length > 0) {
            console.log(`  ${chalk.cyan('Files Worked On:')} ${session.filePaths.length}`);
          }

          if (session.tokensCompressed > 0) {
            console.log(`  ${chalk.cyan('Tokens Compressed:')} ${session.tokensCompressed}`);
          }

          if (session.metadata) {
            console.log(`  ${chalk.cyan('Last Command:')} ${session.metadata.lastCommand || 'N/A'}`);
          }

          console.log('');
          console.log(chalk.gray('💡 Use `ctx save` to update this context with your current work.'));
        }
      }

      process.exit(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner?.fail(chalk.red(`Failed to load context: ${errorMessage}`));
      process.exit(1);
    }
  });

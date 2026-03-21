/**
 * List Command - List all saved sessions
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadRegistry, DEFAULT_STORAGE_CONFIG } from 'contextcarry-core';
import type { ListOptions } from 'contextcarry-types';

interface ListCommandOptions {
  project?: string;
  branch?: string;
  limit?: string;
  format?: string;
}

export const listCommand = new Command('list')
  .alias('ls')
  .description('List all saved sessions')
  .option('-p, --project <name>', 'Filter by project name')
  .option('-b, --branch <name>', 'Filter by branch')
  .option('-l, --limit <number>', 'Limit number of results')
  .option('-f, --format <type>', 'Output format: table, json', 'table')
  .action(async (options: ListCommandOptions) => {
    const spinner = ora('Loading session registry...').start();

    try {
      // Load session registry
      const registry = await loadRegistry(DEFAULT_STORAGE_CONFIG);

      // Filter sessions based on options
      let filteredSessions = registry.sessions;

      if (options.project) {
        const projectName = options.project.toLowerCase();
        filteredSessions = filteredSessions.filter(
          session => session.projectName.toLowerCase().includes(projectName)
        );
      }

      if (options.branch) {
        const branchName = options.branch.toLowerCase();
        filteredSessions = filteredSessions.filter(
          session => session.branch.toLowerCase().includes(branchName)
        );
      }

      // Apply limit if specified
      const limit = options.limit ? parseInt(options.limit, 10) : undefined;
      if (limit && limit > 0) {
        filteredSessions = filteredSessions.slice(0, limit);
      }

      spinner.succeed(chalk.green(`Found ${filteredSessions.length} session${filteredSessions.length !== 1 ? 's' : ''}`));

      // Display based on format
      if (options.format === 'json') {
        displaySessionsJson(filteredSessions);
      } else {
        displaySessionsTable(filteredSessions);
      }

      process.exit(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`Failed to list sessions: ${errorMessage}`));
      process.exit(1);
    }
  });

/**
 * Display sessions as formatted table
 */
function displaySessionsTable(sessions: any[]): void {
  if (sessions.length === 0) {
    console.log('');
    console.log(chalk.yellow('No saved sessions found.'));
    console.log(chalk.gray('Use `ctx save` to save your current session context.'));
    return;
  }

  console.log('');

  // Table header
  const headers = ['Session ID', 'Project', 'Branch', 'Date', 'Summary'];
  const columnWidths = [
    36, // Session ID
    20, // Project
    15, // Branch
    20, // Date
    40, // Summary
  ];

  // Print header row
  let headerRow = '';
  headers.forEach((header, i) => {
    const width = columnWidths[i] || 20; // Fallback to 20 if undefined
    headerRow += chalk.bold(header.padEnd(width));
  });
  console.log(headerRow);
  console.log(chalk.gray('─'.repeat(140)));

  // Print session rows
  sessions.forEach((session, index) => {
    const sessionId = session.sessionId.substring(0, 36);
    const projectName = truncateString(session.projectName, 20);
    const branchName = truncateString(session.branch, 15);
    const date = formatDate(session.timestamp || 0);
    const summary = truncateString(session.summary, 40);

    let row = '';
    row += `${sessionId.padEnd(36)}`;
    row += `${chalk.cyan(projectName).padEnd(20)}`;
    row += `${chalk.yellow(branchName).padEnd(15)}`;
    row += `${chalk.gray(date).padEnd(20)}`;
    row += summary;

    console.log(row);

    // Add separator after every 5 rows for readability
    if ((index + 1) % 5 === 0 && index !== sessions.length - 1) {
      console.log(chalk.gray('·'.repeat(140)));
    }
  });

  console.log('');
  console.log(chalk.gray(`Showing ${sessions.length} session${sessions.length !== 1 ? 's' : ''}`));
  console.log(chalk.gray(`Use 'ctx load' to view a session's full context`));

  // Show filtering info if applied
  console.log('');
  console.log(chalk.dim('💡 Tips:'));
  console.log(chalk.dim(`  - Use --project <name> to filter by project`));
  console.log(chalk.dim(`  - Use --branch <name> to filter by branch`));
  console.log(chalk.dim(`  - Use --limit <n> to show only the most recent sessions`));
  console.log(chalk.dim(`  - Use --format json to export as JSON`));
}

/**
 * Display sessions as JSON
 */
function displaySessionsJson(sessions: any[]): void {
  if (sessions.length === 0) {
    console.log('[]');
    return;
  }

  const output = sessions.map(session => ({
    sessionId: session.sessionId,
    projectName: session.projectName,
    branch: session.branch,
    timestamp: session.timestamp,
    date: new Date(session.timestamp || 0).toISOString(),
    summary: session.summary,
    filePath: session.filePath,
  }));

  console.log(JSON.stringify(output, null, 2));
}

/**
 * Truncate string to fit within width
 */
function truncateString(str: string, width: number): string {
  if (str.length <= width) {
    return str;
  }
  return str.substring(0, width - 3) + '...';
}

/**
 * Format timestamp for display
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

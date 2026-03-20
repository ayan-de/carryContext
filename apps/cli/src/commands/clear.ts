/**
 * Clear Command - Clear saved context with confirmation prompt
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import {
  detectProject,
  loadSession,
  loadRegistry,
  deleteSession,
  writeContextFile,
  DEFAULT_STORAGE_CONFIG,
} from '@contextcarry/core';
import { join } from 'node:path';
import { readdir, rm } from 'node:fs/promises';

export const clearCommand = new Command('clear')
  .description('Clear saved context')
  .option('-a, --all', 'Clear all sessions for current project')
  .option('-s, --session <id>', 'Clear specific session by ID')
  .option('-b, --branch <branch>', 'Clear context for specific branch (default: current)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (options: { all?: boolean; session?: string; branch?: string; yes?: boolean }) => {
    try {
      // Detect current project
      let projectInfo;
      try {
        projectInfo = await detectProject();
      } catch {
        console.log(chalk.red('Could not detect project info'));
        process.exit(1);
        return;
      }

      const targetBranch = options.branch || projectInfo.branch;
      const dataDir = DEFAULT_STORAGE_CONFIG.dataDir;

      // Handle specific session deletion
      if (options.session) {
        await clearSpecificSession(options.session, options.yes || false);
        return;
      }

      // Handle clear all for project
      if (options.all) {
        await clearAllProjectSessions(projectInfo.name, dataDir, options.yes || false);
        return;
      }

      // Default: clear current branch's LATEST.md
      await clearCurrentBranch(projectInfo.name, targetBranch, dataDir, options.yes || false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(chalk.red(`Failed to clear context: ${errorMessage}`));
      process.exit(1);
    }
  });

/**
 * Clear a specific session by ID
 */
async function clearSpecificSession(sessionId: string, skipConfirm: boolean): Promise<void> {
  const spinner = ora('Finding session...').start();

  const registry = await loadRegistry(DEFAULT_STORAGE_CONFIG);
  const session = registry.sessions.find(s => s.sessionId === sessionId);

  if (!session) {
    spinner.fail(chalk.red(`Session not found: ${sessionId}`));
    process.exit(1);
    return;
  }

  spinner.stop();

  const confirmed = skipConfirm || await confirmAction(
    `Delete session ${chalk.cyan(sessionId.substring(0, 8))}... from ${chalk.cyan(session.projectName)}/${chalk.cyan(session.branch)}?`
  );

  if (!confirmed) {
    console.log(chalk.yellow('Cancelled.'));
    process.exit(0);
    return;
  }

  const deleteSpinner = ora('Deleting session...').start();
  const deleted = await deleteSession(sessionId, DEFAULT_STORAGE_CONFIG);

  if (deleted) {
    deleteSpinner.succeed(chalk.green(`Session ${sessionId.substring(0, 8)}... deleted`));
  } else {
    deleteSpinner.fail(chalk.red('Failed to delete session'));
    process.exit(1);
  }
}

/**
 * Clear all sessions for a project
 */
async function clearAllProjectSessions(projectName: string, dataDir: string, skipConfirm: boolean): Promise<void> {
  const registry = await loadRegistry(DEFAULT_STORAGE_CONFIG);
  const projectSessions = registry.sessions.filter(s => s.projectName === projectName);

  if (projectSessions.length === 0) {
    console.log(chalk.yellow('No sessions found for this project.'));
    process.exit(0);
    return;
  }

  const confirmed = skipConfirm || await confirmAction(
    `Delete all ${chalk.cyan(projectSessions.length.toString())} session(s) for project ${chalk.cyan(projectName)}?`
  );

  if (!confirmed) {
    console.log(chalk.yellow('Cancelled.'));
    process.exit(0);
    return;
  }

  const spinner = ora('Clearing all sessions...').start();
  const projectDir = join(dataDir, projectName);

  try {
    // Remove entire project directory
    await rm(projectDir, { recursive: true, force: true });

    // Update registry to remove entries for this project
    registry.sessions = registry.sessions.filter(s => s.projectName !== projectName);
    registry.lastUpdated = Date.now();

    const registryPath = join(dataDir, 'index.md');
    await writeContextFile(
      registryPath,
      `# Context Carry Session Registry\n\nThis file contains an index of all saved sessions.\n`,
      {
        sessions: registry.sessions,
        lastUpdated: registry.lastUpdated,
      }
    );

    spinner.succeed(chalk.green(`Cleared ${projectSessions.length} session(s) for project ${projectName}`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed to clear sessions: ${error}`));
    process.exit(1);
  }
}

/**
 * Clear context for current branch
 */
async function clearCurrentBranch(projectName: string, branch: string, dataDir: string, skipConfirm: boolean): Promise<void> {
  const session = await loadSession(projectName, branch, DEFAULT_STORAGE_CONFIG);

  if (!session) {
    console.log(chalk.yellow(`No saved context found for ${projectName}/${branch}`));
    process.exit(0);
    return;
  }

  const branchDir = join(dataDir, projectName, branch);

  // Count files to delete
  let fileCount = 0;
  try {
    const files = await readdir(branchDir);
    fileCount = files.filter(f => f.endsWith('.md')).length;
  } catch {
    fileCount = 1;
  }

  const confirmed = skipConfirm || await confirmAction(
    `Clear context for ${chalk.cyan(projectName)}/${chalk.cyan(branch)} (${fileCount} file(s))?`
  );

  if (!confirmed) {
    console.log(chalk.yellow('Cancelled.'));
    process.exit(0);
    return;
  }

  const spinner = ora('Clearing context...').start();

  try {
    // Remove the entire branch directory
    await rm(branchDir, { recursive: true, force: true });

    // Update registry to remove entries for this branch
    const registry = await loadRegistry(DEFAULT_STORAGE_CONFIG);
    registry.sessions = registry.sessions.filter(
      s => !(s.projectName === projectName && s.branch === branch)
    );
    registry.lastUpdated = Date.now();

    const registryPath = join(dataDir, 'index.md');
    await writeContextFile(
      registryPath,
      `# Context Carry Session Registry\n\nThis file contains an index of all saved sessions.\n`,
      {
        sessions: registry.sessions,
        lastUpdated: registry.lastUpdated,
      }
    );

    spinner.succeed(chalk.green(`Context cleared for ${projectName}/${branch}`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed to clear context: ${error}`));
    process.exit(1);
  }
}

/**
 * Prompt user for confirmation
 */
async function confirmAction(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input, output });

  try {
    const answer = await rl.question(`${chalk.bold.yellow('?')} ${message} ${chalk.dim('[y/N]')} `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  } finally {
    rl.close();
  }
}

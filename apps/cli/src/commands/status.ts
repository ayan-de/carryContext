/**
 * Status Command - Show active project and context status
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  detectProject,
  loadSession,
  loadRegistry,
  DEFAULT_STORAGE_CONFIG,
} from 'contextcarry-core';
import { formatStatusMessage } from 'contextcarry-core';

export const statusCommand = new Command('status')
  .description('Show active project and context status')
  .option('-j, --json', 'Output as JSON')
  .action(async (options: { json?: boolean }) => {
    const spinner = ora('Checking status...').start();

    try {
      // Detect current project
      let projectInfo;
      try {
        projectInfo = await detectProject();
      } catch (error) {
        spinner?.warn(chalk.yellow('Could not detect project info'));
        projectInfo = {
          name: 'unknown-project',
          rootPath: process.cwd(),
          branch: 'no-branch',
        };
      }

      // Load latest session for this project/branch
      const session = await loadSession(
        projectInfo.name,
        projectInfo.branch,
        DEFAULT_STORAGE_CONFIG
      );

      // Load registry for stats
      const registry = await loadRegistry(DEFAULT_STORAGE_CONFIG);

      // Calculate stats
      const projectSessions = registry.sessions.filter(
        s => s.projectName === projectInfo.name
      );
      const branchSessions = registry.sessions.filter(
        s => s.projectName === projectInfo.name && s.branch === projectInfo.branch
      );

      spinner.succeed(chalk.green('Status retrieved'));

      // Output based on format
      if (options.json) {
        displayJsonStatus(projectInfo, session, {
          totalSessions: registry.sessions.length,
          projectSessions: projectSessions.length,
          branchSessions: branchSessions.length,
        });
      } else {
        displayTableStatus(projectInfo, session, {
          totalSessions: registry.sessions.length,
          projectSessions: projectSessions.length,
          branchSessions: branchSessions.length,
        });
      }

      process.exit(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner?.fail(chalk.red(`Failed to check status: ${errorMessage}`));
      process.exit(1);
    }
  });

/**
 * Display status as formatted table
 */
function displayTableStatus(
  projectInfo: any,
  session: any,
  stats: { totalSessions: number; projectSessions: number; branchSessions: number }
): void {
  console.log('');
  console.log(chalk.bold('📍 Context Carry Status'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log('');

  // Current project info
  console.log(chalk.bold('Current Project:'));
  console.log('  ' + chalk.cyan('Name:') + '    ' + projectInfo.name);
  console.log('  ' + chalk.cyan('Branch:') + '  ' + projectInfo.branch);
  console.log('  ' + chalk.cyan('Path:') + '    ' + projectInfo.rootPath);

  if (projectInfo.gitRepo) {
    console.log('  ' + chalk.cyan('Git:') + '     Yes');
    if (projectInfo.lastCommit) {
      console.log('  ' + chalk.cyan('Commit:') + ' ' + projectInfo.lastCommit);
    }
  } else {
    console.log('  ' + chalk.cyan('Git:') + '     No');
  }

  console.log('');

  // Session status
  console.log(chalk.bold('Session Status:'));
  if (session) {
    console.log('  ' + chalk.green('✓') + ' Context saved for this project/branch');
    console.log('  ' + chalk.cyan('Last saved:') + ' ' + formatDate(session.timestamp));
    console.log('  ' + chalk.cyan('Session ID:') + ' ' + session.id.substring(0, 12) + '...');

    if (session.keywords && session.keywords.length > 0) {
      console.log('  ' + chalk.cyan('Keywords:') + '   ' + session.keywords.slice(0, 3).join(', '));
    }

    if (session.tokensCompressed > 0) {
      console.log('  ' + chalk.cyan('Tokens:') + '     ' + session.tokensCompressed + ' compressed');
    }
  } else {
    console.log('  ' + chalk.yellow('○') + ' No saved context for this project/branch');
    console.log(chalk.gray('    Use `ctx save` to save your current session'));
  }

  console.log('');

  // Storage statistics
  console.log(chalk.bold('Storage Statistics:'));
  console.log('  ' + chalk.cyan('Total sessions:') + '      ' + stats.totalSessions);
  console.log('  ' + chalk.cyan('Project sessions:') + '    ' + stats.projectSessions);
  console.log('  ' + chalk.cyan('Branch sessions:') + '     ' + stats.branchSessions);
  console.log('  ' + chalk.cyan('Storage location:') + '   ' + DEFAULT_STORAGE_CONFIG.dataDir);

  console.log('');

  // Quick status message
  if (session) {
    console.log(chalk.gray('─'.repeat(50)));
    console.log('');
    console.log(chalk.dim('Quick status: ' + formatStatusMessage(session)));
  }

  console.log('');
  console.log(chalk.dim('💡 Tips:'));
  console.log(chalk.dim('  - Use ctx save to save your current context'));
  console.log(chalk.dim('  - Use ctx load to restore saved context'));
  console.log(chalk.dim('  - Use ctx list to see all saved sessions'));
}

/**
 * Display status as JSON
 */
function displayJsonStatus(
  projectInfo: any,
  session: any,
  stats: { totalSessions: number; projectSessions: number; branchSessions: number }
): void {
  const output = {
    project: {
      name: projectInfo.name,
      branch: projectInfo.branch,
      rootPath: projectInfo.rootPath,
      gitRepo: projectInfo.gitRepo || false,
      lastCommit: projectInfo.lastCommit || null,
    },
    session: session ? {
      id: session.id,
      timestamp: session.timestamp,
      lastSaved: new Date(session.timestamp).toISOString(),
      keywords: session.keywords || [],
      tokensCompressed: session.tokensCompressed || 0,
    } : null,
    stats: {
      totalSessions: stats.totalSessions,
      projectSessions: stats.projectSessions,
      branchSessions: stats.branchSessions,
      storageLocation: DEFAULT_STORAGE_CONFIG.dataDir,
    },
  };

  console.log(JSON.stringify(output, null, 2));
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
    return diffHours + 'h ago (' + date.toLocaleDateString() + ' ' + date.toLocaleTimeString() + ')';
  } else if (diffDays < 7) {
    return diffDays + 'd ago (' + date.toLocaleDateString() + ')';
  } else {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}

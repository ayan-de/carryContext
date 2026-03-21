/**
 * Init Command - Initialize Context Carry configuration
 */

import { Command } from 'commander';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import chalk from 'chalk';
import ora from 'ora';
import {
  initializeStorage,
  DEFAULT_STORAGE_CONFIG,
  saveConfig,
  DEFAULT_CONFIG,
  configExists,
} from 'contextcarry-core';

// ============================================================================
// Slash command templates
// ============================================================================

const CTX_SAVE_TEMPLATE = `\
Save the current session context using Context Carry.

Summarize our entire conversation so far — what we worked on, key decisions made, files modified, and next steps. Then run:

\`\`\`bash
ctx save --stdin --disable-summarization
\`\`\`

Pipe your summary as the stdin input to that command. After it completes, confirm to the user: "Context saved to ~/.contextcarry/. Run \`ctx load\` in your next session to restore it."
`;

const CTX_LOAD_TEMPLATE = `\
Load saved session context using Context Carry.

Run this command:

\`\`\`bash
ctx load
\`\`\`

Display the full output to the user. If no saved context is found, tell the user to run \`/ctx-save\` at the end of their next session to save context first.
`;

const CTX_STATUS_TEMPLATE = `\
Show the current Context Carry status.

Run this command:

\`\`\`bash
ctx status
\`\`\`

Display the full output to the user.
`;

const SLASH_COMMANDS: Record<string, string> = {
  'ctx-save.md': CTX_SAVE_TEMPLATE,
  'ctx-load.md': CTX_LOAD_TEMPLATE,
  'ctx-status.md': CTX_STATUS_TEMPLATE,
};

// ============================================================================
// Installer helpers
// ============================================================================

async function installSlashCommands(force: boolean): Promise<void> {
  const commandsDir = join(homedir(), '.claude', 'commands');
  await mkdir(commandsDir, { recursive: true });

  for (const [filename, content] of Object.entries(SLASH_COMMANDS)) {
    const filePath = join(commandsDir, filename);
    if (!force) {
      try {
        await access(filePath);
        continue; // Already exists, skip
      } catch {
        // Doesn't exist, write it
      }
    }
    await writeFile(filePath, content, 'utf-8');
  }
}

interface HookEntry {
  type: string;
  command: string;
}

interface HookGroup {
  matcher: string;
  hooks: HookEntry[];
}

async function installHookConfig(): Promise<void> {
  const settingsPath = join(homedir(), '.claude', 'settings.json');

  let existing: Record<string, unknown> = {};
  try {
    const content = await readFile(settingsPath, 'utf-8');
    existing = JSON.parse(content);
  } catch {
    // File doesn't exist yet — start fresh
  }

  const hooks = (existing.hooks as Record<string, unknown>) || {};
  const stopHooks = (hooks['Stop'] as HookGroup[]) || [];

  const alreadyInstalled = stopHooks.some((group) =>
    group.hooks?.some((h) => h.command === 'ctx hook')
  );

  if (!alreadyInstalled) {
    stopHooks.push({
      matcher: '',
      hooks: [{ type: 'command', command: 'ctx hook' }],
    });
    hooks['Stop'] = stopHooks;
    existing.hooks = hooks;

    await mkdir(join(homedir(), '.claude'), { recursive: true });
    await writeFile(settingsPath, JSON.stringify(existing, null, 2), 'utf-8');
  }
}

// ============================================================================
// Command
// ============================================================================

export const initCommand = new Command('init')
  .description('Initialize Context Carry configuration')
  .option('-f, --force', 'Force overwrite existing configuration and slash commands')
  .option('-s, --skip-hooks', 'Skip Claude Code hook and slash command installation')
  .action(async (options) => {
    const spinner = ora('Initializing Context Carry...').start();

    try {
      // 1. Create ~/.contextcarry/ directory, README.md, index.md
      await initializeStorage(DEFAULT_STORAGE_CONFIG);

      // 2. Write config.json (skip if exists unless --force)
      const alreadyExists = await configExists(DEFAULT_STORAGE_CONFIG.dataDir);
      if (alreadyExists && !options.force) {
        spinner.warn(chalk.yellow('Config already exists. Use --force to overwrite.'));
      } else {
        await saveConfig(DEFAULT_CONFIG);
      }

      // 3. Install Claude Code hooks + slash commands
      if (!options.skipHooks) {
        spinner.text = 'Installing Claude Code hooks...';
        await installHookConfig();

        spinner.text = 'Installing slash commands...';
        await installSlashCommands(options.force ?? false);
      }

      spinner.succeed(chalk.green('Context Carry initialized'));

      console.log(chalk.gray('\nStorage:      ') + chalk.white(DEFAULT_STORAGE_CONFIG.dataDir));

      if (!options.skipHooks) {
        console.log(chalk.gray('Hooks:        ') + chalk.white('~/.claude/settings.json (Stop → ctx hook)'));
        console.log(chalk.gray('Commands:     ') + chalk.white('/ctx-save, /ctx-load, /ctx-status'));
      }

      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.white('  1. Set your API key:  export GLM_API_KEY=<key> && export CTX_PROVIDER=glm'));

      if (!options.skipHooks) {
        console.log(chalk.white('  2. Use Claude Code normally — context saves automatically on session end'));
        console.log(chalk.white('  3. In a new session:  /ctx-load  to restore context'));
        console.log(chalk.white('  4. Mid-session:       /ctx-save  to save manually'));
      } else {
        console.log(chalk.white('  2. Save context:      ctx save --stdin'));
        console.log(chalk.white('  3. Load context:      ctx load'));
      }
    } catch (error) {
      spinner.fail(chalk.red(`Failed to initialize: ${error}`));
      process.exit(1);
    }
  });

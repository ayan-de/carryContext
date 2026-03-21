/**
 * Watcher Module - Detect project name + git branch
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProjectInfo, WatcherConfig } from 'contextcarry-types';

/**
 * Default watcher configuration
 */
export const DEFAULT_WATCHER_CONFIG: WatcherConfig = {
  enabled: true,
  watchIntervalMs: 5000,
  gitTimeoutMs: 10000,
};

/**
 * Detect project information from current working directory
 */
export async function detectProject(cwd: string = process.cwd()): Promise<ProjectInfo> {
  const projectName = await detectProjectName(cwd);
  const branch = await detectBranch(cwd);
  const lastCommit = await detectLastCommit(cwd);
  const gitRepo = await isGitRepo(cwd);

  return {
    name: projectName,
    rootPath: cwd,
    branch,
    gitRepo,
    lastCommit,
  };
}

/**
 * Detect branch name from git
 */
export async function detectBranch(cwd: string = process.cwd()): Promise<string> {
  try {
    if (!await isGitRepo(cwd)) {
      return 'no-branch';
    }

    // Try git branch --show-current (Git 2.22+)
    try {
      return execSync('git branch --show-current', {
        cwd,
        encoding: 'utf-8',
        timeout: DEFAULT_WATCHER_CONFIG.gitTimeoutMs,
      }).trim();
    } catch {
      // Fallback to git symbolic-ref
      const ref = execSync('git symbolic-ref --short HEAD', {
        cwd,
        encoding: 'utf-8',
        timeout: DEFAULT_WATCHER_CONFIG.gitTimeoutMs,
      }).trim();
      return ref;
    }
  } catch (error) {
    return 'detached-HEAD';
  }
}

/**
 * Detect project name from package.json, git remote, or directory name
 */
export async function detectProjectName(cwd: string = process.cwd()): Promise<string> {
  // Try package.json first
  const packageJsonPath = join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (pkg.name) {
        // Clean up scoped package names (@scope/package-name -> package-name)
        return pkg.name.replace(/^@[^/]+\//, '');
      }
    } catch {
      // Continue to fallback methods
    }
  }

  // Try git remote origin name
  if (await isGitRepo(cwd)) {
    try {
      const remote = execSync('git remote get-url origin', {
        cwd,
        encoding: 'utf-8',
        timeout: DEFAULT_WATCHER_CONFIG.gitTimeoutMs,
      }).trim();

      // Extract project name from remote URL
      // https://github.com/user/project-name.git -> project-name
      // git@github.com:user/project-name.git -> project-name
      const match = remote.match(/([^/:]+)\.git$/);
      if (match && match[1]) {
        return match[1];
      }
    } catch {
      // Continue to directory name fallback
    }
  }

  // Fallback to directory name
  const pathParts = cwd.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  return lastPart || 'unknown-project';
}

/**
 * Detect last commit hash and message
 */
export async function detectLastCommit(cwd: string = process.cwd()): Promise<string | undefined> {
  if (!await isGitRepo(cwd)) {
    return undefined;
  }

  try {
    const output = execSync('git log -1 --pretty=format:"%h - %s"', {
      cwd,
      encoding: 'utf-8',
      timeout: DEFAULT_WATCHER_CONFIG.gitTimeoutMs,
    }).trim();
    return output;
  } catch {
    return undefined;
  }
}

/**
 * Check if current directory is a git repository
 */
export async function isGitRepo(cwd: string = process.cwd()): Promise<boolean> {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd,
      encoding: 'utf-8',
      timeout: DEFAULT_WATCHER_CONFIG.gitTimeoutMs,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a watcher for git changes
 * Monitors branch changes and updates project info accordingly
 */
export function createWatcher(
  config: WatcherConfig = DEFAULT_WATCHER_CONFIG
): {
  start: () => void;
  stop: () => void;
  onBranchChange: (callback: (newBranch: string) => void) => void;
  onProjectChange: (callback: () => void) => void;
} {
  if (!config.enabled) {
    return createNullWatcher();
  }

  let currentBranch = '';
  let currentProject = '';
  let intervalId: NodeJS.Timeout | null = null;

  const branchChangeCallbacks: ((newBranch: string) => void)[] = [];
  const projectChangeCallbacks: (() => void)[] = [];

  const checkForChanges = async () => {
    try {
      const newBranch = await detectBranch();

      if (newBranch !== currentBranch) {
        currentBranch = newBranch;
        branchChangeCallbacks.forEach((cb) => cb(newBranch));
      }
    } catch (error) {
      // Silently fail - errors during polling shouldn't crash the watcher
    }
  };

  return {
    start: async () => {
      // Initial detection
      currentBranch = await detectBranch();
      currentProject = await detectProjectName();

      // Start polling for changes
      intervalId = setInterval(checkForChanges, config.watchIntervalMs);
    },

    stop: () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },

    onBranchChange: (callback: (newBranch: string) => void) => {
      branchChangeCallbacks.push(callback);
    },

    onProjectChange: (callback: () => void) => {
      projectChangeCallbacks.push(callback);
    },
  };
}

/**
 * Create a null watcher (disabled mode)
 */
function createNullWatcher() {
  return {
    start: () => {},
    stop: () => {},
    onBranchChange: () => {},
    onProjectChange: () => {},
  };
}

/**
 * Watch current directory and resolve when branch changes
 * Useful for waiting for user to switch branches
 */
export async function waitForBranchChange(
  cwd: string = process.cwd(),
  timeoutMs: number = 300000 // 5 minutes default
): Promise<string> {
  return new Promise((resolve, reject) => {
    const watcher = createWatcher({
      enabled: true,
      watchIntervalMs: 1000,
      gitTimeoutMs: 5000,
    });

    const timeout = setTimeout(() => {
      watcher.stop();
      reject(new Error('Timeout waiting for branch change'));
    }, timeoutMs);

    watcher.onBranchChange((newBranch: string) => {
      clearTimeout(timeout);
      watcher.stop();
      resolve(newBranch);
    });

    watcher.start();
  });
}

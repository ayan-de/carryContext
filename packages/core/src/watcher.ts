/**
 * Watcher Module - Detect project name + git branch
 */

import type { ProjectInfo, WatcherConfig } from '@contextcarry/types';

export async function detectProject(cwd: string): Promise<ProjectInfo> {
  // TODO: Implement project detection
  throw new Error('Not implemented');
}

export async function detectBranch(cwd: string): Promise<string> {
  // TODO: Implement branch detection
  throw new Error('Not implemented');
}

export function createWatcher(config: WatcherConfig) {
  // TODO: Implement watcher
  throw new Error('Not implemented');
}

/**
 * Project Resolution Utility
 *
 * Every MCP tool accepts an optional `cwd` parameter so the editor can tell us
 * which project directory to operate on. This module centralises that logic:
 *
 *   1. If the caller passes `cwd`, use it.
 *   2. Otherwise fall back to `process.cwd()` — which is the working directory
 *      the editor used when it spawned the MCP server process.
 *
 * After resolving the directory we call `detectProject()` from @contextcarry/core,
 * which reads package.json / git remote to figure out the project name and the
 * current git branch. Those two values are the storage key for everything in
 * Context Carry (`~/.contextcarry/<project>/<branch>/`).
 */

import { detectProject } from 'contextcarry-core';
import type { ProjectInfo } from 'contextcarry-types';

/**
 * Resolve project info from an optional `cwd` parameter.
 *
 * @param cwd - The working directory supplied by the MCP caller (editor).
 *              When undefined we fall back to `process.cwd()`.
 * @returns    ProjectInfo with name, branch, rootPath, etc.
 */
export async function resolveProject(cwd?: string): Promise<ProjectInfo> {
  const dir = cwd ?? process.cwd();
  return detectProject(dir);
}

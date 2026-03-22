/**
 * clear_context MCP Tool
 *
 * MCP equivalent of `ctx clear`. Clears saved context for the current
 * project/branch. Requires an explicit `confirm: true` flag because
 * MCP tools can't prompt for interactive confirmation.
 */

import { z } from 'zod';
import type { Tool, FastMCPSessionAuth } from 'fastmcp';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import {
  loadRegistry,
  writeContextFile,
  DEFAULT_STORAGE_CONFIG,
} from 'contextcarry-core';
import { resolveProject } from '../utils/resolve-project.js';
import { handleToolError } from '../utils/error-handler.js';

const clearContextParams = z.object({
  cwd: z
    .string()
    .optional()
    .describe('Working directory of the project. Falls back to server cwd.'),
  confirm: z
    .boolean()
    .describe('Must be true to actually delete. Safety guard against accidental calls.'),
  allBranches: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, clear all branches for the project (not just the current branch).'),
});

export const clearContextTool: Tool<FastMCPSessionAuth, typeof clearContextParams> = {
  name: 'clear_context',
  description:
    'Clear saved context for the current project/branch. ' +
    'Requires confirm=true as a safety guard. Set allBranches=true to clear the entire project.',
  parameters: clearContextParams,

  async execute(args) {
    try {
      if (!args.confirm) {
        return 'Action not confirmed. Set confirm=true to clear context.';
      }

      const project = await resolveProject(args.cwd);
      const dataDir = DEFAULT_STORAGE_CONFIG.dataDir;
      const registry = await loadRegistry(DEFAULT_STORAGE_CONFIG);

      let removedCount: number;

      if (args.allBranches) {
        // Remove entire project directory
        const projectDir = join(dataDir, project.name);
        await rm(projectDir, { recursive: true, force: true });

        removedCount = registry.sessions.filter(s => s.projectName === project.name).length;
        registry.sessions = registry.sessions.filter(s => s.projectName !== project.name);
      } else {
        // Remove only the current branch directory
        const branchDir = join(dataDir, project.name, project.branch);
        await rm(branchDir, { recursive: true, force: true });

        removedCount = registry.sessions.filter(
          s => s.projectName === project.name && s.branch === project.branch
        ).length;
        registry.sessions = registry.sessions.filter(
          s => !(s.projectName === project.name && s.branch === project.branch)
        );
      }

      // Update the registry file
      registry.lastUpdated = Date.now();
      const registryPath = join(dataDir, 'index.md');
      await writeContextFile(
        registryPath,
        '# Context Carry Session Registry\n\nThis file contains an index of all saved sessions.\n',
        {
          sessions: registry.sessions,
          lastUpdated: registry.lastUpdated,
        },
      );

      const scope = args.allBranches ? project.name : `${project.name}/${project.branch}`;
      return `Cleared ${removedCount} session(s) for ${scope}.`;
    } catch (error) {
      throw handleToolError(error);
    }
  },
};

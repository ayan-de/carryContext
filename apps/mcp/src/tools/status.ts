/**
 * get_status MCP Tool
 *
 * MCP equivalent of `ctx status`. Returns the current project, branch,
 * latest session info, and storage statistics.
 */

import { z } from 'zod';
import type { Tool, FastMCPSessionAuth } from 'fastmcp';
import {
  loadSession,
  loadRegistry,
  DEFAULT_STORAGE_CONFIG,
} from 'contextcarry-core';
import { resolveProject } from '../utils/resolve-project.js';
import { handleToolError } from '../utils/error-handler.js';

const getStatusParams = z.object({
  cwd: z
    .string()
    .optional()
    .describe('Working directory of the project. Falls back to server cwd.'),
});

export const getStatusTool: Tool<FastMCPSessionAuth, typeof getStatusParams> = {
  name: 'get_status',
  description:
    'Get the current Context Carry status: active project, branch, ' +
    'last saved session timestamp, and storage statistics.',
  parameters: getStatusParams,

  async execute(args) {
    try {
      const project = await resolveProject(args.cwd);
      const session = await loadSession(project.name, project.branch, DEFAULT_STORAGE_CONFIG);
      const registry = await loadRegistry(DEFAULT_STORAGE_CONFIG);

      const projectSessions = registry.sessions.filter(s => s.projectName === project.name);
      const branchSessions = projectSessions.filter(s => s.branch === project.branch);

      const lines: string[] = [
        `**Project:** ${project.name}`,
        `**Branch:** ${project.branch}`,
        `**Path:** ${project.rootPath}`,
        `**Git:** ${project.gitRepo ? 'yes' : 'no'}`,
      ];

      if (project.lastCommit) {
        lines.push(`**Last commit:** ${project.lastCommit}`);
      }

      lines.push('');

      if (session) {
        const savedAt = new Date(session.timestamp).toISOString().slice(0, 16).replace('T', ' ');
        lines.push(`**Context:** saved (${savedAt})`);
        lines.push(`**Session ID:** ${session.id}`);
        if (session.keywords && session.keywords.length > 0) {
          lines.push(`**Keywords:** ${session.keywords.slice(0, 5).join(', ')}`);
        }
      } else {
        lines.push('**Context:** none saved for this branch');
      }

      lines.push('');
      lines.push(`**Total sessions:** ${registry.sessions.length}`);
      lines.push(`**Project sessions:** ${projectSessions.length}`);
      lines.push(`**Branch sessions:** ${branchSessions.length}`);

      return lines.join('\n');
    } catch (error) {
      throw handleToolError(error);
    }
  },
};

/**
 * list_sessions MCP Tool
 *
 * MCP equivalent of `ctx list`. Returns sessions from the registry,
 * optionally filtered by project/branch.
 */

import { z } from 'zod';
import type { Tool, FastMCPSessionAuth } from 'fastmcp';
import { loadRegistry, DEFAULT_STORAGE_CONFIG } from 'contextcarry-core';
import { resolveProject } from '../utils/resolve-project.js';
import { handleToolError } from '../utils/error-handler.js';

const listSessionsParams = z.object({
  cwd: z
    .string()
    .optional()
    .describe('Working directory of the project. Falls back to server cwd.'),
  project: z
    .string()
    .optional()
    .describe('Filter sessions by project name.'),
  branch: z
    .string()
    .optional()
    .describe('Filter sessions by branch name.'),
  limit: z
    .number()
    .optional()
    .default(20)
    .describe('Maximum number of sessions to return (default 20).'),
});

export const listSessionsTool: Tool<FastMCPSessionAuth, typeof listSessionsParams> = {
  name: 'list_sessions',
  description:
    'List saved sessions. Returns session IDs, project names, branches, ' +
    'timestamps, and summaries. Optionally filter by project or branch.',
  parameters: listSessionsParams,

  async execute(args) {
    try {
      const registry = await loadRegistry(DEFAULT_STORAGE_CONFIG);
      let sessions = registry.sessions;

      // If no explicit project filter, default to current project from cwd
      const projectFilter = args.project;
      const branchFilter = args.branch;

      if (projectFilter) {
        const p = projectFilter.toLowerCase();
        sessions = sessions.filter(s => s.projectName.toLowerCase().includes(p));
      }

      if (branchFilter) {
        const b = branchFilter.toLowerCase();
        sessions = sessions.filter(s => s.branch.toLowerCase().includes(b));
      }

      // Apply limit
      if (args.limit && args.limit > 0) {
        sessions = sessions.slice(0, args.limit);
      }

      if (sessions.length === 0) {
        return 'No sessions found.';
      }

      // Format as a readable list for the agent
      const lines = sessions.map(s => {
        const date = new Date(s.timestamp || 0).toISOString().slice(0, 16).replace('T', ' ');
        const summary = (s.summary || '').slice(0, 80);
        return `- **${s.projectName}/${s.branch}** (${date}) [${s.sessionId.slice(0, 8)}] ${summary}`;
      });

      return `Found ${sessions.length} session(s):\n\n${lines.join('\n')}`;
    } catch (error) {
      throw handleToolError(error);
    }
  },
};

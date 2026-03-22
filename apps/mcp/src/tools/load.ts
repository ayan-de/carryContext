/**
 * load_context MCP Tool
 *
 * MCP equivalent of `ctx load`. Returns the latest saved context for the
 * current project/branch, formatted as a preamble the agent can use.
 */

import { z } from 'zod';
import type { Tool, FastMCPSessionAuth } from 'fastmcp';
import {
  loadSession,
  loadSessionById,
  formatPreamble,
  DEFAULT_STORAGE_CONFIG,
} from 'contextcarry-core';
import { resolveProject } from '../utils/resolve-project.js';
import { handleToolError } from '../utils/error-handler.js';

const loadContextParams = z.object({
  cwd: z
    .string()
    .optional()
    .describe('Working directory of the project. Falls back to server cwd.'),
  sessionId: z
    .string()
    .optional()
    .describe('Load a specific session by ID instead of the latest.'),
});

export const loadContextTool: Tool<FastMCPSessionAuth, typeof loadContextParams> = {
  name: 'load_context',
  description:
    'Load saved session context for the current project and branch. ' +
    'Returns the context formatted as a preamble with project info, summary, and metadata.',
  parameters: loadContextParams,

  async execute(args) {
    try {
      let session;

      if (args.sessionId) {
        // Load a specific session by ID
        session = await loadSessionById(args.sessionId, DEFAULT_STORAGE_CONFIG);
      } else {
        // Load the latest session for this project/branch
        const project = await resolveProject(args.cwd);
        session = await loadSession(project.name, project.branch, DEFAULT_STORAGE_CONFIG);
      }

      if (!session) {
        return 'No saved context found for this project/branch.';
      }

      // Format as a preamble the agent can consume
      const preamble = formatPreamble(session, {
        maxTokens: 8192,
        format: 'markdown',
        includeTimestamp: true,
        includeKeywords: true,
        includeFilePaths: true,
      });

      return preamble;
    } catch (error) {
      throw handleToolError(error);
    }
  },
};

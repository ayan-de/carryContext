/**
 * Storage Module - Read/write .md files with gray-matter
 */

import {
  mkdir,
  readFile,
  writeFile,
  access,
  readdir,
  stat,
  unlink,
  rename,
} from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import grayMatter from 'gray-matter';
import type { Session, ContextFile, SessionRegistry, StorageConfig, RegistryEntry } from 'contextcarry-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Default storage configuration
 */
export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  dataDir: join(process.env.HOME || process.env.USERPROFILE || '', '.contextcarry'),
  maxSessionsPerProject: 100,
  archiveAfterDays: 30,
  compressArchives: true,
};

/**
 * Save a session to storage
 */
export async function saveSession(session: Session, config: StorageConfig = DEFAULT_STORAGE_CONFIG): Promise<void> {
  const projectDir = join(config.dataDir, session.projectName, session.branch);

  // Ensure directory exists
  await mkdir(projectDir, { recursive: true });

  // Write LATEST.md (current session)
  const latestPath = join(projectDir, 'LATEST.md');
  await writeContextFile(
    latestPath,
    session.summary,
    {
      sessionId: session.id,
      projectName: session.projectName,
      branch: session.branch,
      timestamp: session.timestamp,
      keywords: session.keywords,
      filePaths: session.filePaths,
      tokensCompressed: session.tokensCompressed,
      ...session.metadata,
    }
  );

  // Write timestamped archive copy
  const timestamp = new Date(session.timestamp).toISOString().replace(/[:.]/g, '-');
  const archivePath = join(projectDir, `${session.id}-${timestamp}.md`);
  await writeContextFile(
    archivePath,
    session.summary,
    {
      sessionId: session.id,
      projectName: session.projectName,
      branch: session.branch,
      timestamp: session.timestamp,
      keywords: session.keywords,
      filePaths: session.filePaths,
      tokensCompressed: session.tokensCompressed,
      ...session.metadata,
    }
  );

  // Update registry
  const registryEntry: RegistryEntry = {
    sessionId: session.id,
    projectName: session.projectName,
    branch: session.branch,
    timestamp: session.timestamp,
    filePath: archivePath,
    summary: session.summary.substring(0, 200), // Truncate summary for registry
  };
  await updateRegistry(registryEntry, config);

  // Clean up old sessions if exceeding limit
  await cleanupOldSessions(projectDir, config.maxSessionsPerProject);
}

/**
 * Load the latest session for a project and branch
 */
export async function loadSession(
  projectName: string,
  branch: string,
  config: StorageConfig = DEFAULT_STORAGE_CONFIG
): Promise<Session | null> {
  const latestPath = join(config.dataDir, projectName, branch, 'LATEST.md');

  try {
    await access(latestPath);
    const contextFile = await readContextFile(latestPath);

    return {
      id: contextFile.frontmatter.sessionId as string,
      projectName: contextFile.projectName,
      branch: contextFile.branch,
      timestamp: contextFile.createdAt,
      summary: contextFile.content,
      keywords: (contextFile.frontmatter.keywords as string[]) || [],
      filePaths: (contextFile.frontmatter.filePaths as string[]) || [],
      tokensCompressed: (contextFile.frontmatter.tokensCompressed as number) || 0,
      metadata: contextFile.frontmatter.metadata as any,
    };
  } catch {
    return null;
  }
}

/**
 * Load a specific session by ID
 */
export async function loadSessionById(
  sessionId: string,
  config: StorageConfig = DEFAULT_STORAGE_CONFIG
): Promise<Session | null> {
  // Search in all project directories
  const projectDirs = await listProjectDirectories(config.dataDir);

  for (const projectDir of projectDirs) {
    const branchDirs = await readdir(projectDir);

    for (const branchDir of branchDirs) {
      const branchPath = join(projectDir, branchDir);

      try {
        const files = await readdir(branchPath);
        const sessionFile = files.find((f) => f.startsWith(sessionId));

        if (sessionFile) {
          const sessionPath = join(branchPath, sessionFile);
          const contextFile = await readContextFile(sessionPath);

          return {
            id: contextFile.frontmatter.sessionId as string,
            projectName: contextFile.projectName,
            branch: contextFile.branch,
            timestamp: contextFile.createdAt,
            summary: contextFile.content,
            keywords: (contextFile.frontmatter.keywords as string[]) || [],
            filePaths: (contextFile.frontmatter.filePaths as string[]) || [],
            tokensCompressed: (contextFile.frontmatter.tokensCompressed as number) || 0,
            metadata: contextFile.frontmatter.metadata as any,
          };
        }
      } catch {
        // Continue searching
      }
    }
  }

  return null;
}

/**
 * Read a context file and parse gray-matter frontmatter
 */
export async function readContextFile(filePath: string): Promise<ContextFile> {
  const content = await readFile(filePath, 'utf-8');
  const parsed = grayMatter(content);

  return {
    sessionId: parsed.data.sessionId as string,
    projectName: parsed.data.projectName as string,
    branch: parsed.data.branch as string,
    createdAt: parsed.data.timestamp as number,
    updatedAt: (parsed.data.updatedAt as number) || Date.now(),
    content: parsed.content,
    frontmatter: parsed.data,
  };
}

/**
 * Write a context file with gray-matter frontmatter
 */
export async function writeContextFile(
  filePath: string,
  content: string,
  frontmatter: Record<string, unknown>
): Promise<void> {
  const parsed = grayMatter.stringify(content, frontmatter);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, parsed, 'utf-8');
}

/**
 * Update the session registry (index.md)
 */
export async function updateRegistry(
  entry: RegistryEntry,
  config: StorageConfig = DEFAULT_STORAGE_CONFIG
): Promise<void> {
  const registry = await loadRegistry(config);

  // Remove existing entry with same sessionId
  registry.sessions = registry.sessions.filter((s) => s.sessionId !== entry.sessionId);

  // Add new entry
  registry.sessions.push(entry);

  // Sort by timestamp (newest first)
  registry.sessions.sort((a, b) => b.timestamp - a.timestamp);

  // Update timestamp
  registry.lastUpdated = Date.now();

  // Write back
  await writeRegistry(registry, config);
}

/**
 * Write the session registry to disk with human-readable format
 */
export async function writeRegistry(
  registry: SessionRegistry,
  config: StorageConfig = DEFAULT_STORAGE_CONFIG
): Promise<void> {
  const registryPath = join(config.dataDir, 'index.md');

  // Build human-readable content
  let content = `# Context Carry Session Registry\n\n`;
  content += `> Last updated: ${new Date(registry.lastUpdated).toISOString()}\n`;
  content += `> Total sessions: ${registry.sessions.length}\n\n`;
  content += `---\n\n`;

  if (registry.sessions.length === 0) {
    content += `No sessions saved yet. Run \`ctx save\` to save your first session.\n`;
  } else {
    // Group sessions by project
    const byProject = new Map<string, RegistryEntry[]>();
    for (const session of registry.sessions) {
      const existing = byProject.get(session.projectName) || [];
      existing.push(session);
      byProject.set(session.projectName, existing);
    }

    for (const [projectName, sessions] of byProject) {
      content += `## ${projectName}\n\n`;
      for (const session of sessions) {
        const date = new Date(session.timestamp).toLocaleDateString();
        const time = new Date(session.timestamp).toLocaleTimeString();
        content += `- **${session.branch}** (${date} ${time})\n`;
        content += `  \`${session.sessionId.substring(0, 8)}\` - ${session.summary.substring(0, 80)}${session.summary.length > 80 ? '...' : ''}\n`;
      }
      content += `\n`;
    }
  }

  // Prepend YAML frontmatter with full data
  const parsed = grayMatter.stringify(content, {
    sessions: registry.sessions,
    lastUpdated: registry.lastUpdated,
    version: 1,
  });

  await mkdir(dirname(registryPath), { recursive: true });
  await writeFile(registryPath, parsed, 'utf-8');
}

/**
 * Remove an entry from the registry
 */
export async function removeRegistryEntry(
  sessionId: string,
  config: StorageConfig = DEFAULT_STORAGE_CONFIG
): Promise<boolean> {
  const registry = await loadRegistry(config);
  const initialLength = registry.sessions.length;

  registry.sessions = registry.sessions.filter((s) => s.sessionId !== sessionId);

  if (registry.sessions.length === initialLength) {
    return false; // Entry not found
  }

  registry.lastUpdated = Date.now();
  await writeRegistry(registry, config);
  return true;
}

/**
 * Load the session registry
 */
export async function loadRegistry(
  config: StorageConfig = DEFAULT_STORAGE_CONFIG
): Promise<SessionRegistry> {
  const registryPath = join(config.dataDir, 'index.md');

  try {
    await access(registryPath);
    const content = await readFile(registryPath, 'utf-8');
    const parsed = grayMatter(content);
    return {
      sessions: (parsed.data.sessions as RegistryEntry[]) || [],
      lastUpdated: (parsed.data.lastUpdated as number) || 0,
    };
  } catch {
    return {
      sessions: [],
      lastUpdated: 0,
    };
  }
}

/**
 * List all project directories
 */
export async function listProjectDirectories(dataDir: string): Promise<string[]> {
  try {
    const entries = await readdir(dataDir);
    const dirs: string[] = [];

    for (const entry of entries) {
      const entryPath = join(dataDir, entry);
      try {
        const stats = await stat(entryPath);
        if (stats.isDirectory()) {
          dirs.push(entryPath);
        }
      } catch {
        // Skip entries that can't be accessed
      }
    }

    return dirs;
  } catch {
    return [];
  }
}

/**
 * Clean up old sessions if exceeding limit
 */
async function cleanupOldSessions(projectDir: string, maxSessions: number): Promise<void> {
  try {
    const files = await readdir(projectDir);
    const sessionFiles = files.filter((f) => f.endsWith('.md') && f !== 'LATEST.md');

    if (sessionFiles.length <= maxSessions) {
      return;
    }

    // Get file stats and sort by creation time
    const fileStats = await Promise.all(
      sessionFiles.map(async (file) => ({
        name: file,
        stats: await stat(join(projectDir, file)),
      }))
    );

    fileStats.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);

    // Delete oldest files exceeding limit
    const toDelete = fileStats.slice(maxSessions);
    for (const file of toDelete) {
      try {
        await unlink(join(projectDir, file.name));
      } catch {
        // Silently skip failed deletions
      }
    }
  } catch {
    // Silently skip cleanup errors
  }
}

/**
 * Initialize storage directory structure
 * Creates ~/.contextcarry/ with README and initial registry
 */
export async function initializeStorage(config: StorageConfig = DEFAULT_STORAGE_CONFIG): Promise<void> {
  // Create main directory
  await mkdir(config.dataDir, { recursive: true });

  // Create README if it doesn't exist
  const readmePath = join(config.dataDir, 'README.md');
  try {
    await access(readmePath);
  } catch {
    const readmeContent = `# Context Carry Storage

This directory stores your AI session contexts for the Context Carry tool.

## Structure

\`\`\`
~/.contextcarry/
├── README.md           # This file
├── index.md            # Session registry (index of all sessions)
├── config.json         # Configuration (created on first config change)
└── <project>/
    └── <branch>/
        ├── LATEST.md   # Most recent session for this branch
        └── <id>-<timestamp>.md  # Archived sessions
\`\`\`

## Usage

- \`ctx save\` - Save current session context
- \`ctx load\` - Load saved context for current project/branch
- \`ctx list\` - List all saved sessions
- \`ctx status\` - Show current context status
- \`ctx clear\` - Clear saved context

## Files

- **index.md** - Registry of all sessions with metadata
- **LATEST.md** - Most recent session for each project/branch
- **Archive files** - Timestamped backups of previous sessions

Generated by Context Carry (https://github.com/contextcarry/contextcarry)
`;
    await writeFile(readmePath, readmeContent, 'utf-8');
  }

  // Initialize empty registry if it doesn't exist
  const registryPath = join(config.dataDir, 'index.md');
  try {
    await access(registryPath);
  } catch {
    await updateRegistry(
      {
        sessionId: 'init',
        projectName: 'system',
        branch: 'init',
        timestamp: Date.now(),
        filePath: registryPath,
        summary: 'Initial registry created',
      },
      config
    );
  }
}

/**
 * Delete a session by ID
 */
export async function deleteSession(sessionId: string, config: StorageConfig = DEFAULT_STORAGE_CONFIG): Promise<boolean> {
  const projectDirs = await listProjectDirectories(config.dataDir);

  for (const projectDir of projectDirs) {
    const branchDirs = await readdir(projectDir);

    for (const branchDir of branchDirs) {
      const branchPath = join(projectDir, branchDir);

      try {
        const files = await readdir(branchPath);
        const sessionFile = files.find((f) => f.startsWith(sessionId));

        if (sessionFile) {
          const sessionPath = join(branchPath, sessionFile);
          await unlink(sessionPath);

          // If this was LATEST.md, we might need to promote next session
          if (sessionFile === 'LATEST.md') {
            const remaining = files.filter((f) => f.endsWith('.md') && f !== 'LATEST.md');
            if (remaining.length > 0) {
              const stats = await Promise.all(
                remaining.map(async (f) => ({
                  name: f,
                  mtime: (await stat(join(branchPath, f))).mtimeMs,
                }))
              );
              stats.sort((a, b) => b.mtime - a.mtime);
              const latest = stats[0];
              if (latest) {
                await rename(join(branchPath, latest.name), join(branchPath, 'LATEST.md'));
              }
            }
          }

          // Update registry using the dedicated function
          await removeRegistryEntry(sessionId, config);

          return true;
        }
      } catch {
        // Continue searching
      }
    }
  }

  return false;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return randomUUID();
}

// ============================================================================
// Registry Query Functions
// ============================================================================

/**
 * Filter registry entries by criteria
 */
export function filterRegistryEntries(
  registry: SessionRegistry,
  options: {
    project?: string;
    branch?: string;
    since?: number;
    until?: number;
    limit?: number;
  }
): RegistryEntry[] {
  let entries = [...registry.sessions];

  if (options.project) {
    entries = entries.filter((e) => e.projectName === options.project);
  }

  if (options.branch) {
    entries = entries.filter((e) => e.branch === options.branch);
  }

  if (options.since !== undefined) {
    entries = entries.filter((e) => e.timestamp >= options.since!);
  }

  if (options.until !== undefined) {
    entries = entries.filter((e) => e.timestamp <= options.until!);
  }

  if (options.limit !== undefined && options.limit > 0) {
    entries = entries.slice(0, options.limit);
  }

  return entries;
}

/**
 * Get registry entries for a specific project
 */
export function getProjectEntries(
  registry: SessionRegistry,
  projectName: string
): RegistryEntry[] {
  return filterRegistryEntries(registry, { project: projectName });
}

/**
 * Get registry entries for a specific project and branch
 */
export function getBranchEntries(
  registry: SessionRegistry,
  projectName: string,
  branch: string
): RegistryEntry[] {
  return filterRegistryEntries(registry, { project: projectName, branch });
}

/**
 * Get the most recent session for a project/branch
 */
export function getLatestEntry(
  registry: SessionRegistry,
  projectName: string,
  branch: string
): RegistryEntry | null {
  const entries = getBranchEntries(registry, projectName, branch);
  return entries.length > 0 ? entries[0]! : null;
}

/**
 * List all unique project names in the registry
 */
export function listProjects(registry: SessionRegistry): string[] {
  const projects = new Set(registry.sessions.map((s) => s.projectName));
  return Array.from(projects).sort();
}

/**
 * List all branches for a project
 */
export function listBranches(registry: SessionRegistry, projectName: string): string[] {
  const branches = new Set(
    registry.sessions
      .filter((s) => s.projectName === projectName)
      .map((s) => s.branch)
  );
  return Array.from(branches).sort();
}

// ============================================================================
// Registry Maintenance Functions
// ============================================================================

/**
 * Rebuild the registry from all session files on disk
 * Useful if the registry gets corrupted or out of sync
 */
export async function rebuildRegistry(
  config: StorageConfig = DEFAULT_STORAGE_CONFIG
): Promise<SessionRegistry> {
  const entries: RegistryEntry[] = [];
  const projectDirs = await listProjectDirectories(config.dataDir);

  for (const projectDir of projectDirs) {
    const projectName = projectDir.split('/').pop() || '';
    const branchDirs = await readdir(projectDir);

    for (const branchDir of branchDirs) {
      const branchPath = join(projectDir, branchDir);

      try {
        const stats = await stat(branchPath);
        if (!stats.isDirectory()) continue;

        const files = await readdir(branchPath);
        const mdFiles = files.filter((f) => f.endsWith('.md'));

        for (const file of mdFiles) {
          const filePath = join(branchPath, file);
          try {
            const contextFile = await readContextFile(filePath);

            // Skip init entries
            if (contextFile.frontmatter.sessionId === 'init') continue;

            entries.push({
              sessionId: contextFile.frontmatter.sessionId as string,
              projectName: contextFile.projectName,
              branch: contextFile.branch,
              timestamp: contextFile.createdAt,
              filePath,
              summary: contextFile.content.substring(0, 200),
            });
          } catch {
            // Skip files that can't be read
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    }
  }

  // Sort by timestamp (newest first)
  entries.sort((a, b) => b.timestamp - a.timestamp);

  const registry: SessionRegistry = {
    sessions: entries,
    lastUpdated: Date.now(),
  };

  await writeRegistry(registry, config);
  return registry;
}

/**
 * Sync the registry with disk - remove entries for files that no longer exist
 */
export async function syncRegistry(
  config: StorageConfig = DEFAULT_STORAGE_CONFIG
): Promise<{ removed: number; total: number }> {
  const registry = await loadRegistry(config);
  const validEntries: RegistryEntry[] = [];

  for (const entry of registry.sessions) {
    try {
      await access(entry.filePath);
      validEntries.push(entry);
    } catch {
      // File doesn't exist, skip this entry
    }
  }

  const removed = registry.sessions.length - validEntries.length;

  if (removed > 0) {
    registry.sessions = validEntries;
    registry.lastUpdated = Date.now();
    await writeRegistry(registry, config);
  }

  return {
    removed,
    total: validEntries.length,
  };
}

/**
 * Get registry statistics
 */
export async function getRegistryStats(
  config: StorageConfig = DEFAULT_STORAGE_CONFIG
): Promise<{
  totalSessions: number;
  totalProjects: number;
  oldestSession: number | null;
  newestSession: number | null;
  lastUpdated: number;
}> {
  const registry = await loadRegistry(config);

  if (registry.sessions.length === 0) {
    return {
      totalSessions: 0,
      totalProjects: 0,
      oldestSession: null,
      newestSession: null,
      lastUpdated: registry.lastUpdated,
    };
  }

  const timestamps = registry.sessions.map((s) => s.timestamp);
  const projects = new Set(registry.sessions.map((s) => s.projectName));

  return {
    totalSessions: registry.sessions.length,
    totalProjects: projects.size,
    oldestSession: Math.min(...timestamps),
    newestSession: Math.max(...timestamps),
    lastUpdated: registry.lastUpdated,
  };
}

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
import type { Session, ContextFile, SessionRegistry, StorageConfig, RegistryEntry } from '@contextcarry/types';

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
  const registryPath = join(config.dataDir, 'index.md');

  let registry: SessionRegistry;

  try {
    await access(registryPath);
    const content = await readFile(registryPath, 'utf-8');
    const parsed = grayMatter(content);
    registry = {
      sessions: (parsed.data.sessions as RegistryEntry[]) || [],
      lastUpdated: (parsed.data.lastUpdated as number) || 0,
    };
  } catch {
    // Create new registry
    registry = {
      sessions: [],
      lastUpdated: 0,
    };
  }

  // Remove existing entry with same sessionId
  registry.sessions = registry.sessions.filter((s) => s.sessionId !== entry.sessionId);

  // Add new entry
  registry.sessions.push(entry);

  // Sort by timestamp (newest first)
  registry.sessions.sort((a, b) => b.timestamp - a.timestamp);

  // Update timestamp
  registry.lastUpdated = Date.now();

  // Write back
  const parsed = grayMatter.stringify(
    `# Context Carry Session Registry\n\nThis file contains an index of all saved sessions.\n`,
    {
      sessions: registry.sessions,
      lastUpdated: registry.lastUpdated,
    }
  );
  await mkdir(dirname(registryPath), { recursive: true });
  await writeFile(registryPath, parsed, 'utf-8');
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
 */
export async function initializeStorage(config: StorageConfig = DEFAULT_STORAGE_CONFIG): Promise<void> {
  await mkdir(config.dataDir, { recursive: true });

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

          // Update registry
          const registry = await loadRegistry(config);
          registry.sessions = registry.sessions.filter((s) => s.sessionId !== sessionId);
          registry.lastUpdated = Date.now();
          const parsed = grayMatter.stringify(
            `# Context Carry Session Registry\n\nThis file contains an index of all saved sessions.\n`,
            {
              sessions: registry.sessions,
              lastUpdated: registry.lastUpdated,
            }
          );
          await writeFile(join(config.dataDir, 'index.md'), parsed, 'utf-8');

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

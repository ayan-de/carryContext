/**
 * Storage Module - Read/write .md files with gray-matter
 */

import type { Session, ContextFile, SessionRegistry, StorageConfig } from '@contextcarry/types';

export async function saveSession(session: Session, config: StorageConfig): Promise<void> {
  // TODO: Implement session saving
  throw new Error('Not implemented');
}

export async function loadSession(projectName: string, branch: string, config: StorageConfig): Promise<Session | null> {
  // TODO: Implement session loading
  throw new Error('Not implemented');
}

export async function readContextFile(filePath: string): Promise<ContextFile> {
  // TODO: Implement context file reading
  throw new Error('Not implemented');
}

export async function writeContextFile(filePath: string, content: string, frontmatter: Record<string, unknown>): Promise<void> {
  // TODO: Implement context file writing
  throw new Error('Not implemented');
}

export async function updateRegistry(entry: any, config: StorageConfig): Promise<void> {
  // TODO: Implement registry update
  throw new Error('Not implemented');
}

/**
 * Injector Module - Format LATEST.md as context preamble
 */

import type { Session } from '@contextcarry/types';

export function formatPreamble(session: Session, maxTokens?: number): string {
  // TODO: Implement preamble formatting
  throw new Error('Not implemented');
}

export function truncateToTokenLimit(text: string, maxTokens: number): string {
  // TODO: Implement token limit truncation
  throw new Error('Not implemented');
}

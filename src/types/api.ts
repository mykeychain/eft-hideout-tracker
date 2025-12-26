/**
 * API response types for /api/hideout-snapshot endpoint
 */

import type { HideoutSnapshot } from './snapshot';

export type SnapshotSource = 'cache' | 'upstream';

/** Successful snapshot response */
export interface SnapshotResponse {
  schemaVersion: string;
  fetchedAt: string; // ISO timestamp
  source?: SnapshotSource;
  data: HideoutSnapshot;
}

/** Error response when snapshot unavailable */
export interface SnapshotErrorResponse {
  error: string;
  message: string;
}

export type SnapshotAPIResponse = SnapshotResponse | SnapshotErrorResponse;

/** Type guard to check if response is an error */
export function isSnapshotError(
  response: SnapshotAPIResponse
): response is SnapshotErrorResponse {
  return 'error' in response;
}

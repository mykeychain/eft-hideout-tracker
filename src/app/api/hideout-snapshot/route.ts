import { NextResponse } from 'next/server';
import { fetchHideoutSnapshot } from '@/lib/tarkovApi';
import type { SnapshotResponse, SnapshotErrorResponse } from '@/types';

const SCHEMA_VERSION = 'v1';

// In-memory cache for fallback when upstream fails
let cachedSnapshot: SnapshotResponse | null = null;

export async function GET(): Promise<NextResponse<SnapshotResponse | SnapshotErrorResponse>> {
  try {
    const snapshot = await fetchHideoutSnapshot();

    const response: SnapshotResponse = {
      schemaVersion: SCHEMA_VERSION,
      fetchedAt: new Date().toISOString(),
      source: 'upstream',
      data: snapshot,
    };

    // Update in-memory cache for fallback
    cachedSnapshot = response;

    return NextResponse.json(response, {
      headers: {
        // Allow client-side caching for 1 hour, stale-while-revalidate for 24 hours
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to fetch hideout snapshot:', error);

    // Serve stale cache if available
    if (cachedSnapshot) {
      return NextResponse.json(
        {
          ...cachedSnapshot,
          source: 'cache',
        } as SnapshotResponse,
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600',
          },
        }
      );
    }

    // No cache available, return error
    const errorResponse: SnapshotErrorResponse = {
      error: 'UPSTREAM_UNAVAILABLE',
      message: 'Unable to fetch hideout data. Please try again later.',
    };

    return NextResponse.json(errorResponse, { status: 502 });
  }
}

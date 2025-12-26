'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { HideoutSnapshot, HideoutStation } from '@/types';

interface SnapshotContextValue {
  snapshot: HideoutSnapshot | null;
  isLoading: boolean;
  error: string | null;
  /** Map of stationId -> max level for quick lookup */
  maxLevelByStationId: Record<string, number>;
  /** Map of stationId -> station for quick lookup */
  stationById: Record<string, HideoutStation>;
}

const SnapshotContext = createContext<SnapshotContextValue | null>(null);

interface SnapshotProviderProps {
  children: ReactNode;
  snapshot: HideoutSnapshot | null;
  isLoading: boolean;
  error: string | null;
}

export function SnapshotProvider({
  children,
  snapshot,
  isLoading,
  error,
}: SnapshotProviderProps) {
  // Precompute lookup maps
  const maxLevelByStationId: Record<string, number> = {};
  const stationById: Record<string, HideoutStation> = {};

  if (snapshot) {
    for (const station of snapshot.hideoutStations) {
      stationById[station.id] = station;
      const maxLevel = Math.max(0, ...station.levels.map((l) => l.level));
      maxLevelByStationId[station.id] = maxLevel;
    }
  }

  return (
    <SnapshotContext.Provider
      value={{
        snapshot,
        isLoading,
        error,
        maxLevelByStationId,
        stationById,
      }}
    >
      {children}
    </SnapshotContext.Provider>
  );
}

export function useSnapshot(): SnapshotContextValue {
  const context = useContext(SnapshotContext);
  if (!context) {
    throw new Error('useSnapshot must be used within a SnapshotProvider');
  }
  return context;
}

'use client';

import { useMemo } from 'react';
import { useSnapshot } from '@/contexts/SnapshotContext';
import { useUserState } from '@/contexts/UserStateContext';
import {
  computeDerivedState,
  buildStationCardViewModel,
  type DerivedState,
} from '@/lib/derivedState';
import type { SortMode, StationCardViewModel } from '@/types';

/**
 * Hook that computes and memoizes derived state from snapshot + user state
 */
export function useDerivedState(sortMode: SortMode = 'needed-desc'): DerivedState | null {
  const { snapshot } = useSnapshot();
  const { onHandByItemId, stationLevelByStationId } = useUserState();

  return useMemo(() => {
    if (!snapshot) return null;

    return computeDerivedState(
      snapshot,
      stationLevelByStationId,
      onHandByItemId,
      sortMode
    );
  }, [snapshot, stationLevelByStationId, onHandByItemId, sortMode]);
}

/**
 * Hook to get a single station card view model
 * More efficient than getting all cards when only one is needed
 */
export function useStationCard(stationId: string): StationCardViewModel | null {
  const { stationById } = useSnapshot();
  const { onHandByItemId, stationLevelByStationId } = useUserState();

  return useMemo(() => {
    const station = stationById[stationId];
    if (!station) return null;

    const currentLevel = stationLevelByStationId[stationId] ?? 0;
    return buildStationCardViewModel(station, currentLevel, onHandByItemId);
  }, [stationById, stationId, stationLevelByStationId, onHandByItemId]);
}

/**
 * Hook to get just the station cards (for Hideout tab)
 */
export function useStationCards(): StationCardViewModel[] {
  const derivedState = useDerivedState();
  return derivedState?.stationCards ?? [];
}

/**
 * Hook to get just the item rows (for Items tab)
 */
export function useItemRows(sortMode: SortMode = 'needed-desc') {
  const derivedState = useDerivedState(sortMode);
  return {
    items: derivedState?.itemRows ?? [],
    groups: derivedState?.itemGroups ?? [],
  };
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useDerivedState } from '@/hooks';
import { useUserState } from '@/contexts/UserStateContext';
import { ItemsToolbar } from '@/components/ItemsToolbar';
import { ItemsList } from '@/components/ItemsList';
import { useToast } from '@/components/Toast';
import type { SortMode } from '@/types';
import styles from './ItemsTab.module.css';

const SORT_STORAGE_KEY = 'tarkov-hideout-tracker-sort-mode';

export function ItemsTab() {
  const [sortMode, setSortMode] = useState<SortMode>('needed-desc');
  const derivedState = useDerivedState(sortMode);
  const items = derivedState?.itemRows ?? [];
  const groups = derivedState?.itemGroups ?? [];
  const stationCards = derivedState?.stationCards ?? [];
  const { resetOnHand } = useUserState();
  const { notify } = useToast();
  const prevReadyRef = useRef<Map<string, boolean> | null>(null);

  // Load saved sort preference
  useEffect(() => {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    if (saved === 'needed-desc' || saved === 'alphabetical' || saved === 'category') {
      setSortMode(saved);
    }
  }, []);

  useEffect(() => {
    const readyMap = new Map<string, boolean>();

    for (const station of stationCards) {
      const isReady =
        station.isReadyToUpgrade &&
        !station.isExcluded &&
        station.currentLevel < station.maxLevel;
      readyMap.set(station.stationId, isReady);
    }

    const previous = prevReadyRef.current;
    if (previous) {
      for (const station of stationCards) {
        const wasReady = previous.get(station.stationId) ?? false;
        const isReady = readyMap.get(station.stationId) ?? false;
        if (!wasReady && isReady) {
          notify(`${station.stationName} is ready for upgrade`, {
            iconSrc: station.imageLink,
            iconAlt: station.stationName,
          });
        }
      }
    }

    prevReadyRef.current = readyMap;
  }, [stationCards, notify]);

  // Save sort preference
  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode);
    localStorage.setItem(SORT_STORAGE_KEY, mode);
  };

  const handleReset = () => {
    if (window.confirm('Reset all item counts to 0?')) {
      resetOnHand();
    }
  };

  return (
    <div className={styles.container}>
      <ItemsToolbar sortMode={sortMode} onSortChange={handleSortChange} onReset={handleReset} />
      <ItemsList
        items={items}
        groups={groups}
        grouped={sortMode === 'category'}
      />
    </div>
  );
}

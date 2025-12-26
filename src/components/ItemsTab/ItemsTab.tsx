'use client';

import { useState, useEffect } from 'react';
import { useItemRows } from '@/hooks';
import { useUserState } from '@/contexts/UserStateContext';
import { ItemsToolbar } from '@/components/ItemsToolbar';
import { ItemsList } from '@/components/ItemsList';
import type { SortMode } from '@/types';
import styles from './ItemsTab.module.css';

const SORT_STORAGE_KEY = 'tarkov-hideout-tracker-sort-mode';

export function ItemsTab() {
  const [sortMode, setSortMode] = useState<SortMode>('needed-desc');
  const { items, groups } = useItemRows(sortMode);
  const { resetOnHand } = useUserState();

  // Load saved sort preference
  useEffect(() => {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    if (saved === 'needed-desc' || saved === 'alphabetical' || saved === 'category') {
      setSortMode(saved);
    }
  }, []);

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

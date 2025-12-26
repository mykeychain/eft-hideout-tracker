'use client';

import type { SortMode } from '@/types';
import styles from './ItemsToolbar.module.css';

interface ItemsToolbarProps {
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  onReset: () => void;
}

export function ItemsToolbar({ sortMode, onSortChange, onReset }: ItemsToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <span className={styles.label}>Sort:</span>
      <div className={styles.buttons}>
        <button
          className={`${styles.btn} ${sortMode === 'needed-desc' ? styles.active : ''}`}
          onClick={() => onSortChange('needed-desc')}
        >
          Demand
        </button>
        <button
          className={`${styles.btn} ${sortMode === 'alphabetical' ? styles.active : ''}`}
          onClick={() => onSortChange('alphabetical')}
        >
          A-Z
        </button>
        <button
          className={`${styles.btn} ${sortMode === 'category' ? styles.active : ''}`}
          onClick={() => onSortChange('category')}
        >
          Category
        </button>
      </div>
      <button className={styles.resetBtn} onClick={onReset}>
        Reset Items
      </button>
    </div>
  );
}

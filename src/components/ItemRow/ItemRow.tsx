'use client';

import { memo, useCallback } from 'react';
import { useUserState } from '@/contexts/UserStateContext';
import type { ItemRowViewModel } from '@/types';
import styles from './ItemRow.module.css';

interface ItemRowProps {
  item: ItemRowViewModel;
}

export const ItemRow = memo(function ItemRow({ item }: ItemRowProps) {
  const { adjustOnHand } = useUserState();

  const handleAdjust = useCallback(
    (delta: number) => {
      adjustOnHand(item.itemId, delta);
    },
    [item.itemId, adjustOnHand]
  );

  const showPlus5 = item.neededTotal > 5;

  // Calculate progress bar color based on percentage
  const getProgressColor = (pct: number): string => {
    if (pct >= 100) return 'var(--progress-100)';
    if (pct >= 75) return 'var(--progress-75)';
    if (pct >= 50) return 'var(--progress-50)';
    if (pct >= 25) return 'var(--progress-25)';
    return 'var(--progress-0)';
  };

  return (
    <div className={`${styles.row} ${item.isComplete ? styles.complete : ''}`}>
      <img
        src={item.iconLink}
        alt=""
        className={styles.icon}
        loading="lazy"
      />
      <div className={styles.info}>
        <div className={styles.infoLeft}>
          <div className={styles.topRow}>
            <div className={styles.name}>
              <span className={styles.fullName}>{item.name}</span>
              <span className={styles.shortName}>{item.shortName}</span>
            </div>
            <div className={styles.controls}>
              <button
                className={styles.controlBtn}
                onClick={() => handleAdjust(-1)}
                disabled={item.onHand <= 0}
                aria-label="Decrease by 1"
              >
                −1
              </button>
              <button
                className={styles.controlBtn}
                onClick={() => handleAdjust(1)}
                aria-label="Increase by 1"
              >
                +1
              </button>
              {showPlus5 && (
                <button
                  className={styles.controlBtn}
                  onClick={() => handleAdjust(5)}
                  aria-label="Increase by 5"
                >
                  +5
                </button>
              )}
            </div>
          </div>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(100, item.progressPct)}%`,
                  backgroundColor: getProgressColor(item.progressPct),
                }}
              />
            </div>
          </div>
        </div>
        <div className={styles.infoRight}>
          <span className={styles.progressText}>
            {item.onHand}/{item.neededTotal}
          </span>
        </div>
      </div>
    </div>
  );
});

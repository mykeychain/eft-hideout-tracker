'use client';

import { useState, useCallback, memo } from 'react';
import { useSnapshot } from '@/contexts/SnapshotContext';
import { useUserState } from '@/contexts/UserStateContext';
import type { StationCardViewModel, StationRequirementViewModel } from '@/types';
import styles from './StationCard.module.css';

interface StationCardProps {
  station: StationCardViewModel;
}

export const StationCard = memo(function StationCard({ station }: StationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { maxLevelByStationId } = useSnapshot();
  const { setStationLevel, upgradeStation, adjustOnHand, toggleStationExclusion } = useUserState();

  const maxLevel = maxLevelByStationId[station.stationId] ?? 0;
  const isAtMax = station.currentLevel >= maxLevel;

  const handleToggleExclusion = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleStationExclusion(station.stationId);
    },
    [station.stationId, toggleStationExclusion]
  );

  const handleLevelChange = useCallback(
    (delta: number) => {
      const newLevel = station.currentLevel + delta;
      setStationLevel(station.stationId, newLevel, maxLevel);
    },
    [station.stationId, station.currentLevel, maxLevel, setStationLevel]
  );

  const handleUpgrade = useCallback(() => {
    if (!station.isReadyToUpgrade) return;

    // Only consume non-Money items
    const itemsToConsume = station.requirements
      .filter((req) => !req.isMoney)
      .map((req) => ({
        itemId: req.itemId,
        quantity: req.requiredQty,
      }));

    upgradeStation(station.stationId, maxLevel, itemsToConsume);
  }, [station, maxLevel, upgradeStation]);

  const handleHeaderClick = () => {
    // Don't allow expanding if excluded
    if (!station.isExcluded) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!station.isExcluded) {
        setIsExpanded(!isExpanded);
      }
    }
  };

  return (
    <div
      className={`${styles.card} ${station.isReadyToUpgrade && !station.isExcluded ? styles.ready : ''} ${station.isExcluded ? styles.excluded : ''}`}
    >
      <div
        className={styles.header}
        onClick={handleHeaderClick}
        onKeyDown={handleHeaderKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={station.isExcluded ? undefined : isExpanded}
      >
        <div className={styles.headerLeft}>
          {!station.isExcluded && (
            <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
          )}
          <img
            src={station.imageLink}
            alt=""
            className={styles.stationIcon}
            loading="lazy"
          />
          <span className={styles.name}>{station.stationName}</span>
          {station.isReadyToUpgrade && !station.isExcluded && (
            <span className={styles.readyBadge}>Ready</span>
          )}
        </div>
        <div className={styles.levelControl} onClick={(e) => e.stopPropagation()}>
          {station.isExcluded ? (
            <button
              className={styles.includeBtn}
              onClick={handleToggleExclusion}
              aria-label="Include station"
            >
              Include
            </button>
          ) : (
            <>
              <span className={`${styles.levelBadge} ${
                station.currentLevel === 0
                  ? styles.notBuilt
                  : isAtMax
                    ? styles.maxLevel
                    : ''
              }`}>
                {station.currentLevel === 0
                  ? 'Not Built'
                  : isAtMax
                    ? 'Max Level'
                    : `Level ${station.currentLevel}`}
              </span>
              <button
                className={styles.levelBtn}
                onClick={() => handleLevelChange(-1)}
                disabled={station.currentLevel <= 0}
                aria-label="Decrease level"
              >
                −
              </button>
              <button
                className={styles.levelBtn}
                onClick={() => handleLevelChange(1)}
                disabled={isAtMax}
                aria-label="Increase level"
              >
                +
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && !station.isExcluded && (
        <div className={styles.content}>
          {isAtMax ? (
            <p className={styles.maxLevel}>Station at max level</p>
          ) : station.requirements.length === 0 ? (
            <p className={styles.noRequirements}>No item requirements</p>
          ) : (
            <>
              <ul className={styles.requirements}>
                {station.requirements.map((req) => (
                  <RequirementRow
                    key={req.itemId}
                    requirement={req}
                    onAdjust={adjustOnHand}
                  />
                ))}
              </ul>
              {station.isReadyToUpgrade && (
                <button className={styles.upgradeBtn} onClick={handleUpgrade}>
                  Upgrade to Level {station.nextLevel}
                </button>
              )}
            </>
          )}
          {!isAtMax && (
            <button
              className={styles.excludeBtn}
              onClick={handleToggleExclusion}
              aria-label="Exclude station"
            >
              Exclude
            </button>
          )}
        </div>
      )}
    </div>
  );
});

interface RequirementRowProps {
  requirement: StationRequirementViewModel;
  onAdjust: (itemId: string, delta: number) => void;
}

/**
 * Format large numbers with locale formatting (e.g., 25000 -> "25,000")
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

const RequirementRow = memo(function RequirementRow({
  requirement,
  onAdjust,
}: RequirementRowProps) {
  const { itemId, itemName, itemShortName, iconLink, requiredQty, onHandQty, isSatisfied, isMoney } = requirement;

  // Money items: just show the required amount, no controls
  if (isMoney) {
    return (
      <li className={`${styles.requirement} ${styles.moneyRow}`}>
        <img
          src={iconLink}
          alt=""
          className={styles.itemIcon}
          loading="lazy"
        />
        <span className={styles.itemName}>
          <span className={styles.fullName}>{itemName}</span>
          <span className={styles.shortName}>{itemShortName}</span>
        </span>
        <span className={styles.moneyAmount}>{formatNumber(requiredQty)}</span>
      </li>
    );
  }

  return (
    <li className={`${styles.requirement} ${isSatisfied ? styles.satisfied : ''}`}>
      <img
        src={iconLink}
        alt=""
        className={styles.itemIcon}
        loading="lazy"
      />
      <span className={styles.itemName}>
        <span className={styles.fullName}>{itemName}</span>
        <span className={styles.shortName}>{itemShortName}</span>
      </span>
      <div className={styles.quantityControl}>
        <button
          className={styles.qtyBtn}
          onClick={() => onAdjust(itemId, -1)}
          disabled={onHandQty <= 0}
        >
          −
        </button>
        <span className={`${styles.quantity} ${isSatisfied ? styles.complete : ''}`}>
          {onHandQty}/{requiredQty}
        </span>
        <button className={styles.qtyBtn} onClick={() => onAdjust(itemId, 1)}>
          +
        </button>
      </div>
    </li>
  );
});

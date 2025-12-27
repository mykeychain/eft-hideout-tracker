'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStationCards } from '@/hooks';
import { StationCard } from '@/components/StationCard';
import styles from './StationList.module.css';

export function StationList() {
  const stationCards = useStationCards();
  const [frozenOrder, setFrozenOrder] = useState<string[] | null>(null);

  // Capture the station order on first render (when data is available)
  // This order stays frozen until the component unmounts (tab switch)
  useEffect(() => {
    if (frozenOrder === null && stationCards.length > 0) {
      setFrozenOrder(stationCards.map((s) => s.stationId));
    }
  }, [stationCards, frozenOrder]);

  // Sort stations by the frozen order to prevent jumping
  const orderedCards = useMemo(() => {
    if (!frozenOrder) return stationCards;

    const orderMap = new Map(frozenOrder.map((id, idx) => [id, idx]));
    return [...stationCards].sort((a, b) => {
      const aIdx = orderMap.get(a.stationId) ?? 999;
      const bIdx = orderMap.get(b.stationId) ?? 999;
      return aIdx - bIdx;
    });
  }, [stationCards, frozenOrder]);

  if (orderedCards.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No stations available</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {orderedCards.map((station) => (
        <StationCard key={station.stationId} station={station} />
      ))}
    </div>
  );
}

'use client';

import { useStationCards } from '@/hooks';
import { StationCard } from '@/components/StationCard';
import styles from './StationList.module.css';

export function StationList() {
  const stationCards = useStationCards();

  if (stationCards.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No stations available</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {stationCards.map((station) => (
        <StationCard key={station.stationId} station={station} />
      ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useUserState } from '@/contexts/UserStateContext';
import { StationList } from '@/components/StationList';
import styles from './HideoutTab.module.css';

export function HideoutTab() {
  const { resetStationLevels } = useUserState();
  const [listKey, setListKey] = useState(0);

  const handleReset = () => {
    if (window.confirm('Reset all station levels to 0?')) {
      resetStationLevels();
      // Force StationList to remount, resetting frozen order
      setListKey((k) => k + 1);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset Hideout
        </button>
      </div>
      <StationList key={listKey} />
    </div>
  );
}

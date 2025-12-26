'use client';

import { useUserState } from '@/contexts/UserStateContext';
import { StationList } from '@/components/StationList';
import styles from './HideoutTab.module.css';

export function HideoutTab() {
  const { resetStationLevels } = useUserState();

  const handleReset = () => {
    if (window.confirm('Reset all station levels to 0?')) {
      resetStationLevels();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset Hideout
        </button>
      </div>
      <StationList />
    </div>
  );
}

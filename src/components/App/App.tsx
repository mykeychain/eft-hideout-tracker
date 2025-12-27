'use client';

import { useEffect, useState, useCallback } from 'react';
import { SnapshotProvider } from '@/contexts/SnapshotContext';
import { UserStateProvider } from '@/contexts/UserStateContext';
import { AppShell } from '@/components/AppShell';
import { HideoutTab } from '@/components/HideoutTab';
import { ItemsTab } from '@/components/ItemsTab';
import { loadUserState } from '@/lib/db';
import { isSnapshotError, type HideoutSnapshot, type UserState } from '@/types';
import styles from './App.module.css';

type LoadingPhase = 'fetching' | 'ready' | 'error';

export function App() {
  const [snapshot, setSnapshot] = useState<HideoutSnapshot | null>(null);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [phase, setPhase] = useState<LoadingPhase>('fetching');
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    setPhase('fetching');
    setError(null);

    try {
      // Fetch snapshot and load user state in parallel
      const [snapshotResponse, loadedUserState] = await Promise.all([
        fetch('/api/hideout-snapshot')
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
          }),
        loadUserState().catch((err) => {
          // IndexedDB failure is non-fatal, start with empty state
          console.warn('Failed to load user state from IndexedDB:', err);
          return { onHandByItemId: {}, stationLevelByStationId: {}, excludedStationIds: {} };
        }),
      ]);

      if (isSnapshotError(snapshotResponse)) {
        setError(snapshotResponse.message);
        setPhase('error');
        return;
      }

      setSnapshot(snapshotResponse.data);
      setUserState(loadedUserState);
      setPhase('ready');
    } catch (err) {
      console.error('Failed to initialize app:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load hideout data. Please check your connection.'
      );
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (phase === 'fetching') {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading hideout data...</p>
        <p className={styles.loadingHint}>Fetching from tarkov.dev</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className={styles.error}>
        <div className={styles.errorIcon}>!</div>
        <p className={styles.errorTitle}>Failed to load</p>
        <p className={styles.errorMessage}>{error}</p>
        <button className={styles.retryButton} onClick={initialize}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <SnapshotProvider
      snapshot={snapshot}
      isLoading={false}
      error={null}
    >
      <UserStateProvider
        initialOnHand={userState?.onHandByItemId ?? {}}
        initialStationLevels={userState?.stationLevelByStationId ?? {}}
        initialExcludedStations={userState?.excludedStationIds ?? {}}
      >
        <AppShell
          hideoutContent={<HideoutTab />}
          itemsContent={<ItemsTab />}
        />
      </UserStateProvider>
    </SnapshotProvider>
  );
}

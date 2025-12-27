'use client';

import { useState, useEffect, type ReactNode } from 'react';
import styles from './AppShell.module.css';

type TabId = 'hideout' | 'items';

const STORAGE_KEY = 'tarkov-hideout-tracker-active-tab';

interface AppShellProps {
  hideoutContent: ReactNode;
  itemsContent: ReactNode;
}

export function AppShell({ hideoutContent, itemsContent }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>('hideout');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved tab preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'hideout' || saved === 'items') {
      setActiveTab(saved);
    }
    setIsHydrated(true);
  }, []);

  // Save tab preference when it changes
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    localStorage.setItem(STORAGE_KEY, tab);
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>Hideout Tracker</h1>
        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'hideout' ? styles.active : ''}`}
            onClick={() => handleTabChange('hideout')}
            aria-selected={activeTab === 'hideout'}
          >
            Hideout
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'items' ? styles.active : ''}`}
            onClick={() => handleTabChange('items')}
            aria-selected={activeTab === 'items'}
          >
            Items
          </button>
        </nav>
      </header>
      <main className={styles.content}>
        {!isHydrated ? (
          <div className={styles.loading}>Loading...</div>
        ) : activeTab === 'hideout' ? (
          hideoutContent
        ) : (
          itemsContent
        )}
      </main>
      <footer className={styles.footer}>
        <p>Not affiliated with Battlestate Games</p>
        <p>
          Data from <a href="https://tarkov.dev" target="_blank" rel="noopener noreferrer">tarkov.dev</a>
          {' · '}
          <a href="https://github.com/mykeychain/eft-hideout-tracker" target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
      </footer>
    </div>
  );
}

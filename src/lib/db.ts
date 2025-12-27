/**
 * IndexedDB persistence layer using idb
 * Stores user state: on-hand item quantities and station levels
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { OnHandByItemId, StationLevelByStationId, ExcludedStationIds, UserState } from '@/types';

const DB_NAME = 'tarkov-hideout-tracker';
const DB_VERSION = 2;

// Store names
const STORE_ON_HAND = 'onHand';
const STORE_STATION_LEVELS = 'stationLevels';
const STORE_EXCLUDED_STATIONS = 'excludedStations';

type HideoutDB = IDBPDatabase<{
  [STORE_ON_HAND]: {
    key: string;
    value: number;
  };
  [STORE_STATION_LEVELS]: {
    key: string;
    value: number;
  };
  [STORE_EXCLUDED_STATIONS]: {
    key: string;
    value: boolean;
  };
}>;

let dbPromise: Promise<HideoutDB> | null = null;

/**
 * Get or initialize the database connection
 */
function getDB(): Promise<HideoutDB> {
  if (!dbPromise) {
    dbPromise = openDB<{
      [STORE_ON_HAND]: { key: string; value: number };
      [STORE_STATION_LEVELS]: { key: string; value: number };
      [STORE_EXCLUDED_STATIONS]: { key: string; value: boolean };
    }>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_ON_HAND)) {
          db.createObjectStore(STORE_ON_HAND);
        }
        if (!db.objectStoreNames.contains(STORE_STATION_LEVELS)) {
          db.createObjectStore(STORE_STATION_LEVELS);
        }
        if (!db.objectStoreNames.contains(STORE_EXCLUDED_STATIONS)) {
          db.createObjectStore(STORE_EXCLUDED_STATIONS);
        }
      },
    });
  }
  return dbPromise;
}

// ============================================
// Read Functions
// ============================================

/**
 * Load all on-hand quantities from IndexedDB
 */
export async function loadOnHandQuantities(): Promise<OnHandByItemId> {
  const db = await getDB();
  const tx = db.transaction(STORE_ON_HAND, 'readonly');
  const store = tx.objectStore(STORE_ON_HAND);

  const result: OnHandByItemId = {};
  let cursor = await store.openCursor();

  while (cursor) {
    result[cursor.key] = cursor.value;
    cursor = await cursor.continue();
  }

  return result;
}

/**
 * Load all station levels from IndexedDB
 */
export async function loadStationLevels(): Promise<StationLevelByStationId> {
  const db = await getDB();
  const tx = db.transaction(STORE_STATION_LEVELS, 'readonly');
  const store = tx.objectStore(STORE_STATION_LEVELS);

  const result: StationLevelByStationId = {};
  let cursor = await store.openCursor();

  while (cursor) {
    result[cursor.key] = cursor.value;
    cursor = await cursor.continue();
  }

  return result;
}

/**
 * Load all excluded station IDs from IndexedDB
 */
export async function loadExcludedStations(): Promise<ExcludedStationIds> {
  const db = await getDB();
  const tx = db.transaction(STORE_EXCLUDED_STATIONS, 'readonly');
  const store = tx.objectStore(STORE_EXCLUDED_STATIONS);

  const result: ExcludedStationIds = {};
  let cursor = await store.openCursor();

  while (cursor) {
    result[cursor.key] = cursor.value;
    cursor = await cursor.continue();
  }

  return result;
}

/**
 * Load complete user state from IndexedDB
 */
export async function loadUserState(): Promise<UserState> {
  const [onHandByItemId, stationLevelByStationId, excludedStationIds] = await Promise.all([
    loadOnHandQuantities(),
    loadStationLevels(),
    loadExcludedStations(),
  ]);

  return { onHandByItemId, stationLevelByStationId, excludedStationIds };
}

// ============================================
// Validation
// ============================================

/**
 * Clamp on-hand quantity to valid range (>= 0)
 */
export function clampOnHand(value: number): number {
  return Math.max(0, Math.floor(value));
}

/**
 * Clamp station level to valid range (0..maxLevel)
 */
export function clampStationLevel(value: number, maxLevel: number): number {
  return Math.max(0, Math.min(maxLevel, Math.floor(value)));
}

// ============================================
// Write Functions (with debouncing)
// ============================================

// Pending writes buffer
const pendingOnHand: Map<string, number> = new Map();
const pendingStationLevels: Map<string, number> = new Map();

let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 300;

/**
 * Flush all pending writes to IndexedDB
 */
export async function flushPendingWrites(): Promise<void> {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  const onHandEntries = Array.from(pendingOnHand.entries());
  const stationLevelEntries = Array.from(pendingStationLevels.entries());

  // Clear pending buffers
  pendingOnHand.clear();
  pendingStationLevels.clear();

  if (onHandEntries.length === 0 && stationLevelEntries.length === 0) {
    return;
  }

  const db = await getDB();

  // Write on-hand quantities
  if (onHandEntries.length > 0) {
    const tx = db.transaction(STORE_ON_HAND, 'readwrite');
    const store = tx.objectStore(STORE_ON_HAND);

    for (const [itemId, quantity] of onHandEntries) {
      if (quantity === 0) {
        await store.delete(itemId);
      } else {
        await store.put(quantity, itemId);
      }
    }

    await tx.done;
  }

  // Write station levels
  if (stationLevelEntries.length > 0) {
    const tx = db.transaction(STORE_STATION_LEVELS, 'readwrite');
    const store = tx.objectStore(STORE_STATION_LEVELS);

    for (const [stationId, level] of stationLevelEntries) {
      if (level === 0) {
        await store.delete(stationId);
      } else {
        await store.put(level, stationId);
      }
    }

    await tx.done;
  }
}

/**
 * Schedule a debounced flush
 */
function scheduleFlush(): void {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }
  flushTimeout = setTimeout(() => {
    flushPendingWrites();
  }, DEBOUNCE_MS);
}

/**
 * Save on-hand quantity for an item (debounced)
 */
export function saveOnHandQuantity(itemId: string, quantity: number): void {
  const clamped = clampOnHand(quantity);
  pendingOnHand.set(itemId, clamped);
  scheduleFlush();
}

/**
 * Save station level (debounced)
 */
export function saveStationLevel(stationId: string, level: number, maxLevel: number): void {
  const clamped = clampStationLevel(level, maxLevel);
  pendingStationLevels.set(stationId, clamped);
  scheduleFlush();
}

/**
 * Batch save multiple on-hand quantities (debounced)
 */
export function saveOnHandQuantities(quantities: OnHandByItemId): void {
  for (const [itemId, quantity] of Object.entries(quantities)) {
    pendingOnHand.set(itemId, clampOnHand(quantity));
  }
  scheduleFlush();
}

/**
 * Batch save multiple station levels (debounced)
 */
export function saveStationLevels(
  levels: StationLevelByStationId,
  maxLevels: Record<string, number>
): void {
  for (const [stationId, level] of Object.entries(levels)) {
    const maxLevel = maxLevels[stationId] ?? Infinity;
    pendingStationLevels.set(stationId, clampStationLevel(level, maxLevel));
  }
  scheduleFlush();
}

// ============================================
// Visibility Change Handler
// ============================================

let visibilityListenerAttached = false;

/**
 * Set up visibility change listener to flush writes when page is hidden
 */
export function setupVisibilityFlush(): void {
  if (visibilityListenerAttached || typeof document === 'undefined') {
    return;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingWrites();
    }
  });

  // Also flush on beforeunload
  window.addEventListener('beforeunload', () => {
    flushPendingWrites();
  });

  visibilityListenerAttached = true;
}

// ============================================
// Clear/Reset Functions
// ============================================

/**
 * Clear all on-hand quantities from IndexedDB
 */
export async function clearOnHandQuantities(): Promise<void> {
  // Clear pending writes for on-hand
  pendingOnHand.clear();

  const db = await getDB();
  const tx = db.transaction(STORE_ON_HAND, 'readwrite');
  await tx.objectStore(STORE_ON_HAND).clear();
  await tx.done;
}

/**
 * Clear all station levels from IndexedDB
 */
export async function clearStationLevels(): Promise<void> {
  // Clear pending writes for station levels
  pendingStationLevels.clear();

  const db = await getDB();
  const tx = db.transaction(STORE_STATION_LEVELS, 'readwrite');
  await tx.objectStore(STORE_STATION_LEVELS).clear();
  await tx.done;
}

/**
 * Save excluded station status (immediate, not debounced)
 */
export async function saveExcludedStation(stationId: string, excluded: boolean): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_EXCLUDED_STATIONS, 'readwrite');
  const store = tx.objectStore(STORE_EXCLUDED_STATIONS);

  if (excluded) {
    await store.put(true, stationId);
  } else {
    await store.delete(stationId);
  }

  await tx.done;
}

/**
 * Clear all excluded stations from IndexedDB
 */
export async function clearExcludedStations(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_EXCLUDED_STATIONS, 'readwrite');
  await tx.objectStore(STORE_EXCLUDED_STATIONS).clear();
  await tx.done;
}

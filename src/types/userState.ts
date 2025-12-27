/**
 * Types for user-persisted state (stored in IndexedDB)
 */

/** Map of item ID -> on-hand quantity */
export type OnHandByItemId = Record<string, number>;

/** Map of station ID -> current level (0..max) */
export type StationLevelByStationId = Record<string, number>;

/** Map of station ID -> excluded from tracking */
export type ExcludedStationIds = Record<string, boolean>;

/** Complete user state persisted to IndexedDB */
export interface UserState {
  onHandByItemId: OnHandByItemId;
  stationLevelByStationId: StationLevelByStationId;
  excludedStationIds: ExcludedStationIds;
}

/** UI preferences (can be stored in localStorage) */
export type SortMode = 'needed-desc' | 'alphabetical' | 'category';

export interface UIPreferences {
  sortMode: SortMode;
  activeTab: 'hideout' | 'items';
}

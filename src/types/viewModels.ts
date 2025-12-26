/**
 * View model types - display-ready data objects consumed by React components
 * Derived from snapshot data + user state
 */

/** Single requirement within a station's next upgrade */
export interface StationRequirementViewModel {
  itemId: string;
  itemName: string;
  itemShortName: string;
  iconLink: string;
  requiredQty: number;
  onHandQty: number;
  isSatisfied: boolean;
  /** True if this is a Money item (no tracking, always assumed satisfied) */
  isMoney: boolean;
}

/** Station card for Hideout tab */
export interface StationCardViewModel {
  stationId: string;
  stationName: string;
  imageLink: string;
  currentLevel: number;
  maxLevel: number;
  nextLevel: number | null;
  requirements: StationRequirementViewModel[];
  isReadyToUpgrade: boolean;
}

/** Item row for Items tab (shopping list) */
export interface ItemRowViewModel {
  itemId: string;
  name: string;
  shortName: string;
  iconLink: string;
  categoryId: string;
  categoryName: string;
  neededTotal: number;
  onHand: number;
  progressPct: number;
  isComplete: boolean;
}

/** Grouped items for category view */
export interface ItemCategoryGroup {
  categoryId: string;
  categoryName: string;
  items: ItemRowViewModel[];
}

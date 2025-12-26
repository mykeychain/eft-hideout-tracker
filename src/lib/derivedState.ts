/**
 * Derived state computation functions
 * Pure functions that compute view models from snapshot + user state
 */

import type {
  HideoutSnapshot,
  HideoutStation,
  HideoutLevel,
  OnHandByItemId,
  StationLevelByStationId,
  StationCardViewModel,
  StationRequirementViewModel,
  ItemRowViewModel,
  ItemCategoryGroup,
  SortMode,
} from '@/types';

// Category name for money items (filtered from Items tab, ignored in readiness)
const MONEY_CATEGORY_NAME = 'Money';

/**
 * Check if an item is a Money category item
 */
export function isMoneyItem(categoryName: string): boolean {
  return categoryName === MONEY_CATEGORY_NAME;
}

// ============================================
// Step A: Determine next upgrade per station
// ============================================

/**
 * Get the next level data for a station, or null if at max
 */
export function getNextLevel(
  station: HideoutStation,
  currentLevel: number
): HideoutLevel | null {
  const nextLevelNum = currentLevel + 1;
  return station.levels.find((l) => l.level === nextLevelNum) ?? null;
}

// ============================================
// Step B: Compute station readiness
// ============================================

/**
 * Build a StationCardViewModel for a single station
 */
export function buildStationCardViewModel(
  station: HideoutStation,
  currentLevel: number,
  onHandByItemId: OnHandByItemId
): StationCardViewModel {
  const maxLevel = Math.max(0, ...station.levels.map((l) => l.level));
  const nextLevel = getNextLevel(station, currentLevel);

  const requirements: StationRequirementViewModel[] = [];
  let isReadyToUpgrade = true;

  if (nextLevel) {
    for (const req of nextLevel.itemRequirements) {
      const isMoney = isMoneyItem(req.item.category.name);
      const onHandQty = isMoney ? 0 : (onHandByItemId[req.item.id] ?? 0);
      // Money items are always considered satisfied
      const isSatisfied = isMoney ? true : onHandQty >= req.quantity;

      // Only non-money items affect readiness
      if (!isMoney && !isSatisfied) {
        isReadyToUpgrade = false;
      }

      requirements.push({
        itemId: req.item.id,
        itemName: req.item.name,
        itemShortName: req.item.shortName,
        iconLink: req.item.iconLink,
        requiredQty: req.quantity,
        onHandQty,
        isSatisfied,
        isMoney,
      });
    }
    // Sort: money items first, then alphabetically by name
    requirements.sort((a, b) => {
      if (a.isMoney && !b.isMoney) return -1;
      if (!a.isMoney && b.isMoney) return 1;
      return a.itemName.localeCompare(b.itemName);
    });
  } else {
    // At max level, no requirements
    isReadyToUpgrade = false;
  }

  return {
    stationId: station.id,
    stationName: station.name,
    imageLink: station.imageLink,
    currentLevel,
    maxLevel,
    nextLevel: nextLevel?.level ?? null,
    requirements,
    isReadyToUpgrade,
  };
}

/**
 * Build all StationCardViewModels sorted alphabetically
 */
export function buildAllStationCards(
  snapshot: HideoutSnapshot,
  stationLevelByStationId: StationLevelByStationId,
  onHandByItemId: OnHandByItemId
): StationCardViewModel[] {
  const cards = snapshot.hideoutStations.map((station) => {
    const currentLevel = stationLevelByStationId[station.id] ?? 0;
    return buildStationCardViewModel(station, currentLevel, onHandByItemId);
  });

  // Sort alphabetically by station name
  return cards.sort((a, b) => a.stationName.localeCompare(b.stationName));
}

// ============================================
// Step C: Aggregate "Needed Now" by item
// ============================================

interface NeededItem {
  itemId: string;
  name: string;
  shortName: string;
  iconLink: string;
  categoryId: string;
  categoryName: string;
  neededTotal: number;
}

/**
 * Aggregate item requirements across all stations' next upgrades
 * Excludes Money category items (they're not tracked in Items tab)
 */
export function aggregateNeededNow(
  snapshot: HideoutSnapshot,
  stationLevelByStationId: StationLevelByStationId
): Map<string, NeededItem> {
  const neededByItemId = new Map<string, NeededItem>();

  for (const station of snapshot.hideoutStations) {
    const currentLevel = stationLevelByStationId[station.id] ?? 0;
    const nextLevel = getNextLevel(station, currentLevel);

    if (!nextLevel) continue;

    for (const req of nextLevel.itemRequirements) {
      // Skip Money items - they're not tracked in the Items tab
      if (isMoneyItem(req.item.category.name)) {
        continue;
      }

      const existing = neededByItemId.get(req.item.id);

      if (existing) {
        existing.neededTotal += req.quantity;
      } else {
        neededByItemId.set(req.item.id, {
          itemId: req.item.id,
          name: req.item.name,
          shortName: req.item.shortName,
          iconLink: req.item.iconLink,
          categoryId: req.item.category.id,
          categoryName: req.item.category.name,
          neededTotal: req.quantity,
        });
      }
    }
  }

  return neededByItemId;
}

// ============================================
// Step D: Build ItemRow view models
// ============================================

/**
 * Build ItemRowViewModels from aggregated needed items
 */
export function buildItemRowViewModels(
  neededByItemId: Map<string, NeededItem>,
  onHandByItemId: OnHandByItemId
): ItemRowViewModel[] {
  const items: ItemRowViewModel[] = [];

  for (const needed of neededByItemId.values()) {
    const onHand = onHandByItemId[needed.itemId] ?? 0;
    const progressPct = needed.neededTotal > 0
      ? Math.min(100, Math.round((onHand / needed.neededTotal) * 100))
      : 100;

    items.push({
      itemId: needed.itemId,
      name: needed.name,
      shortName: needed.shortName,
      iconLink: needed.iconLink,
      categoryId: needed.categoryId,
      categoryName: needed.categoryName,
      neededTotal: needed.neededTotal,
      onHand,
      progressPct,
      isComplete: onHand >= needed.neededTotal,
    });
  }

  return items;
}

// ============================================
// Step E: Apply sorting/grouping
// ============================================

/**
 * Sort items by needed quantity (descending), tie-break by name
 */
export function sortByNeededDesc(items: ItemRowViewModel[]): ItemRowViewModel[] {
  return [...items].sort((a, b) => {
    const neededDiff = b.neededTotal - a.neededTotal;
    if (neededDiff !== 0) return neededDiff;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort items alphabetically by name
 */
export function sortAlphabetically(items: ItemRowViewModel[]): ItemRowViewModel[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Group items by category, sort categories A-Z, items A-Z within each
 */
export function groupByCategory(items: ItemRowViewModel[]): ItemCategoryGroup[] {
  const groupMap = new Map<string, ItemCategoryGroup>();

  for (const item of items) {
    let group = groupMap.get(item.categoryId);
    if (!group) {
      group = {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        items: [],
      };
      groupMap.set(item.categoryId, group);
    }
    group.items.push(item);
  }

  // Sort items within each group
  for (const group of groupMap.values()) {
    group.items.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Sort groups by category name and return
  return Array.from(groupMap.values()).sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName)
  );
}

/**
 * Apply sort mode to items
 */
export function applySortMode(
  items: ItemRowViewModel[],
  sortMode: SortMode
): ItemRowViewModel[] {
  switch (sortMode) {
    case 'needed-desc':
      return sortByNeededDesc(items);
    case 'alphabetical':
      return sortAlphabetically(items);
    case 'category':
      // For flat list, sort by category then name
      return [...items].sort((a, b) => {
        const catDiff = a.categoryName.localeCompare(b.categoryName);
        if (catDiff !== 0) return catDiff;
        return a.name.localeCompare(b.name);
      });
    default:
      return items;
  }
}

// ============================================
// Combined pipeline
// ============================================

export interface DerivedState {
  stationCards: StationCardViewModel[];
  itemRows: ItemRowViewModel[];
  itemGroups: ItemCategoryGroup[];
}

/**
 * Run the complete derived computation pipeline
 */
export function computeDerivedState(
  snapshot: HideoutSnapshot,
  stationLevelByStationId: StationLevelByStationId,
  onHandByItemId: OnHandByItemId,
  sortMode: SortMode = 'needed-desc'
): DerivedState {
  // Build station cards
  const stationCards = buildAllStationCards(
    snapshot,
    stationLevelByStationId,
    onHandByItemId
  );

  // Aggregate needed items
  const neededByItemId = aggregateNeededNow(snapshot, stationLevelByStationId);

  // Build item row view models
  const rawItems = buildItemRowViewModels(neededByItemId, onHandByItemId);

  // Apply sorting
  const itemRows = applySortMode(rawItems, sortMode);

  // Build category groups (always available for category view)
  const itemGroups = groupByCategory(rawItems);

  return {
    stationCards,
    itemRows,
    itemGroups,
  };
}

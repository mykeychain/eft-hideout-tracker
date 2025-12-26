import { describe, it, expect } from 'vitest';
import {
  getNextLevel,
  buildStationCardViewModel,
  aggregateNeededNow,
  buildItemRowViewModels,
  sortByNeededDesc,
  sortAlphabetically,
  groupByCategory,
  applySortMode,
  computeDerivedState,
  isMoneyItem,
} from './derivedState';
import type { HideoutStation, HideoutSnapshot } from '@/types';

// Test fixtures
const mockItem = (id: string, name: string, category = 'Tools') => ({
  id,
  name,
  shortName: name.substring(0, 4),
  iconLink: `https://example.com/${id}.png`,
  category: { id: `cat-${category}`, name: category },
});

const mockStation: HideoutStation = {
  id: 'station-1',
  name: 'Workbench',
  imageLink: 'https://example.com/workbench.png',
  levels: [
    {
      id: 'level-1',
      level: 1,
      itemRequirements: [
        { quantity: 5, item: mockItem('item-1', 'Screwdriver') },
        { quantity: 3, item: mockItem('item-2', 'Wrench') },
      ],
    },
    {
      id: 'level-2',
      level: 2,
      itemRequirements: [
        { quantity: 10, item: mockItem('item-1', 'Screwdriver') },
        { quantity: 5, item: mockItem('item-3', 'Hammer', 'Hardware') },
      ],
    },
    {
      id: 'level-3',
      level: 3,
      itemRequirements: [],
    },
  ],
};

const mockStationWithMoney: HideoutStation = {
  id: 'station-money',
  name: 'Station With Money',
  imageLink: 'https://example.com/station-money.png',
  levels: [
    {
      id: 'level-m1',
      level: 1,
      itemRequirements: [
        { quantity: 25000, item: mockItem('roubles', 'Roubles', 'Money') },
        { quantity: 5, item: mockItem('item-1', 'Screwdriver') },
      ],
    },
  ],
};

const mockSnapshot: HideoutSnapshot = {
  hideoutStations: [
    mockStation,
    {
      id: 'station-2',
      name: 'Generator',
      imageLink: 'https://example.com/generator.png',
      levels: [
        {
          id: 'gen-level-1',
          level: 1,
          itemRequirements: [
            { quantity: 2, item: mockItem('item-2', 'Wrench') },
            { quantity: 4, item: mockItem('item-4', 'Fuel', 'Consumables') },
          ],
        },
      ],
    },
  ],
};

const mockSnapshotWithMoney: HideoutSnapshot = {
  hideoutStations: [mockStationWithMoney],
};

describe('isMoneyItem', () => {
  it('returns true for Money category', () => {
    expect(isMoneyItem('Money')).toBe(true);
  });

  it('returns false for other categories', () => {
    expect(isMoneyItem('Tools')).toBe(false);
    expect(isMoneyItem('Hardware')).toBe(false);
    expect(isMoneyItem('')).toBe(false);
  });
});

describe('getNextLevel', () => {
  it('returns the next level when it exists', () => {
    const result = getNextLevel(mockStation, 0);
    expect(result).not.toBeNull();
    expect(result?.level).toBe(1);
  });

  it('returns the next level for intermediate levels', () => {
    const result = getNextLevel(mockStation, 1);
    expect(result).not.toBeNull();
    expect(result?.level).toBe(2);
  });

  it('returns null when at max level', () => {
    const result = getNextLevel(mockStation, 3);
    expect(result).toBeNull();
  });

  it('returns null when beyond max level', () => {
    const result = getNextLevel(mockStation, 5);
    expect(result).toBeNull();
  });
});

describe('buildStationCardViewModel', () => {
  it('builds view model with requirements', () => {
    const onHand = { 'item-1': 3, 'item-2': 5 };
    const result = buildStationCardViewModel(mockStation, 0, onHand);

    expect(result.stationId).toBe('station-1');
    expect(result.stationName).toBe('Workbench');
    expect(result.currentLevel).toBe(0);
    expect(result.maxLevel).toBe(3);
    expect(result.nextLevel).toBe(1);
    expect(result.requirements).toHaveLength(2);
  });

  it('calculates requirement satisfaction correctly', () => {
    const onHand = { 'item-1': 5, 'item-2': 2 };
    const result = buildStationCardViewModel(mockStation, 0, onHand);

    const screwdriver = result.requirements.find((r) => r.itemId === 'item-1');
    const wrench = result.requirements.find((r) => r.itemId === 'item-2');

    expect(screwdriver?.isSatisfied).toBe(true); // 5 >= 5
    expect(wrench?.isSatisfied).toBe(false); // 2 < 3
  });

  it('marks station ready when all requirements satisfied', () => {
    const onHand = { 'item-1': 10, 'item-2': 5 };
    const result = buildStationCardViewModel(mockStation, 0, onHand);

    expect(result.isReadyToUpgrade).toBe(true);
  });

  it('marks station not ready when requirements not satisfied', () => {
    const onHand = { 'item-1': 1 };
    const result = buildStationCardViewModel(mockStation, 0, onHand);

    expect(result.isReadyToUpgrade).toBe(false);
  });

  it('handles max level correctly', () => {
    const result = buildStationCardViewModel(mockStation, 3, {});

    expect(result.nextLevel).toBeNull();
    expect(result.requirements).toHaveLength(0);
    expect(result.isReadyToUpgrade).toBe(false);
  });

  it('handles missing on-hand quantities as zero', () => {
    const result = buildStationCardViewModel(mockStation, 0, {});

    expect(result.requirements[0].onHandQty).toBe(0);
    expect(result.requirements[0].isSatisfied).toBe(false);
  });

  it('marks Money items with isMoney flag', () => {
    const result = buildStationCardViewModel(mockStationWithMoney, 0, {});

    const moneyReq = result.requirements.find((r) => r.itemId === 'roubles');
    const itemReq = result.requirements.find((r) => r.itemId === 'item-1');

    expect(moneyReq?.isMoney).toBe(true);
    expect(itemReq?.isMoney).toBe(false);
  });

  it('treats Money items as always satisfied', () => {
    const result = buildStationCardViewModel(mockStationWithMoney, 0, {});

    const moneyReq = result.requirements.find((r) => r.itemId === 'roubles');
    expect(moneyReq?.isSatisfied).toBe(true);
    expect(moneyReq?.onHandQty).toBe(0); // No tracking for money
  });

  it('ignores Money items in readiness check', () => {
    // Only non-money item satisfied
    const onHand = { 'item-1': 5 };
    const result = buildStationCardViewModel(mockStationWithMoney, 0, onHand);

    // Should be ready even though we don't have the money tracked
    expect(result.isReadyToUpgrade).toBe(true);
  });
});

describe('aggregateNeededNow', () => {
  it('aggregates items across stations', () => {
    const stationLevels = { 'station-1': 0, 'station-2': 0 };
    const result = aggregateNeededNow(mockSnapshot, stationLevels);

    // item-2 (Wrench) needed by both stations: 3 + 2 = 5
    const wrench = result.get('item-2');
    expect(wrench?.neededTotal).toBe(5);
  });

  it('skips stations at max level', () => {
    const stationLevels = { 'station-1': 3, 'station-2': 1 };
    const result = aggregateNeededNow(mockSnapshot, stationLevels);

    // Only station-1 at max, station-2 also at max (only has 1 level)
    expect(result.size).toBe(0);
  });

  it('handles empty station levels', () => {
    const result = aggregateNeededNow(mockSnapshot, {});

    // All stations start at level 0, need level 1 items
    expect(result.size).toBeGreaterThan(0);
  });

  it('excludes Money items from aggregation', () => {
    const result = aggregateNeededNow(mockSnapshotWithMoney, {});

    // Should have the screwdriver but not the roubles
    expect(result.has('item-1')).toBe(true);
    expect(result.has('roubles')).toBe(false);
  });
});

describe('buildItemRowViewModels', () => {
  it('builds view models with progress', () => {
    const needed = new Map([
      ['item-1', {
        itemId: 'item-1',
        name: 'Screwdriver',
        shortName: 'Scre',
        iconLink: 'https://example.com/item-1.png',
        categoryId: 'cat-Tools',
        categoryName: 'Tools',
        neededTotal: 10,
      }],
    ]);
    const onHand = { 'item-1': 5 };

    const result = buildItemRowViewModels(needed, onHand);

    expect(result).toHaveLength(1);
    expect(result[0].progressPct).toBe(50);
    expect(result[0].isComplete).toBe(false);
  });

  it('caps progress at 100%', () => {
    const needed = new Map([
      ['item-1', {
        itemId: 'item-1',
        name: 'Screwdriver',
        shortName: 'Scre',
        iconLink: 'https://example.com/item-1.png',
        categoryId: 'cat-Tools',
        categoryName: 'Tools',
        neededTotal: 5,
      }],
    ]);
    const onHand = { 'item-1': 10 };

    const result = buildItemRowViewModels(needed, onHand);

    expect(result[0].progressPct).toBe(100);
    expect(result[0].isComplete).toBe(true);
  });
});

describe('sorting functions', () => {
  const items = [
    { itemId: '1', name: 'Zebra', neededTotal: 5, categoryId: 'cat-1', categoryName: 'Animals' },
    { itemId: '2', name: 'Apple', neededTotal: 10, categoryId: 'cat-2', categoryName: 'Food' },
    { itemId: '3', name: 'Banana', neededTotal: 10, categoryId: 'cat-2', categoryName: 'Food' },
  ] as any[];

  describe('sortByNeededDesc', () => {
    it('sorts by needed descending, then by name', () => {
      const result = sortByNeededDesc(items);

      expect(result[0].name).toBe('Apple'); // 10, A
      expect(result[1].name).toBe('Banana'); // 10, B
      expect(result[2].name).toBe('Zebra'); // 5
    });
  });

  describe('sortAlphabetically', () => {
    it('sorts by name A-Z', () => {
      const result = sortAlphabetically(items);

      expect(result[0].name).toBe('Apple');
      expect(result[1].name).toBe('Banana');
      expect(result[2].name).toBe('Zebra');
    });
  });

  describe('groupByCategory', () => {
    it('groups items by category', () => {
      const result = groupByCategory(items);

      expect(result).toHaveLength(2);
      expect(result[0].categoryName).toBe('Animals');
      expect(result[1].categoryName).toBe('Food');
    });

    it('sorts items within groups alphabetically', () => {
      const result = groupByCategory(items);
      const foodGroup = result.find((g) => g.categoryName === 'Food');

      expect(foodGroup?.items[0].name).toBe('Apple');
      expect(foodGroup?.items[1].name).toBe('Banana');
    });
  });

  describe('applySortMode', () => {
    it('applies needed-desc sort', () => {
      const result = applySortMode(items, 'needed-desc');
      expect(result[0].neededTotal).toBe(10);
    });

    it('applies alphabetical sort', () => {
      const result = applySortMode(items, 'alphabetical');
      expect(result[0].name).toBe('Apple');
    });

    it('applies category sort', () => {
      const result = applySortMode(items, 'category');
      expect(result[0].categoryName).toBe('Animals');
    });
  });
});

describe('computeDerivedState', () => {
  it('computes complete derived state', () => {
    const stationLevels = { 'station-1': 0 };
    const onHand = { 'item-1': 3 };

    const result = computeDerivedState(
      mockSnapshot,
      stationLevels,
      onHand,
      'needed-desc'
    );

    expect(result.stationCards).toHaveLength(2);
    expect(result.itemRows.length).toBeGreaterThan(0);
    expect(result.itemGroups.length).toBeGreaterThan(0);
  });

  it('sorts station cards alphabetically', () => {
    const result = computeDerivedState(mockSnapshot, {}, {}, 'needed-desc');

    expect(result.stationCards[0].stationName).toBe('Generator');
    expect(result.stationCards[1].stationName).toBe('Workbench');
  });
});

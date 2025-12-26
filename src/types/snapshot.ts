/**
 * Types for the hideout snapshot data from tarkov.dev API
 * These represent the read-only data fetched from the backend
 */

export interface Category {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  shortName: string;
  iconLink: string;
  category: Category;
}

export interface ItemRequirement {
  quantity: number;
  item: Item;
}

export interface HideoutLevel {
  id: string;
  level: number;
  itemRequirements: ItemRequirement[];
}

export interface HideoutStation {
  id: string;
  name: string;
  imageLink: string;
  levels: HideoutLevel[];
}

export interface HideoutSnapshot {
  hideoutStations: HideoutStation[];
}

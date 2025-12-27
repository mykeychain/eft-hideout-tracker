'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { OnHandByItemId, StationLevelByStationId, ExcludedStationIds } from '@/types';
import {
  saveOnHandQuantity,
  saveStationLevel,
  saveOnHandQuantities,
  setupVisibilityFlush,
  clampOnHand,
  clampStationLevel,
  clearOnHandQuantities,
  clearStationLevels,
  saveExcludedStation,
  clearExcludedStations,
} from '@/lib/db';

interface UserStateContextValue {
  onHandByItemId: OnHandByItemId;
  stationLevelByStationId: StationLevelByStationId;
  excludedStationIds: ExcludedStationIds;
  isHydrated: boolean;

  // Actions
  setOnHand: (itemId: string, quantity: number) => void;
  adjustOnHand: (itemId: string, delta: number) => void;
  setStationLevel: (stationId: string, level: number, maxLevel: number) => void;
  upgradeStation: (
    stationId: string,
    maxLevel: number,
    itemsToConsume: Array<{ itemId: string; quantity: number }>
  ) => void;
  toggleStationExclusion: (stationId: string) => void;
  resetStationLevels: () => void;
  resetOnHand: () => void;
}

const UserStateContext = createContext<UserStateContextValue | null>(null);

// Action types
type Action =
  | { type: 'HYDRATE'; onHand: OnHandByItemId; stationLevels: StationLevelByStationId; excludedStations: ExcludedStationIds }
  | { type: 'SET_ON_HAND'; itemId: string; quantity: number }
  | { type: 'ADJUST_ON_HAND'; itemId: string; delta: number }
  | { type: 'SET_STATION_LEVEL'; stationId: string; level: number; maxLevel: number }
  | {
      type: 'UPGRADE_STATION';
      stationId: string;
      maxLevel: number;
      itemsToConsume: Array<{ itemId: string; quantity: number }>;
    }
  | { type: 'TOGGLE_STATION_EXCLUSION'; stationId: string }
  | { type: 'RESET_STATION_LEVELS' }
  | { type: 'RESET_ON_HAND' };

interface State {
  onHandByItemId: OnHandByItemId;
  stationLevelByStationId: StationLevelByStationId;
  excludedStationIds: ExcludedStationIds;
  isHydrated: boolean;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return {
        onHandByItemId: action.onHand,
        stationLevelByStationId: action.stationLevels,
        excludedStationIds: action.excludedStations,
        isHydrated: true,
      };

    case 'SET_ON_HAND': {
      const clamped = clampOnHand(action.quantity);
      return {
        ...state,
        onHandByItemId: {
          ...state.onHandByItemId,
          [action.itemId]: clamped,
        },
      };
    }

    case 'ADJUST_ON_HAND': {
      const current = state.onHandByItemId[action.itemId] ?? 0;
      const clamped = clampOnHand(current + action.delta);
      return {
        ...state,
        onHandByItemId: {
          ...state.onHandByItemId,
          [action.itemId]: clamped,
        },
      };
    }

    case 'SET_STATION_LEVEL': {
      const clamped = clampStationLevel(action.level, action.maxLevel);
      return {
        ...state,
        stationLevelByStationId: {
          ...state.stationLevelByStationId,
          [action.stationId]: clamped,
        },
      };
    }

    case 'UPGRADE_STATION': {
      const currentLevel = state.stationLevelByStationId[action.stationId] ?? 0;
      const newLevel = clampStationLevel(currentLevel + 1, action.maxLevel);

      // Consume items
      const newOnHand = { ...state.onHandByItemId };
      for (const { itemId, quantity } of action.itemsToConsume) {
        const current = newOnHand[itemId] ?? 0;
        newOnHand[itemId] = clampOnHand(current - quantity);
      }

      return {
        ...state,
        onHandByItemId: newOnHand,
        stationLevelByStationId: {
          ...state.stationLevelByStationId,
          [action.stationId]: newLevel,
        },
      };
    }

    case 'TOGGLE_STATION_EXCLUSION': {
      const currentlyExcluded = state.excludedStationIds[action.stationId] ?? false;
      const newExcluded = { ...state.excludedStationIds };
      if (currentlyExcluded) {
        delete newExcluded[action.stationId];
      } else {
        newExcluded[action.stationId] = true;
      }
      return {
        ...state,
        excludedStationIds: newExcluded,
      };
    }

    case 'RESET_STATION_LEVELS':
      return {
        ...state,
        stationLevelByStationId: {},
        excludedStationIds: {},
      };

    case 'RESET_ON_HAND':
      return {
        ...state,
        onHandByItemId: {},
      };

    default:
      return state;
  }
}

interface UserStateProviderProps {
  children: ReactNode;
  initialOnHand?: OnHandByItemId;
  initialStationLevels?: StationLevelByStationId;
  initialExcludedStations?: ExcludedStationIds;
}

export function UserStateProvider({
  children,
  initialOnHand = {},
  initialStationLevels = {},
  initialExcludedStations = {},
}: UserStateProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    onHandByItemId: initialOnHand,
    stationLevelByStationId: initialStationLevels,
    excludedStationIds: initialExcludedStations,
    isHydrated: Object.keys(initialOnHand).length > 0 || Object.keys(initialStationLevels).length > 0 || Object.keys(initialExcludedStations).length > 0,
  });

  // Set up visibility flush on mount
  useEffect(() => {
    setupVisibilityFlush();
  }, []);

  const setOnHand = useCallback((itemId: string, quantity: number) => {
    dispatch({ type: 'SET_ON_HAND', itemId, quantity });
    saveOnHandQuantity(itemId, quantity);
  }, []);

  const adjustOnHand = useCallback(
    (itemId: string, delta: number) => {
      dispatch({ type: 'ADJUST_ON_HAND', itemId, delta });
      const newValue = (state.onHandByItemId[itemId] ?? 0) + delta;
      saveOnHandQuantity(itemId, newValue);
    },
    [state.onHandByItemId]
  );

  const setStationLevel = useCallback(
    (stationId: string, level: number, maxLevel: number) => {
      dispatch({ type: 'SET_STATION_LEVEL', stationId, level, maxLevel });
      saveStationLevel(stationId, level, maxLevel);
    },
    []
  );

  const upgradeStation = useCallback(
    (
      stationId: string,
      maxLevel: number,
      itemsToConsume: Array<{ itemId: string; quantity: number }>
    ) => {
      dispatch({ type: 'UPGRADE_STATION', stationId, maxLevel, itemsToConsume });

      // Persist changes
      const currentLevel = state.stationLevelByStationId[stationId] ?? 0;
      saveStationLevel(stationId, currentLevel + 1, maxLevel);

      const updatedOnHand: OnHandByItemId = {};
      for (const { itemId, quantity } of itemsToConsume) {
        const current = state.onHandByItemId[itemId] ?? 0;
        updatedOnHand[itemId] = clampOnHand(current - quantity);
      }
      saveOnHandQuantities(updatedOnHand);
    },
    [state.stationLevelByStationId, state.onHandByItemId]
  );

  const toggleStationExclusion = useCallback((stationId: string) => {
    const currentlyExcluded = state.excludedStationIds[stationId] ?? false;
    dispatch({ type: 'TOGGLE_STATION_EXCLUSION', stationId });
    saveExcludedStation(stationId, !currentlyExcluded);
  }, [state.excludedStationIds]);

  const resetStationLevels = useCallback(() => {
    dispatch({ type: 'RESET_STATION_LEVELS' });
    clearStationLevels();
    clearExcludedStations();
  }, []);

  const resetOnHand = useCallback(() => {
    dispatch({ type: 'RESET_ON_HAND' });
    clearOnHandQuantities();
  }, []);

  return (
    <UserStateContext.Provider
      value={{
        onHandByItemId: state.onHandByItemId,
        stationLevelByStationId: state.stationLevelByStationId,
        excludedStationIds: state.excludedStationIds,
        isHydrated: state.isHydrated,
        setOnHand,
        adjustOnHand,
        setStationLevel,
        upgradeStation,
        toggleStationExclusion,
        resetStationLevels,
        resetOnHand,
      }}
    >
      {children}
    </UserStateContext.Provider>
  );
}

export function useUserState(): UserStateContextValue {
  const context = useContext(UserStateContext);
  if (!context) {
    throw new Error('useUserState must be used within a UserStateProvider');
  }
  return context;
}

/**
 * tarkov.dev GraphQL API client
 */

import type { HideoutSnapshot } from '@/types';

const TARKOV_API_URL = process.env.TARKOV_API_URL || 'https://api.tarkov.dev/graphql';

const HIDEOUT_QUERY = `
  query GetHideoutData {
    hideoutStations {
      id
      name
      imageLink
      levels {
        id
        level
        itemRequirements {
          quantity
          item {
            id
            name
            shortName
            iconLink
            category {
              id
              name
            }
          }
        }
      }
    }
  }
`;

interface GraphQLResponse {
  data?: {
    hideoutStations: HideoutSnapshot['hideoutStations'];
  };
  errors?: Array<{ message: string }>;
}

export async function fetchHideoutSnapshot(): Promise<HideoutSnapshot> {
  const response = await fetch(TARKOV_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: HIDEOUT_QUERY }),
    // Cache for 24 hours, revalidate in background
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(`Upstream API error: ${response.status} ${response.statusText}`);
  }

  const json: GraphQLResponse = await response.json();

  if (json.errors && json.errors.length > 0) {
    throw new Error(`GraphQL error: ${json.errors[0].message}`);
  }

  if (!json.data?.hideoutStations) {
    throw new Error('Invalid response: missing hideoutStations data');
  }

  return {
    hideoutStations: json.data.hideoutStations,
  };
}

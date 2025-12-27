# Hideout Tracker

A web app for tracking items needed for Escape from Tarkov hideout upgrades.

## Features

- **Hideout Tab**: View all hideout stations with their current levels and upgrade requirements
- **Items Tab**: Aggregated shopping list of all items needed across stations
- **Progress Tracking**: Track on-hand quantities for each item with +/- controls
- **Station Exclusion**: Exclude stations you don't plan to upgrade
- **Persistent Storage**: All progress saved locally via IndexedDB
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Next.js 16** with App Router
- **React 19** with TypeScript
- **IndexedDB** (via idb) for client-side persistence
- **CSS Modules** for styling
- **tarkov.dev GraphQL API** for hideout data

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## How It Works

1. **Data Fetching**: On load, the app fetches hideout station data from the tarkov.dev GraphQL API
2. **User State**: Your station levels and item quantities are stored in IndexedDB
3. **Derived State**: The app computes which items you need based on your current station levels
4. **Persistence**: Changes are debounced and saved automatically, with flush on page hide

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes (hideout-snapshot)
│   ├── globals.css        # Global styles and CSS variables
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── App/              # Main app with loading states
│   ├── AppShell/         # Layout with tabs
│   ├── HideoutTab/       # Station list view
│   ├── ItemsTab/         # Shopping list view
│   ├── StationCard/      # Individual station display
│   └── ItemRow/          # Individual item display
├── contexts/             # React contexts
│   ├── SnapshotContext   # Hideout data from API
│   └── UserStateContext  # User's progress state
├── hooks/                # Custom React hooks
├── lib/                  # Utilities
│   ├── db.ts            # IndexedDB operations
│   ├── derivedState.ts  # State computation
│   └── tarkovApi.ts     # GraphQL client
└── types/               # TypeScript types
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TARKOV_API_URL` | `https://api.tarkov.dev/graphql` | GraphQL endpoint for hideout data |

## Attribution

Hideout data is provided by the [tarkov.dev API](https://tarkov.dev), a community-driven resource for Escape from Tarkov data.

## Disclaimer

This project is not affiliated with, endorsed by, or connected to Battlestate Games or Escape from Tarkov. All game-related content and imagery belong to their respective owners.

## AI Disclosure

This project was built with the assistance of AI tools, specifically Claude (Anthropic). AI was used for code generation, architecture decisions, debugging, and documentation throughout development.

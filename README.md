# Merge Lab

A portfolio-ready mobile-first casual merge game prototype demonstrating full-stack game development skills.

## The Problem

Casual merge games often suffer from:

- **Analysis Paralysis**: Too many tiles with unclear objectives lead to decision fatigue
- **Move Waste**: Players don't understand optimal merge strategies until it's too late
- **Progression Fatigue**: No visible sense of accomplishment between sessions

**Merge Lab** addresses these by constraining the design space: a 6x6 grid, clear tier-based objectives (orders), and a limited move budget that forces strategic thinking without overwhelming the player.

## Core Loop

```text
[Tap Empty Cell] → [Spawn Tier-1 Tile] → [Auto-Merge Adjacent] → [Track Order Progress]
                                              ↓
                           [Chain Reactions Create Higher Tiers]
```

**Mechanics:**

1. Tap any empty cell to place a tier-1 tile (costs 1 move)
2. Adjacent tiles of the same tier automatically merge into the next tier
3. Complete all "orders" (e.g., "create 3 tier-4 tiles") before moves run out
4. Higher tiers require exponentially more merges (tier-4 = 8 base tiles)

**Strategic Depth:**

- Placement matters: merges cascade in one direction
- Grid management: avoid blocking potential merge chains
- Move economy: plan 2-3 moves ahead

## Content Pipeline (Level Editor)

The in-app level editor enables rapid iteration without code changes:

1. **Select Level**: Choose any of 30 built-in levels
2. **Adjust Parameters**:
   - Move limit (budget constraint)
   - Orders (tier + quantity objectives)
3. **Save Override**: Stored in localStorage, persists across sessions
4. **Playtest**: Immediately test changes in-game

This workflow enables:

- Testing difficulty curves without rebuilding
- A/B testing move budgets
- Rapid prototyping of new order combinations

## Metrics (Insights Dashboard)

The Insights tab provides actionable analytics:

| Metric             | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| **Win Rate**       | Is the level too hard/easy? Target: 60-70%      |
| **Avg Moves Used** | Are players efficient? Compare to move limit    |
| **Avg Duration**   | Session length indicator                        |
| **Fail Reasons**   | "Out of Moves" vs "Orders Not Completed"        |

**Export**: CSV export for external analysis (spreadsheet, BI tools).

## Iteration Notes

### Iteration 1: Move Feedback

**Observation**: Playtesters didn't notice their remaining moves until too late.

**Change**: Made moves counter high-contrast green with glow effect. The visual urgency helps players pace their placement strategy.

### Iteration 2: Order Clarity

**Observation**: Players confused "Tier 4" with "need 4 tiles."

**Change**: Added color-coded tier indicators matching tile colors. Completed orders visually fade to 40% opacity, providing clear progress feedback.

## Tech Stack

- **Vite** - Sub-second hot reload for rapid iteration
- **TypeScript** - Type-safe vanilla implementation
- **Vanilla CSS** - No framework overhead, ~1000 lines of styles
- **Web Audio API** - Lightweight sound effects (no audio files)
- **localStorage** - Zero-backend persistence

## Project Structure

```text
src/
├── main.ts                 # App shell, routing, navigation
├── style.css              # All styles (~1000 lines)
├── game/
│   ├── MergeGame.ts       # Core game logic, 6x6 grid, merge mechanics
│   ├── LevelEditor.ts     # In-app level editor with live preview
│   └── Tutorial.ts        # First-time onboarding (3 steps)
├── audio/
│   └── SoundManager.ts    # Web Audio API sound effects
├── analytics/
│   ├── AnalyticsService.ts # Event tracking, insights calculation
│   └── types.ts           # TypeScript event definitions
├── insights/
│   └── InsightsDashboard.ts # Analytics visualization, CSV export
└── data/
    └── levels.ts          # 30 built-in levels + localStorage persistence
```

## How to Run

```bash
# Install dependencies
npm install

# Development (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Features

- 30 levels across 3 difficulty tiers (Easy, Medium, Hard)
- First-time tutorial overlay (3 steps)
- Sound effects with toggle (tap, merge, win)
- Enhanced win screen with stats + share button
- Level editor with local overrides
- Analytics dashboard with CSV export
- Mobile-first responsive design (480px)

## License

ISC

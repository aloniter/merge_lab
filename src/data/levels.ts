export interface Order {
  tier: number
  qty: number
}

export interface Level {
  id: number
  moveLimit: number
  orders: Order[]
}

export const levels: Level[] = [
  // Easy levels (1-10): Simple orders, tiers 2-3
  { id: 1, moveLimit: 10, orders: [{ tier: 2, qty: 3 }] },
  { id: 2, moveLimit: 12, orders: [{ tier: 2, qty: 4 }] },
  { id: 3, moveLimit: 10, orders: [{ tier: 2, qty: 2 }, { tier: 3, qty: 1 }] },
  { id: 4, moveLimit: 14, orders: [{ tier: 2, qty: 3 }, { tier: 3, qty: 1 }] },
  { id: 5, moveLimit: 12, orders: [{ tier: 3, qty: 2 }] },
  { id: 6, moveLimit: 15, orders: [{ tier: 2, qty: 4 }, { tier: 3, qty: 1 }] },
  { id: 7, moveLimit: 14, orders: [{ tier: 3, qty: 2 }, { tier: 2, qty: 2 }] },
  { id: 8, moveLimit: 16, orders: [{ tier: 3, qty: 3 }] },
  { id: 9, moveLimit: 15, orders: [{ tier: 2, qty: 3 }, { tier: 3, qty: 2 }] },
  { id: 10, moveLimit: 18, orders: [{ tier: 3, qty: 3 }, { tier: 2, qty: 2 }] },

  // Medium levels (11-20): 2-3 orders, tiers 3-4
  { id: 11, moveLimit: 16, orders: [{ tier: 3, qty: 2 }, { tier: 4, qty: 1 }] },
  { id: 12, moveLimit: 18, orders: [{ tier: 4, qty: 2 }] },
  { id: 13, moveLimit: 17, orders: [{ tier: 3, qty: 3 }, { tier: 4, qty: 1 }] },
  { id: 14, moveLimit: 20, orders: [{ tier: 3, qty: 2 }, { tier: 4, qty: 2 }] },
  { id: 15, moveLimit: 18, orders: [{ tier: 4, qty: 2 }, { tier: 3, qty: 2 }] },
  { id: 16, moveLimit: 20, orders: [{ tier: 3, qty: 3 }, { tier: 4, qty: 2 }] },
  { id: 17, moveLimit: 22, orders: [{ tier: 4, qty: 3 }] },
  { id: 18, moveLimit: 20, orders: [{ tier: 3, qty: 2 }, { tier: 4, qty: 2 }, { tier: 2, qty: 3 }] },
  { id: 19, moveLimit: 22, orders: [{ tier: 4, qty: 3 }, { tier: 3, qty: 2 }] },
  { id: 20, moveLimit: 24, orders: [{ tier: 4, qty: 4 }] },

  // Hard levels (21-30): 3-4 orders, tiers 4-5
  { id: 21, moveLimit: 22, orders: [{ tier: 4, qty: 2 }, { tier: 5, qty: 1 }] },
  { id: 22, moveLimit: 24, orders: [{ tier: 5, qty: 2 }] },
  { id: 23, moveLimit: 22, orders: [{ tier: 4, qty: 3 }, { tier: 5, qty: 1 }] },
  { id: 24, moveLimit: 25, orders: [{ tier: 4, qty: 2 }, { tier: 5, qty: 2 }] },
  { id: 25, moveLimit: 24, orders: [{ tier: 5, qty: 2 }, { tier: 4, qty: 3 }] },
  { id: 26, moveLimit: 26, orders: [{ tier: 4, qty: 3 }, { tier: 5, qty: 2 }, { tier: 3, qty: 2 }] },
  { id: 27, moveLimit: 28, orders: [{ tier: 5, qty: 3 }] },
  { id: 28, moveLimit: 26, orders: [{ tier: 4, qty: 2 }, { tier: 5, qty: 2 }, { tier: 3, qty: 3 }] },
  { id: 29, moveLimit: 28, orders: [{ tier: 5, qty: 3 }, { tier: 4, qty: 3 }] },
  { id: 30, moveLimit: 30, orders: [{ tier: 5, qty: 4 }, { tier: 4, qty: 2 }] },
]

const STORAGE_KEY = 'mergeLab_levelOverrides'

export function getLevelOverrides(): Record<number, Level> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function saveLevelOverride(level: Level): void {
  const overrides = getLevelOverrides()
  overrides[level.id] = level
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export function clearLevelOverride(id: number): void {
  const overrides = getLevelOverrides()
  delete overrides[id]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export function getLevel(id: number): Level {
  const overrides = getLevelOverrides()
  if (overrides[id]) {
    return overrides[id]
  }
  const level = levels.find(l => l.id === id)
  if (!level) {
    throw new Error(`Level ${id} not found`)
  }
  return level
}

export function getDefaultLevel(id: number): Level {
  const level = levels.find(l => l.id === id)
  if (!level) {
    throw new Error(`Level ${id} not found`)
  }
  return { ...level, orders: level.orders.map(o => ({ ...o })) }
}

// Level completion tracking
const COMPLETION_KEY = 'mergeLab_completedLevels'

export function getCompletedLevels(): Set<number> {
  try {
    const stored = localStorage.getItem(COMPLETION_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

export function markLevelComplete(id: number): void {
  const completed = getCompletedLevels()
  completed.add(id)
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(Array.from(completed)))
}

export function isLevelCompleted(id: number): boolean {
  return getCompletedLevels().has(id)
}

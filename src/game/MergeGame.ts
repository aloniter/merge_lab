import type { Level } from '../data/levels'
import { markLevelComplete } from '../data/levels'
import { AnalyticsService } from '../analytics/AnalyticsService'
import { SoundManager } from '../audio/SoundManager'

type Cell = { tier: number } | null

const GRID_SIZE = 6
const TIER_COLORS: Record<number, string> = {
  1: '#00fff5', // cyan
  2: '#ff00ff', // magenta
  3: '#ffff00', // yellow
  4: '#00ff00', // lime
  5: '#ff8800', // orange
  6: '#ffd700', // gold
}

export class MergeGame {
  private grid: Cell[][]
  private containerEl: HTMLElement
  private movesEl: HTMLElement | null = null
  private ordersEl: HTMLElement | null = null

  private level: Level | null = null
  private movesRemaining: number = 0
  private orderProgress: Map<number, number> = new Map()
  private isGameOver: boolean = false

  private onComplete: (() => void) | null = null
  private onExit: (() => void) | null = null
  private analytics: AnalyticsService
  private sound: SoundManager
  private levelStartTime: number = 0

  constructor(containerId: string) {
    const el = document.getElementById(containerId)
    if (!el) throw new Error(`Container ${containerId} not found`)
    this.containerEl = el
    this.grid = this.createEmptyGrid()
    this.analytics = AnalyticsService.getInstance()
    this.sound = SoundManager.getInstance()
  }

  private createEmptyGrid(): Cell[][] {
    return Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => null)
    )
  }

  private getTierColor(tier: number): string {
    return TIER_COLORS[Math.min(tier, 6)] || TIER_COLORS[6]
  }

  loadLevel(level: Level, onComplete?: () => void, onExit?: () => void): void {
    this.level = level
    this.movesRemaining = level.moveLimit
    this.orderProgress = new Map()
    this.isGameOver = false
    this.onComplete = onComplete || null
    this.onExit = onExit || null
    this.grid = this.createEmptyGrid()

    // Initialize order progress
    for (const order of level.orders) {
      this.orderProgress.set(order.tier, 0)
    }

    // Track analytics: level start
    this.levelStartTime = Date.now()
    this.analytics.logLevelStart(level.id)

    this.render()
  }

  private render(): void {
    if (!this.level) {
      this.containerEl.innerHTML = '<p>No level loaded</p>'
      return
    }

    this.containerEl.innerHTML = `
      <div class="game-header">
        <button class="back-btn">← Back</button>
        <span class="level-info">Level ${this.level.id}</span>
        <span class="moves-counter">Moves: ${this.movesRemaining}</span>
        <button class="reset-btn">Restart</button>
      </div>
      <div class="orders-panel"></div>
      <div class="game-grid-wrapper">
        <div class="game-grid"></div>
      </div>
    `

    this.movesEl = this.containerEl.querySelector('.moves-counter')
    this.ordersEl = this.containerEl.querySelector('.orders-panel')
    const gridEl = this.containerEl.querySelector('.game-grid')!
    const resetBtn = this.containerEl.querySelector('.reset-btn')!
    const backBtn = this.containerEl.querySelector('.back-btn')!

    resetBtn.addEventListener('click', () => this.restart())
    backBtn.addEventListener('click', () => {
      if (this.onExit) this.onExit()
    })

    this.renderOrders()

    // Render cells
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = this.grid[row][col]
        const cellEl = document.createElement('div')
        cellEl.className = 'cell'
        cellEl.dataset.row = String(row)
        cellEl.dataset.col = String(col)

        if (cell) {
          cellEl.textContent = String(cell.tier)
          cellEl.style.color = this.getTierColor(cell.tier)
          cellEl.style.textShadow = `0 0 10px ${this.getTierColor(cell.tier)}`
        }

        cellEl.addEventListener('click', () => this.handleCellClick(row, col))
        gridEl.appendChild(cellEl)
      }
    }
  }

  private renderOrders(): void {
    if (!this.ordersEl || !this.level) return

    this.ordersEl.innerHTML = this.level.orders.map(order => {
      const progress = this.orderProgress.get(order.tier) || 0
      const isComplete = progress >= order.qty
      return `
        <div class="order-item ${isComplete ? 'complete' : ''}">
          <span class="order-tier" style="color: ${this.getTierColor(order.tier)}; text-shadow: 0 0 8px ${this.getTierColor(order.tier)}">${order.tier}</span>
          <span class="order-progress">${Math.min(progress, order.qty)}/${order.qty}</span>
        </div>
      `
    }).join('')
  }

  private updateMovesDisplay(): void {
    if (this.movesEl) {
      this.movesEl.textContent = `Moves: ${this.movesRemaining}`
    }
  }

  private handleCellClick(row: number, col: number): void {
    if (this.isGameOver) return
    if (this.grid[row][col] !== null) return
    if (this.movesRemaining <= 0) return

    // Spawn tier-1 item
    this.grid[row][col] = { tier: 1 }
    this.movesRemaining--
    this.updateMovesDisplay()
    this.sound.play('tap')

    // Track analytics: move used
    if (this.level) {
      const moveIndex = this.level.moveLimit - this.movesRemaining
      this.analytics.logMoveUsed(this.level.id, moveIndex)
    }

    // Check and perform merges
    this.checkAndMerge(row, col)
  }

  private checkAndMerge(row: number, col: number): void {
    const cell = this.grid[row][col]
    if (!cell) return

    const directions = [
      [-1, 0], // up
      [1, 0],  // down
      [0, -1], // left
      [0, 1],  // right
    ]

    for (const [dr, dc] of directions) {
      const nr = row + dr
      const nc = col + dc

      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue

      const neighbor = this.grid[nr][nc]
      if (neighbor && neighbor.tier === cell.tier) {
        // Merge: clear neighbor, increase current tier
        const newTier = cell.tier + 1
        this.grid[nr][nc] = null
        this.grid[row][col] = { tier: newTier }
        this.sound.play('merge')

        // Track analytics: merge
        if (this.level) {
          this.analytics.logMerge(this.level.id, cell.tier, newTier)
        }

        // Track order progress
        this.trackOrder(newTier)

        // Re-render and animate
        this.renderCell(row, col, true)
        this.renderCell(nr, nc, false)

        // Check win/lose after merge animation
        setTimeout(() => {
          if (this.checkWin()) {
            this.showWinScreen()
          } else {
            // Check for chain reaction
            this.checkAndMerge(row, col)
          }
        }, 150)

        return
      }
    }

    // No merge found, just render the new cell
    this.renderCell(row, col, false)

    // Check lose condition after placement (no merge)
    setTimeout(() => {
      if (!this.isGameOver && this.checkLose()) {
        this.showLoseScreen()
      }
    }, 50)
  }

  private trackOrder(tier: number): void {
    if (!this.level) return

    // Check if this tier is in any order
    const order = this.level.orders.find(o => o.tier === tier)
    if (order) {
      const current = this.orderProgress.get(tier) || 0
      this.orderProgress.set(tier, current + 1)

      // Track analytics: order progress
      const remaining = order.qty - (current + 1)
      this.analytics.logOrderProgress(this.level.id, tier, remaining)

      this.renderOrders()
    }
  }

  private checkWin(): boolean {
    if (!this.level) return false

    for (const order of this.level.orders) {
      const progress = this.orderProgress.get(order.tier) || 0
      if (progress < order.qty) return false
    }
    return true
  }

  private checkLose(): boolean {
    if (!this.level) return false
    if (this.checkWin()) return false
    return this.movesRemaining <= 0
  }

  private showWinScreen(): void {
    const movesUsed = this.level ? this.level.moveLimit - this.movesRemaining : 0
    const durationSec = Math.round((Date.now() - this.levelStartTime) / 1000)

    // Track analytics: level end (win)
    if (this.level) {
      this.analytics.logLevelEnd(this.level.id, 'win', movesUsed, durationSec)
      markLevelComplete(this.level.id)
    }

    this.sound.play('win')
    this.isGameOver = true

    const levelId = this.level?.id || 0
    const shareText = `I beat Level ${levelId} in ${movesUsed} moves (${durationSec}s) on Merge Lab!`

    const overlay = document.createElement('div')
    overlay.className = 'game-overlay win'
    overlay.innerHTML = `
      <div class="overlay-content">
        <h2 class="overlay-title">Level Complete!</h2>
        <p class="overlay-subtitle">You completed all orders</p>

        <div class="win-stats">
          <div class="win-stat">
            <span class="win-stat-value">${movesUsed}</span>
            <span class="win-stat-label">Moves</span>
          </div>
          <div class="win-stat">
            <span class="win-stat-value">${durationSec}s</span>
            <span class="win-stat-label">Time</span>
          </div>
        </div>

        <button class="overlay-btn primary next-btn">Next Level</button>
        <button class="overlay-btn replay-btn">Replay</button>
        <button class="overlay-btn share-btn" data-share="${encodeURIComponent(shareText)}">Share Result</button>
      </div>
    `

    const wrapper = this.containerEl.querySelector('.game-grid-wrapper')
    if (wrapper) {
      wrapper.appendChild(overlay)
    }

    overlay.querySelector('.next-btn')?.addEventListener('click', () => {
      if (this.onComplete) this.onComplete()
    })

    overlay.querySelector('.replay-btn')?.addEventListener('click', () => {
      this.restart()
    })

    overlay.querySelector('.share-btn')?.addEventListener('click', (e) => {
      const btn = e.target as HTMLButtonElement
      const text = decodeURIComponent(btn.dataset.share || '')
      this.copyToClipboard(text)
    })
  }

  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.showShareToast('Copied to clipboard!')
    }).catch(() => {
      this.showShareToast('Could not copy')
    })
  }

  private showShareToast(message: string): void {
    const existing = this.containerEl.querySelector('.share-toast')
    if (existing) existing.remove()

    const toast = document.createElement('div')
    toast.className = 'share-toast'
    toast.textContent = message
    this.containerEl.appendChild(toast)

    setTimeout(() => toast.remove(), 2000)
  }

  private showLoseScreen(): void {
    // Track analytics: level end (fail)
    if (this.level) {
      const movesUsed = this.level.moveLimit - this.movesRemaining
      const durationSec = Math.round((Date.now() - this.levelStartTime) / 1000)

      // Determine fail reason based on order progress
      const hasProgress = Array.from(this.orderProgress.values()).some(p => p > 0)
      const failReason = hasProgress ? 'orders_not_completed' : 'out_of_moves'

      this.analytics.logLevelEnd(this.level.id, 'fail', movesUsed, durationSec, failReason)
    }

    this.isGameOver = true
    const overlay = document.createElement('div')
    overlay.className = 'game-overlay lose'
    overlay.innerHTML = `
      <div class="overlay-content">
        <h2 class="overlay-title">Out of Moves!</h2>
        <p class="overlay-subtitle">Try again</p>
        <button class="overlay-btn primary">Retry</button>
      </div>
    `

    const wrapper = this.containerEl.querySelector('.game-grid-wrapper')
    if (wrapper) {
      wrapper.appendChild(overlay)
    }

    overlay.querySelector('.overlay-btn')?.addEventListener('click', () => {
      this.restart()
    })
  }

  private restart(): void {
    if (this.level) {
      this.loadLevel(this.level, this.onComplete || undefined)
    }
  }

  private renderCell(row: number, col: number, animate: boolean): void {
    const cellEl = this.containerEl.querySelector(
      `.cell[data-row="${row}"][data-col="${col}"]`
    ) as HTMLElement

    if (!cellEl) return

    const cell = this.grid[row][col]

    if (cell) {
      cellEl.textContent = String(cell.tier)
      cellEl.style.color = this.getTierColor(cell.tier)
      cellEl.style.textShadow = `0 0 10px ${this.getTierColor(cell.tier)}`

      if (animate) {
        cellEl.classList.remove('merging')
        void cellEl.offsetWidth
        cellEl.classList.add('merging')
      }
    } else {
      cellEl.textContent = ''
      cellEl.style.color = ''
      cellEl.style.textShadow = ''
      cellEl.classList.remove('merging')
    }
  }
}

import {
  levels,
  getLevel,
  getDefaultLevel,
  saveLevelOverride,
  clearLevelOverride,
  getLevelOverrides,
  type Level
} from '../data/levels'

export class LevelEditor {
  private containerEl: HTMLElement
  private selectedLevelId: number = 1
  private editedLevel: Level
  private onPlayLevel: ((level: Level) => void) | null = null

  constructor(containerId: string, onPlayLevel?: (level: Level) => void) {
    const el = document.getElementById(containerId)
    if (!el) throw new Error(`Container ${containerId} not found`)
    this.containerEl = el
    this.onPlayLevel = onPlayLevel || null
    this.editedLevel = this.cloneLevel(getLevel(1))
    this.render()
  }

  private cloneLevel(level: Level): Level {
    return {
      id: level.id,
      moveLimit: level.moveLimit,
      orders: level.orders.map(o => ({ ...o }))
    }
  }

  private render(): void {
    const overrides = getLevelOverrides()
    const hasOverride = !!overrides[this.selectedLevelId]

    this.containerEl.innerHTML = `
      <div class="editor-container">
        <h2 class="editor-title">Level Editor</h2>

        <div class="editor-section">
          <label class="editor-label">Select Level</label>
          <select class="editor-select level-select">
            ${levels.map(l => `
              <option value="${l.id}" ${l.id === this.selectedLevelId ? 'selected' : ''}>
                Level ${l.id} ${overrides[l.id] ? '(modified)' : ''}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="editor-section">
          <label class="editor-label">Move Limit</label>
          <input type="number" class="editor-input move-limit-input"
                 value="${this.editedLevel.moveLimit}" min="1" max="99">
        </div>

        <div class="editor-section">
          <label class="editor-label">Orders</label>
          <div class="orders-list">
            ${this.editedLevel.orders.map((order, index) => `
              <div class="order-row" data-index="${index}">
                <div class="order-field">
                  <span class="order-field-label">Tier</span>
                  <input type="number" class="editor-input order-tier"
                         value="${order.tier}" min="2" max="10">
                </div>
                <div class="order-field">
                  <span class="order-field-label">Qty</span>
                  <input type="number" class="editor-input order-qty"
                         value="${order.qty}" min="1" max="20">
                </div>
                <button class="editor-btn danger remove-order-btn">X</button>
              </div>
            `).join('')}
          </div>
          <button class="editor-btn add-order-btn">+ Add Order</button>
        </div>

        <div class="editor-actions">
          <button class="editor-btn primary save-btn">Save Changes</button>
          <button class="editor-btn reset-btn" ${!hasOverride ? 'disabled' : ''}>
            Reset to Default
          </button>
        </div>

        <div class="editor-section play-section">
          <button class="editor-btn success play-btn">Play This Level</button>
        </div>
      </div>
    `

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // Level select
    const levelSelect = this.containerEl.querySelector('.level-select') as HTMLSelectElement
    levelSelect?.addEventListener('change', () => {
      this.selectedLevelId = parseInt(levelSelect.value)
      this.editedLevel = this.cloneLevel(getLevel(this.selectedLevelId))
      this.render()
    })

    // Move limit input
    const moveLimitInput = this.containerEl.querySelector('.move-limit-input') as HTMLInputElement
    moveLimitInput?.addEventListener('input', () => {
      this.editedLevel.moveLimit = parseInt(moveLimitInput.value) || 1
    })

    // Order inputs
    this.containerEl.querySelectorAll('.order-row').forEach((row, index) => {
      const tierInput = row.querySelector('.order-tier') as HTMLInputElement
      const qtyInput = row.querySelector('.order-qty') as HTMLInputElement
      const removeBtn = row.querySelector('.remove-order-btn')

      tierInput?.addEventListener('input', () => {
        this.editedLevel.orders[index].tier = parseInt(tierInput.value) || 2
      })

      qtyInput?.addEventListener('input', () => {
        this.editedLevel.orders[index].qty = parseInt(qtyInput.value) || 1
      })

      removeBtn?.addEventListener('click', () => {
        this.editedLevel.orders.splice(index, 1)
        this.render()
      })
    })

    // Add order button
    this.containerEl.querySelector('.add-order-btn')?.addEventListener('click', () => {
      this.editedLevel.orders.push({ tier: 2, qty: 1 })
      this.render()
    })

    // Save button
    this.containerEl.querySelector('.save-btn')?.addEventListener('click', () => {
      saveLevelOverride(this.editedLevel)
      this.render()
      this.showToast('Level saved!')
    })

    // Reset button
    this.containerEl.querySelector('.reset-btn')?.addEventListener('click', () => {
      clearLevelOverride(this.selectedLevelId)
      this.editedLevel = this.cloneLevel(getDefaultLevel(this.selectedLevelId))
      this.render()
      this.showToast('Reset to default')
    })

    // Play button
    this.containerEl.querySelector('.play-btn')?.addEventListener('click', () => {
      if (this.onPlayLevel) {
        this.onPlayLevel(this.cloneLevel(this.editedLevel))
      }
    })
  }

  private showToast(message: string): void {
    const existing = this.containerEl.querySelector('.editor-toast')
    if (existing) existing.remove()

    const toast = document.createElement('div')
    toast.className = 'editor-toast'
    toast.textContent = message
    this.containerEl.appendChild(toast)

    setTimeout(() => toast.remove(), 2000)
  }
}

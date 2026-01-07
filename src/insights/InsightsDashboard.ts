import { AnalyticsService } from '../analytics/AnalyticsService'
import type { LevelInsights } from '../analytics/types'

export class InsightsDashboard {
  private containerEl: HTMLElement
  private analytics: AnalyticsService
  private selectedLevelId: number | null = null

  constructor(containerId: string) {
    const el = document.getElementById(containerId)
    if (!el) throw new Error(`Container ${containerId} not found`)
    this.containerEl = el
    this.analytics = AnalyticsService.getInstance()
    this.render()
  }

  refresh(): void {
    this.render()
  }

  private render(): void {
    const allInsights = this.analytics.getAllInsights()

    if (allInsights.length === 0) {
      this.containerEl.innerHTML = this.renderEmptyState()
      return
    }

    this.containerEl.innerHTML = `
      <div class="insights-container">
        <h2 class="insights-title">Analytics Insights</h2>
        ${this.renderOverview(allInsights)}
        ${this.renderLevelSelector(allInsights)}
        ${this.selectedLevelId ? this.renderLevelDetails(this.selectedLevelId) : ''}
        ${this.renderActions()}
      </div>
    `

    this.setupEventListeners()
  }

  private renderEmptyState(): string {
    return `
      <div class="insights-empty-state">
        <h3>No Analytics Data Yet</h3>
        <p>Play some levels to start tracking your progress!</p>
      </div>
    `
  }

  private renderOverview(insights: LevelInsights[]): string {
    const totalAttempts = insights.reduce((sum, i) => sum + i.attempts, 0)
    const totalWins = insights.reduce((sum, i) => sum + i.wins, 0)
    const overallWinRate = totalAttempts > 0 ? (totalWins / totalAttempts) * 100 : 0

    const mostPlayedLevel = insights.reduce((max, i) =>
      i.attempts > max.attempts ? i : max
    , insights[0])

    const hardestLevel = insights.reduce((min, i) =>
      i.winRate < min.winRate ? i : min
    , insights[0])

    return `
      <div class="insights-section insights-overview">
        <h3>Overview</h3>
        <div class="insights-stat">
          <span class="stat-label">Total Attempts</span>
          <span class="stat-value">${totalAttempts}</span>
        </div>
        <div class="insights-stat">
          <span class="stat-label">Overall Win Rate</span>
          <span class="stat-value">${overallWinRate.toFixed(1)}%</span>
        </div>
        <div class="insights-stat">
          <span class="stat-label">Most Played Level</span>
          <span class="stat-value">Level ${mostPlayedLevel.levelId} (${mostPlayedLevel.attempts} attempts)</span>
        </div>
        <div class="insights-stat">
          <span class="stat-label">Hardest Level</span>
          <span class="stat-value">Level ${hardestLevel.levelId} (${hardestLevel.winRate.toFixed(1)}% win rate)</span>
        </div>
      </div>
    `
  }

  private renderLevelSelector(insights: LevelInsights[]): string {
    return `
      <div class="insights-section">
        <h3>Level Statistics</h3>
        <select class="insights-level-select" id="level-selector">
          <option value="">Select a level...</option>
          ${insights.map(i => `
            <option value="${i.levelId}" ${i.levelId === this.selectedLevelId ? 'selected' : ''}>
              Level ${i.levelId} - ${i.attempts} attempts, ${i.winRate.toFixed(1)}% win rate
            </option>
          `).join('')}
        </select>
      </div>
    `
  }

  private renderLevelDetails(levelId: number): string {
    const insight = this.analytics.getInsightsForLevel(levelId)
    if (!insight) return ''

    const failReasonsHTML = Object.keys(insight.failReasons).length > 0
      ? Object.entries(insight.failReasons).map(([reason, count]) => `
          <div class="fail-reason-item">
            <span class="fail-reason-label">${this.formatFailReason(reason)}</span>
            <span class="fail-reason-count">${count} time${count > 1 ? 's' : ''}</span>
          </div>
        `).join('')
      : '<p style="color: #64748b; font-size: 0.875rem;">No failures recorded</p>'

    return `
      <div class="insights-section insights-level-details">
        <h3>Level ${levelId} Details</h3>
        <div class="insights-metric">
          <span class="metric-label">Attempts</span>
          <span class="metric-value">${insight.attempts}</span>
        </div>
        <div class="insights-metric">
          <span class="metric-label">Win Rate</span>
          <span class="metric-value">${insight.winRate.toFixed(1)}%</span>
        </div>
        <div class="insights-metric">
          <span class="metric-label">Wins / Fails</span>
          <span class="metric-value">${insight.wins} / ${insight.fails}</span>
        </div>
        <div class="insights-metric">
          <span class="metric-label">Avg Duration</span>
          <span class="metric-value">${insight.avgDuration.toFixed(1)}s</span>
        </div>
        <div class="insights-metric">
          <span class="metric-label">Avg Moves Used</span>
          <span class="metric-value">${insight.avgMovesUsed.toFixed(1)}</span>
        </div>
        <div class="fail-reasons-breakdown">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #64748b;">Fail Reasons</h4>
          ${failReasonsHTML}
        </div>
        <button class="insights-btn primary" id="export-level-csv">Export Level CSV</button>
      </div>
    `
  }

  private renderActions(): string {
    return `
      <div class="insights-section insights-actions">
        <h3>Actions</h3>
        <button class="insights-btn primary" id="export-all-csv">Export All Insights CSV</button>
        <button class="insights-btn" id="refresh-btn">Refresh Data</button>
        <button class="insights-btn danger" id="clear-data-btn">Clear All Analytics</button>
      </div>
    `
  }

  private setupEventListeners(): void {
    const levelSelector = document.getElementById('level-selector') as HTMLSelectElement
    if (levelSelector) {
      levelSelector.addEventListener('change', () => {
        const value = levelSelector.value
        this.selectedLevelId = value ? parseInt(value) : null
        this.render()
      })
    }

    const exportLevelBtn = document.getElementById('export-level-csv')
    if (exportLevelBtn) {
      exportLevelBtn.addEventListener('click', () => {
        if (this.selectedLevelId) {
          this.exportLevelCSV(this.selectedLevelId)
        }
      })
    }

    const exportAllBtn = document.getElementById('export-all-csv')
    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', () => {
        this.exportAllCSV()
      })
    }

    const refreshBtn = document.getElementById('refresh-btn')
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refresh()
        this.showToast('Data refreshed')
      })
    }

    const clearBtn = document.getElementById('clear-data-btn')
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearData()
      })
    }
  }

  private exportLevelCSV(levelId: number): void {
    const csv = this.analytics.exportLevelInsightsAsCSV(levelId)
    if (csv) {
      this.downloadCSV(csv, `merge-lab-level-${levelId}-insights.csv`)
      this.showToast(`Level ${levelId} insights exported`)
    } else {
      this.showToast('No data to export')
    }
  }

  private exportAllCSV(): void {
    const csv = this.analytics.exportInsightsAsCSV()
    if (csv) {
      this.downloadCSV(csv, 'merge-lab-all-insights.csv')
      this.showToast('All insights exported')
    } else {
      this.showToast('No data to export')
    }
  }

  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  private clearData(): void {
    const confirmed = confirm(
      'Are you sure you want to clear all analytics data? This cannot be undone.'
    )

    if (confirmed) {
      this.analytics.clearAllData()
      this.selectedLevelId = null
      this.render()
      this.showToast('Analytics data cleared')
    }
  }

  private showToast(message: string): void {
    const toast = document.createElement('div')
    toast.className = 'insights-toast'
    toast.textContent = message

    document.body.appendChild(toast)

    setTimeout(() => {
      document.body.removeChild(toast)
    }, 2000)
  }

  private formatFailReason(reason: string): string {
    const formatted: Record<string, string> = {
      'out_of_moves': 'Out of Moves',
      'orders_not_completed': 'Orders Not Completed',
    }
    return formatted[reason] || reason
  }
}

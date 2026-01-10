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
      <div class="relative min-h-screen pb-32">
        <!-- Background orbs -->
        <div class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div class="absolute top-[-10%] left-[10%] w-[80%] h-[50%] bg-purple-300/30 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div class="absolute bottom-[10%] right-[-10%] w-[70%] h-[60%] bg-pink-300/30 dark:bg-primary/10 rounded-full blur-[100px]"></div>
        </div>

        <div class="relative z-10 px-6 py-8 max-w-md mx-auto">
          <h1 class="text-3xl font-black text-gray-900 dark:text-white mb-8">Insights</h1>
          ${this.renderOverview(allInsights)}
          ${this.renderLevelSelector(allInsights)}
          ${this.selectedLevelId ? this.renderLevelDetails(this.selectedLevelId) : ''}
          ${this.renderActions()}
        </div>
      </div>
    `

    this.setupEventListeners()
  }

  private renderEmptyState(): string {
    return `
      <div class="relative min-h-screen pb-32">
        <!-- Background orbs -->
        <div class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div class="absolute top-[-10%] left-[10%] w-[80%] h-[50%] bg-purple-300/30 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div class="absolute bottom-[10%] right-[-10%] w-[70%] h-[60%] bg-pink-300/30 dark:bg-primary/10 rounded-full blur-[100px]"></div>
        </div>

        <div class="relative z-10 px-6 py-8 max-w-md mx-auto flex flex-col items-center justify-center h-[70vh]">
          <div class="text-center bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-8">
            <span class="material-symbols-outlined text-6xl text-primary mb-4 block">analytics</span>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Analytics Data Yet</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">Play some levels to start tracking your progress!</p>
            <button class="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-all active:scale-95" id="load-demo-data">Load Demo Data</button>
          </div>
        </div>
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
      <div class="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 mb-6">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Overview</h3>
        <div class="space-y-3">
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
      </div>
    `
  }

  private renderLevelSelector(insights: LevelInsights[]): string {
    return `
      <div class="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 mb-6">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Level Statistics</h3>
        <select class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all" id="level-selector">
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
          <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <span class="text-sm text-gray-600 dark:text-gray-400">${this.formatFailReason(reason)}</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">${count} time${count > 1 ? 's' : ''}</span>
          </div>
        `).join('')
      : '<p class="text-gray-600 dark:text-gray-400 text-sm">No failures recorded</p>'

    return `
      <div class="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 mb-6">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Level ${levelId} Details</h3>
        <div class="space-y-3 mb-4">
          <div class="flex justify-between items-center py-2 px-4 bg-white dark:bg-gray-800/50 rounded-lg">
            <span class="metric-label">Attempts</span>
            <span class="metric-value">${insight.attempts}</span>
          </div>
          <div class="flex justify-between items-center py-2 px-4 bg-white dark:bg-gray-800/50 rounded-lg">
            <span class="metric-label">Win Rate</span>
            <span class="metric-value">${insight.winRate.toFixed(1)}%</span>
          </div>
          <div class="flex justify-between items-center py-2 px-4 bg-white dark:bg-gray-800/50 rounded-lg">
            <span class="metric-label">Wins / Fails</span>
            <span class="metric-value">${insight.wins} / ${insight.fails}</span>
          </div>
          <div class="flex justify-between items-center py-2 px-4 bg-white dark:bg-gray-800/50 rounded-lg">
            <span class="metric-label">Avg Duration</span>
            <span class="metric-value">${insight.avgDuration.toFixed(1)}s</span>
          </div>
          <div class="flex justify-between items-center py-2 px-4 bg-white dark:bg-gray-800/50 rounded-lg">
            <span class="metric-label">Avg Moves Used</span>
            <span class="metric-value">${insight.avgMovesUsed.toFixed(1)}</span>
          </div>
        </div>
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Fail Reasons</h4>
          ${failReasonsHTML}
        </div>
        <button class="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all active:scale-95" id="export-level-csv">Export Level CSV</button>
      </div>
    `
  }

  private renderActions(): string {
    return `
      <div class="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Actions</h3>
        <div class="space-y-3">
          <button class="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all active:scale-95" id="export-all-csv">Export All Insights CSV</button>
          <button class="w-full px-6 py-3 bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-white dark:hover:bg-white/20 transition-all active:scale-95" id="refresh-btn">Refresh Data</button>
          <button class="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all active:scale-95" id="clear-data-btn">Clear All Analytics</button>
        </div>
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
    const loadDemoBtn = document.getElementById('load-demo-data')
    if (loadDemoBtn) {
      loadDemoBtn.addEventListener('click', () => {
        this.analytics.generateMockData()
        this.render()
        this.showToast('Demo data loaded')
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
      this.analytics.clearAll()
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

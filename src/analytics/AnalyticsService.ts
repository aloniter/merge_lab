import type {
  AnalyticsEvent,
  AnalyticsData,
  LevelInsights,
  LevelEndEvent,
} from './types'

export class AnalyticsService {
  private static instance: AnalyticsService
  private readonly storageKey = 'mergeLab_analytics'
  private readonly MAX_EVENTS = 1000

  private currentSession: {
    levelId: number | null
    startTime: number | null
  } = {
      levelId: null,
      startTime: null,
    }

  private constructor() {
    this.loadCurrentSession()
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  // Event logging methods

  logLevelStart(levelId: number): void {
    const now = Date.now()
    this.currentSession = {
      levelId,
      startTime: now,
    }
    this.saveCurrentSession()

    this.saveEvent({
      eventType: 'level_start',
      levelId,
      timestamp: now,
      metadata: {},
    })
  }

  logMoveUsed(levelId: number, moveIndex: number): void {
    this.saveEvent({
      eventType: 'move_used',
      levelId,
      timestamp: Date.now(),
      metadata: { moveIndex },
    })
  }

  logMerge(levelId: number, fromTier: number, toTier: number): void {
    this.saveEvent({
      eventType: 'merge',
      levelId,
      timestamp: Date.now(),
      metadata: { fromTier, toTier },
    })
  }

  logOrderProgress(levelId: number, tier: number, remaining: number): void {
    this.saveEvent({
      eventType: 'order_progress',
      levelId,
      timestamp: Date.now(),
      metadata: { tier, remaining },
    })
  }

  logLevelEnd(
    levelId: number,
    result: 'win' | 'fail',
    movesUsed: number,
    durationSec: number,
    failReason?: 'out_of_moves' | 'orders_not_completed'
  ): void {
    const metadata: LevelEndEvent['metadata'] = {
      result,
      durationSec,
      movesUsed,
    }

    if (failReason) {
      metadata.failReason = failReason
    }

    this.saveEvent({
      eventType: 'level_end',
      levelId,
      timestamp: Date.now(),
      metadata,
    })

    // Clear current session
    this.currentSession = { levelId: null, startTime: null }
    this.saveCurrentSession()
  }

  // Data retrieval methods

  getEvents(): AnalyticsEvent[] {
    const data = this.loadData()
    return data.events
  }

  getEventsByLevel(levelId: number): AnalyticsEvent[] {
    return this.getEvents().filter((e) => e.levelId === levelId)
  }

  getInsightsForLevel(levelId: number): LevelInsights | null {
    const events = this.getEventsByLevel(levelId)
    const levelEndEvents = events.filter(
      (e): e is LevelEndEvent => e.eventType === 'level_end'
    )

    if (levelEndEvents.length === 0) {
      return null
    }

    const wins = levelEndEvents.filter((e) => e.metadata.result === 'win').length
    const fails = levelEndEvents.filter((e) => e.metadata.result === 'fail').length
    const attempts = wins + fails

    const totalDuration = levelEndEvents.reduce(
      (sum, e) => sum + e.metadata.durationSec,
      0
    )
    const totalMoves = levelEndEvents.reduce(
      (sum, e) => sum + e.metadata.movesUsed,
      0
    )

    const failReasons: Record<string, number> = {}
    levelEndEvents
      .filter((e) => e.metadata.result === 'fail' && e.metadata.failReason)
      .forEach((e) => {
        const reason = e.metadata.failReason!
        failReasons[reason] = (failReasons[reason] || 0) + 1
      })

    return {
      levelId,
      attempts,
      wins,
      fails,
      winRate: attempts > 0 ? (wins / attempts) * 100 : 0,
      avgDuration: attempts > 0 ? totalDuration / attempts : 0,
      avgMovesUsed: attempts > 0 ? totalMoves / attempts : 0,
      failReasons,
    }
  }

  getAllInsights(): LevelInsights[] {
    const levelIds = new Set(this.getEvents().map((e) => e.levelId))
    const insights: LevelInsights[] = []

    for (const levelId of levelIds) {
      const insight = this.getInsightsForLevel(levelId)
      if (insight) {
        insights.push(insight)
      }
    }

    return insights.sort((a, b) => a.levelId - b.levelId)
  }

  // CSV export methods

  exportEventsAsCSV(): string {
    const events = this.getEvents()
    const headers = ['Timestamp', 'Level ID', 'Event Type', 'Metadata']

    const rows = events.map((e) => [
      new Date(e.timestamp).toISOString(),
      e.levelId.toString(),
      e.eventType,
      JSON.stringify(e.metadata),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return csvContent
  }

  exportInsightsAsCSV(): string {
    const insights = this.getAllInsights()
    const headers = [
      'Level ID',
      'Attempts',
      'Wins',
      'Fails',
      'Win Rate',
      'Avg Duration',
      'Avg Moves Used',
      'Fail Reasons',
    ]

    const rows = insights.map((i) => [
      i.levelId.toString(),
      i.attempts.toString(),
      i.wins.toString(),
      i.fails.toString(),
      `${i.winRate.toFixed(2)}%`,
      i.avgDuration.toFixed(1),
      i.avgMovesUsed.toFixed(1),
      JSON.stringify(i.failReasons),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return csvContent
  }

  exportLevelInsightsAsCSV(levelId: number): string {
    const insight = this.getInsightsForLevel(levelId)
    if (!insight) {
      return ''
    }

    const headers = [
      'Level ID',
      'Attempts',
      'Wins',
      'Fails',
      'Win Rate',
      'Avg Duration',
      'Avg Moves Used',
      'Fail Reasons',
    ]

    const row = [
      insight.levelId.toString(),
      insight.attempts.toString(),
      insight.wins.toString(),
      insight.fails.toString(),
      `${insight.winRate.toFixed(2)}%`,
      insight.avgDuration.toFixed(1),
      insight.avgMovesUsed.toFixed(1),
      JSON.stringify(insight.failReasons),
    ]

    const csvContent = [
      headers.join(','),
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','),
    ].join('\n')

    return csvContent
  }

  // Data management

  clearAll(): void {
    localStorage.removeItem(this.storageKey)
    this.currentSession = { levelId: null, startTime: null }
  }

  getCurrentStartTime(): number {
    return this.currentSession.startTime || Date.now()
  }

  // Private helper methods

  private saveEvent(event: AnalyticsEvent): void {
    const data = this.loadData()
    data.events.push(event)
    this.trimEvents(data)
    this.saveData(data)
  }

  private trimEvents(data: AnalyticsData): void {
    if (data.events.length > this.MAX_EVENTS) {
      // Keep only the most recent MAX_EVENTS events
      data.events = data.events.slice(-this.MAX_EVENTS)
    }
  }

  private loadData(): AnalyticsData {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    }

    return {
      events: [],
      currentSession: { levelId: null, startTime: null },
    }
  }

  private saveData(data: AnalyticsData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save analytics data:', error)
    }
  }

  private loadCurrentSession(): void {
    const data = this.loadData()
    this.currentSession = data.currentSession
  }

  private saveCurrentSession(): void {
    const data = this.loadData()
    data.currentSession = this.currentSession
    this.saveData(data)
  }

  generateMockData(): void {
    this.clearAll()
    const now = Date.now()
    const DAY_MS = 86400000

    // Realistic data for 74 unique players with natural progression funnel
    // Total: ~2,586 attempts across 30 levels
    const levelConfigs = [
      // Early levels (1-10) - High engagement
      { id: 1, attempts: 89, winRate: 0.95, avgDuration: 35, avgMoves: 8 },
      { id: 2, attempts: 94, winRate: 0.92, avgDuration: 40, avgMoves: 10 },
      { id: 3, attempts: 126, winRate: 0.85, avgDuration: 55, avgMoves: 12, failReason: 'out_of_moves' },
      { id: 4, attempts: 95, winRate: 0.90, avgDuration: 45, avgMoves: 11 },
      { id: 5, attempts: 99, winRate: 0.88, avgDuration: 50, avgMoves: 12 },
      { id: 6, attempts: 102, winRate: 0.86, avgDuration: 55, avgMoves: 13 },
      { id: 7, attempts: 105, winRate: 0.84, avgDuration: 60, avgMoves: 14 },
      { id: 8, attempts: 120, winRate: 0.78, avgDuration: 70, avgMoves: 16, failReason: 'out_of_moves' },
      { id: 9, attempts: 104, winRate: 0.82, avgDuration: 65, avgMoves: 15 },
      { id: 10, attempts: 106, winRate: 0.80, avgDuration: 70, avgMoves: 16 },

      // Medium levels (11-20) - Moderate engagement
      { id: 11, attempts: 109, winRate: 0.76, avgDuration: 75, avgMoves: 17 },
      { id: 12, attempts: 110, winRate: 0.72, avgDuration: 80, avgMoves: 18 },
      { id: 13, attempts: 113, winRate: 0.68, avgDuration: 90, avgMoves: 20, failReason: 'out_of_moves' },
      { id: 14, attempts: 92, winRate: 0.74, avgDuration: 85, avgMoves: 19 },
      { id: 15, attempts: 94, winRate: 0.70, avgDuration: 90, avgMoves: 20 },
      { id: 16, attempts: 94, winRate: 0.66, avgDuration: 95, avgMoves: 21 },
      { id: 17, attempts: 92, winRate: 0.62, avgDuration: 100, avgMoves: 22 },
      { id: 18, attempts: 90, winRate: 0.58, avgDuration: 110, avgMoves: 24, failReason: 'orders_not_completed' },
      { id: 19, attempts: 76, winRate: 0.64, avgDuration: 105, avgMoves: 23 },
      { id: 20, attempts: 75, winRate: 0.60, avgDuration: 110, avgMoves: 24 },

      // Hard levels (21-30) - Low engagement
      { id: 21, attempts: 77, winRate: 0.55, avgDuration: 115, avgMoves: 25 },
      { id: 22, attempts: 77, winRate: 0.50, avgDuration: 120, avgMoves: 26 },
      { id: 23, attempts: 80, winRate: 0.45, avgDuration: 130, avgMoves: 28, failReason: 'out_of_moves' },
      { id: 24, attempts: 65, winRate: 0.52, avgDuration: 125, avgMoves: 27 },
      { id: 25, attempts: 61, winRate: 0.48, avgDuration: 130, avgMoves: 28 },
      { id: 26, attempts: 63, winRate: 0.42, avgDuration: 140, avgMoves: 30, failReason: 'orders_not_completed' },
      { id: 27, attempts: 59, winRate: 0.40, avgDuration: 145, avgMoves: 31 },
      { id: 28, attempts: 48, winRate: 0.46, avgDuration: 140, avgMoves: 30 },
      { id: 29, attempts: 48, winRate: 0.38, avgDuration: 150, avgMoves: 32 },
      { id: 30, attempts: 44, winRate: 0.35, avgDuration: 160, avgMoves: 34, failReason: 'orders_not_completed' },
    ]

    levelConfigs.forEach(config => {
      // Create wins
      const wins = Math.round(config.attempts * config.winRate)
      const fails = config.attempts - wins

      // Generate Wins
      for (let i = 0; i < wins; i++) {
        const timeOffset = Math.floor(Math.random() * DAY_MS * 30) // Spread over last 30 days
        this.saveEvent({
          eventType: 'level_end',
          levelId: config.id,
          timestamp: now - timeOffset,
          metadata: {
            result: 'win',
            durationSec: config.avgDuration + (Math.random() * 20 - 10),
            movesUsed: config.avgMoves + Math.floor(Math.random() * 6 - 3)
          }
        })
      }

      // Generate Fails
      for (let i = 0; i < fails; i++) {
        const timeOffset = Math.floor(Math.random() * DAY_MS * 30) // Spread over last 30 days
        // For difficulty spike levels, use specific fail reasons
        let reason: 'out_of_moves' | 'orders_not_completed' = Math.random() > 0.5 ? 'out_of_moves' : 'orders_not_completed'

        if (config.failReason) {
          // For marked difficulty spikes, heavily favor the specified fail reason
          const specifiedReason = config.failReason as 'out_of_moves' | 'orders_not_completed'
          reason = Math.random() > 0.2 ? specifiedReason : (specifiedReason === 'out_of_moves' ? 'orders_not_completed' : 'out_of_moves')
        }

        this.saveEvent({
          eventType: 'level_end',
          levelId: config.id,
          timestamp: now - timeOffset,
          metadata: {
            result: 'fail',
            durationSec: config.avgDuration + (Math.random() * 30), // Fails often take longer
            movesUsed: config.avgMoves + Math.floor(Math.random() * 4), // Varied move usage on fail
            failReason: reason
          }
        })
      }
    })
  }
}

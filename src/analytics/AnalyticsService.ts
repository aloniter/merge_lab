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

    // Configuration for the "story"
    const levelConfigs = [
      { id: 1, attempts: 45, winRate: 0.92, avgDuration: 45, avgMoves: 12 },
      { id: 2, attempts: 38, winRate: 0.78, avgDuration: 65, avgMoves: 18 },
      // churn point - user narrative
      { id: 3, attempts: 32, winRate: 0.42, avgDuration: 95, avgMoves: 24, failReason: 'out_of_moves' },
      { id: 4, attempts: 15, winRate: 0.65, avgDuration: 80, avgMoves: 20 },
      { id: 5, attempts: 8, winRate: 0.55, avgDuration: 110, avgMoves: 28 },
    ]

    levelConfigs.forEach(config => {
      // Create wins
      const wins = Math.round(config.attempts * config.winRate)
      const fails = config.attempts - wins

      // Generate Wins
      for (let i = 0; i < wins; i++) {
        const timeOffset = Math.floor(Math.random() * DAY_MS * 7) // Spread over last 7 days
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
        const timeOffset = Math.floor(Math.random() * DAY_MS * 7)
        // For level 3, mostly "out_of_moves" to support the narrative
        // For others, random mix
        let reason: 'out_of_moves' | 'orders_not_completed' = Math.random() > 0.5 ? 'out_of_moves' : 'orders_not_completed'

        if (config.id === 3 && config.failReason) {
          reason = Math.random() > 0.2 ? 'out_of_moves' : 'orders_not_completed' // 80% out of moves
        }

        this.saveEvent({
          eventType: 'level_end',
          levelId: config.id,
          timestamp: now - timeOffset,
          metadata: {
            result: 'fail',
            durationSec: config.avgDuration + (Math.random() * 30), // Fails often take longer
            movesUsed: config.avgMoves + 5, // Used all moves
            failReason: reason
          }
        })
      }
    })
  }
}

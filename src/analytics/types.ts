export interface AnalyticsEvent {
  eventType: 'level_start' | 'move_used' | 'merge' | 'order_progress' | 'level_end'
  levelId: number
  timestamp: number
  metadata: Record<string, any>
}

export interface LevelStartEvent extends AnalyticsEvent {
  eventType: 'level_start'
  metadata: Record<string, never>
}

export interface MoveUsedEvent extends AnalyticsEvent {
  eventType: 'move_used'
  metadata: {
    moveIndex: number
  }
}

export interface MergeEvent extends AnalyticsEvent {
  eventType: 'merge'
  metadata: {
    fromTier: number
    toTier: number
  }
}

export interface OrderProgressEvent extends AnalyticsEvent {
  eventType: 'order_progress'
  metadata: {
    tier: number
    remaining: number
  }
}

export interface LevelEndEvent extends AnalyticsEvent {
  eventType: 'level_end'
  metadata: {
    result: 'win' | 'fail'
    durationSec: number
    movesUsed: number
    failReason?: 'out_of_moves' | 'orders_not_completed'
  }
}

export interface LevelInsights {
  levelId: number
  attempts: number
  wins: number
  fails: number
  winRate: number
  avgDuration: number
  avgMovesUsed: number
  failReasons: Record<string, number>
}

export interface AnalyticsData {
  events: AnalyticsEvent[]
  currentSession: {
    levelId: number | null
    startTime: number | null
  }
}

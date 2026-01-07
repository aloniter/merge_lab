type SoundType = 'tap' | 'merge' | 'win'

export class SoundManager {
  private static instance: SoundManager
  private static STORAGE_KEY = 'mergeLab_soundEnabled'

  private audioContext: AudioContext | null = null
  private enabled: boolean = true

  private readonly sounds: Record<SoundType, { frequencies: number[]; duration: number }> = {
    tap: { frequencies: [440], duration: 0.08 },
    merge: { frequencies: [523, 659, 784], duration: 0.15 },
    win: { frequencies: [523, 659, 784, 1047], duration: 0.4 }
  }

  private constructor() {
    this.loadPreference()
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  private loadPreference(): void {
    const stored = localStorage.getItem(SoundManager.STORAGE_KEY)
    this.enabled = stored !== 'false'
  }

  private savePreference(): void {
    localStorage.setItem(SoundManager.STORAGE_KEY, String(this.enabled))
  }

  isEnabled(): boolean {
    return this.enabled
  }

  toggle(): boolean {
    this.enabled = !this.enabled
    this.savePreference()
    return this.enabled
  }

  play(type: SoundType): void {
    if (!this.enabled) return

    // Lazy init AudioContext (requires user gesture)
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    const { frequencies, duration } = this.sounds[type]
    const ctx = this.audioContext
    const now = ctx.currentTime

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

      osc.start(now + i * 0.05)
      osc.stop(now + duration + i * 0.05)
    })
  }
}

import { SoundManager } from '../audio/SoundManager'
import { AnalyticsService } from '../analytics/AnalyticsService'

export class SettingsScreen {
  private containerEl: HTMLElement
  private sound: SoundManager

  constructor(containerId: string) {
    const el = document.getElementById(containerId)
    if (!el) throw new Error(`Container ${containerId} not found`)
    this.containerEl = el
    this.sound = SoundManager.getInstance()
    this.render()
  }

  private render(): void {
    const soundEnabled = this.sound.isEnabled()
    const isDarkMode = document.documentElement.classList.contains('dark')

    this.containerEl.innerHTML = `
      <div class="relative min-h-screen pb-32">
        <!-- Background orbs -->
        <div class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div class="absolute top-[-10%] left-[10%] w-[80%] h-[50%] bg-purple-300/30 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div class="absolute bottom-[10%] right-[-10%] w-[70%] h-[60%] bg-pink-300/30 dark:bg-primary/10 rounded-full blur-[100px]"></div>
        </div>

        <div class="relative z-10 px-6 py-8 max-w-md mx-auto">
          <h1 class="text-3xl font-black text-gray-900 dark:text-white mb-8">Settings</h1>

          <!-- Settings Cards -->
          <div class="space-y-4">
            <!-- Dark Mode -->
            <div class="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-2xl text-primary">dark_mode</span>
                  <div>
                    <h3 class="font-bold text-gray-900 dark:text-white">Dark Mode</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Toggle theme appearance</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer dark-mode-toggle" ${isDarkMode ? 'checked' : ''}>
                  <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            <!-- Sound -->
            <div class="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-2xl text-primary">${soundEnabled ? 'volume_up' : 'volume_off'}</span>
                  <div>
                    <h3 class="font-bold text-gray-900 dark:text-white">Sound Effects</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Toggle game sounds</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer sound-toggle" ${soundEnabled ? 'checked' : ''}>
                  <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            <!-- Clear Data -->
            <div class="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-2xl text-red-500">delete</span>
                  <div>
                    <h3 class="font-bold text-gray-900 dark:text-white">Clear Analytics</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Reset all gameplay data</p>
                  </div>
                </div>
                <button class="clear-analytics-btn px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors active:scale-95">
                  Clear
                </button>
              </div>
            </div>

            <!-- About -->
            <div class="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-4">
              <div class="flex items-center gap-3 mb-3">
                <span class="material-symbols-outlined text-2xl text-primary">info</span>
                <h3 class="font-bold text-gray-900 dark:text-white">About</h3>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong class="text-gray-900 dark:text-white">Merge Lab</strong> v1.0.0</p>

                <p class="mt-2">Created by <strong class="text-gray-900 dark:text-white">Alon Iter</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // Dark mode toggle
    const darkModeToggle = this.containerEl.querySelector('.dark-mode-toggle')
    darkModeToggle?.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked
      if (enabled) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem('darkMode', enabled ? 'true' : 'false')
    })

    // Sound toggle
    const soundToggle = this.containerEl.querySelector('.sound-toggle')
    soundToggle?.addEventListener('change', () => {
      this.sound.toggle()
      this.render() // Re-render to update icon
    })

    // Clear analytics
    const clearBtn = this.containerEl.querySelector('.clear-analytics-btn')
    clearBtn?.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
        AnalyticsService.getInstance().clearAll()
        this.showToast('Analytics data cleared successfully')
      }
    })
  }

  private showToast(message: string): void {
    const toast = document.createElement('div')
    toast.className = 'editor-toast'
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 2000)
  }
}

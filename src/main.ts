import './style.css'
import { MergeGame } from './game/MergeGame'
import { LevelEditor } from './game/LevelEditor'
import { InsightsDashboard } from './insights/InsightsDashboard'
import { SettingsScreen } from './settings/SettingsScreen'
import { Tutorial } from './game/Tutorial'
import { SoundManager } from './audio/SoundManager'
import { levels, getLevel, type Level, isLevelCompleted } from './data/levels'

type Screen = 'main-menu' | 'editor' | 'insights' | 'settings'

class App {
  private game: MergeGame | null = null
  private editor: LevelEditor | null = null
  private insightsDashboard: InsightsDashboard | null = null
  private settings: SettingsScreen | null = null
  private currentLevelId: number = 1
  private isPlaying: boolean = false

  constructor() {
    this.initDarkMode()
    this.render()
    this.setupNavigation()
    this.navigateTo('main-menu')
  }

  private initDarkMode(): void {
    const savedMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedMode === 'true' || (savedMode === null && prefersDark)) {
      document.documentElement.classList.add('dark')
    }
  }

  private render() {
    const app = document.querySelector<HTMLDivElement>('#app')!
    app.innerHTML = `
      <main class="flex-1 overflow-y-auto">
        <div id="main-menu" class="screen">
          <!-- Animated background orbs -->
          <div class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div class="absolute top-[-10%] left-[10%] w-[80%] h-[50%] bg-purple-300/30 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div class="absolute bottom-[10%] right-[-10%] w-[70%] h-[60%] bg-pink-300/30 dark:bg-primary/10 rounded-full blur-[100px]"></div>
            <div class="absolute top-[40%] left-[-20%] w-[50%] h-[50%] bg-blue-200/30 dark:bg-blue-900/10 rounded-full blur-[100px] animate-float"></div>
          </div>

          <!-- Header -->
          <header class="pt-16 pb-4 px-6 flex flex-col items-center justify-center animate-fade-in relative z-10">
            <div class="absolute top-8 text-[10px] font-bold tracking-[0.3em] text-gray-400 dark:text-gray-500 uppercase opacity-80">
              ALON ITER
            </div>
            <div class="relative">
              <h1 class="text-[#181114] dark:text-white tracking-tight text-[48px] font-black leading-none text-center drop-shadow-sm">
                Merge <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Lab</span>
              </h1>
              <span class="absolute -top-2 -right-6 text-primary material-symbols-outlined text-2xl animate-bounce">
                science
              </span>
            </div>
            <h2 class="text-[#6b5861] dark:text-gray-300 text-lg font-medium leading-tight tracking-wide text-center mt-3 max-w-[200px]">
              Experiment. Merge. Discover.
            </h2>
          </header>

          <!-- Main Content -->
          <main class="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto px-8 gap-8 relative z-10 pb-32">
            <div class="w-full flex flex-col gap-5 mt-8">
              <!-- Play Button (Quick Play) -->
              <button class="quick-play-btn relative w-full group overflow-hidden rounded-[2rem] p-[3px] focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all transform active:scale-95 hover:scale-[1.02] shadow-soft hover:shadow-glow">
                <div class="absolute inset-0 bg-gradient-to-r from-primary via-pink-500 to-purple-600 rounded-[2rem] animate-pulse-slow"></div>
                <div class="relative bg-white dark:bg-[#2A1821] h-24 rounded-[1.8rem] flex items-center justify-between px-8 gap-3 transition-all">
                  <div class="flex flex-col items-start">
                    <span class="text-gray-900 dark:text-white text-3xl font-black tracking-wide uppercase">Play</span>
                    <span class="text-primary text-xs font-bold tracking-widest uppercase current-level-label">Level 1</span>
                  </div>
                  <div class="w-14 h-14 bg-gradient-to-tr from-primary to-pink-500 rounded-full flex items-center justify-center shadow-lg text-white">
                    <span class="material-symbols-outlined text-[36px]">play_arrow</span>
                  </div>
                </div>
              </button>

              <!-- Choose Level Button -->
              <button class="choose-level-btn w-full h-16 bg-white/50 dark:bg-white/5 backdrop-blur-md text-gray-700 dark:text-gray-200 text-lg font-bold rounded-[2rem] flex items-center justify-center gap-3 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm">
                <span class="material-symbols-outlined text-primary/80">grid_view</span>
                <span>Choose Level</span>
              </button>
            </div>
          </main>
        </div>

        <div id="play" class="screen">
          <div id="game-container"></div>
        </div>

        <div id="insights" class="screen">
          <!-- Content populated by InsightsDashboard -->
        </div>

        <div id="editor" class="screen">
          <!-- Content populated by LevelEditor -->
        </div>

        <div id="settings" class="screen">
          <!-- Content populated by SettingsScreen -->
        </div>
      </main>

      <footer class="pb-10 pt-4 px-6 w-full max-w-md mx-auto z-10 fixed bottom-0 left-1/2 -translate-x-1/2">
        <div class="flex justify-around items-center px-3 py-4 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl rounded-[2.5rem] border border-gray-200/50 dark:border-white/20 shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <button class="nav-btn flex flex-col items-center gap-1 group w-16" data-screen="editor">
            <div class="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-all">
              <span class="material-symbols-outlined text-[24px] text-gray-600 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-pink-400 transition-all">edit</span>
            </div>
            <span class="text-[10px] font-bold tracking-wide uppercase text-gray-600 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-pink-400 transition-all">Editor</span>
          </button>

          <button class="nav-btn flex flex-col items-center gap-1 group w-16" data-screen="insights">
            <div class="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-all">
              <span class="material-symbols-outlined text-[24px] text-gray-600 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-pink-400 transition-all">monitoring</span>
            </div>
            <span class="text-[10px] font-bold tracking-wide uppercase text-gray-600 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-pink-400 transition-all">Insights</span>
          </button>

          <button class="nav-btn flex flex-col items-center gap-1 group w-16" data-screen="settings">
            <div class="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-all">
              <span class="material-symbols-outlined text-[24px] text-gray-600 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-pink-400 transition-all">settings</span>
            </div>
            <span class="text-[10px] font-bold tracking-wide uppercase text-gray-600 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-pink-400 transition-all">Settings</span>
          </button>

          <button class="nav-btn flex flex-col items-center gap-1 group w-16" data-screen="main-menu">
            <div class="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-all">
              <span class="material-symbols-outlined text-[24px] text-gray-600 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-pink-400 transition-all">home</span>
            </div>
            <span class="text-[10px] font-bold tracking-wide uppercase text-gray-600 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-pink-400 transition-all">Home</span>
          </button>
        </div>
      </footer>
    `
  }

  private setupNavigation() {
    // Navigation buttons
    const buttons = document.querySelectorAll<HTMLButtonElement>('.nav-btn')
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen as Screen
        this.navigateTo(screen)
      })
    })

    // Quick play button
    const quickPlayBtn = document.querySelector('.quick-play-btn')
    quickPlayBtn?.addEventListener('click', () => {
      this.quickPlay()
    })

    // Choose level button
    const chooseLevelBtn = document.querySelector('.choose-level-btn')
    chooseLevelBtn?.addEventListener('click', () => {
      this.showLevelSelectModal()
    })

    // Update current level label on main menu
    this.updateCurrentLevelLabel()
  }

  private navigateTo(screen: Screen) {
    // Update active screen
    const screens = document.querySelectorAll<HTMLDivElement>('.screen')
    screens.forEach(s => s.classList.remove('active'))
    document.getElementById(screen)?.classList.add('active')

    // Update active button styling
    const buttons = document.querySelectorAll<HTMLButtonElement>('.nav-btn')
    buttons.forEach(btn => {
      const iconContainer = btn.querySelector('div')
      const icon = btn.querySelector('.material-symbols-outlined')
      const label = btn.querySelector('span:last-child')

      if (btn.dataset.screen === screen) {
        // Active state - with glow and background
        iconContainer?.classList.add('bg-primary/15', 'dark:bg-pink-400/20')
        icon?.classList.remove('text-gray-600', 'dark:text-gray-300')
        icon?.classList.add('text-primary', 'dark:text-pink-400')
        label?.classList.remove('text-gray-600', 'dark:text-gray-300')
        label?.classList.add('text-primary', 'dark:text-pink-400', 'font-extrabold')
        // Add glow effect
        icon?.setAttribute('style', 'filter: drop-shadow(0 0 8px rgba(238, 43, 140, 0.4))')
      } else {
        // Inactive state
        iconContainer?.classList.remove('bg-primary/15', 'dark:bg-pink-400/20')
        icon?.classList.remove('text-primary', 'dark:text-pink-400')
        icon?.classList.add('text-gray-600', 'dark:text-gray-300')
        label?.classList.remove('text-primary', 'dark:text-pink-400', 'font-extrabold')
        label?.classList.add('text-gray-600', 'dark:text-gray-300')
        // Remove glow effect
        icon?.removeAttribute('style')
      }
    })

    // Initialize screens
    if (screen === 'editor') {
      this.initEditor()
    } else if (screen === 'insights') {
      this.initInsights()
    } else if (screen === 'settings') {
      this.initSettings()
    }
  }

  private quickPlay(): void {
    const currentLevelId = this.getCurrentLevelId()
    this.navigateToPlay()
    this.startLevel(currentLevelId)
  }

  private getCurrentLevelId(): number {
    const saved = localStorage.getItem('currentLevelId')
    if (saved) {
      return parseInt(saved)
    }
    // Default to first incomplete level or level 1
    for (let i = 1; i <= levels.length; i++) {
      if (!isLevelCompleted(i)) {
        return i
      }
    }
    return 1
  }

  private updateCurrentLevelLabel(): void {
    const currentLevelId = this.getCurrentLevelId()
    const label = document.querySelector('.current-level-label')
    if (label) {
      label.textContent = `Level ${currentLevelId}`
    }
  }

  private showLevelSelectModal(): void {
    const modal = document.createElement('div')
    modal.className = 'level-modal'
    modal.innerHTML = `
      <div class="w-full max-w-md mx-auto px-8 py-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-black text-white">Choose Level</h2>
          <button class="close-modal w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="grid grid-cols-5 gap-3">
          ${levels.map(l => `
            <button class="level-btn aspect-square rounded-xl font-bold text-lg transition-all relative
                           ${isLevelCompleted(l.id)
        ? 'bg-gradient-to-br from-green-500/30 to-green-600/30 border-2 border-green-500/50 text-white'
        : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 text-gray-300'
      }
                           hover:scale-105 active:scale-95"
                    data-level="${l.id}">
              <span>${l.id}</span>
              ${isLevelCompleted(l.id)
        ? '<span class="absolute top-1 right-1 text-green-400 text-xs">✓</span>'
        : ''
      }
            </button>
          `).join('')}
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Event listeners
    modal.querySelector('.close-modal')?.addEventListener('click', () => modal.remove())
    modal.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const levelId = parseInt((btn as HTMLElement).dataset.level || '1')
        modal.remove()
        localStorage.setItem('currentLevelId', levelId.toString())
        this.updateCurrentLevelLabel()
        this.navigateToPlay()
        this.startLevel(levelId)
      })
    })

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  private navigateToPlay(): void {
    // Update active screen
    const screens = document.querySelectorAll<HTMLDivElement>('.screen')
    screens.forEach(s => s.classList.remove('active'))
    document.getElementById('play')?.classList.add('active')

    // Clear active nav button styling
    const buttons = document.querySelectorAll<HTMLButtonElement>('.nav-btn')
    buttons.forEach(btn => {
      const iconContainer = btn.querySelector('div')
      const icon = btn.querySelector('.material-symbols-outlined')
      const label = btn.querySelector('span:last-child')
      iconContainer?.classList.remove('bg-primary/15', 'dark:bg-pink-400/20')
      icon?.classList.remove('text-primary', 'dark:text-pink-400')
      icon?.classList.add('text-gray-600', 'dark:text-gray-300')
      label?.classList.remove('text-primary', 'dark:text-pink-400', 'font-extrabold')
      label?.classList.add('text-gray-600', 'dark:text-gray-300')
      icon?.removeAttribute('style')
    })
  }

  private startLevel(levelId: number, customLevel?: Level) {
    this.currentLevelId = levelId
    this.isPlaying = true

    if (!this.game) {
      this.game = new MergeGame('game-container')
    }

    const level = customLevel || getLevel(levelId)
    this.game.loadLevel(level, () => this.onLevelComplete(), () => this.exitLevel())
  }

  private onLevelComplete() {
    // Go to next level if available
    if (this.currentLevelId < 30) {
      const nextLevelId = this.currentLevelId + 1
      localStorage.setItem('currentLevelId', nextLevelId.toString())
      this.updateCurrentLevelLabel()
      this.startLevel(nextLevelId)
    } else {
      // All levels complete
      this.isPlaying = false
      this.exitLevel()
    }
  }

  private initEditor() {
    if (!this.editor) {
      this.editor = new LevelEditor('editor', (level) => {
        this.navigateToPlay()
        this.startLevel(level.id, level)
      })
    }
  }

  private initInsights() {
    if (!this.insightsDashboard) {
      this.insightsDashboard = new InsightsDashboard('insights')
    } else {
      this.insightsDashboard.refresh()
    }
  }

  private initSettings() {
    if (!this.settings) {
      this.settings = new SettingsScreen('settings')
    }
  }

  private exitLevel(): void {
    this.isPlaying = false
    this.navigateTo('main-menu')
    this.updateCurrentLevelLabel()
  }
}

// Initialize app
new App()

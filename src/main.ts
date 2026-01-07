import './style.css'
import { MergeGame } from './game/MergeGame'
import { LevelEditor } from './game/LevelEditor'
import { InsightsDashboard } from './insights/InsightsDashboard'
import { Tutorial } from './game/Tutorial'
import { SoundManager } from './audio/SoundManager'
import { levels, getLevel, type Level, isLevelCompleted } from './data/levels'

type Screen = 'home' | 'play' | 'editor' | 'insights'

class App {
  private game: MergeGame | null = null
  private editor: LevelEditor | null = null
  private insightsDashboard: InsightsDashboard | null = null
  private currentLevelId: number = 1
  private isPlaying: boolean = false

  constructor() {
    this.render()
    this.setupNavigation()
    this.navigateTo('home')
  }

  private render() {
    const app = document.querySelector<HTMLDivElement>('#app')!
    const soundEnabled = SoundManager.getInstance().isEnabled()
    app.innerHTML = `
      <header>
        <h1>Merge Lab</h1>
        <button class="sound-toggle" aria-label="Toggle sound">
          <span class="sound-icon">${soundEnabled ? '🔊' : '🔇'}</span>
        </button>
      </header>

      <main>
        <div id="home" class="screen">
          <h2>Welcome to Merge Lab</h2>
          <p>A mobile-first casual merge game prototype.</p>
          <p>Navigate using the tabs below to explore different sections.</p>
        </div>

        <div id="play" class="screen">
          <div id="game-container"></div>
        </div>

        <div id="editor" class="screen">
          <div id="editor-container"></div>
        </div>

        <div id="insights" class="screen">
          <!-- Content populated by InsightsDashboard -->
        </div>
      </main>

      <footer>
        <button class="nav-btn" data-screen="home">Home</button>
        <button class="nav-btn" data-screen="play">Play</button>
        <button class="nav-btn" data-screen="editor">Editor</button>
        <button class="nav-btn" data-screen="insights">Insights</button>
      </footer>
    `
  }

  private setupNavigation() {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.nav-btn')
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen as Screen
        this.navigateTo(screen)
      })
    })

    // Sound toggle
    const soundBtn = document.querySelector('.sound-toggle')
    soundBtn?.addEventListener('click', () => {
      const enabled = SoundManager.getInstance().toggle()
      const icon = soundBtn.querySelector('.sound-icon')
      if (icon) icon.textContent = enabled ? '🔊' : '🔇'
    })
  }

  private navigateTo(screen: Screen) {
    // Update active screen
    const screens = document.querySelectorAll<HTMLDivElement>('.screen')
    screens.forEach(s => s.classList.remove('active'))
    document.getElementById(screen)?.classList.add('active')

    // Update active button
    const buttons = document.querySelectorAll<HTMLButtonElement>('.nav-btn')
    buttons.forEach(btn => {
      if (btn.dataset.screen === screen) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    })

    // Initialize screens
    if (screen === 'play') {
      this.initPlayScreen()
    } else if (screen === 'editor') {
      this.initEditor()
    } else if (screen === 'insights') {
      this.initInsights()
    }
  }

  private initPlayScreen() {
    if (!this.game) {
      this.game = new MergeGame('game-container')
    }

    if (!this.isPlaying) {
      // Check if tutorial should show for first-time users
      if (!Tutorial.hasSeenTutorial()) {
        const container = document.getElementById('game-container')
        if (container) {
          const tutorial = new Tutorial()
          tutorial.show(container, () => this.showLevelSelect())
        }
      } else {
        this.showLevelSelect()
      }
    }
  }

  private showLevelSelect() {
    const container = document.getElementById('game-container')
    if (!container) return

    container.innerHTML = `
      <div class="level-select-screen">
        <h2>Select Level</h2>
        <div class="level-grid">
          ${levels.map(l => `
            <button class="level-btn ${isLevelCompleted(l.id) ? 'completed' : ''}" data-level="${l.id}">
              <span class="level-number">${l.id}</span>
              ${isLevelCompleted(l.id) ? '<span class="completion-check">✓</span>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `

    container.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const levelId = parseInt((btn as HTMLElement).dataset.level || '1')
        this.startLevel(levelId)
      })
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
      this.startLevel(this.currentLevelId + 1)
    } else {
      // All levels complete
      this.isPlaying = false
      this.showLevelSelect()
    }
  }

  private initEditor() {
    if (!this.editor) {
      this.editor = new LevelEditor('editor-container', (level) => {
        this.playLevelFromEditor(level)
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

  private playLevelFromEditor(level: Level) {
    this.navigateTo('play')
    this.startLevel(level.id, level)
  }

  private exitLevel(): void {
    this.isPlaying = false
    this.showLevelSelect()
  }
}

// Initialize app
new App()

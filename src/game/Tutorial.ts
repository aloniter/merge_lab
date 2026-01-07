interface TutorialStep {
  title: string
  description: string
  icon: string
}

export class Tutorial {
  private static STORAGE_KEY = 'mergeLab_tutorialSeen'

  private currentStep: number = 0
  private overlay: HTMLElement | null = null
  private onComplete: (() => void) | null = null

  private readonly steps: TutorialStep[] = [
    {
      title: 'Place Tiles',
      description: 'Tap any empty cell to place a tile',
      icon: '1'
    },
    {
      title: 'Merge Adjacent',
      description: 'Match adjacent tiles to merge them into higher tiers',
      icon: '2'
    },
    {
      title: 'Complete Orders',
      description: 'Complete all orders before you run out of moves',
      icon: '3'
    }
  ]

  static hasSeenTutorial(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'true'
  }

  private static markAsSeen(): void {
    localStorage.setItem(this.STORAGE_KEY, 'true')
  }

  show(containerEl: HTMLElement, onComplete: () => void): void {
    this.onComplete = onComplete
    this.currentStep = 0
    this.render(containerEl)
  }

  private render(containerEl: HTMLElement): void {
    // Remove existing overlay if any
    this.overlay?.remove()

    const step = this.steps[this.currentStep]
    const isLastStep = this.currentStep === this.steps.length - 1

    this.overlay = document.createElement('div')
    this.overlay.className = 'tutorial-overlay'
    this.overlay.innerHTML = `
      <div class="tutorial-content">
        <div class="tutorial-step-icon">${step.icon}</div>
        <h2 class="tutorial-title">${step.title}</h2>
        <p class="tutorial-desc">${step.description}</p>

        <div class="tutorial-dots">
          ${this.steps.map((_, i) => `
            <div class="tutorial-dot ${i === this.currentStep ? 'active' : ''}"></div>
          `).join('')}
        </div>

        <button class="tutorial-btn">${isLastStep ? 'Start Playing' : 'Next'}</button>
        ${!isLastStep ? '<button class="tutorial-skip">Skip tutorial</button>' : ''}
      </div>
    `

    containerEl.appendChild(this.overlay)

    // Event listeners
    this.overlay.querySelector('.tutorial-btn')?.addEventListener('click', () => {
      if (isLastStep) {
        this.completeTutorial()
      } else {
        this.nextStep(containerEl)
      }
    })

    this.overlay.querySelector('.tutorial-skip')?.addEventListener('click', () => {
      this.completeTutorial()
    })
  }

  private nextStep(containerEl: HTMLElement): void {
    this.currentStep++
    this.render(containerEl)
  }

  private completeTutorial(): void {
    Tutorial.markAsSeen()
    this.overlay?.remove()
    this.overlay = null
    if (this.onComplete) this.onComplete()
  }
}

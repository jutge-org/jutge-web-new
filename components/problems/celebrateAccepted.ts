import confetti from 'canvas-confetti'

export const PROBLEM_HEADER_ICON_SELECTOR = '[data-problem-header-icon]'

const SUCCESS_SOUNDS = [
    '/sounds/success-1.mp3',
    '/sounds/success-2.mp3',
    '/sounds/success-3.mp3',
    '/sounds/success-4.mp3',
    '/sounds/success-5.mp3',
] as const

function playRandomSuccessSound() {
    const src = SUCCESS_SOUNDS[Math.floor(Math.random() * SUCCESS_SOUNDS.length)]!
    void new Audio(src).play()
}

export function launchAcceptedConfetti(originEl: HTMLElement, playSound: boolean) {
    const rect = originEl.getBoundingClientRect()
    const origin = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
    }

    if (playSound) {
        playRandomSuccessSound()
    }

    confetti({
        particleCount: 60,
        spread: 30,
        startVelocity: 28,
        scalar: 0.85,
        origin,
        colors: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ffffff'],
    })

    confetti({
        particleCount: 30,
        spread: 70,
        startVelocity: 18,
        scalar: 0.7,
        origin,
        colors: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#ffffff'],
    })
}

export function celebrateProblemHeaderIcon(playSound: boolean) {
    const originEl = document.querySelector(PROBLEM_HEADER_ICON_SELECTOR)
    if (!(originEl instanceof HTMLElement)) {
        return
    }

    launchAcceptedConfetti(originEl, playSound)
}

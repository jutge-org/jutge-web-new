'use client'

import confetti from 'canvas-confetti'
import { useAppearancePreferences } from '@/components/AppearancePreferencesProvider'
import { isSoundEffectsEnabled } from '@/lib/soundEffects'

import '@/styles/years-ribbon.css'
import { isMotionReduced } from '@/lib/reducedMotion'

const AUDIO_SRC = '/sounds/352655__foolboymedia__piano-notification-5a.mp3'

let audioClip: HTMLAudioElement | undefined

function playRibbonSound() {
    audioClip ??= new Audio(AUDIO_SRC)
    void audioClip.play()
}

function launchConfetti(playSound: boolean) {
    const origin = { x: 0.5, y: 0.08 }

    if (playSound) {
        playRibbonSound()
    }

    confetti({
        particleCount: 80,
        spread: 800,
        startVelocity: 35,
        origin,
        colors: ['#5dd9ff', '#00bfff', '#0080ff', '#0045bc', '#ffffff'],
    })

    confetti({
        particleCount: 20,
        spread: 1200,
        startVelocity: 50,
        origin,
        colors: ['#5dd9ff', '#00bfff', '#0080ff', '#0045bc', '#ffffff'],
    })

    confetti({
        particleCount: 100,
        spread: 6000,
        startVelocity: 25,
        origin,
        scalar: 0.9,
        colors: ['#5dd9ff', '#00bfff', '#0080ff', '#0045bc', '#ffffff'],
    })
}

export function HomeYearsRibbon() {
    const { soundEffects } = useAppearancePreferences()
    const { reducedMotion } = useAppearancePreferences()
    const motionReduced = isMotionReduced(reducedMotion)

    return (
        <button
            type="button"
            className="years-ribbon"
            data-ribbon="20 Years 🎂"
            aria-label="Celebrate 20 years of Jutge.org"
            onClick={() => 
                {
                    if (!motionReduced) {
                        launchConfetti(isSoundEffectsEnabled(soundEffects))
                    }
                }
            }
        />
    )
}

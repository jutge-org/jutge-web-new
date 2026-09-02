'use client'

import confetti from 'canvas-confetti'
import Image from 'next/image'
import { useRef } from 'react'

import { useAppearancePreferences } from '@/components/AppearancePreferencesProvider'
import { isMotionReduced } from '@/lib/reducedMotion'
import { isSoundEffectsEnabled } from '@/lib/soundEffects'

const VERDICT_IMAGE_SRCS = ['/verdicts/svg/AC.svg', '/verdicts/svg/WA.svg'] as const
const PARTICLE_SCALAR = 8

let verdictShapesPromise: Promise<confetti.Shape[]> | null = null
let verdictConfetti: confetti.CreateTypes | null = null

const AUDIO_SRC = '/sounds/u_o8xh7gwsrj-cute_happy_victory-476376.mp3'

let audioClip: HTMLAudioElement | undefined

function playWelcomeSound() {
    audioClip ??= new Audio(AUDIO_SRC)
    void audioClip.play()
}

function getVerdictConfetti() {
    verdictConfetti ??= confetti.create(undefined, { resize: true, useWorker: false })
    return verdictConfetti
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img')
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`Failed to load ${src}`))
        img.src = src
    })
}

async function shapeFromImage(src: string, scalar: number): Promise<confetti.Shape> {
    const size = Math.round(10 * scalar)
    const img = await loadImage(src)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) {
        throw new Error('Could not create canvas context')
    }
    ctx.drawImage(img, 0, 0, size, size)
    const bitmap = await createImageBitmap(canvas)
    const scale = 1 / scalar

    return {
        type: 'bitmap',
        bitmap,
        matrix: [scale, 0, 0, scale, -bitmap.width * scale / 2, -bitmap.height * scale / 2],
    } as unknown as confetti.Shape
}

function getVerdictShapes() {
    verdictShapesPromise ??= Promise.all(VERDICT_IMAGE_SRCS.map((src) => shapeFromImage(src, PARTICLE_SCALAR)))
    return verdictShapesPromise
}

async function launchVerdictConfetti(originEl: HTMLElement, playSound: boolean) {
    const shapes = await getVerdictShapes()
    const rect = originEl.getBoundingClientRect()
    const origin = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
    }

    if (playSound) {
        playWelcomeSound()
    }


    const fire = getVerdictConfetti()

    fire({
        particleCount: 10,
        spread: 400,
        startVelocity: 34,
        scalar: PARTICLE_SCALAR,
        origin,
        shapes,
        ticks: 2200,
    })

    fire({
        particleCount: 6,
        spread: 360,
        startVelocity: 18,
        scalar: PARTICLE_SCALAR,
        origin,
        shapes,
        ticks: 2000,
    })
}

function HeroLogo() {
    const logoRef = useRef<HTMLButtonElement>(null)
    const { reducedMotion } = useAppearancePreferences()
    const motionReduced = isMotionReduced(reducedMotion)
    const { soundEffects } = useAppearancePreferences()
    const playSound = isSoundEffectsEnabled(soundEffects)

    const image = <Image src="/jutge/modern.png" alt="Jutge.org" width={192} height={192} loading="eager" />

    if (motionReduced) {
        return <div className="flex justify-center">{image}</div>
    }

    return (
        <div className="flex justify-center">
            <button
                ref={logoRef}
                type="button"
                className="cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Celebrate with accepted and wrong-answer confetti"
                onClick={() => {
                    if (logoRef.current) {
                        void launchVerdictConfetti(logoRef.current, playSound)
                    }
                }}
            >
                <Image src="/jutge/modern.png" alt="" width={192} height={192} loading="eager" />
            </button>
        </div>
    )
}

export function HeroBlock() {
    return (
        <section id="home-hero" className="relative scroll-mt-14" aria-label="Jutge.org">
            <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                <div>
                    <HeroLogo />

                    <h1 className="mb-6 inline-block pb-1 font-normal text-4xl leading-[1.2] tracking-wide text-balance text-8xl text-[var(--color-brand-title)] dark:bg-linear-to-r dark:from-cyan-300 dark:via-sky-400 dark:to-blue-500 dark:bg-clip-text font-thin dark:text-transparent">
                        Jutge.org
                    </h1>
                    <p className="mx-auto max-w-3xl text-muted-foreground lg:text-2xl dark:font-thin">
                        The Virtual Learning Environment for Computer Programming
                    </p>
                </div>
            </div>
        </section>
    )
}

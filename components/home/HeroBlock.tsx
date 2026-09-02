'use client'

import confetti from 'canvas-confetti'
import Image from 'next/image'
import { useRef } from 'react'

import { useAppearancePreferences } from '@/components/AppearancePreferencesProvider'
import { isMotionReduced } from '@/lib/reducedMotion'
import { isSoundEffectsEnabled } from '@/lib/soundEffects'

const VERDICT_IMAGE_SRCS = ['/verdicts/svg/AC.svg', '/verdicts/svg/WA.svg'] as const
const PARTICLE_SCALAR = 8
// Firefox smears CanvasPattern edge pixels into "tails" when opaque pixels
// touch the bitmap boundary (https://github.com/catdad/canvas-confetti/issues/213).
const BITMAP_EDGE_PADDING_RATIO = 0.25

let verdictShapesPromise: Promise<confetti.Shape[]> | null = null
let verdictCanvas: HTMLCanvasElement | null = null
let verdictConfetti: confetti.CreateTypes | null = null

const AUDIO_SRC = '/sounds/u_o8xh7gwsrj-cute_happy_victory-476376.mp3'

let audioClip: HTMLAudioElement | undefined

function playWelcomeSound() {
    audioClip ??= new Audio(AUDIO_SRC)
    void audioClip.play()
}

function syncConfettiCanvasSize(canvas: HTMLCanvasElement) {
    const width = document.documentElement.clientWidth
    const height = document.documentElement.clientHeight
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    if (canvas.width !== width) {
        canvas.width = width
    }
    if (canvas.height !== height) {
        canvas.height = height
    }
}

function getVerdictConfetti() {
    if (verdictConfetti && verdictCanvas) {
        syncConfettiCanvasSize(verdictCanvas)
        return verdictConfetti
    }

    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.position = 'fixed'
    canvas.style.top = '0px'
    canvas.style.left = '0px'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '100'
    document.body.appendChild(canvas)
    syncConfettiCanvasSize(canvas)
    window.addEventListener('resize', () => syncConfettiCanvasSize(canvas))

    verdictCanvas = canvas
    // Size the buffer ourselves so CSS box and pixel buffer stay 1:1 in Firefox.
    verdictConfetti = confetti.create(canvas, { resize: false, useWorker: false })
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
    const imageSize = Math.round(10 * scalar)
    const padding = Math.max(8, Math.round(imageSize * BITMAP_EDGE_PADDING_RATIO))
    const canvasSize = imageSize + padding * 2
    const img = await loadImage(src)
    const canvas = document.createElement('canvas')
    canvas.width = canvasSize
    canvas.height = canvasSize
    const ctx = canvas.getContext('2d')
    if (!ctx) {
        throw new Error('Could not create canvas context')
    }
    ctx.drawImage(img, padding, padding, imageSize, imageSize)
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
        x: (rect.left + rect.width / 2) / document.documentElement.clientWidth,
        y: (rect.top + rect.height / 2) / document.documentElement.clientHeight,
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
        <section id="home-hero" className="scroll-mt-14" aria-label="Jutge.org">
            <div className="flex flex-col items-center gap-6 text-center">
                <div>
                    <HeroLogo />

                    <h1 className="mb-6 inline-block pb-1 font-normal leading-[1.2] tracking-wide text-balance text-7xl sm:text-8xl text-[var(--color-brand-title)] dark:bg-linear-to-r dark:from-cyan-300 dark:via-sky-400 dark:to-blue-500 dark:bg-clip-text font-thin dark:text-transparent">
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

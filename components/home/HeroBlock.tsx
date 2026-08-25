'use client'

import { AnimatedGroup, AnimatedText } from '@/components/smoothui/shared'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import styles from './hero-grid.module.css'

const CELL_SIZE = 120
const COLORS = ['oklch(0.72 0.16 232)', '#A764FF', '#4B94FD', '#FD4B4E', '#FF8743']

function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function SubGrid() {
    const [cellColors, setCellColors] = useState<(string | null)[]>([null, null, null, null])
    const leaveTimeouts = useRef<(ReturnType<typeof setTimeout> | null)[]>([null, null, null, null])

    function handleHover(cellIdx: number) {
        const timeout = leaveTimeouts.current[cellIdx]
        if (timeout) {
            clearTimeout(timeout)
            leaveTimeouts.current[cellIdx] = null
        }
        setCellColors((prev) => prev.map((c, i) => (i === cellIdx ? getRandomColor() : c)))
    }

    function handleLeave(cellIdx: number) {
        leaveTimeouts.current[cellIdx] = setTimeout(() => {
            setCellColors((prev) => prev.map((c, i) => (i === cellIdx ? null : c)))
            leaveTimeouts.current[cellIdx] = null
        }, 120)
    }

    useEffect(
        () => () => {
            for (const t of leaveTimeouts.current) {
                if (t) clearTimeout(t)
            }
        },
        [],
    )

    return (
        <div className={styles.subgrid} style={{ pointerEvents: 'none' }}>
            {[0, 1, 2, 3].map((cellIdx) => (
                <button
                    className={styles.cell}
                    key={cellIdx}
                    onMouseEnter={() => handleHover(cellIdx)}
                    onMouseLeave={() => handleLeave(cellIdx)}
                    style={{
                        background: cellColors[cellIdx] || 'transparent',
                        pointerEvents: 'auto',
                    }}
                    type="button"
                    tabIndex={-1}
                    aria-hidden
                />
            ))}
        </div>
    )
}

function InteractiveGrid() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [grid, setGrid] = useState({ columns: 0, rows: 0 })

    useEffect(() => {
        function updateGrid() {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect()
                setGrid({
                    columns: Math.ceil(width / CELL_SIZE),
                    rows: Math.ceil(height / CELL_SIZE),
                })
            }
        }
        updateGrid()
        window.addEventListener('resize', updateGrid)
        return () => window.removeEventListener('resize', updateGrid)
    }, [])

    const total = grid.columns * grid.rows

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0"
            ref={containerRef}
            style={{ width: '100%', height: '100%' }}
        >
            <div
                className={styles.mainGrid}
                style={
                    {
                        gridTemplateColumns: `repeat(${grid.columns}, 1fr)`,
                        gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
                        '--grid-cell-size': `${CELL_SIZE}px`,
                        width: '100%',
                        height: '100%',
                    } as React.CSSProperties
                }
            >
                {Array.from({ length: total }, (_, idx) => (
                    <SubGrid key={`subgrid-${grid.columns}-${grid.rows}-${idx}`} />
                ))}
            </div>
        </div>
    )
}

export function HeroBlock() {
    return (
        <section id="home-hero" className="relative scroll-mt-14 overflow-hidden" aria-label="Jutge.org">
            <AnimatedGroup
                className="pointer-events-none relative z-10 flex flex-col items-center gap-6 text-center"
                preset="blur-slide"
            >
                <div>
                    <div className="flex justify-center">
                        <Image src="/jutge/modern.png" alt="Jutge.org" width={192} height={192} />
                    </div>

                    <AnimatedText
                        as="h1"
                        className="mb-6 inline-block bg-linear-to-r from-cyan-600 via-sky-600 to-blue-700 bg-clip-text pb-1 font-normal dark:font-thin text-4xl leading-[1.2] tracking-wide text-balance text-transparent text-8xl dark:from-cyan-300 dark:via-sky-400 dark:to-blue-500"
                    >
                        Jutge.org
                    </AnimatedText>
                    <AnimatedText
                        as="p"
                        className="mx-auto max-w-3xl text-muted-foreground lg:text-2xl dark:font-thin"
                        delay={0.15}
                    >
                        The Virtual Learning Environment for Computer Programming
                    </AnimatedText>
                </div>
            </AnimatedGroup>
        </section>
    )
}

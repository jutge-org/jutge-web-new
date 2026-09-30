'use client'

import { motion } from 'motion/react'
import { useCallback, useRef, useState, type MouseEvent, type ReactNode } from 'react'

const TILT_FACTOR = 20
const HOVER_SCALE = 1.07
const PERSPECTIVE = 1000
const GLARE_INTENSITY = 0.05
const TILT_TRANSITION = { duration: 0.2, ease: 'easeOut' as const }
const SHADOW_REST = '0 10px 30px -10px rgba(0, 0, 0, 0.2)'
const SHADOW_HOVER = '0 25px 50px -12px rgba(0, 0, 0, 0.6)'

type TiltFrameProps = {
    children: ReactNode
    className?: string
    frameClassName?: string
    staticClassName?: string
    reducedMotion?: boolean
    glare?: boolean
    shadow?: boolean
}

export function TiltFrame({
    children,
    className,
    frameClassName,
    staticClassName,
    reducedMotion = false,
    glare = true,
    shadow = true,
}: TiltFrameProps) {
    const frameRef = useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = useState(false)
    const [tilt, setTilt] = useState({ x: 0, y: 0 })
    const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 })

    const onMouseMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
        const element = frameRef.current
        if (!element) return
        const rect = element.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 100
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 100
        setGlarePosition({ x: x / 2 + 50, y: y / 2 + 50 })
        setTilt({ x: -(y / 50) * TILT_FACTOR, y: (x / 50) * TILT_FACTOR })
    }, [])

    if (reducedMotion) {
        return <div className={staticClassName ?? className}>{children}</div>
    }

    return (
        <div
            ref={frameRef}
            className={className}
            style={{ perspective: `${PERSPECTIVE}px` }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false)
                setTilt({ x: 0, y: 0 })
            }}
            onMouseMove={onMouseMove}
        >
            <motion.div
                animate={{ scale: hovered ? HOVER_SCALE : 1 }}
                className="pointer-events-none"
                style={{ transformStyle: 'preserve-3d' }}
                transition={TILT_TRANSITION}
            >
                <motion.div
                    animate={{
                        rotateX: tilt.x,
                        rotateY: tilt.y,
                        ...(shadow ? { boxShadow: hovered ? SHADOW_HOVER : SHADOW_REST } : {}),
                    }}
                    className={frameClassName}
                    style={{ transformStyle: 'preserve-3d' }}
                    transition={TILT_TRANSITION}
                >
                    {children}
                    {glare ? (
                        <motion.div
                            aria-hidden
                            animate={{ opacity: hovered ? 1 : 0 }}
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, ${GLARE_INTENSITY}) 0%, rgba(255, 255, 255, 0) 80%)`,
                            }}
                            transition={TILT_TRANSITION}
                        />
                    ) : null}
                </motion.div>
            </motion.div>
        </div>
    )
}

'use client'

import { useEffect, useRef } from 'react'

import { useAppearancePreferences } from '@/components/AppearancePreferencesProvider'
import { celebrateProblemHeaderIcon } from '@/components/problems/celebrateAccepted'
import { isMotionReduced } from '@/lib/reducedMotion'
import { isSoundEffectsEnabled } from '@/lib/soundEffects'

export function useCelebratePendingToAc(verdict: string | undefined) {
    const previousVerdictRef = useRef<string | undefined>(undefined)
    const { reducedMotion, soundEffects } = useAppearancePreferences()

    useEffect(() => {
        const previousVerdict = previousVerdictRef.current
        previousVerdictRef.current = verdict

        if (previousVerdict !== 'Pending' || verdict !== 'AC') {
            return
        }

        if (isMotionReduced(reducedMotion)) {
            return
        }

        const frameId = window.requestAnimationFrame(() => {
            celebrateProblemHeaderIcon(isSoundEffectsEnabled(soundEffects))
        })

        return () => window.cancelAnimationFrame(frameId)
    }, [verdict, reducedMotion, soundEffects])
}

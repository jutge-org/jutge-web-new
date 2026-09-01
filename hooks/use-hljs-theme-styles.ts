'use client'

import { useEffect } from 'react'

import type { HljsThemeSelection } from '@/lib/hljsThemes'

const STYLE_ID = 'submission-hljs-theme-style'

export function useHljsThemeStyles(theme: HljsThemeSelection) {
    useEffect(() => {
        if (theme === 'auto') {
            document.getElementById(STYLE_ID)?.remove()
            return
        }

        let cancelled = false
        const controller = new AbortController()

        async function loadTheme() {
            try {
                const response = await fetch(`/api/hljs-themes/${theme}`, { signal: controller.signal })
                if (!response.ok || cancelled) {
                    return
                }

                const css = await response.text()
                if (cancelled) {
                    return
                }

                let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
                if (!style) {
                    style = document.createElement('style')
                    style.id = STYLE_ID
                    document.head.appendChild(style)
                }

                style.textContent = css
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return
                }
                throw error
            }
        }

        void loadTheme()

        return () => {
            cancelled = true
            controller.abort()
        }
    }, [theme])
}

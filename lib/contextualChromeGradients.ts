import { cn } from '@/lib/utils'

const chromeBaseClassName = 'bg-muted dark:bg-background'

/** Background for header, footer, and other app chrome (optional role tint). */
export function contextualChromeBackgroundClassName(pathname: string, gradientsEnabled: boolean): string {
    if (gradientsEnabled && pathname.startsWith('/administrator')) {
        return cn(
            chromeBaseClassName,
            'bg-gradient-to-r from-orange-300 to-muted',
            'dark:from-orange-950 dark:to-background',
        )
    }
    if (gradientsEnabled && pathname.startsWith('/instructor')) {
        return cn(
            chromeBaseClassName,
            'bg-gradient-to-r from-purple-300 to-muted',
            'dark:from-purple-950 dark:to-background',
        )
    }
    if (gradientsEnabled && pathname.startsWith('/supervision')) {
        return cn(
            chromeBaseClassName,
            'bg-gradient-to-r from-emerald-300 to-muted',
            'dark:from-emerald-950 dark:to-background',
        )
    }

    return chromeBaseClassName
}

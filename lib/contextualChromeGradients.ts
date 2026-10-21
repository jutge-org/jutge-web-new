import { cn } from '@/lib/utils'

const chromeBaseClassName = 'bg-muted dark:bg-background'

/** Grey chrome with optional role tint (admin / instructor / supervision). */
export function contextualChromeBackgroundClassName(pathname: string, gradientsEnabled: boolean): string {
    if (!gradientsEnabled) {
        return chromeBaseClassName
    }

    if (pathname.startsWith('/administrator')) {
        return cn(
            chromeBaseClassName,
            'bg-gradient-to-r from-orange-300 via-yellow-100/90 to-transparent',
            'dark:from-orange-950 dark:via-yellow-950/50 dark:to-transparent',
        )
    }

    if (pathname.startsWith('/instructor')) {
        return cn(
            chromeBaseClassName,
            'bg-gradient-to-r from-purple-300 via-fuchsia-100/90 to-transparent',
            'dark:from-purple-950 dark:via-fuchsia-950/50 dark:to-transparent',
        )
    }

    if (pathname.startsWith('/supervision')) {
        return cn(
            chromeBaseClassName,
            'bg-gradient-to-r from-emerald-300 via-green-100/90 to-transparent',
            'dark:from-emerald-950 dark:via-green-950/50 dark:to-transparent',
        )
    }

    return chromeBaseClassName
}

import { cn } from '@/lib/utils'

/** Large round actions in `ProblemHeaderCard` (statement, submissions, submit). */
export const problemHeaderRoundIconClassName = cn(
    'relative z-[1] size-16 shrink-0 rounded-full border border-border bg-background text-foreground shadow-sm',
    'transition-[border-color,box-shadow,transform] duration-300 ease-out',
    'hover:bg-background hover:text-foreground',
    'group-hover:border-[color-mix(in_oklab,var(--color-foreground)_12%,var(--color-blue))]',
    'group-hover:shadow-[0_8px_28px_-8px_color-mix(in_oklab,var(--color-blue)_35%,transparent)]',
    'group-hover:ring-1 group-hover:ring-[color-mix(in_oklab,var(--color-foreground)_15%,var(--color-blue))]',
)

export const problemHeaderRoundIconGlowClassName =
    'pointer-events-none absolute -inset-0.5 z-0 rounded-full bg-gradient-to-br from-[color-mix(in_oklab,var(--color-blue)_40%,transparent)] via-[color-mix(in_oklab,var(--color-blue-hover)_30%,transparent)] to-[color-mix(in_oklab,var(--color-blue)_25%,transparent)] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100'

import { utilitiesIndexItems } from '@/lib/utilities'
import { cn } from '@/lib/utils'
import { LanguagesIcon, LineSquiggleIcon, PocketKnifeIcon, TerminalIcon } from 'lucide-react'
import Link from 'next/link'

const indexIcons: Record<string, typeof PocketKnifeIcon> = {
    Translator: LanguagesIcon,
    Whiteboard: LineSquiggleIcon,
    Pyodide: TerminalIcon,
}

export function UtilitiesIndex() {
    return (
        <nav aria-label="Utilities" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {utilitiesIndexItems.map((item) => {
                const Icon = indexIcons[item.label] ?? PocketKnifeIcon

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'group flex min-h-22 items-center gap-5 rounded-2xl border border-border bg-card px-6 py-5 text-left shadow-sm transition-[box-shadow,border-color,background-color] duration-200 ease-out',
                            'hover:border-primary/25 hover:bg-accent/40 hover:shadow-lg',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        )}
                    >
                        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border-l-4 border-l-indigo-500 bg-muted/80 text-indigo-600 dark:text-indigo-400">
                            <Icon className="size-7 group-hover:animate-pulse" aria-hidden />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-lg font-semibold tracking-tight text-foreground">{item.label}</span>
                            <span className="text-sm leading-snug text-muted-foreground">{item.description}</span>
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}

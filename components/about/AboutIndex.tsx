import { ExternalLink } from '@/components/ExternalLink'
import { aboutIndexItems } from '@/lib/about'
import { cn } from '@/lib/utils'
import {
    Accessibility as AccessibilityIcon,
    Camera,
    ExternalLink as ExternalLinkIcon,
    FileText,
    Info,
    Megaphone,
    Send,
    Shield,
    ShoppingBag as ShoppingBagIcon,
} from 'lucide-react'
import Link from 'next/link'

const indexIcons: Record<string, typeof Info> = {
    'Telegram channel': Send,
    'Terms of Service': Megaphone,
    'Honor Code': Shield,
    Accessibility: AccessibilityIcon,
    Pictures: Camera,
    Publications: FileText,
    Merchandising: ShoppingBagIcon,
    Credits: Info,
}

export function AboutIndex() {
    return (
        <nav aria-label="About topics" className="grid gap-4 sm:grid-cols-2">
            {aboutIndexItems.map((item) => {
                const Icon = indexIcons[item.label] ?? Info
                const external = 'external' in item && item.external

                const card = (
                    <>
                        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border-l-4 border-l-violet-500 bg-muted/80 text-violet-600 dark:text-violet-400">
                            <Icon className="size-7 group-hover:animate-pulse" aria-hidden />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="flex items-center gap-1.5 text-lg font-semibold tracking-tight text-foreground">
                                {item.label}
                                {external ? (
                                    <ExternalLinkIcon className="size-4 text-muted-foreground" aria-hidden />
                                ) : null}
                            </span>
                            <span className="text-sm leading-snug text-muted-foreground">{item.description}</span>
                        </span>
                    </>
                )

                const className = cn(
                    'group flex min-h-22 items-center gap-5 rounded-2xl border border-border bg-card px-6 py-5 text-left shadow-sm transition-[box-shadow,border-color,background-color] duration-200 ease-out',
                    'hover:border-primary/25 hover:bg-accent/40 hover:shadow-lg',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )

                if (external) {
                    return (
                        <ExternalLink key={item.href} href={item.href} className={className}>
                            {card}
                        </ExternalLink>
                    )
                }

                return (
                    <Link key={item.href} href={item.href} className={className}>
                        {card}
                    </Link>
                )
            })}
        </nav>
    )
}

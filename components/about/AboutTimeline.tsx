import { referenceLinkClassName } from '@/components/documentation/referenceLinkClassName'
import { ExternalLink } from '@/components/ExternalLink'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ExternalLinkIcon, type LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

type AboutTimelineProps = {
    children: ReactNode
    className?: string
    labelWidth?: string
}

export function AboutTimeline({ children, className, labelWidth = '6.5rem' }: AboutTimelineProps) {
    return (
        <div className={cn('relative', className)} style={{ '--about-label': labelWidth } as CSSProperties}>
            <div
                aria-hidden
                className="absolute top-3 bottom-3 hidden w-px bg-linear-to-b from-violet-500/50 via-border to-transparent md:left-[calc(var(--about-label)+1rem)] md:block"
            />
            <div className="flex flex-col gap-10">{children}</div>
        </div>
    )
}

type AboutTimelineGroupProps = {
    id: string
    label: string
    caption?: string
    prominent?: boolean
    children: ReactNode
}

export function AboutTimelineGroup({ id, label, caption, prominent = false, children }: AboutTimelineGroupProps) {
    return (
        <section aria-labelledby={id} className="relative grid gap-4 md:grid-cols-[var(--about-label)_1fr] md:gap-8">
            <div className="flex items-baseline gap-3 md:block md:pt-3 md:text-right">
                <span
                    aria-hidden
                    className="hidden size-2.5 shrink-0 rounded-full bg-violet-500 ring-4 ring-background md:absolute md:top-5 md:left-[calc(var(--about-label)+1rem)] md:block md:-translate-x-1/2"
                />
                <h2
                    id={id}
                    className={cn(
                        'font-bold tracking-tight text-violet-600 dark:text-violet-400',
                        prominent ? 'text-2xl tabular-nums' : 'text-lg leading-tight',
                    )}
                >
                    {label}
                </h2>
            </div>
            <div className="flex min-w-0 flex-col gap-3">{children}</div>
        </section>
    )
}

type AboutInfoCardProps = {
    icon?: LucideIcon
    media?: ReactNode
    title: ReactNode
    badge?: string | string[]
    href?: string
    description?: ReactNode
    children?: ReactNode
    hover?: boolean
}

function aboutInfoCardTags(badge?: string | string[]): string[] {
    if (!badge) return []
    return Array.isArray(badge) ? badge : [badge]
}

export function AboutInfoCard({ icon: Icon, media, title, badge, href, description, children, hover }: AboutInfoCardProps) {
    const tags = aboutInfoCardTags(badge)
    const heading = href ? (
        <ExternalLink href={href} className="group/title inline-flex items-start gap-1.5">
            <span
                className={cn(
                    referenceLinkClassName,
                    'text-pretty text-base/snug font-semibold tracking-tight',
                    'group-hover/title:underline group-hover/title:underline-offset-4 group-hover/title:decoration-muted-foreground/50 group-hover/title:text-primary',
                )}
            >
                {title}
            </span>
            <ExternalLinkIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        </ExternalLink>
    ) : (
        <span className="text-pretty font-semibold tracking-tight text-foreground">{title}</span>
    )

    const shouldHover = hover ?? Boolean(href)

    return (
        <article
            className={cn(
                'group relative flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition-[box-shadow,border-color,background-color] duration-200 ease-out',
                shouldHover && 'hover:border-primary/25 hover:bg-accent/40 hover:shadow-lg',
            )}
        >
            {media ??
                (Icon ? (
                    <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl border-l-4 border-l-violet-500 bg-muted/80 text-violet-600 dark:text-violet-400"
                        aria-hidden
                    >
                        <Icon className="size-5" />
                    </span>
                ) : null)}
            <div className="min-w-0 flex-1">
                <h3 className="text-base leading-snug">{heading}</h3>
                {tags.length > 0 ? (
                    <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Tags">
                        {tags.map((tag) => (
                            <li key={tag}>
                                <Badge variant="secondary" className="font-normal text-muted-foreground rounded-sm px-1 text-xs">
                                    {tag}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                ) : null}
                {description ? (
                    <div className="mt-1.5 space-y-1 text-sm leading-relaxed text-muted-foreground">{description}</div>
                ) : null}
                {children}
            </div>
        </article>
    )
}

export function AboutBulletList({ items }: { items: ReactNode[] }) {
    return (
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    )
}

export function aboutCountLabel(count: number, singular: string, plural: string): string {
    return count === 1 ? `1 ${singular}` : `${count} ${plural}`
}

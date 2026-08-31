import { ExternalLink } from '@/components/ExternalLink'
import { publications } from '@/lib/about'
import { cn } from '@/lib/utils'
import {
    ArrowUpRightIcon,
    BookMarkedIcon,
    BookOpenIcon,
    FileTextIcon,
    ScrollTextIcon,
    type LucideIcon,
} from 'lucide-react'

type PublicationKind = 'journal' | 'conference' | 'chapter' | 'guide'

type ParsedPublication = {
    authors: string
    title: string
    venue: string
    href: string | null
    year: string | null
    kind: PublicationKind
}

const KIND_META: Record<PublicationKind, { label: string; Icon: LucideIcon }> = {
    journal: { label: 'Journal', Icon: BookOpenIcon },
    conference: { label: 'Conference', Icon: ScrollTextIcon },
    chapter: { label: 'Book chapter', Icon: BookMarkedIcon },
    guide: { label: 'Guide', Icon: FileTextIcon },
}

function decodeHtml(html: string): string {
    return html
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function stripTags(html: string): string {
    return decodeHtml(html.replace(/<[^>]+>/g, ''))
        .replace(/\s+/g, ' ')
        .trim()
}

function splitCitationSentences(text: string): string[] {
    const parts: string[] = []
    let current = ''
    const tokens = text.split(/(\.\s+)/)

    for (let i = 0; i < tokens.length; i++) {
        if (i % 2 === 1) {
            const lastWord =
                current
                    .trim()
                    .split(/[\s,]+/)
                    .pop() ?? ''
            const isInitial = /^[A-ZÀ-ÖØ-Ý]$/.test(lastWord)
            if (isInitial) {
                current += tokens[i]
            } else {
                parts.push(current.trim())
                current = ''
            }
        } else {
            current += tokens[i]
        }
    }

    if (current.trim()) parts.push(current.trim())
    return parts.filter(Boolean)
}

function classifyKind(title: string, venue: string): PublicationKind {
    if (/guide/i.test(title) && !venue) return 'guide'
    if (/editors|lecture notes|volume \d+/i.test(venue)) return 'chapter'
    if (/transactions|journal/i.test(venue)) return 'journal'
    return 'conference'
}

function parsePublication(html: string): ParsedPublication {
    const hrefMatch = html.match(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i)
    const href = hrefMatch?.[1] ?? null
    const linkedTitle = hrefMatch ? stripTags(hrefMatch[2]) : null
    const plain = stripTags(html)
    const years = plain.match(/\b(?:19|20)\d{2}\b/g)
    const year = years?.[years.length - 1] ?? null

    let authors = ''
    let title = linkedTitle ?? ''
    let venue = ''

    if (hrefMatch && hrefMatch.index !== undefined) {
        authors = stripTags(html.slice(0, hrefMatch.index)).replace(/[.\s]+$/, '')
        venue = stripTags(html.slice(hrefMatch.index + hrefMatch[0].length)).replace(/^[.\s]+/, '')
    } else {
        const parts = splitCitationSentences(plain)
        authors = parts[0] ?? ''
        title = parts[1] ?? plain
        venue = parts.slice(2).join('. ')
    }

    venue = venue.replace(/[.\s]+$/, '')

    return {
        authors,
        title,
        venue,
        href,
        year,
        kind: classifyKind(title, venue),
    }
}

function groupPublications(items: ParsedPublication[]) {
    const groups: { label: string; items: ParsedPublication[] }[] = []

    for (const item of items) {
        const label = item.year ?? KIND_META[item.kind].label
        const last = groups[groups.length - 1]
        if (last?.label === label) {
            last.items.push(item)
        } else {
            groups.push({ label, items: [item] })
        }
    }

    return groups
}

const parsedPublications = publications.map((publication) => parsePublication(publication.html))
const publicationGroups = groupPublications(parsedPublications)

function PublicationCard({ publication }: { publication: ParsedPublication }) {
    const { label, Icon } = KIND_META[publication.kind]
    const title = publication.href ? (
        <ExternalLink
            href={publication.href}
            className="inline-flex items-start gap-1.5 text-pretty font-semibold tracking-tight text-foreground transition-colors hover:text-violet-600 dark:hover:text-violet-400"
        >
            <span>{publication.title}</span>
            <ArrowUpRightIcon
                className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400"
                aria-hidden
            />
        </ExternalLink>
    ) : (
        <span className="text-pretty font-semibold tracking-tight text-foreground">{publication.title}</span>
    )

    return (
        <article
            className={cn(
                'group relative flex gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition-[box-shadow,border-color,background-color] duration-200 ease-out',
                publication.href && 'hover:border-primary/25 hover:bg-accent/40 hover:shadow-lg',
            )}
        >
            <span
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border-l-4 border-l-violet-500 bg-muted/80 text-violet-600 dark:text-violet-400"
                aria-hidden
            >
                <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <h3 className="text-base leading-snug">{title}</h3>
                    <span className="mt-0.5 shrink-0 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-violet-700 uppercase dark:text-violet-300">
                        {label}
                    </span>
                </div>
                {publication.authors ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{publication.authors}</p>
                ) : null}
                {publication.venue ? (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground/90 italic">{publication.venue}</p>
                ) : null}
            </div>
        </article>
    )
}

export function AboutPublications() {
    return (
        <div className="relative">
            <div
                aria-hidden
                className="absolute top-3 bottom-3 hidden w-px bg-linear-to-b from-violet-500/50 via-border to-transparent md:left-[7.5rem] md:block"
            />
            <div className="flex flex-col gap-10">
                {publicationGroups.map((group) => (
                    <section
                        key={group.label}
                        aria-labelledby={`publications-${group.label}`}
                        className="relative grid gap-4 md:grid-cols-[6.5rem_1fr] md:gap-8"
                    >
                        <div className="flex items-baseline gap-3 md:block md:pt-3 md:text-right">
                            <span
                                aria-hidden
                                className="hidden size-2.5 shrink-0 rounded-full bg-violet-500 ring-4 ring-background md:absolute md:top-5 md:left-[7.5rem] md:block md:-translate-x-1/2"
                            />
                            <h2
                                id={`publications-${group.label}`}
                                className="text-2xl font-bold tabular-nums tracking-tight text-violet-600 dark:text-violet-400"
                            >
                                {group.label}
                            </h2>
                            <p className="text-xs text-muted-foreground md:mt-1">
                                {group.items.length === 1 ? '1 work' : `${group.items.length} works`}
                            </p>
                        </div>
                        <ul className="flex flex-col gap-3">
                            {group.items.map((publication) => (
                                <li key={publication.title}>
                                    <PublicationCard publication={publication} />
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    )
}

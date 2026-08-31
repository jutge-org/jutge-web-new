import { AboutInfoCard, AboutTimeline, AboutTimelineGroup, aboutCountLabel } from '@/components/about/AboutTimeline'
import { publications } from '@/lib/about'
import { BookMarkedIcon, BookOpenIcon, FileTextIcon, ScrollTextIcon, type LucideIcon } from 'lucide-react'

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

const publicationGroups = groupPublications(publications.map((publication) => parsePublication(publication.html)))

export function AboutPublications() {
    return (
        <AboutTimeline>
            {publicationGroups.map((group) => (
                <AboutTimelineGroup
                    key={group.label}
                    id={`publications-${group.label}`}
                    label={group.label}
                    caption={aboutCountLabel(group.items.length, 'work', 'works')}
                    prominent
                >
                    {group.items.map((publication) => {
                        const { label, Icon } = KIND_META[publication.kind]
                        return (
                            <AboutInfoCard
                                key={publication.title}
                                icon={Icon}
                                title={publication.title}
                                href={publication.href ?? undefined}
                                badge={label}
                                description={
                                    <>
                                        {publication.authors ? <p>{publication.authors}</p> : null}
                                        {publication.venue ? (
                                            <p className="text-muted-foreground/90 italic">{publication.venue}</p>
                                        ) : null}
                                    </>
                                }
                            />
                        )
                    })}
                </AboutTimelineGroup>
            ))}
        </AboutTimeline>
    )
}

'use client'

import { DevIcon } from '@/components/administrator/DevIcon'
import { ExternalLink } from '@/components/ExternalLink'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { BookOpenIcon, ExternalLinkIcon, FileTextIcon } from 'lucide-react'

type ReferenceLink = {
    label: string
    description: string
    href: string
    format: 'HTML' | 'PDF'
}

type ReferenceGroup = {
    id: string
    title: string
    description: string
    links: ReferenceLink[]
}

const referenceGroups: ReferenceGroup[] = [
    {
        id: 'cpp',
        title: 'C++',
        description: 'Standard library and language references',
        links: [
            {
                label: 'cppreference',
                description: 'English snapshot from March 2018',
                href: 'https://jutge.org/doc/cppreference/en/',
                format: 'HTML',
            },
            {
                label: 'cplusplus.com',
                description: 'Reference snapshot from February 2018',
                href: 'https://jutge.org/doc/cplusplus.com/reference',
                format: 'HTML',
            },
        ],
    },
    {
        id: 'python',
        title: 'Python',
        description: 'Language reference and a compact cheat sheet',
        links: [
            {
                label: 'Python reference',
                description: 'Version 3.11.2',
                href: 'https://jutge.org/doc/python-reference',
                format: 'HTML',
            },
            {
                label: 'Python cheat sheet',
                description: 'Compact syntax summary',
                href: 'https://jutge.org/doc/python-cheat-sheet.pdf',
                format: 'PDF',
            },
        ],
    },
    {
        id: 'java',
        title: 'Java',
        description: 'Platform API specification',
        links: [
            {
                label: 'Java SE and JDK API',
                description: 'Version 9 API specification',
                href: 'https://jutge.org/doc/java/docs',
                format: 'HTML',
            },
        ],
    },
    {
        id: 'c',
        title: 'C',
        description: 'Language reference and a one-page card',
        links: [
            {
                label: 'C reference',
                description: 'From cppreference, March 2018',
                href: 'https://jutge.org/doc/cppreference/en/c.html',
                format: 'HTML',
            },
            {
                label: 'C reference card',
                description: 'One-page summary',
                href: 'https://jutge.org/doc/c-refcard.pdf',
                format: 'PDF',
            },
        ],
    },
    {
        id: 'haskell',
        title: 'Haskell',
        description: 'Cheat sheets for the core language',
        links: [
            {
                label: 'Basic Haskell cheat sheet',
                description: 'Core syntax at a glance',
                href: 'https://jutge.org/doc/basic-haskell-cheat-sheet.pdf',
                format: 'PDF',
            },
            {
                label: 'Haskell cheat sheet',
                description: 'Broader language summary',
                href: 'https://jutge.org/doc/haskell-cheat-sheet.pdf',
                format: 'PDF',
            },
        ],
    },
]

export function ReferencesView() {
    return (
        <div className="flex flex-col gap-4">
            <Accordion type="multiple" className="gap-3">
                {referenceGroups.map((group) => (
                    <AccordionItem
                        key={group.id}
                        value={group.id}
                        className="overflow-hidden rounded-2xl border border-border bg-card px-2 shadow-sm"
                    >
                        <AccordionTrigger className="items-center gap-3 px-3 py-2 hover:no-underline">
                            <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                                <span aria-hidden className="" />
                                <DevIcon proglang={group.title} size={36} />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5 pr-1 text-left">
                                <span className="text-base font-semibold tracking-tight text-foreground">
                                    {group.title}
                                </span>
                            </span>
                        </AccordionTrigger>
                        <AccordionContent className="pr-3 pb-3 pl-14 [&_a]:no-underline">
                            <ul className="flex flex-col gap-2">
                                {group.links.map((link) => {
                                    const FormatIcon = link.format === 'PDF' ? FileTextIcon : BookOpenIcon
                                    return (
                                        <li key={link.href}>
                                            <ExternalLink
                                                href={link.href}
                                                className="group/link flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:border-primary/25 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                            >
                                                <FormatIcon className="size-4 shrink-0 text-foreground mr-2" aria-hidden />
                                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    <span className="font-medium text-foreground">{link.label}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        <span className="font-medium text-foreground/70">
                                                            {link.format}
                                                        </span>
                                                        <span aria-hidden> · </span>
                                                        {link.description}
                                                    </span>
                                                </span>
                                                <ExternalLinkIcon
                                                    className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/link:text-foreground"
                                                    aria-hidden
                                                />
                                            </ExternalLink>
                                        </li>
                                    )
                                })}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

import { ExternalLink } from '@/components/ExternalLink'
import { documentationIndexItems } from '@/lib/documentation'
import { cn } from '@/lib/utils'
import {
    BookMarkedIcon,
    BookTextIcon,
    BoxesIcon,
    Code2Icon,
    FileCode2Icon,
    GavelIcon,
    FolderGit2Icon,
    HelpCircleIcon,
    StampIcon,
    StethoscopeIcon,
    WrenchIcon,
    ServerCogIcon,
} from 'lucide-react'
import Link from 'next/link'

const indexIcons: Record<string, typeof HelpCircleIcon> = {
    FAQ: HelpCircleIcon,
    Compilers: Code2Icon,
    Verdicts: GavelIcon,
    'Code metrics': StethoscopeIcon,
    Toolkit: WrenchIcon,
    API: ServerCogIcon,
    'Python libs': BoxesIcon,
    Certificates: StampIcon,
    Markdown: FileCode2Icon,
    References: BookMarkedIcon,
    'GitHub repos': FolderGit2Icon,
}

export function DocumentationIndex() {
    return (
        <nav aria-label="Documentation topics" className="grid gap-4 sm:grid-cols-2">
            {documentationIndexItems.map((item) => {
                const Icon = indexIcons[item.label] ?? BookTextIcon
                const external = 'external' in item && item.external

                const card = (
                    <>
                        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border-l-4 border-l-amber-600 bg-muted/80 text-amber-600 dark:text-amber-400">
                            <Icon className="size-7 group-hover:animate-pulse" aria-hidden />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-lg font-semibold tracking-tight text-foreground">{item.label}</span>
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
                        <ExternalLink key={item.href} href={item.href} icon={false} className={className}>
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

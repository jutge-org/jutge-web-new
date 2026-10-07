'use client'

import { ExternalLink } from '@/components/ExternalLink'
import { LayoutWidthContainer } from '@/components/layout/LayoutWidthContainer'
import { cn } from '@/lib/utils'
import { useSubNav } from '@/store/SubNav'
import Link from 'next/link'

/**
 * GitHub-style secondary nav under the main sticky header.
 * Only renders when a page has registered items via `<SubNav />`.
 */
export function SubNavInLayout() {
    const items = useSubNav((s) => s.items)
    const activeKey = useSubNav((s) => s.activeKey)
    const ariaLabel = useSubNav((s) => s.ariaLabel)

    if (items.length === 0) return null

    return (
        <nav aria-label={ariaLabel || 'Section navigation'}>
            <LayoutWidthContainer className="px-4 sm:px-6">
                <ul className="-mb-px flex min-w-0 gap-0 overflow-x-auto">
                    {items.map((item) => {
                        const isActive = item.key === activeKey
                        const className = cn(
                            'inline-flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors -mt-1',
                            isActive
                                ? 'border-foreground text-foreground'
                                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                        )

                        return (
                            <li key={item.key} className="shrink-0">
                                {item.external ? (
                                    <ExternalLink href={item.href} icon={false} className={className}>
                                        {item.label}
                                        {item.badge}
                                    </ExternalLink>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={className}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        {item.label}
                                        {item.badge}
                                    </Link>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </LayoutWidthContainer>
        </nav>
    )
}

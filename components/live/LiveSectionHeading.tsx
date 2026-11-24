import Link from 'next/link'
import type { ReactNode } from 'react'

import { LiveNavMenuItemIcon } from '@/components/live/LiveNavMenuItemIcon'
import { cn } from '@/lib/utils'

const linkClassName =
    'inline-flex items-center gap-2 rounded-md text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function LiveSectionHeading({
    id,
    href,
    children,
    className,
}: {
    id: string
    href?: string
    children: ReactNode
    className?: string
}) {
    if (!href) {
        return (
            <h2 id={id} className={cn('text-lg font-medium', className)}>
                {children}
            </h2>
        )
    }

    return (
        <h2 id={id} className={cn('text-lg font-medium', className)}>
            <Link href={href} className={linkClassName}>
                <LiveNavMenuItemIcon href={href} className="size-5 shrink-0" />
                <span>{children}</span>
            </Link>
        </h2>
    )
}
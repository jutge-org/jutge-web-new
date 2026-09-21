'use client'

import { ArrowRightIcon, CrownIcon } from 'lucide-react'
import Link from 'next/link'

import HistogramDayWidget from '@/components/administrator/dashboard/HistogramDayWidget'
import HistogramHourWidget from '@/components/administrator/dashboard/HistogramHourWidget'
import ZombiesWidget from '@/components/administrator/dashboard/ZombiesWidget'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/** Administrator summary on the home dashboard: the same widgets as the admin dashboard. */
export function HomeAdmin() {
    return (
        <Card className="rounded-2xl border border-border border-t-2 border-t-amber-500 shadow-sm">
            <CardHeader className="p-0">
                <Link
                    href="/administrator/dashboard"
                    className="group flex min-h-11 items-center justify-between gap-2 px-4 py-2 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                    <h2 className="flex min-w-0 items-center gap-2 font-heading text-base font-semibold leading-snug text-foreground">
                        <CrownIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                        <span className="truncate">Admin</span>
                    </h2>
                    <ArrowRightIcon
                        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden
                    />
                </Link>
            </CardHeader>
            <CardContent className="border-t border-border/60 px-2 py-2 group-has-data-[slot=card-header]/card:px-2 group-has-data-[slot=card-header]/card:py-2">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 [&_[data-slot=card]]:shadow-none [&_[data-slot=card]]:ring-0 [&_[data-slot=card-header]]:!px-2 [&_[data-slot=card-header]]:!py-1 [&_[data-slot=card-content]]:!px-1 [&_[data-slot=card-content]]:!py-1">
                    <HistogramHourWidget />
                    <HistogramDayWidget />
                    <ZombiesWidget variant="figures" />
                </div>
            </CardContent>
        </Card>
    )
}

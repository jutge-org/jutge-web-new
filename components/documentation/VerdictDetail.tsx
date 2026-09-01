import Image from 'next/image'

import type { Verdict } from '@/lib/jutge_api_client'
import type { ReactNode } from 'react'

type VerdictDetailProps = {
    verdict: Verdict
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:items-start sm:gap-4">
            <dt className="text-sm font-medium leading-normal text-foreground">{label}</dt>
            <dd className="min-w-0 text-sm leading-normal text-muted-foreground">{children}</dd>
        </div>
    )
}

export function VerdictDetail({ verdict }: VerdictDetailProps) {
    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-foreground">
                    <span aria-hidden>{verdict.emoji}</span>
                    <span>
                        {verdict.verdict_id}: {verdict.name}
                    </span>
                </h2>
            </div>
            <div className="px-6 py-2">
                <dl>
                    <DetailRow label="Verdict">{verdict.name}</DetailRow>
                    <DetailRow label="Acronym">{verdict.verdict_id}</DetailRow>
                    <DetailRow label="Emoji">{verdict.emoji}</DetailRow>
                    <DetailRow label="Icon">
                        <Image
                            src={`/verdicts/svg/${verdict.verdict_id}.svg`}
                            alt=""
                            width={64}
                            height={64}
                            className="block"
                        />
                    </DetailRow>
                    <DetailRow label="Meaning">{verdict.description || '—'}</DetailRow>
                </dl>
            </div>
        </div>
    )
}

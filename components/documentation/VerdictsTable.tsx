'use client'

import { AgTableAutoHeight } from '@/components/administrator/AgTable'
import type { Verdict } from '@/lib/jutge_api_client'
import Link from 'next/link'

type VerdictsTableProps = {
    verdicts: Verdict[]
}

const colDefs = [
    {
        field: 'verdict_id',
        headerName: 'Verdict',
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: (params: { data: Verdict }) => (
            <Link
                href={`/documentation/verdicts/${params.data.verdict_id}`}
                className="font-medium underline-offset-4 hover:underline"
            >
                {params.data.verdict_id}
            </Link>
        ),
        valueGetter: (params: { data: Verdict }) => params.data.verdict_id,
    },
    {
        field: 'name',
        flex: 1,
        sortable: true,
        filter: true,
        cellRenderer: (params: { data: Verdict }) => (
            <span className="inline-flex items-center gap-4">
                <span aria-hidden>{params.data.emoji}</span>
                {params.data.name}
            </span>
        ),
        valueGetter: (params: { data: Verdict }) => params.data.name,
    },
]

export function VerdictsTable({ verdicts }: VerdictsTableProps) {
    return <AgTableAutoHeight rowData={verdicts} columnDefs={colDefs} />
}

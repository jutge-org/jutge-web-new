'use client'

import { AgTableFull } from '@/components/administrator/AgTable'
import { DevIcon } from '@/components/administrator/DevIcon'
import { compilerIdToSlug, getCompilerStatus } from '@/lib/documentation'
import type { Compiler } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type CompilersTableProps = {
    compilers: Compiler[]
}

const colDefs = [
    {
        field: 'compiler_id',
        headerName: 'Compiler',
        width: 140,
        sortable: true,
        filter: true,
        cellRenderer: (params: { data: Compiler }) => {
            const status = getCompilerStatus(params.data)
            return (
                <Link
                    href={`/documentation/compilers/${compilerIdToSlug(params.data.compiler_id)}`}
                    title={params.data.version ?? undefined}
                    className={cn('font-medium underline-offset-4 hover:underline', status.defunct && 'line-through')}
                >
                    {params.data.compiler_id}
                </Link>
            )
        },
        valueGetter: (params: { data: Compiler }) => params.data.compiler_id,
    },
    {
        field: 'name',
        flex: 1,
        sortable: true,
        filter: true,
        cellClassRules: {
            'line-through': (params: { data: Compiler }) => getCompilerStatus(params.data).defunct,
        },
    },
    {
        field: 'language',
        width: 160,
        sortable: true,
        filter: true,
        cellRenderer: (params: { data: Compiler }) => (
            <span className="inline-flex items-center gap-2">
                <span aria-hidden>
                    <DevIcon proglang={params.data.language} size={16} />
                </span>
                {params.data.language}
            </span>
        ),
    },
    {
        field: 'status',
        headerName: 'Status',
        width: 140,
        sortable: true,
        filter: true,
        valueGetter: (params: { data: Compiler }) => getCompilerStatus(params.data).label,
        cellRenderer: (params: { data: Compiler }) => {
            const status = getCompilerStatus(params.data)
            return (
                <span className="inline-flex items-center gap-3">
                    <span aria-hidden>{status.icon}</span>
                    {status.label}
                </span>
            )
        },
    },
]

export function CompilersTable({ compilers }: CompilersTableProps) {
    return <AgTableFull rowData={compilers} columnDefs={colDefs} />
}

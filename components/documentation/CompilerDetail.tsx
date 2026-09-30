import { Prose } from '@/components/documentation/Prose'
import { getCompilerStatus } from '@/lib/documentation'
import type { Compiler } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type CompilerDetailProps = {
    compiler: Compiler
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:items-start sm:gap-4">
            <dt className="text-sm font-medium leading-normal text-foreground">{label}</dt>
            <dd className="min-w-0 text-sm leading-normal text-muted-foreground">{children}</dd>
        </div>
    )
}

export function CompilerDetailBody({ compiler }: CompilerDetailProps) {
    const status = getCompilerStatus(compiler)

    return (
        <dl>
            <DetailRow label="Compiler">{compiler.compiler_id}</DetailRow>
            <DetailRow label="Name">{compiler.name}</DetailRow>
            <DetailRow label="Language">{compiler.language}</DetailRow>
            <DetailRow label="Program and version">{compiler.version || '—'}</DetailRow>
            <DetailRow label="Description">{compiler.description || '—'}</DetailRow>
            {compiler.warning ? (
                <DetailRow label="Warning">
                    <span className="text-destructive">{compiler.warning}</span>
                </DetailRow>
            ) : null}
            <DetailRow label="Type">{compiler.type || '—'}</DetailRow>
            <DetailRow label="Flags1">
                <code>{compiler.flags1 || '—'}</code>
            </DetailRow>
            <DetailRow label="Flags2">
                <code>{compiler.flags2 || '—'}</code>
            </DetailRow>
            <DetailRow label="Extension">
                <code>.{compiler.extension}</code>
            </DetailRow>
            {compiler.notes ? <DetailRow label="Notes">{compiler.notes}</DetailRow> : null}
            <DetailRow label="Status">
                <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden>{status.icon}</span>
                    {status.label}
                </span>
            </DetailRow>
        </dl>
    )
}

export function CompilerDetail({ compiler }: CompilerDetailProps) {
    const status = getCompilerStatus(compiler)

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
                <h2 className={cn('text-lg font-semibold text-foreground', status.defunct && 'line-through')}>
                    {compiler.name}
                </h2>
            </div>
            <Prose className="px-6 py-2">
                <CompilerDetailBody compiler={compiler} />
            </Prose>
        </div>
    )
}

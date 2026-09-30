'use client'

import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'

import { DevIcon } from '@/components/administrator/DevIcon'
import { PageSpinner } from '@/components/ClientGates'
import { CompilerDetailBody } from '@/components/documentation/CompilerDetail'
import { VerdictDetailBody, VerdictDetailTitle } from '@/components/documentation/VerdictDetail'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { fetchCompilers, fetchVerdicts } from '@/lib/data/tables'
import { compilerIdToSlug, findCompilerBySlug, getCompilerStatus } from '@/lib/documentation'
import type { Compiler, Verdict } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'

export const referenceLinkClassName =
    'text-sm text-foreground hover:underline hover:underline-offset-4 hover:decoration-muted-foreground/50 hover:text-primary'

const dialogClassName = 'flex max-h-[min(85vh,48rem)] flex-col overflow-hidden sm:max-w-3xl [&_code]:break-all'

function ReferenceDialog({
    open,
    onOpenChange,
    title,
    titleClassName,
    description,
    children,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: ReactNode
    titleClassName?: string
    description: string
    children: ReactNode
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={dialogClassName}>
                <DialogHeader className="pr-8">
                    <DialogTitle
                        className={cn(
                            'inline-flex items-center gap-2 text-lg leading-normal font-semibold text-foreground',
                            titleClassName,
                        )}
                    >
                        {title}
                    </DialogTitle>
                    <DialogDescription className="sr-only">{description}</DialogDescription>
                </DialogHeader>
                <div className="min-h-0 overflow-y-auto">{children}</div>
                <DialogFooter showCloseButton />
            </DialogContent>
        </Dialog>
    )
}

function openDialogOnPlainClick(event: MouseEvent<HTMLAnchorElement>, open: () => void) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return
    }
    event.preventDefault()
    open()
}

type VerdictLinkProps = {
    verdictId: string
    className?: string
    children?: ReactNode
}

export function VerdictLink({ verdictId, className, children }: VerdictLinkProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <a
                href={`/documentation/verdicts/${verdictId}`}
                className={cn(referenceLinkClassName, className)}
                onClick={(event) => openDialogOnPlainClick(event, () => setOpen(true))}
            >
                {children ?? verdictId}
            </a>
            {open ? <VerdictDetailDialog verdictId={verdictId} open={open} onOpenChange={setOpen} /> : null}
        </>
    )
}

type CompilerLinkProps = {
    compilerId: string
    className?: string
    children?: ReactNode
}

export function CompilerLink({ compilerId, className, children }: CompilerLinkProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <a
                href={`/documentation/compilers/${compilerIdToSlug(compilerId)}`}
                className={cn(referenceLinkClassName, className)}
                onClick={(event) => openDialogOnPlainClick(event, () => setOpen(true))}
            >
                {children ?? compilerId}
            </a>
            {open ? <CompilerDetailDialog compilerId={compilerId} open={open} onOpenChange={setOpen} /> : null}
        </>
    )
}

function VerdictDetailDialog({
    verdictId,
    open,
    onOpenChange,
}: {
    verdictId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [verdict, setVerdict] = useState<Verdict | null | undefined>(undefined)

    useEffect(() => {
        let cancelled = false
        setVerdict(undefined)
        void fetchVerdicts().then((verdicts) => {
            if (!cancelled) {
                setVerdict(verdicts.find((item) => item.verdict_id === verdictId) ?? null)
            }
        })
        return () => {
            cancelled = true
        }
    }, [verdictId])

    return (
        <ReferenceDialog
            open={open}
            onOpenChange={onOpenChange}
            title={verdict ? <VerdictDetailTitle verdict={verdict} /> : `Verdict ${verdictId}`}
            description={`Documentation for verdict ${verdictId}`}
        >
            {verdict === undefined ? (
                <PageSpinner />
            ) : verdict ? (
                <VerdictDetailBody verdict={verdict} />
            ) : (
                <p className="text-sm text-muted-foreground">Could not find verdict {verdictId}.</p>
            )}
        </ReferenceDialog>
    )
}

function CompilerDetailDialog({
    compilerId,
    open,
    onOpenChange,
}: {
    compilerId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [compiler, setCompiler] = useState<Compiler | null | undefined>(undefined)

    useEffect(() => {
        let cancelled = false
        setCompiler(undefined)
        void fetchCompilers().then((compilers) => {
            if (!cancelled) {
                setCompiler(findCompilerBySlug(compilers, compilerIdToSlug(compilerId)) ?? null)
            }
        })
        return () => {
            cancelled = true
        }
    }, [compilerId])

    const status = compiler ? getCompilerStatus(compiler) : null

    return (
        <ReferenceDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                compiler ? (
                    <>
                        <DevIcon proglang={compiler.language} size={18} />
                        <span className={status?.defunct ? 'line-through' : undefined}>{compiler.name}</span>
                    </>
                ) : (
                    `Compiler ${compilerId}`
                )
            }
            description={`Documentation for compiler ${compilerId}`}
        >
            {compiler === undefined ? (
                <PageSpinner />
            ) : compiler ? (
                <CompilerDetailBody compiler={compiler} />
            ) : (
                <p className="text-sm text-muted-foreground">Could not find compiler {compilerId}.</p>
            )}
        </ReferenceDialog>
    )
}

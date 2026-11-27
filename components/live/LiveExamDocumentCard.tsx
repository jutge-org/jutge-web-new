'use client'

import { Loader2Icon } from 'lucide-react'
import { useCallback, useState } from 'react'

import { downloadExamDocument, liveErrorMessage } from '@/lib/data/liveExam'
import { documentTypeLabel, getDocumentFileIcon } from '@/lib/instructor/documents'
import type { RunningExamDocument } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'

type LiveExamDocumentCardProps = {
    document: RunningExamDocument
    onError: (message: string | null) => void
}

export function LiveExamDocumentCard({ document, onError }: LiveExamDocumentCardProps) {
    const [downloading, setDownloading] = useState(false)
    const FileIcon = getDocumentFileIcon(document.type)
    const typeLabel = documentTypeLabel(document)
    const actionLabel =
        typeLabel === 'PDF' ? `Open ${document.title} (${typeLabel})` : `Download ${document.title} (${typeLabel})`

    const runDownload = useCallback(async () => {
        if (downloading) return
        setDownloading(true)
        onError(null)
        try {
            await downloadExamDocument(document)
        } catch (error: unknown) {
            onError(liveErrorMessage(error, 'Could not download the document.'))
        } finally {
            setDownloading(false)
        }
    }, [document, downloading, onError])

    return (
        <article className="group relative min-w-0">
            <span
                aria-hidden
                className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-brand/40 via-brand-secondary/30 to-brand/25 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
            />
            <button
                type="button"
                disabled={downloading}
                aria-label={downloading ? `Loading ${document.title}` : actionLabel}
                aria-busy={downloading}
                onClick={() => void runDownload()}
                className={cn(
                    'relative flex w-full min-w-0 items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card px-3 py-2.5 text-left shadow-sm',
                    'transition-[border-color,box-shadow,transform] duration-300 ease-out',
                    'group-hover:-translate-y-px group-hover:border-[color-mix(in_oklab,var(--color-foreground)_12%,var(--color-brand))]',
                    'group-hover:shadow-[0_8px_28px_-8px_color-mix(in_oklab,var(--color-brand)_35%,transparent)]',
                    'group-hover:ring-1 group-hover:ring-[color-mix(in_oklab,var(--color-foreground)_15%,var(--color-brand))]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    'disabled:pointer-events-none disabled:opacity-70',
                )}
            >
                {downloading ? (
                    <Loader2Icon
                        className="size-5 shrink-0 animate-spin text-muted-foreground"
                        aria-hidden
                    />
                ) : (
                    <FileIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug tracking-tight text-foreground">
                        {document.title}
                    </span>
                </div>
            </button>
        </article>
    )
}
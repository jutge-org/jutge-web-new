'use client'

import { DownloadIcon } from 'lucide-react'
import { useCallback, useState } from 'react'

import SmoothButton from '@/components/smoothui/smooth-button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
    const description = document.description?.trim()

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
                className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-brand/40 via-brand-secondary/30 to-brand/25 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
            />
            <div
                className={cn(
                    'relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
                    'transition-[border-color,box-shadow,transform] duration-300 ease-out',
                    'group-hover:-translate-y-px group-hover:border-[color-mix(in_oklab,var(--color-foreground)_12%,var(--color-brand))]',
                    'group-hover:shadow-[0_8px_28px_-8px_color-mix(in_oklab,var(--color-brand)_35%,transparent)]',
                    'group-hover:ring-1 group-hover:ring-[color-mix(in_oklab,var(--color-foreground)_15%,var(--color-brand))]',
                )}
            >
                <header className="flex items-center gap-3 border-b border-border bg-muted/60 px-4 py-3">
                    <FileIcon className="size-8 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold leading-snug tracking-tight text-foreground">
                            {document.title}
                        </h2>
                    </div>
                </header>

                <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3">
                    {description ? (
                        <p className="text-sm leading-snug text-muted-foreground">{description}</p>
                    ) : null}
                    <div className={cn('flex justify-end', description ? 'mt-auto pt-1' : 'mt-auto')}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <SmoothButton
                                    type="button"
                                    variant="candy"
                                    color="blue"
                                    size="icon-lg"
                                    className="size-14 rounded-xl [&_svg]:size-7"
                                    loading={downloading}
                                    aria-label={`Download ${document.title} (${typeLabel})`}
                                    onClick={() => void runDownload()}
                                >
                                    <DownloadIcon aria-hidden />
                                </SmoothButton>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                {downloading ? 'Downloading…' : `Download ${typeLabel}`}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </article>
    )
}
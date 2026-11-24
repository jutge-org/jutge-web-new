'use client'

import { DownloadIcon, Loader2Icon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { AgTableAutoHeight } from '@/components/administrator/AgTable'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { downloadExamDocument, liveErrorMessage } from '@/lib/data/liveExam'
import { documentTypeLabel, getDocumentFileIcon } from '@/lib/instructor/documents'
import type { RunningExamDocument } from '@/lib/jutge_api_client'

function DocumentDownloadCell({
    document,
    onError,
}: {
    document: RunningExamDocument
    onError: (message: string | null) => void
}) {
    const [downloading, setDownloading] = useState(false)
    const typeLabel = documentTypeLabel(document)
    const actionLabel = typeLabel === 'PDF' ? `Open ${document.title}` : `Download ${document.title}`

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
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={downloading}
                    aria-label={downloading ? `Loading ${document.title}` : actionLabel}
                    onClick={() => void runDownload()}
                >
                    {downloading ? (
                        <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    ) : (
                        <DownloadIcon className="size-4" aria-hidden />
                    )}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{actionLabel}</TooltipContent>
        </Tooltip>
    )
}

const defaultColDef = {
    sortable: true,
    filter: false,
    suppressHeaderMenuButton: true,
    resizable: false,
}

type LiveExamDocumentsTableProps = {
    documents: RunningExamDocument[]
    onError: (message: string | null) => void
}

export function LiveExamDocumentsTable({ documents, onError }: LiveExamDocumentsTableProps) {
    const colDefs = useMemo(
        () => [
            {
                field: 'title',
                flex: 1,
                minWidth: 160,
                cellRenderer: (params: { data: RunningExamDocument }) => (
                    <span className="font-medium">{params.data.title}</span>
                ),
            },
            {
                field: 'type',
                headerName: 'Type',
                width: 72,
                sortable: false,
                cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
                valueGetter: (params: { data: RunningExamDocument }) => documentTypeLabel(params.data),
                cellRenderer: (params: { data: RunningExamDocument }) => {
                    const TypeIcon = getDocumentFileIcon(params.data.type)
                    const label = documentTypeLabel(params.data)
                    return (
                        <span className="inline-flex text-muted-foreground" role="img" aria-label={label}>
                            <TypeIcon className="size-4 shrink-0" aria-hidden />
                        </span>
                    )
                },
            },
            {
                field: 'description',
                flex: 2,
                minWidth: 120,
                sortable: false,
                valueGetter: (params: { data: RunningExamDocument }) => params.data.description?.trim() ?? '',
                cellRenderer: (params: { data: RunningExamDocument }) => {
                    const text = params.data.description?.trim()
                    return text ? <span className="text-muted-foreground">{text}</span> : '—'
                },
            },
            {
                field: 'document_nm',
                headerName: '',
                width: 52,
                sortable: false,
                cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
                cellRenderer: (params: { data: RunningExamDocument }) => (
                    <DocumentDownloadCell document={params.data} onError={onError} />
                ),
            },
        ],
        [onError],
    )

    return (
        <TooltipProvider>
            <div className="min-w-0 overflow-x-auto px-1 pb-px [&_.ag-cell]:overflow-visible">
                <AgTableAutoHeight rowData={documents} columnDefs={colDefs} defaultColDef={defaultColDef} />
            </div>
        </TooltipProvider>
    )
}
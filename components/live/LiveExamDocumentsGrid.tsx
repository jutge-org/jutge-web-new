'use client'

import { LiveExamDocumentCard } from '@/components/live/LiveExamDocumentCard'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { RunningExamDocument } from '@/lib/jutge_api_client'

type LiveExamDocumentsGridProps = {
    documents: RunningExamDocument[]
    onError: (message: string | null) => void
}

export function LiveExamDocumentsGrid({ documents, onError }: LiveExamDocumentsGridProps) {
    return (
        <TooltipProvider>
            <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2" aria-label="Exam documents">
                {documents.map((document) => (
                    <li key={document.document_nm} className="min-w-0">
                        <LiveExamDocumentCard document={document} onError={onError} />
                    </li>
                ))}
            </ul>
        </TooltipProvider>
    )
}
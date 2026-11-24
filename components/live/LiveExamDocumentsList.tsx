'use client'

import { LiveExamDocumentsGrid } from '@/components/live/LiveExamDocumentsGrid'
import { LiveExamDocumentsTable } from '@/components/live/LiveExamDocumentsTable'
import type { LiveExamListLayout } from '@/lib/liveExamListLayout'
import type { RunningExamDocument } from '@/lib/jutge_api_client'

type LiveExamDocumentsListProps = {
    documents: RunningExamDocument[]
    layout: LiveExamListLayout
    onError: (message: string | null) => void
}

export function LiveExamDocumentsList({ documents, layout, onError }: LiveExamDocumentsListProps) {
    if (layout === 'cards') {
        return <LiveExamDocumentsGrid documents={documents} onError={onError} />
    }
    return <LiveExamDocumentsTable documents={documents} onError={onError} />
}
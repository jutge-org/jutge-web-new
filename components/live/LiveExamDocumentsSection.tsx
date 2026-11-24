'use client'

import { Suspense } from 'react'

import { LiveExamDocumentsList } from '@/components/live/LiveExamDocumentsList'
import { LiveNotice } from '@/components/live/LiveChrome'
import { LiveSectionHeading } from '@/components/live/LiveSectionHeading'
import { LiveListLayoutToggle } from '@/components/live/LiveListLayoutToggle'
import { useLiveExamListLayout } from '@/hooks/useLiveExamListLayout'
import type { RunningExamDocument } from '@/lib/jutge_api_client'

type LiveExamDocumentsSectionProps = {
    documents: RunningExamDocument[]
    docError: string | null
    onError: (message: string | null) => void
}

function LiveExamDocumentsSectionInner({ documents, docError, onError }: LiveExamDocumentsSectionProps) {
    const { layout, toggleLayout } = useLiveExamListLayout('documents')

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
                <LiveSectionHeading id="live-documents-heading" href="/documents">
                    Documents
                </LiveSectionHeading>
                <LiveListLayoutToggle layout={layout} onToggle={toggleLayout} />
            </div>
            {docError ? <LiveNotice>{docError}</LiveNotice> : null}
            <LiveExamDocumentsList documents={documents} layout={layout} onError={onError} />
        </div>
    )
}

export function LiveExamDocumentsSection({ documents, docError, onError }: LiveExamDocumentsSectionProps) {
    return (
        <Suspense
            fallback={
                <>
                    <LiveSectionHeading id="live-documents-heading" href="/documents">
                        Documents
                    </LiveSectionHeading>
                    <LiveExamDocumentsList documents={documents} layout="cards" onError={onError} />
                </>
            }
        >
            <LiveExamDocumentsSectionInner documents={documents} docError={docError} onError={onError} />
        </Suspense>
    )
}
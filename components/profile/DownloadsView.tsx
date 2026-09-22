'use client'

import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'

import SmoothButton from '@/components/smoothui/smooth-button'
import { getCurrentClient } from '@/lib/data/auth'
import { offerDownloadFile } from '@/lib/instructor/utils'
import type { Download } from '@/lib/jutge_api_client'

type ArchiveDownload = {
    id: 'submissions' | 'cards'
    description: string
    emptyMessage: string
    errorFallback: string
    label: string
    load: (client: Awaited<ReturnType<typeof getCurrentClient>>) => Promise<Download>
}

const archives: ArchiveDownload[] = [
    {
        id: 'submissions',
        description:
            'Download a zip archive of all your submissions. Each problem folder includes a summary and the stored source code when it is available.',
        emptyMessage: 'No submissions archive was returned.',
        errorFallback: 'Could not download submissions.',
        label: 'Download submissions',
        load: (client) => client.student.profile.downloadSubmissions(),
    },
    {
        id: 'cards',
        description: 'Download a zip archive of all the collectible cards you have collected.',
        emptyMessage: 'No collectible cards archive was returned.',
        errorFallback: 'Could not download collectible cards.',
        label: 'Download collectible cards',
        load: (client) => client.student.profile.downloadCards(),
    },
]

export function DownloadsView() {
    const [pendingId, setPendingId] = useState<ArchiveDownload['id'] | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [errorId, setErrorId] = useState<ArchiveDownload['id'] | null>(null)

    async function handleDownload(archive: ArchiveDownload) {
        setErrorMessage(null)
        setErrorId(null)
        setPendingId(archive.id)
        try {
            const client = await getCurrentClient()
            const download = await archive.load(client)
            if (!download?.data) {
                setErrorId(archive.id)
                setErrorMessage(archive.emptyMessage)
                return
            }
            offerDownloadFile(download)
        } catch (error) {
            const message = error instanceof Error ? error.message : archive.errorFallback
            setErrorId(archive.id)
            setErrorMessage(message)
        } finally {
            setPendingId(null)
        }
    }

    return (
        <div className="flex flex-1 flex-col">
            <section className="flex justify-center rounded-xl border border-border bg-card shadow-xs">
                <div className="mb-3 w-full max-w-3xl px-6 pt-8 pb-8">
                    <div className="grid gap-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                        <div className="hidden sm:block" />
                        <div className="min-w-0">
                            {archives.map((archive) => {
                                const pending = pendingId === archive.id
                                return (
                                    <div key={archive.id} className="space-y-6 py-6 first:pt-0 last:pb-0">
                                        <p className="text-sm text-muted-foreground">{archive.description}</p>
                                        {errorId === archive.id && errorMessage ? (
                                            <p role="alert" className="text-sm text-destructive">
                                                {errorMessage}
                                            </p>
                                        ) : null}
                                        <SmoothButton
                                            type="button"
                                            color="accent"
                                            variant="candy"
                                            loading={pending}
                                            disabled={pendingId !== null && !pending}
                                            className="w-full gap-2"
                                            prefix={<DownloadIcon className="size-4" aria-hidden />}
                                            onClick={() => void handleDownload(archive)}
                                        >
                                            {pending ? 'Downloading…' : archive.label}
                                        </SmoothButton>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

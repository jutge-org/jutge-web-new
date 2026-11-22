'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { LiveRankingTable } from '@/components/live/LiveRankingTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchPublicContestRanking, PublicRankingUnavailable } from '@/lib/data/contestWatch'
import type { Ranking } from '@/lib/jutge_api_client'

const POLL_MS = 10_000

export function LiveWatchIndexPage() {
    const router = useRouter()
    const [examKey, setExamKey] = useState('')

    return (
        <LivePage title="Watch">
            <p className="text-muted-foreground">
                Enter a contest key (username:exam name). Public contest listing is not available yet.
            </p>
            <form
                className="flex max-w-md flex-col gap-4"
                onSubmit={(event) => {
                    event.preventDefault()
                    const key = examKey.trim()
                    if (!key) return
                    router.push(`/watch/${key}`)
                }}
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor="watch-index-key">Contest key</Label>
                    <Input id="watch-index-key" value={examKey} onChange={(event) => setExamKey(event.target.value)} required />
                </div>
                <Button type="submit">Watch</Button>
            </form>
        </LivePage>
    )
}

export function LiveWatchPage() {
    const params = useParams<{ examKey: string }>()
    const examKey = params.examKey
    const [ranking, setRanking] = useState<Ranking | null>(null)
    const [unavailable, setUnavailable] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!examKey) return
        let cancelled = false
        let timer = 0

        async function load() {
            try {
                const next = await fetchPublicContestRanking(examKey)
                if (cancelled) return
                setRanking(next)
                setUnavailable(false)
                setError(null)
                timer = window.setTimeout(() => void load(), POLL_MS)
            } catch (loadError) {
                if (cancelled) return
                if (loadError instanceof PublicRankingUnavailable) {
                    setUnavailable(true)
                    return
                }
                setError(loadError instanceof Error ? loadError.message : 'Could not load the ranking.')
            }
        }

        void load()
        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
    }, [examKey])

    return (
        <LivePage title="Ranking">
            <p className="text-sm text-muted-foreground">Contest {examKey}</p>
            {unavailable ? (
                <LiveNotice>The public contest ranking is not available yet.</LiveNotice>
            ) : null}
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            {!unavailable && !error && ranking === null ? <LiveSpinner /> : null}
            {ranking ? <LiveRankingTable ranking={ranking} /> : null}
        </LivePage>
    )
}

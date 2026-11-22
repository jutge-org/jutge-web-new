'use client'

import { EyeIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useState } from 'react'

import { LiveNotice, LiveSpinner } from '@/components/live/LiveChrome'
import SmoothButton from '@/components/smoothui/smooth-button'
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import { contestExamKey, fetchArenaContests } from '@/lib/data/contestWatch'
import { liveErrorMessage } from '@/lib/data/liveExam'
import type { ArenaContest } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'

type ContestWatchFormProps = {
    className?: string
}

type ContestItem = {
    value: string
    label: string
}

function toContestItem(contest: ArenaContest): ContestItem {
    return {
        value: contestExamKey(contest),
        label: contest.title,
    }
}

export function ContestWatchForm({ className }: ContestWatchFormProps) {
    const router = useRouter()
    const contestFieldId = useId()
    const [contests, setContests] = useState<ArenaContest[] | null>(null)
    const [selected, setSelected] = useState('')
    const [error, setError] = useState<string | null>(null)

    const contestItems = useMemo(() => (contests ?? []).map(toContestItem), [contests])
    const selectedItem = contestItems.find((item) => item.value === selected) ?? null

    useEffect(() => {
        let cancelled = false
        fetchArenaContests()
            .then((list) => {
                if (cancelled) return
                setContests(list)
                const first = list[0]
                if (first) setSelected(contestExamKey(first))
            })
            .catch((loadError) => {
                if (cancelled) return
                setContests([])
                setError(liveErrorMessage(loadError, 'Could not load contests.'))
            })
        return () => {
            cancelled = true
        }
    }, [])

    if (contests === null) return <LiveSpinner label="Loading contests…" />

    return (
        <form
            className={cn('flex w-full flex-col gap-4', className)}
            onSubmit={(event) => {
                event.preventDefault()
                if (!selected) return
                router.push(`/watch/${encodeURIComponent(selected)}`)
            }}
        >
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            {contests.length === 0 && !error ? (
                <p className="text-center text-sm text-muted-foreground">No contests are listed right now.</p>
            ) : null}
            {contests.length > 0 ? (
                <div className="flex w-full flex-col gap-2 text-left">
                    <Label htmlFor={contestFieldId}>Select a contest</Label>
                    <Combobox
                        isItemEqualToValue={(a, b) => a.value === b.value}
                        items={contestItems}
                        onValueChange={(item) => setSelected(item?.value ?? '')}
                        value={selectedItem}
                    >
                        <ComboboxInput
                            className="w-full"
                            id={contestFieldId}
                            placeholder="Search contests…"
                            showClear
                        />
                        <ComboboxContent>
                            <ComboboxEmpty>No contests found.</ComboboxEmpty>
                            <ComboboxList>
                                {(item: ContestItem) => (
                                    <ComboboxItem key={item.value} value={item}>
                                        {item.label}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>
            ) : null}
            <SmoothButton className="w-full" color="blue" disabled={!selected} type="submit" variant="candy">
                <EyeIcon aria-hidden className="size-4" />
                Watch
            </SmoothButton>
        </form>
    )
}
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import { AuthedGate } from '@/components/ClientGates'
import { useSiteMode } from '@/components/SiteModeProvider'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { ProblemsList } from '@/components/problems/ProblemsList'
import jutge from '@/lib/jutge'
import { getPreferredLanguageId } from '@/lib/data/auth'
import {
    fetchAllAbstractProblems,
    fetchLanguages,
    fetchStudentProblemStatuses,
    type ProblemRow,
} from '@/lib/data/problems'
import type { Language } from '@/lib/jutge_api_client'
import type { AbstractStatus } from '@/lib/jutge_api_client'

const LiveProblemsPage = dynamic(() =>
    import('@/components/live/LiveProblemsPage').then((mod) => mod.LiveProblemsPage),
)

export default function ProblemsPage() {
    const site = useSiteMode()
    if (site.kind !== 'normal') return <LiveProblemsPage />
    return <NormalProblemsPage />
}

function NormalProblemsPage() {
    return (
        <AuthedGate>
            <ProblemsPageContent />
        </AuthedGate>
    )
}

function ProblemsPageContent() {
    const [problems, setProblems] = useState<ProblemRow[] | null>(null)
    const [languages, setLanguages] = useState<Record<string, Language>>({})
    const [statuses, setStatuses] = useState<Record<string, AbstractStatus> | undefined>(undefined)
    const [preferredLanguageId, setPreferredLanguageId] = useState<string | null>(null)

    useEffect(() => {
        void getPreferredLanguageId().then(setPreferredLanguageId)
        void fetchLanguages().then(setLanguages)
        void fetchStudentProblemStatuses(jutge).then(setStatuses)
    }, [])

    useEffect(() => {
        void fetchAllAbstractProblems(preferredLanguageId).then(setProblems)
    }, [preferredLanguageId])

    const loading = problems === null

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Problems', url: '/problems' }]} />
            <PageTitle section="/problems" authenticated />
            {loading ? (
                <ProblemsList problems={[]} languages={languages} showAdvancedSearch showHelp loading />
            ) : problems.length === 0 ? (
                <p className="text-muted-foreground">Could not load problems. Please try again later.</p>
            ) : (
                <ProblemsList
                    problems={problems}
                    languages={languages}
                    statuses={statuses}
                    showAdvancedSearch
                    showHelp
                    preferredLanguageId={preferredLanguageId}
                />
            )}
        </div>
    )
}

'use client'

import { useEffect, useState, type ReactNode } from 'react'

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
import type { AbstractStatus, Language } from '@/lib/jutge_api_client'

const PROBLEMS_BREADCRUMBS = [{ title: 'Problems', url: '/problems' }] as const

function ProblemsPageChrome({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={PROBLEMS_BREADCRUMBS} />
            <PageTitle section="/problems" authenticated />
            {children}
        </div>
    )
}

export function ProblemsPageLoading({ showPasscodes }: { showPasscodes?: boolean }) {
    return (
        <ProblemsPageChrome>
            <ProblemsList
                problems={[]}
                languages={{}}
                showAdvancedSearch
                showHelp
                showPasscodes={showPasscodes}
                loading
            />
        </ProblemsPageChrome>
    )
}

type ProblemsPageContentProps = {
    showPasscodes?: boolean
}

export function ProblemsPageContent({ showPasscodes }: ProblemsPageContentProps) {
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
        <ProblemsPageChrome>
            {loading ? (
                <ProblemsList
                    problems={[]}
                    languages={languages}
                    showAdvancedSearch
                    showHelp
                    showPasscodes={showPasscodes}
                    loading
                />
            ) : problems.length === 0 ? (
                <p className="text-muted-foreground">Could not load problems. Please try again later.</p>
            ) : (
                <ProblemsList
                    problems={problems}
                    languages={languages}
                    statuses={statuses}
                    showAdvancedSearch
                    showHelp
                    showPasscodes={showPasscodes}
                    preferredLanguageId={preferredLanguageId}
                />
            )}
        </ProblemsPageChrome>
    )
}

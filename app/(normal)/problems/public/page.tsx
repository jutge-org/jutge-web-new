'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { ProblemsList } from '@/components/problems/ProblemsList'
import { getPreferredLanguageId } from '@/lib/data/auth'
import { fetchAllAbstractProblems, fetchLanguages, type ProblemRow } from '@/lib/data/problems'
import type { Language } from '@/lib/jutge_api_client'

export default function PublicProblemsPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [problems, setProblems] = useState<ProblemRow[] | null>(null)
    const [languages, setLanguages] = useState<Record<string, Language>>({})
    const [preferredLanguageId, setPreferredLanguageId] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && user) {
            router.replace('/problems')
        }
    }, [authLoading, user, router])

    useEffect(() => {
        if (authLoading || user) return
        void getPreferredLanguageId().then(setPreferredLanguageId)
        void fetchLanguages().then(setLanguages)
    }, [authLoading, user])

    useEffect(() => {
        if (authLoading || user) return
        void fetchAllAbstractProblems(preferredLanguageId, { allLanguageTitles: true }).then(setProblems)
    }, [authLoading, preferredLanguageId, user])

    const loading = authLoading || user !== null || problems === null

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Problems', url: '/problems/public' }]} />
            <PageTitle section="/problems" authenticated={false} hidden={false} />
            {loading ? (
                <ProblemsList problems={[]} languages={languages} loading />
            ) : problems.length === 0 ? (
                <p className="text-muted-foreground">Could not load problems. Please try again later.</p>
            ) : (
                <ProblemsList
                    problems={problems}
                    languages={languages}
                    preferredLanguageId={preferredLanguageId}
                />
            )}
        </div>
    )
}

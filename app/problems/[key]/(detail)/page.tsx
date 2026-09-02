'use client'

import { notFound, useParams } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { QuizProblemUnsupportedCard } from '@/components/problems/QuizProblemUnsupportedCard'
import { useProblemAssets } from '@/hooks/useProblemAssets'
import { useProblemShell } from '@/hooks/useProblemShell'
import { isQuizProblem } from '@/lib/problems'
import { problemBaseBreadcrumbs, problemLoadedBreadcrumbs } from '@/lib/problemBreadcrumbs'

export default function ProblemPage() {
    const { user } = useAuth()
    const params = useParams<{ key: string }>()
    const key = params.key
    const authenticated = user !== null

    const shell = useProblemShell({ key, isAuthenticated: authenticated, includeAssets: false })
    const { assets, assetsLoading } = useProblemAssets(
        shell.detail?.problem.problem_id,
        shell.detail?.problem.abstract_problem.driver_id,
    )
    const detailData = shell.detail && assets ? { ...shell.detail, ...assets } : shell.detail

    if (shell.detail === null) {
        notFound()
    }

    if (shell.detail && isQuizProblem(shell.detail.problem.abstract_problem.driver_id)) {
        const { problem } = shell.detail
        return (
            <div className="flex flex-col gap-6">
                <MainBreadcrumbs
                    breadcrumbs={problemLoadedBreadcrumbs(
                        key,
                        problem.problem_nm,
                        problem.title,
                        [],
                        authenticated,
                    )}
                />
                {!authenticated ? <PageTitle section="/problems" authenticated={false} hidden={false} /> : null}
                <QuizProblemUnsupportedCard
                    title={problem.title}
                    problemNm={problem.problem_nm}
                    author={problem.abstract_problem.author}
                />
            </div>
        )
    }

    const breadcrumbs = shell.detail
        ? problemLoadedBreadcrumbs(key, shell.detail.problem.problem_nm, shell.detail.problem.title, [], authenticated)
        : problemBaseBreadcrumbs(key, authenticated)

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={breadcrumbs} />
            {!authenticated ? <PageTitle section="/problems" authenticated={false} hidden={false} /> : null}
            {detailData ? (
                <ProblemDetail
                    pageKey={key}
                    data={detailData}
                    assetsLoading={assetsLoading}
                    status={shell.status}
                    defaultCompilerId={shell.defaultCompilerId}
                    isInstructorOwner={shell.isInstructorOwner ?? false}
                    isAdministrator={user?.administrator ?? false}
                    readOnly={!authenticated}
                    showNav={authenticated}
                    overlapHeader={authenticated}
                />
            ) : (
                <ProblemDetail loading pageKey={key} showNav={authenticated} overlapHeader={authenticated} />
            )}
        </div>
    )
}

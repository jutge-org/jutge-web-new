'use client'

import { notFound, useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { ProblemStatisticsView } from '@/components/instructor/problems/ProblemStatisticsView'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { hasInstructorOrAdministratorAccess, useProblemShell } from '@/hooks/useProblemShell'
import { isGameProblem } from '@/lib/problems'
import { problemLoadedBreadcrumbs, problemTrailBreadcrumbs } from '@/lib/problemBreadcrumbs'

export default function ProblemStatisticsPage() {
    return (
        <AuthedGate>
            {(user) => (
                <ProblemStatisticsPageContent
                    isInstructor={user.instructor}
                    isAdministrator={user.administrator}
                />
            )}
        </AuthedGate>
    )
}

function ProblemStatisticsPageContent({
    isInstructor,
    isAdministrator,
}: {
    isInstructor: boolean
    isAdministrator: boolean
}) {
    const params = useParams<{ key: string }>()
    const key = params.key
    const shell = useProblemShell({ key, isAuthenticated: true })

    const access = hasInstructorOrAdministratorAccess(isInstructor, isAdministrator)

    const shellLoading = shell.detail === undefined

    if (!shellLoading && shell.detail === null) {
        notFound()
    }

    if (!shellLoading && shell.detail && isGameProblem(shell.detail.problem.abstract_problem.driver_id)) {
        notFound()
    }

    if (!shellLoading && !access) {
        notFound()
    }

    const problem_nm = shell.problem_nm

    const breadcrumbs =
        shell.detail && problem_nm
            ? problemLoadedBreadcrumbs(key, shell.detail.problem.problem_nm, shell.detail.problem.title, [
                  { title: 'Statistics', url: `/problems/${key}/statistics` },
              ])
            : problemTrailBreadcrumbs(key, [{ title: 'Statistics', url: `/problems/${key}/statistics` }])

    const statisticsContent =
        shell.detail && problem_nm ? <ProblemStatisticsView problem_nm={problem_nm} /> : null

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={breadcrumbs} />
            {shell.detail ? (
                <ProblemDetail
                    pageKey={key}
                    data={shell.detail}
                    status={shell.status}
                    defaultCompilerId={shell.defaultCompilerId}
                    isInstructorOwner={shell.isInstructorOwner}
                    isAdministrator={isAdministrator}
                    showStatement={false}
                    showTestcases={false}
                >
                    {statisticsContent}
                </ProblemDetail>
            ) : (
                <ProblemDetail loading pageKey={key} showStatement={false} showTestcases={false}>
                    {statisticsContent}
                </ProblemDetail>
            )}
        </div>
    )
}

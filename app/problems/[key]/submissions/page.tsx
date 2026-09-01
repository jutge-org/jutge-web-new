'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { SubmissionsList } from '@/components/submissions/SubmissionsList'
import { useProblemShell } from '@/hooks/useProblemShell'
import jutge from '@/lib/jutge'
import { isGameProblem } from '@/lib/problems'
import { problemLoadedBreadcrumbs, problemNmFromKey, problemTrailBreadcrumbs } from '@/lib/problemBreadcrumbs'
import { fetchProblemSubmissionsData } from '@/lib/data/submissions'
import type { ProblemSubmissionRow } from '@/lib/submissions'

export default function ProblemSubmissionsPage() {
    return <AuthedGate>{(user) => <ProblemSubmissionsPageContent isAdministrator={user.administrator} />}</AuthedGate>
}

function ProblemSubmissionsPageContent({ isAdministrator }: { isAdministrator: boolean }) {
    const params = useParams<{ key: string }>()
    const key = params.key
    const fallbackProblemNm = problemNmFromKey(key) ?? key
    const shell = useProblemShell({ key, isAuthenticated: true, includeAssets: false })
    const [rows, setRows] = useState<ProblemSubmissionRow[] | null>(null)

    useEffect(() => {
        if (!shell.detail || !shell.problem_nm) return

        let cancelled = false
        setRows(null)

        const languageTitles = new Map(
            shell.detail.languageVariants.map((variant) => [variant.problem_id, variant.title]),
        )
        void fetchProblemSubmissionsData(jutge, shell.problem_nm, languageTitles).then((data) => {
            if (!cancelled) setRows(data)
        })

        return () => {
            cancelled = true
        }
    }, [shell.detail, shell.problem_nm])

    const shellLoading = shell.detail === undefined
    const submissionsLoading = shell.detail !== null && shell.detail !== undefined && rows === null

    if (!shellLoading && shell.detail === null) {
        notFound()
    }

    if (!shellLoading && shell.detail && isGameProblem(shell.detail.problem.abstract_problem.driver_id)) {
        notFound()
    }

    const breadcrumbs =
        shell.detail && shell.problem_nm
            ? problemLoadedBreadcrumbs(key, shell.detail.problem.problem_nm, shell.detail.problem.title, [
                  { title: 'Submissions', url: `/problems/${key}/submissions` },
              ])
            : problemTrailBreadcrumbs(key, [{ title: 'Submissions', url: `/problems/${key}/submissions` }])

    const problemNm = shell.problem_nm ?? fallbackProblemNm

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={breadcrumbs} />
            {shell.detail ? (
                <ProblemDetail
                    pageKey={key}
                    data={shell.detail}
                    status={shell.status}
                    defaultCompilerId={shell.defaultCompilerId}
                    isInstructorOwner={shell.isInstructorOwner ?? false}
                    isAdministrator={isAdministrator}
                    showStatement={false}
                    showTestcases={false}
                >
                    {submissionsLoading ? (
                        <SubmissionsList rows={[]} variant="problem" problemNm={problemNm} loading />
                    ) : (
                        <SubmissionsList rows={rows ?? []} variant="problem" problemNm={problemNm} />
                    )}
                </ProblemDetail>
            ) : (
                <ProblemDetail loading pageKey={key} showStatement={false} showTestcases={false}>
                    <SubmissionsList rows={[]} variant="problem" problemNm={problemNm} loading />
                </ProblemDetail>
            )}
        </div>
    )
}

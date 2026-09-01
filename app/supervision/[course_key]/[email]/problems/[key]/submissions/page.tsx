'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { SupervisorGate } from '@/components/ClientGates'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { SubmissionsList } from '@/components/submissions/SubmissionsList'
import { SupervisionPageShell } from '@/components/supervision/SupervisionPageShell'
import { SupervisionProblemNav } from '@/components/supervision/SupervisionProblemNav'
import { useSupervisionPageMeta, supervisionContextWithMeta } from '@/hooks/use-supervision-page-meta'
import { useSupervisionProblemShell } from '@/hooks/use-supervision-problem-shell'
import { useSupervisionParams } from '@/hooks/use-supervision-params'
import { fetchSupervisionProblemSubmissionsData } from '@/lib/data/supervisionSubmissions'
import { isGameProblem } from '@/lib/problems'
import { problemNmFromKey } from '@/lib/problemBreadcrumbs'
import { supervisionBaseBreadcrumbs, supervisionProblemBreadcrumbs } from '@/lib/supervision'
import type { ProblemSubmissionRow } from '@/lib/submissions'

export default function SupervisionProblemSubmissionsPage() {
    return (
        <SupervisorGate>
            <SupervisionProblemSubmissionsPageContent />
        </SupervisorGate>
    )
}

function SupervisionProblemSubmissionsPageContent() {
    const params = useParams<{ key: string }>()
    const key = params.key
    const fallbackProblemNm = problemNmFromKey(key) ?? key
    const baseContext = useSupervisionParams()
    const meta = useSupervisionPageMeta(baseContext)
    const context = useMemo(() => supervisionContextWithMeta(baseContext, meta), [baseContext, meta])
    const shell = useSupervisionProblemShell({ key, context, includeAssets: false })
    const [rows, setRows] = useState<ProblemSubmissionRow[] | null>(null)

    useEffect(() => {
        if (!shell.detail || !shell.problem_nm) return

        let cancelled = false
        setRows(null)

        const languageTitles = new Map(
            shell.detail.languageVariants.map((variant) => [variant.problem_id, variant.title]),
        )

        void fetchSupervisionProblemSubmissionsData(context, shell.problem_nm, languageTitles).then((data) => {
            if (!cancelled) setRows(data)
        })

        return () => {
            cancelled = true
        }
    }, [context, shell.detail, shell.problem_nm])

    const refreshPending = useCallback(async () => {
        if (!shell.problem_nm || !shell.detail) {
            return rows ?? []
        }

        const languageTitles = new Map(
            shell.detail.languageVariants.map((variant) => [variant.problem_id, variant.title]),
        )
        const nextRows = await fetchSupervisionProblemSubmissionsData(context, shell.problem_nm, languageTitles)
        setRows(nextRows)
        return nextRows
    }, [context, rows, shell.detail, shell.problem_nm])

    if (shell.detail === null) {
        notFound()
    }

    if (shell.detail && isGameProblem(shell.detail.problem.abstract_problem.driver_id)) {
        notFound()
    }

    const shellLoading = shell.detail === undefined
    const submissionsLoading = shell.detail !== null && shell.detail !== undefined && rows === null
    const problemNm = shell.problem_nm ?? fallbackProblemNm

    const breadcrumbs =
        shell.detail && shell.problem_nm
            ? supervisionProblemBreadcrumbs(
                  context,
                  key,
                  shell.detail.problem.problem_nm,
                  shell.detail.problem.title,
                  [{ title: 'Submissions', url: '#' }],
                  meta?.courseTitle,
              )
            : [
                  ...supervisionBaseBreadcrumbs(context, meta?.courseTitle),
                  { title: problemNm, url: '#' },
                  { title: 'Submissions', url: '#' },
              ]

    return (
        <SupervisionPageShell context={context} courseTitle={meta?.courseTitle} breadcrumbs={breadcrumbs}>
            {shell.detail ? (
                <ProblemDetail
                    pageKey={key}
                    data={shell.detail}
                    status={shell.status}
                    readOnly
                    showNav={false}
                    showStatement={false}
                    showTestcases={false}
                    overlapHeader={false}
                    supervisionContext={context}
                >
                    <div className="flex flex-col gap-6">
                        <SupervisionProblemNav pageKey={key} context={context} />
                        {submissionsLoading ? (
                            <SubmissionsList
                                rows={[]}
                                variant="problem"
                                problemNm={problemNm}
                                loading
                                emptyMessage="This student has not submitted any solution to this problem yet."
                            />
                        ) : (
                            <SubmissionsList
                                rows={rows ?? []}
                                variant="problem"
                                problemNm={problemNm}
                                onRefreshPending={refreshPending}
                                emptyMessage="This student has not submitted any solution to this problem yet."
                            />
                        )}
                    </div>
                </ProblemDetail>
            ) : shellLoading ? (
                <ProblemDetail
                    loading
                    pageKey={key}
                    showNav={false}
                    showStatement={false}
                    showTestcases={false}
                    overlapHeader={false}
                >
                    <div className="flex flex-col gap-6">
                        <SupervisionProblemNav pageKey={key} context={context} />
                        <SubmissionsList
                            rows={[]}
                            variant="problem"
                            problemNm={problemNm}
                            loading
                            emptyMessage="This student has not submitted any solution to this problem yet."
                        />
                    </div>
                </ProblemDetail>
            ) : null}
        </SupervisionPageShell>
    )
}

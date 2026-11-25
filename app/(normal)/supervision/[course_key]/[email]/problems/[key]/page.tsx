'use client'

import { useMemo } from 'react'
import { notFound, useParams } from 'next/navigation'

import { SupervisorGate } from '@/components/ClientGates'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { SupervisionPageShell } from '@/components/supervision/SupervisionPageShell'
import { SupervisionProblemNav, supervisionProblemNavPropsFromDetail } from '@/components/supervision/SupervisionProblemNav'
import { useSupervisionPageMeta, supervisionContextWithMeta } from '@/hooks/use-supervision-page-meta'
import { useSupervisionProblemShell } from '@/hooks/use-supervision-problem-shell'
import { useSupervisionParams } from '@/hooks/use-supervision-params'
import { isGameProblem } from '@/lib/problems'
import { problemNmFromKey } from '@/lib/problemBreadcrumbs'
import { supervisionBaseBreadcrumbs, supervisionProblemBreadcrumbs } from '@/lib/supervision'

export default function SupervisionProblemPage() {
    return (
        <SupervisorGate>
            <SupervisionProblemPageContent />
        </SupervisorGate>
    )
}

function SupervisionProblemPageContent() {
    const params = useParams<{ key: string }>()
    const key = params.key
    const baseContext = useSupervisionParams()
    const meta = useSupervisionPageMeta(baseContext)
    const context = useMemo(() => supervisionContextWithMeta(baseContext, meta), [baseContext, meta])
    const shell = useSupervisionProblemShell({ key, context })

    if (shell.detail === null) {
        notFound()
    }

    if (shell.detail && isGameProblem(shell.detail.problem.abstract_problem.driver_id)) {
        notFound()
    }

    const breadcrumbs =
        shell.detail && shell.problem_nm
            ? supervisionProblemBreadcrumbs(
                  context,
                  key,
                  shell.detail.problem.problem_nm,
                  shell.detail.problem.title,
                  [],
                  meta?.courseTitle,
              )
            : [
                  ...supervisionBaseBreadcrumbs(context, meta?.courseTitle),
                  { title: problemNmFromKey(key) ?? key, url: '#' },
              ]

    const navProps = supervisionProblemNavPropsFromDetail(key, context, shell.detail, shell.problem_nm)

    return (
        <SupervisionPageShell context={context} courseTitle={meta?.courseTitle} breadcrumbs={breadcrumbs}>
            {shell.detail ? (
                <ProblemDetail
                    pageKey={key}
                    data={shell.detail}
                    status={shell.status}
                    readOnly
                    showNav={false}
                    overlapHeader={false}
                    supervisionContext={context}
                >
                    <SupervisionProblemNav {...navProps} />
                </ProblemDetail>
            ) : (
                <ProblemDetail loading pageKey={key} showNav={false} overlapHeader={false}>
                    <SupervisionProblemNav {...navProps} />
                </ProblemDetail>
            )}
        </SupervisionPageShell>
    )
}

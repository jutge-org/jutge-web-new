'use client'

import { useEffect, useMemo, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { SupervisorGate } from '@/components/ClientGates'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { ProblemTestcases } from '@/components/problems/ProblemTestcases'
import {
    SupervisionProblemNav,
    supervisionProblemNavPropsFromDetail,
} from '@/components/supervision/SupervisionProblemNav'
import { SupervisionPageShell } from '@/components/supervision/SupervisionPageShell'
import { supervisionContextWithMeta, useSupervisionPageMeta } from '@/hooks/use-supervision-page-meta'
import { useSupervisionParams } from '@/hooks/use-supervision-params'
import { useInstructorOwnsProblem, useSupervisionProblemShell } from '@/hooks/use-supervision-problem-shell'
import { instructorResourceAccessState } from '@/lib/data/instructorSharedResources'
import { fetchProblemTestcaseNames } from '@/lib/data/problemTestcases'
import { problemNmFromKey } from '@/lib/problemBreadcrumbs'
import { isGameProblem } from '@/lib/problems'
import jutge from '@/lib/jutge'
import {
    supervisionBaseBreadcrumbs,
    supervisionProblemBreadcrumbs,
    supervisionProblemTestcasesHref,
} from '@/lib/supervision'

type TestcasesLoadState =
    | { status: 'loading' }
    | { status: 'not_shared' }
    | { status: 'ready'; testcaseNames: string[] }

export default function SupervisionProblemTestcasesPage() {
    return (
        <SupervisorGate>
            <SupervisionProblemTestcasesPageContent />
        </SupervisorGate>
    )
}

function SupervisionProblemTestcasesPageContent() {
    const params = useParams<{ key: string }>()
    const key = params.key
    const fallbackProblemNm = problemNmFromKey(key) ?? key
    const { user } = useAuth()
    const isAdministrator = Boolean(user?.administrator)
    const baseContext = useSupervisionParams()
    const meta = useSupervisionPageMeta(baseContext)
    const context = useMemo(() => supervisionContextWithMeta(baseContext, meta), [baseContext, meta])
    const shell = useSupervisionProblemShell({ key, context, includeAssets: false })
    const isInstructorOwner = useInstructorOwnsProblem(shell.problem_nm)
    const [loadState, setLoadState] = useState<TestcasesLoadState>({ status: 'loading' })

    useEffect(() => {
        if (!shell.detail) return

        const { abstract_problem, problem_id } = shell.detail.problem
        const accessState = instructorResourceAccessState(
            isAdministrator,
            isInstructorOwner,
            abstract_problem.shared_testcases,
        )

        if (accessState === 'pending') {
            setLoadState({ status: 'loading' })
            return
        }

        if (accessState === 'not_shared') {
            setLoadState({ status: 'not_shared' })
            return
        }

        let cancelled = false
        setLoadState({ status: 'loading' })

        void fetchProblemTestcaseNames(
            jutge,
            problem_id,
            { isAdministrator, isInstructorOwner: isInstructorOwner === true },
            abstract_problem.shared_testcases,
        ).then((result) => {
            if (cancelled) return
            if (result.status === 'not_shared') {
                setLoadState({ status: 'not_shared' })
                return
            }
            if (result.status === 'forbidden') {
                setLoadState({ status: 'ready', testcaseNames: [] })
                return
            }
            setLoadState({ status: 'ready', testcaseNames: result.data })
        })

        return () => {
            cancelled = true
        }
    }, [isAdministrator, isInstructorOwner, shell.detail])

    if (shell.detail === null) {
        notFound()
    }

    if (shell.detail && isGameProblem(shell.detail.problem.abstract_problem.driver_id)) {
        notFound()
    }

    const shellLoading = shell.detail === undefined
    const testcasesLoading = shell.detail && loadState.status === 'loading'
    const problemNm = shell.problem_nm ?? fallbackProblemNm
    const navProps = supervisionProblemNavPropsFromDetail(key, context, shell.detail, shell.problem_nm)
    const testcasesHref = supervisionProblemTestcasesHref(context, key)

    const breadcrumbs =
        shell.detail && shell.problem_nm
            ? supervisionProblemBreadcrumbs(
                  context,
                  key,
                  shell.detail.problem.problem_nm,
                  shell.detail.problem.title,
                  [{ title: 'Test cases', url: testcasesHref }],
                  meta?.courseTitle,
              )
            : [
                  ...supervisionBaseBreadcrumbs(context, meta?.courseTitle),
                  { title: problemNm, url: '#' },
                  { title: 'Test cases', url: testcasesHref },
              ]

    const abstractProblem = shell.detail?.problem.abstract_problem

    const testcasesContent = testcasesLoading ? (
        <ProblemTestcases loading />
    ) : loadState.status === 'not_shared' ? (
        <ProblemTestcases notShared />
    ) : shell.detail && abstractProblem ? (
        <ProblemTestcases
            problemId={shell.detail.problem.problem_id}
            driverId={abstractProblem.driver_id}
            testcaseAccess={{
                isAdministrator,
                isInstructorOwner: isInstructorOwner === true,
            }}
            shared_testcases={abstractProblem.shared_testcases}
            testcaseNames={loadState.status === 'ready' ? loadState.testcaseNames : []}
        />
    ) : (
        <ProblemTestcases loading />
    )

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
                        <SupervisionProblemNav {...navProps} />
                        {testcasesContent}
                    </div>
                </ProblemDetail>
            ) : shellLoading ? (
                <ProblemDetail loading pageKey={key} showNav={false} showStatement={false} showTestcases={false} overlapHeader={false}>
                    <div className="flex flex-col gap-6">
                        <SupervisionProblemNav {...navProps} />
                        <ProblemTestcases loading />
                    </div>
                </ProblemDetail>
            ) : null}
        </SupervisionPageShell>
    )
}

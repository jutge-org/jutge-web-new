'use client'

import { useEffect, useMemo, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { SupervisorGate } from '@/components/ClientGates'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { ProblemSolutions } from '@/components/problems/ProblemSolutions'
import {
    SupervisionProblemNav,
    supervisionProblemNavPropsFromDetail,
} from '@/components/supervision/SupervisionProblemNav'
import { SupervisionPageShell } from '@/components/supervision/SupervisionPageShell'
import { supervisionContextWithMeta, useSupervisionPageMeta } from '@/hooks/use-supervision-page-meta'
import { useSupervisionParams } from '@/hooks/use-supervision-params'
import { useInstructorOwnsProblem, useSupervisionProblemShell } from '@/hooks/use-supervision-problem-shell'
import { instructorResourceAccessState } from '@/lib/data/instructorSharedResources'
import { fetchProblemSolutionProglangs } from '@/lib/data/problemSolutions'
import { problemNmFromKey } from '@/lib/problemBreadcrumbs'
import { isGameProblem } from '@/lib/problems'
import jutge from '@/lib/jutge'
import {
    supervisionBaseBreadcrumbs,
    supervisionProblemBreadcrumbs,
    supervisionProblemSolutionsHref,
    supervisionSolutionViewHref,
} from '@/lib/supervision'

type SolutionsLoadState =
    | { status: 'loading' }
    | { status: 'not_shared' }
    | { status: 'ready'; proglangs: string[] }

export default function SupervisionProblemSolutionsPage() {
    return (
        <SupervisorGate>
            <SupervisionProblemSolutionsPageContent />
        </SupervisorGate>
    )
}

function SupervisionProblemSolutionsPageContent() {
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
    const [loadState, setLoadState] = useState<SolutionsLoadState>({ status: 'loading' })

    useEffect(() => {
        if (!shell.detail) return

        const { abstract_problem, problem_id } = shell.detail.problem
        const accessState = instructorResourceAccessState(
            isAdministrator,
            isInstructorOwner,
            abstract_problem.shared_solutions,
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

        void fetchProblemSolutionProglangs(
            jutge,
            problem_id,
            { isAdministrator, isInstructorOwner: isInstructorOwner === true },
            abstract_problem.shared_solutions,
        ).then((result) => {
            if (cancelled) return
            if (result.status === 'not_shared') {
                setLoadState({ status: 'not_shared' })
                return
            }
            if (result.status === 'forbidden') {
                setLoadState({ status: 'ready', proglangs: [] })
                return
            }
            setLoadState({ status: 'ready', proglangs: result.data })
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
    const solutionsLoading = shell.detail && loadState.status === 'loading'
    const problemNm = shell.problem_nm ?? fallbackProblemNm
    const navProps = supervisionProblemNavPropsFromDetail(key, context, shell.detail, shell.problem_nm)
    const solutionsHref = supervisionProblemSolutionsHref(context, key)

    const breadcrumbs =
        shell.detail && shell.problem_nm
            ? supervisionProblemBreadcrumbs(
                  context,
                  key,
                  shell.detail.problem.problem_nm,
                  shell.detail.problem.title,
                  [{ title: 'Solutions', url: solutionsHref }],
                  meta?.courseTitle,
              )
            : [
                  ...supervisionBaseBreadcrumbs(context, meta?.courseTitle),
                  { title: problemNm, url: '#' },
                  { title: 'Solutions', url: solutionsHref },
              ]

    const abstractProblem = shell.detail?.problem.abstract_problem

    function renderSolutionsContent() {
        if (solutionsLoading) {
            return <ProblemSolutions loading />
        }
        if (loadState.status === 'not_shared') {
            return <ProblemSolutions notShared />
        }
        if (!shell.detail || !abstractProblem) {
            return <ProblemSolutions loading />
        }
        return (
            <ProblemSolutions
                pageKey={key}
                problemId={shell.detail.problem.problem_id}
                problem_nm={problemNm}
                proglangs={loadState.status === 'ready' ? loadState.proglangs : []}
                solutionAccess={{
                    isAdministrator,
                    isInstructorOwner: isInstructorOwner === true,
                }}
                shared_solutions={abstractProblem.shared_solutions}
                solutionViewHrefForProglang={(proglang) => supervisionSolutionViewHref(context, key, proglang)}
            />
        )
    }

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
                        {renderSolutionsContent()}
                    </div>
                </ProblemDetail>
            ) : shellLoading ? (
                <ProblemDetail loading pageKey={key} showNav={false} showStatement={false} showTestcases={false} overlapHeader={false}>
                    <div className="flex flex-col gap-6">
                        <SupervisionProblemNav {...navProps} />
                        <ProblemSolutions loading />
                    </div>
                </ProblemDetail>
            ) : null}
        </SupervisionPageShell>
    )
}

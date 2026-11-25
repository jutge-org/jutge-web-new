'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { ProblemSolutions } from '@/components/problems/ProblemSolutions'
import { hasInstructorOrAdministratorAccess, useProblemShell } from '@/hooks/useProblemShell'
import jutge from '@/lib/jutge'
import { isGameProblem } from '@/lib/problems'
import { problemLoadedBreadcrumbs, problemTrailBreadcrumbs } from '@/lib/problemBreadcrumbs'
import { instructorResourceAccessState } from '@/lib/data/instructorSharedResources'
import { fetchProblemSolutionProglangs } from '@/lib/data/problemSolutions'

type SolutionsLoadState =
    | { status: 'loading' }
    | { status: 'not_shared' }
    | { status: 'ready'; proglangs: string[] }

export default function ProblemSolutionsPage() {
    return (
        <AuthedGate>
            {(user) => (
                <ProblemSolutionsPageContent
                    isInstructor={user.instructor}
                    isAdministrator={user.administrator}
                />
            )}
        </AuthedGate>
    )
}

function ProblemSolutionsPageContent({
    isInstructor,
    isAdministrator,
}: {
    isInstructor: boolean
    isAdministrator: boolean
}) {
    const params = useParams<{ key: string }>()
    const key = params.key
    const shell = useProblemShell({ key, isAuthenticated: true })
    const [loadState, setLoadState] = useState<SolutionsLoadState>({ status: 'loading' })

    const access = hasInstructorOrAdministratorAccess(isInstructor, isAdministrator)

    useEffect(() => {
        if (!shell.detail || !access) return

        const { abstract_problem, problem_id } = shell.detail.problem
        const accessState = instructorResourceAccessState(
            isAdministrator,
            shell.isInstructorOwner,
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
            { isAdministrator, isInstructorOwner: shell.isInstructorOwner === true },
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
    }, [access, isAdministrator, shell.detail, shell.isInstructorOwner])

    const shellLoading = shell.detail === undefined
    const solutionsLoading = access && shell.detail && loadState.status === 'loading'

    if (!shellLoading && shell.detail === null) {
        notFound()
    }

    if (!shellLoading && shell.detail && isGameProblem(shell.detail.problem.abstract_problem.driver_id)) {
        notFound()
    }

    if (!shellLoading && !access) {
        notFound()
    }

    const breadcrumbs =
        shell.detail && shell.problem_nm
            ? problemLoadedBreadcrumbs(key, shell.detail.problem.problem_nm, shell.detail.problem.title, [
                  { title: 'Solutions', url: `/problems/${key}/solutions` },
              ])
            : problemTrailBreadcrumbs(key, [{ title: 'Solutions', url: `/problems/${key}/solutions` }])

    const problem_nm = shell.problem_nm ?? key
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
                problem_nm={problem_nm}
                proglangs={loadState.status === 'ready' ? loadState.proglangs : []}
                solutionAccess={{
                    isAdministrator,
                    isInstructorOwner: shell.isInstructorOwner === true,
                }}
                shared_solutions={abstractProblem.shared_solutions}
            />
        )
    }

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
                    {renderSolutionsContent()}
                </ProblemDetail>
            ) : (
                <ProblemDetail loading pageKey={key} showStatement={false} showTestcases={false}>
                    <ProblemSolutions loading />
                </ProblemDetail>
            )}
        </div>
    )
}

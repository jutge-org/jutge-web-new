'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { ProblemTestcases } from '@/components/problems/ProblemTestcases'
import { hasInstructorOrAdministratorAccess, useProblemShell } from '@/hooks/useProblemShell'
import jutge from '@/lib/jutge'
import { isGameProblem } from '@/lib/problems'
import { problemLoadedBreadcrumbs, problemTrailBreadcrumbs } from '@/lib/problemBreadcrumbs'
import { instructorResourceAccessState } from '@/lib/data/instructorSharedResources'
import { fetchProblemTestcaseNames } from '@/lib/data/problemTestcases'

type TestcasesLoadState =
    | { status: 'loading' }
    | { status: 'not_shared' }
    | { status: 'ready'; testcaseNames: string[] }

export default function ProblemTestcasesPage() {
    return (
        <AuthedGate>
            {(user) => (
                <ProblemTestcasesPageContent
                    isInstructor={user.instructor}
                    isAdministrator={user.administrator}
                />
            )}
        </AuthedGate>
    )
}

function ProblemTestcasesPageContent({
    isInstructor,
    isAdministrator,
}: {
    isInstructor: boolean
    isAdministrator: boolean
}) {
    const params = useParams<{ key: string }>()
    const key = params.key
    const shell = useProblemShell({ key, isAuthenticated: true })
    const [loadState, setLoadState] = useState<TestcasesLoadState>({ status: 'loading' })

    const access = hasInstructorOrAdministratorAccess(isInstructor, isAdministrator)

    useEffect(() => {
        if (!shell.detail || !access) return

        const { abstract_problem, problem_id } = shell.detail.problem
        const accessState = instructorResourceAccessState(
            isAdministrator,
            shell.isInstructorOwner,
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
            { isAdministrator, isInstructorOwner: shell.isInstructorOwner === true },
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
    }, [access, isAdministrator, shell.detail, shell.isInstructorOwner])

    const shellLoading = shell.detail === undefined
    const testcasesLoading = access && shell.detail && loadState.status === 'loading'

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
                  { title: 'Test cases', url: `/problems/${key}/testcases` },
              ])
            : problemTrailBreadcrumbs(key, [{ title: 'Test cases', url: `/problems/${key}/testcases` }])

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
                isInstructorOwner: shell.isInstructorOwner === true,
            }}
            shared_testcases={abstractProblem.shared_testcases}
            testcaseNames={loadState.status === 'ready' ? loadState.testcaseNames : []}
        />
    ) : (
        <ProblemTestcases loading />
    )

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
                    {testcasesContent}
                </ProblemDetail>
            ) : (
                <ProblemDetail loading pageKey={key} showStatement={false} showTestcases={false}>
                    <ProblemTestcases loading />
                </ProblemDetail>
            )}
        </div>
    )
}

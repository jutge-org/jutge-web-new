'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import { FullscreenEditorLoading } from '@/components/general/FullscreenEditorLoading'
import { SolutionCodeEditor } from '@/components/problems/SolutionCodeEditor'
import { Card, CardDescription, CardHeader } from '@/components/ui/card'
import { hasInstructorOrAdministratorAccess } from '@/hooks/useProblemShell'
import jutge from '@/lib/jutge'
import {
    INSTRUCTOR_SOLUTIONS_NOT_SHARED_MESSAGE,
    instructorResourceAccessState,
} from '@/lib/data/instructorSharedResources'
import { parseProblemKey } from '@/lib/problems'
import { solutionDownloadHref } from '@/lib/solutions'
import { fetchInstructorOwnsProblem, fetchProblemDetail, resolveProblemId } from '@/lib/data/problemDetail'
import { fetchProblemSolutionContent } from '@/lib/data/problemSolutions'

type PageData = {
    code: string
    codeExtension: string
    codeFilename: string
    codeHref: string
    title: string
    proglang: string
}

type PageState =
    | { status: 'loading' }
    | { status: 'not_found' }
    | { status: 'not_shared'; title: string }
    | { status: 'ready'; data: PageData }

export default function ProblemSolutionCodeViewPage() {
    return (
        <AuthedGate>
            {(user) => (
                <ProblemSolutionCodeViewPageContent
                    isInstructor={user.instructor}
                    isAdministrator={user.administrator}
                />
            )}
        </AuthedGate>
    )
}

function ProblemSolutionCodeViewPageContent({
    isInstructor,
    isAdministrator,
}: {
    isInstructor: boolean
    isAdministrator: boolean
}) {
    const params = useParams<{ key: string; proglang: string }>()
    const key = params.key
    const proglang = params.proglang
    const [pageState, setPageState] = useState<PageState>({ status: 'loading' })

    useEffect(() => {
        if (!hasInstructorOrAdministratorAccess(isInstructor, isAdministrator)) {
            setPageState({ status: 'not_found' })
            return
        }

        void (async () => {
            const problemId = await resolveProblemId(key)
            if (!problemId) {
                setPageState({ status: 'not_found' })
                return
            }

            const data = await fetchProblemDetail(problemId)
            if (!data) {
                setPageState({ status: 'not_found' })
                return
            }

            const parsed = parseProblemKey(problemId)
            const problem_nm = parsed.kind === 'problem_id' ? parsed.problem_nm : data.problem.problem_nm
            const title = `${data.problem.problem_nm} — ${data.problem.title}`
            const { abstract_problem } = data.problem

            const isInstructorOwner = isAdministrator ? false : await fetchInstructorOwnsProblem(problem_nm)
            const accessState = instructorResourceAccessState(
                isAdministrator,
                isAdministrator ? undefined : isInstructorOwner,
                abstract_problem.shared_solutions,
            )

            if (accessState === 'not_shared') {
                setPageState({ status: 'not_shared', title })
                return
            }

            const solution = await fetchProblemSolutionContent(
                jutge,
                problemId,
                problem_nm,
                proglang,
                { isAdministrator, isInstructorOwner },
                abstract_problem.shared_solutions,
            )
            if (solution.status === 'forbidden') {
                setPageState({ status: 'not_found' })
                return
            }
            if (solution.status === 'not_shared') {
                setPageState({ status: 'not_shared', title })
                return
            }
            if (!solution.data.codeFilename) {
                setPageState({ status: 'not_found' })
                return
            }

            setPageState({
                status: 'ready',
                data: {
                    code: solution.data.code,
                    codeExtension: solution.data.codeExtension ?? '',
                    codeFilename: solution.data.codeFilename,
                    codeHref: solutionDownloadHref(key, proglang),
                    title,
                    proglang,
                },
            })
        })()
    }, [isAdministrator, isInstructor, key, proglang])

    if (pageState.status === 'loading') {
        return <FullscreenEditorLoading title={`${key} — ${proglang} solution`} />
    }

    if (pageState.status === 'not_found') {
        notFound()
    }

    if (pageState.status === 'not_shared') {
        return (
            <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
                <p className="text-lg font-medium">{pageState.title}</p>
                <Card className="max-w-lg ring-0 border border-border shadow-sm">
                    <CardHeader>
                        <CardDescription>{INSTRUCTOR_SOLUTIONS_NOT_SHARED_MESSAGE}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const pageData = pageState.data

    return (
        <SolutionCodeEditor
            code={pageData.code}
            codeExtension={pageData.codeExtension}
            codeFilename={pageData.codeFilename}
            codeHref={pageData.codeHref}
            title={pageData.title}
            proglang={pageData.proglang}
        />
    )
}

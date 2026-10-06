'use client'

import { useEffect, useMemo, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { SupervisorGate } from '@/components/ClientGates'
import { FullscreenEditorLoading } from '@/components/general/FullscreenEditorLoading'
import { SolutionCodeEditor } from '@/components/problems/SolutionCodeEditor'
import { Card, CardDescription, CardHeader } from '@/components/ui/card'
import { useSupervisionParams } from '@/hooks/use-supervision-params'
import { supervisionContextWithMeta, useSupervisionPageMeta } from '@/hooks/use-supervision-page-meta'
import {
    INSTRUCTOR_SOLUTIONS_NOT_SHARED_MESSAGE,
    instructorResourceAccessState,
} from '@/lib/data/instructorSharedResources'
import { fetchInstructorOwnsProblem, fetchProblemDetail, resolveProblemId } from '@/lib/data/problemDetail'
import { fetchProblemSolutionContent } from '@/lib/data/problemSolutions'
import jutge from '@/lib/jutge'
import { parseProblemKey } from '@/lib/problems'
import { supervisionSolutionDownloadHref } from '@/lib/supervision'

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

export default function SupervisionProblemSolutionCodeViewPage() {
    return (
        <SupervisorGate>
            <SupervisionProblemSolutionCodeViewPageContent />
        </SupervisorGate>
    )
}

function SupervisionProblemSolutionCodeViewPageContent() {
    const params = useParams<{ key: string; proglang: string }>()
    const key = params.key
    const proglang = params.proglang
    const { user } = useAuth()
    const isAdministrator = Boolean(user?.administrator)
    const baseContext = useSupervisionParams()
    const meta = useSupervisionPageMeta(baseContext)
    const context = useMemo(() => supervisionContextWithMeta(baseContext, meta), [baseContext, meta])
    const [pageState, setPageState] = useState<PageState>({ status: 'loading' })

    useEffect(() => {
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
                    codeHref: supervisionSolutionDownloadHref(context, key, proglang),
                    title,
                    proglang,
                },
            })
        })()
    }, [context, isAdministrator, key, proglang])

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

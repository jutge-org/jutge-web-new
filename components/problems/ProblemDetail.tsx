import { GameProblemCompetitionsCard } from '@/components/problems/GameProblemCompetitionsCard'
import { ProblemHeaderCard } from '@/components/problems/ProblemHeaderCard'
import { ProblemHealthCard } from '@/components/problems/ProblemHealthCard'
import { ProblemNav } from '@/components/problems/ProblemNav'
import { ProblemStatement } from '@/components/problems/ProblemStatement'
import { ProblemWidgetCard } from '@/components/problems/ProblemWidgetCard'
import { PublicTestcases } from '@/components/problems/PublicTestcases'
import { WidgetSpinner } from '@/components/general/WidgetSpinner'
import { isGameProblem } from '@/lib/problems'
import { showInstructorProblemTabs } from '@/lib/problemNav'
import { cn } from '@/lib/utils'
import type { AbstractStatus } from '@/lib/jutge_api_client'
import type { ProblemDetailData } from '@/lib/data/problemDetail'
import type { SupervisionContext } from '@/lib/supervision'

import type { ReactNode } from 'react'

type ProblemDetailBaseProps = {
    pageKey: string
    showStatement?: boolean
    showTestcases?: boolean
    showNav?: boolean
    /** Pull the header card into the sticky navbar (PageTitle-style). Disable when a PageTitle sits above. */
    overlapHeader?: boolean
    children?: ReactNode
}

type ProblemDetailLoadingProps = ProblemDetailBaseProps & {
    loading: true
}

type ProblemDetailLoadedProps = ProblemDetailBaseProps & {
    loading?: false
    data: ProblemDetailData
    /** When true, statement and testcase widgets show spinners while assets load. */
    assetsLoading?: boolean
    status?: AbstractStatus | null
    defaultCompilerId?: string | null
    isInstructorOwner?: boolean
    isAdministrator?: boolean
    readOnly?: boolean
    supervisionContext?: SupervisionContext
}

type ProblemDetailProps = ProblemDetailLoadingProps | ProblemDetailLoadedProps

function ProblemHeaderCardLoading({ overlapHeader }: { overlapHeader: boolean }) {
    return (
        <div
            className={cn(
                'flex min-h-22 items-center justify-center rounded-2xl border border-border px-6 py-5 shadow-sm',
                overlapHeader && '-mt-6',
            )}
        >
            <WidgetSpinner label="Loading problem" />
        </div>
    )
}

export function ProblemDetail(props: ProblemDetailProps) {
    const {
        pageKey,
        showStatement = true,
        showTestcases = true,
        showNav = true,
        overlapHeader = true,
        children,
    } = props

    if (props.loading) {
        return (
            <div className="flex flex-col gap-6">
                <ProblemHeaderCardLoading overlapHeader={overlapHeader} />
                {showNav ? <ProblemNav pageKey={pageKey} showInstructorTabs={false} /> : null}
                {children}
                {showStatement ? <ProblemWidgetCard title="Statement" /> : null}
                {showTestcases ? <ProblemWidgetCard title="Public test cases" /> : null}
            </div>
        )
    }

    const {
        data,
        assetsLoading = false,
        status,
        defaultCompilerId,
        isInstructorOwner = false,
        isAdministrator = false,
        readOnly = false,
        supervisionContext,
    } = props
    const { problem } = data
    const isGame = isGameProblem(problem.abstract_problem.driver_id)
    const showActions = !readOnly && status !== undefined && !isGame
    const showInstructorTabs = showInstructorProblemTabs(isInstructorOwner, isAdministrator)
    // Game banner sits above the header; only the first card should overlap the navbar.
    const headerOverlap = overlapHeader && !isGame

    return (
        <div className="flex flex-col gap-6">
            {isGame ? <GameProblemCompetitionsCard /> : null}

            <ProblemHeaderCard
                pageKey={pageKey}
                data={data}
                status={status}
                defaultCompilerId={defaultCompilerId}
                showActions={showActions}
                supervisionContext={supervisionContext}
                overlapHeader={headerOverlap}
            />

            {showNav ? <ProblemNav pageKey={pageKey} showInstructorTabs={showInstructorTabs} /> : null}

            {children}

            <ProblemHealthCard problem={problem} />

            {showStatement ? (
                assetsLoading ? (
                    <ProblemWidgetCard title="Statement" />
                ) : (
                    <ProblemStatement
                        pageKey={pageKey}
                        problemId={problem.problem_id}
                        shortHtmlStatement={data.shortHtmlStatement}
                        templates={data.templates}
                    />
                )
            ) : null}

            {showTestcases ? (
                assetsLoading ? (
                    <ProblemWidgetCard title="Public test cases" />
                ) : data.publicTestcases.length > 0 ? (
                    <PublicTestcases testcases={data.publicTestcases} />
                ) : null
            ) : null}
        </div>
    )
}

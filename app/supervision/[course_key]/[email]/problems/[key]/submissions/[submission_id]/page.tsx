'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { SupervisorGate } from '@/components/ClientGates'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { SubmissionDetailView } from '@/components/submissions/SubmissionDetailView'
import { SubmissionPendingRefresh } from '@/components/submissions/SubmissionPendingRefresh'
import { SupervisionPageShell } from '@/components/supervision/SupervisionPageShell'
import { SupervisionProblemNav } from '@/components/supervision/SupervisionProblemNav'
import { useSupervisionPageMeta, supervisionContextWithMeta } from '@/hooks/use-supervision-page-meta'
import { useSupervisionProblemShell } from '@/hooks/use-supervision-problem-shell'
import { useSupervisionParams } from '@/hooks/use-supervision-params'
import type { SubmissionCodeMetricsData } from '@/lib/codeMetrics'
import {
    fetchSupervisionSubmissionCodeMetricsForDetail,
    fetchSupervisionSubmissionDetailCore,
    fetchSupervisionSubmissionSections,
    fetchSupervisionSubmissionSource,
    fetchSupervisionSubmissionsForProblem,
} from '@/lib/data/supervisionSubmissions'
import {
    EMPTY_SUBMISSION_SECTIONS,
    type SubmissionDetailCore,
    type SubmissionDetailSections,
    type SubmissionSourceContent,
} from '@/lib/data/submissions'
import { isLinkableTestcase } from '@/lib/submissions'
import {
    buildSupervisionSubmissionNavLinks,
    supervisionProblemSubmissionsHref,
    supervisionSubmissionCodeHref,
    supervisionSubmissionHref,
    supervisionSubmissionTestcaseHref,
    supervisionBaseBreadcrumbs,
    supervisionProblemBreadcrumbs,
} from '@/lib/supervision'
import type { SubmissionNavLinks } from '@/lib/submissions'

export default function SupervisionSubmissionDetailPage() {
    return (
        <SupervisorGate>
            <SupervisionSubmissionDetailPageContent />
        </SupervisorGate>
    )
}

function SupervisionSubmissionDetailPageContent() {
    const params = useParams<{ key: string; submission_id: string }>()
    const key = params.key
    const submission_id = params.submission_id
    const baseContext = useSupervisionParams()
    const meta = useSupervisionPageMeta(baseContext)
    const context = useMemo(() => supervisionContextWithMeta(baseContext, meta), [baseContext, meta])
    const shell = useSupervisionProblemShell({ key, context, includeAssets: false })
    const [core, setCore] = useState<SubmissionDetailCore | null | undefined>(undefined)
    const [sections, setSections] = useState<SubmissionDetailSections | undefined>(undefined)
    const [source, setSource] = useState<SubmissionSourceContent | null | undefined>(undefined)
    const [codeMetrics, setCodeMetrics] = useState<SubmissionCodeMetricsData | null | undefined>(undefined)
    const [navigation, setNavigation] = useState<SubmissionNavLinks | null | undefined>(undefined)

    const loadDetail = useCallback(async () => {
        const resolved = await fetchSupervisionSubmissionDetailCore(context, key, submission_id)
        if (!resolved) {
            return null
        }

        const { submission } = resolved.core
        if (submission.state !== 'done') {
            return {
                core: resolved.core,
                sections: EMPTY_SUBMISSION_SECTIONS,
                source: null as SubmissionSourceContent | null,
                codeMetrics: null as SubmissionCodeMetricsData | null,
            }
        }

        const [nextSections, nextSource, nextMetrics] = await Promise.all([
            fetchSupervisionSubmissionSections(context, submission, resolved.tables),
            fetchSupervisionSubmissionSource(context, submission, resolved.tables),
            fetchSupervisionSubmissionCodeMetricsForDetail(context, submission, resolved.core.verdict),
        ])

        return {
            core: resolved.core,
            sections: nextSections,
            source: nextSource,
            codeMetrics: nextMetrics,
        }
    }, [context, key, submission_id])

    useEffect(() => {
        let cancelled = false
        setCore(undefined)
        setSections(undefined)
        setSource(undefined)
        setCodeMetrics(undefined)

        void (async () => {
            const resolved = await fetchSupervisionSubmissionDetailCore(context, key, submission_id)
            if (cancelled) return
            if (!resolved) {
                setCore(null)
                return
            }

            setCore(resolved.core)

            const { submission } = resolved.core
            if (submission.state !== 'done') {
                setSections(EMPTY_SUBMISSION_SECTIONS)
                setSource(null)
                setCodeMetrics(null)
                return
            }

            void fetchSupervisionSubmissionSections(context, submission, resolved.tables).then((result) => {
                if (!cancelled) setSections(result)
            })
            void fetchSupervisionSubmissionSource(context, submission, resolved.tables).then((result) => {
                if (!cancelled) setSource(result)
            })
            void fetchSupervisionSubmissionCodeMetricsForDetail(context, submission, resolved.core.verdict).then(
                (result) => {
                    if (!cancelled) setCodeMetrics(result)
                },
            )
        })()

        return () => {
            cancelled = true
        }
    }, [context, key, submission_id])

    useEffect(() => {
        if (!shell.problem_nm) return

        let cancelled = false
        setNavigation(undefined)

        void fetchSupervisionSubmissionsForProblem(context, shell.problem_nm).then((submissions) => {
            if (!cancelled) {
                setNavigation(buildSupervisionSubmissionNavLinks(submissions, submission_id, context, key))
            }
        })

        return () => {
            cancelled = true
        }
    }, [context, key, shell.problem_nm, submission_id])

    if (shell.detail === null) {
        notFound()
    }

    if (core === null) {
        notFound()
    }

    const problemId = core?.submission.problem_id ?? key
    const submissionHref = supervisionSubmissionHref(context, problemId, submission_id)
    const codeHref = supervisionSubmissionCodeHref(context, problemId, submission_id)

    const breadcrumbs =
        shell.detail && shell.problem_nm
            ? supervisionProblemBreadcrumbs(
                  context,
                  key,
                  shell.detail.problem.problem_nm,
                  shell.detail.problem.title,
                  [
                      {
                          title: 'Submissions',
                          url: supervisionProblemSubmissionsHref(context, key),
                      },
                      { title: submission_id, url: submissionHref },
                  ],
                  meta?.courseTitle,
              )
            : [
                  ...supervisionBaseBreadcrumbs(context, meta?.courseTitle),
                  { title: 'Submissions', url: '#' },
                  { title: submission_id, url: '#' },
              ]

    const getTestcaseHref = (testcase: string) => {
        if (!isLinkableTestcase(testcase)) {
            return null
        }
        return supervisionSubmissionTestcaseHref(context, problemId, submission_id, testcase)
    }

    const submissionView = !core ? (
        <SubmissionDetailView loading submissionId={submission_id} />
    ) : (
        <>
            <SubmissionPendingRefresh
                isPending={core.verdict === 'Pending'}
                onRefresh={async () => {
                    const detail = await loadDetail()
                    if (!detail) return
                    setCore(detail.core)
                    setSections(detail.sections)
                    setSource(detail.source)
                    setCodeMetrics(detail.codeMetrics)
                }}
            />
            <SubmissionDetailView
                data={core}
                sections={sections}
                source={source}
                codeMetrics={codeMetrics}
                codeHref={codeHref}
                problemKey={key}
                navigation={navigation ?? null}
                getTestcaseHref={getTestcaseHref}
            />
        </>
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
                        <SupervisionProblemNav pageKey={key} context={context} />
                        {submissionView}
                    </div>
                </ProblemDetail>
            ) : (
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
                        {submissionView}
                    </div>
                </ProblemDetail>
            )}
        </SupervisionPageShell>
    )
}

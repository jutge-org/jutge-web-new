import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { buildSubmissionTestcaseHref } from '@/lib/submissions'
import type { SubmissionAnalysisRow } from '@/lib/data/submissions'

type SubmissionAnalysisCardProps = {
    analysis: SubmissionAnalysisRow[]
    problemKey: string
    submissionId: string
    getTestcaseHref?: (testcase: string) => string | null
}

export function SubmissionAnalysisCard({
    analysis,
    problemKey,
    submissionId,
    getTestcaseHref,
}: SubmissionAnalysisCardProps) {
    return (
        <Card className="gap-0 pt-2 pb-2 ring-0 border border-border shadow-sm">
            <CardHeader className="border-b border-border px-4 py-2">
                <CardTitle className="text-lg font-semibold">Analysis</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2">
                <table className="w-auto text-sm">
                    <thead>
                        <tr>
                            <th className="pl-4 pr-8 pb-0.5 text-left font-semibold">Test case</th>
                            <th className="pr-8 pb-0.5 text-left font-semibold">Execution</th>
                            <th className="pb-1 text-left font-semibold">Verdict</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analysis.map((row) => {
                            const href = getTestcaseHref
                                ? getTestcaseHref(row.testcase)
                                : buildSubmissionTestcaseHref(problemKey, submissionId, row.testcase)

                            return (
                                <tr key={row.testcase}>
                                    <td className="py-0.5 pl-4 pr-8">
                                        {href ? (
                                            <Link href={href} className="text-primary hover:underline">
                                                {row.testcase}
                                            </Link>
                                        ) : (
                                            row.testcase
                                        )}
                                    </td>
                                    <td className="py-0.5 pr-8">
                                        <span className="inline-flex items-center gap-2">
                                            <span aria-hidden>{row.execution === 'OK' ? '✅' : '❌'}</span>
                                            {row.execution}
                                        </span>
                                    </td>
                                    <td className="py-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="inline-flex items-center gap-2">
                                                    {row.verdictEmoji ? (
                                                        <span aria-hidden>{row.verdictEmoji}</span>
                                                    ) : null}
                                                    {row.verdict}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">{row.verdictFullName}</TooltipContent>
                                        </Tooltip>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    )
}

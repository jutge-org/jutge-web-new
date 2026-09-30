import { VerdictLink } from '@/components/documentation/ReferenceLink'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ScoringRow } from '@/lib/data/submissions'

type ScoringCardProps = {
    scoring: ScoringRow[]
}

export function ScoringCard({ scoring }: ScoringCardProps) {
    return (
        <Card className="gap-0 pt-2 pb-0 ring-0 border border-border shadow-sm">
            <CardHeader className="border-b border-border px-4 py-2">
                <CardTitle className="text-lg font-semibold">Scoring</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="px-4">Test case</TableHead>
                            <TableHead className="px-4">Verdict</TableHead>
                            <TableHead className="px-4">Verdict info</TableHead>
                            <TableHead className="px-4 text-right">Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scoring.map((row) => (
                            <TableRow key={row.testcase}>
                                <TableCell className="px-4">{row.testcase}</TableCell>
                                <TableCell className="px-4">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2">
                                                {row.verdictEmoji ? <span aria-hidden>{row.verdictEmoji}</span> : null}
                                                <VerdictLink verdictId={row.verdict} />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">{row.verdictFullName}</TooltipContent>
                                    </Tooltip>
                                </TableCell>
                                <TableCell className="px-4 text-muted-foreground">{row.verdict_info ?? ''}</TableCell>
                                <TableCell className="px-4 text-right tabular-nums">{row.points}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

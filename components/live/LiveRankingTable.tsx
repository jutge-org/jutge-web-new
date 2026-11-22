'use client'

import type { Ranking } from '@/lib/jutge_api_client'

export function LiveRankingTable({ ranking }: { ranking: Ranking }) {
    const problemNms = ranking[0]?.rankingResults.map((result) => result.problem_nm) ?? []
    if (ranking.length === 0) return <p>The ranking is empty.</p>
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <caption className="sr-only">Ranking</caption>
                <thead>
                    <tr className="border-b text-left">
                        <th className="py-2 pr-3 font-medium">Rank</th>
                        <th className="py-2 pr-3 font-medium">Name</th>
                        <th className="py-2 pr-3 font-medium">Score</th>
                        <th className="py-2 pr-3 font-medium">Time</th>
                        {problemNms.map((problemNm) => (
                            <th key={problemNm} className="py-2 pr-3 font-medium">
                                {problemNm}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {ranking.map((row, index) => (
                        <tr key={`${row.name}-${index}`} className="border-b">
                            <td className="py-2 pr-3">{row.position ?? '—'}</td>
                            <td className="py-2 pr-3">
                                {row.name}
                                {row.invited ? <span className="text-muted-foreground"> (invited)</span> : null}
                            </td>
                            <td className="py-2 pr-3">{row.score}</td>
                            <td className="py-2 pr-3">{row.time}</td>
                            {row.rankingResults.map((result) => (
                                <td key={result.problem_nm} className="py-2 pr-3">
                                    {result.verdict ?? '—'}
                                    <span className="text-muted-foreground">
                                        {' '}
                                        {result.submissions}/{result.time}
                                    </span>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

'use client'

import type { ColorMapping, InstructorExamProblem, Ranking, RankingResult } from '@/lib/jutge_api_client'
import Image from 'next/image'
import Link from 'next/link'

export type ExamRankingTableProps = {
    ranking: Ranking
    examProblems: InstructorExamProblem[]
    colors: ColorMapping
    /** Avatar pack id from the exam, if any. */
    avatarPack?: string | null
    blurNames?: boolean
}

export function ExamRankingTable({
    ranking,
    examProblems,
    colors,
    avatarPack = null,
    blurNames = false,
}: ExamRankingTableProps) {
    if (ranking.length === 0) return <p>The ranking is empty.</p>

    const showAvatars = Boolean(avatarPack)

    return (
        <div className="text-sm flex justify-center items-center overflow-x-auto">
            <table>
                <tbody>
                    {examProblems.length > 0 && examProblems[0].icon && (
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                            {showAvatars && <td></td>}
                            {examProblems.map((problem, index) => (
                                <td
                                    key={index}
                                    className="bg-muted border-2 border-background rounded-lg h-12 w-12"
                                >
                                    <div className="flex flex-col justify-center items-center">
                                        <Image
                                            src={`https://jutge.org/img/examicons/${problem.icon}.svg`}
                                            alt={problem.icon || 'icon'}
                                            width={32}
                                            height={32}
                                        />
                                    </div>
                                </td>
                            ))}
                            <td></td>
                        </tr>
                    )}
                    <tr>
                        <td></td>
                        <td></td>
                        {showAvatars && <td></td>}
                        <td className="bg-muted border-2 border-background rounded-lg h-12 px-4 text-center font-bold">
                            Score
                        </td>
                        {examProblems.map((problem, index) => (
                            <td
                                key={index}
                                className="bg-muted border-2 border-background rounded-lg w-40 h-12 px-4 text-center "
                            >
                                <Link
                                    href={`/problems/${problem.problem_nm}`}
                                    title={problem.problem_nm}
                                    className="font-bold text-primary"
                                >
                                    {problem.caption || `P${index + 1}`}
                                </Link>
                                {problem.weight !== null && (
                                    <>
                                        <br />
                                        {problem.weight}
                                    </>
                                )}
                            </td>
                        ))}
                        <td className="bg-muted border-2 border-background rounded-lg px-4 text-center font-bold">
                            Score
                        </td>
                    </tr>

                    {ranking.map((row, index) => (
                        <tr key={index}>
                            <td className="bg-muted border-2 border-background rounded-lg px-2 text-right">
                                {row.position}
                            </td>
                            <td
                                className={`bg-muted border-2 border-background rounded-lg px-2 truncate${blurNames ? ' blur-sm select-none' : ''}`}
                            >
                                {row.name}
                            </td>
                            {showAvatars && (
                                <td className="bg-muted border-2 border-background rounded-lg px-2 h-12 w-12">
                                    {row.avatar ? (
                                        <Image
                                            src={`https://jutge.org/avatars/${avatarPack}/${row.avatar}`}
                                            alt={row.avatar}
                                            width={32}
                                            height={32}
                                        />
                                    ) : null}
                                </td>
                            )}

                            <td className="bg-muted border-2 border-background rounded-lg px-4">
                                <div className="flex flex-col gap-0 items-center">
                                    <div className="font-bold">{row.score}</div>
                                    <div className="text-xs">{Math.floor(row.time)}</div>
                                </div>
                            </td>

                            {row.rankingResults.map((result, resultIndex) => (
                                <td
                                    key={resultIndex}
                                    className="bg-muted border-2 border-background rounded-lg w-40 px-2 text-center"
                                >
                                    <RankingScore result={result} colors={colors} />
                                </td>
                            ))}

                            <td className="bg-muted border-2 border-background rounded-lg px-4">
                                <div className="flex flex-col gap-0 items-center">
                                    <div className="font-bold">{row.score}</div>
                                    <div className="text-xs">{Math.floor(row.time)}</div>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function RankingScore({ result, colors }: { result: RankingResult; colors: ColorMapping }) {
    if (result.verdict === null) return null

    // API EE blue is too dark on muted dark backgrounds.
    const darkColorClass = result.verdict === 'EE' ? 'dark:!text-[#6ea8fe]' : undefined

    if (result.verdict === 'AC')
        return (
            <div style={{ color: colors.verdicts.AC }}>
                {Math.floor(result.time)}
                {result.wrongs !== 0 && <span className="text-xs">&nbsp;({result.wrongs})</span>}
            </div>
        )

    return (
        <div className={darkColorClass} style={{ color: colors.verdicts[result.verdict] }}>
            {Math.floor(result.time)}
            {result.wrongs !== 0 && <span className="text-xs">&nbsp;({result.wrongs})</span>}
            <br />
            <span>{result.verdict}</span>
        </div>
    )
}
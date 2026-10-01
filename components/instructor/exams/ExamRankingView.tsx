'use client'

import {
    fetchInstructorExam,
    fetchInstructorExamProblems,
    fetchInstructorExamRanking,
    fetchMiscHexColors,
} from '@/lib/instructor/client'
import { ExternalLink } from '@/components/ExternalLink'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type {
    ColorMapping,
    InstructorBriefExam,
    InstructorExamProblem,
    Ranking,
    RankingResult,
} from '@/lib/jutge_api_client'
import { PauseIcon, RabbitIcon, SnailIcon } from 'lucide-react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export function ExamRankingView() {
    const { exam_nm } = useParams<{ exam_nm: string }>()

    const [exam, setExam] = useState<InstructorBriefExam | null>(null)
    const [examProblems, setExamProblems] = useState<InstructorExamProblem[]>([])
    const [ranking, setRanking] = useState<Ranking | null>(null)
    const [colors, setColors] = useState<ColorMapping | null>(null)

    const [speed, setSpeed] = useState('0')
    const [counter, setCounter] = useState(0)

    const fetchData = useCallback(async () => {
        const exam = await fetchInstructorExam(exam_nm)
        const examProblems = await fetchInstructorExamProblems(exam_nm)
        const ranking = await fetchInstructorExamRanking(exam_nm)
        const colors = await fetchMiscHexColors()

        setExam(exam)
        setExamProblems(examProblems)
        setRanking(ranking)
        setColors(colors)
    }, [exam_nm])

    useEffect(() => {
        fetchData()
    }, [exam_nm, fetchData])

    useEffect(() => {
        async function updateQueue() {
            const ispeed = parseInt(speed)
            setCounter(counter + 1)
            if ((ranking !== null && ispeed == 0) || counter % ispeed != 0) return
            await fetchData()
        }

        const interval = setInterval(updateQueue, 1000)

        return () => {
            clearInterval(interval)
        }
    }, [counter, speed, ranking, fetchData])

    if (exam === null || examProblems === null || ranking === null || colors === null) return null

    return (
        <div className="flex flex-col gap-4">
            <div className="text-sm flex flex-row items-center gap-2">
                <div className="flex-grow" />
                <div className="text-sm">Refresh:</div>
                <Select onValueChange={setSpeed} defaultValue="0">
                    <SelectTrigger className="w-36" defaultValue="0">
                        <SelectValue placeholder="Speed" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">
                            <div className="flex flex-row gap-2 items-center">
                                <PauseIcon className="h-4 w-4" /> None
                            </div>
                        </SelectItem>
                        <SelectItem value="30">
                            <div className="flex flex-row gap-2 items-center">
                                <SnailIcon className="h-4 w-4" /> Slow (30s)
                            </div>
                        </SelectItem>
                        <SelectItem value="10">
                            <div className="flex flex-row gap-2 items-center">
                                <RabbitIcon className="h-4 w-4" /> Fast (10s)
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="text-sm flex justify-center items-center">
                <table>
                    <tbody>
                        {examProblems.length > 0 && examProblems[0].icon && (
                            <tr>
                                <td></td>
                                <td></td>
                                <td></td>
                                {exam.avatars && <td></td>}
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
                            {exam.avatars && <td></td>}
                            <td className="bg-muted border-2 border-background rounded-lg h-12 px-4 text-center font-bold">
                                Score
                            </td>
                            {examProblems.map((problem, index) => (
                                <td
                                    key={index}
                                    className="bg-muted border-2 border-background rounded-lg w-40 h-12 px-4 text-center "
                                >
                                    <ExternalLink
                                        href={`/problems/${problem.problem_nm}`}
                                        title={problem.problem_nm}
                                        className="font-bold text-primary"
                                    >
                                        {problem.caption || `P${index + 1}`}
                                    </ExternalLink>
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
                                <td className="bg-muted border-2 border-background rounded-lg px-2 truncate">
                                    {row.name}
                                </td>
                                {exam.avatars && (
                                    <td className="bg-muted border-2 border-background rounded-lg px-2 h-12 w-12">
                                        <Image
                                            src={`https://jutge.org/avatars/${exam.avatars}/${row.avatar}`}
                                            alt={row.avatar || 'Avatar'}
                                            width={32}
                                            height={32}
                                        />
                                    </td>
                                )}

                                <td className="bg-muted border-2 border-background rounded-lg px-4">
                                    <div className="flex flex-col gap-0 items-center">
                                        <div className="font-bold">{row.score}</div>
                                        <div className="text-xs">{Math.floor(row.time)}</div>
                                    </div>
                                </td>

                                {row.rankingResults.map((result, index) => (
                                    <td
                                        key={index}
                                        className="bg-muted border-2 border-background rounded-lg w-40 px-2 text-center"
                                    >
                                        <Score result={result} colors={colors} />
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
        </div>
    )
}

function Score({ result, colors }: { result: RankingResult; colors: ColorMapping }) {
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

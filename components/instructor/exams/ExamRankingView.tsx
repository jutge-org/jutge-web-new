'use client'

import { ExamRankingTable } from '@/components/exams/ExamRankingTable'
import {
    fetchInstructorExam,
    fetchInstructorExamProblems,
    fetchInstructorExamRanking,
    fetchMiscHexColors,
} from '@/lib/instructor/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { ColorMapping, InstructorBriefExam, InstructorExamProblem, Ranking } from '@/lib/jutge_api_client'
import { PauseIcon, RabbitIcon, SnailIcon } from 'lucide-react'
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
    const [blurNames, setBlurNames] = useState(false)

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
                <Switch
                    id="exam-ranking-blur-names"
                    checked={blurNames}
                    onCheckedChange={setBlurNames}
                    aria-label="Blur student names"
                />
                <label htmlFor="exam-ranking-blur-names" className="cursor-pointer select-none">
                    Blur names
                </label>
            </div>
            <ExamRankingTable
                ranking={ranking}
                examProblems={examProblems}
                colors={colors}
                avatarPack={exam.avatars}
                blurNames={blurNames}
            />
        </div>
    )
}
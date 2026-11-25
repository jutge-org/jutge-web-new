'use client'

import { fetchInstructorExamsArchived, fetchInstructorExamsIndex } from '@/lib/instructor/client'
import { AgTableFull } from '@/components/administrator/AgTable'
import AnimatedToggle, { XS_BLUE_CANDY_MORPH_TOGGLE } from '@/components/smoothui/animated-toggle'
import SmoothButton from '@/components/smoothui/smooth-button'
import { useIsMobile } from '@/hooks/use-mobile'
import type { InstructorBriefExam } from '@/lib/jutge_api_client'
import dayjs from 'dayjs'
import { SquarePlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function ExamsListView() {
    const isMobile = useIsMobile()
    const [exams, setExams] = useState<InstructorBriefExam[]>([])
    const [rows, setRows] = useState<InstructorBriefExam[]>([])
    const [archived, setArchived] = useState<string[]>([])
    const [showArchived, setShowArchived] = useState(false)

    const [colDefs, setColDefs] = useState([
        {
            field: 'exam_nm',
            headerName: 'Id',
            cellRenderer: (p: { data: InstructorBriefExam }) => (
                <Link href={`/instructor/exams/${p.data.exam_nm}/properties`}>{p.data.exam_nm}</Link>
            ),
            flex: 1,
            filter: true,
        },
        { field: 'title', flex: 2, filter: true },
        {
            field: 'course',
            flex: 1,
            filter: true,
            headerName: 'Course',
            valueGetter: (p: { data: InstructorBriefExam }) => p.data.course.title,
        },
        {
            field: 'created_at',
            headerName: 'Created',
            width: 140,
            filter: true,
            valueGetter: (p: { data: InstructorBriefExam }) => dayjs(p.data.created_at).format('YYYY-MM-DD'),
        },
        {
            field: 'updated_at',
            headerName: 'Updated',
            width: 140,
            filter: true,
            valueGetter: (p: { data: InstructorBriefExam }) => dayjs(p.data.updated_at).format('YYYY-MM-DD'),
            sort: 'desc',
        },
        {
            field: 'exp_time_start',
            width: 200,
            filter: true,
            headerName: 'Expected start',
            cellRenderer: (p: { data: InstructorBriefExam }) => dayjs(p.data.exp_time_start).format('YYYY-MM-DD HH:mm'),
        },
    ])

    useEffect(() => {
        if (isMobile) setColDefs((colDefs) => colDefs.filter((c) => c.field !== 'exp_time_start'))
    }, [isMobile])

    useEffect(() => {
        async function fetchExams() {
            const archived = await fetchInstructorExamsArchived()
            const dict = await fetchInstructorExamsIndex()
            const array = Object.values(dict).sort((a, b) => dayjs(b.exp_time_start).diff(dayjs(a.exp_time_start)))
            setRows(array.filter((exam) => !archived.includes(exam.exam_nm)))
            setExams(array)
            setArchived(archived)
        }

        fetchExams()
    }, [])

    function showArchivedChange(checked: boolean) {
        setShowArchived(checked)
        if (checked) {
            setRows(exams.filter((exam) => archived.includes(exam.exam_nm)))
        } else {
            setRows(exams.filter((exam) => !archived.includes(exam.exam_nm)))
        }
    }

    return (
        <>
            <div className="mb-4 flex flex-row gap-2">
                <AnimatedToggle
                    {...XS_BLUE_CANDY_MORPH_TOGGLE}
                    checked={showArchived}
                    label="Show archived exams"
                    onChange={showArchivedChange}
                />
                <div className="text-sm">Archived exams</div>
                <div className="flex-grow" />
                <SmoothButton asChild color="blue" variant="candy" size="xs">
                    <Link href="/instructor/exams/new">
                        <SquarePlusIcon /> New exam
                    </Link>
                </SmoothButton>
            </div>
            <AgTableFull rowData={rows} columnDefs={colDefs} />
        </>
    )
}

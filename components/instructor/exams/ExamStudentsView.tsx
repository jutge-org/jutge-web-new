'use client'

import { array2csv } from '@/actions/instructor/csv'
import { fetchInstructorExam, instructorExamUpdateStudents } from '@/lib/instructor/client'
import { AgTableFull } from '@/components/administrator/AgTable'
import SimpleSpinner from '@/components/administrator/SimpleSpinner'
import { useEmailsDialog } from '@/components/instructor/EmailsDialog'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Button } from '@/components/ui/button'
import { usePageChanges } from '@/hooks/use-page-changes'
import { showError } from '@/lib/instructor/utils'
import type { InstructorExam, InstructorExamStudent } from '@/lib/jutge_api_client'
import type { ICellRendererParams, RowSelectionOptions } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import FileSaver from 'file-saver'
import { CircleMinusIcon, ClipboardCopyIcon, DownloadCloudIcon, PlusCircleIcon, SaveIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

export function ExamStudentsView() {
    const [changes, setChanges] = usePageChanges()
    const { exam_nm } = useParams<{ exam_nm: string }>()

    const [exam, setExam] = useState<InstructorExam | null>(null)
    const [rows, setRows] = useState<InstructorExamStudent[]>([])

    const [colDefs] = useState([
        {
            field: 'email',
            flex: 4,
            filter: true,
            cellRenderer: (p: ICellRendererParams<InstructorExamStudent>) => {
                const parts = p.data!.email.split('@')
                return (
                    <div>
                        {parts[0]}
                        <span className="text-xs text-gray-500">@{parts[1]}</span>
                    </div>
                )
            },
        },
        { field: 'name', flex: 3, filter: true },
        {
            field: 'taken_exam',
            headerName: 'Taken',
            width: 90,
            cellRenderer: (p: { data: InstructorExamStudent }) => (p.data.taken_exam ? 'Yes' : 'No'),
        },
        {
            field: 'finished',
            width: 90,
            cellRenderer: (p: { data: InstructorExamStudent }) => (p.data.finished ? 'Yes' : 'No'),
        },
        {
            field: 'banned',
            width: 90,
            cellRenderer: (p: { data: InstructorExamStudent }) => (p.data.banned ? 'Yes' : 'No'),
        },
        {
            field: 'invited',
            width: 90,
            cellRenderer: (p: { data: InstructorExamStudent }) => (p.data.invited ? 'Yes' : 'No'),
            hide: true,
        },
    ])

    const gridRef = useRef<AgGridReact<InstructorExamStudent>>(null)

    const rowSelection = useMemo<RowSelectionOptions | 'single' | 'multiple'>(() => {
        return { mode: 'multiRow', headerCheckbox: true }
    }, [])

    const [runAddEmailsDialog, AddEmailsDialog] = useEmailsDialog({
        title: 'Add students',
        description: 'Add students to the exam by email.',
        buttonIcon: <PlusCircleIcon />,
        buttonLabel: 'Add students',
    })

    const [runRemoveEmailsDialog, RemoveEmailsDialog] = useEmailsDialog({
        title: 'Remove students',
        description: 'Remove students from the exam by email.',
        buttonIcon: <CircleMinusIcon />,
        buttonLabel: 'Remove students',
    })

    const fetchData = useCallback(async () => {
        const exam = await fetchInstructorExam(exam_nm)
        const rows = exam.students.sort((a, b) => a.email.localeCompare(b.email))
        setExam(exam)
        setRows(rows)
        gridRef.current!.api.setColumnsVisible(['invited'], exam.contest == 1)
        setChanges(false)
    }, [exam_nm, setChanges])

    useEffect(() => {
        fetchData()
    }, [exam_nm, fetchData])

    async function addHandle() {
        const result = await runAddEmailsDialog([])
        if (!result) return
        if (result.wrongEmails.length !== 0) {
            toast.warning(`${result.wrongEmails.length} invalid emails ignored.`)
        }
        if (result.validEmails.length === 0) {
            toast.warning('No emails to add.')
            return
        }

        const newRows: InstructorExamStudent[] = result.validEmails.map((email) => ({
            email,
            name: '',
            code: '',
            restricted: 0,
            annotation: null,
            result: null,
            finished: 0,
            banned: 0,
            reason_ban: null,
            inc: 0,
            reason_inc: null,
            taken_exam: 0,
            emergency_password: null,
            invited: 0,
        }))
        setRows([...rows, ...newRows])
        setChanges(true)
    }

    async function removeHandle() {
        const grid = gridRef.current!.api
        const selectedRows = grid.getSelectedNodes().map((node) => node.rowIndex) as number[]
        const selectedEmails = selectedRows.map((index) => rows[index].email)

        const result = await runRemoveEmailsDialog(selectedEmails)
        if (!result) return
        if (result.wrongEmails.length !== 0) {
            toast.warning(`${result.wrongEmails.length} invalid emails ignored.`)
        }
        if (result.validEmails.length === 0) {
            toast.warning('No emails to remove.')
            return
        }

        const emailsToRemove = result.validEmails
        setRows((rows) => rows.filter((row) => !emailsToRemove.includes(row.email)))
        setChanges(true)
    }

    async function saveHandle() {
        try {
            await instructorExamUpdateStudents({
                exam_nm,
                students: rows,
            })
            toast.success('Students of the exam saved.')
            setChanges(false)
            await fetchData()
        } catch (error) {
            showError(error)
        }
    }

    async function exportHandle() {
        const data = rows.map((row) => ({
            email: row.email,
            name: row.name,
            taken_exam: row.taken_exam ? 'Yes' : 'No',
            finished: row.finished ? 'Yes' : 'No',
            banned: row.banned ? 'Yes' : 'No',
            invited: row.invited ? 'Yes' : 'No',
        }))
        const csv = await array2csv(data)
        if (!csv) {
            toast.error('Error preparing CSV data')
            return
        }
        const blob = new Blob([csv], { type: 'text/csv' })
        FileSaver.saveAs(blob, 'students.csv')
    }

    async function copyEmailsHandle() {
        const emails = rows
            .map((row) => row.email)
            .sort()
            .join('\n')
        if (!emails) {
            toast.error('No emails to copy')
            return
        }
        try {
            await navigator.clipboard.writeText(emails)
            toast.success('Emails copied to clipboard')
        } catch (error) {
            toast.error('Error copying emails to clipboard')
            console.error('Error copying emails to clipboard:', error)
        }
    }

    if (!exam) return <SimpleSpinner />

    return (
        <>
            <div className="mb-4 flex flex-row-reverse gap-2 items-center">
                <SmoothButton color="blue" variant="candy" size="xs" className="w-36 justify-start" onClick={saveHandle} title="Save changes">
                    <SaveIcon className={changes ? 'animate-pulse' : ''} />
                    Save
                </SmoothButton>
                <SmoothButton color="blue" variant="candy" size="xs" className="w-36 justify-start" onClick={removeHandle} title="Remove students">
                    <CircleMinusIcon /> Remove
                </SmoothButton>
                <SmoothButton color="blue" variant="candy" size="xs" className="w-36 justify-start" onClick={addHandle} title="Add students">
                    <PlusCircleIcon /> Add
                </SmoothButton>
                <div className="flex-grow" />
                <div className="text-xs text-gray-500">{rows.length} students</div>
                <div className="flex-grow" />
                <Button
                    className="w-36 justify-start"
                    onClick={copyEmailsHandle}
                    title="Copy emails to clipboard"
                    variant={'outline'}
                >
                    <ClipboardCopyIcon /> Copy emails
                </Button>
                <Button className="w-36 justify-start" onClick={exportHandle} title="Export to CSV" variant={'outline'}>
                    <DownloadCloudIcon /> Export to CSV
                </Button>
            </div>
            <AgTableFull
                rowData={rows}
                columnDefs={colDefs}
                rowDragManaged={true}
                rowDragMultiRow={true}
                rowSelection={rowSelection}
                ref={gridRef}
                rowHeight={32}
            />
            <AddEmailsDialog />
            <RemoveEmailsDialog />
        </>
    )
}

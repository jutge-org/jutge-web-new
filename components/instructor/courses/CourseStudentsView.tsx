'use client'

import { array2csv, csv2array, xls2array } from '@/actions/instructor/csv'
import {
    fetchInstructorCourse,
    fetchInstructorCourseStudentProfiles,
    instructorCourseSendInviteToStudents,
    instructorCourseUpdate,
} from '@/lib/instructor/client'
import { AgTableFull } from '@/components/administrator/AgTable'
import { useConfirmDialog } from '@/components/administrator/ConfirmDialog'
import SimpleSpinner from '@/components/administrator/SimpleSpinner'
import { useEmailsDialog } from '@/components/instructor/EmailsDialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { usePageChanges } from '@/hooks/use-page-changes'
import { emailRenderer } from '@/lib/administrator/grid-renderers'
import { offerDownloadFile, showError, type Dict } from '@/lib/instructor/utils'
import type { CourseMembers, InstructorCourse, StudentProfile } from '@/lib/jutge_api_client'
import type { RowSelectionOptions } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import {
    CircleMinusIcon,
    ClipboardCopyIcon,
    DownloadCloudIcon,
    PlusCircleIcon,
    SaveIcon,
    SendHorizonalIcon,
    UploadCloudIcon,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { sleep } from 'radash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

type Row = { email: string; name: string; state: string }

export function CourseStudentsView() {
    const { course_nm } = useParams<{ course_nm: string }>()
    const [course, setCourse] = useState<InstructorCourse | null>(null)
    const [profiles, setProfiles] = useState<Dict<StudentProfile> | null>(null)

    useEffect(() => {
        async function fetchData() {
            const course = await fetchInstructorCourse(course_nm)
            const profiles = await fetchInstructorCourseStudentProfiles(course_nm)
            setCourse(course)
            setProfiles(profiles)
        }

        fetchData()
    }, [course_nm])

    if (course === null || profiles === null) return <SimpleSpinner />

    return <CourseStudentsForm course={course} profiles={profiles} />
}

type CourseStudentProps = {
    course: InstructorCourse
    profiles: Dict<StudentProfile>
}

function CourseStudentsForm(props: CourseStudentProps) {
    const [changes, setChanges] = usePageChanges()

    const [runConfirmDialog, ConfirmDialogComponent] = useConfirmDialog({
        title: 'Invite',
        acceptLabel: 'Yes, send',
        acceptIcon: <SendHorizonalIcon />,
        cancelLabel: 'No',
    })

    const { course_nm } = useParams<{ course_nm: string }>()
    const [rows, setRows] = useState<Row[]>(getRows())

    const [runAddEmailsDialog, AddEmailsDialog] = useEmailsDialog({
        title: 'Add students',
        description: 'Add students to the course by email.',
        buttonIcon: <PlusCircleIcon />,
        buttonLabel: 'Add students',
    })

    const [runRemoveEmailsDialog, RemoveEmailsDialog] = useEmailsDialog({
        title: 'Remove students',
        description: 'Remove students from the course by email.',
        buttonIcon: <CircleMinusIcon />,
        buttonLabel: 'Remove students',
    })

    const [colDefs] = useState([
        { field: 'email', flex: 1, filter: true, cellRenderer: emailRenderer('email') },
        { field: 'name', flex: 1, filter: true },
        { field: 'state', width: 120, filter: true },
    ])

    const gridRef = useRef<AgGridReact<CourseMembers>>(null)

    const onGridReady = useCallback(() => {}, [])

    const rowSelection = useMemo<RowSelectionOptions | 'single' | 'multiple'>(() => {
        return { mode: 'multiRow', headerCheckbox: true }
    }, [])

    function getRows(): Row[] {
        const rows = []
        for (const email of props.course.students.invited) {
            if (props.profiles[email]) {
                rows.push({
                    email: email,
                    name: props.profiles[email].name || '',
                    state: 'enrolled',
                })
            } else {
                rows.push({
                    email: email,
                    name: '',
                    state: 'invited',
                })
            }
        }
        rows.sort((a, b) => a.email.localeCompare(b.email))
        return rows
    }

    async function add(emails: string[] = []) {
        const result = await runAddEmailsDialog(emails)
        if (!result) return
        if (result.wrongEmails.length !== 0) {
            toast.warning(`There are ${result.wrongEmails.length} invalid emails.`)
        }
        if (result.validEmails.length === 0) {
            toast.warning('No emails to add.')
            return
        }

        const newRows: Row[] = []
        for (const email of result.validEmails) {
            if (props.course.students.invited.includes(email)) continue
            if (props.course.students.enrolled.includes(email)) continue
            newRows.push({ email, name: '', state: 'invited' })
        }
        setRows((oldRows) => [...oldRows, ...newRows])
        setChanges(true)
        toast.success(`Added ${newRows.length} students. Remember to click the Save button to commit the changes!`)
    }

    async function remove() {
        const grid = gridRef.current!.api
        const selectedRows = grid.getSelectedNodes().map((node) => node.rowIndex) as number[]
        const selectedEmails = selectedRows.map((index) => rows[index].email)

        const result = await runRemoveEmailsDialog(selectedEmails)
        if (!result) return
        if (result.wrongEmails.length !== 0) {
            toast.warning(`There are ${result.wrongEmails.length} invalid emails.`)
        }
        if (result.validEmails.length === 0) {
            toast.warning('No emails to remove.')
            return
        }

        setRows((oldRows) => {
            const originalLength = oldRows.length
            const newRows = oldRows.filter((row) => !result.validEmails.includes(row.email))
            toast.success(
                `Removed ${originalLength - newRows.length} students. Remember to click the Save button to commit the changes!`,
            )
            return newRows
        })
        setChanges(true)
    }

    async function save() {
        const course = await fetchInstructorCourse(course_nm)
        course.students.invited = rows.map((row) => row.email)
        try {
            await instructorCourseUpdate(course)
            toast.success(`Students saved.`)
            setChanges(false)
        } catch (error) {
            showError(error)
        }
    }

    async function invite() {
        if (
            !(await runConfirmDialog(
                'Are you sure you want to send an invitation to the pending students? (Please do not abuse this feature.)',
            ))
        ) {
            return
        }

        try {
            await instructorCourseSendInviteToStudents(course_nm)
            toast.success(`An email has been sent to the pending students.`)
        } catch (error) {
            showError(error)
        }
    }

    async function importFromRaco() {
        await importFromCSV('Email')
    }

    async function importFromAtenea() {
        await importFromCSV('Adreça electrònica')
    }

    async function importFromPrisma() {
        await sleep(0)
        const fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.accept = '.xls,.xlsx'
        fileInput.onchange = (event: Event) => {
            const file = (event.target as HTMLInputElement).files![0]
            const reader = new FileReader()

            reader.onload = async (e) => {
                const contents = e.target!.result
                const data = await xls2array(contents as ArrayBuffer)
                const emails = data
                    .map((row) => row['Email'] || row['Adreça electrònica'] || row['Dirección electrónica'])
                    .sort() as string[]
                await add(emails)
            }

            reader.readAsArrayBuffer(file)
        }
        fileInput.click()
    }

    async function importFromCSV(emailField: string) {
        await sleep(0)
        const fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.accept = '.csv'
        fileInput.onchange = (event: Event) => {
            const file = (event.target as HTMLInputElement).files![0]
            const reader = new FileReader()

            reader.onload = async (e) => {
                const contents = e.target!.result
                const data = await csv2array(contents as string)
                const emails = data.map((row) => row[emailField]).sort()
                await add(emails)
            }

            reader.readAsText(file)
        }
        fileInput.click()
    }

    async function exportCsv() {
        const data = rows.map((row) => ({
            email: row.email,
            name: row.name,
            state: row.state,
        }))
        const csv = await array2csv(data)
        if (!csv) {
            toast.error('Error preparing CSV data')
            return
        }
        offerDownloadFile({
            data: new Uint8Array(new TextEncoder().encode(csv)),
            type: 'text/csv',
            name: 'students.csv',
        })
    }

    async function copyEmails() {
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

    return (
        <>
            <div className="mb-4 flex flex-row-reverse gap-2 items-center">
                <Button className="w-28 justify-start" onClick={save} title="Save changes">
                    <SaveIcon className={changes ? 'animate-pulse' : ''} /> Save
                </Button>
                <Button className="w-28 justify-start" onClick={invite} title="Send invite to pending students">
                    <SendHorizonalIcon /> Invite
                </Button>
                <Button className="w-28 justify-start" onClick={remove} title="Remove students">
                    <CircleMinusIcon /> Remove
                </Button>
                <Button className="w-28 justify-start" onClick={() => add()} title="Add students">
                    <PlusCircleIcon /> Add
                </Button>
                <div className="flex-grow" />
                <div className="text-xs text-gray-500">{rows.length} students</div>
                <div className="flex-grow" />

                <Button
                    className="w-32 justify-start"
                    onClick={copyEmails}
                    title="Copy emails to clipboard"
                    variant={'outline'}
                >
                    <ClipboardCopyIcon /> Copy emails
                </Button>

                <Button className="w-32 justify-start" onClick={exportCsv} title="Export to CSV" variant={'outline'}>
                    <DownloadCloudIcon /> Export
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="w-32 justify-start" variant={'outline'} title="Import from CSV">
                            <UploadCloudIcon />
                            Import
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={importFromRaco}>Import CSV from Racó</DropdownMenuItem>
                        <DropdownMenuItem onClick={importFromAtenea}>Import CSV from Atenea</DropdownMenuItem>
                        <DropdownMenuItem onClick={importFromPrisma}>Import XLS from Prisma</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AgTableFull
                rowData={rows}
                columnDefs={colDefs}
                rowDragManaged={true}
                rowDragMultiRow={true}
                rowSelection={rowSelection}
                ref={gridRef}
                rowHeight={32}
                onGridReady={onGridReady}
            />

            <AddEmailsDialog />
            <RemoveEmailsDialog />
            <ConfirmDialogComponent />
        </>
    )
}

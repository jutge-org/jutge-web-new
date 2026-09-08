'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ClipboardCopyIcon } from 'lucide-react'
import { toast } from 'sonner'

import { AgTableFull } from '@/components/administrator/AgTable'
import { PageSpinner } from '@/components/ClientGates'
import { Button } from '@/components/ui/button'
import { emailRenderer } from '@/lib/administrator/grid-renderers'
import {
    fetchCourseManageStudents,
    type CourseStudentRow,
} from '@/lib/data/courseStudents'
import { supervisionHref } from '@/lib/supervision'

type CourseStudentsViewProps = {
    courseKey: string
    courseNm: string
    isOwner: boolean
}

export function CourseStudentsView({ courseKey, courseNm, isOwner }: CourseStudentsViewProps) {
    const [rows, setRows] = useState<CourseStudentRow[] | null>(null)

    useEffect(() => {
        let cancelled = false
        setRows(null)

        void (async () => {
            try {
                const studentRows = await fetchCourseManageStudents({ courseKey, courseNm, isOwner })
                if (!cancelled) {
                    setRows(studentRows)
                }
            } catch {
                if (!cancelled) {
                    toast.error('Could not load students.')
                    setRows([])
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [courseKey, courseNm, isOwner])

    const colDefs = useMemo(() => buildColumnDefs(courseKey), [courseKey])

    if (rows === null) {
        return <PageSpinner />
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

    const countLabel = rows.length === 1 ? 'student' : 'students'

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Button
                    className="w-32 justify-start"
                    onClick={copyEmails}
                    title="Copy emails to clipboard"
                    variant="outline"
                >
                    <ClipboardCopyIcon /> Copy emails
                </Button>
                <div className="flex-grow" />
                <div className="text-xs text-muted-foreground">
                    {rows.length} {countLabel}
                </div>
            </div>

            <AgTableFull rowData={rows} columnDefs={colDefs} />
        </div>
    )
}

function buildColumnDefs(courseKey: string) {
    return [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            filter: true,
            cellRenderer: (params: { data: CourseStudentRow }) => {
                const name = params.data.name || '—'
                if (params.data.state !== 'enrolled') {
                    return <span className="text-sm">{name}</span>
                }
                return (
                    <Link
                        href={supervisionHref(courseKey, params.data.email)}
                        className="text-sm hover:text-primary hover:underline"
                    >
                        {name}
                    </Link>
                )
            },
        },
        {
            field: 'email',
            headerName: 'Email',
            flex: 1,
            filter: true,
            cellRenderer: emailRenderer('email'),
        },
        {
            field: 'state',
            headerName: 'State',
            width: 120,
            filter: true,
        },
    ]
}

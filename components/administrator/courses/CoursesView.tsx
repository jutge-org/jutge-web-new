'use client'

import { adminSetCoursePublicAndOfficial, fetchAdminCourses } from '@/lib/administrator/client'
import { AgTableFull } from '@/components/administrator/AgTable'
import { CourseIconImage } from '@/components/courses/CourseIconImage'
import { Switch } from '@/components/ui/switch'
import { useIsMobile } from '@/hooks/use-mobile'
import { courseIconUrl } from '@/lib/courses'
import type { AdminCourse } from '@/lib/jutge_api_client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

type CourseFlag = 'public' | 'official'

type CourseFlagSwitchProps = {
    course: AdminCourse
    field: CourseFlag
    onUpdated: (courseId: string, field: CourseFlag, value: number) => void
}

function CourseFlagSwitch({ course, field, onUpdated }: CourseFlagSwitchProps) {
    const checked = course[field] !== 0
    const [pending, setPending] = useState(false)

    async function handleChange(next: boolean) {
        const value = next ? 1 : 0
        const previous = course[field]
        if (value === previous) return

        onUpdated(course.course_id, field, value)
        setPending(true)
        try {
            await adminSetCoursePublicAndOfficial({
                course_id: course.course_id,
                public: field === 'public' ? value : course.public,
                official: field === 'official' ? value : course.official,
            })
        } catch (e) {
            onUpdated(course.course_id, field, previous)
            toast.error(e instanceof Error ? e.message : 'Failed to update course')
        } finally {
            setPending(false)
        }
    }

    return (
        <Switch
            checked={checked}
            disabled={pending}
            onCheckedChange={(next) => void handleChange(next)}
            aria-label={`${field} for ${course.title}`}
        />
    )
}

function instructorLabel(course: AdminCourse) {
    return course.instructor.name || course.instructor.username || course.instructor.email
}

export default function CoursesView() {
    const isMobile = useIsMobile()
    const [rows, setRows] = useState<AdminCourse[]>([])

    const updateCourseFlag = useCallback((courseId: string, field: CourseFlag, value: number) => {
        setRows((current) => current.map((row) => (row.course_id === courseId ? { ...row, [field]: value } : row)))
    }, [])

    const renderFlagSwitch = useCallback(
        (field: CourseFlag) =>
            function FlagSwitchCell(params: { data: AdminCourse }) {
                return <CourseFlagSwitch course={params.data} field={field} onUpdated={updateCourseFlag} />
            },
        [updateCourseFlag],
    )

    const colDefs = useMemo(() => {
        const columns = [
            {
                field: 'icon',
                headerName: '',
                width: 56,
                minWidth: 56,
                maxWidth: 56,
                sortable: false,
                filter: false,
                resizable: false,
                suppressHeaderMenuButton: true,
                cellStyle: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingLeft: 8,
                    paddingRight: 8,
                },
                cellRenderer: (params: { data: AdminCourse }) => (
                    <div className="flex h-full w-full items-center justify-center">
                        <CourseIconImage iconUrl={courseIconUrl(params.data.icon)} size="2sm" className="block" />
                    </div>
                ),
            },
            { field: 'title', headerName: 'Name', flex: 2, filter: true, sort: 'asc' },
            ...(isMobile
                ? []
                : [
                      {
                          field: 'instructor',
                          flex: 1,
                          filter: true,
                          valueGetter: (params: { data: AdminCourse }) => instructorLabel(params.data),
                      },
                      {
                          field: 'email',
                          flex: 1,
                          filter: true,
                          valueGetter: (params: { data: AdminCourse }) => params.data.instructor.email,
                          cellRenderer: (params: { data: AdminCourse }) => {
                              const email = params.data.instructor.email
                              const parts = email.split('@')
                              return (
                                  <div>
                                      {parts[0]}
                                      <span className="text-xs text-muted-foreground">@{parts[1]}</span>
                                  </div>
                              )
                          },
                      },
                  ]),
            {
                field: 'public',
                width: 100,
                filter: true,
                sortable: true,
                cellDataType: 'boolean',
                valueGetter: (params: { data: AdminCourse }) => params.data.public !== 0,
                cellRenderer: renderFlagSwitch('public'),
            },
            {
                field: 'official',
                width: 100,
                filter: true,
                sortable: true,
                cellDataType: 'boolean',
                valueGetter: (params: { data: AdminCourse }) => params.data.official !== 0,
                cellRenderer: renderFlagSwitch('official'),
            },
        ]
        return columns
    }, [isMobile, renderFlagSwitch])

    useEffect(() => {
        void fetchAdminCourses().then(setRows)
    }, [])

    return <AgTableFull rowData={rows} columnDefs={colDefs} />
}

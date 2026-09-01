'use client'

import { fetchSupervisionCourseStudents } from '@/lib/data/supervisionActions'
import { CommandSearchInput } from '@/components/CommandSearchInput'
import { CourseIconImage } from '@/components/courses/CourseIconImage'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSupervisionCoursePreference } from '@/hooks/use-supervision-course-preference'
import { useSupervisionStudentPreference } from '@/hooks/use-supervision-student-preference'
import { supervisionHref, type SupervisionCourseOption } from '@/lib/supervision'
import { includesForSearch } from '@/lib/utils'
import { ChevronsUpDownIcon, EyeIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type SupervisionFormProps = {
    userId: string
    courses: SupervisionCourseOption[] | null
}

type StudentOption = {
    email: string
    name: string
}

function formatStudentLabel(student: StudentOption): string {
    return student.name ? `${student.name} (${student.email})` : student.email
}

function CourseCombobox({
    courses,
    value,
    onValueChange,
    disabled,
    placeholder,
}: {
    courses: SupervisionCourseOption[]
    value: string
    onValueChange: (courseKey: string) => void
    disabled?: boolean
    placeholder: string
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')

    const selectedCourse = courses.find((course) => course.courseKey === value)
    const filteredCourses = useMemo(() => {
        if (!search.trim()) {
            return courses
        }

        return courses.filter(
            (course) => includesForSearch(course.title, search) || includesForSearch(course.courseKey, search),
        )
    }, [courses, search])
    const activeCourses = filteredCourses.filter((course) => !course.archived)
    const archivedCourses = filteredCourses.filter((course) => course.archived)

    function renderCourseItem(course: SupervisionCourseOption) {
        return (
            <CommandItem
                key={course.courseKey}
                value={course.courseKey}
                onSelect={() => {
                    onValueChange(course.courseKey)
                    setOpen(false)
                    setSearch('')
                }}
            >
                <CourseIconImage iconUrl={course.iconUrl} size="xs" className="rounded" />
                <span className="truncate">{course.title}</span>
            </CommandItem>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Select course"
                    disabled={disabled}
                    className="w-full justify-between font-normal"
                >
                    <span className="flex min-w-0 items-center gap-2">
                        {selectedCourse ? (
                            <CourseIconImage iconUrl={selectedCourse.iconUrl} size="xs" className="rounded" />
                        ) : null}
                        <span className="truncate">{selectedCourse?.title ?? placeholder}</span>
                    </span>
                    <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" aria-hidden />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandSearchInput placeholder="Search courses…" value={search} onValueChange={setSearch} />
                    <CommandList>
                        <CommandEmpty>No matching courses found.</CommandEmpty>
                        {activeCourses.length > 0 ? (
                            <CommandGroup>{activeCourses.map(renderCourseItem)}</CommandGroup>
                        ) : null}
                        {activeCourses.length > 0 && archivedCourses.length > 0 ? <CommandSeparator /> : null}
                        {archivedCourses.length > 0 ? (
                            <CommandGroup heading="Archived courses">
                                {archivedCourses.map(renderCourseItem)}
                            </CommandGroup>
                        ) : null}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function StudentCombobox({
    students,
    value,
    onValueChange,
    disabled,
    placeholder,
}: {
    students: StudentOption[]
    value: string
    onValueChange: (email: string) => void
    disabled: boolean
    placeholder: string
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')

    const selectedStudent = students.find((student) => student.email === value)
    const filteredStudents = useMemo(() => {
        if (!search.trim()) {
            return students
        }

        return students.filter(
            (student) =>
                includesForSearch(student.name, search) ||
                includesForSearch(student.email, search) ||
                includesForSearch(formatStudentLabel(student), search),
        )
    }, [students, search])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Select student"
                    disabled={disabled}
                    className="w-full justify-between font-normal"
                >
                    <span className="truncate">
                        {selectedStudent ? formatStudentLabel(selectedStudent) : placeholder}
                    </span>
                    <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" aria-hidden />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandSearchInput placeholder="Search students…" value={search} onValueChange={setSearch} />
                    <CommandList>
                        <CommandEmpty>No matching students found.</CommandEmpty>
                        <CommandGroup>
                            {filteredStudents.map((student) => (
                                <CommandItem
                                    key={student.email}
                                    value={student.email}
                                    onSelect={() => {
                                        onValueChange(student.email)
                                        setOpen(false)
                                        setSearch('')
                                    }}
                                >
                                    <span className="truncate">{formatStudentLabel(student)}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export function SupervisionForm({ userId, courses }: SupervisionFormProps) {
    const loadingCourses = courses === null
    const courseOptions = courses ?? []
    const [courseKey, setCourseKey] = useSupervisionCoursePreference(userId, courseOptions)
    const [students, setStudents] = useState<StudentOption[]>([])
    const [studentEmail, setStudentEmail] = useSupervisionStudentPreference(userId, courseKey, students)
    const [loadingStudents, setLoadingStudents] = useState(false)

    useEffect(() => {
        if (!courseKey) {
            setStudents([])
            return
        }

        let cancelled = false
        setStudents([])
        setLoadingStudents(true)

        void fetchSupervisionCourseStudents(courseKey)
            .then((nextStudents) => {
                if (!cancelled) {
                    setStudents(nextStudents)
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingStudents(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [courseKey])

    const coursePlaceholder = loadingCourses ? 'Loading courses…' : 'Select a course…'

    const studentPlaceholder = loadingCourses
        ? 'Loading courses…'
        : !courseKey
          ? 'Select a course first'
          : loadingStudents
            ? 'Loading students…'
            : students.length === 0
              ? 'No students in this course'
              : 'Select a student…'

    const superviseHref = courseKey && studentEmail ? supervisionHref(courseKey, studentEmail) : null

    return (
        <Card>
            <CardContent className="pt-6">
                <form
                    className="flex flex-col gap-4"
                    onSubmit={(event) => {
                        event.preventDefault()
                    }}
                >
                    <ProfileFormRow label="Course">
                        <CourseCombobox
                            courses={courseOptions}
                            value={courseKey}
                            onValueChange={setCourseKey}
                            disabled={loadingCourses}
                            placeholder={coursePlaceholder}
                        />
                    </ProfileFormRow>
                    <ProfileFormRow label="Student">
                        <StudentCombobox
                            students={students}
                            value={studentEmail}
                            onValueChange={setStudentEmail}
                            disabled={loadingCourses || !courseKey || loadingStudents || students.length === 0}
                            placeholder={studentPlaceholder}
                        />
                    </ProfileFormRow>
                    {superviseHref ? (
                        <Button asChild className="w-full">
                            <Link href={superviseHref}>
                                <EyeIcon aria-hidden />
                                Supervise
                            </Link>
                        </Button>
                    ) : (
                        <Button type="button" disabled className="w-full">
                            <EyeIcon aria-hidden />
                            Supervise
                        </Button>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}

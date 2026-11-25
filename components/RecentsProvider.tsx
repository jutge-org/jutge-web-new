'use client'

import { useAuth } from '@/components/AuthProvider'
import {
    fetchCommandPaletteCourses,
    fetchCommandPaletteExams,
    fetchCommandPaletteProblems,
} from '@/lib/data/commandPalette'
import { examCourseKey } from '@/lib/exams'
import {
    addRecentList,
    enrichRecentCourses,
    enrichRecentProblems,
    emptyRecents,
    observeRecentPageMetadata,
    removeExamCourses,
    syncRecentsFromPage,
    type RecentListItem,
    type RecentsData,
} from '@/lib/recents'
import { useOpenWebRecents, useOpenWebSettingsReady, useOpenWebSettingsStore } from '@/store/openWebSettings'
import { usePublicPathname } from '@/hooks/usePublicPathname'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

const EMPTY_COURSE_KEYS: ReadonlySet<string> = new Set()

type RecentsContextValue = {
    recents: RecentsData
    /** Lists have no route of their own, so pages record them explicitly. */
    recordList: (item: RecentListItem) => void
    clearCourses: () => void
    clearProblems: () => void
    clearSubmissions: () => void
    clearAll: () => void
}

const RecentsContext = createContext<RecentsContextValue | null>(null)

type RecentsProviderProps = {
    children: ReactNode
}

export function RecentsProvider({ children }: RecentsProviderProps) {
    const { user } = useAuth()
    const authenticated = user !== null
    const pathname = usePublicPathname()
    const ready = useOpenWebSettingsReady()
    const recents = useOpenWebRecents()
    const setRecents = useOpenWebSettingsStore((state) => state.setRecents)
    const clearRecentCourses = useOpenWebSettingsStore((state) => state.clearRecentCourses)
    const clearRecentProblems = useOpenWebSettingsStore((state) => state.clearRecentProblems)
    const clearRecentSubmissions = useOpenWebSettingsStore((state) => state.clearRecentSubmissions)
    const clearAllRecents = useOpenWebSettingsStore((state) => state.clearAllRecents)

    // Course keys of the user's exams. Exam courses must never appear under "Recent courses".
    const [examCourseKeys, setExamCourseKeys] = useState<ReadonlySet<string>>(EMPTY_COURSE_KEYS)
    // Read inside the page-sync effect without re-registering the observer when the keys load.
    const examCourseKeysRef = useRef<ReadonlySet<string>>(EMPTY_COURSE_KEYS)
    examCourseKeysRef.current = examCourseKeys

    useEffect(() => {
        if (!authenticated || !ready) {
            return
        }

        let cancelled = false
        void fetchCommandPaletteExams()
            .then((exams) => {
                if (cancelled) {
                    return
                }

                setExamCourseKeys(new Set(exams.map((exam) => examCourseKey(exam))))
            })
            .catch(() => {
                // Exams are best-effort here; leave recent courses untouched on failure.
            })

        return () => {
            cancelled = true
        }
    }, [authenticated, ready])

    // Prune exam courses that were recorded before the exam keys were known, and persist the change.
    useEffect(() => {
        if (!authenticated || !ready || examCourseKeys.size === 0) {
            return
        }

        setRecents((current) => removeExamCourses(current, examCourseKeys))
    }, [authenticated, ready, examCourseKeys, setRecents])

    useEffect(() => {
        if (!authenticated || !ready) {
            return
        }

        function syncFromPage(record: boolean) {
            setRecents((current) => {
                const next = syncRecentsFromPage(pathname, current, {
                    record,
                    excludeCourseKeys: examCourseKeysRef.current,
                })
                return next === current ? current : next
            })
        }

        syncFromPage(true)

        return observeRecentPageMetadata(() => {
            syncFromPage(false)
        })
    }, [authenticated, pathname, ready, setRecents])

    useEffect(() => {
        if (!authenticated || !ready) {
            return
        }

        // Unresolved when the title is still the course key, or icon/author/description are missing.
        if (
            !recents.courses.some(
                (course) =>
                    !course.iconUrl ||
                    course.title === course.courseKey ||
                    course.ownerName === undefined ||
                    course.description === undefined,
            )
        ) {
            return
        }

        let cancelled = false

        void fetchCommandPaletteCourses().then((allCourses) => {
            if (cancelled) {
                return
            }

            const metaByKey = new Map(
                allCourses.map((course) => [
                    course.course_key,
                    {
                        title: course.title,
                        iconUrl: course.iconUrl,
                        ownerName: course.ownerName,
                        description: course.description,
                    },
                ]),
            )
            setRecents((current) => enrichRecentCourses(current, metaByKey))
        })

        return () => {
            cancelled = true
        }
    }, [authenticated, ready, recents.courses, setRecents])

    useEffect(() => {
        if (!authenticated || !ready) {
            return
        }

        // The title is unresolved when it still equals the problem name.
        if (!recents.problems.some((problem) => !problem.iconUrl || problem.title === problem.problemNm)) {
            return
        }

        let cancelled = false

        void fetchCommandPaletteProblems().then((allProblems) => {
            if (cancelled) {
                return
            }

            const metaByNm = new Map(
                allProblems.map(
                    (problem) =>
                        [problem.problem_nm, { title: problem.title, iconUrl: problem.iconUrl ?? undefined }] as const,
                ),
            )
            setRecents((current) => enrichRecentProblems(current, metaByNm))
        })

        return () => {
            cancelled = true
        }
    }, [authenticated, ready, recents.problems, setRecents])

    const visibleRecents = authenticated ? recents : emptyRecents()

    const recordList = useCallback(
        (item: RecentListItem) => {
            if (!authenticated || !ready) {
                return
            }

            setRecents((current) => addRecentList(current, item))
        },
        [authenticated, ready, setRecents],
    )

    return (
        <RecentsContext.Provider
            value={{
                recents: visibleRecents,
                recordList,
                clearCourses: clearRecentCourses,
                clearProblems: clearRecentProblems,
                clearSubmissions: clearRecentSubmissions,
                clearAll: clearAllRecents,
            }}
        >
            {children}
        </RecentsContext.Provider>
    )
}

export function useRecents() {
    const context = useContext(RecentsContext)
    if (!context) {
        throw new Error('useRecents must be used within a RecentsProvider')
    }

    return context
}

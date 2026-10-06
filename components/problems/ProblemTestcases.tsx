'use client'

import { useState } from 'react'

import { ProblemTestcaseAccordionItem } from '@/components/problems/ProblemTestcaseAccordionItem'
import { ProblemWidgetCard } from '@/components/problems/ProblemWidgetCard'
import { Card, CardDescription, CardHeader } from '@/components/ui/card'
import {
    INSTRUCTOR_TESTCASES_NOT_SHARED_MESSAGE,
    type InstructorProblemResourceAccess,
} from '@/lib/data/instructorSharedResources'

type ProblemTestcasesProps =
    | {
          loading: true
          problemId?: never
          driverId?: never
          testcaseAccess?: never
          shared_testcases?: never
          testcaseNames?: never
          notShared?: never
      }
    | {
          loading?: false
          notShared: true
          problemId?: never
          driverId?: never
          testcaseAccess?: never
          shared_testcases?: never
          testcaseNames?: never
      }
    | {
          loading?: false
          notShared?: false
          problemId: string
          driverId: string | null | undefined
          testcaseAccess: InstructorProblemResourceAccess
          shared_testcases: number
          testcaseNames: string[]
      }

export function ProblemTestcases(props: ProblemTestcasesProps) {
    const [openItems, setOpenItems] = useState<string[]>([])

    if (props.loading) {
        return <ProblemWidgetCard title="Test cases" />
    }

    if (props.notShared) {
        return (
            <Card className="ring-0 border border-border shadow-sm">
                <CardHeader>
                    <CardDescription>{INSTRUCTOR_TESTCASES_NOT_SHARED_MESSAGE}</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const { problemId, driverId, testcaseAccess, shared_testcases, testcaseNames } = props

    function toggleTestcase(name: string) {
        setOpenItems((current) =>
            current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
        )
    }

    if (testcaseNames.length === 0) {
        return (
            <Card className="ring-0 border border-border shadow-sm">
                <CardHeader>
                    <CardDescription>This problem has no test cases.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <Card className="ring-0 border border-border shadow-sm">
                <CardHeader>
                    <CardDescription className="text-center">
                        Test cases include private cases used for judging. Please do not distribute them.
                    </CardDescription>
                </CardHeader>
            </Card>
            {testcaseNames.map((testcaseName) => (
                <ProblemTestcaseAccordionItem
                    key={testcaseName}
                    problemId={problemId}
                    testcaseName={testcaseName}
                    driverId={driverId}
                    testcaseAccess={testcaseAccess}
                    shared_testcases={shared_testcases}
                    isOpen={openItems.includes(testcaseName)}
                    onToggle={() => toggleTestcase(testcaseName)}
                />
            ))}
        </div>
    )
}

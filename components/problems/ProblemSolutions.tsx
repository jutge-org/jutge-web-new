'use client'

import { useState } from 'react'

import { ProblemSolutionAccordionItem } from '@/components/problems/ProblemSolutionAccordionItem'
import { ProblemWidgetCard } from '@/components/problems/ProblemWidgetCard'
import { Card, CardDescription, CardHeader } from '@/components/ui/card'
import {
    INSTRUCTOR_SOLUTIONS_NOT_SHARED_MESSAGE,
    type InstructorProblemResourceAccess,
} from '@/lib/data/instructorSharedResources'

type ProblemSolutionsProps =
    | {
          loading: true
          pageKey?: string
          problemId?: string
          problem_nm?: string
          proglangs?: never
          notShared?: never
      }
    | {
          loading?: false
          notShared: true
          pageKey?: never
          problemId?: never
          problem_nm?: never
          proglangs?: never
      }
    | {
          loading?: false
          notShared?: false
          pageKey: string
          problemId: string
          problem_nm: string
          proglangs: string[]
          solutionAccess: InstructorProblemResourceAccess
          shared_solutions: number
          solutionViewHrefForProglang?: (proglang: string) => string
      }

export function ProblemSolutions(props: ProblemSolutionsProps) {
    const [openItems, setOpenItems] = useState<string[]>([])

    if (props.loading) {
        return <ProblemWidgetCard title="Solutions" />
    }

    if (props.notShared) {
        return (
            <Card className="ring-0 border border-border shadow-sm">
                <CardHeader>
                    <CardDescription>{INSTRUCTOR_SOLUTIONS_NOT_SHARED_MESSAGE}</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const { pageKey, problemId, problem_nm, proglangs, solutionAccess, shared_solutions, solutionViewHrefForProglang } =
        props

    function toggleProglang(proglang: string) {
        setOpenItems((current) =>
            current.includes(proglang) ? current.filter((item) => item !== proglang) : [...current, proglang],
        )
    }

    if (proglangs.length === 0) {
        return (
            <Card className="ring-0 border border-border shadow-sm">
                <CardHeader>
                    <CardDescription>This problem has no official solutions.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <Card className="ring-0 border border-border shadow-sm">
                <CardHeader>
                    <CardDescription className="text-center">
                        Solutions might not have been written for students. Please do not distribute solutions.
                    </CardDescription>
                </CardHeader>
            </Card>
            {proglangs.map((proglang) => (
                <ProblemSolutionAccordionItem
                    key={proglang}
                    pageKey={pageKey}
                    problemId={problemId}
                    problem_nm={problem_nm}
                    proglang={proglang}
                    solutionAccess={solutionAccess}
                    shared_solutions={shared_solutions}
                    isOpen={openItems.includes(proglang)}
                    onToggle={() => toggleProglang(proglang)}
                    solutionViewHrefOverride={solutionViewHrefForProglang?.(proglang)}
                />
            ))}
        </div>
    )
}

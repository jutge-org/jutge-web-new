'use client'

import { fetchAbstractProblem, fetchInstructorProblemDownload } from '@/lib/instructor/client'
import SimpleSpinner from '@/components/administrator/SimpleSpinner'
import { JForm, type JFormFields } from '@/components/instructor/JForm'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { problemIconUrl } from '@/lib/problems'
import { mapmap, offerDownloadFile } from '@/lib/instructor/utils'
import type { AbstractProblem } from '@/lib/jutge_api_client'
import dayjs from 'dayjs'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import { BotIcon, BugIcon, CloudDownloadIcon, EyeIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'

dayjs.extend(LocalizedFormat)

export function ProblemPropertiesView() {
    const { problem_nm } = useParams<{ problem_nm: string }>()
    const [abstractProblem, setAbstractProblem] = useState<AbstractProblem | null>(null)

    useEffect(() => {
        async function fetchProblem() {
            const abstractProblem = await fetchAbstractProblem(problem_nm)
            setAbstractProblem(abstractProblem)
        }
        fetchProblem()
    }, [problem_nm])

    if (abstractProblem === null) return <SimpleSpinner size={64} className="pt-24" />

    const created_at = dayjs(abstractProblem.created_at).format('YYYY-MM-DD HH:mm:ss')
    const updated_at = dayjs(abstractProblem.updated_at).format('YYYY-MM-DD HH:mm:ss')

    async function downloadAction() {
        const download = await fetchInstructorProblemDownload(problem_nm)
        offerDownloadFile(download, download.name)
    }

    const iconUrl = problemIconUrl(abstractProblem.icon)

    const fields: JFormFields = {
        problem_nm: {
            type: 'input',
            label: 'Id',
            value: abstractProblem.problem_nm,
        },
        created_at: {
            type: 'datetime',
            label: 'Created at',
            value: created_at,
            disabled: true,
        },
        updated_at: {
            type: 'datetime',
            label: 'Updated at',
            value: updated_at,
            disabled: true,
        },
        translations: {
            type: 'free',
            label: 'Translations',
            content: (
                <div className="rounded-lg border text-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell className="font-bold">Problem</TableCell>
                                <TableCell className="font-bold">Title</TableCell>
                                <TableCell className="font-bold">Alerts</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mapmap(abstractProblem.problems, (problem_id, problem) => (
                                <TableRow key={problem_id}>
                                    <TableCell>
                                        <Link href={`/instructor/problems/${problem_nm}/${problem_id}`}>
                                            {problem_id}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{problem.title}</TableCell>
                                    <TableCell>
                                        {problem.checked === 0 ? (
                                            <span title="Check failed">
                                                <BugIcon size={14} className="animate-pulse text-red-800" />
                                            </span>
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ),
        },
        author: {
            type: 'input',
            label: 'Author',
            value: abstractProblem.author || '',
        },
        email: {
            type: 'input',
            label: 'Author email',
            value: abstractProblem.author_email || '',
        },
        driver: {
            type: 'free',
            label: 'Driver',
            content: (
                <Badge className="mt-1 px-2 py-1" variant="secondary">
                    {abstractProblem.driver_id}
                </Badge>
            ),
        },
        deprecation: {
            type: 'input',
            label: 'Deprecation reason',
            value: abstractProblem.deprecation || '',
        },
        solution_tags: {
            type: 'input',
            label: (
                <div
                    className="flex flex-row items-center justify-end gap-2"
                    title={`Solution tags by ${abstractProblem.solution_tags?.model}.`}
                >
                    Solution tags <BotIcon size={16} className="-mt-1" />
                </div>
            ),
            value: abstractProblem.solution_tags?.tags.replaceAll(',', ', ') || '—',
        },
        view: {
            type: 'free',
            label: 'View problem',
            content: (
                <Button asChild variant="outline" className="mt-0 h-16 w-16" title="Open the problem page in a new tab">
                    <Link href={`/problems/${problem_nm}`} target="_blank" rel="noopener noreferrer">
                        <EyeIcon className="size-12" strokeWidth={0.8} />
                    </Link>
                </Button>
            ),
        },
        download: {
            type: 'free',
            label: 'Download problem',
            content: (
                <Button
                    variant="outline"
                    className="mt-0 h-16 w-16"
                    onClick={downloadAction}
                    title="Download problem archive as a ZIP file"
                >
                    <CloudDownloadIcon className="size-12" strokeWidth={0.8} />
                </Button>
            ),
        },
        icon: {
            type: 'free',
            label: 'Icon',
            content: iconUrl ? (
                <ProblemIconImage iconUrl={iconUrl} size="lg" />
            ) : (
                <span className="text-sm text-muted-foreground">—</span>
            ),
        },
    }

    if (!abstractProblem.deprecation) delete fields.deprecation
    if (!abstractProblem.author) delete fields.author
    if (!abstractProblem.author_email) delete fields.email

    return (
        <div className="flex flex-col gap-4">
            <JForm fields={fields} />
        </div>
    )
}

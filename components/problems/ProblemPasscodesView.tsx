'use client'

import type { ColDef, GetRowIdParams, ICellRendererParams, ValueGetterParams } from 'ag-grid-community'
import { CirclePlusIcon, EyeIcon, EyeOffIcon, PlusIcon, SearchIcon, TrashIcon } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { AgTableFull } from '@/components/administrator/AgTable'
import { useConfirmDialog } from '@/components/administrator/ConfirmDialog'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { ProblemPasscodesHelpDialog } from '@/components/problems/ProblemPasscodesHelpDialog'
import { SearchInput } from '@/components/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { addStudentPasscodeAction, removeStudentPasscodeAction } from '@/lib/data/passcodesActions'
import { fetchStudentPasscodes, type StudentPasscode } from '@/lib/data/passcodes'
import { includesForSearch } from '@/lib/utils'

const HIDDEN_PASSCODE = '••••••••'

type PasscodeRow = StudentPasscode & {
    revealed: boolean
}

export function ProblemPasscodesView() {
    const [passcodes, setPasscodes] = useState<StudentPasscode[] | null>(null)
    const [loadError, setLoadError] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set())
    const [addOpen, setAddOpen] = useState(false)
    const [runConfirmDialog, ConfirmDialog] = useConfirmDialog({
        title: 'Remove passcode',
        acceptLabel: 'Remove',
        acceptIcon: <TrashIcon />,
    })

    const reload = useCallback(async () => {
        try {
            const rows = await fetchStudentPasscodes()
            setPasscodes(rows)
            setLoadError(false)
        } catch {
            setPasscodes([])
            setLoadError(true)
        }
    }, [])

    useEffect(() => {
        void reload()
    }, [reload])

    const toggleRevealed = useCallback((problemNm: string) => {
        setRevealed((current) => {
            const next = new Set(current)
            if (next.has(problemNm)) next.delete(problemNm)
            else next.add(problemNm)
            return next
        })
    }, [])

    const toggleRef = useRef(toggleRevealed)
    toggleRef.current = toggleRevealed

    const removePasscode = useCallback(
        async (problemNm: string) => {
            const confirmed = await runConfirmDialog(`Remove the stored passcode for ${problemNm}?`)
            if (!confirmed) return

            const result = await removeStudentPasscodeAction(problemNm)
            if (!result.ok) {
                toast.error(result.error)
                return
            }

            setRevealed((current) => {
                if (!current.has(problemNm)) return current
                const next = new Set(current)
                next.delete(problemNm)
                return next
            })
            toast.success(`Passcode for ${problemNm} removed.`)
            await reload()
        },
        [reload, runConfirmDialog],
    )

    const removeRef = useRef(removePasscode)
    removeRef.current = removePasscode

    const rows = useMemo<PasscodeRow[]>(
        () => (passcodes ?? []).map((row) => ({ ...row, revealed: revealed.has(row.problem_nm) })),
        [passcodes, revealed],
    )

    const visibleRows = useMemo(() => {
        const query = searchQuery.trim()
        if (!query) return rows
        return rows.filter((row) => includesForSearch(`${row.problem_nm} ${row.title} ${row.author ?? ''}`, query))
    }, [rows, searchQuery])

    const colDefs = useMemo<ColDef<PasscodeRow>[]>(
        () => [
            {
                field: 'problem_nm',
                headerName: 'Problem',
                width: 160,
                sort: 'asc',
                sortable: true,
                filter: true,
                cellStyle: { display: 'flex', alignItems: 'center' },
                cellRenderer: (params: ICellRendererParams<PasscodeRow>) => (
                    <Link href={`/problems/${params.data!.problem_nm}`} className="tabular-nums text-sm">
                        <span className="flex flex-row items-center gap-3">
                            {params.data!.iconUrl ? (
                                <ProblemIconImage iconUrl={params.data!.iconUrl} size="xs" className="translate-y-px" />
                            ) : null}
                            {params.data!.problem_nm}
                        </span>
                    </Link>
                ),
            },
            {
                field: 'title',
                headerName: 'Title',
                flex: 2,
                minWidth: 180,
                sortable: true,
                filter: true,
            },
            {
                field: 'author',
                headerName: 'Author',
                width: 170,
                sortable: true,
                filter: true,
                valueGetter: (params: ValueGetterParams<PasscodeRow>) => params.data?.author ?? '',
                cellRenderer: (params: ICellRendererParams<PasscodeRow>) => params.data?.author ?? '—',
            },
            {
                colId: 'passcode',
                headerName: 'Passcode',
                flex: 1,
                minWidth: 220,
                sortable: false,
                filter: false,
                valueGetter: (params: ValueGetterParams<PasscodeRow>) => (params.data?.revealed ? 'shown' : 'hidden'),
                cellStyle: { display: 'flex', alignItems: 'center' },
                cellRenderer: (params: ICellRendererParams<PasscodeRow>) => {
                    const problemNm = params.data!.problem_nm
                    const visible = params.data!.revealed
                    return (
                        <div className="flex h-full items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-pressed={visible}
                                        aria-label={
                                            visible
                                                ? `Hide passcode for ${problemNm}`
                                                : `Show passcode for ${problemNm}`
                                        }
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            toggleRef.current(problemNm)
                                        }}
                                    >
                                        {visible ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{visible ? 'Hide passcode' : 'Show passcode'}</TooltipContent>
                            </Tooltip>
                            {visible ? (
                                <span>{params.data!.passcode}</span>
                            ) : (
                                <span className="tracking-widest text-muted-foreground select-none" aria-hidden>
                                    {HIDDEN_PASSCODE}
                                </span>
                            )}
                        </div>
                    )
                },
            },
            {
                colId: 'actions',
                headerName: 'Actions',
                width: 110,
                sortable: false,
                filter: false,
                cellStyle: { display: 'flex', alignItems: 'center' },
                cellRenderer: (params: ICellRendererParams<PasscodeRow>) => {
                    const problemNm = params.data!.problem_nm
                    return (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Remove passcode for ${problemNm}`}
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        void removeRef.current(problemNm)
                                    }}
                                >
                                    <TrashIcon aria-hidden className='mt-4' />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove passcode for {problemNm}</TooltipContent>
                        </Tooltip>
                    )
                },
            },
        ],
        [],
    )

    async function handleAdded(problemNm: string) {
        setRevealed((current) => {
            if (!current.has(problemNm)) return current
            const next = new Set(current)
            next.delete(problemNm)
            return next
        })
        setAddOpen(false)
        toast.success(`Passcode for ${problemNm} stored.`)
        await reload()
    }

    const loading = passcodes === null
    const trimmedSearchQuery = searchQuery.trim()

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-4">
                <div className="flex flex-row items-center justify-end gap-2">
                    {!loading && !loadError ? (
                        <Badge variant="outline" className="tabular-nums">
                            {visibleRows.length === rows.length
                                ? visibleRows.length
                                : `${visibleRows.length}/${rows.length}`}
                        </Badge>
                    ) : null}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-64 shrink-0">
                                <SearchInput
                                    showSearchIcon
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search…"
                                    aria-label="Search passcodes"
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">Simple search</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Add passcode"
                                onClick={() => setAddOpen(true)}
                            >
                                <PlusIcon aria-hidden />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Add passcode</TooltipContent>
                    </Tooltip>
                    <ProblemPasscodesHelpDialog />
                </div>
                {loading ? (
                    <div
                        aria-busy="true"
                        aria-label="Loading passcodes"
                        className="flex min-h-64 items-center justify-center border border-dashed border-border bg-muted/20"
                    >
                        <Spinner className="size-8 text-muted-foreground" />
                    </div>
                ) : loadError ? (
                    <p className="text-muted-foreground">Could not load passcodes. Please try again later.</p>
                ) : visibleRows.length === 0 && trimmedSearchQuery.length > 0 ? (
                    <Empty className="border border-dashed border-border bg-muted/20 py-12">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <SearchIcon aria-hidden />
                            </EmptyMedia>
                            <EmptyTitle>No matching passcodes</EmptyTitle>
                            <EmptyDescription>Try a different search term or clear the search box.</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <AgTableFull
                        rowData={visibleRows}
                        columnDefs={colDefs}
                        getRowId={(params: GetRowIdParams<PasscodeRow>) => params.data.problem_nm}
                        overlayNoRowsTemplate="No stored passcodes"
                    />
                )}
            </div>
            <AddPasscodeDialog open={addOpen} onOpenChange={setAddOpen} onAdded={handleAdded} />
            <ConfirmDialog />
        </TooltipProvider>
    )
}

function AddPasscodeDialog({
    open,
    onOpenChange,
    onAdded,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAdded: (problemNm: string) => Promise<void>
}) {
    const [problemNm, setProblemNm] = useState('')
    const [passcode, setPasscode] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [adding, setAdding] = useState(false)

    function reset() {
        setProblemNm('')
        setPasscode('')
        setErrorMessage(null)
        setAdding(false)
    }

    const trimmedProblem = problemNm.trim()
    const trimmedPasscode = passcode.trim()
    const canAdd = trimmedProblem.length > 0 && trimmedPasscode.length > 0 && !adding

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        if (!canAdd) return

        setErrorMessage(null)
        setAdding(true)
        const result = await addStudentPasscodeAction({
            problem_nm: trimmedProblem,
            passcode: trimmedPasscode,
        })
        if (!result.ok) {
            setAdding(false)
            setErrorMessage(result.error)
            return
        }

        reset()
        await onAdded(trimmedProblem)
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) reset()
                onOpenChange(next)
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add passcode</DialogTitle>
                    <DialogDescription>
                        Store a problem passcode for your account. The problem must exist and the passcode must match.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="flex flex-col gap-4"
                    autoComplete="off"
                    data-form-type="other"
                    onSubmit={(event) => void handleSubmit(event)}
                >
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="problem-passcode-problem">Problem</Label>
                        <Input
                            id="problem-passcode-problem"
                            name="problem_nm"
                            type="text"
                            value={problemNm}
                            onChange={(event) => setProblemNm(event.target.value)}
                            placeholder="P12345"
                            autoComplete="off"
                            spellCheck={false}
                            autoFocus
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="problem-passcode-value">Passcode</Label>
                        <Input
                            id="problem-passcode-value"
                            name="problem_passcode"
                            type="text"
                            value={passcode}
                            onChange={(event) => setPasscode(event.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>
                    {errorMessage ? (
                        <p className="text-sm text-destructive" role="alert">
                            {errorMessage}
                        </p>
                    ) : null}
                    <Button type="submit" disabled={!canAdd}>
                        {adding ? <Spinner /> : <CirclePlusIcon aria-hidden />}
                        Add passcode
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

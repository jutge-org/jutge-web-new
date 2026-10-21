'use client'

import { makeExamPdf } from '@/actions/instructor/makeExamPdf'
import {
    fetchAbstractProblems,
    fetchAllAbstractProblems,
    fetchInstructorExam,
    fetchMiscExamIcons,
    instructorExamUpdateProblems,
} from '@/lib/instructor/client'
import { AgTableFull } from '@/components/administrator/AgTable'
import SimpleSpinner from '@/components/administrator/SimpleSpinner'
import { useTextareaDialog } from '@/components/instructor/TextareaDialog'
import { Button } from '@/components/ui/button'
import { CommandSearchInput } from '@/components/CommandSearchInput'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePageChanges } from '@/hooks/use-page-changes'
import { getProblemTitle } from '@/lib/instructor/problems'
import { showError } from '@/lib/instructor/utils'
import type { AbstractProblem, InstructorExam, InstructorExamProblem, Profile } from '@/lib/jutge_api_client'
import { cn, includesForSearch } from '@/lib/utils'
import type { RowSelectionOptions } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { saveAs } from 'file-saver'
import {
    Check,
    CircleMinusIcon,
    ClipboardCopyIcon,
    ClipboardPasteIcon,
    CloudDownloadIcon,
    EditIcon,
    FileTextIcon,
    PaintbrushIcon,
    PlusCircleIcon,
    SaveIcon,
    XCircleIcon,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { capitalize } from 'radash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ProblemNmLink, iconUrlFromAbstractProblems } from '@/components/instructor/ProblemNmLink'
import Link from 'next/link'

type ExamProblemsViewProps = {
    profile: Profile
}

export function ExamProblemsView({ profile }: ExamProblemsViewProps) {
    const [changes, setChanges] = usePageChanges()
    const { exam_nm } = useParams<{ exam_nm: string }>()

    const [exam, setExam] = useState<InstructorExam | null>(null)
    const [allAbstractProblems, setAllAbstractProblems] = useState<Record<string, AbstractProblem> | null>(null)
    const [usedAbstractProblems, setUsedAbstractProblems] = useState<Record<string, AbstractProblem> | null>(null)
    const [rows, setRows] = useState<InstructorExamProblem[]>([])
    const [colDefs, setColDefs] = useState<unknown[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dialogKey, setDialogKey] = useState<number | null>(null)
    const [problemToEdit, setProblemToEdit] = useState<InstructorExamProblem | null>(null)

    const [runTextareaDialog, TextareaDialogComponent] = useTextareaDialog({
        title: 'Get PDF of exam',
        description: 'Extra text to include at end of cover page:',
        buttonIcon: <CloudDownloadIcon />,
        buttonLabel: 'Get PDF',
    })

    const gridRef = useRef<AgGridReact<InstructorExamProblem>>(null)

    const rowSelection = useMemo<RowSelectionOptions | 'single' | 'multiple'>(() => {
        return { mode: 'multiRow', headerCheckbox: true }
    }, [])

    const fetchData = useCallback(async () => {
        const exam = await fetchInstructorExam(exam_nm)
        const problem_nms = exam.problems.map((p) => p.problem_nm).join(',')
        const usedAbstractProblems = await fetchAbstractProblems(problem_nms)

        const defs = [
            {
                field: 'problem_nm',
                headerName: 'Problem',
                width: 125,
                sortable: false,
                rowDrag: true,
                cellRenderer: (p: { data: InstructorExamProblem }) => {
                    const abstractProblems =
                        allAbstractProblems !== null ? allAbstractProblems : usedAbstractProblems!
                    return (
                        <ProblemNmLink
                            problem_nm={p.data.problem_nm}
                            iconUrl={iconUrlFromAbstractProblems(p.data.problem_nm, abstractProblems)}
                        />
                    )
                },
                valueGetter: (p: { data: InstructorExamProblem }) => p.data.problem_nm,
            },
            {
                field: 'title',
                flex: 1,
                sortable: false,
                cellRenderer: (p: { data: InstructorExamProblem }) =>
                    getProblemTitle(
                        profile,
                        p.data.problem_nm,
                        allAbstractProblems !== null ? allAbstractProblems : usedAbstractProblems!,
                    ),
            },
            { field: 'caption', width: 100, sortable: false },
            { field: 'weight', width: 100, sortable: false, editable: false },
            {
                field: 'icon',
                width: 70,
                sortable: false,
                cellRenderer: (p: { data: InstructorExamProblem }) =>
                    p.data.icon ? (
                        <Image
                            src={`https://jutge.org/img/examicons/${p.data.icon}.svg`}
                            alt={p.data.icon}
                            width={20}
                            height={20}
                            className="pt-2"
                        />
                    ) : null,
            },
        ]

        setExam(exam)
        setUsedAbstractProblems(usedAbstractProblems)
        setRows(exam.problems)
        setColDefs(defs)
        setChanges(false)
    }, [exam_nm, profile, allAbstractProblems, setChanges])

    const fetchProblems = useCallback(async () => {
        const allAbstractProblems = await fetchAllAbstractProblems()
        setAllAbstractProblems(allAbstractProblems)
    }, [])

    useEffect(() => {
        fetchProblems()
    }, [exam_nm, fetchProblems])

    useEffect(() => {
        fetchData()
    }, [exam_nm, fetchData])

    function addCallback(problem: InstructorExamProblem) {
        setRows((oldRows) => [...oldRows, problem])
        setChanges(true)
    }

    function editCallback(problem: InstructorExamProblem) {
        const index = rows.findIndex((p) => p.problem_nm === problem.problem_nm)
        if (index === -1) return
        const newRows = [...rows]
        newRows[index] = problem
        setRows(newRows)
        setChanges(true)
    }

    function add() {
        setIsDialogOpen(true)
        setDialogKey(Math.random())
        setProblemToEdit(null)
        setChanges(true)
    }

    function remove() {
        const grid = gridRef.current!.api
        const selectedRows = grid.getSelectedNodes().map((node) => node.rowIndex) as number[]
        if (selectedRows.length === 0) {
            toast.info('Select problems to remove.')
            return
        }
        const newRows = rows.filter((_, index) => !selectedRows.includes(index))
        setRows(newRows)
        setChanges(true)
    }

    function edit() {
        const grid = gridRef.current!.api
        const selectedRows = grid.getSelectedNodes().map((node) => node.rowIndex) as number[]
        if (selectedRows.length !== 1) {
            toast.info('Select exactly one problem to edit.')
            return
        }
        const problem = selectedRows.map((index) => rows[index])[0]
        setProblemToEdit(problem)
        setIsDialogOpen(true)
        setDialogKey(Math.random())
        setChanges(true)
    }

    async function save() {
        const problems: InstructorExamProblem[] = []
        gridRef.current!.api.forEachNode((rowNode) => {
            if (rowNode.data) problems.push(rowNode.data)
        })
        try {
            await instructorExamUpdateProblems({ exam_nm, problems })
            toast.success(`Problems of the exam saved.`)
            setChanges(false)
            await fetchData()
        } catch (error) {
            showError(error)
        }
    }

    function decorate() {
        const newRows = rows.map((row, index) => ({
            ...row,
            caption: row.caption || `P${index + 1}`,
            icon: row.icon || `numbers/${index + 1}`,
            weight: row.weight || 1,
        }))
        setRows(newRows)
        setChanges(true)
    }

    async function print() {
        const extra = await runTextareaDialog(`© ${profile.name}\n\n`)
        if (extra === null) return
        toast.info('Generating PDF...')
        const token = localStorage.getItem('token')
        if (!token) {
            toast.error('Sign in required to generate exam PDF.')
            return
        }
        const doc = await makeExamPdf({ exam_nm, extra, token })
        saveAs(doc, `${exam_nm}-${nanoid()}.pdf`)
    }

    async function copyProblemsHandle() {
        if (rows.length === 0) {
            toast.error('No problems to copy')
            return
        }
        const data = {
            type: 'exam_problems_clipboard',
            problems: rows,
        }
        try {
            const text = JSON.stringify(data, null, 2)
            await navigator.clipboard.writeText(text)
            toast.success('Problems copied to clipboard')
        } catch (error) {
            toast.error('Error copying problems to clipboard')
            console.error('Error copying problems to clipboard:', error)
        }
    }

    async function pasteProblemsHandle() {
        try {
            const text = await navigator.clipboard.readText()
            const data = JSON.parse(text)
            if (data.type !== 'exam_problems_clipboard' || !Array.isArray(data.problems)) {
                throw new Error('Invalid data')
            }
            const problems: InstructorExamProblem[] = data.problems
            setRows([...rows, ...problems])
            setChanges(true)
            toast.success('Problems pasted from clipboard')
        } catch {
            toast.error('Clipboard does not contain valid exam problems data')
        }
    }

    if (exam === null || usedAbstractProblems === null) return <SimpleSpinner />

    return (
        <>
            <div className="mb-4 flex flex-row gap-2">
                <Button
                    className="w-40 justify-start"
                    onClick={print}
                    title="Get a PDF with a simple cover page and all problem statements"
                    variant={'outline'}
                >
                    <FileTextIcon /> Get PDF
                </Button>
                <Button
                    className="w-40 justify-start"
                    onClick={copyProblemsHandle}
                    title="Copy problems to clipboard"
                    variant={'outline'}
                >
                    <ClipboardCopyIcon /> Copy problems
                </Button>
                <Button
                    className="w-40 justify-start"
                    onClick={pasteProblemsHandle}
                    title="Paste problems from clipboard"
                    variant={'outline'}
                >
                    <ClipboardPasteIcon /> Paste problems
                </Button>
                <div className="grow" />
                <Button className="w-28 justify-start" onClick={add} title="Add a problem">
                    <PlusCircleIcon /> Add
                </Button>
                <Button className="w-28 justify-start" onClick={edit} title="Edit selected problem">
                    <EditIcon /> Edit
                </Button>
                <Button className="w-28 justify-start" onClick={remove} title="Remove all selected problems">
                    <CircleMinusIcon /> Remove
                </Button>
                <Button
                    className="w-28 justify-start"
                    onClick={decorate}
                    title="Add captions, wieghts and icons to all problems"
                >
                    <PaintbrushIcon /> Decorate
                </Button>
                <Button className="w-28 justify-start" onClick={save} title="Save problems of the exam">
                    <SaveIcon className={changes ? 'animate-pulse' : ''} />
                    Save
                </Button>
            </div>
            <AgTableFull
                rowData={rows}
                columnDefs={colDefs}
                rowDragManaged={true}
                rowDragMultiRow={true}
                ref={gridRef}
                rowSelection={rowSelection}
            />
            <ProblemDialog
                key={dialogKey}
                setKey={setDialogKey}
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                profile={profile}
                onAddAccept={addCallback}
                onEditAccept={editCallback}
                allAbstractProblems={allAbstractProblems}
                problem={problemToEdit}
            />
            <TextareaDialogComponent />
        </>
    )
}

type ProblemDialogProps = {
    setKey: (key: number | null) => void
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
    problem: InstructorExamProblem | null
    profile: Profile
    allAbstractProblems: Record<string, AbstractProblem> | null
    onAddAccept: (problem: InstructorExamProblem) => void
    onEditAccept: (problem: InstructorExamProblem) => void
}

function ProblemDialog(props: ProblemDialogProps) {
    const [problem_nm, setProblemNm] = useState<string | null>(props.problem === null ? null : props.problem.problem_nm)
    const [caption, setCaption] = useState<string | null>(props.problem === null ? null : props.problem.caption)
    const [weight, setWeight] = useState<number | null>(props.problem === null ? null : props.problem.weight)
    const [weightString, setWeightString] = useState<string>(
        props.problem === null || props.problem.weight === null ? '' : props.problem.weight.toString(),
    )
    const [icon, setIcon] = useState<string | null>(props.problem === null ? null : props.problem.icon)

    function acceptAction() {
        if (problem_nm === null) {
            toast.info('Select a problem.')
            return
        }
        const newProblem = {
            problem_nm,
            caption,
            weight,
            icon,
        }
        props.setKey(null)
        props.setIsOpen(false)
        if (props.problem === null) props.onAddAccept(newProblem)
        else props.onEditAccept(newProblem)
    }

    if (props.allAbstractProblems === null) {
        return (
            <Dialog open={props.isOpen} onOpenChange={props.setIsOpen}>
                <DialogContent className="pb-32">
                    <DialogDescription className="hidden">Loading problems</DialogDescription>
                    <DialogHeader>
                        <DialogTitle>Loading problems...</DialogTitle>
                    </DialogHeader>
                    <SimpleSpinner />
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={props.isOpen} onOpenChange={props.setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{props.problem ? 'Edit problem of exam' : 'Add problem to exam'}</DialogTitle>

                    <div className="flex flex-row gap-2 pt-2">
                        <div className="font-bold text-sm pt-2 w-20">Problem</div>
                        <ProblemsCombobox
                            value={problem_nm}
                            setValue={setProblemNm}
                            profile={props.profile}
                            allAbstractProblems={props.allAbstractProblems}
                        />
                    </div>

                    <div className="flex flex-row gap-2 pt-2">
                        <div className="font-bold text-sm pt-2 w-20">Caption</div>
                        <Input value={caption || ''} onChange={(e) => setCaption(e.target.value.trim())} />
                    </div>

                    <div className="flex flex-row gap-2 pt-2">
                        <div className="font-bold text-sm pt-2 w-20">Weigth</div>
                        <Input
                            value={weightString}
                            onChange={(e) => setWeightString(e.target.value.trim())}
                            onBlur={() => {
                                if (weightString === '') setWeight(null)
                                else {
                                    const weight = Number(weightString)
                                    if (isNaN(weight)) setWeight(null)
                                    else setWeight(weight)
                                    setWeightString(isNaN(weight) ? '' : weight.toString())
                                }
                            }}
                        />
                    </div>

                    <div className="flex flex-row gap-2 pt-2">
                        <div className="font-bold text-sm pt-2 w-20">Icon</div>
                        <ExamIcons value={icon} setValue={setIcon} />
                    </div>

                    <DialogFooter className="pt-8">
                        <Button onClick={acceptAction} className="w-full">
                            {props.problem ? <EditIcon /> : <PlusCircleIcon />}
                            {props.problem ? 'Edit' : 'Add'} problem
                        </Button>
                    </DialogFooter>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

type ExamIconsProps = {
    value: string | null
    setValue: (icon: string | null) => void
}

function ExamIcons(props: ExamIconsProps) {
    const [icons, setIcons] = useState<Record<string, string[]> | null>(null)
    const [theme, setTheme] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            const icons = await fetchMiscExamIcons()
            setIcons(icons)
            setTheme('basic')
        }
        fetchData()
    }, [])

    return (
        <>
            {icons !== null && theme !== null && (
                <div className="w-full flex flex-col gap-2">
                    <div className="flex flex-row gap-2 items-center">
                        <div className="border rounded-lg w-12 h-12 p-2">
                            {props.value !== null && (
                                <div className="w-full flex flex-row gap-4">
                                    <Image
                                        src={`https://jutge.org/img/examicons/${props.value}.svg`}
                                        alt={props.value}
                                        width={32}
                                        height={32}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="grow" />
                        {props.value !== null && (
                            <Button
                                onClick={() => props.setValue(null)}
                                title="Remove icon"
                                className="text-gray-500"
                                variant={'outline'}
                            >
                                <XCircleIcon className="size-6" />
                            </Button>
                        )}
                    </div>
                    <div className="w-full border rounded-lg p-2 flex flex-col gap-2">
                        <ScrollArea className="h-28">
                            <div className="grid grid-cols-9 gap-0">
                                {icons[theme].map((svg) => (
                                    <div
                                        key={svg}
                                        className={cn(svg === props.value ? 'border rounded-lg' : '', 'w-8 h-8 p-1')}
                                    >
                                        <Image
                                            src={`https://jutge.org/img/examicons/${svg}.svg`}
                                            alt={svg}
                                            width={24}
                                            height={24}
                                            onClick={() => props.setValue(svg)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="flex flex-row gap-2">
                            <Select onValueChange={setTheme} value={theme}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(icons).map(([theme]) => (
                                        <SelectItem key={theme} value={theme}>
                                            {capitalize(theme)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

type ProblemsComboboxProps = {
    value: string | null
    setValue: (problem_nm: string) => void
    profile: Profile
    allAbstractProblems: Record<string, AbstractProblem>
}

function ProblemsCombobox(props: ProblemsComboboxProps) {
    type Item = { key: string; value: string; titles: string }

    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState(props.value || '')
    const [search, setSearch] = useState('')
    const [shownItems, setShownItems] = useState<Item[]>([])

    const allItems: Item[] = Object.entries(props.allAbstractProblems)
        .map(([problem_nm, problem]) => ({
            key: problem_nm,
            value: problem_nm + ' · ' + getProblemTitle(props.profile, problem_nm, props.allAbstractProblems),
            titles:
                problem_nm +
                ' ' +
                Object.values(problem.problems)
                    .map((p) => p.title)
                    .join(' '),
        }))
        .sort((a, b) => a.value.localeCompare(b.value))

    function findItems(search: string) {
        if (search.length < 2) return []
        return allItems.filter(
            (item) => includesForSearch(item.value, search) || includesForSearch(item.titles, search),
        )
    }

    return (
        <div className="w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Input className="w-full text-left" value={inputValue} />
                </PopoverTrigger>
                <PopoverContent className="w-100 p-0 shadow-xl">
                    <Command shouldFilter={false}>
                        <CommandSearchInput
                            placeholder="Search problem..."
                            value={search}
                            onValueChange={(search: string) => {
                                setShownItems(findItems(search))
                                setSearch(search)
                            }}
                        />
                        <CommandList>
                            <ScrollArea className="h-64">
                                <CommandEmpty>
                                    {search.length < 2
                                        ? `Type two characters at least to start searching.`
                                        : 'No matching problems found.'}
                                </CommandEmpty>
                                <CommandGroup>
                                    {shownItems.map((item) => (
                                        <CommandItem
                                            key={item.key}
                                            value={item.titles}
                                            onSelect={() => {
                                                setInputValue(item.value)
                                                props.setValue(item.key)
                                                setOpen(false)
                                                setSearch('')
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    inputValue === item.value ? 'opacity-100' : 'opacity-0',
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <div className="font-bold">{item.key}</div>
                                                {Object.entries(props.allAbstractProblems[item.key].problems).map(
                                                    ([problem_id, problem]) => (
                                                        <div key={problem_id} className="text-sm">
                                                            {problem.title}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </ScrollArea>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}

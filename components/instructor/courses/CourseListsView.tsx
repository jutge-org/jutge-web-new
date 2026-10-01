'use client'

import {
    fetchAllAbstractProblems,
    fetchInstructorCourse,
    fetchInstructorList,
    fetchInstructorListsIndex,
    instructorCourseUpdate,
} from '@/lib/instructor/client'
import { AgTable, AgTableFull } from '@/components/administrator/AgTable'
import { ExternalLink } from '@/components/ExternalLink'
import SimpleSpinner from '@/components/administrator/SimpleSpinner'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { usePageChanges } from '@/hooks/use-page-changes'
import { getProblemTitle } from '@/lib/instructor/problems'
import type { InstructorBriefList, InstructorCourse, InstructorListItem, Profile } from '@/lib/jutge_api_client'
import type { RowSelectionOptions } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { ArrowUpRightIcon, CircleMinusIcon, PlusCircleIcon, SaveIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { redirect, useParams } from 'next/navigation'
import { sleep } from 'radash'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

type Item = { title: string; list_nm: string }

type CourseListsViewProps = {
    profile: Profile
}

export function CourseListsView({ profile }: CourseListsViewProps) {
    const { course_nm } = useParams<{ course_nm: string }>()

    const [course, setCourse] = useState<InstructorCourse | null>(null)
    const [lists, setLists] = useState<Record<string, InstructorBriefList>>({})
    const [items, setItems] = useState<Item[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isShowListDialogOpen, setIsShowListDialogOpen] = useState(false)
    const [listToShow, setListToShow] = useState<string | null>(null)
    const gridRef = useRef<AgGridReact<Item>>(null)

    const [changes, setChanges] = usePageChanges()

    const [colDefs] = useState([
        {
            rowDrag: true,
            field: 'list_nm',
            headerName: 'Id',
            valueGetter: (p: { data: Item }) => p.data.list_nm,
            flex: 1,
            sortable: false,
            cellRenderer: (p: { data: Item }) => (
                <Link
                    href="#"
                    onClick={() => {
                        showListAction(p.data.list_nm)
                        return false
                    }}
                >
                    {p.data.list_nm}
                </Link>
            ),
        },
        {
            field: 'title',
            flex: 2,
            sortable: false,
        },
    ])

    useEffect(() => {
        async function fetchCourse() {
            const lists = await fetchInstructorListsIndex()
            const course = await fetchInstructorCourse(course_nm)
            const items = course.lists.map((list_nm) => ({ title: lists[list_nm].title, list_nm }))
            setLists(lists)
            setCourse(course)
            setItems(items)
            setChanges(false)
        }

        fetchCourse()
    }, [course_nm, setChanges])

    useEffect(() => {
        fetchAllAbstractProblems()
    }, [course_nm])

    const rowSelection = useMemo<RowSelectionOptions | 'single' | 'multiple'>(() => {
        return { mode: 'multiRow', headerCheckbox: true }
    }, [])

    async function saveAction() {
        const lists: string[] = []
        gridRef.current!.api.forEachNode((rowNode) => {
            if (rowNode.data?.list_nm) lists.push(rowNode.data?.list_nm)
        })
        const course = await fetchInstructorCourse(course_nm)
        const newCourse = { ...course, lists }
        await instructorCourseUpdate(newCourse)
        toast.success(`Lists saved.`)
        setChanges(false)
    }

    async function addCallback(listsToAdd: string[]) {
        await sleep(0)
        const grid = gridRef.current!.api
        const itemsToAdd = listsToAdd.map((list_nm) => ({ list_nm, title: lists[list_nm].title }))
        const selectedRows = grid.getSelectedNodes().map((node) => node.rowIndex) as number[]
        const index = selectedRows.length > 0 ? Math.max(...selectedRows) : items.length
        grid.applyTransaction({
            add: itemsToAdd,
            addIndex: index,
        })
        setChanges(true)
    }

    function deleteAction() {
        const grid = gridRef.current!.api
        const selectedRows = grid.getSelectedRows()
        if (selectedRows.length === 0) toast.warning('No lists selected to remove.')
        grid.applyTransaction({
            remove: selectedRows,
        })
        setChanges(true)
    }

    function showListAction(list_nm: string) {
        setListToShow(list_nm)
        setIsShowListDialogOpen(true)
    }

    if (course === null) return <SimpleSpinner />

    return (
        <>
            <div className="mb-4 flex flex-row-reverse gap-2">
                <Button className="w-28 justify-start" onClick={saveAction}>
                    <SaveIcon className={changes ? 'animate-pulse' : ''} />
                    Save
                </Button>
                <Button className="w-28 justify-start" onClick={deleteAction}>
                    <CircleMinusIcon /> Remove
                </Button>
                <Button className="w-28 justify-start" onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircleIcon /> Add
                </Button>
            </div>
            <div className="h-[calc(100vh-200px)] w-full">
                <AgTableFull
                    rowData={items}
                    columnDefs={colDefs}
                    rowDragManaged={true}
                    rowDragMultiRow={true}
                    rowSelection={rowSelection}
                    ref={gridRef}
                />
            </div>
            <DialogToAddLists
                isOpen={isAddDialogOpen}
                setIsOpen={setIsAddDialogOpen}
                onAccept={addCallback}
                availableLists={lists}
            />
            <DialogToShowList
                isOpen={isShowListDialogOpen}
                setIsOpen={setIsShowListDialogOpen}
                listToShow={listToShow}
                profile={profile}
            />
        </>
    )
}

function DialogToAddLists({
    isOpen,
    setIsOpen,
    onAccept,
    availableLists,
}: {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    onAccept: (selectedLists: string[]) => Promise<void>
    availableLists: Record<string, InstructorBriefList>
}) {
    const [rows] = useState<Item[]>(
        Object.entries(availableLists)
            .map(([list_nm, list]) => ({
                title: list.title,
                list_nm,
            }))
            .sort((a, b) => a.title.localeCompare(b.title)),
    )
    const [colDefs] = useState([
        { field: 'list_nm', headerName: 'Id', flex: 1, filter: true },
        { field: 'title', flex: 2, filter: true },
    ])
    const gridRef = useRef<AgGridReact<Item>>(null)

    const onGridReady = useCallback(() => {
        gridRef.current!.api.setGridOption('headerHeight', 32)
    }, [])

    const rowSelection = useMemo<RowSelectionOptions | 'single' | 'multiple'>(() => {
        return { mode: 'multiRow', headerCheckbox: true }
    }, [])

    function addCallback() {
        const grid = gridRef.current!.api
        const selectedLists = grid.getSelectedNodes().map((node) => node.data?.list_nm) as string[]
        setIsOpen(false)
        onAccept(selectedLists)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-6xl">
                <DialogDescription className="hidden">Add lists to course</DialogDescription>
                <DialogHeader>
                    <DialogTitle>Add lists to course</DialogTitle>
                    <DialogDescription>Select the lists you want to add to the course:</DialogDescription>
                    <div className="h-96 w-full pb-4">
                        <AgTable
                            rowData={rows}
                            columnDefs={colDefs}
                            rowDragManaged={true}
                            rowDragMultiRow={true}
                            rowSelection={rowSelection}
                            ref={gridRef}
                            rowHeight={32}
                            onGridReady={onGridReady}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={addCallback} className="w-full">
                            <PlusCircleIcon />
                            Add lists
                        </Button>
                    </DialogFooter>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

function DialogToShowList({
    isOpen,
    setIsOpen,
    listToShow,
    profile,
}: {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    listToShow: string | null
    profile: Profile
}) {
    const [rows, setRows] = useState<InstructorListItem[]>([])
    const [colDefs, setColDefs] = useState<
        {
            field: string
            flex: number
            sortable: boolean
            cellRenderer: (p: { data: InstructorListItem }) => ReactNode
        }[]
    >([])
    const gridRef = useRef<AgGridReact<Item>>(null)

    useEffect(() => {
        async function fetchData() {
            if (listToShow === null) return
            const list = await fetchInstructorList(listToShow)
            const items = list.items
            setRows(items)

            const allAbstractProblems = await fetchAllAbstractProblems()

            const cols = [
                {
                    field: 'Items',
                    flex: 1,
                    sortable: false,
                    cellRenderer: (p: { data: InstructorListItem }) =>
                        p.data.problem_nm ? (
                            <div className="flex flex-row">
                                <ExternalLink className="w-24" href={`/problems/${p.data.problem_nm}`}>
                                    {p.data.problem_nm}↗
                                </ExternalLink>
                                {getProblemTitle(profile, p.data.problem_nm, allAbstractProblems)}
                            </div>
                        ) : (
                            <div className="italic">{p.data.description}</div>
                        ),
                },
            ]
            setColDefs(cols)
        }

        fetchData()
    }, [isOpen, listToShow, profile])

    const onGridReady = useCallback(() => {
        gridRef.current!.api.setGridOption('headerHeight', 32)
    }, [])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>List {listToShow}</DialogTitle>
                    <DialogDescription></DialogDescription>
                    <div className="h-96 w-full pb-4">
                        <AgTable
                            rowData={rows}
                            columnDefs={colDefs}
                            rowDragManaged={true}
                            rowDragMultiRow={true}
                            ref={gridRef}
                            rowHeight={32}
                            onGridReady={onGridReady}
                        />
                    </div>
                    <DialogFooter className="flex flex-row gap-2">
                        <div className="w-full flex flex-col gap-2">
                            <Button
                                onClick={() => redirect(`/instructor/lists/${listToShow}/items`)}
                                className="w-full"
                            >
                                <ArrowUpRightIcon />
                                Go to list
                            </Button>
                            <Button onClick={() => setIsOpen(false)} className="w-full">
                                <XIcon />
                                Close
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

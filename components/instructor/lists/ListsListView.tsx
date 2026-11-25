'use client'

import { fetchInstructorListsArchived, fetchInstructorListsIndex } from '@/lib/instructor/client'
import { AgTableFull } from '@/components/administrator/AgTable'
import AnimatedToggle, { XS_BLUE_CANDY_MORPH_TOGGLE } from '@/components/smoothui/animated-toggle'
import SmoothButton from '@/components/smoothui/smooth-button'
import { useIsMobile } from '@/hooks/use-mobile'
import type { InstructorBriefList } from '@/lib/jutge_api_client'
import dayjs from 'dayjs'
import { SquarePlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function ListsListView() {
    const isMobile = useIsMobile()

    const [lists, setLists] = useState<InstructorBriefList[]>([])
    const [rows, setRows] = useState<InstructorBriefList[]>([])
    const [archived, setArchived] = useState<string[]>([])
    const [showArchived, setShowArchived] = useState(false)

    const [colDefs, setColDefs] = useState([
        {
            field: 'list_nm',
            headerName: 'Id',
            cellRenderer: (p: { data: InstructorBriefList }) => (
                <Link href={`/instructor/lists/${p.data.list_nm}/properties`}>{p.data.list_nm}</Link>
            ),
            flex: 1,
            filter: true,
        },
        { field: 'title', flex: 2, filter: true },
        {
            field: 'created_at',
            headerName: 'Created',
            width: 140,
            filter: true,
            valueGetter: (p: { data: InstructorBriefList }) => dayjs(p.data.created_at).format('YYYY-MM-DD'),
        },
        {
            field: 'updated_at',
            headerName: 'Updated',
            width: 140,
            filter: true,
            valueGetter: (p: { data: InstructorBriefList }) => dayjs(p.data.updated_at).format('YYYY-MM-DD'),
            sort: 'desc',
        },
    ])

    useEffect(() => {
        if (isMobile) setColDefs((colDefs) => colDefs.filter((c) => c.field !== 'annotation'))
    }, [isMobile])

    useEffect(() => {
        async function fetchLists() {
            const archived = await fetchInstructorListsArchived()
            const dict = await fetchInstructorListsIndex()
            const array = Object.values(dict).sort((a, b) => a.list_nm.localeCompare(b.list_nm))
            setRows(array.filter((list) => !archived.includes(list.list_nm)))
            setLists(array)
            setArchived(archived)
        }

        fetchLists()
    }, [])

    function showArchivedChange(checked: boolean) {
        setShowArchived(checked)
        if (checked) {
            setRows(lists.filter((list) => archived.includes(list.list_nm)))
        } else {
            setRows(lists.filter((list) => !archived.includes(list.list_nm)))
        }
    }

    return (
        <>
            <div className="mb-4 flex flex-row gap-2">
                <AnimatedToggle
                    {...XS_BLUE_CANDY_MORPH_TOGGLE}
                    checked={showArchived}
                    label="Show archived lists"
                    onChange={showArchivedChange}
                />
                <div className="text-sm">Archived lists</div>
                <div className="flex-grow" />
                <SmoothButton asChild color="blue" variant="candy" size="xs">
                    <Link href="/instructor/lists/new">
                        <SquarePlusIcon /> New list
                    </Link>
                </SmoothButton>
            </div>
            <AgTableFull rowData={rows} columnDefs={colDefs} />
        </>
    )
}

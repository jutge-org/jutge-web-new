'use client'

import dayjs from 'dayjs'
import { SquarePlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchInstructorDocumentsIndex } from '@/lib/instructor/client'
import { AgTableFull } from '@/components/administrator/AgTable'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { documentFileExtension, getDocumentFile, getDocumentFileIcon } from '@/lib/instructor/documents'
import type { Document } from '@/lib/jutge_api_client'
import { offerDownloadFile } from '@/lib/instructor/utils'
import type { ICellRendererParams } from 'ag-grid-community'

export function DocumentsListView() {
    const isMobile = useIsMobile()

    const [documents, setDocuments] = useState<Document[]>([])

    const [colDefs, setColDefs] = useState([
        {
            field: 'document_nm',
            headerName: 'Id',
            cellRenderer: (p: ICellRendererParams<Document>) => (
                <Link href={`/instructor/documents/${p.data!.document_nm}`}>{p.data!.document_nm}</Link>
            ),
            width: 200,
            filter: true,
        },
        { field: 'title', flex: 2, filter: true },
        {
            field: 'created_at',
            width: 120,
            cellRenderer: (p: ICellRendererParams<Document>) => dayjs(p.data!.created_at).format('YYYY-MM-DD'),
            headerName: 'Created',
        },
        {
            field: 'updated_at',
            width: 120,
            sort: 'desc',
            cellRenderer: (p: ICellRendererParams<Document>) => dayjs(p.data!.updated_at).format('YYYY-MM-DD'),
            headerName: 'Updated',
        },
        {
            field: 'file',
            headerName: 'File',
            width: 100,
            filter: false,
            cellRenderer: (p: ICellRendererParams<Document>) => {
                const Icon = getDocumentFileIcon(p.data!.type)
                return (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            downloadFile(p.data!)
                            p.api.deselectAll()
                        }}
                    >
                        <Icon />
                    </Button>
                )
            },
        },
    ])

    useEffect(() => {
        if (isMobile) setColDefs((colDefs) => colDefs.filter((c) => c.field !== 'annotation' && c.field !== 'file'))
    }, [isMobile])

    useEffect(() => {
        async function fetchDocuments() {
            const dict = await fetchInstructorDocumentsIndex()
            const array = Object.values(dict).sort((a: Document, b: Document) =>
                a.document_nm.localeCompare(b.document_nm),
            )
            setDocuments(array)
        }

        fetchDocuments()
    }, [])

    async function downloadFile(document: Document) {
        const download = await getDocumentFile(document)
        offerDownloadFile(download, `${document.document_nm}${documentFileExtension(document)}`)
    }

    return (
        <>
            <div className="mb-4 flex flex-row-reverse gap-2">
                <SmoothButton asChild color="blue" variant="candy" size="xs">
                    <Link href="/instructor/documents/new">
                        <SquarePlusIcon /> New document
                    </Link>
                </SmoothButton>
            </div>
            <AgTableFull rowData={documents} columnDefs={colDefs} />
        </>
    )
}

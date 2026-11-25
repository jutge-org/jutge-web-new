'use client'

import { fetchInstructorApiUrl } from '@/lib/instructor/client'
import { useXTerm } from '@/components/instructor/XTerm'
import SmoothButton from '@/components/smoothui/smooth-button'
import { CloudDownloadIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type ExamSubmissionsWebStreamViewProps = {
    webstream_id: string
}

export function ExamSubmissionsWebStreamView({ webstream_id }: ExamSubmissionsWebStreamViewProps) {
    const { instance, ref } = useXTerm()
    const [loading, setLoading] = useState(true)
    const [packId, setPackId] = useState<string | null>(null)
    const [apiUrl, setApiUrl] = useState<string | null>(null)

    useEffect(() => {
        fetchInstructorApiUrl().then(setApiUrl)
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            if (!instance || !ref || !ref.current || !apiUrl) return
            const response = await fetch(`${apiUrl}/webstreams/${webstream_id}`)
            if (response.body === null) return
            const reader = response.body.getReader()
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const text = new TextDecoder().decode(value)
                instance.write(text.replaceAll(/\n/g, '\r\n'))

                const match = text.match(/Download ([-_A-Za-z0-9]+.zip) ready/)
                if (match) setPackId(match[1])
            }
            setLoading(false)
        }

        fetchData()
    }, [instance, ref, webstream_id, apiUrl])

    return (
        <div className="mb-8">
            {loading && (
                <div className="border rounded-lg p-4 mb-8 text-sm text-center">
                    <div className="animate-pulse">Please wait while your download is being prepared.</div>
                </div>
            )}
            {!loading && packId && (
                <div className="border-green-800 border text-green-800 rounded-lg p-4 mb-8 text-sm text-center">
                    Download ready.
                </div>
            )}
            {!loading && !packId && (
                <div className="border border-red-800 text-red-800 rounded-lg p-4 mb-8 text-sm text-center">
                    Download could not be created. Please check the terminal for more information.
                </div>
            )}
            <div className="w-full h-[400px] border-8 border-black rounded-lg mb-8">
                <div ref={ref} style={{ width: '100%', height: '100%' }} />
            </div>
            {!loading && packId && apiUrl && (
                <SmoothButton asChild color="blue" variant="candy" size="xs" className="w-full text-center">
                    <Link href={`${apiUrl}/packs/${packId}`}>
                        <CloudDownloadIcon />
                        Download
                    </Link>
                </SmoothButton>
            )}
        </div>
    )
}

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

type RouteParams = {
    params: Promise<{ section: string; filename: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
    const { section, filename } = await params

    if (section !== 'documentation') {
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
    }

    if (!/^[a-z0-9-]+\.md$/.test(filename)) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    try {
        const filePath = path.join(process.cwd(), 'content', section, filename)
        const content = await readFile(filePath, 'utf8')
        return new NextResponse(content, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
    } catch {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
}

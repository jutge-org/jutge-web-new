import { readFile } from 'fs/promises'
import path from 'path'

import { NextResponse } from 'next/server'

const skulptFiles = {
    'skulpt.min.js': path.join(process.cwd(), 'node_modules/skulpt/dist/skulpt.min.js'),
    'skulpt-stdlib.js': path.join(process.cwd(), 'node_modules/skulpt/dist/skulpt-stdlib.js'),
} as const

type SkulptFile = keyof typeof skulptFiles

type RouteContext = {
    params: Promise<{ file: string }>
}

export async function GET(_request: Request, context: RouteContext) {
    const { file } = await context.params
    const filePath = skulptFiles[file as SkulptFile]
    if (!filePath) {
        return new NextResponse(null, { status: 404 })
    }

    try {
        const body = await readFile(filePath)
        return new NextResponse(body, {
            headers: {
                'Content-Type': 'text/javascript; charset=utf-8',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch {
        return new NextResponse(null, { status: 404 })
    }
}

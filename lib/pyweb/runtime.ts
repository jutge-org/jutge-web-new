const CODE_PARAM_LIMIT = 5000

const SKULPT_SCRIPT = '/api/skulpt/skulpt.min.js'
const SKULPT_STDLIB_SCRIPT = '/api/skulpt/skulpt-stdlib.js'

type SkulptApi = {
    configure: (options: {
        output: (text: string) => void
        inputfun: (prompt: string) => Promise<string>
        inputfunTakesPrompt: boolean
    }) => void
    pre?: string
    TurtleGraphics?: { target?: string }
    misceval: {
        asyncToPromise: (fn: () => unknown) => Promise<unknown>
    }
    importMainWithBody: (filename: string, dumpJs: boolean, body: string, canSuspend: boolean) => unknown
}

declare global {
    interface Window {
        Sk?: SkulptApi
    }
}

export type PyWebRunHandlers = {
    output: (text: string) => void
    input: (prompt: string) => Promise<string>
    canvasId: string
}

let skulptPromise: Promise<SkulptApi> | null = null

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[data-pyweb-src="${CSS.escape(src)}"]`)
        if (existing?.dataset.loaded === 'true') {
            resolve()
            return
        }
        existing?.remove()

        const script = document.createElement('script')
        script.src = src
        script.async = false
        script.dataset.pywebSrc = src
        script.onload = () => {
            script.dataset.loaded = 'true'
            resolve()
        }
        script.onerror = () => {
            script.remove()
            reject(new Error(`Failed to load ${src}`))
        }
        document.head.appendChild(script)
    })
}

async function loadSkulptScripts(): Promise<SkulptApi> {
    await loadScript(SKULPT_SCRIPT)
    await loadScript(SKULPT_STDLIB_SCRIPT)
    const Sk = window.Sk
    if (!Sk?.configure || !Sk.misceval) {
        throw new Error('Skulpt did not initialize')
    }
    return Sk
}

export function loadSkulpt(): Promise<SkulptApi> {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Skulpt runs in the browser'))
    }
    if (window.Sk?.configure && window.Sk.misceval) {
        return Promise.resolve(window.Sk)
    }
    if (!skulptPromise) {
        skulptPromise = loadSkulptScripts().catch((error: unknown) => {
            skulptPromise = null
            throw error
        })
    }
    return skulptPromise
}

export async function runProgram(code: string, handlers: PyWebRunHandlers): Promise<void> {
    const Sk = await loadSkulpt()
    Sk.pre = 'pyweb-console'
    Sk.configure({
        output: handlers.output,
        inputfun: handlers.input,
        inputfunTakesPrompt: true,
    })
    const graphics = Sk.TurtleGraphics ?? {}
    graphics.target = handlers.canvasId
    Sk.TurtleGraphics = graphics
    await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, code, true))
}

export function decodeCodeParam(value: string | null): string {
    if (value == null) return ''
    if (value.length > CODE_PARAM_LIMIT) return '# too long code\n'
    try {
        return decodeURIComponent(atob(value))
    } catch {
        return ''
    }
}

export function decodeSolutionParam(value: string | null): string | null {
    if (value == null) return null
    if (value.length > CODE_PARAM_LIMIT) return '# too long solution\n'
    try {
        return decodeURIComponent(atob(value))
    } catch {
        return null
    }
}

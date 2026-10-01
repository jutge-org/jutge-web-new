const JSCPP_RUN_TIMEOUT_MS = 3000

export type JsCppVariable = {
    name: string
    type: string
    value: string
}

type JsCppNode = {
    sLine: number
    sColumn: number
    sOffset: number
    eLine: number
    eColumn: number
    eOffset: number
}

type JsCppExit = {
    v?: unknown
}

export type JsCppDebugger = {
    src: string
    continue: () => false | JsCppExit
    nextNode: () => JsCppNode | null | undefined
    variable: () => Array<{ name?: unknown; type?: unknown; value?: unknown }>
}

type JsCppConfig = {
    debug?: boolean
    maxTimeout?: number
    stdio?: {
        write?: (text: string) => void
    }
}

type JsCppApi = {
    run: (code: string, input: string, config?: JsCppConfig) => number | JsCppDebugger
}

let loading: Promise<JsCppApi> | null = null

function isDebugger(value: number | JsCppDebugger): value is JsCppDebugger {
    return typeof value === 'object' && value != null && typeof value.continue === 'function'
}

function resolveApi(mod: { default?: JsCppApi } & Partial<JsCppApi>): JsCppApi {
    if (mod.default && typeof mod.default.run === 'function') return mod.default
    if (typeof mod.run === 'function') return mod as JsCppApi
    throw new Error('Could not load JSCPP')
}

export function loadJsCpp(): Promise<JsCppApi> {
    if (!loading) {
        loading = import('JSCPP')
            .then((mod) => resolveApi(mod as { default?: JsCppApi } & Partial<JsCppApi>))
            .catch((error: unknown) => {
                loading = null
                throw error
            })
    }
    return loading
}

export async function runJsCpp(code: string, input: string, write: (text: string) => void): Promise<number> {
    const api = await loadJsCpp()
    const result = api.run.call(api, code, input, {
        maxTimeout: JSCPP_RUN_TIMEOUT_MS,
        stdio: { write },
    })
    if (typeof result !== 'number') throw new Error('JSCPP did not return an exit code')
    return result
}

export async function startJsCppDebugger(
    code: string,
    input: string,
    write: (text: string) => void,
): Promise<JsCppDebugger> {
    const api = await loadJsCpp()
    const result = api.run.call(api, code, input, {
        debug: true,
        stdio: { write },
    })
    if (!isDebugger(result)) throw new Error('JSCPP did not start the debugger')
    return result
}

export function readJsCppVariables(dbg: JsCppDebugger): JsCppVariable[] {
    const raw = dbg.variable()
    if (!Array.isArray(raw)) return []
    return raw.flatMap((entry) => {
        if (typeof entry?.name !== 'string' || entry.name.length === 0) return []
        return [
            {
                name: entry.name,
                type: typeof entry.type === 'string' ? entry.type : '',
                value: entry.value == null ? '' : String(entry.value),
            },
        ]
    })
}

export function readJsCppLine(dbg: JsCppDebugger): number | null {
    const node = dbg.nextNode()
    if (node == null || typeof node.sLine !== 'number' || node.sLine < 1) return null
    return node.sLine
}

export function readJsCppExitCode(done: false | JsCppExit): number | null {
    if (done === false || typeof done.v !== 'number') return null
    return done.v
}

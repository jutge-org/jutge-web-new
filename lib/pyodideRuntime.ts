// Pyodide's browser runtime is about 10 MB (loader, WebAssembly, and the
// Python standard library). Load it from the CDN the first time the REPL is
// opened so it stays out of the app bundle.

export const PYODIDE_VERSION = '314.0.7'
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

export type PyodideSyntaxCheck = 'incomplete' | 'syntax-error' | 'complete'

type PyProxy = {
    destroy(): void
}

type ConsoleFutureProxy = PyProxy & {
    syntax_check: PyodideSyntaxCheck
    formatted_error: string | null
}

type PyConsoleProxy = PyProxy & {
    push(line: string): ConsoleFutureProxy
    complete(source: string): PyProxy & { toJs(): [string[], number] }
    buffer: { clear(): void }
    filename: string
    stdout_callback: ((text: string) => void) | null
    stderr_callback: ((text: string) => void) | null
}

type PyodideConsoleClass = {
    callKwargs(globals: unknown, kwargs: { filename: string }): PyConsoleProxy
    copy(): PyodideConsoleClass
    destroy(): void
}

type ConsoleModuleProxy = PyProxy & {
    BANNER: string
    PyodideConsole: PyodideConsoleClass
}

export type PyodideApi = {
    version: string
    runPython(code: string): unknown
    pyimport(name: string): ConsoleModuleProxy
}

type LoadPyodide = (options?: { indexURL?: string; stdin?: () => string }) => Promise<PyodideApi>

type PyodideWindow = Window & { loadPyodide?: LoadPyodide }

export type PyodideSessionCallbacks = {
    stdout(text: string): void
    stderr(text: string): void
}

export type PyodideSession = {
    banner: string
    pushLine(line: string): Promise<PyodideSyntaxCheck>
    complete(source: string): { completions: string[]; start: number }
    clearBuffer(): void
    destroy(): void
}

let readStdin: () => string = () => '\n'
let pyodidePromise: Promise<PyodideApi> | null = null

export function setPyodideStdin(read: () => string) {
    readStdin = read
}

export function loadPyodideRuntime(): Promise<PyodideApi> {
    if (!pyodidePromise) {
        pyodidePromise = loadFromCdn().catch((error: unknown) => {
            pyodidePromise = null
            throw error
        })
    }
    return pyodidePromise
}

export function createPyodideSession(pyodide: PyodideApi, callbacks: PyodideSessionCallbacks): PyodideSession {
    const consoleModule = pyodide.pyimport('pyodide.console')
    const pythonBanner = String(consoleModule.BANNER)
    const PyodideConsole = consoleModule.PyodideConsole.copy()
    consoleModule.destroy()

    const namespace = pyodide.runPython(
        ['import builtins', '{"__builtins__": builtins, "__name__": "__main__"}'].join('\n'),
    )
    const pyconsole = PyodideConsole.callKwargs(namespace, { filename: '<stdin>' })
    pyconsole.stdout_callback = (text) => callbacks.stdout(String(text))
    pyconsole.stderr_callback = (text) => callbacks.stderr(String(text))

    const awaitFut = pyodide.runPython(
        [
            'import builtins',
            'from pyodide.console import repr_shorten',
            'async def await_fut(fut):',
            '    result = await fut',
            '    if result is not None:',
            '        builtins._ = result',
            '        return repr_shorten(result, separator="\\n...\\n")',
            '    return None',
            'await_fut',
        ].join('\n'),
    ) as (fut: ConsoleFutureProxy) => Promise<unknown>

    const banner = `Pyodide ${pyodide.version}\n${pythonBanner.trim()}\n\n`

    return {
        banner,
        pushLine(line) {
            return pushLine(pyconsole, awaitFut, callbacks, line)
        },
        complete(source) {
            const proxy = pyconsole.complete(source)
            try {
                const [completions, start] = proxy.toJs()
                return { completions: completions ?? [], start: Number(start) || 0 }
            } finally {
                proxy.destroy()
            }
        },
        clearBuffer() {
            pyconsole.buffer.clear()
        },
        destroy() {
            pyconsole.stdout_callback = null
            pyconsole.stderr_callback = null
            pyconsole.destroy()
            PyodideConsole.destroy()
            destroyProxy(awaitFut)
            destroyProxy(namespace)
        },
    }
}

async function pushLine(
    pyconsole: PyConsoleProxy,
    awaitFut: (fut: ConsoleFutureProxy) => Promise<unknown>,
    callbacks: PyodideSessionCallbacks,
    line: string,
): Promise<PyodideSyntaxCheck> {
    const fut = pyconsole.push(line)
    const status = fut.syntax_check
    if (status === 'incomplete') {
        fut.destroy()
        return status
    }
    if (status === 'syntax-error') {
        callbacks.stderr(`${(fut.formatted_error ?? 'SyntaxError').trimEnd()}\n`)
        await swallowRejection(fut)
        fut.destroy()
        return status
    }

    try {
        const shown = await awaitFut(fut)
        if (shown != null) callbacks.stdout(`${String(shown)}\n`)
        destroyProxy(shown)
    } catch (error) {
        const message = fut.formatted_error || (error instanceof Error ? error.message : String(error))
        callbacks.stderr(`${message.trimEnd()}\n`)
    } finally {
        fut.destroy()
    }
    return status
}

async function loadFromCdn(): Promise<PyodideApi> {
    await injectPyodideScript()
    const loadPyodide = (window as PyodideWindow).loadPyodide
    if (!loadPyodide) throw new Error('Pyodide did not initialize.')
    return loadPyodide({
        indexURL: PYODIDE_INDEX_URL,
        stdin: () => readStdin(),
    })
}

function injectPyodideScript(): Promise<void> {
    if ((window as PyodideWindow).loadPyodide) return Promise.resolve()

    return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-pyodide]')
        const script = existing ?? document.createElement('script')
        const fail = () => reject(new Error('Could not download Pyodide.'))
        script.addEventListener('load', () => resolve(), { once: true })
        script.addEventListener('error', fail, { once: true })
        if (existing) return
        script.src = `${PYODIDE_INDEX_URL}pyodide.js`
        script.async = true
        script.dataset.pyodide = ''
        document.head.appendChild(script)
    })
}

function destroyProxy(value: unknown) {
    if (typeof value === 'object' && value !== null && 'destroy' in value && typeof value.destroy === 'function') {
        value.destroy()
    }
}

async function swallowRejection(fut: ConsoleFutureProxy) {
    try {
        await fut
    } catch {
        // The formatted syntax error is already shown.
    }
}

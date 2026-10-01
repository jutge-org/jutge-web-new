declare module 'JSCPP' {
    const JSCPP: {
        run: (code: string, input: string, config?: unknown) => unknown
    }
    export default JSCPP
}

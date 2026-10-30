import { getCurrentClient, getProblemsApiClient, isAuthenticated } from '@/lib/data/auth'
import type { AbstractProblem, JutgeApiClient } from '@/lib/jutge_api_client'
import { rewriteStatementHtmlForDisplay } from '@/lib/statementHtml'

async function withAuthenticatedClient<T>(fn: (client: JutgeApiClient) => Promise<T>): Promise<T> {
    if (!isAuthenticated()) {
        throw new Error('Forbidden')
    }
    return fn(await getCurrentClient())
}

export async function fetchProblemsSearchCatalog() {
    return withAuthenticatedClient((c) => c.problems.getAllAbstractProblems())
}

export async function fetchProblemAbstractProblem(problem_nm: string): Promise<AbstractProblem> {
    const client = await getProblemsApiClient()
    return client.problems.getAbstractProblem(problem_nm)
}

export async function problemsSemanticSearch(query: string) {
    return withAuthenticatedClient((c) => c.problems.semanticSearch({ query, limit: 50 }))
}

export async function problemsFullTextSearch(query: string) {
    return withAuthenticatedClient((c) => c.problems.fullTextSearch({ query, limit: 50 }))
}

export async function fetchProblemSearchSuppl(problem_nm: string) {
    return withAuthenticatedClient((c) => c.problems.getAbstractProblemSuppl(problem_nm))
}

export async function fetchManyProblemSearchSuppl(problem_nms: string) {
    return withAuthenticatedClient((c) => c.problems.getManyAbstractProblemSuppl(problem_nms))
}

export async function fetchProblemSearchPdfStatement(problem_id: string) {
    return withAuthenticatedClient((c) => c.problems.getPdfStatement(problem_id))
}

export async function fetchProblemSearchHtmlStatement(problem_id: string) {
    const html = await withAuthenticatedClient((c) => c.problems.getHtmlStatement(problem_id))
    return rewriteStatementHtmlForDisplay(html)
}

export async function fetchProblemSearchMarkdownStatement(problem_id: string) {
    return withAuthenticatedClient((c) => c.problems.getMarkdownStatement(problem_id))
}

export async function fetchProblemSearchTextStatement(problem_id: string) {
    return withAuthenticatedClient((c) => c.problems.getTextStatement(problem_id))
}

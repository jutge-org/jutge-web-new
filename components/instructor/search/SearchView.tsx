'use client'

import {
    fetchAllAbstractProblems,
    fetchManyAbstractProblemSuppl,
    fetchHtmlStatement,
    fetchMarkdownStatement,
    fetchPdfStatement,
    fetchTextStatement,
    instructorFullTextSearch,
    instructorSemanticSearch,
} from '@/lib/instructor/client'
import { ProblemSearchView, type ProblemSearchActions } from '@/components/problems/search/ProblemSearchView'

const instructorSearchActions: ProblemSearchActions = {
    fetchCatalog: fetchAllAbstractProblems,
    semanticSearch: instructorSemanticSearch,
    fullTextSearch: instructorFullTextSearch,
    fetchManySuppl: fetchManyAbstractProblemSuppl,
    fetchPdfStatement: fetchPdfStatement,
    fetchHtmlStatement: fetchHtmlStatement,
    fetchMarkdownStatement: fetchMarkdownStatement,
    fetchTextStatement: fetchTextStatement,
}

export function SearchView() {
    return <ProblemSearchView actions={instructorSearchActions} showInstructorStats largeResultIcon />
}

import jutge from '@/lib/jutge'
import type { JutgeApiClient } from '@/lib/jutge_api_client'
import { problemIconUrl } from '@/lib/problems'
import { mapmap } from '@/lib/instructor/utils'

export async function withInstructorClient<T>(fn: (client: JutgeApiClient) => Promise<T>): Promise<T> {
    if (!jutge.meta?.token) {
        throw new Error('Forbidden')
    }
    const profile = await jutge.student.profile.get()
    if (!profile.instructor) {
        throw new Error('Forbidden')
    }
    return fn(jutge)
}
import type {
    ChatMessage,
    ChatPrompt,
    Deprecation,
    DocumentCreation,
    InstructorCourseCreation,
    InstructorCourseUpdate,
    InstructorExamCreation,
    InstructorExamProblem,
    InstructorExamStudent,
    InstructorExamSubmissionsOptions,
    InstructorExamUpdate,
    InstructorListCreation,
    ShareWithInp,
    SharingSettings,
    ProblemAlerts,
} from '@/lib/jutge_api_client'

// --- Documents ---

export async function fetchInstructorDocumentsIndex() {
    return withInstructorClient((c) => c.instructor.documents.index())
}

export async function fetchInstructorDocument(document_nm: string) {
    return withInstructorClient((c) => c.instructor.documents.get(document_nm))
}

export async function fetchInstructorDocumentPdf(document_nm: string) {
    return withInstructorClient((c) => c.instructor.documents.getPdf(document_nm))
}

export async function fetchInstructorDocumentZip(document_nm: string) {
    return withInstructorClient((c) => c.instructor.documents.getZip(document_nm))
}

export async function instructorDocumentCreate(data: DocumentCreation, ifile: File) {
    return withInstructorClient((c) => c.instructor.documents.create(data, ifile))
}

export async function instructorDocumentUpdate(data: DocumentCreation, ifile: File) {
    return withInstructorClient((c) => c.instructor.documents.update(data, ifile))
}

export async function instructorDocumentRemove(document_nm: string) {
    return withInstructorClient((c) => c.instructor.documents.remove(document_nm))
}

// --- Lists ---

export async function fetchInstructorListsIndex() {
    return withInstructorClient((c) => c.instructor.lists.index())
}

export async function fetchInstructorListsArchived() {
    return withInstructorClient((c) => c.instructor.lists.getArchived())
}

export async function fetchInstructorList(list_nm: string) {
    return withInstructorClient((c) => c.instructor.lists.get(list_nm))
}

export async function instructorListCreate(data: InstructorListCreation) {
    return withInstructorClient((c) => c.instructor.lists.create(data))
}

export async function instructorListUpdate(data: InstructorListCreation) {
    return withInstructorClient((c) => c.instructor.lists.update(data))
}

export async function instructorListRemove(list_nm: string) {
    return withInstructorClient((c) => c.instructor.lists.remove(list_nm))
}

export async function instructorListArchive(list_nm: string) {
    return withInstructorClient((c) => c.instructor.lists.archive(list_nm))
}

export async function instructorListUnarchive(list_nm: string) {
    return withInstructorClient((c) => c.instructor.lists.unarchive(list_nm))
}

// --- Courses ---

export async function fetchInstructorCoursesIndex() {
    return withInstructorClient((c) => c.instructor.courses.index())
}

export async function fetchInstructorCoursesArchived() {
    return withInstructorClient((c) => c.instructor.courses.getArchived())
}

export async function fetchInstructorCourse(course_nm: string) {
    return withInstructorClient((c) => c.instructor.courses.get(course_nm))
}

export async function fetchInstructorCourseStudentProfiles(course_nm: string) {
    return withInstructorClient((c) => c.instructor.courses.getStudentProfiles(course_nm))
}

export async function fetchInstructorCourseTutorProfiles(course_nm: string) {
    return withInstructorClient((c) => c.instructor.courses.getTutorProfiles(course_nm))
}

export async function instructorCourseCreate(data: InstructorCourseCreation) {
    return withInstructorClient((c) => c.instructor.courses.create(data))
}

export async function instructorCourseUpdate(data: InstructorCourseUpdate) {
    return withInstructorClient((c) => c.instructor.courses.update(data))
}

export async function instructorCourseRemove(course_nm: string) {
    return withInstructorClient((c) => c.instructor.courses.remove(course_nm))
}

export async function instructorCourseArchive(course_nm: string) {
    return withInstructorClient((c) => c.instructor.courses.archive(course_nm))
}

export async function instructorCourseUnarchive(course_nm: string) {
    return withInstructorClient((c) => c.instructor.courses.unarchive(course_nm))
}

export async function instructorCourseSendInviteToStudents(course_nm: string) {
    return withInstructorClient((c) => c.instructor.courses.sendInviteToStudents(course_nm))
}

export async function instructorCourseSendInviteToTutors(course_nm: string) {
    return withInstructorClient((c) => c.instructor.courses.sendInviteToTutors(course_nm))
}

// --- Exams ---

export async function fetchInstructorExamsIndex() {
    return withInstructorClient((c) => c.instructor.exams.index())
}

export async function fetchInstructorExamsArchived() {
    return withInstructorClient((c) => c.instructor.exams.getArchived())
}

export async function fetchInstructorExam(exam_nm: string) {
    return withInstructorClient((c) => c.instructor.exams.get(exam_nm))
}

export async function fetchInstructorExamProblems(exam_nm: string) {
    return withInstructorClient((c) => c.instructor.exams.getProblems(exam_nm))
}

export async function fetchInstructorExamStudents(exam_nm: string) {
    return withInstructorClient((c) => c.instructor.exams.getStudents(exam_nm))
}

export async function fetchInstructorExamStatistics(exam_nm: string) {
    return withInstructorClient((c) => c.instructor.exams.getStatistics(exam_nm))
}

export async function fetchInstructorExamRanking(exam_nm: string) {
    return withInstructorClient((c) => c.instructor.exams.getRanking(exam_nm))
}

export async function instructorExamCreate(data: InstructorExamCreation) {
    return withInstructorClient((c) => c.instructor.exams.create(data))
}

export async function instructorExamUpdate(data: InstructorExamUpdate) {
    return withInstructorClient((c) => c.instructor.exams.update(data))
}

export async function instructorExamRemove(exam_nm: string) {
    return withInstructorClient((c) => c.instructor.exams.remove(exam_nm))
}

export async function instructorExamArchive(exam_nm: string) {
    return withInstructorClient((c) => c.instructor.exams.archive(exam_nm))
}

export async function instructorExamUnarchive(exam_nm: string) {
    return withInstructorClient((c) => c.instructor.exams.unarchive(exam_nm))
}

export async function instructorExamUpdateDocuments(data: { exam_nm: string; document_nms: string[] }) {
    return withInstructorClient((c) => c.instructor.exams.updateDocuments(data))
}

export async function instructorExamUpdateCompilers(data: { exam_nm: string; compiler_ids: string[] }) {
    return withInstructorClient((c) => c.instructor.exams.updateCompilers(data))
}

export async function instructorExamUpdateProblems(data: { exam_nm: string; problems: InstructorExamProblem[] }) {
    return withInstructorClient((c) => c.instructor.exams.updateProblems(data))
}

export async function instructorExamUpdateStudents(data: { exam_nm: string; students: InstructorExamStudent[] }) {
    return withInstructorClient((c) => c.instructor.exams.updateStudents(data))
}

export async function instructorExamGetSubmissions(data: {
    exam_nm: string
    options: InstructorExamSubmissionsOptions
}) {
    return withInstructorClient((c) => c.instructor.exams.getSubmissions(data))
}

export async function instructorExamGetSubmissionsPack(data: {
    exam_nm: string
    options: InstructorExamSubmissionsOptions
}) {
    return withInstructorClient((c) => c.instructor.exams.getSubmissionsPack(data))
}

// --- Problems ---

export async function fetchInstructorOwnProblems() {
    return withInstructorClient((c) => c.instructor.problems.getOwnProblems())
}

export async function fetchInstructorAllSharingSettings() {
    return withInstructorClient((c) => c.instructor.problems.getAllSharingSettings())
}

export async function fetchInstructorAllAlerts() {
    return withInstructorClient((c) => c.instructor.problems.getAllAlerts())
}

export async function fetchInstructorSharingSettings(problem_nm: string) {
    return withInstructorClient((c) => c.instructor.problems.getSharingSettings(problem_nm))
}

export async function instructorProblemSetSharingSettings(data: SharingSettings) {
    return withInstructorClient((c) => c.instructor.problems.setSharingSettings(data))
}

export async function instructorProblemShareWith(data: ShareWithInp) {
    return withInstructorClient((c) => c.instructor.problems.shareWith(data))
}

export async function fetchInstructorAnonymousSubmissions(problem_nm: string) {
    return withInstructorClient((c) => c.instructor.problems.getAnonymousSubmissions(problem_nm))
}

export async function fetchInstructorProblemPopularityBuckets() {
    return withInstructorClient((c) => c.instructor.problems.getProblemPopularityBuckets())
}

export async function fetchInstructorProblemDownload(problem_nm: string) {
    return withInstructorClient((c) => c.instructor.problems.download(problem_nm))
}

export async function instructorProblemCreate(passcode: string, ifile: File) {
    return withInstructorClient((c) => c.instructor.problems.create(passcode, ifile))
}

export async function instructorProblemUpdate(problem_nm: string, ifile: File) {
    return withInstructorClient((c) => c.instructor.problems.update(problem_nm, ifile))
}

export async function instructorProblemSetDeprecation(data: Deprecation) {
    return withInstructorClient((c) => c.instructor.problems.setDeprecation(data))
}

export async function instructorProblemRemove(problem_nm: string) {
    return withInstructorClient((c) => c.instructor.problems.remove(problem_nm))
}

// --- Cross-domain (read-only tables / problems) ---

export async function fetchAllAbstractProblems() {
    return withInstructorClient((c) => c.problems.getAllAbstractProblems())
}

export async function fetchAbstractProblemSuppl(problem_nm: string) {
    return withInstructorClient((c) => c.problems.getAbstractProblemSuppl(problem_nm))
}

export async function fetchManyAbstractProblemSuppl(problem_nms: string) {
    return withInstructorClient((c) => c.problems.getManyAbstractProblemSuppl(problem_nms))
}

export async function instructorSemanticSearch(query: string) {
    return withInstructorClient((c) => c.problems.semanticSearch({ query, limit: 50 }))
}

export async function instructorFullTextSearch(query: string) {
    return withInstructorClient((c) => c.problems.fullTextSearch({ query, limit: 50 }))
}

export async function fetchAbstractProblems(problem_nms: string) {
    return withInstructorClient((c) => c.problems.getAbstractProblems(problem_nms))
}

export async function fetchAbstractProblem(problem_nm: string) {
    return withInstructorClient((c) => c.problems.getAbstractProblem(problem_nm))
}

export async function fetchProblem(problem_id: string) {
    return withInstructorClient((c) => c.problems.getProblem(problem_id))
}

export async function fetchProblemSuppl(problem_id: string) {
    return withInstructorClient((c) => c.problems.getProblemSuppl(problem_id))
}

export async function fetchPdfStatement(problem_id: string) {
    return withInstructorClient((c) => c.problems.getPdfStatement(problem_id))
}

export async function fetchHtmlStatement(problem_id: string) {
    return withInstructorClient((c) => c.problems.getHtmlStatement(problem_id))
}

export async function fetchMarkdownStatement(problem_id: string) {
    return withInstructorClient((c) => c.problems.getMarkdownStatement(problem_id))
}

export async function fetchTextStatement(problem_id: string) {
    return withInstructorClient((c) => c.problems.getTextStatement(problem_id))
}

export async function fetchTablesCompilers() {
    return withInstructorClient((c) => c.tables.getCompilers())
}

export async function fetchTablesLanguages() {
    return withInstructorClient((c) => c.tables.getLanguages())
}

export async function fetchMiscAvatarPacks() {
    return withInstructorClient((c) => c.misc.getAvatarPacks())
}

export async function fetchMiscExamIcons() {
    return withInstructorClient((c) => c.misc.getExamIcons())
}

export async function fetchMiscHexColors() {
    return withInstructorClient((c) => c.misc.getHexColors())
}

export async function fetchInstructorApiUrl() {
    return process.env.JUTGE_API_URL ?? 'https://api.jutge.org/api'
}

export async function fetchInstructorProblemTableRows() {
    const ownProblems = await fetchInstructorOwnProblems()
    const ownProblemsSharingSettings = await fetchInstructorAllSharingSettings()
    const allAlerts = await fetchInstructorAllAlerts()
    const abstractProblems = await fetchAbstractProblems(ownProblems.join(','))
    const sharingByProblem: Record<string, SharingSettings> = Object.fromEntries(
        ownProblemsSharingSettings.map((s) => [s.problem_nm, s]),
    )
    const alertsByProblem: Record<string, ProblemAlerts> = Object.fromEntries(
        allAlerts.map((alerts) => [alerts.problem_nm, alerts]),
    )

    function buildTitle(problem_nm: string) {
        const problems = Object.values(abstractProblems[problem_nm].problems)
        return problems.map((problem) => problem.title).join(' / ')
    }

    return ownProblems.map((problem_nm) => {
        const abstractProblem = abstractProblems[problem_nm]
        const sharing = sharingByProblem[problem_nm]
        const alerts = alertsByProblem[problem_nm]
        return {
            problem_nm,
            title: buildTitle(abstractProblem.problem_nm),
            iconUrl: problemIconUrl(abstractProblem.icon),
            created_at: abstractProblem.created_at,
            updated_at: abstractProblem.updated_at,
            deprecated: abstractProblem.deprecation !== null,
            languages: mapmap(abstractProblem.problems, (_problem_id, problem) => problem.language_id),
            passcode: sharing?.passcode === null,
            shared_testcases: sharing?.shared_testcases ?? false,
            shared_solutions: sharing?.shared_solutions ?? false,
            checked: Object.values(abstractProblem.problems).every((problem) => problem.checked !== 0),
            se_count: alerts?.se_count ?? 0,
            ie_count: alerts?.ie_count ?? 0,
            abstractProblems,
        }
    })
}

// --- JutgeAI ---

export async function fetchJutgeaiSupportedModels() {
    return withInstructorClient((c) => c.instructor.jutgeai.supportedModels())
}

export async function fetchJutgeaiLlmUsage() {
    return withInstructorClient((c) => c.instructor.jutgeai.getLlmUsage())
}

export async function jutgeaiChat(data: ChatPrompt) {
    return withInstructorClient((c) => c.instructor.jutgeai.chat(data))
}

export async function jutgeaiChatMessages(model: string, messages: ChatMessage[]): Promise<{ id: string }> {
    return jutgeaiChat({
        model,
        label: 'chat',
        messages,
        addUsage: true,
    })
}

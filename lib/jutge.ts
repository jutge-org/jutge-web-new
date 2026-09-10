'use client'

import { JutgeApiClient } from './jutge_api_client'

const jutge = new JutgeApiClient()
jutge.JUTGE_API_URL = process.env.NEXT_PUBLIC_JUTGE_API_URL || 'https://api.jutge.org/api'

jutge.clientTTLs.set('misc.getAvatarPacks', 3600)
jutge.clientTTLs.set('misc.getExamIcons', 3600)
jutge.clientTTLs.set('misc.getDemosForCompiler', 3600)
jutge.clientTTLs.set('tables.get', 3600)
jutge.clientTTLs.set('tables.getLanguages', 3600)
jutge.clientTTLs.set('tables.getCountries', 3600)
jutge.clientTTLs.set('tables.getCompilers', 3600)
jutge.clientTTLs.set('tables.getDrivers', 3600)
jutge.clientTTLs.set('tables.getVerdicts', 3600)
jutge.clientTTLs.set('tables.getProglangs', 3600)
jutge.clientTTLs.set('tables.getTimezones', 3600)
jutge.clientTTLs.set('courses.indexPublic', 300)

jutge.clientTTLs.set('problems.getAllAbstractProblems', 3600)
jutge.clientTTLs.set('problems.getAllAbstractProblemsRaw', 3600)
jutge.clientTTLs.set('problems.getSomeAbstractProblems', 3600)
jutge.clientTTLs.set('problems.getAbstractProblem', 3600)
jutge.clientTTLs.set('problems.getProblem', 3600)
jutge.clientTTLs.set('problems.getProblemSuppl', 3600)
jutge.clientTTLs.set('problems.getSampleTestcases', 3600)
jutge.clientTTLs.set('problems.getPublicTestcases', 3600)
jutge.clientTTLs.set('problems.getHtmlStatement', 3600)
jutge.clientTTLs.set('problems.getShortHtmlStatement', 3600)
jutge.clientTTLs.set('problems.getMarkdownStatement', 3600)
jutge.clientTTLs.set('problems.getShortMarkdownStatement', 3600)
jutge.clientTTLs.set('problems.getTextStatement', 3600)
jutge.clientTTLs.set('problems.getShortTextStatement', 3600)
jutge.clientTTLs.set('problems.getTemplates', 3600)
jutge.clientTTLs.set('student.profile.get', 600)

export default jutge

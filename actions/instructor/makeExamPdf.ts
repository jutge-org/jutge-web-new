'use server'

import { exec } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { nanoid } from 'nanoid'
import util from 'util'
import { z } from 'zod'
import { JutgeApiClient } from '@/lib/jutge_api_client'

const execAsync = util.promisify(exec)

const zMakeExamPdfData = z.object({
    exam_nm: z.string(),
    token: z.string(),
    extra: z.string(),
})

export async function makeExamPdf(data: { exam_nm: string; token: string; extra: string }): Promise<Blob> {
    zMakeExamPdfData.parse(data)

    const jutge = new JutgeApiClient()
    jutge.userAgent = 'web-new'
    jutge.meta = { token: data.token, user_uid: 'NOT IMPORTANT' }

    const profile = await jutge.student.profile.get()
    if (!profile.instructor) {
        throw new Error('Forbidden')
    }

    const exam = await jutge.instructor.exams.get(data.exam_nm)
    if (!exam) throw new Error(`Exam ${data.exam_nm} not found`)

    const tmp = `/tmp/open-jutge/${nanoid()}`
    await execAsync(`mkdir -p ${tmp}`)
    const pdfs: string[] = []

    for (const examProblem of exam.problems) {
        const abstractProblem = await jutge.problems.getAbstractProblem(examProblem.problem_nm)
        for (const problem_id in abstractProblem.problems) {
            try {
                const download = await jutge.problems.getPdfStatement(problem_id)
                const path = `${tmp}/${problem_id}.pdf`
                await writeFile(path, download.data)
                pdfs.push(problem_id)
            } catch (error) {
                // TODO: report error to the user
                console.error(`Error downloading problem ${problem_id}:`, error)
            }
        }
    }

    let mdProblems = ''
    for (const examProblem of exam.problems) {
        mdProblems += `* **${examProblem.caption}:**\n`
        const abstractProblem = await jutge.problems.getAbstractProblem(examProblem.problem_nm)
        for (const problem_id in abstractProblem.problems) {
            mdProblems += `  - [\`${problem_id}\`](https://jutge.org/problems/${problem_id}): ${abstractProblem.problems[problem_id].title}\n`
        }
        mdProblems += `\n\n`
    }

    const markdown = `---
mainfont: "Helvetica"
fontsize: 12pt
colorlinks: true
geometry: a4paper
---

## ${exam.course?.title}

# ${exam.title}

${exam.description}

${mdProblems}

---

${data.extra}

    `

    await writeFile(`${tmp}/cover.md`, markdown)
    await execAsync(`pandoc --variable mainfont="Palatino" ${tmp}/cover.md -o ${tmp}/cover.pdf`)
    pdfs.unshift('cover')

    await execAsync(
        `gs -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -sOutputFile=${tmp}/exam.pdf ${pdfs.map((pdf) => `${tmp}/${pdf}.pdf`).join(' ')}`,
    )

    const buffer = await readFile(`${tmp}/exam.pdf`)
    const blob = new Blob([buffer], { type: 'application/pdf' })

    await execAsync(`rm -rf ${tmp}`)

    return blob
}

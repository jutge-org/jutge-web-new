'use client'

import {
    fetchAbstractProblems,
    fetchInstructorExam,
    fetchInstructorExamStatistics,
    fetchMiscHexColors,
} from '@/lib/instructor/client'
import SimpleSpinner from '@/components/administrator/SimpleSpinner'
import { Warning } from '@/components/instructor/Warning'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { getProblemTitle } from '@/lib/instructor/problems'
import type { Dict } from '@/lib/instructor/utils'
import type {
    AbstractProblem,
    ColorMapping,
    Distribution,
    ExamStatistics,
    InstructorExam,
    InstructorExamProblem,
    Profile,
} from '@/lib/jutge_api_client'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { ChartBarDecreasingIcon, ChartPieIcon, TableIcon } from 'lucide-react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { JSX, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, Pie, PieChart, XAxis, YAxis } from 'recharts'

dayjs.extend(duration)

type ExamStatisticsViewProps = {
    profile: Profile
}

export function ExamStatisticsView({ profile }: ExamStatisticsViewProps) {
    const { exam_nm } = useParams<{ exam_nm: string }>()
    const [exam, setExam] = useState<InstructorExam | null>(null)
    const [statistics, setStatistics] = useState<ExamStatistics | null>(null)
    const [abstractProblems, setAbstractProblems] = useState<Dict<AbstractProblem> | null>(null)
    const [colors, setColors] = useState<ColorMapping | null>(null)

    useEffect(() => {
        async function fetchData() {
            const exam = await fetchInstructorExam(exam_nm)
            const statistics = await fetchInstructorExamStatistics(exam_nm)
            const problem_nms = exam.problems.map((problem) => problem.problem_nm).join(',')
            const allAbstractProblems = await fetchAbstractProblems(problem_nms)
            const colors = await fetchMiscHexColors()

            setExam(exam)
            setStatistics(statistics)
            setAbstractProblems(allAbstractProblems)
            setColors(colors)
        }
        fetchData()
    }, [exam_nm])

    if (exam === null || statistics === null || abstractProblems === null || colors === null) {
        return <SimpleSpinner />
    }

    if (!exam.time_start) {
        return <Warning>Exam has not started yet.</Warning>
    }

    const submissions = (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {exam.problems.map((problem) => (
                <div key={problem.problem_nm}>
                    <MyCard
                        title={<ProblemTitle profile={profile} problem={problem} abstractProblems={abstractProblems} />}
                    >
                        <MyPieChart
                            data={statistics.submissions[problem.problem_nm]}
                            cathegory="verdicts"
                            colors={colors}
                        />
                    </MyCard>
                </div>
            ))}
            <div className="sm:col-span-2">
                <MyCard title="Summary">
                    <MySummaryChart data={statistics.submissions} cathegory="verdicts" colors={colors} exam={exam} />
                </MyCard>
            </div>
        </div>
    )

    const statuses = (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {exam.problems.map((problem) => (
                <div key={problem.problem_nm}>
                    <MyCard
                        title={<ProblemTitle profile={profile} problem={problem} abstractProblems={abstractProblems} />}
                    >
                        <MyPieChart
                            data={statistics.statuses[problem.problem_nm]}
                            cathegory="statuses"
                            colors={colors}
                        />
                    </MyCard>
                </div>
            ))}
            <div className="sm:col-span-2">
                <MyCard title="Summary">
                    <MySummaryChart data={statistics.statuses} cathegory="statuses" colors={colors} exam={exam} />
                </MyCard>
            </div>
        </div>
    )

    const timeline = (
        <MyCard title={<></>}>
            <MyTimelineChart data={statistics.timeline} colors={colors} />
        </MyCard>
    )

    const compilers = (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {exam.problems.map((problem) => (
                <div key={problem.problem_nm}>
                    <MyCard
                        title={<ProblemTitle profile={profile} problem={problem} abstractProblems={abstractProblems} />}
                    >
                        <MyPieChart
                            data={statistics.compilers[problem.problem_nm]}
                            cathegory="compilers"
                            colors={colors}
                        />
                    </MyCard>
                </div>
            ))}
            <div className="sm:col-span-2">
                <MyCard title="Summary">
                    <MySummaryChart data={statistics.compilers} cathegory="compilers" colors={colors} exam={exam} />
                </MyCard>
            </div>
        </div>
    )

    const proglangs = (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {exam.problems.map((problem) => (
                <div key={problem.problem_nm}>
                    <MyCard
                        title={<ProblemTitle profile={profile} problem={problem} abstractProblems={abstractProblems} />}
                    >
                        <MyPieChart
                            data={statistics.proglangs[problem.problem_nm]}
                            cathegory="proglangs"
                            colors={colors}
                        />
                    </MyCard>
                </div>
            ))}
            <div className="sm:col-span-2">
                <MyCard title="Summary">
                    <MySummaryChart data={statistics.proglangs} cathegory="proglangs" colors={colors} exam={exam} />
                </MyCard>
            </div>
        </div>
    )

    return (
        <Tabs defaultValue="submissions" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                <TabsTrigger value="statuses">Statuses</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="compilers">Compilers</TabsTrigger>
                <TabsTrigger value="proglangs">Proglangs</TabsTrigger>
            </TabsList>
            <TabsContent value="submissions">{submissions}</TabsContent>
            <TabsContent value="statuses">{statuses}</TabsContent>
            <TabsContent value="timeline">{timeline}</TabsContent>
            <TabsContent value="compilers">{compilers}</TabsContent>
            <TabsContent value="proglangs">{proglangs}</TabsContent>
        </Tabs>
    )
}

type MySummaryChartProps = {
    data: Dict<Distribution>
    cathegory: string
    colors: ColorMapping
    exam: InstructorExam
}

function MySummaryChart(props: MySummaryChartProps) {
    const [chartVisible, setChartVisible] = useState(true)

    const captions: Dict<string> = {}
    for (const problem of props.exam.problems) {
        captions[problem.problem_nm] = problem.caption || problem.problem_nm
    }

    const chartData: Dict<string | number>[] = []
    const chartConfig: Dict<{ label: string }> = {}

    for (const [problem_nm, distribution] of Object.entries(props.data)) {
        const item: Dict<string | number> = { problem_nm: captions[problem_nm] }
        for (const [key, value] of Object.entries(distribution)) {
            item[key] = value
            chartConfig[key] = {
                label: key,
            }
        }
        chartData.push(item)
    }

    const chart = (
        <ChartContainer config={chartConfig} className="h-93 w-full">
            <BarChart data={chartData} layout="vertical">
                <CartesianGrid horizontal={false} vertical={false} />
                <YAxis dataKey="problem_nm" type="category" tickLine={false} axisLine={false} />
                <XAxis type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                {Object.keys(chartConfig).map((key, index) => (
                    <Bar key={index} dataKey={key} fill={color(key, props.cathegory, props.colors)} stackId="a">
                        <LabelList
                            formatter={() => key}
                            dataKey={key}
                            position="insideLeft"
                            offset={8}
                            className="fill-[hsl(var(--background))]"
                            fontSize={12}
                        />
                    </Bar>
                ))}
            </BarChart>
        </ChartContainer>
    )

    const table = (
        <ScrollArea className="h-93 w-full">
            <Table>
                <TableBody>
                    {props.exam.problems.flatMap((problem) => {
                        const distribution = props.data[problem.problem_nm]
                        if (!distribution) {
                            return []
                        }
                        const caption = captions[problem.problem_nm]
                        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)
                        return Object.entries(distribution)
                            .sort((a, b) => b[1] - a[1])
                            .map(([key, count]) => (
                                <TableRow key={`${problem.problem_nm}-${key}`}>
                                    <TableCell>{caption}</TableCell>
                                    <TableCell>{key}</TableCell>
                                    <TableCell className="text-end">{count}</TableCell>
                                    <TableCell className="text-end">
                                        {total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'}%
                                    </TableCell>
                                </TableRow>
                            ))
                    })}
                </TableBody>
            </Table>
        </ScrollArea>
    )

    return (
        <>
            {chartVisible ? chart : table}
            <ToggleGroup
                type="single"
                onValueChange={(value) => setChartVisible(value === 'pie')}
                className="mx-auto mb-2"
                defaultValue="pie"
            >
                <ToggleGroupItem value={'pie'} aria-label="Toggle chart">
                    <ChartBarDecreasingIcon className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value={'table'} aria-label="Toggle table">
                    <TableIcon className="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </>
    )
}

type Bucket = {
    minute: number | string
    ok: number
    ko: number
}

type MyTimelineChartProps = {
    data: Bucket[]
    colors: ColorMapping
}

function MyTimelineChart(props: MyTimelineChartProps) {
    const chartData = props.data.map((bucket) => ({
        ...bucket,
        minute: bucket.minute.toString(),
    }))

    const chartConfig = {
        ok: {
            label: 'OK',
            color: color('OK', 'statuses', props.colors),
        },
        ko: {
            label: 'KO',
            color: color('KO', 'statuses', props.colors),
        },
    } satisfies ChartConfig

    return (
        <ChartContainer config={chartConfig} className="h-75 w-full">
            <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="minute"
                    tickLine={false}
                    tickMargin={0}
                    axisLine={false}
                    tickFormatter={(value) => dayjs.duration(Number(value), 'minutes').format('HH:mm')}
                />
                <YAxis tickLine={false} tickMargin={0} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="ko" fill="var(--color-ko)" radius={[0, 0, 4, 4]} stackId="a" />
                <Bar dataKey="ok" fill="var(--color-ok)" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
        </ChartContainer>
    )
}

type MyPieChartProps = {
    data: Distribution
    cathegory: string
    colors: ColorMapping
}

function MyPieChart(props: MyPieChartProps) {
    const data = structuredClone(props.data)

    const [chartVisible, setChartVisible] = useState(true)

    let total = 0
    for (const key of Object.keys(data)) {
        total += data[key]
    }
    for (const key of Object.keys(data)) {
        data[key] = Math.round((data[key] / total) * 1000) / 10
    }

    const minimum = 5

    const chartConfig: Record<string, { label: string; color?: string }> = {
        value: {
            label: 'Percentage',
        },
    }

    let single = ''
    let differents = 0
    let others = 0
    for (const key of Object.keys(data)) {
        if (data[key] < minimum) {
            others += data[key]
            differents += 1
            single = key
        } else {
            chartConfig[key] = {
                label: key,
                color: color(key, props.cathegory, props.colors),
            }
        }
    }

    const chartData = Object.entries(data)
        .filter(([, value]) => value > minimum)
        .map(([key, value]) => ({
            label: key,
            value,
            fill: chartConfig[key].color!,
        }))
    if (others > 0) {
        const label = differents === 1 ? single : 'Others'
        chartData.push({
            label: label,
            value: others,
            fill: 'hsl(var(--chart-5))',
        })
        chartConfig[label] = {
            label: label,
            color: 'hsl(var(--chart-5))',
        }
    }

    const chart = (
        <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-100 [&_.recharts-text]:fill-background"
        >
            <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
                <Pie data={chartData} dataKey="value" innerRadius={60}>
                    <LabelList
                        dataKey="label"
                        className="fill-background"
                        stroke="none"
                        fontSize={11}
                        formatter={(value) => String(chartConfig[String(value)]?.label ?? value)}
                    />
                </Pie>
            </PieChart>
        </ChartContainer>
    )

    const table = (
        <ScrollArea className="h-[305] w-full">
            <Table>
                <TableBody>
                    {Object.entries(data)
                        .sort((a, b) => b[1] - a[1])
                        .map(([key, value]) => (
                            <TableRow key={key}>
                                <TableCell>{key}</TableCell>
                                <TableCell className="text-end">{props.data[key]}</TableCell>
                                <TableCell className="text-end">{value.toFixed(1)}%</TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </ScrollArea>
    )

    return (
        <>
            {chartVisible ? chart : table}
            <ToggleGroup
                type="single"
                onValueChange={(value) => setChartVisible(value === 'pie')}
                className="mx-auto mb-2"
                defaultValue="pie"
            >
                <ToggleGroupItem value={'pie'} aria-label="Toggle pie chart">
                    <ChartPieIcon className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value={'table'} aria-label="Toggle table">
                    <TableIcon className="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </>
    )
}

type MyCardProps = {
    title: string | JSX.Element
    subtitle?: string | JSX.Element
    children: React.ReactNode
}

function MyCard(props: MyCardProps) {
    return (
        <Card>
            <CardHeader className="p-4">
                <CardTitle>{props.title}</CardTitle>
                <CardDescription>{props.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="px-2 py-0">{props.children}</CardContent>
        </Card>
    )
}

type ProblemTitleProps = {
    profile: Profile
    problem: InstructorExamProblem
    abstractProblems: Dict<AbstractProblem>
}

function ProblemTitle(props: ProblemTitleProps) {
    return (
        <div className="flex flex-row gap-2">
            {props.problem.icon && (
                <Image
                    src={`https://jutge.org/img/examicons/${props.problem.icon}.svg`}
                    alt={props.problem.icon}
                    width={32}
                    height={32}
                    className="h-9 w-9"
                />
            )}
            <div className="flex flex-col gap-1">
                <div className="flex flex-row">
                    {props.problem.caption && <div className="">{props.problem.caption}&nbsp;·&nbsp;</div>}
                    {props.problem.problem_nm}
                </div>
                <div className="font-normal text-sm text-gray-500 line-clamp-1">
                    {getProblemTitle(props.profile, props.problem.problem_nm, props.abstractProblems)}
                </div>
            </div>
        </div>
    )
}

function color(key: string, cathegory: string, colors: ColorMapping) {
    const categoryColors = colors[cathegory as keyof ColorMapping]
    if (!categoryColors || !(key in categoryColors)) {
        return 'blue'
    }
    return categoryColors[key as keyof typeof categoryColors]
}

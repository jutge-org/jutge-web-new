import { ProblemsList } from '@/components/problems/ProblemsList'

export default function ProblemsLoading() {
    return <ProblemsList problems={[]} languages={{}} showAdvancedSearch showHelp loading />
}

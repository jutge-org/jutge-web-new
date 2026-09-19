import type { Award, BriefAward, JutgeApiClient } from "@/lib/jutge_api_client"

export async function fetchFullAwards(
  client: JutgeApiClient,
  brief: Record<string, BriefAward>,
): Promise<Record<string, Award> | undefined> {
  const ids = Object.keys(brief)
  if (ids.length === 0) return undefined

  const pairs = await Promise.all(
    ids.map(async (id) => [id, await client.student.awards.get(id)] as const),
  )
  return Object.fromEntries(pairs)
}

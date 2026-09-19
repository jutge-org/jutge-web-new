export function jutgeProblemUrl(problemId: string): string {
    return `/problems/${problemId}`
}

export function jutgeAwardUrl(awardId: string): string {
    return `/awards/${awardId}`
}

/**
 * Jutge award YouTube ids that are missing, removed, or require login — do not
 * surface "Watch on YouTube" for these (verified 2025-06).
 */
export const UNREACHABLE_JUTGE_YOUTUBE_IDS = new Set([
  "ZhWSugegQjA",
  "wZZ7oFKsKzY",
  "ky3OcJR-5N4",
  "WlBiLNN1NhQ",
  "q5r3qNgB5v8",
  "pMGHBL2A17Q",
])

/** Extract a video id from API values (bare id or youtu.be / youtube.com URL). */
export function parseJutgeYoutubeVideoId(youtube: string): string | null {
  const trimmed = youtube.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      if (url.hostname.includes("youtu.be")) {
        const id = url.pathname.replace(/^\//, "").split("/")[0]
        return id || null
      }
      if (url.hostname.includes("youtube.com")) {
        return url.searchParams.get("v")
      }
    } catch {
      return null
    }
    return null
  }

  return trimmed
}

/** Return the API youtube value when embeddable; otherwise null. */
export function resolveAwardYoutube(
  youtube: string | null | undefined,
): string | null {
  if (!youtube) return null
  const id = parseJutgeYoutubeVideoId(youtube)
  if (!id || UNREACHABLE_JUTGE_YOUTUBE_IDS.has(id)) return null
  return youtube
}

/** Normalize API YouTube values (full URL or bare video id) to a watch URL. */
export function jutgeYoutubeUrl(youtube: string): string {
  const trimmed = youtube.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://www.youtube.com/watch?v=${encodeURIComponent(trimmed)}`
}

export function jutgeAwardIconUrl(icon: string, type?: string): string {
  if (/^https?:\/\//i.test(icon)) return icon

  let path = icon.startsWith("/") ? icon.slice(1) : icon
  if (path.startsWith("awards/")) {
    return `https://jutge.org/${path}`
  }

  // Numeric catalog ids (e.g. "25") live under a type folder (e.g. funs/25.png).
  // Named icons (e.g. c3po.png, little-brown-hamster.png) sit at /awards/ root.
  const stem = path.replace(/\.[a-z]+$/i, "")
  if (type && !path.includes("/") && /^\d+$/.test(stem)) {
    path = `${type}/${path}`
  }

  if (!/\.[a-z]+$/i.test(path)) {
    path = `${path}.png`
  }

  return `https://jutge.org/awards/${path}`
}

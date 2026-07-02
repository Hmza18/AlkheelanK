// Image search for the quiz editor, proxied through Openverse (openly licensed
// images, no API key needed). Proxying server-side keeps the client free of
// CORS issues and lets us rate-limit per IP like everything else.

const OPENVERSE_URL = "https://api.openverse.org/v1/images/";

export async function searchImages(query) {
  const q = String(query || "").trim().slice(0, 100);
  if (!q) return { error: "Type something to search for." };

  const params = new URLSearchParams({
    q,
    page_size: "12",
    mature: "false",
  });

  let res;
  try {
    res = await fetch(`${OPENVERSE_URL}?${params}`, {
      headers: { "User-Agent": "Kheelan quiz editor (https://alkheelan.xyz)" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { error: "Image search is unreachable right now — try again in a moment." };
  }
  if (!res.ok) {
    return { error: "Image search is busy — try again in a moment." };
  }

  const body = await res.json();
  const results = (body.results || [])
    .filter((r) => typeof r.url === "string" && r.url.startsWith("https://"))
    .map((r) => ({
      id: r.id,
      url: r.url,
      thumbnail: r.thumbnail && String(r.thumbnail).startsWith("https://") ? r.thumbnail : r.url,
      title: r.title || "",
      creator: r.creator || "",
      license: r.license || "",
    }));
  return { data: results };
}

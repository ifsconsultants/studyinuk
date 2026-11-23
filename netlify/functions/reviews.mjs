// Returns the latest Google reviews for the IFS Vizag business profile.
// Needs two environment variables in Netlify (Site configuration → Environment variables):
//   GOOGLE_PLACES_API_KEY  – a Google Cloud API key with "Places API (New)" enabled
//   GOOGLE_PLACE_ID        – the Place ID of the IFS Vizag Google Business Profile
// Google returns at most 5 reviews per request; they are sorted newest first here.

export const config = { path: "/api/reviews" };

const CACHE = "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400";

function reply(status, body, cache = "no-store") {
  return Response.json(body, { status, headers: { "Cache-Control": cache } });
}

export default async function reviews(request) {
  if (request.method !== "GET") return reply(405, { reviews: [] });
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return reply(503, { reviews: [], error: "not_configured" });

  let res;
  try {
    res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews"
      },
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    return reply(502, { reviews: [] });
  }
  if (!res.ok) return reply(502, { reviews: [] });

  const place = await res.json();
  const list = (place.reviews || [])
    .map(r => ({
      author: r.authorAttribution?.displayName || "",
      authorUrl: r.authorAttribution?.uri || "",
      rating: r.rating || 0,
      text: r.originalText?.text || r.text?.text || "",
      date: r.publishTime || "",
      relativeTime: r.relativePublishTimeDescription || ""
    }))
    .filter(r => r.text)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return reply(200, {
    rating: place.rating || null,
    total: place.userRatingCount || null,
    url: place.googleMapsUri || "",
    reviews: list
  }, CACHE);
}

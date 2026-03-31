export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const ALLOWED_ORIGINS = ["https://train.jeffou.io", "http://localhost:5173"];
    const ALLOWED_ORIGIN = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(ALLOWED_ORIGIN),
      });
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, "");
    const mbtaUrl = `https://api-v3.mbta.com${path}${url.search}`;

    try {
      const mbtaResponse = await fetch(mbtaUrl, {
        headers: {
          "x-api-key": env.MBTA_API_KEY,
          "Accept": "application/vnd.api+json",
        },
      });

      const data = await mbtaResponse.text();

      return new Response(data, {
        status: mbtaResponse.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=10", // cache 10s at edge
          ...corsHeaders(ALLOWED_ORIGIN),
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Failed to fetch from MBTA" }), {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(ALLOWED_ORIGIN),
        },
      });
    }
  },
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
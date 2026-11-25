import { createHmac, timingSafeEqual } from "node:crypto";
import { after, NextResponse, type NextRequest } from "next/server";
import { processWebhook, type InstagramWebhookPayload } from "@/lib/instagram/autoReply";

// Meta webhook endpoint for Instagram DMs. Point the Meta app's Instagram
// webhook callback URL at <site>/api/instagram/webhook. Full setup steps
// are in docs/instagram-dm-bot.md.
// https://developers.facebook.com/docs/instagram-platform/webhooks

// Verification handshake: Meta calls this once, when the callback URL is
// saved in the App Dashboard.
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  // Meta (user agent facebookexternalua) also sends plain GETs with no hub.*
  // params, apparently to check the URL is reachable. Answer them with 200
  // so the endpoint doesn't look unhealthy. This reveals nothing; only a
  // real handshake gets the challenge echoed back.
  if (!params.has("hub.mode")) return NextResponse.json({ ok: true });
  const expected = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
  if (expected && params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === expected) {
    return new NextResponse(params.get("hub.challenge") ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  // Records why a check failed without logging the token itself: only its
  // length and first 4 characters, which are enough to tell an empty, stale
  // or different token apart from the right one.
  const got = params.get("hub.verify_token") ?? "";
  console.warn(
    `instagram-webhook: GET rejected mode=${params.get("hub.mode") ?? "none"} ` +
      `params=[${[...params.keys()].join(",")}] tokenLen=${got.length} tokenStart=${got.slice(0, 4) || "none"} ` +
      `expectedSet=${!!expected} ua=${request.headers.get("user-agent") ?? "none"}`
  );
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const secret = process.env.INSTAGRAM_APP_SECRET;
  if (!secret) {
    console.error("instagram-webhook: INSTAGRAM_APP_SECRET is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // The signature covers the exact raw bytes Meta sent, so it has to be
  // checked before any JSON parsing.
  const raw = await request.text();
  if (!hasValidSignature(raw, request.headers.get("x-hub-signature-256"), secret)) {
    console.warn("instagram-webhook: rejected delivery with a bad signature (check INSTAGRAM_APP_SECRET)");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: InstagramWebhookPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Answer 200 right away and do the replying after the response is sent.
  // Meta retries deliveries that are slow or fail, and the bot drops those
  // duplicates by message ID anyway.
  after(() => processWebhook(payload));
  return NextResponse.json({ ok: true });
}

// The header looks like "sha256=<hex HMAC-SHA256 of the raw body>", keyed
// with the app secret. Compared in constant time.
function hasValidSignature(raw: string, header: string | null, secret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const received = Buffer.from(header.slice("sha256=".length), "hex");
  const expected = createHmac("sha256", secret).update(raw, "utf8").digest();
  return received.length === expected.length && timingSafeEqual(received, expected);
}

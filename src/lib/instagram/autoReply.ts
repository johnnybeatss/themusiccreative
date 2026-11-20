import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { formatEventDateTime, upcomingCutoffIso } from "@/lib/eventTimezone";
import { getAccessToken, getInstagramAccountId, sendTextMessage } from "./api";
import { BOT_SIGNATURE, matchRule, type ReplyContext } from "./replies";

// Decides whether and how to answer each incoming Instagram DM. Rules:
//  1. Each message is handled once. Meta redelivers webhooks, and mid is
//     the table's primary key, so duplicates are dropped.
//  2. If a team member replied to this person by hand in the last
//     HUMAN_PAUSE_MS, the bot stays quiet so it doesn't talk over a real
//     conversation.
//  3. The same canned reply (rule) goes to the same person at most once per
//     RULE_COOLDOWN_MS. That means one welcome a day, not one per message.
//  4. Only text messages get a reply. Shared posts, stickers, voice notes,
//     reactions and read receipts are left for a human.
const HUMAN_PAUSE_MS = 24 * 60 * 60 * 1000;
const RULE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const TABLE = "instagram_dm_messages";

// Only the fields this file reads. The full payload carries more.
type MessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    is_deleted?: boolean;
    is_unsupported?: boolean;
  };
};

export type InstagramWebhookPayload = {
  object?: string;
  entry?: { id?: string; messaging?: MessagingEvent[] }[];
};

export async function processWebhook(payload: InstagramWebhookPayload): Promise<void> {
  if (payload.object !== "instagram") return;
  const events = (payload.entry ?? []).flatMap((e) => e.messaging ?? []);
  if (events.length === 0) return;

  // Off by default, so deploying this code changes nothing until setup is
  // finished (docs/instagram-dm-bot.md).
  if (process.env.INSTAGRAM_AUTOREPLY_ENABLED !== "true") return;

  const supabase = createServiceClient();
  // One at a time, in order. A burst of messages from one person in the
  // same delivery then sees the reply already sent for the first one.
  for (const event of events) {
    try {
      await handleEvent(supabase, event);
    } catch (err) {
      console.error("instagram-dm:", err instanceof Error ? err.message : err);
    }
  }
}

async function handleEvent(supabase: SupabaseClient, event: MessagingEvent): Promise<void> {
  const msg = event.message;
  if (!msg?.mid || msg.is_deleted || msg.is_unsupported) return;

  if (msg.is_echo) {
    // A message the account itself sent. If it carries the bot signature it
    // was the bot's own reply, so ignore it. Otherwise a team member replied
    // by hand, which pauses the bot for this person (rule 2).
    const userId = event.recipient?.id;
    if (!userId || msg.text?.includes(BOT_SIGNATURE)) return;
    const { error } = await supabase
      .from(TABLE)
      .upsert({ mid: msg.mid, ig_user_id: userId, direction: "human" }, { onConflict: "mid", ignoreDuplicates: true });
    if (error) throw new Error(`record human reply failed: ${error.message}`);
    return;
  }

  const userId = event.sender?.id;
  if (!userId) return;

  // Rule 1: insert first. A row that comes back means this is the first
  // delivery; an empty result means Meta sent a duplicate.
  const { data: inserted, error: insertError } = await supabase
    .from(TABLE)
    .upsert({ mid: msg.mid, ig_user_id: userId, direction: "in" }, { onConflict: "mid", ignoreDuplicates: true })
    .select("mid");
  if (insertError) throw new Error(`record incoming failed: ${insertError.message}`);
  if (!inserted?.length) return;

  const text = msg.text?.trim();
  if (!text) return; // rule 4

  const since = new Date(Date.now() - Math.max(HUMAN_PAUSE_MS, RULE_COOLDOWN_MS)).toISOString();
  const { data: recent, error: recentError } = await supabase
    .from(TABLE)
    .select("direction, rule, created_at")
    .eq("ig_user_id", userId)
    .in("direction", ["bot", "human"])
    .gte("created_at", since);
  if (recentError) throw new Error(`recent lookup failed: ${recentError.message}`);

  const now = Date.now();
  const within = (iso: string, ms: number) => now - new Date(iso).getTime() < ms;
  if (recent?.some((r) => r.direction === "human" && within(r.created_at, HUMAN_PAUSE_MS))) return; // rule 2

  const rule = matchRule(text);
  if (recent?.some((r) => r.direction === "bot" && r.rule === rule.id && within(r.created_at, RULE_COOLDOWN_MS))) return; // rule 3

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL is not set; replies would contain broken links");

  const token = getAccessToken();
  if (!token) throw new Error("No Instagram access token (set INSTAGRAM_ACCESS_TOKEN)");
  const accountId = await getInstagramAccountId(token);

  const ctx: ReplyContext = {
    siteUrl,
    nextEvent: rule.needsNextEvent ? await getNextEvent(supabase) : null,
  };
  const messageId = await sendTextMessage(token, accountId, userId, `${rule.reply(ctx)}\n\n${BOT_SIGNATURE}`);

  const { error: logError } = await supabase
    .from(TABLE)
    .upsert({ mid: messageId, ig_user_id: userId, direction: "bot", rule: rule.id }, { onConflict: "mid", ignoreDuplicates: true });
  // The DM is already sent, so only log a failure here. The cost of losing
  // this row is at most one repeat of this reply later.
  if (logError) console.error("instagram-dm: record bot reply failed:", logError.message);
}

// Same "upcoming" cutoff as the homepage countdown and /events.
async function getNextEvent(supabase: SupabaseClient): Promise<ReplyContext["nextEvent"]> {
  const { data, error } = await supabase
    .from("events")
    .select("name, date, location")
    .gte("date", upcomingCutoffIso())
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("instagram-dm: next event lookup failed:", error.message);
    return null;
  }
  if (!data) return null;
  return { name: data.name, when: formatEventDateTime(data.date), location: data.location };
}

# Instagram DM auto-reply bot

This bot automatically replies to DMs sent to @themusiccreativefiu. It uses
Meta's official Instagram messaging API (**Instagram API setup with Unified
login**), which means webhooks plus the Send API, with no password sharing
and no scraping.
Unofficial bots that log in as the account break Instagram's Terms of Use
and can get the account restricted.

## How it behaves

| Situation | What the bot does |
|---|---|
| Someone DMs a message that matches a keyword (DJ booking, join, events, battles, submit, collab, opportunities, merch) | Replies with the matching link. The events reply includes the next upcoming event from Supabase. |
| A message that matches nothing | Sends a welcome with key links, **at most once per 24h per person** |
| The same topic again within 24h | Silent (each reply goes to the same person at most once per 24h) |
| A team member replied by hand in the last 24h | Silent, so a real conversation is never interrupted |
| Non-text DMs (shared posts, voice notes, stickers, reactions) | Silent, left for a human |
| Meta redelivers the same webhook | Ignored (dedupe on message ID) |

Every automated reply ends with `— TMC auto-reply 🤖`. That tells people
the reply is automated, and it is also how the bot recognizes its own
messages. Don't remove it from `BOT_SIGNATURE`.

To edit the reply copy and keywords, change `src/lib/instagram/replies.ts`.

## Code map

- `src/app/api/instagram/webhook/route.ts`: webhook verification (GET) and
  delivery (POST, HMAC-verified, answers 200 right away and processes the
  messages after responding)
- `src/lib/instagram/autoReply.ts`: decides whether and what to reply
- `src/lib/instagram/replies.ts`: keyword rules and reply copy
- `src/lib/instagram/api.ts`: Graph API client (graph.facebook.com)
- `supabase/migrations/0047_instagram_dm_bot.sql`: `instagram_dm_messages`
  (IDs only, no message text, service-role only). `0048` drops the unused
  `instagram_credentials` table that 0047 created.

## One-time setup

Since late Oct 2026, new Meta apps only get **"API setup with Unified
login"**. The older "API setup with Instagram login" isn't offered any more.
Meta's own docs for this flow couldn't be checked when this was written, so
the dashboard steps below come from other developers' reports. If a screen
differs, follow what the dashboard says.

**Requirements:** @themusiccreativefiu must be a **Professional account
(Business or Creator)**, with **"Allow access to messages"** turned on
(Instagram app → Settings → Messages and story replies → Message controls →
Connected tools). No Facebook Page is needed.

1. **Run the migrations.** Run `0047` and then `0048` in the Supabase SQL
   editor.
2. **Create the Meta app.** Pick the Instagram use case (manage messaging
   and content on Instagram).
3. **Connect a business portfolio.** This is mandatory for Unified login.
   Create one (e.g. "The Music Creative") and add the club's Instagram
   account to it as an asset.
4. **Create the token.** Go to Facebook Login for Business → Configurations
   → create a configuration with token type **System-user access token**,
   expiration **Never**, the club's Instagram account as the asset, and
   permissions including `instagram_basic` and `instagram_manage_messages`.
   Generate the token and copy it.
5. **Set the env vars in Vercel** (Production), then redeploy:
   - `INSTAGRAM_APP_SECRET`: App settings → Basic → **App secret**
   - `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`: any random string
   - `INSTAGRAM_ACCESS_TOKEN`: the token from step 4
   - `INSTAGRAM_ACCOUNT_ID` is optional; it's looked up automatically
   - Leave `INSTAGRAM_AUTOREPLY_ENABLED` unset for now
6. **Configure webhooks.** In the Instagram use case's webhook settings, set
   the callback URL to `https://<your-domain>/api/instagram/webhook` and
   the verify token to the value from step 5. Verify and save, then
   subscribe to **`messages`**, plus **`message_echoes`** if it's offered.
   The account itself also has to be subscribed:
   `POST https://graph.facebook.com/v26.0/<IG_ID>/subscribed_apps?subscribed_fields=messages`
   with the token (the dashboard may offer a toggle that does the same).
7. **Test.** Until App Review, only people with a role on the app get
   replies. Set `INSTAGRAM_AUTOREPLY_ENABLED=true`, redeploy, and DM the
   club account from a tester's account.
8. **Go live.** Request **Advanced Access** for `instagram_manage_messages`
   (and `instagram_basic`) through **App Review**. Meta may ask for
   **Business Verification** of the portfolio. Then switch the app to Live.

## Operations

- **Turn it off:** set `INSTAGRAM_AUTOREPLY_ENABLED` to anything other than
  `true` and redeploy. Webhooks are still accepted, but nothing is sent.
- **Token:** the system-user token doesn't expire, but it stops working if
  it's revoked, if the configuration is deleted, or if the Instagram account
  is removed from the portfolio. The logs then show `code 190` errors. To fix
  it, generate a new token (step 4), update the env var and redeploy.
- **Logs:** look in Vercel → Logs for entries starting with `instagram-dm:`.
- **Data:** `instagram_dm_messages` stores only Meta IDs, direction and
  timestamps, never message text. To clear old rows:
  `delete from instagram_dm_messages where created_at < now() - interval '90 days';`

## Known limitations

- **Duplicate replies:** if two DMs from one person arrive in *separate*
  webhook deliveries at the same instant, both can get a reply. This is rare
  and harmless.
- **Phrasing:** keyword matching is literal. Odd phrasings fall back to the
  welcome message, and the team handles anything nuanced. If the rules turn
  out too limiting, AI-written replies are possible later, but they add cost
  and the risk of wrong answers in the club's name.
- **Business Suite:** Meta Business Suite has built-in no-code Instagram
  automations (instant replies, FAQs). This bot exists because it can pull
  live site data (next event), link to the club's own forms, and step back
  when a human replies.

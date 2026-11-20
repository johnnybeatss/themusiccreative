# Instagram DM auto-reply bot

This bot automatically replies to DMs sent to @themusiccreativefiu. It uses
Meta's official **Instagram API with Instagram Login**, which means
webhooks plus the Send API, with no password sharing and no scraping.
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
- `src/lib/instagram/api.ts`: Send API and token refresh
- `src/app/api/cron/instagram-token-refresh/route.ts`: weekly token refresh
- `supabase/migrations/0047_instagram_dm_bot.sql`: `instagram_dm_messages`
  (IDs only, no message text) and `instagram_credentials`, both service-role only

## One-time setup

**Requirements:** @themusiccreativefiu must be a **Professional account
(Business or Creator)**. In the Instagram app: Settings → Account type and
tools. Also turn on **"Allow access to messages"** (Settings → Messages and
story replies → Message controls → Connected tools). Without that, the API
can't read or send DMs. Menu names change often, so check Meta's Help
Center if these have moved.

1. **Run the migration.** Run `supabase/migrations/0047_instagram_dm_bot.sql`
   in the Supabase SQL editor, the same way as the earlier migrations.
2. **Create a Meta app.** At developers.facebook.com → My Apps → Create
   App, pick the use case for managing messaging and content on Instagram,
   then open **Instagram → API setup with Instagram login**.
3. **Add the club account and generate a token.** Under "Generate access
   tokens", add @themusiccreativefiu and log in. Copy the token into
   `INSTAGRAM_ACCESS_TOKEN`.
4. **Set the env vars in Vercel** (Production), then redeploy:
   - `INSTAGRAM_APP_SECRET`: the *Instagram app secret* from that same page
   - `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`: any random string (`openssl rand -hex 32`)
   - `INSTAGRAM_ACCESS_TOKEN`: from step 3
   - Leave `INSTAGRAM_AUTOREPLY_ENABLED` unset for now
   - `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET`
     should already be set
5. **Configure webhooks.** On the same page, set the callback URL to
   `https://<your-domain>/api/instagram/webhook` and the verify token to the
   value from step 4. Then verify and save, and subscribe to the
   **`messages`** field. If the dashboard also offers `message_echoes`,
   subscribe to that too. Echoes are how the bot notices a team member
   replying by hand. Turn on the account's webhook subscription toggle
   next to the generated token.
6. **Test.** While the app is unpublished, only people with a role on the
   app (Admin, Developer, Tester under App roles) trigger webhooks and get
   replies. Set `INSTAGRAM_AUTOREPLY_ENABLED=true`, redeploy, and DM the club
   account from a tester's personal account.
7. **Go live.** To reply to *everyone*, the app needs **Advanced Access** for
   `instagram_business_basic` and `instagram_business_manage_messages`.
   That means submitting it for **App Review** (and Business Verification
   if Meta asks for it), then switching the app to Live. Meta's review
   usually wants a screencast of the bot working, plus a privacy policy URL
   (you can use `/privacy`).

## Operations

- **Turn it off:** set `INSTAGRAM_AUTOREPLY_ENABLED` to anything other than
  `true` and redeploy. Webhooks are still accepted, but nothing is sent.
- **Token:** the cron refreshes it every Wednesday at 14:00 UTC.
  A token that goes 60 days without a refresh dies, and the logs show
  `code 190` errors. To recover, generate a new token (step 3), update the
  env var, and run `delete from instagram_credentials;` so the new env
  token gets picked up.
- **Logs:** look in Vercel → Logs for entries starting with `instagram-dm:` and `instagram-token-refresh:`.
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

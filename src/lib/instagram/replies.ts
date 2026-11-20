// Canned DM replies. Edit the copy here; no other file needs to change.
//
// How matching works: rules are checked in order and the first one whose
// pattern matches the message (case-insensitive) wins. Nothing matched means
// the "welcome" fallback. Patterns use \b word boundaries so that "book"
// doesn't match inside "facebook". Put more specific rules first: join_team
// goes before join, and opportunities before join_team, so that "apply for
// the internship" gets the opportunities reply.
//
// Keep each reply short: these are DMs, and Instagram limits message length.

export type ReplyContext = {
  siteUrl: string;
  nextEvent: { name: string; when: string; location: string | null } | null;
};

export type ReplyRule = {
  id: string;
  pattern: RegExp;
  needsNextEvent?: boolean;
  reply: (ctx: ReplyContext) => string;
};

// Added to every automated reply. People can see it's automated, and it's
// how the webhook tells the bot's own echoed messages apart from a team
// member's manual reply (src/lib/instagram/autoReply.ts). Don't remove it.
export const BOT_SIGNATURE = "— TMC auto-reply 🤖";

export const RULES: ReplyRule[] = [
  {
    id: "dj_booking",
    pattern: /\b(dj|djs|book|booking|hire|gig)\b/i,
    reply: ({ siteUrl }) =>
      `Looking to book a DJ? Send us the details through our booking form and the team will get back to you: ${siteUrl}/dj-booking`,
  },
  {
    id: "opportunities",
    pattern: /\b(opportunity|opportunities|internship|internships|job|jobs)\b/i,
    reply: ({ siteUrl }) =>
      `We post internships, competitions, and other opportunities here: ${siteUrl}/opportunities`,
  },
  {
    id: "join_team",
    pattern: /\b(e-?board|exec|officer|leadership|join (the|your) team|apply|application)\b/i,
    reply: ({ siteUrl }) =>
      `Want to help run TMC? You can apply to join the team here: ${siteUrl}/join-team`,
  },
  {
    id: "join",
    pattern: /\b(join|joining|member|membership|sign ?up|get involved)\b/i,
    reply: ({ siteUrl }) =>
      `We'd love to have you! Join The Music Creative here: ${siteUrl}/join`,
  },
  {
    id: "battles",
    pattern: /\b(battle|battles|vote|voting)\b/i,
    reply: ({ siteUrl }) =>
      `Spotlight Battles, entries, and voting all live here: ${siteUrl}/battles`,
  },
  {
    id: "submit_track",
    pattern: /\b(submit|submission|feature me|my (track|beat|song|music)|send (you )?my)\b/i,
    reply: ({ siteUrl }) =>
      `Want your music featured? Submit your track here: ${siteUrl}/#submit-track`,
  },
  {
    id: "collab",
    pattern: /\b(collab|collabs|collaborate|collaboration)\b/i,
    reply: ({ siteUrl }) =>
      `Looking for people to work with? Check out the collab board: ${siteUrl}/collab`,
  },
  {
    id: "events",
    pattern: /\b(event|events|party|meeting|meetings|workshop|showcase|tonight)\b/i,
    needsNextEvent: true,
    reply: ({ siteUrl, nextEvent }) =>
      nextEvent
        ? `Our next event is ${nextEvent.name}: ${nextEvent.when}${nextEvent.location ? ` at ${nextEvent.location}` : ""}. Details and RSVP: ${siteUrl}/events`
        : `Nothing's on the calendar right now. Keep an eye on ${siteUrl}/events for what's next!`,
  },
  {
    id: "merch",
    pattern: /\b(merch|shirt|shirts|hoodie|hoodies)\b/i,
    reply: ({ siteUrl }) => `Merch updates live here: ${siteUrl}/merch`,
  },
];

export const WELCOME_RULE: ReplyRule = {
  id: "welcome",
  pattern: /.*/,
  reply: ({ siteUrl }) =>
    [
      "Hey, thanks for reaching out to The Music Creative! 🎶 Someone from the team will reply here soon. In the meantime:",
      `• Events: ${siteUrl}/events`,
      `• Join TMC: ${siteUrl}/join`,
      `• Book a DJ: ${siteUrl}/dj-booking`,
      `• Submit your music: ${siteUrl}/#submit-track`,
    ].join("\n"),
};

export function matchRule(text: string): ReplyRule {
  return RULES.find((r) => r.pattern.test(text)) ?? WELCOME_RULE;
}

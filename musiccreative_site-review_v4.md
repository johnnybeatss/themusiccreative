# Site review — Sept 28, 2026

Fresh look at the live site now that the rebrand, Posh integration, and everything else from the last few sessions is in. Ranked by impact vs. effort.

## Worth fixing soon

**Expired opportunity still showing.** "International Songwriting Competition (ISC) 2026" on `/opportunities` says "Deadline Sept 16" — that's already passed (today's the 28th). The auto-hide logic only kills postings 60 days after they're *added*, not based on the deadline in the text, so expired stuff can sit there looking current. Two ways to fix: add a real `deadline` date field to opportunities and hide based on that instead of `created_at`, or just make it a habit to delete/update time-sensitive listings yourself once the date passes. Given it's low-volume, manual deletion is probably fine — just flagging so it doesn't quietly become a pattern.

**Location "TBD" on all 3 live events.** Johnnybeatss (tonight), Wave808 (Oct 5), and Madwarning (Oct 17) all show "TBD" for location on the public site. Worth locking in venues and updating those — especially the Posh-linked ones, since people RSVPing there may expect a location up front.

## Small polish

**Alieen's admin access still pending.** Flagging again since it's been sitting — need her to sign in once at `/eboard/login`, or confirm her email is right (`ahern968@fiu.edu` — her team bio spells it "Aileen" if that's relevant to a typo check).

**Login lockout bug.** Also still open — the fix I proposed (confirm-click interstitial + friendlier rate-limit messaging) hasn't been built, just waiting on your go-ahead.

## Nothing else broken

Went through the homepage, events, opportunities, team, join, dj-booking, feedback, and merch pages fresh — countdown banner's working, RSVP/Posh embeds are live on all 3 events, team bios and photos are current, no leftover placeholder or lorem-ipsum text anywhere in the codebase. Merch page's "coming soon" is intentional, not stale.

Didn't re-audit the E-Board hub pages live since they're behind login, but nothing in the code changed there recently outside the Posh work already covered.

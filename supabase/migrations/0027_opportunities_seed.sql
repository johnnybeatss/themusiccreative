-- Seeds 3 externally-sourced opportunities onto the public Opportunities
-- page, researched and verified directly against each program's own site
-- on 2026-08-18 (see musiccreative_opportunities-research_v1.md for the
-- full research notes, including items intentionally left out as stale).
--
-- Deadlines are baked into the title text because `opportunities` has no
-- separate description/deadline column (see 0001_init.sql) — title is the
-- only field shown prominently on the public page.
--
-- Pinning: the public page auto-hides postings 60 days after created_at
-- (src/app/opportunities/page.tsx, STALE_AFTER_DAYS), unless is_pinned is
-- true. ISC's Sept 16 deadline falls inside that 60-day window, so it's
-- left unpinned and will age out naturally. American Songwriter's Dec 7
-- deadline and peermusic's undated, ongoing award both fall outside it, so
-- both are pinned — same mechanism already used for "EVENT DJ INQUIRIES"
-- (0014_join_and_dj_inquiries.sql). Pinned rows don't auto-expire, so
-- Johnny needs to manually delete these from /eboard/opportunities once
-- each deadline passes.

insert into opportunities (title, type, contact_link, status, is_pinned) values
  (
    'International Songwriting Competition (ISC) 2026 — Deadline Sept 16',
    'Other',
    'https://www.songwritingcompetition.com/submit',
    'Not started',
    false
  ),
  (
    'American Songwriter Song Contest 2026 — Deadline Dec 7',
    'Other',
    'https://americansongwriter.com/song-contest/',
    'Not started',
    true
  ),
  (
    'BMI peermusic Latin Music Award — $5K, ages 17-24',
    'Other',
    'https://bmifoundation.org/by-application/peermusiclatinmusicaward',
    'Not started',
    true
  );

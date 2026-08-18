-- Adds cover photos to the 3 opportunities seeded in 0027, sourced
-- directly from each program's own site (their og:image / page banner, as
-- of 2026-08-18) so the public Opportunities cards match the photo-card
-- treatment used by "What's Happening This Month" below them.
--
-- Safe to run whether or not 0027 has already been applied: this only
-- touches rows that already exist (matched by title), so if 0027 hasn't
-- run yet, run it first — this one is a no-op until those rows exist.

update opportunities
set image_url = 'https://www.songwritingcompetition.com/images/isclogo2022.png'
where title = 'International Songwriting Competition (ISC) 2026 — Deadline Sept 16';

update opportunities
set image_url = 'https://americansongwriter.com/wp-content/uploads/2026/02/New-Contest-Ads-1_960a57.webp'
where title = 'American Songwriter Song Contest 2026 — Deadline Dec 7';

update opportunities
set image_url = 'https://images.squarespace-cdn.com/content/v1/64b57cf4f30a451f375628c5/1689705771545-A6OU7DPST2DD7X4L0PBL/image-asset.jpeg'
where title = 'BMI peermusic Latin Music Award — $5K, ages 17-24';

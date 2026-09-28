-- Opportunities were only auto-hidden 60 days after posting (see
-- 0004-era staleness logic in src/app/opportunities/page.tsx), with no
-- awareness of a listing's own deadline. A contest posted a week before
-- its deadline stayed visible for 60 days regardless — well past the
-- date it stopped being useful. This adds an optional real deadline;
-- when set, the public page hides the listing once it's passed instead
-- of relying purely on the 60-day-from-posting fallback.
alter table opportunities add column deadline date;

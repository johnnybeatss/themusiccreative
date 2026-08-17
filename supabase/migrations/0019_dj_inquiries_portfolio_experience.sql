-- Adds a portfolio/social link and an experience question to the DJ
-- sign-up form, matching the pattern already used on /join
-- (portfolio_link, experience_length).

alter table dj_inquiries add column if not exists portfolio_link text;
alter table dj_inquiries add column if not exists experience text;

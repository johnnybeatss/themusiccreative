-- 0048: drop instagram_credentials (added in 0047).
--
-- Meta moved new apps to "Instagram API setup with Unified login", which
-- issues a system-user token that never expires. With nothing to refresh,
-- the token now lives only in the INSTAGRAM_ACCESS_TOKEN env var, and the
-- weekly refresh cron is gone. The table was never written to.
drop table if exists instagram_credentials;

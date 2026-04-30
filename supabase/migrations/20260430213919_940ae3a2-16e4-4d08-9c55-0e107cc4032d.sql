-- Revoke public execute on the SECURITY DEFINER helper that exposes
-- the send-reminders shared secret. Only the postgres role (used by pg_cron)
-- should be able to read this value; authenticated/anon users must not.
REVOKE EXECUTE ON FUNCTION public.get_send_reminders_secret() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_send_reminders_secret() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_send_reminders_secret() FROM authenticated;
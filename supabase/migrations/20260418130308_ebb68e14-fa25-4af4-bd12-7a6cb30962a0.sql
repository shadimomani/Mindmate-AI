-- Restrict get_send_reminders_secret to service_role only
REVOKE EXECUTE ON FUNCTION public.get_send_reminders_secret() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_send_reminders_secret() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_send_reminders_secret() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_send_reminders_secret() TO service_role;
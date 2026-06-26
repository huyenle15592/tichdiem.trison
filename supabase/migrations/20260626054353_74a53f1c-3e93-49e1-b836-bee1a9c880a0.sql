
-- 1) Drop overly-permissive policies
DROP POLICY IF EXISTS "Public access customers" ON public.customers;
DROP POLICY IF EXISTS "Public access transactions" ON public.transactions;
DROP POLICY IF EXISTS "Public manage rewards" ON public.rewards;
DROP POLICY IF EXISTS "Public view rewards" ON public.rewards;
DROP POLICY IF EXISTS "Anyone can read active rewards" ON public.rewards;
DROP POLICY IF EXISTS "Public manage tier_settings" ON public.tier_settings;
DROP POLICY IF EXISTS "Public read tier_settings" ON public.tier_settings;
DROP POLICY IF EXISTS "Public manage zns_settings" ON public.zns_settings;
DROP POLICY IF EXISTS "Public read zns_settings" ON public.zns_settings;

-- 2) Revoke direct Data API privileges from anon and authenticated.
--    All access from now on goes through server functions using service_role.
REVOKE ALL ON public.customers      FROM anon, authenticated;
REVOKE ALL ON public.transactions   FROM anon, authenticated;
REVOKE ALL ON public.rewards        FROM anon, authenticated;
REVOKE ALL ON public.tier_settings  FROM anon, authenticated;
REVOKE ALL ON public.zns_settings   FROM anon, authenticated;
REVOKE ALL ON public.user_roles     FROM anon;

-- service_role keeps ALL (it bypasses RLS anyway, but make grants explicit).
GRANT ALL ON public.customers      TO service_role;
GRANT ALL ON public.transactions   TO service_role;
GRANT ALL ON public.rewards        TO service_role;
GRANT ALL ON public.tier_settings  TO service_role;
GRANT ALL ON public.zns_settings   TO service_role;
GRANT ALL ON public.user_roles     TO service_role;

-- 3) Keep RLS enabled on all sensitive tables (defense in depth)
ALTER TABLE public.customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zns_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles     ENABLE ROW LEVEL SECURITY;

-- 4) Staff/admin read-only policies (kept for future real auth; currently unused).
--    No FOR ALL USING(true) policies anywhere. Writes are not allowed from any
--    non-service role.
DROP POLICY IF EXISTS "Staff can read customers" ON public.customers;
CREATE POLICY "Staff can read customers" ON public.customers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can read transactions" ON public.transactions;
CREATE POLICY "Staff can read transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can read rewards" ON public.rewards;
CREATE POLICY "Staff can read rewards" ON public.rewards
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff can read tier_settings" ON public.tier_settings;
CREATE POLICY "Staff can read tier_settings" ON public.tier_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can read zns_settings" ON public.zns_settings;
CREATE POLICY "Admins can read zns_settings" ON public.zns_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5) user_roles: block writes to non-service roles. Reads stay restricted to self.
DROP POLICY IF EXISTS "Admins manage user_roles" ON public.user_roles;
CREATE POLICY "Admins manage user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6) Lock down SECURITY DEFINER functions exposed via the API schema.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

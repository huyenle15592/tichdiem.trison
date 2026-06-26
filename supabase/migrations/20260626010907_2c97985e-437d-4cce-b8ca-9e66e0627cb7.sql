
-- 1. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. has_role helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Auto-grant staff role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'staff')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Lock down customers
DROP POLICY IF EXISTS "public delete customers" ON public.customers;
DROP POLICY IF EXISTS "public insert customers" ON public.customers;
DROP POLICY IF EXISTS "public read customers" ON public.customers;
DROP POLICY IF EXISTS "public update customers" ON public.customers;

REVOKE ALL ON public.customers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

CREATE POLICY "Staff can read customers"
  ON public.customers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can insert customers"
  ON public.customers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update customers"
  ON public.customers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can delete customers"
  ON public.customers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- 5. Lock down transactions
DROP POLICY IF EXISTS "public insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "public read transactions" ON public.transactions;

REVOKE ALL ON public.transactions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

CREATE POLICY "Staff can read transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can insert transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- 6. Lock down rewards (keep public read of active rewards for customer view)
DROP POLICY IF EXISTS "public manage rewards" ON public.rewards;
DROP POLICY IF EXISTS "public read rewards" ON public.rewards;

GRANT SELECT ON public.rewards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO authenticated;
GRANT ALL ON public.rewards TO service_role;

CREATE POLICY "Anyone can read active rewards"
  ON public.rewards FOR SELECT TO anon, authenticated
  USING (active = true OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can insert rewards"
  ON public.rewards FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update rewards"
  ON public.rewards FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can delete rewards"
  ON public.rewards FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

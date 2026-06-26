
-- Revert to shared-password admin gate: allow public access to operational tables
-- (admin UI is gated by a single shared password on the client)

DROP POLICY IF EXISTS "Staff can view customers" ON public.customers;
DROP POLICY IF EXISTS "Staff can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Staff can update customers" ON public.customers;
DROP POLICY IF EXISTS "Staff can delete customers" ON public.customers;

DROP POLICY IF EXISTS "Staff can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Staff can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Staff can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Staff can delete transactions" ON public.transactions;

DROP POLICY IF EXISTS "Staff can insert rewards" ON public.rewards;
DROP POLICY IF EXISTS "Staff can update rewards" ON public.rewards;
DROP POLICY IF EXISTS "Staff can delete rewards" ON public.rewards;
DROP POLICY IF EXISTS "Public can view active rewards" ON public.rewards;

-- Customers: public read/write (gated by shared admin password on client)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
CREATE POLICY "Public access customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- Transactions: public read/write
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO anon, authenticated;
CREATE POLICY "Public access transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- Rewards: public read of active rewards + public write (admin UI is password gated)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO anon, authenticated;
CREATE POLICY "Public view rewards" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Public manage rewards" ON public.rewards FOR ALL USING (true) WITH CHECK (true);

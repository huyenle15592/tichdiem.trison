
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "public insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "public update customers" ON public.customers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete customers" ON public.customers FOR DELETE USING (true);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  amount NUMERIC,
  reason TEXT,
  staff_name TEXT,
  type TEXT NOT NULL DEFAULT 'add',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO anon, authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "public insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE INDEX idx_transactions_customer ON public.transactions(customer_id);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);

CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO anon, authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read rewards" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "public manage rewards" ON public.rewards FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.rewards (name, description, points_required) VALUES
  ('Hộp Yến chưng đường phèn', 'Hộp 6 hũ yến chưng đường phèn tươi', 20),
  ('Hộp Tổ yến tinh chế', 'Hộp tổ yến tinh chế cao cấp 50g', 200);

ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;


CREATE TABLE public.tier_settings (
  id text PRIMARY KEY DEFAULT 'singleton',
  gold_min integer NOT NULL DEFAULT 50,
  diamond_min integer NOT NULL DEFAULT 200,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT only_one_row CHECK (id = 'singleton')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tier_settings TO anon, authenticated;
GRANT ALL ON public.tier_settings TO service_role;
ALTER TABLE public.tier_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tier_settings" ON public.tier_settings FOR SELECT USING (true);
CREATE POLICY "Public manage tier_settings" ON public.tier_settings FOR ALL USING (true) WITH CHECK (true);
INSERT INTO public.tier_settings (id, gold_min, diamond_min) VALUES ('singleton', 50, 200) ON CONFLICT (id) DO NOTHING;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tier_settings;

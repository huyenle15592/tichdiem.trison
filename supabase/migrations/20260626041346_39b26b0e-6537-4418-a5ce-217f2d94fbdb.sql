
CREATE TABLE IF NOT EXISTS public.zns_settings (
  id text PRIMARY KEY DEFAULT 'singleton',
  enabled boolean NOT NULL DEFAULT false,
  access_token text NOT NULL DEFAULT '',
  template_id_add text NOT NULL DEFAULT '',
  template_id_redeem text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zns_settings TO anon, authenticated;
GRANT ALL ON public.zns_settings TO service_role;
ALTER TABLE public.zns_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read zns_settings" ON public.zns_settings FOR SELECT USING (true);
CREATE POLICY "Public manage zns_settings" ON public.zns_settings FOR ALL USING (true) WITH CHECK (true);
INSERT INTO public.zns_settings (id) VALUES ('singleton') ON CONFLICT (id) DO NOTHING;

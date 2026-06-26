ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birth_date date;
CREATE INDEX IF NOT EXISTS customers_birth_month_idx ON public.customers ((EXTRACT(MONTH FROM birth_date)));
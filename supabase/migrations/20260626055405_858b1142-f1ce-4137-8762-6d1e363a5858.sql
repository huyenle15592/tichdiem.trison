ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS birth_day smallint,
  ADD COLUMN IF NOT EXISTS birth_month smallint;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_birth_day_check CHECK (birth_day IS NULL OR (birth_day BETWEEN 1 AND 31)),
  ADD CONSTRAINT customers_birth_month_check CHECK (birth_month IS NULL OR (birth_month BETWEEN 1 AND 12));

-- Backfill from legacy birth_date
UPDATE public.customers
SET birth_day = EXTRACT(DAY FROM birth_date)::smallint,
    birth_month = EXTRACT(MONTH FROM birth_date)::smallint
WHERE birth_date IS NOT NULL AND (birth_day IS NULL OR birth_month IS NULL);
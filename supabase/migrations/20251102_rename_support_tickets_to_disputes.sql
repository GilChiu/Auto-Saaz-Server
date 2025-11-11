-- Disputes schema alignment and table rename from legacy support_tickets
-- Also renames support_ticket_messages -> dispute_messages
-- Adds human-friendly dispute code with prefix DSP and zero-padded sequence

BEGIN;

-- Rename tables if legacy names exist and new ones don't
DO $$
BEGIN
  IF to_regclass('public.disputes') IS NULL AND to_regclass('public.support_tickets') IS NOT NULL THEN
    ALTER TABLE public.support_tickets RENAME TO disputes;
  END IF;
  IF to_regclass('public.dispute_messages') IS NULL AND to_regclass('public.support_ticket_messages') IS NOT NULL THEN
    ALTER TABLE public.support_ticket_messages RENAME TO dispute_messages;
  END IF;
END$$;

-- Create tables if none exist (fresh install safeguard)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  code VARCHAR(20) UNIQUE,
  garage_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  source VARCHAR(50) DEFAULT 'garage-portal',
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If disputes table already existed without the code column, add it now
DO $$
BEGIN
  IF to_regclass('public.disputes') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'disputes' AND column_name = 'code'
  ) THEN
    ALTER TABLE public.disputes ADD COLUMN code VARCHAR(20);
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disputes_garage_id ON public.disputes(garage_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON public.disputes(created_at);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_ticket_created ON public.dispute_messages(ticket_id, created_at);

-- RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

-- Policies for service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE  schemaname = 'public' AND tablename = 'disputes' AND policyname = 'service role full access disputes'
  ) THEN
    CREATE POLICY "service role full access disputes" ON public.disputes FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE  schemaname = 'public' AND tablename = 'dispute_messages' AND policyname = 'service role full access dispute_messages'
  ) THEN
    CREATE POLICY "service role full access dispute_messages" ON public.dispute_messages FOR ALL USING (auth.role() = 'service_role');
  END IF;
END$$;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_disputes_updated_at ON public.disputes;
CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_dispute_messages_updated_at ON public.dispute_messages;
CREATE TRIGGER trg_dispute_messages_updated_at BEFORE UPDATE ON public.dispute_messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Human-friendly code generation: DSP001, DSP002, ...
CREATE SEQUENCE IF NOT EXISTS public.dispute_code_seq START 1;

CREATE OR REPLACE FUNCTION public.set_dispute_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR LENGTH(TRIM(NEW.code)) = 0 THEN
    NEW.code := 'DSP' || LPAD(nextval('public.dispute_code_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill codes for existing rows that don't have one yet
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.disputes WHERE code IS NULL OR LENGTH(TRIM(code)) = 0 LOOP
    UPDATE public.disputes
      SET code = 'DSP' || LPAD(nextval('public.dispute_code_seq')::text, 3, '0')
      WHERE id = r.id;
  END LOOP;
END$$;

DROP TRIGGER IF EXISTS trg_disputes_set_code ON public.disputes;
CREATE TRIGGER trg_disputes_set_code BEFORE INSERT ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.set_dispute_code();

COMMIT;

-- Postgres schema for Maersk Deliver Claims Portal
-- File-backed CSV tables can be imported later with COPY.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('merchant', 'cx_team', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_status') THEN
    CREATE TYPE claim_status AS ENUM (
      'draft',
      'submitted',
      'under_review',
      'documentation_requested',
      'carrier_review',
      'approved',
      'partially_approved',
      'rejected',
      'escalated',
      'closed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_type') THEN
    CREATE TYPE claim_type AS ENUM (
      'lost',
      'damaged',
      'late_delivery',
      'wrong_delivery',
      'missing_items',
      'shortage'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
    CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evidence_type') THEN
    CREATE TYPE evidence_type AS ENUM (
      'invoice',
      'photo',
      'bill_of_lading',
      'packing_list',
      'survey_report',
      'email',
      'other'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS merchants (
  merchant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_code TEXT NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  billing_currency CHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  password_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_merchant_access (
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(merchant_id) ON DELETE CASCADE,
  access_scope TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, merchant_id)
);

CREATE TABLE IF NOT EXISTS carriers (
  carrier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_name TEXT NOT NULL UNIQUE,
  scac_code TEXT,
  supports_tracking_ingestion BOOLEAN NOT NULL DEFAULT TRUE,
  supports_auto_claim_rules BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
  shipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(merchant_id),
  carrier_id UUID NOT NULL REFERENCES carriers(carrier_id),
  tracking_number TEXT NOT NULL,
  booking_reference TEXT,
  service_name TEXT,
  origin_location TEXT,
  destination_location TEXT,
  ship_date DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  container_number TEXT,
  weight_value NUMERIC(12,3),
  weight_unit TEXT DEFAULT 'kg',
  insured_value NUMERIC(14,2),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  commodity_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (carrier_id, tracking_number)
);

CREATE TABLE IF NOT EXISTS admin_upload_batches (
  batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL REFERENCES users(user_id),
  source_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  records_total INT NOT NULL DEFAULT 0,
  records_accepted INT NOT NULL DEFAULT 0,
  records_rejected INT NOT NULL DEFAULT 0,
  processing_status TEXT NOT NULL DEFAULT 'processed'
);

CREATE TABLE IF NOT EXISTS tracking_events (
  tracking_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(shipment_id) ON DELETE CASCADE,
  batch_id UUID REFERENCES admin_upload_batches(batch_id) ON DELETE SET NULL,
  event_code TEXT NOT NULL,
  event_status TEXT NOT NULL,
  event_description TEXT,
  event_time TIMESTAMPTZ NOT NULL,
  event_location TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
  claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number TEXT NOT NULL UNIQUE,
  merchant_id UUID NOT NULL REFERENCES merchants(merchant_id),
  shipment_id UUID NOT NULL REFERENCES shipments(shipment_id),
  filed_by_user_id UUID NOT NULL REFERENCES users(user_id),
  assigned_to_user_id UUID REFERENCES users(user_id),
  claim_type claim_type NOT NULL,
  claim_status claim_status NOT NULL DEFAULT 'submitted',
  priority priority_level NOT NULL DEFAULT 'medium',
  incident_date DATE NOT NULL,
  filed_date DATE NOT NULL,
  description TEXT NOT NULL,
  claimed_amount NUMERIC(14,2) NOT NULL CHECK (claimed_amount >= 0),
  approved_amount NUMERIC(14,2) CHECK (approved_amount >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  sla_deadline DATE,
  resolution_date DATE,
  auto_process_recommended BOOLEAN NOT NULL DEFAULT FALSE,
  auto_process_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_status_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(claim_id) ON DELETE CASCADE,
  old_status claim_status,
  new_status claim_status NOT NULL,
  changed_by_user_id UUID REFERENCES users(user_id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_note TEXT
);

CREATE TABLE IF NOT EXISTS claim_evidence (
  evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(claim_id) ON DELETE CASCADE,
  evidence_type evidence_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  uploaded_by_user_id UUID REFERENCES users(user_id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_notes (
  note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(claim_id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_shipments_merchant ON shipments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_time ON tracking_events(shipment_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_claims_merchant ON claims(merchant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_claims_filed_date ON claims(filed_date DESC);
CREATE INDEX IF NOT EXISTS idx_claim_history_claim ON claim_status_history(claim_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_claim_evidence_claim ON claim_evidence(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_notes_claim ON claim_notes(claim_id, created_at DESC);

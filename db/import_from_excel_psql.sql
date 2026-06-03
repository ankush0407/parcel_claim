-- Run with psql from repository root:
-- psql -d <db_name> -f db/import_from_excel_psql.sql
-- This uses \copy, so files are read from the client machine.

BEGIN;

\copy merchants (merchant_id, merchant_code, legal_name, display_name, contact_email, contact_phone, billing_currency, is_active, created_at, updated_at) FROM 'data/excel_seed/merchants.csv' DELIMITER ',' CSV HEADER;
\copy users (user_id, email, full_name, role, password_hash, is_active, created_at, updated_at) FROM 'data/excel_seed/users.csv' DELIMITER ',' CSV HEADER;
\copy user_merchant_access (user_id, merchant_id, access_scope, created_at) FROM 'data/excel_seed/user_merchant_access.csv' DELIMITER ',' CSV HEADER;
\copy carriers (carrier_id, carrier_name, scac_code, supports_tracking_ingestion, supports_auto_claim_rules, created_at) FROM 'data/excel_seed/carriers.csv' DELIMITER ',' CSV HEADER;
\copy shipments (shipment_id, merchant_id, carrier_id, tracking_number, booking_reference, service_name, origin_location, destination_location, ship_date, expected_delivery_date, actual_delivery_date, container_number, weight_value, weight_unit, insured_value, currency_code, commodity_type, created_at, updated_at) FROM 'data/excel_seed/shipments.csv' DELIMITER ',' CSV HEADER;
\copy admin_upload_batches (batch_id, uploaded_by, source_name, file_name, uploaded_at, records_total, records_accepted, records_rejected, processing_status) FROM 'data/excel_seed/admin_upload_batches.csv' DELIMITER ',' CSV HEADER;
\copy tracking_events (tracking_event_id, shipment_id, batch_id, event_code, event_status, event_description, event_time, event_location, raw_payload, created_at) FROM 'data/excel_seed/tracking_events.csv' DELIMITER ',' CSV HEADER;
\copy claims (claim_id, claim_number, merchant_id, shipment_id, filed_by_user_id, assigned_to_user_id, claim_type, claim_status, priority, incident_date, filed_date, description, claimed_amount, approved_amount, currency_code, sla_deadline, resolution_date, auto_process_recommended, auto_process_reason, created_at, updated_at) FROM 'data/excel_seed/claims.csv' DELIMITER ',' CSV HEADER;
\copy claim_status_history (history_id, claim_id, old_status, new_status, changed_by_user_id, changed_at, change_note) FROM 'data/excel_seed/claim_status_history.csv' DELIMITER ',' CSV HEADER;
\copy claim_evidence (evidence_id, claim_id, evidence_type, file_name, file_url, file_size_bytes, uploaded_by_user_id, uploaded_at) FROM 'data/excel_seed/claim_evidence.csv' DELIMITER ',' CSV HEADER;
\copy claim_notes (note_id, claim_id, note_text, is_internal, created_by_user_id, created_at) FROM 'data/excel_seed/claim_notes.csv' DELIMITER ',' CSV HEADER;

COMMIT;

-- Migration 013: Extend users table with phone, department, and last_login_at, plus indexes

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS department VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_department ON users (department);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs (entity, entity_id, created_at DESC);


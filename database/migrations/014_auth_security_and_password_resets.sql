-- Migration 014: Login attempts/lockout tracking and password reset requests

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    ip_address VARCHAR(64) NOT NULL,
    failed_count INT NOT NULL DEFAULT 0,
    first_failed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_until TIMESTAMPTZ,
    UNIQUE (email, ip_address)
);

CREATE TABLE IF NOT EXISTS password_reset_requests (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(254) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'expired', 'dismissed')),
    delivery_method VARCHAR(20) NOT NULL DEFAULT 'admin_queue'
        CHECK (delivery_method IN ('admin_queue', 'smtp')),
    ip_address VARCHAR(64),
    user_agent VARCHAR(500),
    expires_at TIMESTAMPTZ NOT NULL,
    resolved_by INT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_locked_until ON login_attempts (locked_until);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status ON password_reset_requests (status, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_token_hash ON password_reset_requests (token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_id ON password_reset_requests (user_id);


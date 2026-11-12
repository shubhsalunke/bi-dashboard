-- Migration 015: AI Assistant chat history, feedback, pinned widgets, extended ai_customers view, and strict ai_readonly permissions

-- 1. Recreate ai_customers view including state, industry, customer_type while excluding PII (email, phone, contact_person, gst_number, address, notes)
DROP VIEW IF EXISTS ai_customers CASCADE;
CREATE VIEW ai_customers AS
SELECT
  id,
  customer_code,
  customer_name,
  city,
  state,
  industry,
  customer_type,
  status,
  created_at
FROM customers;

-- 2. Conversations & persistent chat history per user
CREATE TABLE IF NOT EXISTS ai_conversations (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_updated
  ON ai_conversations (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  intent VARCHAR(60),
  report_title VARCHAR(200),
  sql_query TEXT,
  assumptions TEXT,
  columns_json JSONB,
  rows_json JSONB,
  summary_metrics_json JSONB,
  chart_config_json JSONB,
  followups_json JSONB,
  duration_ms INT,
  row_count INT,
  is_error BOOLEAN NOT NULL DEFAULT false,
  is_clarification BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_created
  ON ai_messages (conversation_id, id ASC);

-- 3. Answer feedback (thumbs up / down)
CREATE TABLE IF NOT EXISTS ai_feedback (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id INT NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
  rating VARCHAR(10) NOT NULL CHECK (rating IN ('up', 'down')),
  comment TEXT,
  question TEXT,
  generated_sql TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_message_id ON ai_feedback (message_id);

-- 4. Pinned AI chart/table widgets shown on the Dashboard
CREATE TABLE IF NOT EXISTS ai_pinned_widgets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  question TEXT NOT NULL,
  sql_query TEXT,
  chart_type VARCHAR(20) NOT NULL CHECK (chart_type IN ('bar', 'line', 'donut', 'table')),
  chart_config_json JSONB,
  columns_json JSONB,
  rows_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_pinned_widgets_user_created
  ON ai_pinned_widgets (user_id, created_at DESC);

-- 5. Re-enforce least-privilege read-only permissions on ai_readonly role
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ai_readonly;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM ai_readonly;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM ai_readonly;

GRANT USAGE ON SCHEMA public TO ai_readonly;
GRANT SELECT ON ai_customers TO ai_readonly;
GRANT SELECT ON ai_products TO ai_readonly;
GRANT SELECT ON ai_sales TO ai_readonly;
GRANT SELECT ON ai_sale_items TO ai_readonly;

ALTER ROLE ai_readonly SET statement_timeout = '5s';


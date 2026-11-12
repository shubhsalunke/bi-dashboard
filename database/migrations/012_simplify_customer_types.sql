-- Migration: 012_simplify_customer_types.sql
-- Description: Rename customer_type values from Enterprise/SMB to plain terms Large Business/Small Business

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_customer_type_check;

UPDATE customers SET customer_type = 'Large Business' WHERE customer_type = 'Enterprise';
UPDATE customers SET customer_type = 'Small Business' WHERE customer_type = 'SMB';

ALTER TABLE customers
  ADD CONSTRAINT customers_customer_type_check
  CHECK (
    customer_type IS NULL OR
    customer_type IN ('Large Business', 'Small Business', 'Startup', 'Individual')
  );


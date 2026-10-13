--
-- PostgreSQL database dump
--

\restrict shYOY8HchmQk3GRNie6iMRFaNMw6kOCBtgCRupBcgKQUR9COoyIOhh8frXMCb2A

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (1, 'Eleanor Vance', 'admin@bi.corp', '$2a$10$812j9p6sZNHaCWc7y/4.gu71iG3Du8j5P8WjROOqJCOgJJwVqUuSW', 'admin', true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.users VALUES (2, 'Marcus Brody', 'manager@bi.corp', '$2a$10$mFi5c.DKnfSk9dubmcq/WOqDZtSh87nFxhPHoLNyTOvCrTAsfMY0e', 'manager', true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.users VALUES (3, 'Sofia Chen', 'analyst@bi.corp', '$2a$10$YZqkTK/tLdRqkLphHYpL/.vNkbRI1NQj6Err0FeAXB4jWFHq0HGlK', 'analyst', true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.audit_logs VALUES (1, 1, 'admin@bi.corp', 'SYSTEM_SEED', 'DATABASE', 1, '{"seeded": {"sales": 90, "users": 3, "products": 15, "customers": 30}}', NULL, '2026-10-13 11:02:24.070515+00');


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.customers VALUES (1, 'CUST-001', 'Acme Global Logistics', 'contact@acmelogistics.com', '+1-212-555-0101', 'New York', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (2, 'CUST-002', 'Apex FinTech Solutions', 'billing@apexfintech.io', '+1-415-555-0102', 'San Francisco', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (3, 'CUST-003', 'Beacon Health Analytics', 'ops@beaconhealth.org', '+1-312-555-0103', 'Chicago', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (4, 'CUST-004', 'BlueSky SaaS Inc', 'admin@blueskycloud.net', '+1-512-555-0104', 'Austin', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (5, 'CUST-005', 'Cascade Energy Corp', 'procure@cascadeenergy.com', '+1-206-555-0105', 'Seattle', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (6, 'CUST-006', 'Catalyst BioSciences', 'lab@catalystbio.com', '+1-617-555-0106', 'Boston', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (7, 'CUST-007', 'Coastal Logistics Group', 'support@coastallog.com', '+1-305-555-0107', 'Miami', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (8, 'CUST-008', 'Crestline Capital Partners', 'deals@crestlinecap.com', '+1-212-555-0108', 'New York', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (9, 'CUST-009', 'Delta Stream Media', 'tech@deltastream.com', '+1-310-555-0109', 'Los Angeles', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (10, 'CUST-010', 'Elevate Retail Systems', 'orders@elevateretail.com', '+1-312-555-0110', 'Chicago', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (11, 'CUST-011', 'Frontier Robotics Lab', 'info@frontierrob.io', '+1-206-555-0111', 'Seattle', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (12, 'CUST-012', 'Horizon Cloud Services', 'it@horizonclouds.net', '+1-415-555-0112', 'San Francisco', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (13, 'CUST-013', 'Ironclad Security Labs', 'ops@ironcladsec.com', '+1-512-555-0113', 'Austin', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (14, 'CUST-014', 'Keystone Manufacturing', 'supply@keystonemfg.com', '+1-214-555-0114', 'Dallas', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (15, 'CUST-015', 'Lighthouse Education Tech', 'admin@lighthouseed.org', '+1-617-555-0115', 'Boston', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (16, 'CUST-016', 'Matrix AI Labs', 'founders@matrixailabs.com', '+1-415-555-0116', 'San Francisco', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (17, 'CUST-017', 'Nexus Supply Chain', 'freight@nexussupply.com', '+1-303-555-0117', 'Denver', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (18, 'CUST-018', 'OmniPay Payment Gateway', 'gateway@omnipaycorp.com', '+1-212-555-0118', 'New York', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (19, 'CUST-019', 'Pinnacle Aerospace Systems', 'procure@pinnacleaero.com', '+1-206-555-0119', 'Seattle', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (20, 'CUST-020', 'Quantum Medical Diagnostics', 'contact@quantummed.org', '+1-312-555-0120', 'Chicago', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (21, 'CUST-021', 'Redwood Data Storage', 'support@redwooddata.com', '+1-415-555-0121', 'San Francisco', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (22, 'CUST-022', 'Silverline Insurance Group', 'claims@silverlineins.com', '+1-214-555-0122', 'Dallas', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (23, 'CUST-023', 'Solstice Energy Networks', 'green@solsticeenergy.com', '+1-303-555-0123', 'Denver', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (24, 'CUST-024', 'Summit Wealth Management', 'wealth@summitwm.com', '+1-212-555-0124', 'New York', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (25, 'CUST-025', 'Titanium Heavy Industries', 'heavy@titaniumind.com', '+1-312-555-0125', 'Chicago', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (26, 'CUST-026', 'Vanguard Mobility Labs', 'fleet@vanguardmob.com', '+1-512-555-0126', 'Austin', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (27, 'CUST-027', 'Vertex Biotechnology', 'research@vertexbio.net', '+1-617-555-0127', 'Boston', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (28, 'CUST-028', 'Zephyr Global Trading', 'trade@zephyrtrade.com', '+1-305-555-0128', 'Miami', 'active', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (29, 'CUST-029', 'Legacy Retail Distribution', 'closed@legacyretail.com', '+1-214-555-0129', 'Dallas', 'inactive', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.customers VALUES (30, 'CUST-030', 'OldTown Printing Services', 'inquiry@oldtownprint.com', '+1-303-555-0130', 'Denver', 'inactive', '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.products VALUES (1, 'Enterprise Cloud Compute Node', 'Cloud Infrastructure', 450.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (2, 'Managed PostgreSQL Cluster Dedicated', 'Cloud Infrastructure', 650.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (3, 'Object Storage Tier 1 (10TB)', 'Cloud Infrastructure', 220.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (4, 'BI Analytics Suite Pro License', 'Enterprise Software', 1200.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (5, 'Customer Data Platform (CDP)', 'Enterprise Software', 2400.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (6, 'Workflow Automator Enterprise', 'Enterprise Software', 850.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (7, 'Zero Trust Network Gateway', 'Cybersecurity', 1500.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (8, 'Endpoint Detection & Response (EDR)', 'Cybersecurity', 950.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (9, 'Threat Intelligence Real-time Feed', 'Cybersecurity', 1800.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (10, 'Predictive Sales Forecast Engine', 'Analytics & AI', 3200.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (11, 'AI Customer Copilot Integration', 'Analytics & AI', 2800.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (12, 'Real-time Data Warehouse Connector', 'Analytics & AI', 750.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (13, 'Enterprise Cloud Migration Consulting', 'Professional Services', 5000.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (14, 'Custom BI Dashboard Implementation', 'Professional Services', 3500.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.products VALUES (15, '24/7 Dedicated SLA Support Package', 'Professional Services', 1500.00, true, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.sales VALUES (1, 1, '2026-10-13', 450.00, 'pending', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (2, 2, '2026-10-11', 8500.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (3, 3, '2026-10-09', 5860.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (4, 4, '2026-10-07', 4800.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (5, 5, '2026-10-05', 4300.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (6, 6, '2026-10-03', 10100.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (7, 7, '2026-10-01', 4500.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (8, 8, '2026-09-29', 6600.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (9, 9, '2026-09-27', 7800.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (10, 10, '2026-09-25', 6400.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (11, 11, '2026-09-23', 22400.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (12, 12, '2026-09-21', 4940.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (13, 13, '2026-09-19', 5000.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (14, 14, '2026-09-17', 8950.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (15, 15, '2026-09-15', 6230.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (16, 16, '2026-09-13', 1800.00, 'pending', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (17, 17, '2026-09-11', 5450.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (18, 18, '2026-09-09', 10190.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (19, 19, '2026-09-07', 3600.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (20, 20, '2026-09-05', 10550.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (21, 21, '2026-09-03', 6700.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (22, 22, '2026-09-01', 3000.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (23, 23, '2026-08-30', 14050.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (24, 24, '2026-08-28', 10950.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (25, 25, '2026-08-26', 3200.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (26, 26, '2026-08-24', 16100.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (27, 27, '2026-08-22', 8470.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (28, 28, '2026-08-20', 20000.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (29, 1, '2026-08-18', 4800.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (30, 2, '2026-08-16', 7060.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (31, 3, '2026-08-14', 1350.00, 'pending', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (32, 4, '2026-08-12', 5000.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (33, 5, '2026-08-10', 7320.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (34, 6, '2026-08-08', 2400.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (35, 7, '2026-08-06', 11000.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (36, 8, '2026-08-04', 6700.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (37, 9, '2026-08-02', 1500.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (38, 10, '2026-07-31', 10300.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (39, 11, '2026-07-29', 9900.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (40, 12, '2026-07-27', 12800.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (41, 13, '2026-07-25', 9800.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (42, 14, '2026-07-23', 6880.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (43, 15, '2026-07-21', 15000.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (44, 16, '2026-07-19', 14650.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (45, 17, '2026-07-17', 4490.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (46, 18, '2026-07-15', 900.00, 'pending', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (47, 19, '2026-07-13', 11550.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (48, 20, '2026-07-11', 5330.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (49, 21, '2026-07-09', 1200.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (50, 22, '2026-07-07', 7650.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (51, 23, '2026-07-05', 10500.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (52, 24, '2026-07-03', 6000.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (53, 25, '2026-07-01', 6550.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (54, 26, '2026-06-29', 11850.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (55, 27, '2026-06-27', 9600.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (56, 28, '2026-06-25', 14700.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (57, 1, '2026-06-23', 4410.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (58, 2, '2026-06-21', 10000.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (59, 3, '2026-06-19', 13100.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (60, 4, '2026-06-17', 7920.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (61, 5, '2026-06-15', 450.00, 'pending', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (62, 6, '2026-06-13', 8500.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (63, 7, '2026-06-11', 5860.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (64, 8, '2026-06-09', 4800.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (65, 9, '2026-06-07', 4300.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (66, 10, '2026-06-05', 10100.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (67, 11, '2026-06-03', 4500.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (68, 12, '2026-06-01', 6600.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (69, 13, '2026-05-30', 7800.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (70, 14, '2026-05-28', 6400.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (71, 15, '2026-05-26', 22400.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (72, 16, '2026-05-24', 4940.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (73, 17, '2026-05-22', 5000.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (74, 18, '2026-05-20', 8950.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (75, 19, '2026-05-18', 6230.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (76, 20, '2026-05-16', 1800.00, 'pending', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (77, 21, '2026-05-14', 5450.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (78, 22, '2026-05-12', 10190.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (79, 23, '2026-05-10', 3600.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (80, 24, '2026-05-08', 10550.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (81, 25, '2026-05-06', 6700.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (82, 26, '2026-05-04', 3000.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (83, 27, '2026-05-02', 14050.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (84, 28, '2026-04-30', 10950.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (85, 1, '2026-04-28', 3200.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (86, 2, '2026-04-26', 16100.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (87, 3, '2026-04-24', 8470.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (88, 4, '2026-04-22', 20000.00, 'completed', 1, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (89, 5, '2026-04-20', 4800.00, 'completed', 2, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sales VALUES (90, 6, '2026-04-18', 7060.00, 'completed', 3, '2026-10-13 11:02:24.070515+00', '2026-10-13 11:02:24.070515+00');


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.sale_items VALUES (1, 1, 1, 1, 450.00, 450.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (2, 2, 2, 2, 650.00, 1300.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (3, 2, 5, 3, 2400.00, 7200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (4, 3, 3, 3, 220.00, 660.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (5, 3, 6, 4, 850.00, 3400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (6, 3, 9, 1, 1800.00, 1800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (7, 4, 4, 4, 1200.00, 4800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (8, 5, 5, 1, 2400.00, 2400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (9, 5, 8, 2, 950.00, 1900.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (10, 6, 6, 2, 850.00, 1700.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (11, 6, 9, 3, 1800.00, 5400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (12, 6, 12, 4, 750.00, 3000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (13, 7, 7, 3, 1500.00, 4500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (14, 8, 8, 4, 950.00, 3800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (15, 8, 11, 1, 2800.00, 2800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (16, 9, 9, 1, 1800.00, 1800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (17, 9, 12, 2, 750.00, 1500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (18, 9, 15, 3, 1500.00, 4500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (19, 10, 10, 2, 3200.00, 6400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (20, 11, 11, 3, 2800.00, 8400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (21, 11, 14, 4, 3500.00, 14000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (22, 12, 12, 4, 750.00, 3000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (23, 12, 15, 1, 1500.00, 1500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (24, 12, 3, 2, 220.00, 440.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (25, 13, 13, 1, 5000.00, 5000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (26, 14, 14, 2, 3500.00, 7000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (27, 14, 2, 3, 650.00, 1950.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (28, 15, 15, 3, 1500.00, 4500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (29, 15, 3, 4, 220.00, 880.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (30, 15, 6, 1, 850.00, 850.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (31, 16, 1, 4, 450.00, 1800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (32, 17, 2, 1, 650.00, 650.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (33, 17, 5, 2, 2400.00, 4800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (34, 18, 3, 2, 220.00, 440.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (35, 18, 6, 3, 850.00, 2550.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (36, 18, 9, 4, 1800.00, 7200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (37, 19, 4, 3, 1200.00, 3600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (38, 20, 5, 4, 2400.00, 9600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (39, 20, 8, 1, 950.00, 950.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (40, 21, 6, 1, 850.00, 850.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (41, 21, 9, 2, 1800.00, 3600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (42, 21, 12, 3, 750.00, 2250.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (43, 22, 7, 2, 1500.00, 3000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (44, 23, 8, 3, 950.00, 2850.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (45, 23, 11, 4, 2800.00, 11200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (46, 24, 9, 4, 1800.00, 7200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (47, 24, 12, 1, 750.00, 750.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (48, 24, 15, 2, 1500.00, 3000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (49, 25, 10, 1, 3200.00, 3200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (50, 26, 11, 2, 2800.00, 5600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (51, 26, 14, 3, 3500.00, 10500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (52, 27, 12, 3, 750.00, 2250.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (53, 27, 15, 4, 1500.00, 6000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (54, 27, 3, 1, 220.00, 220.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (55, 28, 13, 4, 5000.00, 20000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (56, 29, 14, 1, 3500.00, 3500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (57, 29, 2, 2, 650.00, 1300.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (58, 30, 15, 2, 1500.00, 3000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (59, 30, 3, 3, 220.00, 660.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (60, 30, 6, 4, 850.00, 3400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (61, 31, 1, 3, 450.00, 1350.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (62, 32, 2, 4, 650.00, 2600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (63, 32, 5, 1, 2400.00, 2400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (64, 33, 3, 1, 220.00, 220.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (65, 33, 6, 2, 850.00, 1700.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (66, 33, 9, 3, 1800.00, 5400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (67, 34, 4, 2, 1200.00, 2400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (68, 35, 5, 3, 2400.00, 7200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (69, 35, 8, 4, 950.00, 3800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (70, 36, 6, 4, 850.00, 3400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (71, 36, 9, 1, 1800.00, 1800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (72, 36, 12, 2, 750.00, 1500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (73, 37, 7, 1, 1500.00, 1500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (74, 38, 8, 2, 950.00, 1900.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (75, 38, 11, 3, 2800.00, 8400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (76, 39, 9, 3, 1800.00, 5400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (77, 39, 12, 4, 750.00, 3000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (78, 39, 15, 1, 1500.00, 1500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (79, 40, 10, 4, 3200.00, 12800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (80, 41, 11, 1, 2800.00, 2800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (81, 41, 14, 2, 3500.00, 7000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (82, 42, 12, 2, 750.00, 1500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (83, 42, 15, 3, 1500.00, 4500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (84, 42, 3, 4, 220.00, 880.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (85, 43, 13, 3, 5000.00, 15000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (86, 44, 14, 4, 3500.00, 14000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (87, 44, 2, 1, 650.00, 650.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (88, 45, 15, 1, 1500.00, 1500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (89, 45, 3, 2, 220.00, 440.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (90, 45, 6, 3, 850.00, 2550.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (91, 46, 1, 2, 450.00, 900.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (92, 47, 2, 3, 650.00, 1950.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (93, 47, 5, 4, 2400.00, 9600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (94, 48, 3, 4, 220.00, 880.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (95, 48, 6, 1, 850.00, 850.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (96, 48, 9, 2, 1800.00, 3600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (97, 49, 4, 1, 1200.00, 1200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (98, 50, 5, 2, 2400.00, 4800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (99, 50, 8, 3, 950.00, 2850.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (100, 51, 6, 3, 850.00, 2550.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (101, 51, 9, 4, 1800.00, 7200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (102, 51, 12, 1, 750.00, 750.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (103, 52, 7, 4, 1500.00, 6000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (104, 53, 8, 1, 950.00, 950.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (105, 53, 11, 2, 2800.00, 5600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (106, 54, 9, 2, 1800.00, 3600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (107, 54, 12, 3, 750.00, 2250.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (108, 54, 15, 4, 1500.00, 6000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (109, 55, 10, 3, 3200.00, 9600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (110, 56, 11, 4, 2800.00, 11200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (111, 56, 14, 1, 3500.00, 3500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (112, 57, 12, 1, 750.00, 750.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (113, 57, 15, 2, 1500.00, 3000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (114, 57, 3, 3, 220.00, 660.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (115, 58, 13, 2, 5000.00, 10000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (116, 59, 14, 3, 3500.00, 10500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (117, 59, 2, 4, 650.00, 2600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (118, 60, 15, 4, 1500.00, 6000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (119, 60, 3, 1, 220.00, 220.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (120, 60, 6, 2, 850.00, 1700.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (121, 61, 1, 1, 450.00, 450.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (122, 62, 2, 2, 650.00, 1300.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (123, 62, 5, 3, 2400.00, 7200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (124, 63, 3, 3, 220.00, 660.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (125, 63, 6, 4, 850.00, 3400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (126, 63, 9, 1, 1800.00, 1800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (127, 64, 4, 4, 1200.00, 4800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (128, 65, 5, 1, 2400.00, 2400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (129, 65, 8, 2, 950.00, 1900.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (130, 66, 6, 2, 850.00, 1700.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (131, 66, 9, 3, 1800.00, 5400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (132, 66, 12, 4, 750.00, 3000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (133, 67, 7, 3, 1500.00, 4500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (134, 68, 8, 4, 950.00, 3800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (135, 68, 11, 1, 2800.00, 2800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (136, 69, 9, 1, 1800.00, 1800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (137, 69, 12, 2, 750.00, 1500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (138, 69, 15, 3, 1500.00, 4500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (139, 70, 10, 2, 3200.00, 6400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (140, 71, 11, 3, 2800.00, 8400.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (141, 71, 14, 4, 3500.00, 14000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (142, 72, 12, 4, 750.00, 3000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (143, 72, 15, 1, 1500.00, 1500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (144, 72, 3, 2, 220.00, 440.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (145, 73, 13, 1, 5000.00, 5000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (146, 74, 14, 2, 3500.00, 7000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (147, 74, 2, 3, 650.00, 1950.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (148, 75, 15, 3, 1500.00, 4500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (149, 75, 3, 4, 220.00, 880.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (150, 75, 6, 1, 850.00, 850.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (151, 76, 1, 4, 450.00, 1800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (152, 77, 2, 1, 650.00, 650.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (153, 77, 5, 2, 2400.00, 4800.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (154, 78, 3, 2, 220.00, 440.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (155, 78, 6, 3, 850.00, 2550.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (156, 78, 9, 4, 1800.00, 7200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (157, 79, 4, 3, 1200.00, 3600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (158, 80, 5, 4, 2400.00, 9600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (159, 80, 8, 1, 950.00, 950.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (160, 81, 6, 1, 850.00, 850.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (161, 81, 9, 2, 1800.00, 3600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (162, 81, 12, 3, 750.00, 2250.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (163, 82, 7, 2, 1500.00, 3000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (164, 83, 8, 3, 950.00, 2850.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (165, 83, 11, 4, 2800.00, 11200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (166, 84, 9, 4, 1800.00, 7200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (167, 84, 12, 1, 750.00, 750.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (168, 84, 15, 2, 1500.00, 3000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (169, 85, 10, 1, 3200.00, 3200.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (170, 86, 11, 2, 2800.00, 5600.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (171, 86, 14, 3, 3500.00, 10500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (172, 87, 12, 3, 750.00, 2250.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (173, 87, 15, 4, 1500.00, 6000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (174, 87, 3, 1, 220.00, 220.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (175, 88, 13, 4, 5000.00, 20000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (176, 89, 14, 1, 3500.00, 3500.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (177, 89, 2, 2, 650.00, 1300.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (178, 90, 15, 2, 1500.00, 3000.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (179, 90, 3, 3, 220.00, 660.00, '2026-10-13 11:02:24.070515+00');
INSERT INTO public.sale_items VALUES (180, 90, 6, 4, 850.00, 3400.00, '2026-10-13 11:02:24.070515+00');


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 30, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 15, true);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 180, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_id_seq', 90, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--

\unrestrict shYOY8HchmQk3GRNie6iMRFaNMw6kOCBtgCRupBcgKQUR9COoyIOhh8frXMCb2A


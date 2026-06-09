-- ─── Seed: 8 realistic worker profiles ─────────────────────────────────────
-- Populates the directory with named workers across construction, healthcare,
-- transportation, hospitality, and landscaping so Discover, Krew matching,
-- and search have meaningful data to render. Each worker gets:
--   - auth.users + auth.identities (login: <handle>@krewtree.dev / devpass123)
--   - user_roles = 'worker'
--   - worker_profiles row with bio, city, primary_trade, regulix flag
--   - worker_industries link(s)
--   - worker_skills (matching the canonical skill names so the Discover
--     filter sees them and per-job matching can score against jobs.skills)
--   - worker_work_history (current + prior role)
--   - worker_certifications where relevant
--
-- Migration is idempotent: rerunning reapplies the same data without
-- duplicating it. Profile/work-history/skill children are wiped per-worker
-- before re-insert so updates to this file replace, not append.
-- ────────────────────────────────────────────────────────────────────────────

-- ── Auth users + identities + roles ───────────────────────────────────────
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000001','authenticated','authenticated',
   'maya@krewtree.dev', extensions.crypt('devpass123', extensions.gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000002','authenticated','authenticated',
   'tyler@krewtree.dev', extensions.crypt('devpass123', extensions.gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000003','authenticated','authenticated',
   'sofia@krewtree.dev', extensions.crypt('devpass123', extensions.gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000004','authenticated','authenticated',
   'jamal@krewtree.dev', extensions.crypt('devpass123', extensions.gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000005','authenticated','authenticated',
   'elena@krewtree.dev', extensions.crypt('devpass123', extensions.gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000006','authenticated','authenticated',
   'marcus@krewtree.dev', extensions.crypt('devpass123', extensions.gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000007','authenticated','authenticated',
   'olivia@krewtree.dev', extensions.crypt('devpass123', extensions.gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000008','authenticated','authenticated',
   'devon@krewtree.dev', extensions.crypt('devpass123', extensions.gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','','')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) VALUES
  ('a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
   '{"sub":"a1000000-0000-0000-0000-000000000001","email":"maya@krewtree.dev"}','email','maya@krewtree.dev',NOW(),NOW(),NOW()),
  ('a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000002',
   '{"sub":"a1000000-0000-0000-0000-000000000002","email":"tyler@krewtree.dev"}','email','tyler@krewtree.dev',NOW(),NOW(),NOW()),
  ('a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003',
   '{"sub":"a1000000-0000-0000-0000-000000000003","email":"sofia@krewtree.dev"}','email','sofia@krewtree.dev',NOW(),NOW(),NOW()),
  ('a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004',
   '{"sub":"a1000000-0000-0000-0000-000000000004","email":"jamal@krewtree.dev"}','email','jamal@krewtree.dev',NOW(),NOW(),NOW()),
  ('a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000005',
   '{"sub":"a1000000-0000-0000-0000-000000000005","email":"elena@krewtree.dev"}','email','elena@krewtree.dev',NOW(),NOW(),NOW()),
  ('a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000006',
   '{"sub":"a1000000-0000-0000-0000-000000000006","email":"marcus@krewtree.dev"}','email','marcus@krewtree.dev',NOW(),NOW(),NOW()),
  ('a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000007',
   '{"sub":"a1000000-0000-0000-0000-000000000007","email":"olivia@krewtree.dev"}','email','olivia@krewtree.dev',NOW(),NOW(),NOW()),
  ('a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000008',
   '{"sub":"a1000000-0000-0000-0000-000000000008","email":"devon@krewtree.dev"}','email','devon@krewtree.dev',NOW(),NOW(),NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (id, role) VALUES
  ('a1000000-0000-0000-0000-000000000001','worker'),
  ('a1000000-0000-0000-0000-000000000002','worker'),
  ('a1000000-0000-0000-0000-000000000003','worker'),
  ('a1000000-0000-0000-0000-000000000004','worker'),
  ('a1000000-0000-0000-0000-000000000005','worker'),
  ('a1000000-0000-0000-0000-000000000006','worker'),
  ('a1000000-0000-0000-0000-000000000007','worker'),
  ('a1000000-0000-0000-0000-000000000008','worker')
ON CONFLICT (id) DO NOTHING;

-- ── Worker profiles ───────────────────────────────────────────────────────
-- ON CONFLICT DO UPDATE so re-running this migration refreshes content
-- (bio tweaks, regulix flag changes, etc.) without orphaning child rows.
INSERT INTO worker_profiles (
  id, first_name, last_name, city, region, phone, primary_trade, bio,
  is_regulix_ready, performance_score, profile_complete_pct, total_hours_worked, is_premium
) VALUES
  ('a1000000-0000-0000-0000-000000000001',
   'Maya', 'Chen', 'Phoenix', 'AZ', '555-0101', 'Master Electrician',
   'Licensed master electrician with 12 years across commercial and industrial projects. Specialty in panel installs, conduit routing, and low-voltage systems. Crew lead on three Phoenix-metro builds in the last two years.',
   TRUE, 4.9, 100, 18200, TRUE),
  ('a1000000-0000-0000-0000-000000000002',
   'Tyler', 'Brooks', 'Mesa', 'AZ', '555-0102', 'Journeyman Carpenter',
   'Journeyman carpenter, 9 years of commercial framing and finish work. OSHA 30 certified, blueprint-fluent. Comfortable leading 3-5 person crews. Available for long-term or project-based work.',
   TRUE, 4.7, 100, 14600, FALSE),
  ('a1000000-0000-0000-0000-000000000003',
   'Sofia', 'Reyes', 'Tempe', 'AZ', '555-0103', 'HVAC Technician',
   'EPA 608 certified HVAC tech with 6 years on commercial rooftop units and residential service calls. Strong on diagnostics and refrigerant handling. Bilingual English/Spanish on job sites.',
   TRUE, 4.8, 100, 11400, FALSE),
  ('a1000000-0000-0000-0000-000000000004',
   'Jamal', 'Foster', 'Glendale', 'AZ', '555-0104', 'Certified Welder',
   'AWS-certified welder with 7 years of MIG, TIG, and stick experience. Fabrication shop and field repair background. Comfortable reading prints and working from spec drawings.',
   FALSE, 4.6, 92, 9800, FALSE),
  ('a1000000-0000-0000-0000-000000000005',
   'Elena', 'Vargas', 'Scottsdale', 'AZ', '555-0105', 'Registered Nurse',
   'Arizona-licensed RN with 8 years split between urgent care and home health. ACLS and BLS current. Strong with triage, IV starts, and patient education. Open to per-diem or full-time.',
   TRUE, 4.9, 100, 15600, TRUE),
  ('a1000000-0000-0000-0000-000000000006',
   'Marcus', 'Lee', 'Tempe', 'AZ', '555-0106', 'CDL-A Driver',
   'CDL-A driver, 5 years OTR and regional. Clean MVR, hazmat endorsement, comfortable with dry van and flatbed. Looking for local or regional routes that get me home most nights.',
   TRUE, 4.7, 100, 12100, FALSE),
  ('a1000000-0000-0000-0000-000000000007',
   'Olivia', 'Park', 'Gilbert', 'AZ', '555-0107', 'Sous Chef',
   'Sous chef with 6 years in high-volume kitchens. ServSafe Manager certified. Strong on prep flow, menu costing, and crew training. Looking for a kitchen with room to grow into exec.',
   FALSE, 4.5, 95, 10800, FALSE),
  ('a1000000-0000-0000-0000-000000000008',
   'Devon', 'Walsh', 'Chandler', 'AZ', '555-0108', 'Landscape Foreman',
   'Landscape foreman with 4 years leading 4-person crews on commercial maintenance and seasonal installs. AZ pesticide applicator licensed. Equipment-savvy and reliable on schedule.',
   FALSE, 4.4, 88, 7400, FALSE)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  city = EXCLUDED.city,
  region = EXCLUDED.region,
  phone = EXCLUDED.phone,
  primary_trade = EXCLUDED.primary_trade,
  bio = EXCLUDED.bio,
  is_regulix_ready = EXCLUDED.is_regulix_ready,
  performance_score = EXCLUDED.performance_score,
  profile_complete_pct = EXCLUDED.profile_complete_pct,
  total_hours_worked = EXCLUDED.total_hours_worked,
  is_premium = EXCLUDED.is_premium,
  updated_at = NOW();

-- ── Wipe child rows for these worker_ids so re-running this migration
--    replaces (not appends) skills / work history / industries. Migration
--    is the source of truth for these eight test profiles.
DELETE FROM worker_skills          WHERE worker_id = ANY(ARRAY[
  'a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008']::UUID[]);
DELETE FROM worker_work_history    WHERE worker_id = ANY(ARRAY[
  'a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008']::UUID[]);
DELETE FROM worker_certifications  WHERE worker_id = ANY(ARRAY[
  'a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008']::UUID[]);
DELETE FROM worker_industries      WHERE worker_id = ANY(ARRAY[
  'a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008']::UUID[]);

-- ── Worker industries ─────────────────────────────────────────────────────
INSERT INTO worker_industries (worker_id, industry_id) VALUES
  ('a1000000-0000-0000-0000-000000000001','construction'),
  ('a1000000-0000-0000-0000-000000000002','construction'),
  ('a1000000-0000-0000-0000-000000000003','construction'),
  ('a1000000-0000-0000-0000-000000000004','manufacturing'),
  ('a1000000-0000-0000-0000-000000000004','construction'),
  ('a1000000-0000-0000-0000-000000000005','healthcare'),
  ('a1000000-0000-0000-0000-000000000006','transportation'),
  ('a1000000-0000-0000-0000-000000000007','hospitality'),
  ('a1000000-0000-0000-0000-000000000008','landscaping');

-- ── Worker skills ─────────────────────────────────────────────────────────
-- skill_id NULL for custom entries; the Discover filter reads `name` so the
-- canonical text matters more than the FK here.
INSERT INTO worker_skills (worker_id, industry_id, skill_id, name, years_exp, source) VALUES
  -- Maya Chen — Master Electrician
  ('a1000000-0000-0000-0000-000000000001','construction',NULL,'Electrical Wiring',12,'custom'),
  ('a1000000-0000-0000-0000-000000000001','construction',NULL,'Conduit Bending',10,'custom'),
  ('a1000000-0000-0000-0000-000000000001','construction',NULL,'Blueprint Reading',9,'suggested'),
  ('a1000000-0000-0000-0000-000000000001','construction',NULL,'OSHA 10',8,'suggested'),

  -- Tyler Brooks — Journeyman Carpenter
  ('a1000000-0000-0000-0000-000000000002','construction',NULL,'Framing',9,'custom'),
  ('a1000000-0000-0000-0000-000000000002','construction',NULL,'Carpentry',9,'custom'),
  ('a1000000-0000-0000-0000-000000000002','construction',NULL,'Blueprint Reading',7,'suggested'),
  ('a1000000-0000-0000-0000-000000000002','construction',NULL,'OSHA 30',5,'suggested'),

  -- Sofia Reyes — HVAC Technician
  ('a1000000-0000-0000-0000-000000000003','construction',NULL,'HVAC',6,'custom'),
  ('a1000000-0000-0000-0000-000000000003','construction',NULL,'Refrigeration',6,'custom'),
  ('a1000000-0000-0000-0000-000000000003','construction',NULL,'EPA Section 608',5,'custom'),
  ('a1000000-0000-0000-0000-000000000003','construction',NULL,'Troubleshooting',6,'custom'),

  -- Jamal Foster — Certified Welder
  ('a1000000-0000-0000-0000-000000000004','manufacturing',NULL,'MIG Welding',7,'custom'),
  ('a1000000-0000-0000-0000-000000000004','manufacturing',NULL,'TIG Welding',5,'custom'),
  ('a1000000-0000-0000-0000-000000000004','manufacturing',NULL,'Stick Welding',7,'custom'),
  ('a1000000-0000-0000-0000-000000000004','manufacturing',NULL,'Blueprint Reading',6,'suggested'),

  -- Elena Vargas — Registered Nurse
  ('a1000000-0000-0000-0000-000000000005','healthcare',NULL,'Patient Care',8,'custom'),
  ('a1000000-0000-0000-0000-000000000005','healthcare',NULL,'IV Therapy',6,'custom'),
  ('a1000000-0000-0000-0000-000000000005','healthcare',NULL,'CPR/BLS',8,'custom'),
  ('a1000000-0000-0000-0000-000000000005','healthcare',NULL,'Triage',7,'custom'),

  -- Marcus Lee — CDL-A Driver
  ('a1000000-0000-0000-0000-000000000006','transportation',NULL,'CDL-A',5,'custom'),
  ('a1000000-0000-0000-0000-000000000006','transportation',NULL,'DOT Compliance',5,'custom'),
  ('a1000000-0000-0000-0000-000000000006','transportation',NULL,'Hazmat Endorsement',3,'custom'),
  ('a1000000-0000-0000-0000-000000000006','transportation',NULL,'Load Securement',5,'custom'),

  -- Olivia Park — Sous Chef
  ('a1000000-0000-0000-0000-000000000007','hospitality',NULL,'Knife Skills',6,'custom'),
  ('a1000000-0000-0000-0000-000000000007','hospitality',NULL,'Food Safety',6,'custom'),
  ('a1000000-0000-0000-0000-000000000007','hospitality',NULL,'Menu Planning',4,'custom'),
  ('a1000000-0000-0000-0000-000000000007','hospitality',NULL,'Kitchen Management',3,'custom'),

  -- Devon Walsh — Landscape Foreman
  ('a1000000-0000-0000-0000-000000000008','landscaping',NULL,'Irrigation',4,'custom'),
  ('a1000000-0000-0000-0000-000000000008','landscaping',NULL,'Equipment Operation',4,'custom'),
  ('a1000000-0000-0000-0000-000000000008','landscaping',NULL,'Crew Management',3,'custom'),
  ('a1000000-0000-0000-0000-000000000008','landscaping',NULL,'Mowing',4,'custom');

-- ── Worker work history ───────────────────────────────────────────────────
INSERT INTO worker_work_history (worker_id, employer_name, role_title, start_date, end_date, is_current, contract_type, industry_id, description, is_regulix_verified) VALUES
  -- Maya
  ('a1000000-0000-0000-0000-000000000001','Sun Valley Electric','Master Electrician','2020-04-01',NULL,TRUE,'long_term_temp','construction','Lead electrician on commercial fit-outs across Phoenix. Crew of four, panel and low-voltage work.',TRUE),
  ('a1000000-0000-0000-0000-000000000001','Cactus Power Co.','Journeyman Electrician','2014-08-01','2020-03-01',FALSE,'long_term_temp','construction','Industrial wiring and conduit installs on warehouse projects.',TRUE),

  -- Tyler
  ('a1000000-0000-0000-0000-000000000002','Desert Frame Builders','Lead Carpenter','2021-02-01',NULL,TRUE,'long_term_temp','construction','Commercial framing lead on Phoenix-metro builds. Blueprint interpretation and crew coordination.',TRUE),
  ('a1000000-0000-0000-0000-000000000002','Mesa Custom Homes','Carpenter','2016-05-01','2021-01-01',FALSE,'long_term_temp','construction','Residential rough and finish carpentry across new builds.',FALSE),

  -- Sofia
  ('a1000000-0000-0000-0000-000000000003','Cooltown HVAC','HVAC Tech','2022-03-01',NULL,TRUE,'long_term_temp','construction','Commercial RTU service and residential calls across the East Valley.',TRUE),
  ('a1000000-0000-0000-0000-000000000003','AZ Climate Pros','HVAC Apprentice','2019-06-01','2022-02-01',FALSE,'long_term_temp','construction','Apprenticeship under licensed techs, residential and light commercial.',FALSE),

  -- Jamal
  ('a1000000-0000-0000-0000-000000000004','Westside Fabrication','Welder','2021-09-01',NULL,TRUE,'long_term_temp','manufacturing','Structural and architectural fabrication. Heavy MIG and TIG.',TRUE),
  ('a1000000-0000-0000-0000-000000000004','Foster Iron Works','Welder/Fitter','2018-04-01','2021-08-01',FALSE,'long_term_temp','manufacturing','Custom fabrication and on-site field repairs.',FALSE),

  -- Elena
  ('a1000000-0000-0000-0000-000000000005','Scottsdale Urgent Care','RN','2021-01-01',NULL,TRUE,'long_term_temp','healthcare','Urgent care RN. Triage, IV starts, minor procedures, patient education.',TRUE),
  ('a1000000-0000-0000-0000-000000000005','Valley Home Health','RN','2017-08-01','2020-12-01',FALSE,'long_term_temp','healthcare','Home health visits for post-acute patients. Wound care and med management.',TRUE),

  -- Marcus
  ('a1000000-0000-0000-0000-000000000006','Sand Devil Logistics','Regional Driver','2022-06-01',NULL,TRUE,'long_term_temp','transportation','Regional dry van and flatbed routes AZ/NM/NV. Spotless MVR.',TRUE),
  ('a1000000-0000-0000-0000-000000000006','Copper State Trucking','OTR Driver','2020-04-01','2022-05-01',FALSE,'long_term_temp','transportation','Long-haul OTR across the Western US.',FALSE),

  -- Olivia
  ('a1000000-0000-0000-0000-000000000007','The Sage House','Sous Chef','2022-08-01',NULL,TRUE,'long_term_temp','hospitality','Sous chef in a 200-seat upscale casual restaurant. Menu costing and crew scheduling.',FALSE),
  ('a1000000-0000-0000-0000-000000000007','Gilbert Provisions','Line Cook','2019-11-01','2022-07-01',FALSE,'long_term_temp','hospitality','High-volume line cook. Grill, saute, expo.',FALSE),

  -- Devon
  ('a1000000-0000-0000-0000-000000000008','GreenEdge Landscaping','Crew Foreman','2023-03-01',NULL,TRUE,'long_term_temp','landscaping','Foreman on commercial maintenance contracts. 4-person crew, route scheduling, client check-ins.',FALSE),
  ('a1000000-0000-0000-0000-000000000008','Sonoran Lawn & Tree','Crew Member','2020-04-01','2023-02-01',FALSE,'long_term_temp','landscaping','Residential lawn care and seasonal tree work.',FALSE);

-- ── Worker certifications ─────────────────────────────────────────────────
INSERT INTO worker_certifications (worker_id, cert_name, issuing_body, expiry_date) VALUES
  ('a1000000-0000-0000-0000-000000000001','Arizona Master Electrician License','Arizona Registrar of Contractors','2027-04-30'),
  ('a1000000-0000-0000-0000-000000000001','OSHA 10','OSHA','2028-01-15'),
  ('a1000000-0000-0000-0000-000000000002','OSHA 30','OSHA','2027-09-20'),
  ('a1000000-0000-0000-0000-000000000003','EPA Section 608 Universal','EPA',NULL),
  ('a1000000-0000-0000-0000-000000000004','AWS Certified Welder','American Welding Society','2026-11-01'),
  ('a1000000-0000-0000-0000-000000000005','Arizona RN License','AZ Board of Nursing','2027-06-30'),
  ('a1000000-0000-0000-0000-000000000005','ACLS','American Heart Association','2026-08-15'),
  ('a1000000-0000-0000-0000-000000000005','BLS','American Heart Association','2026-08-15'),
  ('a1000000-0000-0000-0000-000000000006','CDL-A','AZ MVD','2028-03-22'),
  ('a1000000-0000-0000-0000-000000000006','Hazmat Endorsement','TSA','2027-12-10'),
  ('a1000000-0000-0000-0000-000000000007','ServSafe Manager','National Restaurant Association','2027-02-28'),
  ('a1000000-0000-0000-0000-000000000008','AZ Pesticide Applicator','AZ Department of Agriculture','2026-10-05');

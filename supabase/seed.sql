-- ============================================================
-- KREWTREE — Seed Data (local development only)
-- Run via: supabase db reset
-- ============================================================

-- ── Fixed UUIDs for reproducible dev data ─────────────────
-- Workers:  a0000000-0000-0000-0000-00000000000{1-5}
-- Companies: b0000000-0000-0000-0000-00000000000{1-5}
-- Jobs:      c0000000-0000-0000-0000-00000000000{1-8}

-- ── Reference: Industries ─────────────────────────────────
INSERT INTO industries (id, name, slug, color, job_count) VALUES
  ('construction',  'Construction',  'construction',  '#8B6914', 2841),
  ('healthcare',    'Healthcare',    'healthcare',    '#1d5669', 3102),
  ('hospitality',   'Hospitality',   'hospitality',   '#7a3e6d', 1953),
  ('retail',        'Retail',        'retail',        '#6D7531', 2210),
  ('transportation','Transportation','transportation', '#0A232D', 1677),
  ('manufacturing', 'Manufacturing', 'manufacturing',  '#454545', 1389),
  ('landscaping',   'Landscaping',   'landscaping',   '#4d5a16',  894),
  ('security',      'Security',      'security',      '#164355',  762);

-- ── Reference: Skills (construction subset) ───────────────
INSERT INTO skills (id, industry_id, name, aliases) VALUES
  ('carpentry',     'construction', 'Carpentry',               ARRAY['carpenter','woodwork','finish carpentry']),
  ('framing',       'construction', 'Framing',                 ARRAY['wood framing','stud framing','rough framing']),
  ('drywall',       'construction', 'Drywall Installation',    ARRAY['drywall','sheetrock','gypsum board']),
  ('concrete',      'construction', 'Concrete Work',           ARRAY['concrete pouring','concrete finishing','flatwork']),
  ('masonry',       'construction', 'Masonry',                 ARRAY['bricklaying','block laying','stonework']),
  ('plumbing',      'construction', 'Plumbing',                ARRAY['plumber','pipe fitting','drain work']),
  ('electrical',    'construction', 'Electrical Wiring',       ARRAY['electrician','electrical','wiring']),
  ('hvac',          'construction', 'HVAC',                    ARRAY['hvac tech','heating and cooling','refrigeration']),
  ('roofing',       'construction', 'Roofing',                 ARRAY['roofer','shingles','flat roofing']),
  ('blueprint',     'construction', 'Blueprint Reading',       ARRAY['blueprints','plan reading','schematic reading']),
  ('osha',          'construction', 'OSHA Safety Compliance',  ARRAY['osha 10','osha 30','safety','job site safety']),
  ('heavy_equip',   'construction', 'Heavy Equipment Operation',ARRAY['equipment operator','bulldozer','backhoe','excavator']),
  ('welding',       'construction', 'Welding (MIG/TIG)',        ARRAY['welder','mig welding','tig welding']),
  ('scaffolding',   'construction', 'Scaffolding',             ARRAY['scaffold erection','aerial lift']),
  ('demolition',    'construction', 'Demolition',              ARRAY['demo','selective demo']);

INSERT INTO skills (id, industry_id, name, aliases) VALUES
  ('patient_care',      'healthcare', 'Patient Care',            ARRAY['direct patient care','bedside care']),
  ('vitals',            'healthcare', 'Vital Signs Monitoring',  ARRAY['vitals','blood pressure monitoring','pulse ox']),
  ('medication_admin',  'healthcare', 'Medication Administration',ARRAY['med pass','medication management']),
  ('cpr_bls',           'healthcare', 'CPR/BLS',                 ARRAY['cpr','bls','basic life support']),
  ('emr',               'healthcare', 'EMR / EHR',               ARRAY['emr','ehr','epic','cerner','electronic records']),
  ('phlebotomy',        'healthcare', 'Phlebotomy',              ARRAY['blood draw','venipuncture']),
  ('wound_care',        'healthcare', 'Wound Care',              ARRAY['dressing changes','wound assessment']),
  ('scheduling',        'healthcare', 'Scheduling',              ARRAY['appointment scheduling','patient scheduling']);

INSERT INTO skills (id, industry_id, name, aliases) VALUES
  ('forklift',       'manufacturing', 'Forklift Operation',   ARRAY['forklift certified','forklift operator','pallet jack']),
  ('welding_mfg',    'manufacturing', 'Welding',              ARRAY['welder','mig','tig']),
  ('cnc',            'manufacturing', 'CNC Operation',        ARRAY['cnc machinist','cnc operator','machine shop']),
  ('quality_ctrl',   'manufacturing', 'Quality Control',      ARRAY['qc','quality inspection','iso']),
  ('assembly',       'manufacturing', 'Assembly Line',        ARRAY['production line','assembly']),
  ('safety_mfg',     'manufacturing', 'Workplace Safety',     ARRAY['osha','safety compliance','lockout tagout']);

-- ── Reference: Locations ──────────────────────────────────
INSERT INTO location_regions (id, city, state, slug, job_count, featured_industries) VALUES
  ('phoenix',   'Phoenix',   'AZ', 'phoenix-az',   847, ARRAY['construction','healthcare','hospitality']),
  ('dallas',    'Dallas',    'TX', 'dallas-tx',    912, ARRAY['construction','manufacturing','healthcare']),
  ('atlanta',   'Atlanta',   'GA', 'atlanta-ga',   673, ARRAY['healthcare','hospitality','retail']),
  ('chicago',   'Chicago',   'IL', 'chicago-il',   1024,ARRAY['manufacturing','construction','transportation']),
  ('denver',    'Denver',    'CO', 'denver-co',    541, ARRAY['construction','landscaping','hospitality']),
  ('miami',     'Miami',     'FL', 'miami-fl',     768, ARRAY['hospitality','construction','healthcare']),
  ('seattle',   'Seattle',   'WA', 'seattle-wa',   489, ARRAY['construction','healthcare','manufacturing']),
  ('austin',    'Austin',    'TX', 'austin-tx',    623, ARRAY['construction','retail','hospitality']);

-- ── Auth users (local dev only — do not run against production) ──
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES
  -- Workers
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000001','authenticated','authenticated',
   'marcus@krewtree.test', crypt('devpass123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000002','authenticated','authenticated',
   'priya@krewtree.test',  crypt('devpass123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000003','authenticated','authenticated',
   'diego@krewtree.test',  crypt('devpass123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000004','authenticated','authenticated',
   'aaliyah@krewtree.test',crypt('devpass123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000005','authenticated','authenticated',
   'james@krewtree.test',  crypt('devpass123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"worker"}', NOW(),NOW(),'','','',''),
  -- Companies
  ('00000000-0000-0000-0000-000000000000','b0000000-0000-0000-0000-000000000001','authenticated','authenticated',
   'apex@krewtree.test',      crypt('devpass123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"company"}',NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','b0000000-0000-0000-0000-000000000002','authenticated','authenticated',
   'sunstate@krewtree.test',  crypt('devpass123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"company"}',NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','b0000000-0000-0000-0000-000000000003','authenticated','authenticated',
   'mesaprime@krewtree.test', crypt('devpass123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"company"}',NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','b0000000-0000-0000-0000-000000000004','authenticated','authenticated',
   'routeone@krewtree.test',  crypt('devpass123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"company"}',NOW(),NOW(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','b0000000-0000-0000-0000-000000000005','authenticated','authenticated',
   'greenedge@krewtree.test', crypt('devpass123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"role":"company"}',NOW(),NOW(),'','','','');

-- Auth identities (required for email login)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001',
   '{"sub":"a0000000-0000-0000-0000-000000000001","email":"marcus@krewtree.test"}',  'email','marcus@krewtree.test',  NOW(),NOW(),NOW()),
  ('a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000002',
   '{"sub":"a0000000-0000-0000-0000-000000000002","email":"priya@krewtree.test"}',   'email','priya@krewtree.test',   NOW(),NOW(),NOW()),
  ('a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000003',
   '{"sub":"a0000000-0000-0000-0000-000000000003","email":"diego@krewtree.test"}',   'email','diego@krewtree.test',   NOW(),NOW(),NOW()),
  ('a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000004',
   '{"sub":"a0000000-0000-0000-0000-000000000004","email":"aaliyah@krewtree.test"}', 'email','aaliyah@krewtree.test', NOW(),NOW(),NOW()),
  ('a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000005',
   '{"sub":"a0000000-0000-0000-0000-000000000005","email":"james@krewtree.test"}',   'email','james@krewtree.test',   NOW(),NOW(),NOW()),
  ('b0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
   '{"sub":"b0000000-0000-0000-0000-000000000001","email":"apex@krewtree.test"}',     'email','apex@krewtree.test',     NOW(),NOW(),NOW()),
  ('b0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000002',
   '{"sub":"b0000000-0000-0000-0000-000000000002","email":"sunstate@krewtree.test"}', 'email','sunstate@krewtree.test', NOW(),NOW(),NOW()),
  ('b0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000003',
   '{"sub":"b0000000-0000-0000-0000-000000000003","email":"mesaprime@krewtree.test"}','email','mesaprime@krewtree.test',NOW(),NOW(),NOW()),
  ('b0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000004',
   '{"sub":"b0000000-0000-0000-0000-000000000004","email":"routeone@krewtree.test"}', 'email','routeone@krewtree.test', NOW(),NOW(),NOW()),
  ('b0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000005',
   '{"sub":"b0000000-0000-0000-0000-000000000005","email":"greenedge@krewtree.test"}','email','greenedge@krewtree.test',NOW(),NOW(),NOW());

-- ── user_roles ────────────────────────────────────────────
INSERT INTO user_roles (id, role) VALUES
  ('a0000000-0000-0000-0000-000000000001','worker'),
  ('a0000000-0000-0000-0000-000000000002','worker'),
  ('a0000000-0000-0000-0000-000000000003','worker'),
  ('a0000000-0000-0000-0000-000000000004','worker'),
  ('a0000000-0000-0000-0000-000000000005','worker'),
  ('b0000000-0000-0000-0000-000000000001','company'),
  ('b0000000-0000-0000-0000-000000000002','company'),
  ('b0000000-0000-0000-0000-000000000003','company'),
  ('b0000000-0000-0000-0000-000000000004','company'),
  ('b0000000-0000-0000-0000-000000000005','company');

-- ── Worker profiles ───────────────────────────────────────
INSERT INTO worker_profiles (id, first_name, last_name, city, region, phone, primary_trade, bio, is_regulix_ready, performance_score, profile_complete_pct, total_hours_worked, is_premium) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'Marcus', 'T.', 'Phoenix', 'AZ', '', 'Journeyman Carpenter · 8 yrs experience',
   'Experienced journeyman carpenter specializing in commercial framing. Safety-first mindset, OSHA 30 certified. Reliable, team-oriented, always on time.',
   TRUE, 4.8, 100, 14800, TRUE),
  ('a0000000-0000-0000-0000-000000000002',
   'Priya S.', 'Scottsdale', 'AZ', '', 'CNA · Home Health & Urgent Care',
   'Compassionate CNA with 7 years in home health and urgent care settings. Active AZ certification. Known for building strong patient rapport and calm demeanor.',
   TRUE, 4.9, 98, 11200, FALSE),
  ('a0000000-0000-0000-0000-000000000003',
   'Diego R.', 'Tempe', 'AZ', '', 'CDL-A Driver · 5 yrs clean record',
   'Safety-focused CDL-A driver with a spotless 5-year MVR. Experienced in local and regional routes across AZ and NM. Home daily preferred.',
   TRUE, 4.7, 92, 9400, FALSE),
  ('a0000000-0000-0000-0000-000000000004',
   'Aaliyah M.', 'Mesa', 'AZ', '', 'Line Cook & Prep Cook · Culinary School Grad',
   'Culinary school graduate with 4 years of line cook experience in high-volume kitchens. Fast, clean, great team player.',
   FALSE, 4.5, 85, 6200, FALSE),
  ('a0000000-0000-0000-0000-000000000005',
   'James K.', 'Chandler', 'AZ', '', 'General Laborer · Landscaping & Construction',
   'Hardworking general laborer with experience in both landscaping and construction site work. Reliable, early riser, steel-toe always on.',
   FALSE, NULL, 60, NULL, FALSE);

-- ── Worker industries ─────────────────────────────────────
INSERT INTO worker_industries (worker_id, industry_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'construction'),
  ('a0000000-0000-0000-0000-000000000002', 'healthcare'),
  ('a0000000-0000-0000-0000-000000000003', 'transportation'),
  ('a0000000-0000-0000-0000-000000000004', 'hospitality'),
  ('a0000000-0000-0000-0000-000000000005', 'landscaping'),
  ('a0000000-0000-0000-0000-000000000005', 'construction');

-- ── Worker skills ─────────────────────────────────────────
INSERT INTO worker_skills (worker_id, industry_id, skill_id, name, years_exp, source) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'construction', 'framing',   'Framing',          8, 'suggested'),
  ('a0000000-0000-0000-0000-000000000001', 'construction', 'blueprint', 'Blueprint Reading', 6, 'suggested'),
  ('a0000000-0000-0000-0000-000000000001', 'construction', 'osha',      'OSHA 30',           3, 'suggested'),
  ('a0000000-0000-0000-0000-000000000001', 'construction', 'carpentry', 'Carpentry',         8, 'suggested'),

  ('a0000000-0000-0000-0000-000000000002', 'healthcare', 'patient_care',     'Patient Care',           7, 'suggested'),
  ('a0000000-0000-0000-0000-000000000002', 'healthcare', 'cpr_bls',          'CPR/BLS',                7, 'suggested'),
  ('a0000000-0000-0000-0000-000000000002', 'healthcare', 'vitals',           'Vital Signs Monitoring', 7, 'suggested'),
  ('a0000000-0000-0000-0000-000000000002', 'healthcare', 'medication_admin', 'Medication Administration',5,'suggested'),

  ('a0000000-0000-0000-0000-000000000003', 'transportation', NULL, 'CDL-A',          5, 'custom'),
  ('a0000000-0000-0000-0000-000000000003', 'transportation', NULL, 'DOT Compliance', 5, 'custom'),
  ('a0000000-0000-0000-0000-000000000003', 'transportation', NULL, 'Load Securement',4, 'custom'),

  ('a0000000-0000-0000-0000-000000000004', 'hospitality', NULL, 'Prep Cook',   4, 'custom'),
  ('a0000000-0000-0000-0000-000000000004', 'hospitality', NULL, 'Grill',       3, 'custom'),
  ('a0000000-0000-0000-0000-000000000004', 'hospitality', NULL, 'Knife Skills',4, 'custom'),
  ('a0000000-0000-0000-0000-000000000004', 'hospitality', NULL, 'Food Safety', 4, 'custom'),

  ('a0000000-0000-0000-0000-000000000005', 'landscaping',  NULL, 'Mowing',    2, 'custom'),
  ('a0000000-0000-0000-0000-000000000005', 'landscaping',  NULL, 'Trimming',  2, 'custom'),
  ('a0000000-0000-0000-0000-000000000005', 'construction', NULL, 'Site Cleanup',1,'custom');

-- ── Worker work history ───────────────────────────────────
INSERT INTO worker_work_history (worker_id, employer_name, role_title, start_date, end_date, is_current, contract_type, industry_id, description, is_regulix_verified) VALUES
  ('a0000000-0000-0000-0000-000000000001','Desert Sun Construction','Lead Carpenter',    '2021-03-01',NULL,       TRUE, 'long_term_temp','construction','Led framing crew on commercial projects across Phoenix metro. Blueprint interpretation and daily crew coordination.',TRUE),
  ('a0000000-0000-0000-0000-000000000001','Pinnacle Builds',        'Framing Carpenter', '2018-06-01','2021-02-01',FALSE,'long_term_temp','construction','Residential framing on new construction communities. OSHA 30 completed during tenure.',TRUE),

  ('a0000000-0000-0000-0000-000000000002','SunState Health',   'CNA',            '2020-01-01',NULL,       TRUE, 'long_term_temp','healthcare','Home health and urgent care CNA. Patient vitals, medication reminders, and daily living support.',TRUE),
  ('a0000000-0000-0000-0000-000000000002','Comfort Care Agency','Home Health Aide','2017-09-01','2019-12-01',FALSE,'project',      'healthcare','In-home care for elderly patients. ADLs, companionship, and safety monitoring.',FALSE),

  ('a0000000-0000-0000-0000-000000000003','Swift Transport','Regional Driver','2022-01-01',NULL,       TRUE, 'long_term_temp','transportation','Regional routes throughout AZ and NM. Perfect safety record, home nightly.',TRUE),
  ('a0000000-0000-0000-0000-000000000003','AZ Freight Co.','Local Driver',  '2019-04-01','2021-11-01',FALSE,'long_term_temp','transportation','Local Phoenix metro delivery routes. Flatbed and dry van experience.',TRUE),

  ('a0000000-0000-0000-0000-000000000004','The Copper Kitchen','Line Cook',  '2022-06-01',NULL,       TRUE, 'long_term_temp','hospitality','Dinner service line cook. Grill, saute, and prep. High-volume 200-cover restaurant.',FALSE),
  ('a0000000-0000-0000-0000-000000000004','Desert Plate Catering','Prep Cook','2020-03-01','2022-05-01',FALSE,'project',     'hospitality','Event prep and catering production. Large-batch cooking and plating for 500+ events.',FALSE),

  ('a0000000-0000-0000-0000-000000000005','Sunrise Landscaping','Crew Member','2023-04-01',NULL,TRUE,'long_term_temp','landscaping','Commercial property maintenance crew. Mowing, edging, irrigation checks, seasonal installs.',FALSE);

-- ── Worker social links ───────────────────────────────────
INSERT INTO worker_social_links (worker_id, platform, url) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'linkedin',  'https://linkedin.com/in/marcus-t'),
  ('a0000000-0000-0000-0000-000000000003', 'instagram', 'https://instagram.com/diego_drives');

-- ── Company profiles ──────────────────────────────────────
INSERT INTO company_profiles (id, name, location, industry, is_verified, description, size, website, tagline, avg_rating, review_count) VALUES
  ('b0000000-0000-0000-0000-000000000001','Apex Builders',        'Phoenix, AZ',  'Construction',   TRUE,  'Commercial and residential construction firm with 20+ years in the Southwest.','51–200','apexbuilders.com',  'Building the Southwest since 2002.',4.2, 18),
  ('b0000000-0000-0000-0000-000000000002','SunState Health',      'Scottsdale, AZ','Healthcare',    TRUE,  'Regional healthcare network operating urgent care and home health services.',  '201–500','sunstatehealth.com','Caring for the community every day.',4.6, 34),
  ('b0000000-0000-0000-0000-000000000003','Mesa Prime Hospitality','Mesa, AZ',    'Hospitality',    FALSE, 'Group operating three upscale restaurants and a catering division.',           '11–50', 'mesaprime.com',    'Where great food meets great service.',3.8, 9),
  ('b0000000-0000-0000-0000-000000000004','RouteOne Logistics',   'Tempe, AZ',    'Transportation', TRUE,  'Last-mile and regional freight carrier serving the greater Phoenix area.',    '51–200','routeone.com',     'On time. Every time.',4.1, 22),
  ('b0000000-0000-0000-0000-000000000005','GreenEdge Landscaping','Chandler, AZ', 'Landscaping',    TRUE,  'Full-service commercial and residential landscaping company.',               '11–50', 'greenedge.com',    'Keeping Arizona green.',4.3, 11);

-- ── Worker reviews ────────────────────────────────────────
INSERT INTO worker_reviews (worker_id, reviewer_id, employer_name, employer_initials, rating, commentary, source) VALUES
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','Apex Builders','AB',5,
   'Marcus showed up every day, on time, and made our crew better. Top-tier framing skills.',          'krewtree'),
  ('a0000000-0000-0000-0000-000000000001',NULL,'Pinnacle Builds','PB',5,
   'Best framer we have had in years. Blueprint-literate and leads junior workers well.',               'krewtree'),
  ('a0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000002','SunState Health','SH',5,
   'Priya is exceptional. Our patients love her. She has never missed a shift in two years.',           'krewtree'),
  ('a0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000004','RouteOne Logistics','RL',5,
   'Clean record, courteous, and always delivers on time. Would hire again without hesitation.',        'krewtree'),
  ('a0000000-0000-0000-0000-000000000004',NULL,'Mesa Prime Hospitality','MP',4,
   'Fast hands on the line and a great attitude. Gets it done during the dinner rush.',                 'krewtree');

-- ── Company benefits ──────────────────────────────────────
INSERT INTO company_benefits (company_id, icon, label, display_order) VALUES
  ('b0000000-0000-0000-0000-000000000001','','Weekly pay',        1),
  ('b0000000-0000-0000-0000-000000000001','','Health insurance',  2),
  ('b0000000-0000-0000-0000-000000000001','','Tool allowance',    3),
  ('b0000000-0000-0000-0000-000000000002','','Medical & dental',  1),
  ('b0000000-0000-0000-0000-000000000002','','Paid time off',     2),
  ('b0000000-0000-0000-0000-000000000002','','Flexible scheduling',3),
  ('b0000000-0000-0000-0000-000000000004','','Weekly pay',        1),
  ('b0000000-0000-0000-0000-000000000004','','Safety bonus',      2),
  ('b0000000-0000-0000-0000-000000000004','','Home daily',        3);

-- ── Jobs ──────────────────────────────────────────────────
INSERT INTO jobs (id, company_id, title, industry, industry_slug, type, location, pay_min, pay_max, pay_type, description, requirements, skills, is_sponsored, regulix_ready_applicants, total_applicants, status) VALUES
  ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
   'Framing Carpenter','Construction','construction','Full-time','Phoenix, AZ',28,38,'hour',
   'Apex Builders is hiring experienced framing carpenters for active commercial projects across the Phoenix metro.',
   ARRAY['3+ years of framing experience','Ability to read blueprints','OSHA 10 preferred','Own hand tools required'],
   ARRAY['Framing','Blueprint Reading','OSHA 10','Power Tools'],
   TRUE, 4, 11, 'active'),

  ('c0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001',
   'General Laborer — Site Cleanup','Construction','construction','Temporary','Glendale, AZ',18,22,'hour',
   'Looking for reliable general laborers for site cleanup and material handling on an active construction project.',
   ARRAY['Physical stamina — lifting up to 50 lbs','Steel-toe boots required','Reliable transportation'],
   ARRAY['Material Handling','Site Cleanup','Safety Awareness'],
   FALSE, 7, 23, 'active'),

  ('c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000002',
   'Certified Nursing Assistant (CNA)','Healthcare','healthcare','Part-time','Scottsdale, AZ',20,26,'hour',
   'SunState Health is seeking compassionate CNAs for our home health division.',
   ARRAY['Active AZ CNA certification','CPR/BLS certified','Valid driver''s license & reliable vehicle'],
   ARRAY['Patient Care','Vitals Monitoring','CPR/BLS','Medication Reminders'],
   TRUE, 2, 8, 'active'),

  ('c0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000002',
   'Medical Receptionist','Healthcare','healthcare','Full-time','Scottsdale, AZ',19,24,'hour',
   'Front-desk receptionist for a busy urgent care clinic.',
   ARRAY['1+ year medical office experience preferred','Familiarity with EMR software','Strong communication skills'],
   ARRAY['EMR','Scheduling','Insurance Verification','Customer Service'],
   FALSE, 3, 16, 'active'),

  ('c0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000003',
   'Line Cook','Hospitality','hospitality','Full-time','Mesa, AZ',18,24,'hour',
   'Mesa Prime Hospitality is hiring energetic line cooks for our flagship restaurant.',
   ARRAY['2+ years kitchen experience','Food Handler''s Card (AZ)','Ability to work evenings & weekends'],
   ARRAY['Prep Cook','Grill','Knife Skills','Food Safety','High Volume'],
   FALSE, 5, 19, 'active'),

  ('c0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000004',
   'CDL-A Delivery Driver','Transportation','transportation','Full-time','Tempe, AZ',28,36,'hour',
   'RouteOne Logistics is expanding our regional fleet. CDL-A drivers needed for day and night routes.',
   ARRAY['Active CDL-A license','Clean MVR (3 years)','DOT physical current','1+ year Class A experience'],
   ARRAY['CDL-A','Route Navigation','DOT Compliance','Load Securement'],
   TRUE, 3, 9, 'active'),

  ('c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000005',
   'Landscape Crew Member','Landscaping','landscaping','Full-time','Chandler, AZ',17,22,'hour',
   'Join GreenEdge''s commercial maintenance crew.',
   ARRAY['Landscaping or grounds experience preferred','Ability to work outdoors daily','Early morning start times (5:30 AM)'],
   ARRAY['Mowing','Trimming','Irrigation','Planting'],
   FALSE, 6, 14, 'active'),

  ('c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000003',
   'Banquet Server','Hospitality','hospitality','Part-time','Mesa, AZ',15,20,'hour',
   'Part-time banquet servers for our catering division. Corporate functions, weddings, and private dinners.',
   ARRAY['Customer service experience','Professional appearance','Weekend availability'],
   ARRAY['Table Service','Event Setup','Customer Service','Food Safety'],
   FALSE, 9, 31, 'active');

-- ── Job analytics ─────────────────────────────────────────
INSERT INTO job_analytics (job_id, views_total, applications_total, conversion_rate, avg_time_to_apply_hours) VALUES
  ('c0000000-0000-0000-0000-000000000001', 284, 11, 0.0387, 18.4),
  ('c0000000-0000-0000-0000-000000000002', 412, 23, 0.0558, 9.2),
  ('c0000000-0000-0000-0000-000000000003', 196,  8, 0.0408, 22.1),
  ('c0000000-0000-0000-0000-000000000004', 388, 16, 0.0412, 16.7),
  ('c0000000-0000-0000-0000-000000000005', 320, 19, 0.0594, 11.3),
  ('c0000000-0000-0000-0000-000000000006', 211,  9, 0.0427, 20.8),
  ('c0000000-0000-0000-0000-000000000007', 278, 14, 0.0504, 13.5),
  ('c0000000-0000-0000-0000-000000000008', 564, 31, 0.0550, 8.9);

-- ── Applications ──────────────────────────────────────────
INSERT INTO applications (worker_id, job_id, status, is_boosted, kanban_stage) VALUES
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','Interviewing',TRUE, 'interview'),
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','Applied',    FALSE,'new'),
  ('a0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000003','Offer',      FALSE,'offer'),
  ('a0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000004','Viewed',     FALSE,'screening'),
  ('a0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000006','Applied',    FALSE,'new'),
  ('a0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000005','Applied',    FALSE,'new'),
  ('a0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000008','Rejected',   FALSE,'rejected'),
  ('a0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000007','Applied',    FALSE,'new');

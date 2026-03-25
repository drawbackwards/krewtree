-- ============================================================
-- KREWTREE — Row-Level Security
-- Default deny on every table; explicit policies grant access.
-- ============================================================

-- ── Enable RLS ────────────────────────────────────────────
ALTER TABLE industries             ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_regions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_industries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_skills          ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_certifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_social_links    ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_work_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_resumes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_endorsements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_benefits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_perks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_analytics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals              ENABLE ROW LEVEL SECURITY;

-- ── Helper: get the current user's role (cached per query) ─
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT role FROM user_roles WHERE id = auth.uid()
$$;

-- ── Reference tables — public read, no public write ───────
CREATE POLICY "public_read" ON industries        FOR SELECT USING (TRUE);
CREATE POLICY "public_read" ON skills            FOR SELECT USING (TRUE);
CREATE POLICY "public_read" ON location_regions  FOR SELECT USING (TRUE);

-- ── user_roles ────────────────────────────────────────────
-- Users can read their own role. Insert is done via setup_profile RPC (SECURITY DEFINER).
CREATE POLICY "own_read"   ON user_roles FOR SELECT USING (id = auth.uid());

-- ── worker_profiles ───────────────────────────────────────
-- Any authenticated user can read worker profiles (employers search workers).
-- Only the worker can write their own profile.
CREATE POLICY "authenticated_read" ON worker_profiles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_insert"         ON worker_profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "own_update"         ON worker_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "own_delete"         ON worker_profiles FOR DELETE USING (id = auth.uid());

-- ── worker sub-tables (skills, certs, history, etc.) ──────
-- Pattern: any authenticated user can read, only owner can write.

CREATE POLICY "authenticated_read" ON worker_industries FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_write"          ON worker_industries FOR ALL   USING (worker_id = auth.uid())
                                                         WITH CHECK (worker_id = auth.uid());

CREATE POLICY "authenticated_read" ON worker_skills FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_write"          ON worker_skills FOR ALL   USING (worker_id = auth.uid())
                                                    WITH CHECK (worker_id = auth.uid());

CREATE POLICY "authenticated_read" ON worker_certifications FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_write"          ON worker_certifications FOR ALL   USING (worker_id = auth.uid())
                                                            WITH CHECK (worker_id = auth.uid());

CREATE POLICY "authenticated_read" ON worker_social_links FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_write"          ON worker_social_links FOR ALL   USING (worker_id = auth.uid())
                                                          WITH CHECK (worker_id = auth.uid());

CREATE POLICY "authenticated_read" ON worker_work_history FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_write"          ON worker_work_history FOR ALL   USING (worker_id = auth.uid())
                                                          WITH CHECK (worker_id = auth.uid());

-- Resumes: only the worker and the worker's applicant companies should access files.
-- For the metadata table, only the worker reads/writes.
CREATE POLICY "own_all" ON worker_resumes FOR ALL USING (worker_id = auth.uid())
                                           WITH CHECK (worker_id = auth.uid());

-- Portfolio items: public read (visible on profile), own write.
CREATE POLICY "authenticated_read" ON worker_portfolio_items FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_write"          ON worker_portfolio_items FOR ALL   USING (worker_id = auth.uid())
                                                             WITH CHECK (worker_id = auth.uid());

-- Endorsements: public read, any authenticated worker can endorse others.
CREATE POLICY "authenticated_read"  ON skill_endorsements FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_insert"          ON skill_endorsements FOR INSERT  WITH CHECK (endorser_id = auth.uid());
CREATE POLICY "own_delete"          ON skill_endorsements FOR DELETE  USING (endorser_id = auth.uid());

-- ── company_profiles ──────────────────────────────────────
CREATE POLICY "authenticated_read" ON company_profiles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_insert"         ON company_profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "own_update"         ON company_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "own_delete"         ON company_profiles FOR DELETE USING (id = auth.uid());

CREATE POLICY "authenticated_read" ON company_benefits FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_write"          ON company_benefits FOR ALL
  USING (company_id = auth.uid()) WITH CHECK (company_id = auth.uid());

CREATE POLICY "authenticated_read" ON company_perks FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_write"          ON company_perks FOR ALL
  USING (company_id = auth.uid()) WITH CHECK (company_id = auth.uid());

-- ── jobs ──────────────────────────────────────────────────
-- Active jobs are visible to all authenticated users.
-- Company manages their own jobs regardless of status.
CREATE POLICY "active_jobs_read" ON jobs FOR SELECT TO authenticated
  USING (status = 'active' OR company_id = auth.uid());
CREATE POLICY "company_insert"   ON jobs FOR INSERT WITH CHECK (company_id = auth.uid());
CREATE POLICY "company_update"   ON jobs FOR UPDATE USING (company_id = auth.uid());
CREATE POLICY "company_delete"   ON jobs FOR DELETE USING (company_id = auth.uid());

-- Job analytics: only the owning company can read.
CREATE POLICY "company_read" ON job_analytics FOR SELECT
  USING (job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid()));
CREATE POLICY "company_write" ON job_analytics FOR ALL
  USING (job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid()));

-- ── applications ──────────────────────────────────────────
-- Workers see and manage their own applications.
-- Companies see (and update status on) applications to their jobs.
CREATE POLICY "worker_own"         ON applications FOR SELECT USING (worker_id = auth.uid());
CREATE POLICY "worker_insert"      ON applications FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY "worker_update"      ON applications FOR UPDATE USING (worker_id = auth.uid());
CREATE POLICY "worker_delete"      ON applications FOR DELETE USING (worker_id = auth.uid());

CREATE POLICY "company_read"       ON applications FOR SELECT
  USING (job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid()));
CREATE POLICY "company_update"     ON applications FOR UPDATE
  USING (job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid()));

-- Application events: accessible to both parties of the application.
CREATE POLICY "parties_read" ON application_events FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM applications
      WHERE worker_id = auth.uid()
         OR job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid())
    )
  );
CREATE POLICY "company_insert" ON application_events FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT id FROM applications
      WHERE job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid())
    )
  );

-- ── saved jobs & searches ─────────────────────────────────
CREATE POLICY "own_all" ON saved_jobs     FOR ALL USING (worker_id = auth.uid()) WITH CHECK (worker_id = auth.uid());
CREATE POLICY "own_all" ON saved_searches FOR ALL USING (worker_id = auth.uid()) WITH CHECK (worker_id = auth.uid());

-- ── reviews ───────────────────────────────────────────────
-- Company reviews: public read, worker owns their own review.
CREATE POLICY "authenticated_read" ON company_reviews FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "own_write"          ON company_reviews FOR ALL
  USING (worker_id = auth.uid()) WITH CHECK (worker_id = auth.uid());

-- Worker reviews: public read, company owns their review.
CREATE POLICY "authenticated_read" ON worker_reviews FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "company_write"      ON worker_reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "company_update"     ON worker_reviews FOR UPDATE USING (reviewer_id = auth.uid());
-- Workers can add a reply to their own review.
CREATE POLICY "worker_reply"       ON worker_reviews FOR UPDATE
  USING (worker_id = auth.uid());

-- ── conversations & messages ──────────────────────────────
-- Only the two parties in a conversation can access it.
CREATE POLICY "parties_read" ON conversations FOR SELECT
  USING (worker_id = auth.uid() OR company_id = auth.uid());
CREATE POLICY "authenticated_insert" ON conversations FOR INSERT TO authenticated
  WITH CHECK (worker_id = auth.uid() OR company_id = auth.uid());

CREATE POLICY "parties_read"   ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE worker_id = auth.uid() OR company_id = auth.uid()
    )
  );
CREATE POLICY "sender_insert"  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "sender_update"  ON messages FOR UPDATE USING (sender_id = auth.uid());

-- ── notifications ─────────────────────────────────────────
CREATE POLICY "own_all" ON notifications FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── referrals ─────────────────────────────────────────────
CREATE POLICY "own_all" ON referrals FOR ALL USING (referrer_id = auth.uid()) WITH CHECK (referrer_id = auth.uid());

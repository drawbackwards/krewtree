-- Unified messaging: one thread per (company, worker) pair.
--
-- Previously messages were split across two tables:
--   * application_message — one thread per application (pipeline auto-sends,
--     task messages, worker replies)
--   * direct_message — one thread per (company, worker) pair (Discover /
--     My Krew chat)
-- The same company and worker could therefore hold parallel threads: one
-- direct thread plus one per application. This migration merges both into a
-- single `message` table keyed on the pair, with application context carried
-- per-message: application_id / application_task_id / subject / calendar_link
-- are nullable and set on pipeline sends (and on messages composed from an
-- application deep link).
--
-- sent_by becomes NOT NULL: legacy auto-sends (application_message.sent_by
-- IS NULL) are backfilled to the company side, the only side that ever
-- auto-sent. That makes unread math persona-free everywhere: a message is
-- "from the other party" iff sent_by <> auth.uid().

-- ── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE message (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID        NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  worker_id           UUID        NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  -- Application context (nullable). The message belongs to the pair
  -- conversation either way and survives application/task deletion.
  application_id      UUID        REFERENCES applications(id) ON DELETE SET NULL,
  application_task_id UUID        REFERENCES application_task(id) ON DELETE SET NULL,
  subject             TEXT        CHECK (subject IS NULL OR length(subject) BETWEEN 1 AND 200),
  body                TEXT        NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  calendar_link       TEXT,
  sent_by             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at             TIMESTAMPTZ,
  -- The sender must be one of the two parties.
  CONSTRAINT message_sender_is_party CHECK (sent_by = company_id OR sent_by = worker_id)
);

-- Thread fetches order by time within a pair; the same index serves the
-- company-side inbox aggregation.
CREATE INDEX idx_message_pair_time ON message (company_id, worker_id, sent_at DESC);
-- Worker-side inbox / unread badge / RLS probes lead with worker_id.
CREATE INDEX idx_message_worker_time ON message (worker_id, sent_at DESC);
-- Unread badge counts filter on read_at IS NULL; one partial per side.
CREATE INDEX idx_message_unread_company ON message (company_id) WHERE read_at IS NULL;
CREATE INDEX idx_message_unread_worker ON message (worker_id) WHERE read_at IS NULL;
-- FK / context lookups (pipeline drawer reads messages by application).
CREATE INDEX idx_message_application ON message (application_id) WHERE application_id IS NOT NULL;
CREATE INDEX idx_message_task ON message (application_task_id) WHERE application_task_id IS NOT NULL;

-- ── Data migration ───────────────────────────────────────────────────────────
-- Original ids, timestamps, and read state are preserved, so merged threads
-- interleave chronologically and nothing re-flags as unread.

INSERT INTO message (id, company_id, worker_id, application_id, application_task_id,
                     subject, body, calendar_link, sent_by, sent_at, read_at)
SELECT m.id, a.company_id, a.worker_id, m.application_id, m.application_task_id,
       m.subject, m.body, m.calendar_link,
       COALESCE(m.sent_by, a.company_id), m.sent_at, m.read_at
FROM application_message m
JOIN applications a ON a.id = m.application_id;

INSERT INTO message (id, company_id, worker_id, body, sent_by, sent_at, read_at)
SELECT d.id, d.company_id, d.worker_id, d.body, d.sent_by, d.sent_at, d.read_at
FROM direct_message d;

DROP TABLE application_message;
DROP TABLE direct_message;

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE message ENABLE ROW LEVEL SECURITY;

-- Each party can read their own conversations.
CREATE POLICY "party_read_messages"
  ON message FOR SELECT
  USING ((select auth.uid()) = company_id OR (select auth.uid()) = worker_id);

-- Each party can send on a conversation they belong to. sent_by must be the
-- caller (no spoofing), and an application tag must reference an application
-- between these two parties.
CREATE POLICY "party_send_messages"
  ON message FOR INSERT
  WITH CHECK (
    sent_by = (select auth.uid())
    AND ((select auth.uid()) = company_id OR (select auth.uid()) = worker_id)
    AND (
      application_id IS NULL
      OR EXISTS (
        SELECT 1 FROM applications a
        WHERE a.id = message.application_id
          AND a.company_id = message.company_id
          AND a.worker_id = message.worker_id
      )
    )
  );

-- Each party can mark messages as read (UPDATE limited to read_at at the
-- application layer, matching prior policy style).
CREATE POLICY "party_mark_read"
  ON message FOR UPDATE
  USING ((select auth.uid()) = company_id OR (select auth.uid()) = worker_id);

-- ── RPCs ─────────────────────────────────────────────────────────────────────
-- Return shape changed (one row per pair, no persona arg — sent_by is always
-- set, so "from the other party" is sent_by <> auth.uid() for either side),
-- so drop + recreate rather than replace.

DROP FUNCTION IF EXISTS public.get_conversation_summaries(text);
DROP FUNCTION IF EXISTS public.get_unread_message_count(text);

-- One aggregated row per pair thread. SECURITY INVOKER: RLS on message,
-- applications, jobs, and the profile tables scopes every row to the caller.
-- The last message carries its application context (job id + title) so the
-- inbox list can show what the conversation is currently about.
CREATE FUNCTION public.get_conversation_summaries()
RETURNS TABLE (
  company_id uuid,
  company_name text,
  company_logo text,
  worker_id uuid,
  worker_first_name text,
  worker_last_name text,
  worker_avatar text,
  last_message_id uuid,
  last_application_id uuid,
  last_job_id uuid,
  last_job_title text,
  last_subject text,
  last_body text,
  last_calendar_link text,
  last_sent_at timestamptz,
  last_sent_by uuid,
  last_read_at timestamptz,
  unread_count bigint,
  message_count bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  with threads as (
    select
      m.company_id as t_company_id,
      m.worker_id as t_worker_id,
      count(*) as message_count,
      count(*) filter (
        where m.read_at is null and m.sent_by <> (select auth.uid())
      ) as unread_count
    from message m
    group by m.company_id, m.worker_id
  )
  select
    cp.id,
    cp.name,
    cp.logo_url,
    wp.id,
    wp.first_name,
    wp.last_name,
    wp.avatar_url,
    lm.id,
    lm.application_id,
    lm.job_id,
    lm.job_title,
    lm.subject,
    lm.body,
    lm.calendar_link,
    lm.sent_at,
    lm.sent_by,
    lm.read_at,
    t.unread_count,
    t.message_count
  from threads t
  join company_profiles cp on cp.id = t.t_company_id
  join worker_profiles wp on wp.id = t.t_worker_id
  cross join lateral (
    select m.id, m.application_id, j.id as job_id, j.title as job_title,
           m.subject, m.body, m.calendar_link, m.sent_at, m.sent_by, m.read_at
    from message m
    left join applications a on a.id = m.application_id
    left join jobs j on j.id = a.job_id
    where m.company_id = t.t_company_id
      and m.worker_id = t.t_worker_id
    order by m.sent_at desc
    limit 1
  ) lm
  order by lm.sent_at desc
$$;

-- Single integer for the nav badge: unread messages from the other party
-- across all of the caller's threads (RLS scopes the rows).
CREATE FUNCTION public.get_unread_message_count()
RETURNS bigint
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  select count(*)
  from message m
  where m.read_at is null
    and m.sent_by <> (select auth.uid())
$$;

GRANT EXECUTE ON FUNCTION public.get_conversation_summaries() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count() TO authenticated;

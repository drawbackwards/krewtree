-- Direct messages: company <-> worker conversations that don't require an
-- application. One thread per (company_id, worker_id) pair — the pair IS the
-- conversation key, so there's no separate conversations table.
--
-- Application threads (application_message) are unchanged and remain the home
-- of pipeline auto-sends, task messages, and calendar links. Direct messages
-- are the chat-style channel used when a company reaches out from Discover or
-- My Krew (and for worker replies to those messages).
--
-- Both profile tables use the auth user id as their primary key, so RLS can
-- compare company_id / worker_id against auth.uid() directly.

CREATE TABLE IF NOT EXISTS direct_message (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  worker_id   UUID        NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  body        TEXT        NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  sent_by     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at     TIMESTAMPTZ,
  -- The sender must be one of the two parties.
  CONSTRAINT direct_message_sender_is_party
    CHECK (sent_by = company_id OR sent_by = worker_id)
);

-- Thread fetches order by time within a pair.
CREATE INDEX IF NOT EXISTS idx_direct_message_pair_time
  ON direct_message (company_id, worker_id, sent_at DESC);

-- Unread lookups (nav badge, inbox counts) filter on read_at IS NULL.
CREATE INDEX IF NOT EXISTS idx_direct_message_unread
  ON direct_message (company_id, worker_id)
  WHERE read_at IS NULL;

ALTER TABLE direct_message ENABLE ROW LEVEL SECURITY;

-- Each party can read their own conversations.
DROP POLICY IF EXISTS "party_read_direct_messages" ON direct_message;
CREATE POLICY "party_read_direct_messages"
  ON direct_message FOR SELECT
  USING (auth.uid() = company_id OR auth.uid() = worker_id);

-- Each party can send on a conversation they belong to. sent_by must be the
-- caller so neither side can spoof the other.
DROP POLICY IF EXISTS "party_send_direct_messages" ON direct_message;
CREATE POLICY "party_send_direct_messages"
  ON direct_message FOR INSERT
  WITH CHECK (
    sent_by = auth.uid()
    AND (auth.uid() = company_id OR auth.uid() = worker_id)
  );

-- Each party can mark messages as read (UPDATE limited to read_at at the
-- application layer, matching the application_message policy style).
DROP POLICY IF EXISTS "party_mark_direct_read" ON direct_message;
CREATE POLICY "party_mark_direct_read"
  ON direct_message FOR UPDATE
  USING (auth.uid() = company_id OR auth.uid() = worker_id);

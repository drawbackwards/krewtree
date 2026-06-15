-- Drop the legacy conversations/messages tables from the initial schema.
-- They were never used by any app code: application threads use
-- application_message and direct threads use direct_message. Their RLS was
-- also flawed (messages INSERT never verified the sender was a party to the
-- conversation, and only the sender could UPDATE, so recipients could never
-- mark messages read).
-- messages must go first: it has an FK to conversations.

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;

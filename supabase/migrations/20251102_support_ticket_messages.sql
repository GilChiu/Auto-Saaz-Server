-- Support ticket messages for Resolution Center

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stm_ticket_created ON support_ticket_messages(ticket_id, created_at);

-- Triggers
DROP TRIGGER IF EXISTS trg_support_ticket_messages_updated_at ON support_ticket_messages;
CREATE TRIGGER trg_support_ticket_messages_updated_at
  BEFORE UPDATE ON support_ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS and service role policies
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service role full access stm" ON support_ticket_messages;
CREATE POLICY "service role full access stm" ON support_ticket_messages FOR ALL USING (auth.role() = 'service_role');

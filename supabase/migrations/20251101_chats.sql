-- Chats schema: conversations, participants, messages

-- conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC NULLS LAST);

-- conversation_participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'garage_owner' CHECK (role IN ('garage_owner','mobile_user','admin')),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uniq_conversation_user UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_part_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_part_conversation ON conversation_participants(conversation_id);

-- messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','file','system')),
  content TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conv_part_updated_at ON conversation_participants;
CREATE TRIGGER update_conv_part_updated_at
  BEFORE UPDATE ON conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Service role policies (functions use service role key)
DROP POLICY IF EXISTS "Service role full access conversations" ON conversations;
CREATE POLICY "Service role full access conversations" ON conversations FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access conv_part" ON conversation_participants;
CREATE POLICY "Service role full access conv_part" ON conversation_participants FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access messages" ON messages;
CREATE POLICY "Service role full access messages" ON messages FOR ALL USING (auth.role() = 'service_role');

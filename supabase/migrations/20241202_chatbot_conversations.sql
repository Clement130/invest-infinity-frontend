-- Migration: Chatbot Conversations & Analytics
-- Description: Tables pour la persistance des conversations et les analytics du chatbot

-- ============================================
-- Table: chatbot_conversations
-- Stocke les sessions de conversation
-- ============================================
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_type TEXT NOT NULL DEFAULT 'visitor' CHECK (user_type IN ('visitor', 'client', 'admin')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count INTEGER NOT NULL DEFAULT 0,
  is_resolved BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_started_at ON chatbot_conversations(started_at DESC);

-- ============================================
-- Table: chatbot_messages
-- Stocke tous les messages des conversations
-- ============================================
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'quick-reply', 'card', 'image', 'file')),
  quick_replies JSONB DEFAULT NULL,
  feedback TEXT DEFAULT NULL CHECK (feedback IN ('positive', 'negative', NULL)),
  attachment_url TEXT DEFAULT NULL,
  attachment_type TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at ON chatbot_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_feedback ON chatbot_messages(feedback) WHERE feedback IS NOT NULL;

-- ============================================
-- Table: chatbot_analytics
-- Stocke les événements analytics
-- ============================================
CREATE TABLE IF NOT EXISTS chatbot_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_type TEXT NOT NULL DEFAULT 'visitor',
  event_type TEXT NOT NULL CHECK (event_type IN (
    'open', 'close', 'message_sent', 'message_received', 
    'quick_reply_click', 'action_executed', 'feedback', 
    'error', 'intent_matched', 'ai_fallback', 'conversion'
  )),
  action TEXT DEFAULT NULL,
  intent_id TEXT DEFAULT NULL,
  content TEXT DEFAULT NULL,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT DEFAULT NULL,
  response_time_ms INTEGER DEFAULT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les analytics
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_session_id ON chatbot_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_event_type ON chatbot_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_created_at ON chatbot_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_user_type ON chatbot_analytics(user_type);

-- ============================================
-- Table: chatbot_feedback_summary
-- Vue matérialisée pour les stats de feedback (optionnel, pour performance)
-- ============================================
CREATE TABLE IF NOT EXISTS chatbot_feedback_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  intent_id TEXT DEFAULT NULL,
  positive_count INTEGER NOT NULL DEFAULT 0,
  negative_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  satisfaction_rate DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, intent_id)
);

-- ============================================
-- Table: chatbot_daily_stats
-- Stats quotidiennes agrégées
-- ============================================
CREATE TABLE IF NOT EXISTS chatbot_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_conversations INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  avg_messages_per_conversation DECIMAL(5,2) DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT NULL,
  intent_match_rate DECIMAL(5,2) DEFAULT 0,
  ai_fallback_rate DECIMAL(5,2) DEFAULT 0,
  positive_feedback_count INTEGER NOT NULL DEFAULT 0,
  negative_feedback_count INTEGER NOT NULL DEFAULT 0,
  satisfaction_rate DECIMAL(5,2) DEFAULT 0,
  top_intents JSONB DEFAULT '[]',
  top_actions JSONB DEFAULT '[]',
  error_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Fonction: Mettre à jour last_message_at et message_count
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chatbot_conversations
  SET 
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour la conversation
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON chatbot_messages;
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON chatbot_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_feedback_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_daily_stats ENABLE ROW LEVEL SECURITY;

-- Policies pour chatbot_conversations
CREATE POLICY "Users can view their own conversations" ON chatbot_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations" ON chatbot_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own conversations" ON chatbot_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations" ON chatbot_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policies pour chatbot_messages
CREATE POLICY "Users can view messages from their conversations" ON chatbot_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chatbot_conversations 
      WHERE chatbot_conversations.id = chatbot_messages.conversation_id 
      AND (chatbot_conversations.user_id = auth.uid() OR chatbot_conversations.user_id IS NULL)
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON chatbot_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chatbot_conversations 
      WHERE chatbot_conversations.id = conversation_id 
      AND (chatbot_conversations.user_id = auth.uid() OR chatbot_conversations.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update feedback on messages" ON chatbot_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chatbot_conversations 
      WHERE chatbot_conversations.id = chatbot_messages.conversation_id 
      AND chatbot_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all messages" ON chatbot_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policies pour chatbot_analytics (lecture admin uniquement)
CREATE POLICY "Admins can view analytics" ON chatbot_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert analytics" ON chatbot_analytics
  FOR INSERT WITH CHECK (true);

-- Policies pour les stats (lecture admin uniquement)
CREATE POLICY "Admins can view feedback summary" ON chatbot_feedback_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view daily stats" ON chatbot_daily_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- Service role policies (pour Edge Functions)
-- ============================================
CREATE POLICY "Service role can do anything on conversations" ON chatbot_conversations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can do anything on messages" ON chatbot_messages
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can do anything on analytics" ON chatbot_analytics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can do anything on feedback_summary" ON chatbot_feedback_summary
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can do anything on daily_stats" ON chatbot_daily_stats
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- Fonction pour calculer les stats quotidiennes
-- ============================================
CREATE OR REPLACE FUNCTION calculate_chatbot_daily_stats(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
DECLARE
  stats_record RECORD;
BEGIN
  SELECT
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(m.id) as total_messages,
    COUNT(DISTINCT c.user_id) FILTER (WHERE c.user_id IS NOT NULL) as unique_users,
    COALESCE(AVG(c.message_count), 0) as avg_messages_per_conversation,
    COUNT(*) FILTER (WHERE a.event_type = 'intent_matched') as intent_matches,
    COUNT(*) FILTER (WHERE a.event_type = 'ai_fallback') as ai_fallbacks,
    COUNT(*) FILTER (WHERE m.feedback = 'positive') as positive_feedback,
    COUNT(*) FILTER (WHERE m.feedback = 'negative') as negative_feedback,
    COUNT(*) FILTER (WHERE a.event_type = 'error') as errors,
    COUNT(*) FILTER (WHERE a.event_type = 'conversion') as conversions
  INTO stats_record
  FROM chatbot_conversations c
  LEFT JOIN chatbot_messages m ON m.conversation_id = c.id
  LEFT JOIN chatbot_analytics a ON a.session_id = c.session_id
  WHERE c.started_at::DATE = target_date;

  INSERT INTO chatbot_daily_stats (
    date,
    total_conversations,
    total_messages,
    unique_users,
    avg_messages_per_conversation,
    intent_match_rate,
    ai_fallback_rate,
    positive_feedback_count,
    negative_feedback_count,
    satisfaction_rate,
    error_count,
    conversion_count,
    updated_at
  ) VALUES (
    target_date,
    COALESCE(stats_record.total_conversations, 0),
    COALESCE(stats_record.total_messages, 0),
    COALESCE(stats_record.unique_users, 0),
    COALESCE(stats_record.avg_messages_per_conversation, 0),
    CASE 
      WHEN (stats_record.intent_matches + stats_record.ai_fallbacks) > 0 
      THEN (stats_record.intent_matches::DECIMAL / (stats_record.intent_matches + stats_record.ai_fallbacks) * 100)
      ELSE 0 
    END,
    CASE 
      WHEN (stats_record.intent_matches + stats_record.ai_fallbacks) > 0 
      THEN (stats_record.ai_fallbacks::DECIMAL / (stats_record.intent_matches + stats_record.ai_fallbacks) * 100)
      ELSE 0 
    END,
    COALESCE(stats_record.positive_feedback, 0),
    COALESCE(stats_record.negative_feedback, 0),
    CASE 
      WHEN (stats_record.positive_feedback + stats_record.negative_feedback) > 0 
      THEN (stats_record.positive_feedback::DECIMAL / (stats_record.positive_feedback + stats_record.negative_feedback) * 100)
      ELSE 0 
    END,
    COALESCE(stats_record.errors, 0),
    COALESCE(stats_record.conversions, 0),
    NOW()
  )
  ON CONFLICT (date) DO UPDATE SET
    total_conversations = EXCLUDED.total_conversations,
    total_messages = EXCLUDED.total_messages,
    unique_users = EXCLUDED.unique_users,
    avg_messages_per_conversation = EXCLUDED.avg_messages_per_conversation,
    intent_match_rate = EXCLUDED.intent_match_rate,
    ai_fallback_rate = EXCLUDED.ai_fallback_rate,
    positive_feedback_count = EXCLUDED.positive_feedback_count,
    negative_feedback_count = EXCLUDED.negative_feedback_count,
    satisfaction_rate = EXCLUDED.satisfaction_rate,
    error_count = EXCLUDED.error_count,
    conversion_count = EXCLUDED.conversion_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE chatbot_conversations IS 'Sessions de conversation du chatbot';
COMMENT ON TABLE chatbot_messages IS 'Messages individuels des conversations';
COMMENT ON TABLE chatbot_analytics IS 'Événements analytics du chatbot';
COMMENT ON TABLE chatbot_daily_stats IS 'Statistiques quotidiennes agrégées';


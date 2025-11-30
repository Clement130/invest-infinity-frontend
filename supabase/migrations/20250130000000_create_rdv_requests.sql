-- Table pour stocker les demandes de rendez-vous Bootcamp Élite
CREATE TABLE IF NOT EXISTS public.rdv_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Informations client
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  -- Informations offre
  offer_id TEXT DEFAULT 'immersion_elite',
  offer_name TEXT DEFAULT 'Bootcamp Élite',
  -- Détails du RDV (stockés dans preferences pour compatibilité)
  preferences TEXT,
  -- Relations
  session_id UUID REFERENCES public.immersion_sessions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Statut et notes
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed', 'cancelled')),
  admin_notes TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS rdv_requests_status_idx ON public.rdv_requests(status);
CREATE INDEX IF NOT EXISTS rdv_requests_created_at_idx ON public.rdv_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS rdv_requests_email_idx ON public.rdv_requests(email);

-- RLS
ALTER TABLE public.rdv_requests ENABLE ROW LEVEL SECURITY;

-- Policy : Admins peuvent tout faire
CREATE POLICY "Admins can manage RDV requests"
  ON public.rdv_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'developer')
    )
  );

-- Policy : Service role peut insérer (pour Edge Functions)
CREATE POLICY "Service role can insert RDV requests"
  ON public.rdv_requests
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy : Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view their own RDV requests"
  ON public.rdv_requests
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_rdv_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rdv_requests_set_timestamp
BEFORE UPDATE ON public.rdv_requests
FOR EACH ROW
EXECUTE FUNCTION update_rdv_requests_timestamp();


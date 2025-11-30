-- ============================================
-- Migration: Créer la table contact_messages
-- Description: Stocke les messages de contact envoyés via le formulaire
-- ============================================

-- Créer la table contact_messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    source TEXT DEFAULT 'contact_page',
    ip_hash TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    notes TEXT, -- Notes internes de l'équipe
    replied_at TIMESTAMPTZ,
    replied_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER trigger_contact_messages_updated_at
    BEFORE UPDATE ON public.contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_messages_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Politique: Les admins peuvent tout voir
CREATE POLICY "Admins can view all contact messages"
    ON public.contact_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Politique: Les admins peuvent modifier les messages
CREATE POLICY "Admins can update contact messages"
    ON public.contact_messages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Politique: Insertion via service role uniquement (Edge Functions)
-- Les utilisateurs anonymes ne peuvent pas insérer directement
-- L'insertion se fait via la Edge Function avec service_role

-- Commentaires sur la table
COMMENT ON TABLE public.contact_messages IS 'Messages de contact envoyés via le formulaire du site';
COMMENT ON COLUMN public.contact_messages.status IS 'Statut du message: new (nouveau), read (lu), replied (répondu), archived (archivé)';
COMMENT ON COLUMN public.contact_messages.ip_hash IS 'Hash de l''IP pour audit, sans stocker l''IP en clair';
COMMENT ON COLUMN public.contact_messages.source IS 'Source du message (contact_page, chatbot, etc.)';


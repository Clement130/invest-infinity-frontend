-- Migration: Ajouter le champ avatar_url à la table profiles
-- Date: 2024-12-01
-- Description: Permet aux utilisateurs de télécharger une photo de profil

-- Ajouter la colonne avatar_url à profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

-- Créer le bucket de storage pour les avatars (si pas déjà existant)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Bucket public pour afficher les avatars
  2097152,  -- 2MB max
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Politique RLS pour le bucket avatars
-- Permettre à tout le monde de voir les avatars (bucket public)
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permettre aux utilisateurs authentifiés d'uploader leur propre avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permettre aux utilisateurs de mettre à jour leur propre avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permettre aux utilisateurs de supprimer leur propre avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Commentaire sur la colonne
COMMENT ON COLUMN profiles.avatar_url IS 'URL de la photo de profil de l''utilisateur (stockée dans Supabase Storage)';


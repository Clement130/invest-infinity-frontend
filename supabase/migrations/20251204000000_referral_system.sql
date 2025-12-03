-- Migration: Système de Parrainage Complet
-- Objectifs :
-- 1. Tables pour codes de parrainage, parrainages, portefeuilles, retraits, paliers
-- 2. Politiques RLS sécurisées
-- 3. Triggers automatiques pour calcul des commissions et paliers
-- 4. Fonctions utilitaires

BEGIN;

-- ============================================================================
-- 1. ÉNUMÉRATIONS
-- ============================================================================

CREATE TYPE public.referral_status AS ENUM ('pending', 'converted', 'validated', 'cancelled');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'rejected');
CREATE TYPE public.referral_tier AS ENUM ('none', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'black_diamond', 'legend');

-- ============================================================================
-- 2. TABLE: CODES DE PARRAINAGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(12) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uses_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherche rapide par code
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);

-- RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Utilisateur peut voir ses propres codes
CREATE POLICY "Users can view own referral codes"
  ON public.referral_codes FOR SELECT
  USING (user_id = auth.uid());

-- Tout le monde peut vérifier si un code existe (pour validation)
CREATE POLICY "Anyone can check code validity"
  ON public.referral_codes FOR SELECT
  USING (is_active = true);

-- Service role peut tout faire
CREATE POLICY "Service role full access on referral_codes"
  ON public.referral_codes FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 3. TABLE: PARRAINAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code_id UUID REFERENCES public.referral_codes(id) ON DELETE SET NULL,
  referred_email VARCHAR(255),
  status public.referral_status NOT NULL DEFAULT 'pending',
  offer_purchased VARCHAR(50),
  original_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  discount_rate DECIMAL(5,2) DEFAULT 10.00,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  commission_amount DECIMAL(10,2),
  bonus_rate DECIMAL(5,2) DEFAULT 0,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  total_commission DECIMAL(10,2),
  stripe_payment_id VARCHAR(255),
  converted_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

-- RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Parrain peut voir ses parrainages
CREATE POLICY "Referrers can view their referrals"
  ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid());

-- Filleul peut voir son parrainage
CREATE POLICY "Referred can view their referral"
  ON public.referrals FOR SELECT
  USING (referred_id = auth.uid());

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Service role peut tout faire
CREATE POLICY "Service role full access on referrals"
  ON public.referrals FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. TABLE: PORTEFEUILLE PARRAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.referral_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  pending_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_withdrawn DECIMAL(10,2) NOT NULL DEFAULT 0,
  iban VARCHAR(34),
  iban_holder_name VARCHAR(100),
  current_tier public.referral_tier NOT NULL DEFAULT 'none',
  total_referrals INTEGER NOT NULL DEFAULT 0,
  converted_referrals INTEGER NOT NULL DEFAULT 0,
  bonus_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.referral_wallets ENABLE ROW LEVEL SECURITY;

-- Utilisateur peut voir son portefeuille
CREATE POLICY "Users can view own wallet"
  ON public.referral_wallets FOR SELECT
  USING (user_id = auth.uid());

-- Utilisateur peut mettre à jour son IBAN uniquement
CREATE POLICY "Users can update own IBAN"
  ON public.referral_wallets FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all wallets"
  ON public.referral_wallets FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Service role peut tout faire
CREATE POLICY "Service role full access on wallets"
  ON public.referral_wallets FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 5. TABLE: DEMANDES DE RETRAIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  iban VARCHAR(34) NOT NULL,
  iban_holder_name VARCHAR(100) NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Utilisateur peut voir ses demandes
CREATE POLICY "Users can view own withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (user_id = auth.uid());

-- Utilisateur peut créer une demande
CREATE POLICY "Users can create withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins peuvent tout voir et modifier
CREATE POLICY "Admins can manage all withdrawal requests"
  ON public.withdrawal_requests FOR ALL
  USING (public.is_admin(auth.uid()));

-- Service role peut tout faire
CREATE POLICY "Service role full access on withdrawals"
  ON public.withdrawal_requests FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 6. TABLE: PALIERS ATTEINTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.referral_tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.referral_tier NOT NULL,
  reached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  reward_claimed_at TIMESTAMPTZ,
  reward_details JSONB
);

-- Index
CREATE INDEX idx_referral_tier_history_user_id ON public.referral_tier_history(user_id);

-- RLS
ALTER TABLE public.referral_tier_history ENABLE ROW LEVEL SECURITY;

-- Utilisateur peut voir son historique
CREATE POLICY "Users can view own tier history"
  ON public.referral_tier_history FOR SELECT
  USING (user_id = auth.uid());

-- Service role peut tout faire
CREATE POLICY "Service role full access on tier history"
  ON public.referral_tier_history FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. FONCTIONS UTILITAIRES
-- ============================================================================

-- Générer un code de parrainage unique (8 caractères alphanumériques)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS VARCHAR(12)
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(12) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Obtenir ou créer le code de parrainage d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id UUID)
RETURNS VARCHAR(12)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code VARCHAR(12);
  v_attempts INTEGER := 0;
BEGIN
  -- Vérifier si l'utilisateur a déjà un code actif
  SELECT code INTO v_code
  FROM public.referral_codes
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;
  
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  
  -- Générer un nouveau code unique
  LOOP
    v_code := public.generate_referral_code();
    v_attempts := v_attempts + 1;
    
    -- Vérifier l'unicité
    IF NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE code = v_code) THEN
      EXIT;
    END IF;
    
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Impossible de générer un code unique après 10 tentatives';
    END IF;
  END LOOP;
  
  -- Insérer le nouveau code
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (p_user_id, v_code);
  
  -- Créer le portefeuille si nécessaire
  INSERT INTO public.referral_wallets (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN v_code;
END;
$$;

-- Valider un code de parrainage et retourner les infos du parrain
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code VARCHAR)
RETURNS TABLE (
  is_valid BOOLEAN,
  referrer_id UUID,
  referrer_name VARCHAR,
  code_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS is_valid,
    rc.user_id AS referrer_id,
    COALESCE(p.full_name, p.email) AS referrer_name,
    rc.id AS code_id
  FROM public.referral_codes rc
  LEFT JOIN public.profiles p ON p.id = rc.user_id
  WHERE rc.code = UPPER(p_code) AND rc.is_active = true
  LIMIT 1;
  
  -- Si aucun résultat, retourner invalide
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::UUID;
  END IF;
END;
$$;

-- Calculer le palier en fonction du nombre de filleuls convertis
CREATE OR REPLACE FUNCTION public.calculate_referral_tier(p_converted_count INTEGER)
RETURNS public.referral_tier
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE
    WHEN p_converted_count >= 100 THEN 'legend'::public.referral_tier
    WHEN p_converted_count >= 50 THEN 'black_diamond'::public.referral_tier
    WHEN p_converted_count >= 20 THEN 'diamond'::public.referral_tier
    WHEN p_converted_count >= 15 THEN 'platinum'::public.referral_tier
    WHEN p_converted_count >= 10 THEN 'gold'::public.referral_tier
    WHEN p_converted_count >= 5 THEN 'silver'::public.referral_tier
    WHEN p_converted_count >= 3 THEN 'bronze'::public.referral_tier
    ELSE 'none'::public.referral_tier
  END;
END;
$$;

-- Calculer le bonus rate en fonction du nombre de filleuls (2% cumulatif)
CREATE OR REPLACE FUNCTION public.calculate_bonus_rate(p_converted_count INTEGER)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Bonus de 2% par palier atteint (max 14% au palier Legend)
  RETURN CASE
    WHEN p_converted_count >= 100 THEN 14.00
    WHEN p_converted_count >= 50 THEN 12.00
    WHEN p_converted_count >= 20 THEN 10.00
    WHEN p_converted_count >= 15 THEN 8.00
    WHEN p_converted_count >= 10 THEN 6.00
    WHEN p_converted_count >= 5 THEN 4.00
    WHEN p_converted_count >= 3 THEN 2.00
    ELSE 0.00
  END;
END;
$$;

-- Créer un parrainage lors d'un achat
CREATE OR REPLACE FUNCTION public.create_referral_on_purchase(
  p_referral_code VARCHAR,
  p_referred_id UUID,
  p_referred_email VARCHAR,
  p_offer VARCHAR,
  p_original_amount DECIMAL,
  p_stripe_payment_id VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_info RECORD;
  v_wallet RECORD;
  v_discount_amount DECIMAL(10,2);
  v_commission_amount DECIMAL(10,2);
  v_bonus_amount DECIMAL(10,2);
  v_total_commission DECIMAL(10,2);
  v_referral_id UUID;
  v_new_tier public.referral_tier;
  v_old_tier public.referral_tier;
BEGIN
  -- Valider le code
  SELECT * INTO v_code_info
  FROM public.referral_codes
  WHERE code = UPPER(p_referral_code) AND is_active = true;
  
  IF v_code_info IS NULL THEN
    RAISE EXCEPTION 'Code de parrainage invalide';
  END IF;
  
  -- Vérifier que le parrain n'est pas le filleul (anti-fraude)
  IF v_code_info.user_id = p_referred_id THEN
    RAISE EXCEPTION 'Auto-parrainage interdit';
  END IF;
  
  -- Récupérer le wallet du parrain pour le bonus rate
  SELECT * INTO v_wallet
  FROM public.referral_wallets
  WHERE user_id = v_code_info.user_id;
  
  IF v_wallet IS NULL THEN
    -- Créer le wallet s'il n'existe pas
    INSERT INTO public.referral_wallets (user_id)
    VALUES (v_code_info.user_id)
    RETURNING * INTO v_wallet;
  END IF;
  
  -- Calculer les montants
  v_discount_amount := ROUND(p_original_amount * 0.10, 2); -- 10% réduction filleul
  v_commission_amount := ROUND(p_original_amount * 0.10, 2); -- 10% commission base
  v_bonus_amount := ROUND(p_original_amount * (COALESCE(v_wallet.bonus_rate, 0) / 100), 2); -- Bonus cumulatif
  v_total_commission := v_commission_amount + v_bonus_amount;
  
  -- Créer le parrainage
  INSERT INTO public.referrals (
    referrer_id,
    referred_id,
    referral_code_id,
    referred_email,
    status,
    offer_purchased,
    original_amount,
    discount_amount,
    discount_rate,
    commission_rate,
    commission_amount,
    bonus_rate,
    bonus_amount,
    total_commission,
    stripe_payment_id,
    converted_at
  ) VALUES (
    v_code_info.user_id,
    p_referred_id,
    v_code_info.id,
    p_referred_email,
    'converted',
    p_offer,
    p_original_amount,
    v_discount_amount,
    10.00,
    10.00,
    v_commission_amount,
    COALESCE(v_wallet.bonus_rate, 0),
    v_bonus_amount,
    v_total_commission,
    p_stripe_payment_id,
    now()
  )
  RETURNING id INTO v_referral_id;
  
  -- Mettre à jour le compteur d'utilisations du code
  UPDATE public.referral_codes
  SET uses_count = uses_count + 1, updated_at = now()
  WHERE id = v_code_info.id;
  
  -- Sauvegarder l'ancien palier
  v_old_tier := v_wallet.current_tier;
  
  -- Mettre à jour le wallet du parrain (pending balance car validation après 14j)
  UPDATE public.referral_wallets
  SET 
    pending_balance = pending_balance + v_total_commission,
    total_referrals = total_referrals + 1,
    converted_referrals = converted_referrals + 1,
    updated_at = now()
  WHERE user_id = v_code_info.user_id
  RETURNING current_tier INTO v_old_tier;
  
  -- Recalculer le palier et le bonus
  SELECT converted_referrals INTO v_wallet.converted_referrals
  FROM public.referral_wallets
  WHERE user_id = v_code_info.user_id;
  
  v_new_tier := public.calculate_referral_tier(v_wallet.converted_referrals);
  
  UPDATE public.referral_wallets
  SET 
    current_tier = v_new_tier,
    bonus_rate = public.calculate_bonus_rate(v_wallet.converted_referrals)
  WHERE user_id = v_code_info.user_id;
  
  -- Si nouveau palier atteint, l'enregistrer
  IF v_new_tier != v_old_tier AND v_new_tier != 'none' THEN
    INSERT INTO public.referral_tier_history (user_id, tier)
    VALUES (v_code_info.user_id, v_new_tier);
  END IF;
  
  RETURN v_referral_id;
END;
$$;

-- Valider les commissions après 14 jours (appelé par cron)
CREATE OR REPLACE FUNCTION public.validate_pending_referrals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_referral RECORD;
BEGIN
  -- Sélectionner les parrainages convertis depuis plus de 14 jours
  FOR v_referral IN
    SELECT id, referrer_id, total_commission
    FROM public.referrals
    WHERE status = 'converted'
      AND converted_at < now() - INTERVAL '14 days'
  LOOP
    -- Mettre à jour le statut
    UPDATE public.referrals
    SET status = 'validated', validated_at = now(), updated_at = now()
    WHERE id = v_referral.id;
    
    -- Transférer de pending vers available
    UPDATE public.referral_wallets
    SET 
      pending_balance = pending_balance - v_referral.total_commission,
      available_balance = available_balance + v_referral.total_commission,
      total_earned = total_earned + v_referral.total_commission,
      updated_at = now()
    WHERE user_id = v_referral.referrer_id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- Créer une demande de retrait
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_user_id UUID,
  p_amount DECIMAL,
  p_iban VARCHAR,
  p_iban_holder_name VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available DECIMAL(10,2);
  v_pending_withdrawal BOOLEAN;
  v_withdrawal_id UUID;
BEGIN
  -- Vérifier le solde disponible
  SELECT available_balance INTO v_available
  FROM public.referral_wallets
  WHERE user_id = p_user_id;
  
  IF v_available IS NULL OR v_available < p_amount THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;
  
  -- Vérifier le seuil minimum
  IF p_amount < 50 THEN
    RAISE EXCEPTION 'Montant minimum de retrait : 50€';
  END IF;
  
  -- Vérifier qu'il n'y a pas de demande en cours
  SELECT EXISTS (
    SELECT 1 FROM public.withdrawal_requests
    WHERE user_id = p_user_id AND status IN ('pending', 'processing')
  ) INTO v_pending_withdrawal;
  
  IF v_pending_withdrawal THEN
    RAISE EXCEPTION 'Une demande de retrait est déjà en cours';
  END IF;
  
  -- Valider le format IBAN (basique)
  IF LENGTH(p_iban) < 15 OR LENGTH(p_iban) > 34 THEN
    RAISE EXCEPTION 'Format IBAN invalide';
  END IF;
  
  -- Créer la demande
  INSERT INTO public.withdrawal_requests (
    user_id, amount, iban, iban_holder_name
  ) VALUES (
    p_user_id, p_amount, UPPER(REPLACE(p_iban, ' ', '')), p_iban_holder_name
  )
  RETURNING id INTO v_withdrawal_id;
  
  -- Bloquer le montant (déduire du available)
  UPDATE public.referral_wallets
  SET 
    available_balance = available_balance - p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Sauvegarder l'IBAN dans le wallet pour les prochaines fois
  UPDATE public.referral_wallets
  SET 
    iban = UPPER(REPLACE(p_iban, ' ', '')),
    iban_holder_name = p_iban_holder_name
  WHERE user_id = p_user_id;
  
  RETURN v_withdrawal_id;
END;
$$;

-- Traiter une demande de retrait (admin)
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_withdrawal_id UUID,
  p_admin_id UUID,
  p_status public.withdrawal_status,
  p_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  -- Vérifier que l'admin est bien admin
  IF NOT public.is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;
  
  -- Récupérer la demande
  SELECT * INTO v_withdrawal
  FROM public.withdrawal_requests
  WHERE id = p_withdrawal_id AND status = 'pending';
  
  IF v_withdrawal IS NULL THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà traitée';
  END IF;
  
  -- Mettre à jour le statut
  UPDATE public.withdrawal_requests
  SET 
    status = p_status,
    admin_note = p_note,
    processed_at = now(),
    processed_by = p_admin_id
  WHERE id = p_withdrawal_id;
  
  -- Si rejeté, rembourser le montant
  IF p_status = 'rejected' THEN
    UPDATE public.referral_wallets
    SET 
      available_balance = available_balance + v_withdrawal.amount,
      updated_at = now()
    WHERE user_id = v_withdrawal.user_id;
  END IF;
  
  -- Si complété, mettre à jour le total withdrawn
  IF p_status = 'completed' THEN
    UPDATE public.referral_wallets
    SET 
      total_withdrawn = total_withdrawn + v_withdrawal.amount,
      updated_at = now()
    WHERE user_id = v_withdrawal.user_id;
  END IF;
  
  RETURN true;
END;
$$;

-- Obtenir les statistiques de parrainage d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_referral_stats(p_user_id UUID)
RETURNS TABLE (
  referral_code VARCHAR,
  available_balance DECIMAL,
  pending_balance DECIMAL,
  total_earned DECIMAL,
  total_withdrawn DECIMAL,
  total_referrals INTEGER,
  converted_referrals INTEGER,
  current_tier public.referral_tier,
  bonus_rate DECIMAL,
  next_tier public.referral_tier,
  referrals_to_next_tier INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code VARCHAR;
  v_wallet RECORD;
  v_next_tier public.referral_tier;
  v_referrals_needed INTEGER;
BEGIN
  -- Obtenir ou créer le code
  v_code := public.get_or_create_referral_code(p_user_id);
  
  -- Récupérer le wallet
  SELECT * INTO v_wallet
  FROM public.referral_wallets
  WHERE referral_wallets.user_id = p_user_id;
  
  -- Calculer le prochain palier
  v_next_tier := CASE v_wallet.current_tier
    WHEN 'none' THEN 'bronze'::public.referral_tier
    WHEN 'bronze' THEN 'silver'::public.referral_tier
    WHEN 'silver' THEN 'gold'::public.referral_tier
    WHEN 'gold' THEN 'platinum'::public.referral_tier
    WHEN 'platinum' THEN 'diamond'::public.referral_tier
    WHEN 'diamond' THEN 'black_diamond'::public.referral_tier
    WHEN 'black_diamond' THEN 'legend'::public.referral_tier
    ELSE NULL
  END;
  
  -- Calculer le nombre de filleuls restants
  v_referrals_needed := CASE v_next_tier
    WHEN 'bronze' THEN 3 - COALESCE(v_wallet.converted_referrals, 0)
    WHEN 'silver' THEN 5 - COALESCE(v_wallet.converted_referrals, 0)
    WHEN 'gold' THEN 10 - COALESCE(v_wallet.converted_referrals, 0)
    WHEN 'platinum' THEN 15 - COALESCE(v_wallet.converted_referrals, 0)
    WHEN 'diamond' THEN 20 - COALESCE(v_wallet.converted_referrals, 0)
    WHEN 'black_diamond' THEN 50 - COALESCE(v_wallet.converted_referrals, 0)
    WHEN 'legend' THEN 100 - COALESCE(v_wallet.converted_referrals, 0)
    ELSE 0
  END;
  
  RETURN QUERY SELECT
    v_code,
    COALESCE(v_wallet.available_balance, 0::DECIMAL),
    COALESCE(v_wallet.pending_balance, 0::DECIMAL),
    COALESCE(v_wallet.total_earned, 0::DECIMAL),
    COALESCE(v_wallet.total_withdrawn, 0::DECIMAL),
    COALESCE(v_wallet.total_referrals, 0),
    COALESCE(v_wallet.converted_referrals, 0),
    COALESCE(v_wallet.current_tier, 'none'::public.referral_tier),
    COALESCE(v_wallet.bonus_rate, 0::DECIMAL),
    v_next_tier,
    GREATEST(v_referrals_needed, 0);
END;
$$;

-- ============================================================================
-- 8. TRIGGER POUR MISE À JOUR AUTOMATIQUE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_referral_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_referral_codes_updated_at
  BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_updated_at();

CREATE TRIGGER trigger_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_updated_at();

CREATE TRIGGER trigger_referral_wallets_updated_at
  BEFORE UPDATE ON public.referral_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_updated_at();

COMMIT;


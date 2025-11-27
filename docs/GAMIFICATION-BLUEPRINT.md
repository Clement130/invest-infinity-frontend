# Gamification Implementation Blueprint

Ce document décrit l’ensemble des travaux nécessaires pour transformer l’espace client en une expérience hautement gamifiée. Il structure l’audit de l’existant, le benchmark, les spécifications techniques (React/TypeScript + Supabase + Discord), les nouvelles UI, ainsi que la priorisation par phase.

---

## 1. Audit de l’existant

| Surface | Référence | Comportement actuel | Limites identifiées |
| --- | --- | --- | --- |
| Stats & XP | [`src/services/memberStatsService.ts`](../src/services/memberStatsService.ts) | XP linéaire (10/lesson, 50/module). `level = floor(xp/100)+1`, `nextLevelXp = level * 100` mais la valeur exposée au front est `xp % 100`, donc barre bloquée à 0-100 et aucun palier thématique. | Pas de différenciation par compétence, pas de mécanisme de bonus/malus, pas de stockage historique. |
| Badges | même service + tables `badges`, `user_badges` | Mélange badges “statiques” (DB) et “dynamiques” (calcul runtime). Affichage simple via [`components/member/BadgesDisplay.tsx`](../src/components/member/BadgesDisplay.tsx). | Pas de notion de sets, de rareté visuelle ni de progression (ex : Bronze → Silver → Gold). |
| Streak | Calcul via `calculateStreak` dans `memberStatsService`. Affiché dans [`MemberDashboard`](../src/pages/MemberDashboard.tsx) et [`DashboardHeader`](../src/components/navigation/DashboardHeader.tsx). | Streak cassé dès qu’aucune activité la veille. Aucune “protection” (Freeze Pass), pas de récompense à seuil. |
| Progress tracking | [`MemberDashboard`](../src/pages/MemberDashboard.tsx), [`ProgressPage`](../src/pages/ProgressPage.tsx), [`ClientApp`](../src/pages/ClientApp.tsx) | Présentation premium (AnimatedProgress, GlassCard, hero). Liste des modules avec progression. | Pas de missions/scénarisation, pas de “quêtes quotidiennes”, absence de compétition sociale. |
| Social | [`ChallengesPage`](../src/pages/ChallengesPage.tsx) + `getActiveChallenges` | Simple listing des challenges actifs, sans leaderboard ni squadding. | Aucune mécanique de groupe, pas de feed d’accomplissements, pas d’intégration Discord côté client. |

**Synthèse gaps :**
- Progression limitée à une seule métrique (XP global) → besoin d’un “XP ladder” multi-paliers par thème (ICT Basics, Execution, Mindset).
- Manque de boucles court-terme : pas de quêtes journalières/hebdo ni de récompenses surprises.
- Faible dimension sociale : pas de squads, ni de leaderboards contextualisés.
- Récompenses principalement décoratives (badges) sans économie interne.

---

## 2. Benchmark (takeaways)

| Plateforme | Fonctionnalités clés | Transposition pour Invest Infinity |
| --- | --- | --- |
| **Duolingo** | Quêtes journalières, coffres (loot), ligues hebdo, streak freeze, notifications ritualisées. | Daily quests + “Season XP League” (classement hebdomadaire). Introduire Freeze Pass pour protéger le streak et loot boxes modulaires. |
| **Brilliant.org** | Roadmaps narratives, badges par “set”, graphiques d’activité très visuels, rappels emails personnalisés. | Mission Timeline (chapitres ICT), cartes d’étapes, heatmap existante enrichie (objectifs journaliers). |
| **FitOn / Peloton** | Classements de squads, annonces communautaires, boosters XP lors d’événements live. | Squads (5-10 traders), notifications Discord “live session”, boosts temporaires (x1.5 XP pendant un live). |

---

## 3. Systèmes de progression (Phase 1 focus)

### 3.1 XP Ladder 2.0
- **But** : suivre la maîtrise par compétence + rendre le leveling plus gratifiant.
- **Data model Supabase** :
  ```sql
  create table public.user_xp_tracks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    track text check (track in ('foundation','execution','mindset','community')),
    xp integer not null default 0,
    level integer not null default 1,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
  create unique index user_track_unique on public.user_xp_tracks(user_id, track);
  ```
- **Service update** : `getUserStats` agrège XP global + par track (via `training_lessons.track_tag`).
- **Front** :
  - `MemberDashboard`: ajouter “Multi-track meter” (4 mini barres).
  - `ProgressPage`: graphique radar “compétence”.
  - `ClientSidebar`: miniature affichant track dominant.

### 3.2 Badge Sets évolutifs
- **Concept** : collections (ex. “ICT Fundamentals”) composées de 5 badges. Chaque badge a 3 tiers.
- **DB** :
  - `badge_sets(id, name, icon, theme)`.
  - `badge_set_items(id, set_id, tier int, badge_id uuid references badges)`.
  - `user_badge_progress(user_id, set_id, progress int)`.
- **UI** : refaire `BadgesDisplay` en cartes collection (Rarety color-coded, lock states, animation Framer Motion).
- **Logic** : `getUserBadges` retourne `sets` + `completionPercent`.

### 3.3 Mission Track / Roadmap
- **But** : donner un fil narratif.
- **Implementation** :
  - Table `missions(id, title, description, order, module_id, reward_focus_coins int, reward_badge_id uuid)`.
  - Table `user_missions(user_id, mission_id, status enum('locked','active','done'), started_at, completed_at)`.
  - Nouveau composant `MissionTimeline.tsx` (cards verticales, stepper).
  - `MemberDashboard`: section “Mission actuelle” + CTA “voir la roadmap”.

---

## 4. Rétention & boucles quotidiennes

### 4.1 Daily / Weekly Quests
- **Tables** :
  ```sql
  create table public.quest_templates (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    type text check (type in ('daily','weekly')),
    target jsonb, -- ex { "metric": "lessons_completed", "value": 1 }
    reward jsonb  -- ex { "xp": 30, "focus_coins": 10 }
  );
  create table public.user_quests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users,
    template_id uuid not null references quest_templates,
    status text check (status in ('active','claimed','expired')) default 'active',
    progress jsonb default '{}'::jsonb,
    expires_at timestamptz,
    claimed_at timestamptz
  );
  ```
- **Service** : `questsService.ts` (React Query `useDailyQuests`).
- **UI** : `DailyGoalsCard` (3 missions max), progress bars, bouton “Réclamer”.
- **Automation** : Supabase cron Function pour assigner quêtes chaque jour (Edge Function + scheduler).

### 4.2 Streak Guardian
- **Freeze Pass** : objet virtuel consommable pour protéger un jour manqué.
- **Tables** : `user_items(user_id, item_type text, quantity int)`.
- **Flow** : si streak casserait, vérifier item → décrémenter + conserver streak.
- **Notifications** : Supabase Edge Function → Discord + email (“Tu as utilisé un Freeze Pass”).

---

## 5. Social & compétition

### 5.1 Squads
- **Data** :
  ```sql
  create table public.squads (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    invitation_code text unique not null,
    created_by uuid references auth.users,
    created_at timestamptz default now()
  );
  create table public.squad_members (
    squad_id uuid references squads on delete cascade,
    user_id uuid references auth.users on delete cascade,
    role text check (role in ('owner','member')),
    joined_at timestamptz default now(),
    primary key(squad_id, user_id)
  );
  ```
- **UI** : onglet `Défis` affiche “Ton Squad” (avatars, progression collective, boutons “Lancer un défi”).
- **Feed** : `squad_activity` table (user_id, type, payload JSON) → carte “Alice a complété un module”.

### 5.2 Leaderboards contextuels
- **Snapshots** : `leaderboard_snapshots(id, scope text, period_start, period_end, data jsonb)`.
- **Scopes** : `weekly_xp`, `module_completion`, `squad_activity`.
- **Client** : widget carrousel sur `MemberDashboard` + page détaillée dans `ChallengesPage`.

### 5.3 Discord Bridge
- Edge Function Supabase (“discord-broadcast”) qui reçoit événements (badge legendary, squad victoire) → POST webhook Discord.
- Front : bouton “Partager sur Discord” (utilise webhook + template message).

---

## 6. Récompenses & économie interne

### 6.1 Focus Coins & Boutique
- **Tables** :
  ```sql
  create table public.user_wallets (
    user_id uuid primary key references auth.users,
    focus_coins integer not null default 0,
    total_earned integer not null default 0,
    updated_at timestamptz default now()
  );
  create table public.store_items (
    id uuid primary key default gen_random_uuid(),
    name text,
    type text check (type in ('theme','booster','freeze','avatar')),
    cost integer not null,
    metadata jsonb
  );
  create table public.user_inventory (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users,
    item_id uuid references store_items,
    quantity integer default 1,
    acquired_at timestamptz default now(),
    equipped boolean default false
  );
  ```
- **Front** : `StoreModal.tsx` (grid d’items, CTA “Acheter”), `InventoryDrawer.tsx`.
- **Boosters** :
  - `xp_multiplier` (durée 2h) → middleware côté service XP.
  - `focus_burst` (compléter 1 mission instant) → mutation sur `user_quests`.

### 6.2 Module Crates (Reward Reveal)
- À la complétion d’un module (`training_progress` -> 100%), trigger Supabase Function:
  - Génère 3 cartes pseudo-aléatoires (Focus Coins, Booster, Badge Tier).
  - Stocke choix dans `user_rewards`.
- Front : modal `RewardRevealModal.tsx` (Framer Motion + pick one of three).

---

## 7. Priorisation Impact vs Effort

| Phase | Périmètre | Impact | Effort estimé | Dépendances clés |
| --- | --- | --- | --- | --- |
| **Phase 1 (4-6 sem)** | XP Ladder 2.0, Badge Sets, Daily/Weekly Quests, Streak Guardian | ⭐⭐⭐⭐ | ⭐⭐⭐ | Requiert nouvelles tables `user_xp_tracks`, `quest_templates`, `user_quests`, `user_items`. |
| **Phase 2 (6-8 sem)** | Mission Timeline, Leaderboards contextuels, Module Crates | ⭐⭐⭐ | ⭐⭐⭐⭐ | S’appuie sur Phase 1 (XP & quests) + nouvelles tables `missions`, `leaderboard_snapshots`, `user_rewards`. |
| **Phase 3 (8-10 sem)** | Squads, Focus Coins/Boutique, Discord Bridge avancé | ⭐⭐⭐⭐ (rétention communautaire) | ⭐⭐⭐⭐ | Dépend des wallets + inventaire + Edge Functions Discord. |

---

## 8. UI / UX inspirations et guidelines

- **Duolingo** : use of gradients + confettis lors des gains → réutiliser Framer Motion + `react-confetti` pour Reward Reveal.
- **Notion Streaks** : badges minimalistes, compteur discret dans header → `DashboardHeader` affichera streak + bouton “Freeze Pass”.
- **Brilliant.org** : timeline horizontale avec étapes verrouillées → `MissionTimeline` reprendra ce pattern (cartes arrondies, icônes).
- **FitOn** : modules “Live now” + feed communauté → `EventsPage` peut reprendre ce modèle pour booster la participation.

Recommandations UI :
- Maintenir glassmorphism actuel (GlassCard) mais ajouter “cards collection” (flip animation) pour badges.
- Utiliser `clsx` + `tailwindcss` existants. Prévoir palettes secondaires (or, turquoise) pour rareté.
- Préparer un système d’icônes vectorisées pour items (booster, freeze, thème) – potentiellement via `lucide-react` + svg custom.

---

## 9. Blueprints UI détaillés

| Composant | Placement | Structure & interactions |
| --- | --- | --- |
| **DailyGoalsCard** | `MemberDashboard` section “Rituels” (Phase 1) | Header avec date + bouton “Rafraîchir”. Liste de 3 quêtes : icône, titre, mini-progress (0-100%), CTA “Réclamer”. Statut “Booster actif” affiché sur la carte. |
| **MissionTimeline** | Nouvelle page “Roadmap” + widget condensed dans hero | Stepper vertical (desktop) / carrousel horizontal (mobile). Chaque mission = carte gradient avec picto module, tag reward (Focus Coins). Bouton “Lancer” ou “Continuer”. États: Locked (grisé), Active (glow), Done (check animé). |
| **XP Multi-track Meter** | `MemberDashboard` + `ProgressPage` | Ligne de 4 mini barres (Foundation, Execution, Mindset, Community) + pourcentage. Sur hover: popover détaillant XP, niveau, prochaine récompense. |
| **Badges Collection** | `MemberDashboard` (section badges) | Grid de cartes (70x70) regroupées par set. Filtre tabs “Tous / Sets / Rares”. Carte locked = blur + icône cadenas. Animer flip lors du hover + confetti quand unlocked. |
| **RewardRevealModal** | Trigger post-module | Overlay sombre, 3 cartes alignées. Animation “shuffle” avec `framer-motion`. L’utilisateur clique pour retourner la carte → effet confetti + bouton “Ajouter à l’inventaire”. |
| **StoreModal & InventoryDrawer** | Accessible depuis header (icône boutique) | Store: tabs (Booster / Thèmes / Freeze). Chaque item = carte avec image, coût, CTA “Acheter”. Inventory Drawer (side panel) montre items possédés + bouton “Équiper” ou “Utiliser”. |
| **Squad Panel** | `ChallengesPage` top section | Carte occupant toute la largeur : avatar squad, points hebdo, progression collective. Bouton “Inviter” (copie code). Sous-card = feed d’événements (timeline verticale). |
| **LeaderboardCarousel** | `MemberDashboard` (sous hero) | Carrousel 3 cartes (Weekly XP, Module Sprint, Squads). Slide = podium miniature, CTA “Voir classement complet”. Animation auto-scroll toutes les 8 secondes. |

Ces blueprints peuvent être transformés en maquettes Figma (960px & responsive) puis en composants React (GlassCard + tailwind). Les interactions critiques (RewardReveal, DailyGoalsCard) nécessitent micro-copy validée (français, ton motivant).

---

## 9. Livrables techniques & prochaine étape

1. **Backlog détaillé** (Notion/Jira) dérivé des sections ci-dessus (user stories + critères d’acceptation).
2. **Migrations Supabase** :
   - `supabase/migrations/<timestamp>__gamification-phase1.sql` pour XP/quests/items.
   - Scripts Edge Functions (`supabase/functions/quests-refresh`, `discord-broadcast`).
3. **Spécifications front** :
   - Hooks React Query (`useXpTracks`, `useDailyQuests`, `useSquadLeaderboard`).
   - Nouveaux composants (MissionTimeline, DailyGoalsCard, RewardRevealModal, StoreModal, InventoryDrawer).
4. **Tests** :
   - Scripts `scripts/test-gamification-phase1.js` pour simuler progression.
   - Tests Playwright légers pour quêtes et boutique.

Avec ces éléments, chaque phase peut démarrer immédiatement : toutes les dépendances et schémas sont décrits, les surfaces UI ciblées sont identifiées et l’intégration Discord est cadrée.

---

## 10. Plan d’exécution détaillé par phase

### Phase 1 — XP, Badges, Quêtes, Streak (4-6 semaines)
1. **Migrations** : créer tables `user_xp_tracks`, `quest_templates`, `user_quests`, `user_items` (+ triggers update `updated_at`).  
2. **Services** :
   - Étendre [`memberStatsService`](../src/services/memberStatsService.ts) pour renvoyer `xpTracks`, `quests`, `items`.
   - Nouveau `questsService.ts` (CRUD quêtes + helpers progression).  
3. **Front** :
   - `MemberDashboard`: sections “Multi-track meter”, “Daily Goals”, “Badge Sets”.  
   - `DashboardHeader`: bouton Freeze Pass + compteur.  
   - `ProgressPage`: radar XP + log quêtes.  
4. **Edge Function** : `quests-refresh` (Supabase) planifiée quotidiennement pour assigner quêtes.  
5. **QA** : script `scripts/test-gamification-phase1.js` (seed user, simule complétion de quêtes).  

### Phase 2 — Missions, Leaderboards, Loot (6-8 semaines)
1. **Migrations** : tables `missions`, `user_missions`, `leaderboard_snapshots`, `user_rewards`.  
2. **Services** :
   - `missionsService.ts`: récupérer mission active, marquer comme done.  
   - `leaderboardService.ts`: lecture snapshots + agrégation Supabase SQL view.  
3. **Front** :
   - `MissionTimeline` page + widget hero.  
   - `LeaderboardCarousel` sur dashboard + page détaillée dans `ChallengesPage`.  
   - `RewardRevealModal` branché sur complétion module (hook dans `progressService`).  
4. **Automations** : cron Supabase pour générer snapshots hebdo.  
5. **QA** : tests UI (Playwright) pour Reward Reveal + leaderboards.

### Phase 3 — Squads, Boutique, Discord (8-10 semaines)
1. **Migrations** : `squads`, `squad_members`, `squad_activity`, `user_wallets`, `store_items`, `user_inventory`.  
2. **Services** :
   - `squadService.ts` (CRUD + feed).  
   - `storeService.ts` (acheter, équiper, consommer).  
   - `discordBridge.ts` (client HTTP vers Edge Function).  
3. **Front** :
   - `ChallengesPage`: panel Squad + feed, actions rejoindre/inviter.  
   - `StoreModal`, `InventoryDrawer`, `BoosterStatusChip`.  
   - `ClientSidebar`: bouton boutique + affichage Focus Coins.  
4. **Edge Functions** : `discord-broadcast` (webhook) + `module-completion-reward` (crée reward options).  
5. **QA & instrumentation** : tracking events (PostHog/Segment) pour achats, usages boosters, partages Discord.

Chaque phase se conclut par un sprint de polish (animations, micro-copy, assets). Les dépendances techniques sont déjà plantées dans les sections précédentes – ce plan sert de feuille de route exécutable.


# Long-term Memory for Cursor

- This project always uses TypeScript.
- Supabase is the only backend (Auth, DB, Storage, RLS, Functions).
- All authentication and role management go through Supabase.
- Videos always come from Bunny Stream via accès sécurisés.
- Payments always come from Stripe (paiements + abonnements).
- There are two user roles: "client" (élève) and "admin" (formateur/staff).
- The product is an LMS for trading education, **never** a trading bot.
- The existing frontend must not be cassé; évolutions via PR propres.
- All new features must be added safely with clean PRs.

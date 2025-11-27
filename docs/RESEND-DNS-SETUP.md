# Configuration DNS pour Resend (investinfinity.fr)

## 📋 Enregistrements DNS à ajouter

Pour pouvoir envoyer des emails depuis `noreply@investinfinity.fr`, tu dois ajouter ces enregistrements DNS chez ton hébergeur de domaine (probablement **OVH**).

### 1️⃣ DKIM (Vérification du domaine) - **OBLIGATOIRE**

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDoZhfdpTvBvwsficelBgaFcf+6NhHVy1koBnSdgjS3u90eiWLhBhU87jLNmX+oIs4Ih3bx0aSMI86AVNyzv2CHWYetAlVUG9cQ8Y/33QnuOfA6TX/0w3Nu4zUA2198HbHBg5f8aapVqp8GKRe68O4sQaAbLaWU7s55LqoxLDuzfQIDAQAB` | Auto |

### 2️⃣ SPF (Autorisation d'envoi) - **OBLIGATOIRE**

**Enregistrement 1 :**
| Type | Nom | Valeur | TTL | Priorité |
|------|-----|--------|-----|----------|
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | Auto | 10 |

**Enregistrement 2 :**
| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | Auto |

### 3️⃣ DMARC (Politique de sécurité) - **OPTIONNEL**

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| TXT | `_dmarc` | `v=DMARC1; p=none;` | Auto |

---

## 🛠️ Comment ajouter les DNS sur OVH

1. **Connecte-toi à ton compte OVH** : https://www.ovh.com/manager/
2. **Sélectionne ton domaine** : `investinfinity.fr`
3. **Va dans l'onglet "Zone DNS"**
4. **Clique sur "Ajouter une entrée"** pour chaque enregistrement
5. **Sélectionne le type** (TXT ou MX)
6. **Remplis les champs** :
   - **Nom/Sous-domaine** : `resend._domainkey`, `send`, ou `_dmarc`
   - **Valeur/Cible** : La valeur exacte du tableau ci-dessus
   - **Priorité** (seulement pour MX) : `10`
7. **Valide et attends** la propagation DNS (peut prendre 1h à 48h)

---

## ✅ Vérification

Une fois les DNS ajoutés, retourne sur Resend et clique sur **"Verify DNS Records"** :
👉 https://resend.com/domains/e05c6f8b-0f80-4faf-9537-161c5ae4fbb1

Si tout est bien configuré, le statut passera de "not started" à "verified" ✅

---

## 🔄 Mise à jour du code après vérification

Une fois que le domaine est vérifié sur Resend, modifie `supabase/functions/send-password-email/index.ts` ligne 117 :

**Avant :**
```typescript
from: 'Invest Infinity <onboarding@resend.dev>',
```

**Après :**
```typescript
from: 'Invest Infinity <noreply@investinfinity.fr>',
```

Puis redéploie la fonction :
```bash
npx supabase functions deploy send-password-email --project-ref vveswlmcgmizmjsriezw
```

---

## 📝 Notes importantes

- **Sans ces DNS**, les emails continueront d'être envoyés depuis `onboarding@resend.dev` (ce qui fonctionne, mais c'est moins professionnel)
- **Avec ces DNS**, les emails seront envoyés depuis `noreply@investinfinity.fr` (ton domaine !)
- La propagation DNS peut prendre **jusqu'à 48h** (généralement 1-2h)
- Tu peux vérifier la propagation ici : https://dnschecker.org/#TXT/resend._domainkey.investinfinity.fr

---

## 🆘 Besoin d'aide ?

- Documentation Resend : https://resend.com/docs/dashboard/domains/introduction
- Dashboard Resend : https://resend.com/domains/e05c6f8b-0f80-4faf-9537-161c5ae4fbb1


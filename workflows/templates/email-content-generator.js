// Code à copier dans le Node Code "Générer contenu email"

function generateSubject(emailType) {
  const subjects = {
    welcome_2: "🚀 3 conseils avancés pour protéger ton capital",
    welcome_3: "💎 Comment nos membres multiplient leurs gains",
    welcome_4: "🎁 Offre spéciale : Passe au niveau supérieur",
    weekly: "📊 Analyse de marché de la semaine"
  };
  return subjects[emailType] || "Newsletter Invest Infinity";
}

function generateEmailHTML(emailType, prenom, segment) {
  const name = prenom || "Cher trader";
  
  const templates = {
    welcome_2: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; }
    .header { background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .content h2 { color: #EC4899; margin-top: 25px; }
    .content h3 { color: #8B5CF6; margin-top: 20px; }
    .cta { background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 25px 0; font-weight: bold; }
    .footer { text-align: center; color: #999; font-size: 12px; padding: 20px; border-top: 1px solid #eee; }
    .footer a { color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Salut ${name} ! 👋</h1>
    </div>
    <div class="content">
      <p>Tu as téléchargé notre guide "7 Erreurs Mortelles", bravo ! 🎉</p>
      
      <h2>3 conseils avancés pour aller plus loin :</h2>
      
      <h3>1️⃣ Utilise toujours un Risk/Reward ratio minimum de 1:2</h3>
      <p>Ne prends jamais une position où le risque est supérieur au gain potentiel. C'est la règle d'or qui protège ton capital sur le long terme.</p>
      
      <h3>2️⃣ Respecte ton capital</h3>
      <p>Ne risque jamais plus de 1-2% de ton capital sur une seule position. La patience et la discipline sont les clés du succès en trading.</p>
      
      <h3>3️⃣ Tiens un journal de trading</h3>
      <p>Chaque trade doit être noté avec ton raisonnement. C'est comme ça qu'on progresse vraiment et qu'on évite de répéter les mêmes erreurs.</p>
      
      <center><a href="https://investinfinity.fr" class="cta">Découvrir notre formation complète →</a></center>
    </div>
    <div class="footer">
      <p>Invest Infinity - Formation Trading</p>
      <p><a href="https://investinfinity.fr/unsubscribe?email={{EMAIL_PLACEHOLDER}}">Se désinscrire</a></p>
      <p>© ${new Date().getFullYear()} Invest Infinity - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>
    `,
    
    welcome_3: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; }
    .header { background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .testimonial { background: #f9f9f9; padding: 20px; border-left: 4px solid #EC4899; margin: 20px 0; border-radius: 4px; }
    .cta { background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 25px 0; font-weight: bold; }
    .footer { text-align: center; color: #999; font-size: 12px; padding: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${name}, découvre comment nos membres réussissent 💎</h1>
    </div>
    <div class="content">
      <p>Une semaine s'est écoulée depuis que tu as rejoint notre communauté. C'est le moment idéal pour partager avec toi quelques succès de nos membres !</p>
      
      <div class="testimonial">
        <p><strong>"Grâce à la formation, j'ai multiplié mon capital par 3 en 6 mois. Les stratégies sont claires et applicables immédiatement."</strong></p>
        <p style="margin-top: 10px; color: #666;">— Kévin, membre depuis 8 mois</p>
      </div>
      
      <div class="testimonial">
        <p><strong>"L'accompagnement est top. J'ai enfin trouvé une méthode qui fonctionne pour moi."</strong></p>
        <p style="margin-top: 10px; color: #666;">— Damien, membre depuis 1 an</p>
      </div>
      
      <p>Ces résultats sont possibles grâce à :</p>
      <ul>
        <li>✅ Des stratégies éprouvées et testées</li>
        <li>✅ Un accompagnement personnalisé</li>
        <li>✅ Une communauté active et bienveillante</li>
      </ul>
      
      <center><a href="https://investinfinity.fr" class="cta">Rejoindre la communauté →</a></center>
    </div>
    <div class="footer">
      <p>Invest Infinity - Formation Trading</p>
      <p><a href="https://investinfinity.fr/unsubscribe?email={{EMAIL_PLACEHOLDER}}">Se désinscrire</a></p>
    </div>
  </div>
</body>
</html>
    `,
    
    welcome_4: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; }
    .header { background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .offer-box { background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; }
    .offer-box h2 { margin: 0 0 10px 0; }
    .cta { background: white; color: #EC4899; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; color: #999; font-size: 12px; padding: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${name}, une offre spéciale pour toi 🎁</h1>
    </div>
    <div class="content">
      <p>Deux semaines que tu suis nos conseils... Tu es prêt à passer au niveau supérieur ?</p>
      
      <div class="offer-box">
        <h2>🚀 Offre Spéciale Nouveau Membre</h2>
        <p style="font-size: 18px; margin: 15px 0;">-20% sur ta première formation</p>
        <p>Code: BIENVENUE20</p>
      </div>
      
      <p>Cette offre est valable uniquement pour les nouveaux membres et expire dans 7 jours.</p>
      
      <p>Profite de :</p>
      <ul>
        <li>✅ Accès immédiat à toute la formation</li>
        <li>✅ Alertes trading en temps réel</li>
        <li>✅ Lives hebdomadaires</li>
        <li>✅ Support personnalisé</li>
      </ul>
      
      <center><a href="https://investinfinity.fr/tarifs" class="cta">Profiter de l'offre →</a></center>
    </div>
    <div class="footer">
      <p>Invest Infinity - Formation Trading</p>
      <p><a href="https://investinfinity.fr/unsubscribe?email={{EMAIL_PLACEHOLDER}}">Se désinscrire</a></p>
    </div>
  </div>
</body>
</html>
    `
  };
  
  return templates[emailType] || templates.welcome_2;
}

// Code principal
const items = $input.all();
const results = [];

for (const item of items) {
  const html = generateEmailHTML(item.json.emailType, item.json.prenom, item.json.segment)
    .replace(/\{\{EMAIL_PLACEHOLDER\}\}/g, item.json.email);
  
  results.push({
    json: {
      ...item.json,
      subject: generateSubject(item.json.emailType),
      html: html
    }
  });
}

return results;

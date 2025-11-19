import React, { useState } from 'react';

const faqData = [
  {
    question: "🆓 Est-ce vraiment gratuit ?",
    answer:
      "Oui, l’accès au Discord, aux formations et aux alertes est 100% gratuit. Tu dois juste créer un compte de trading via notre partenaire — c’est ce qui nous permet de financer tout ça. Le capital que tu dépose sur ce compte reste le tien et tu es libre de le retirer à tout moment.",
  },
{
  question: "💸 Est-ce que je peux perdre mon capital ?",
  answer:
    "Pas si tu respectes le money management. On t’apprend à ne risquer qu’1% de ton capital par trade. Par exemple, avec un dépôt de 1 000€, tu ne risques que 10€ à chaque trade. Il faudrait 100 pertes d'affilée pour tout perdre — ce qui est très improbable avec une stratégie bien suivie.",
},


  {
    question: "📚 Faut-il déjà s’y connaître en trading ?",
    answer:
      "Non. La formation est faite pour les débutants. On commence par les bases, puis on t'accompagne vers des niveaux plus avancés.",
  },
{
  question: "🔗 Pourquoi un compte partenaire est requis ?",
  answer: `
    <p>
      En utilisant tous <strong>le même broker</strong>, on profite des 
      <strong>mêmes prix</strong>, <strong>mêmes conditions</strong>… donc potentiellement des 
      <strong>mêmes résultats</strong>.<br /><br />

      C’est ce qui rend nos alertes et stratégies aussi efficaces.<br /><br />

      👉 En passant par ce lien, tu accèdes à <strong>tous les contenus gratuitement</strong> 
      (formations, alertes, communauté…).<br /><br />

      🌱 Et surtout, tu <strong>soutiens l’écosystème</strong> sans payer un centime de plus. 
      <strong>Ton capital reste le tien</strong> : tu es libre d’en disposer comme tu veux.
    </p>
  `
},
{
  question: "⏳ Et si je ne suis pas dispo tout de suite ?",
  answer:
    "Il ne faut pas attendre le bon moment… car le bon moment, c’est justement celui où tu passes à l’action. Tu peux avancer à ton rythme, mais ce premier pas est gratuit, simple, et peut tout changer.",
},

{
  question: "📩 Vais-je recevoir du spam ?",
  answer:
    "Non, aucun spam. On te demande ces informations pour pouvoir suivre la création de ton compte de trading chez notre partenaire, et pour que mon équipe puisse te contacter afin de t’accompagner dans ton inscription et ton intégration sur le Discord. Tes données sont protégées et utilisées uniquement dans ce cadre.",
},

{
  question: "📞 Que se passe-t-il après mon inscription ?",
  answer:
    "Tu crées ton compte de trading chez notre partenaire (c’est ce qui débloque l’accès). Une fois validé, on t’ajoute au Discord privé. Et si tu as la moindre question, mon équipe t’appelle pour t’aider à chaque étape. Même si tu n’es pas sûr de tout, tu peux t’inscrire et on t’accompagnera.",
},

];

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="max-w-4xl mx-auto mt-16 mb-24 bg-white rounded-2xl shadow-lg p-6 lg:p-10">
      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 text-center">
        ❓ Questions fréquentes
      </h2>

      <div className="space-y-4">
        {faqData.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-xl">
            <button
              onClick={() => toggle(index)}
              className="w-full text-left px-4 py-3 font-medium text-gray-800 flex justify-between items-center"
            >
              {item.question}
              <span className="text-xl">{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && (
<div
  className="px-4 pb-4 text-gray-600 text-sm"
  dangerouslySetInnerHTML={{ __html: item.answer }}
/>

            )}
          </div>
        ))}
      </div>

    <button
        onClick={() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-poppins font-semibold py-4 px-6 rounded-xl shadow-md mt-6"
    >
        🔥 Je veux démarrer l'aventure
    </button>
    </div>
  );
};

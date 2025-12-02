import { motion } from 'framer-motion';
import { Handshake, ExternalLink, Gift, Shield, Zap, Clock, DollarSign, TrendingUp } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  link: string;
  type: 'broker' | 'propfirm';
  advantages: string[];
  bonus?: {
    text: string;
    highlight: string;
  };
  gradient: string;
  accentColor: string;
}

const partners: Partner[] = [
  {
    id: 'raisefx',
    name: 'RaiseFX',
    logo: '/raisefx.avif',
    description: 'Broker de confiance avec des conditions de trading exceptionnelles pour les traders particuliers.',
    link: 'https://partners.raisefx.com/visit/?bta=167838&brand=raisefx',
    type: 'broker',
    advantages: [
      'Service client 24/7',
      'Effet de levier jusqu\'à 1:500',
      'Dépôt minimum 200€',
      'Plateforme rapide et sécurisée',
    ],
    bonus: {
      text: '500€ de dépôt sur ton 1er dépôt uniquement, on t\'offre',
      highlight: '500€ supplémentaire',
    },
    gradient: 'from-emerald-500 to-teal-600',
    accentColor: 'emerald',
  },
  {
    id: 'raisemyfunds',
    name: 'Raise My Funds',
    logo: '/RMF_Long.avif',
    description: 'Prop Firm de référence pour obtenir un compte financé et trader avec un capital important.',
    link: 'https://live.raisemyfunds.co/buy-challenge?affiliate=InvestI',
    type: 'propfirm',
    advantages: [
      'Challenges accessibles',
      'Partage des profits jusqu\'à 90%',
      'Paiements rapides',
      'Support dédié aux traders',
    ],
    gradient: 'from-blue-500 to-indigo-600',
    accentColor: 'blue',
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'broker':
      return TrendingUp;
    case 'propfirm':
      return DollarSign;
    default:
      return Handshake;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'broker':
      return 'Broker';
    case 'propfirm':
      return 'Prop Firm';
    default:
      return 'Partenaire';
  }
};

export default function PartnershipsPage() {
  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Handshake className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Partenariats</h1>
            <p className="text-gray-400">
              Nos partenaires affiliés Prop Firms & Brokers de confiance
            </p>
          </div>
        </div>
      </motion.header>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard hover={false} glow="amber" className="overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
            
            <div className="relative flex items-center gap-4 p-2">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Offres exclusives membres</h3>
                <p className="text-gray-400 text-sm">
                  Profite d'avantages exclusifs grâce à notre partenariat avec ces plateformes de confiance.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Partners Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6"
      >
        {partners.map((partner) => {
          const TypeIcon = getTypeIcon(partner.type);
          
          return (
            <motion.div key={partner.id} variants={itemVariants}>
              <GlassCard hover glow="none" className="overflow-hidden group">
                <div className="relative">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${partner.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${partner.gradient} opacity-5 rounded-full blur-3xl`} />
                  
                  <div className="relative p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${partner.gradient} p-0.5 shadow-lg`}>
                          <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden">
                            <img 
                              src={partner.logo} 
                              alt={partner.name}
                              className="w-12 h-12 object-contain"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-white">{partner.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full bg-${partner.accentColor}-500/20 text-${partner.accentColor}-400 text-xs font-medium flex items-center gap-1`}>
                              <TypeIcon className="w-3 h-3" />
                              {getTypeLabel(partner.type)}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">{partner.description}</p>
                        </div>
                      </div>
                      
                      <motion.a
                        href={partner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${partner.gradient} text-white font-semibold shadow-lg flex items-center gap-2 whitespace-nowrap`}
                      >
                        S'inscrire
                        <ExternalLink className="w-4 h-4" />
                      </motion.a>
                    </div>

                    {/* Advantages */}
                    <div className="grid grid-cols-2 gap-3">
                      {partner.advantages.map((advantage, index) => {
                        const icons = [Shield, Zap, DollarSign, Clock];
                        const Icon = icons[index % icons.length];
                        
                        return (
                          <div 
                            key={index}
                            className="flex items-center gap-2 text-sm text-gray-300"
                          >
                            <div className={`w-7 h-7 rounded-lg bg-${partner.accentColor}-500/10 flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-3.5 h-3.5 text-${partner.accentColor}-400`} />
                            </div>
                            <span>{advantage}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bonus Banner */}
                    {partner.bonus && (
                      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${partner.gradient} p-4`}>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        
                        <div className="relative flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Gift className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white/90 text-sm">
                              <span className="font-bold">Offre Bonus : </span>
                              {partner.bonus.text}
                            </p>
                            <p className="text-white font-bold text-lg">
                              {partner.bonus.highlight} 🔥
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-gray-500 text-xs px-4"
      >
        Ces liens sont des liens d'affiliation. En utilisant ces liens, tu soutiens Invest Infinity sans frais supplémentaires pour toi.
      </motion.p>
    </div>
  );
}


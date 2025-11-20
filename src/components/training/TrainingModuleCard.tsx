import type { TrainingModule } from '../../types/training';

interface TrainingModuleCardProps {
  module: TrainingModule;
  onClick?: () => void;
  progress?: number; // Pourcentage de progression (0-100)
}

export default function TrainingModuleCard({
  module,
  onClick,
  progress = 0, // Valeur par défaut
}: TrainingModuleCardProps) {
  // Générer un numéro d'étape basé sur la position du module
  const stepNumber = module.position !== undefined && module.position !== null ? module.position + 1 : 1;
  
  // Formater le titre pour le header avec "ETAPE X - "
  const headerTitle = `ETAPE ${stepNumber} - ${module.title.toUpperCase()}`;
  
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/5 shadow-xl hover:shadow-pink-500/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      {/* Header avec graphique de trading en arrière-plan */}
      <div className="relative h-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Graphique de trading (lignes néon) */}
        <div className="absolute inset-0 opacity-30">
          {/* Lignes de graphique animées */}
          <svg className="w-full h-full" viewBox="0 0 400 128" preserveAspectRatio="none">
            {/* Ligne principale (rose) */}
            <path
              d="M 0,80 Q 50,60 100,70 T 200,50 T 300,40 T 400,30"
              fill="none"
              stroke="#ec4899"
              strokeWidth="2"
              className="animate-pulse"
            />
            {/* Ligne secondaire (vert) */}
            <path
              d="M 0,100 Q 50,90 100,95 T 200,85 T 300,75 T 400,65"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              opacity="0.6"
            />
            {/* Ligne tertiaire (rose clair) */}
            <path
              d="M 0,60 Q 50,50 100,55 T 200,45 T 300,35 T 400,25"
              fill="none"
              stroke="#f472b6"
              strokeWidth="1.5"
              opacity="0.4"
            />
            {/* Points sur les lignes */}
            <circle cx="100" cy="70" r="3" fill="#ec4899" className="animate-pulse" />
            <circle cx="200" cy="50" r="3" fill="#ec4899" className="animate-pulse" />
            <circle cx="300" cy="40" r="3" fill="#ec4899" className="animate-pulse" />
          </svg>
        </div>

        {/* Flèches triangulaires dans les coins */}
        <div className="absolute top-2 right-2 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-pink-500/50 opacity-60" />
        <div className="absolute bottom-2 left-2 w-0 h-0 border-r-[8px] border-r-transparent border-t-[8px] border-t-pink-500/50 opacity-60" />

        {/* Titre du module en néon rose sur le header */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <h2 className="text-base sm:text-lg font-bold text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] text-center leading-tight">
            {headerTitle}
          </h2>
        </div>
      </div>

      {/* Contenu de la carte */}
      <div className="relative p-6 space-y-4 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        {/* Titre du module */}
        <h3 className="text-xl font-bold text-white">
          {module.title}
        </h3>

        {/* Description */}
        {module.description ? (
          <p className="text-sm text-gray-400 line-clamp-2">{module.description}</p>
        ) : (
          <p className="text-sm text-gray-500 italic">Aucune description disponible</p>
        )}

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Progression</span>
            <span className="text-gray-300 font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gray-400 to-gray-300 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

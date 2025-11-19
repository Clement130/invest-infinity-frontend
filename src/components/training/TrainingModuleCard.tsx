import type { TrainingModule } from '../../types/training';

interface TrainingModuleCardProps {
  module: TrainingModule;
  onClick?: () => void;
  progress?: number; // Pourcentage de progression (0-100)
}

export default function TrainingModuleCard({
  module,
  onClick,
  progress = 40, // Valeur par défaut pour la V1
}: TrainingModuleCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/5 shadow-xl shadow-pink-500/10 hover:shadow-pink-500/40 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      {/* Glow effect au hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

      {/* Contenu de la carte */}
      <div className="relative p-6 space-y-4">
        {/* Badge "Module débloqué" */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Module débloqué
          </span>
        </div>

        {/* Titre */}
        <h3 className="text-xl font-semibold text-white group-hover:text-pink-200 transition-colors">
          {module.title}
        </h3>

        {/* Description */}
        {module.description && (
          <p className="text-sm text-gray-400 line-clamp-2">{module.description}</p>
        )}

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Progression</span>
            <span className="text-pink-400 font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}



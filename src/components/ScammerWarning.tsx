// Composant désactivé - Le système de protection développeur a été retiré
// Le client a payé, ce warning n'est plus nécessaire
export default function ScammerWarning() {
  // Ne plus afficher le warning - le client a payé
  return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-2xl animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center gap-4">
          <AlertTriangle className="w-8 h-8 flex-shrink-0 animate-pulse" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center uppercase tracking-wide">
            ⚠️ ATTENTION SCAMMEUR ⚠️
          </h1>
        </div>
      </div>
    </div>
  );
}


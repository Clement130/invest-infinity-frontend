import { useMemo } from 'react';
import type { ActivityDay } from '../../services/memberStatsService';

interface ActivityHeatmapProps {
  data: ActivityDay[];
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Grouper par semaine (53 semaines)
  const weeks = useMemo(() => {
    const weeksData: ActivityDay[][] = [];
    let currentWeek: ActivityDay[] = [];

    data.forEach((day, index) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay(); // 0 = dimanche, 1 = lundi, etc.

      // Commencer une nouvelle semaine le lundi (1)
      if (dayOfWeek === 1 && currentWeek.length > 0) {
        weeksData.push(currentWeek);
        currentWeek = [];
      }

      currentWeek.push(day);

      // Dernière semaine
      if (index === data.length - 1) {
        weeksData.push(currentWeek);
      }
    });

    return weeksData;
  }, [data]);

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-gray-800';
    if (count === 1) return 'bg-green-900';
    if (count <= 3) return 'bg-green-700';
    if (count <= 5) return 'bg-green-500';
    return 'bg-green-400';
  };

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Heatmap d'activité</h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Moins</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-gray-800" />
            <div className="w-3 h-3 rounded bg-green-900" />
            <div className="w-3 h-3 rounded bg-green-700" />
            <div className="w-3 h-3 rounded bg-green-500" />
            <div className="w-3 h-3 rounded bg-green-400" />
          </div>
          <span>Plus</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Labels des jours */}
        <div className="flex flex-col gap-1 pr-2">
          <div className="h-4" />
          {['Lun', 'Mer', 'Ven', 'Dim'].map((day) => (
            <div key={day} className="h-3 text-xs text-gray-500 flex items-center">
              {day}
            </div>
          ))}
        </div>

        {/* Semaines */}
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                const intensity = getIntensity(day.count);
                const tooltip = `${day.date}: ${day.count} activité(s), ${day.lessonsCompleted} leçon(s) complétée(s)`;

                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-3 h-3 rounded ${intensity} hover:ring-2 hover:ring-white/50 transition cursor-pointer`}
                    title={tooltip}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-400">
        {data.filter((d) => d.count > 0).length} jours d'activité sur les 365 derniers jours
      </div>
    </div>
  );
}



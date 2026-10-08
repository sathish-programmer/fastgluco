import React from 'react';
import { ShoppingBag, ChevronRight, Wind, Droplets, Heart, Sparkles, Flame, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ContextualShopCardProps {
  activeMode: 'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION';
  onOpenShop: (category: string, searchQuery?: string) => void;
}

export const ContextualShopCard: React.FC<ContextualShopCardProps> = ({
  activeMode,
  onOpenShop
}) => {
  const { t } = useLanguage();

  const shopItems = [
    {
      id: 'organic',
      title: t('explore.organicFoods', 'Pesticide-Free Organic Foods'),
      subtitle: t('explore.organicFoodsDesc', 'Bhoomi Farm & clean bio-fortified nutrition'),
      category: 'Pesticide free food',
      icon: <Sparkles className="h-4 w-4 text-emerald-500" />,
      modes: ['PREVENTION', 'TREATMENT', 'SECONDARY_PREVENTION']
    },
    {
      id: 'air_purifier',
      title: t('explore.airPurifiers', 'Air Purifiers & N95 Masks'),
      subtitle: t('explore.airPurifiersDesc', 'PM2.5 particulate & VOC defense'),
      category: 'Environment safe products',
      icon: <Wind className="h-4 w-4 text-sky-500" />,
      modes: ['PREVENTION', 'SECONDARY_PREVENTION']
    },
    {
      id: 'water_filter',
      title: t('explore.waterFilters', 'Water Filtration Systems'),
      subtitle: t('explore.waterFiltersDesc', 'Remove heavy metals & microplastics'),
      category: 'Environment safe products',
      icon: <Droplets className="h-4 w-4 text-blue-500" />,
      modes: ['PREVENTION', 'SECONDARY_PREVENTION']
    },
    {
      id: 'safe_kitchen',
      title: t('explore.safeKitchen', 'Non-Toxic Safe Kitchen'),
      subtitle: t('explore.safeKitchenDesc', 'Cast iron tawas & glass/steel storage'),
      category: 'Safe kitchen',
      icon: <Flame className="h-4 w-4 text-amber-500" />,
      modes: ['PREVENTION', 'TREATMENT', 'SECONDARY_PREVENTION']
    },
    {
      id: 'glucose_monitoring',
      title: t('explore.glucoseMonitoring', 'Glucose & Ketone Monitoring'),
      subtitle: t('explore.glucoseMonitoringDesc', 'Continuous CGM sensors & ketone meters'),
      category: 'Glucose monitoring',
      icon: <Activity className="h-4 w-4 text-indigo-500" />,
      modes: ['PREVENTION', 'SECONDARY_PREVENTION']
    },
    {
      id: 'wigs',
      title: t('explore.hairlossWigs', 'Cancer Support Wigs'),
      subtitle: t('explore.hairlossWigsDesc', 'Soft medical-grade head coverings'),
      category: 'Cancer support wig',
      icon: <Heart className="h-4 w-4 text-rose-500" />,
      modes: ['TREATMENT']
    }
  ];

  const filteredItems = shopItems.filter(item => item.modes.includes(activeMode));

  if (filteredItems.length === 0) return null;

  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
          <ShoppingBag className="h-3.5 w-3.5 text-primary" />
          <span>{t('explore.recommendedProducts', 'Recommended Healthcare Support Products')}</span>
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => onOpenShop(item.category)}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between text-left hover:border-slate-300 dark:hover:border-slate-700 transition-all group cursor-pointer"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                  {item.title}
                </h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {item.subtitle}
                </p>
              </div>
            </div>
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:text-primary text-slate-400 rounded-xl transition-all shrink-0 ml-2">
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

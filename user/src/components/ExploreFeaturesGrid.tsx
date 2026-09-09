import React, { useState } from 'react';
import { 
  Compass, 
  ChevronRight, 
  Wind, 
  Utensils, 
  Dna, 
  Calendar, 
  ShoppingBag, 
  FileText, 
  Heart, 
  ShieldCheck, 
  Activity,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ExploreFeaturesGridProps {
  activeMode: 'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION';
  onSelectFeature: (actionKey: string, params?: any) => void;
}

export const ExploreFeaturesGrid: React.FC<ExploreFeaturesGridProps> = ({
  activeMode,
  onSelectFeature
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const getFeatures = () => {
    if (activeMode === 'TREATMENT') {
      return [
        { key: 'Reports', label: t('explore.cgmDiagnostics', 'CGM & Diagnostics'), icon: <FileText className="h-4 w-4 text-indigo-500" />, desc: t('explore.cgmDiagnosticsDesc', 'Review glucose spike charts') },
        { key: 'Book Appointment', label: t('explore.doctorAppointments', 'Doctor Appointments'), icon: <Calendar className="h-4 w-4 text-cyan-500" />, desc: t('explore.doctorAppointmentsDesc', 'Consult oncologists & dietitians') },
        { key: 'stress', label: t('explore.caregiverSymptoms', 'Caregiver & Symptoms'), icon: <Heart className="h-4 w-4 text-rose-500" />, desc: t('explore.caregiverSymptomsDesc', 'Log treatment side-effects') },
        { key: 'shop_wigs', label: t('explore.hairLossWigsExplore', 'Hair Loss Wigs'), icon: <Sparkles className="h-4 w-4 text-amber-500" />, desc: t('explore.hairLossWigsExploreDesc', 'Comfortable head coverings'), params: { search: 'Wig' } },
        { key: 'Food Log', label: t('explore.glycemicFoodLog', 'Glycemic Food Log'), icon: <Utensils className="h-4 w-4 text-emerald-500" />, desc: t('explore.glycemicFoodLogDesc', 'Track nutritional response') },
        { key: 'shop_all', label: t('explore.wellnessShop', 'Wellness Shop'), icon: <ShoppingBag className="h-4 w-4 text-violet-500" />, desc: t('explore.wellnessShopDesc', 'Browse health support products') }
      ];
    }

    if (activeMode === 'SECONDARY_PREVENTION') {
      return [
        { key: 'cancer_screening', label: t('explore.surveillanceRecovery', 'Surveillance & Recovery'), icon: <ShieldCheck className="h-4 w-4 text-rose-500" />, desc: t('explore.surveillanceRecoveryDesc', 'Long-term recurrence checks') },
        { key: 'environmental_exposures', label: t('explore.envRiskAudit', 'Environment Risk Audit'), icon: <Wind className="h-4 w-4 text-sky-500" />, desc: t('explore.envRiskAuditDesc', 'Air particulates & toxins') },
        { key: 'antioxidants', label: t('explore.bioactiveAntioxidants', 'Bioactive Antioxidants'), icon: <Sparkles className="h-4 w-4 text-emerald-500" />, desc: t('explore.bioactiveAntioxidantsDesc', 'Nutrient-dense cell protection') },
        { key: 'fasting', label: t('explore.circadianFasting', 'Circadian Metabolic Fasting'), icon: <Activity className="h-4 w-4 text-amber-500" />, desc: t('explore.circadianFastingDesc', 'Autophagy & mitochondrial health') },
        { key: 'Book Appointment', label: t('explore.followupVisits', 'Follow-up Doctor Visits'), icon: <Calendar className="h-4 w-4 text-cyan-500" />, desc: t('explore.followupVisitsDesc', 'Schedule specialist checkups') },
        { key: 'shop_all', label: t('explore.recoveryProducts', 'Recovery Products'), icon: <ShoppingBag className="h-4 w-4 text-indigo-500" />, desc: t('explore.recoveryProductsDesc', 'Air purifiers & water filters') }
      ];
    }

    // Default Prevention
    return [
      { key: 'environmental_exposures', label: t('explore.environmentToxins', 'Environment & Toxins'), icon: <Wind className="h-4 w-4 text-sky-500" />, desc: t('explore.environmentToxinsDesc', 'AQI, air toxins & water safety') },
      { key: 'genetics', label: t('explore.geneticSusceptibility', 'Genetic Susceptibility'), icon: <Dna className="h-4 w-4 text-violet-500" />, desc: t('explore.geneticSusceptibilityDesc', 'Hereditary risk reduction') },
      { key: 'antioxidants', label: t('explore.bioactiveAntioxidants', 'Bioactive Antioxidants'), icon: <Sparkles className="h-4 w-4 text-emerald-500" />, desc: t('explore.bioactiveAntioxidantsDesc', 'Nutrient-dense cell protection') },
      { key: 'fasting', label: t('explore.lifestyleFasting', 'Lifestyle & Fasting'), icon: <Activity className="h-4 w-4 text-amber-500" />, desc: t('explore.lifestyleFastingDesc', 'Circadian rhythm alignment') },
      { key: 'Book Appointment', label: t('explore.preventiveAppointments', 'Preventive Appointments'), icon: <Calendar className="h-4 w-4 text-cyan-500" />, desc: t('explore.preventiveAppointmentsDesc', 'Book physician consultations') },
      { key: 'shop_all', label: t('explore.healthcareShop', 'Healthcare Shop'), icon: <ShoppingBag className="h-4 w-4 text-rose-500" />, desc: t('explore.healthcareShopDesc', 'Non-toxic daily essentials') }
    ];
  };

  const features = getFeatures();
  const visibleFeatures = isExpanded ? features : features.slice(0, 4);

  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
          <Compass className="h-3.5 w-3.5 text-primary" />
          <span>{t('explore.exploreFeatures', 'Explore Mito Reboot Features')}</span>
        </h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] font-bold text-primary hover:underline"
        >
          {isExpanded ? t('common.showLess', 'Show Less') : t('explore.showAll', 'Show All')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {visibleFeatures.map((f, i) => (
          <button
            key={i}
            onClick={() => onSelectFeature(f.key, f.params)}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs flex items-center justify-between text-left hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group active:scale-[0.98]"
          >
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <div className="p-2 bg-slate-50 dark:bg-slate-800/90 rounded-xl border border-slate-100 dark:border-slate-700/80 shrink-0 group-hover:scale-105 transition-transform">
                {f.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors truncate">
                  {f.label}
                </h5>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-tight mt-0.5 truncate">
                  {f.desc}
                </p>
              </div>
            </div>
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:text-primary text-slate-400 rounded-xl transition-all shrink-0 ml-1.5">
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

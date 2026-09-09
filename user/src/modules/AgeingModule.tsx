import React, { useState, useMemo } from 'react';
import { Eye, Smile, Bone, Heart, Brain, Activity, Sparkles, Check } from 'lucide-react';
import { Card, SectionTitle, ScoreBadge, TalkToDoctorCard } from './shared/ConditionUI';
import { useLanguage } from '../context/LanguageContext';

const AGE_GROUPS = ['30-40', '40-50', '50-60', '60-70'];

interface CategoryMeta {
  labelKey: string;
  defaultLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  eyes: { labelKey: 'protocols.eyes', defaultLabel: 'Eyes', icon: Eye, color: '#3B82F6' },
  dental: { labelKey: 'protocols.dental', defaultLabel: 'Dental', icon: Smile, color: '#F59E0B' },
  bone: { labelKey: 'protocols.bone', defaultLabel: 'Bone', icon: Bone, color: '#94A3B8' },
  cardiac: { labelKey: 'protocols.cardiac', defaultLabel: 'Cardiac', icon: Heart, color: '#EC4899' },
  brain: { labelKey: 'protocols.brain', defaultLabel: 'Brain', icon: Brain, color: '#8B5CF6' },
  metabolic: { labelKey: 'protocols.metabolic', defaultLabel: 'Metabolic', icon: Activity, color: '#10B981' }
};

const CATEGORY_ORDER = ['eyes', 'dental', 'bone', 'cardiac', 'brain', 'metabolic'];

const FOUNDATIONAL_FACTORS = [
  { id: 'found_exercise', labelKey: 'habits.exercisedToday', defaultLabel: 'Exercised today?' },
  { id: 'found_sleep', labelKey: 'habits.slept8Hours', defaultLabel: 'Slept 8 hours?' },
  { id: 'found_diet', labelKey: 'habits.balancedDiet', defaultLabel: 'Ate a balanced, whole-food diet today?' },
  { id: 'found_fasting', labelKey: 'habits.fastingWindow', defaultLabel: 'Kept to your fasting window?' },
  { id: 'found_antioxidants', labelKey: 'habits.antioxidantFoods', defaultLabel: 'Ate antioxidant-rich foods today?' },
  { id: 'found_stress', labelKey: 'habits.lowStressToday', defaultLabel: 'Low stress today?' }
];

const AGE_DATA: Record<string, Record<string, { riskKey: string; defaultRisk: string; factors: { id: string; labelKey: string; defaultLabel: string }[] }>> = {
  '30-40': {
    eyes: {
      riskKey: 'risk.e30', defaultRisk: 'Early digital eye strain; first signs of presbyopia in some.',
      factors: [
        { id: 'e30_2020', labelKey: 'factors.e30_2020', defaultLabel: '20-20-20 screen breaks' },
        { id: 'e30_outdoor', labelKey: 'factors.e30_outdoor', defaultLabel: '60+ min outdoor daylight' },
        { id: 'e30_diet', labelKey: 'factors.e30_diet', defaultLabel: 'Leafy greens / lutein-rich foods' }
      ]
    },
    dental: {
      riskKey: 'risk.d30', defaultRisk: 'Gum recession begins; enamel wear from stress grinding.',
      factors: [
        { id: 'd30_brush', labelKey: 'factors.d30_brush', defaultLabel: 'Brush 2x + floss daily' },
        { id: 'd30_sugar', labelKey: 'factors.d30_sugar', defaultLabel: 'Limit sugary / acidic drinks' },
        { id: 'd30_grind', labelKey: 'factors.d30_grind', defaultLabel: 'Address stress-grinding (mouthguard/relaxation)' }
      ]
    },
    bone: {
      riskKey: 'risk.b30', defaultRisk: 'Peak bone mass window closing — last chance to bank density.',
      factors: [
        { id: 'b30_resist', labelKey: 'factors.b30_resist', defaultLabel: 'Resistance training (2-3x/week)' },
        { id: 'b30_calcium', labelKey: 'factors.b30_calcium', defaultLabel: 'Calcium + vitamin D intake' },
        { id: 'b30_sun', labelKey: 'factors.b30_sun', defaultLabel: '10-15 min sun exposure' }
      ]
    },
    cardiac: {
      riskKey: 'risk.c30', defaultRisk: 'Subtle lipid and BP drift begins, often unnoticed.',
      factors: [
        { id: 'c30_cardio', labelKey: 'factors.c30_cardio', defaultLabel: '150 min/week moderate cardio' },
        { id: 'c30_sodium', labelKey: 'factors.c30_sodium', defaultLabel: 'Low-sodium, high-fibre meals' },
        { id: 'c30_sleep', labelKey: 'factors.c30_sleep', defaultLabel: '7-8 hrs sleep' }
      ]
    },
    brain: {
      riskKey: 'risk.n30', defaultRisk: 'Chronic stress and sleep debt start affecting focus and memory.',
      factors: [
        { id: 'n30_sleep', labelKey: 'factors.n30_sleep', defaultLabel: 'Consistent sleep schedule' },
        { id: 'n30_meditate', labelKey: 'factors.n30_meditate', defaultLabel: '10+ min mindfulness / meditation' },
        { id: 'n30_learn', labelKey: 'factors.n30_learn', defaultLabel: 'New-skill or learning activity' }
      ]
    },
    metabolic: {
      riskKey: 'risk.m30', defaultRisk: 'Insulin sensitivity starts its slow decline.',
      factors: [
        { id: 'm30_fast', labelKey: 'factors.m30_fast', defaultLabel: 'Adhere to fasting window' },
        { id: 'm30_carb', labelKey: 'factors.m30_carb', defaultLabel: 'Low-carb, whole-food meals' },
        { id: 'm30_steps', labelKey: 'factors.m30_steps', defaultLabel: '8000+ steps' }
      ]
    }
  },
  '40-50': {
    eyes: {
      riskKey: 'risk.e40', defaultRisk: 'Presbyopia sets in; early cataract risk begins.',
      factors: [
        { id: 'e40_uv', labelKey: 'factors.e40_uv', defaultLabel: 'UV-protective eyewear outdoors' },
        { id: 'e40_antiox', labelKey: 'factors.e40_antiox', defaultLabel: 'Antioxidant-rich diet (lutein/zeaxanthin)' },
        { id: 'e40_checkup', labelKey: 'factors.e40_checkup', defaultLabel: 'Annual eye check-up adherence' }
      ]
    },
    dental: {
      riskKey: 'risk.d40', defaultRisk: 'Periodontal disease risk rises; gum recession progresses.',
      factors: [
        { id: 'd40_deep', labelKey: 'factors.d40_deep', defaultLabel: 'Periodontal deep-clean / check-up' },
        { id: 'd40_tobacco', labelKey: 'factors.d40_tobacco', defaultLabel: 'Reduce tobacco / alcohol exposure' },
        { id: 'd40_floss', labelKey: 'factors.d40_floss', defaultLabel: 'Diligent brushing + flossing' }
      ]
    },
    bone: {
      riskKey: 'risk.b40', defaultRisk: 'Bone loss begins (accelerating post-menopause in women).',
      factors: [
        { id: 'b40_resist', labelKey: 'factors.b40_resist', defaultLabel: 'Resistance + impact training' },
        { id: 'b40_dexa', labelKey: 'factors.b40_dexa', defaultLabel: 'Baseline DEXA bone density scan' },
        { id: 'b40_vitd', labelKey: 'factors.b40_vitd', defaultLabel: 'Vit D3 + K2 supplementation' }
      ]
    },
    cardiac: {
      riskKey: 'risk.c40', defaultRisk: 'Atherosclerosis accelerates; CAC scoring becomes relevant.',
      factors: [
        { id: 'c40_cac', labelKey: 'factors.c40_cac', defaultLabel: 'CAC / lipid panel check' },
        { id: 'c40_zone2', labelKey: 'factors.c40_zone2', defaultLabel: 'Zone-2 aerobic cardio (3-4x/wk)' },
        { id: 'c40_bp', labelKey: 'factors.c40_bp', defaultLabel: 'Regular BP tracking' }
      ]
    },
    brain: {
      riskKey: 'risk.n40', defaultRisk: 'Early white-matter changes; metabolic brain risk rises.',
      factors: [
        { id: 'n40_ketones', labelKey: 'factors.n40_ketones', defaultLabel: 'Metabolic switching / fasting' },
        { id: 'n40_omega3', labelKey: 'factors.n40_omega3', defaultLabel: 'Omega-3 EPA/DHA intake' },
        { id: 'n40_sleep', labelKey: 'factors.n40_sleep', defaultLabel: 'Strict sleep hygiene (7-8 hrs)' }
      ]
    },
    metabolic: {
      riskKey: 'risk.m40', defaultRisk: 'Visceral adiposity and prediabetes risk increase.',
      factors: [
        { id: 'm40_fasting', labelKey: 'factors.m40_fasting', defaultLabel: '14-16 hr intermittent fasting' },
        { id: 'm40_cgm', labelKey: 'factors.m40_cgm', defaultLabel: 'Glycemic variability control' },
        { id: 'm40_muscle', labelKey: 'factors.m40_muscle', defaultLabel: 'Lean muscle preservation' }
      ]
    }
  },
  '50-60': {
    eyes: {
      riskKey: 'risk.e50', defaultRisk: 'Glaucoma, macular degeneration, and dry eye risk rise.',
      factors: [
        { id: 'e50_pressure', labelKey: 'factors.e50_pressure', defaultLabel: 'Intraocular pressure check' },
        { id: 'e50_omega3', labelKey: 'factors.e50_omega3', defaultLabel: 'Omega-3 for dry eye & retina' },
        { id: 'e50_screens', labelKey: 'factors.e50_screens', defaultLabel: 'Anti-glare / warm lighting' }
      ]
    },
    dental: {
      riskKey: 'risk.d50', defaultRisk: 'Dry mouth (xerostomia), root caries, tooth loss risk.',
      factors: [
        { id: 'd50_saliva', labelKey: 'factors.d50_saliva', defaultLabel: 'Hydration & saliva stimulants' },
        { id: 'd50_fluoride', labelKey: 'factors.d50_fluoride', defaultLabel: 'Remineralizing / fluoride care' },
        { id: 'd50_checkup', labelKey: 'factors.d50_checkup', defaultLabel: 'Twice-yearly dental scaling' }
      ]
    },
    bone: {
      riskKey: 'risk.b50', defaultRisk: 'Osteopenia/osteoporosis acceleration; fracture risk.',
      factors: [
        { id: 'b50_heavy', labelKey: 'factors.b50_heavy', defaultLabel: 'Heavy compound resistance work' },
        { id: 'b50_balance', labelKey: 'factors.b50_balance', defaultLabel: 'Balance / single-leg training' },
        { id: 'b50_protein', labelKey: 'factors.b50_protein', defaultLabel: '1.2-1.6g/kg daily protein' }
      ]
    },
    cardiac: {
      riskKey: 'risk.c50', defaultRisk: 'Hypertension prevalence reaches >50%; arterial stiffness.',
      factors: [
        { id: 'c50_arteries', labelKey: 'factors.c50_arteries', defaultLabel: 'Nitric oxide foods (beets/greens)' },
        { id: 'c50_sodium', labelKey: 'factors.c50_sodium', defaultLabel: 'Strict low-sodium adherence' },
        { id: 'c50_vo2', labelKey: 'factors.c50_vo2', defaultLabel: 'High-intensity interval / VO2 work' }
      ]
    },
    brain: {
      riskKey: 'risk.n50', defaultRisk: 'Synaptic plasticity slows; neuroinflammation increases.',
      factors: [
        { id: 'n50_exercise', labelKey: 'factors.n50_exercise', defaultLabel: 'BDNF-boosting aerobic exercise' },
        { id: 'n50_social', labelKey: 'factors.n50_social', defaultLabel: 'Social and intellectual engagement' },
        { id: 'n50_polyphenols', labelKey: 'factors.n50_polyphenols', defaultLabel: 'Polyphenol-rich nutrition' }
      ]
    },
    metabolic: {
      riskKey: 'risk.m50', defaultRisk: 'Sarcopenia and metabolic slowdown peak.',
      factors: [
        { id: 'm50_strength', labelKey: 'factors.m50_strength', defaultLabel: 'Progressive overload lifting' },
        { id: 'm50_fast', labelKey: 'factors.m50_fast', defaultLabel: 'Circadian aligned fasting' },
        { id: 'm50_postmeal', labelKey: 'factors.m50_postmeal', defaultLabel: '15-min post-meal walks' }
      ]
    }
  },
  '60-70': {
    eyes: {
      riskKey: 'risk.e60', defaultRisk: 'Cataracts very common; retinal thinning; AMD.',
      factors: [
        { id: 'e60_exam', labelKey: 'factors.e60_exam', defaultLabel: 'Comprehensive dilated eye exam' },
        { id: 'e60_sunglasses', labelKey: 'factors.e60_sunglasses', defaultLabel: 'Polarized UV sunglasses' },
        { id: 'e60_lighting', labelKey: 'factors.e60_lighting', defaultLabel: 'High-contrast reading lights' }
      ]
    },
    dental: {
      riskKey: 'risk.d60', defaultRisk: 'Tooth loss, bone resorption in jaw, oral cancer check.',
      factors: [
        { id: 'd60_cancer', labelKey: 'factors.d60_cancer', defaultLabel: 'Oral mucosal cancer screening' },
        { id: 'd60_implant', labelKey: 'factors.d60_implant', defaultLabel: 'Implant / denture care' },
        { id: 'd60_clean', labelKey: 'factors.d60_clean', defaultLabel: 'Soft-bristled gentle cleaning' }
      ]
    },
    bone: {
      riskKey: 'risk.b60', defaultRisk: 'Fall-related hip fracture risk rises sharply.',
      factors: [
        { id: 'b60_fall', labelKey: 'factors.b60_fall', defaultLabel: 'Tai Chi / balance fall prevention' },
        { id: 'b60_dexa', labelKey: 'factors.b60_dexa', defaultLabel: 'Regular DEXA tracking' },
        { id: 'b60_sun', labelKey: 'factors.b60_sun', defaultLabel: 'Daily outdoor sunlight' }
      ]
    },
    cardiac: {
      riskKey: 'risk.c60', defaultRisk: 'Congestive heart failure, arrhythmia, and valve wear.',
      factors: [
        { id: 'c60_ecg', labelKey: 'factors.c60_ecg', defaultLabel: 'Annual ECG / Echo review' },
        { id: 'c60_walk', labelKey: 'factors.c60_walk', defaultLabel: 'Daily brisk walking (30-45 min)' },
        { id: 'c60_hydration', labelKey: 'factors.c60_hydration', defaultLabel: 'Adequate clean hydration' }
      ]
    },
    brain: {
      riskKey: 'risk.n60', defaultRisk: 'Cognitive decline risk rises; memory consolidation.',
      factors: [
        { id: 'n60_cognitive', labelKey: 'factors.n60_cognitive', defaultLabel: 'Daily cognitive challenge / puzzles' },
        { id: 'n60_sleep', labelKey: 'factors.n60_sleep', defaultLabel: 'Deep sleep optimization (cool room)' },
        { id: 'n60_meds', labelKey: 'factors.n60_meds', defaultLabel: 'Review anticholinergic medications' }
      ]
    },
    metabolic: {
      riskKey: 'risk.m60', defaultRisk: 'Sarcopenic obesity and frailty risk.',
      factors: [
        { id: 'm60_protein', labelKey: 'factors.m60_protein', defaultLabel: 'High biological value protein 3x/day' },
        { id: 'm60_bands', labelKey: 'factors.m60_bands', defaultLabel: 'Resistance band work' },
        { id: 'm60_glucose', labelKey: 'factors.m60_glucose', defaultLabel: 'Avoid glucose rollercoasters' }
      ]
    }
  }
};

export const AgeingModule: React.FC = () => {
  const { t } = useLanguage();
  const [selectedAge, setSelectedAge] = useState<string>(() => {
    return localStorage.getItem('mito_ageing_selected_decade') || '40-50';
  });
  const [checkedFactors, setCheckedFactors] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('mito_ageing_factors') || '{}');
    } catch {
      return {};
    }
  });

  const toggleFactor = (id: string) => {
    setCheckedFactors(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('mito_ageing_factors', JSON.stringify(next));
      return next;
    });
  };

  const currentAgeData = AGE_DATA[selectedAge] || AGE_DATA['40-50'];

  const foundationalScore = useMemo(() => {
    const total = FOUNDATIONAL_FACTORS.length;
    const completed = FOUNDATIONAL_FACTORS.filter(f => checkedFactors[f.id]).length;
    return Math.round((completed / total) * 100);
  }, [checkedFactors]);

  const categoryScores = useMemo(() => {
    const res: Record<string, number> = {};
    CATEGORY_ORDER.forEach(cat => {
      const factors = currentAgeData[cat]?.factors || [];
      if (factors.length === 0) res[cat] = 0;
      else {
        const done = factors.filter(f => checkedFactors[f.id]).length;
        res[cat] = Math.round((done / factors.length) * 100);
      }
    });
    return res;
  }, [currentAgeData, checkedFactors]);

  const overallScore = useMemo(() => {
    const values = Object.values(categoryScores);
    if (values.length === 0) return foundationalScore;
    const avgCat = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.round(foundationalScore * 0.4 + avgCat * 0.6);
  }, [foundationalScore, categoryScores]);

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-5 w-5 text-amber-300" />
          <span className="text-xs font-black uppercase tracking-widest text-blue-100">{t('protocols.longevityProtocol', 'Longevity Protocol')}</span>
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">{t('protocols.healthyAgeingTitle', 'Healthy Ageing & Longevity')}</h1>
        <p className="text-xs text-blue-100/90 mt-1 leading-relaxed max-w-xl">
          {t('protocols.healthyAgeingSubtitle', 'Decade-specific organ defense and foundational cellular longevity habits.')}
        </p>

        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <span className="text-xs font-bold text-blue-100">{t('protocols.overallLongevityScore', 'Overall Longevity Score:')}</span>
          <span className="text-lg font-black bg-white/20 px-3.5 py-1 rounded-xl backdrop-blur-md">
            {overallScore}%
          </span>
        </div>
      </div>

      <div>
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
          {t('protocols.selectDecade', 'Select Your Decade:')}
        </span>
        <div className="grid grid-cols-4 gap-2">
          {AGE_GROUPS.map(age => (
            <button
              key={age}
              onClick={() => {
                setSelectedAge(age);
                localStorage.setItem('mito_ageing_selected_decade', age);
              }}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all cursor-pointer text-center ${
                selectedAge === age
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300'
              }`}
            >
              {age}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle icon={Sparkles}>{t('protocols.foundationalHabits', 'Foundational Longevity Habits')}</SectionTitle>
          <ScoreBadge pct={foundationalScore} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {FOUNDATIONAL_FACTORS.map(factor => {
            const isDone = !!checkedFactors[factor.id];
            return (
              <button
                key={factor.id}
                type="button"
                onClick={() => toggleFactor(factor.id)}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isDone
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-bold">{t(factor.labelKey, factor.defaultLabel)}</span>
                <div className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 ${
                  isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700'
                }`}>
                  {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('protocols.decadeOrganDefense', { decade: selectedAge }, `${selectedAge} Decade Organ Defense Factors:`)}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {CATEGORY_ORDER.map(catKey => {
            const meta = CATEGORY_META[catKey];
            const data = currentAgeData[catKey];
            if (!data) return null;
            const Icon = meta.icon;
            const score = categoryScores[catKey] || 0;

            return (
              <Card key={catKey} className="relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">{t(meta.labelKey, meta.defaultLabel)}</span>
                  </div>
                  <ScoreBadge pct={score} />
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed italic">
                  ⚠️ {t(data.riskKey, data.defaultRisk)}
                </p>

                <div className="space-y-2">
                  {data.factors.map(f => {
                    const done = !!checkedFactors[f.id];
                    return (
                      <div
                        key={f.id}
                        onClick={() => toggleFactor(f.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold cursor-pointer transition-all ${
                          done
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span className="pr-2">{t(f.labelKey, f.defaultLabel)}</span>
                        <div className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 ${
                          done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700'
                        }`}>
                          {done && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <TalkToDoctorCard
        specialty={t('specialty.geriatrician', 'Geriatrician / Preventive Physician')}
        note={t('doctor.geriatricianDesc', 'Schedule annual health span assessments, bone density DEXA scans, and metabolic blood panels with your physician.')}
      />

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center leading-relaxed font-medium">
        {t('disclaimer.educationalTrackingNote', "Educational tracking, not a diagnosis. Screening intervals and thresholds should follow your clinician's guidance.")}
      </p>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Eye, Smile, Bone, Heart, Brain, Activity, Sparkles, Check } from 'lucide-react';
import { Card, SectionTitle, ScoreBadge, TalkToDoctorCard } from './shared/ConditionUI';

const AGE_GROUPS = ['30-40', '40-50', '50-60', '60-70'];

interface CategoryMeta {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  eyes: { label: 'Eyes', icon: Eye, color: '#3B82F6' },
  dental: { label: 'Dental', icon: Smile, color: '#F59E0B' },
  bone: { label: 'Bone', icon: Bone, color: '#94A3B8' },
  cardiac: { label: 'Cardiac', icon: Heart, color: '#EC4899' },
  brain: { label: 'Brain', icon: Brain, color: '#8B5CF6' },
  metabolic: { label: 'Metabolic', icon: Activity, color: '#10B981' }
};

const CATEGORY_ORDER = ['eyes', 'dental', 'bone', 'cardiac', 'brain', 'metabolic'];

const FOUNDATIONAL_FACTORS = [
  { id: 'found_exercise', label: 'Exercised today?' },
  { id: 'found_sleep', label: 'Slept 8 hours?' },
  { id: 'found_diet', label: 'Ate a balanced, whole-food diet today?' },
  { id: 'found_fasting', label: 'Kept to your fasting window?' },
  { id: 'found_antioxidants', label: 'Ate antioxidant-rich foods today?' },
  { id: 'found_stress', label: 'Low stress today?' }
];

const AGE_DATA: Record<string, Record<string, { risk: string; factors: { id: string; label: string }[] }>> = {
  '30-40': {
    eyes: {
      risk: 'Early digital eye strain; first signs of presbyopia in some.',
      factors: [
        { id: 'e30_2020', label: '20-20-20 screen breaks' },
        { id: 'e30_outdoor', label: '60+ min outdoor daylight' },
        { id: 'e30_diet', label: 'Leafy greens / lutein-rich foods' }
      ]
    },
    dental: {
      risk: 'Gum recession begins; enamel wear from stress grinding.',
      factors: [
        { id: 'd30_brush', label: 'Brush 2x + floss daily' },
        { id: 'd30_sugar', label: 'Limit sugary / acidic drinks' },
        { id: 'd30_grind', label: 'Address stress-grinding (mouthguard/relaxation)' }
      ]
    },
    bone: {
      risk: 'Peak bone mass window closing — last chance to bank density.',
      factors: [
        { id: 'b30_resist', label: 'Resistance training (2-3x/week)' },
        { id: 'b30_calcium', label: 'Calcium + vitamin D intake' },
        { id: 'b30_sun', label: '10-15 min sun exposure' }
      ]
    },
    cardiac: {
      risk: 'Subtle lipid and BP drift begins, often unnoticed.',
      factors: [
        { id: 'c30_cardio', label: '150 min/week moderate cardio' },
        { id: 'c30_sodium', label: 'Low-sodium, high-fibre meals' },
        { id: 'c30_sleep', label: '7-8 hrs sleep' }
      ]
    },
    brain: {
      risk: 'Chronic stress and sleep debt start affecting focus and memory.',
      factors: [
        { id: 'n30_sleep', label: 'Consistent sleep schedule' },
        { id: 'n30_meditate', label: '10+ min mindfulness / meditation' },
        { id: 'n30_learn', label: 'New-skill or learning activity' }
      ]
    },
    metabolic: {
      risk: 'Insulin sensitivity starts its slow decline.',
      factors: [
        { id: 'm30_fast', label: 'Adhere to fasting window' },
        { id: 'm30_carb', label: 'Low-carb, whole-food meals' },
        { id: 'm30_steps', label: '8000+ steps' }
      ]
    }
  },
  '40-50': {
    eyes: {
      risk: 'Presbyopia sets in; early cataract risk begins.',
      factors: [
        { id: 'e40_uv', label: 'UV-protective eyewear outdoors' },
        { id: 'e40_antiox', label: 'Antioxidant-rich diet (lutein/zeaxanthin)' },
        { id: 'e40_checkup', label: 'Annual eye check-up adherence' }
      ]
    },
    dental: {
      risk: 'Periodontal disease risk rises; gum recession progresses.',
      factors: [
        { id: 'd40_deep', label: 'Periodontal deep-clean / check-up' },
        { id: 'd40_tobacco', label: 'Reduce tobacco / alcohol exposure' },
        { id: 'd40_floss', label: 'Diligent brushing + flossing' }
      ]
    },
    bone: {
      risk: 'Bone density loss can begin, faster with perimenopause.',
      factors: [
        { id: 'b40_weight', label: 'Weight-bearing exercise' },
        { id: 'b40_calcium', label: 'Calcium + vitamin D' },
        { id: 'b40_alcohol', label: 'Limit alcohol intake' }
      ]
    },
    cardiac: {
      risk: 'Atherosclerosis risk climbs; BP and cholesterol often cross thresholds.',
      factors: [
        { id: 'c40_combo', label: 'Cardio + strength combination' },
        { id: 'c40_omega3', label: 'Omega-3 rich foods' },
        { id: 'c40_bp', label: 'BP self-monitoring' }
      ]
    },
    brain: {
      risk: 'Perimenopausal brain fog and memory lapses more noticeable.',
      factors: [
        { id: 'n40_sleep', label: 'Sleep quality (7+ hrs)' },
        { id: 'n40_social', label: 'Social engagement' },
        { id: 'n40_bvit', label: 'Omega-3 + B-vitamin foods' }
      ]
    },
    metabolic: {
      risk: 'Visceral fat rises; early metabolic syndrome markers appear.',
      factors: [
        { id: 'm40_fast', label: 'Fasting window adherence' },
        { id: 'm40_resist', label: 'Resistance training' },
        { id: 'm40_stress', label: 'Stress-reduction practice' }
      ]
    }
  },
  '50-60': {
    eyes: {
      risk: 'Cataract and early glaucoma risk increase.',
      factors: [
        { id: 'e50_pressure', label: 'Annual glaucoma / eye pressure check' },
        { id: 'e50_control', label: 'BP and glucose control (protects retina)' },
        { id: 'e50_screen', label: 'Reduce prolonged near-screen strain' }
      ]
    },
    dental: {
      risk: 'Tooth loss risk and medication-related dry mouth increase.',
      factors: [
        { id: 'd50_hydrate', label: 'Hydration for dry mouth' },
        { id: 'd50_review', label: 'Dental review every 6 months' },
        { id: 'd50_sugar', label: 'Gum-friendly, low-sugar diet' }
      ]
    },
    bone: {
      risk: 'Osteopenia / osteoporosis risk peaks, especially post-menopause.',
      factors: [
        { id: 'b50_balance', label: 'Resistance + balance training' },
        { id: 'b50_k2', label: 'Calcium + vitamin D + K2' },
        { id: 'b50_fall', label: 'Fall-prevention habits' }
      ]
    },
    cardiac: {
      risk: 'Hypertension and coronary artery disease risk rise sharply.',
      factors: [
        { id: 'c50_bp', label: 'Daily BP tracking' },
        { id: 'c50_plant', label: 'Low-sodium, plant-forward meals' },
        { id: 'c50_aerobic', label: 'Regular aerobic activity' }
      ]
    },
    brain: {
      risk: 'Mild cognitive impairment risk window opens.',
      factors: [
        { id: 'n50_puzzle', label: 'Cognitive training / puzzles' },
        { id: 'n50_cardio', label: 'Cardiovascular exercise (protects brain)' },
        { id: 'n50_apnea', label: 'Quality sleep; treat apnea if present' }
      ]
    },
    metabolic: {
      risk: 'Type 2 diabetes risk peaks.',
      factors: [
        { id: 'm50_glucose', label: 'Post-meal glucose awareness' },
        { id: 'm50_gi', label: 'Low-carb / low-GI meals' },
        { id: 'm50_muscle', label: 'Muscle-preserving strength work' }
      ]
    }
  },
  '60-70': {
    eyes: {
      risk: 'Macular degeneration risk; cataract surgery often needed.',
      factors: [
        { id: 'e60_screen', label: 'Annual retina / macula screening' },
        { id: 'e60_lutein', label: 'Lutein/zeaxanthin-rich diet' },
        { id: 'e60_uv', label: 'UV protection outdoors' }
      ]
    },
    dental: {
      risk: 'Edentulism risk; oral cancer screening becomes important.',
      factors: [
        { id: 'd60_cancer', label: 'Oral cancer screening at check-ups' },
        { id: 'd60_denture', label: 'Denture / implant hygiene if applicable' },
        { id: 'd60_diet', label: 'Soft, nutrient-dense diet as needed' }
      ]
    },
    bone: {
      risk: 'Fracture risk and sarcopenia (muscle loss) accelerate.',
      factors: [
        { id: 'b60_strength', label: 'Strength + balance training' },
        { id: 'b60_protein', label: 'Adequate protein intake' },
        { id: 'b60_hazard', label: 'Home fall-hazard checks' }
      ]
    },
    cardiac: {
      risk: 'Heart failure and arrhythmia risk increase.',
      factors: [
        { id: 'c60_meds', label: 'Medication / BP adherence' },
        { id: 'c60_walk', label: 'Gentle regular activity (walking)' },
        { id: 'c60_fluid', label: 'Fluid / sodium balance' }
      ]
    },
    brain: {
      risk: 'Dementia and neurodegeneration risk rises.',
      factors: [
        { id: 'n60_social', label: 'Social connection / engagement' },
        { id: 'n60_activity', label: 'Physical activity (protects cognition)' },
        { id: 'n60_stim', label: 'Mentally stimulating activities' }
      ]
    },
    metabolic: {
      risk: 'Muscle-to-fat ratio declines; metabolic flexibility drops.',
      factors: [
        { id: 'm60_protein', label: 'Protein-forward meals' },
        { id: 'm60_resist', label: 'Resistance training 2-3x/week' },
        { id: 'm60_sleep', label: 'Consistent sleep-wake times' }
      ]
    }
  }
};

export const AgeingModule: React.FC = () => {
  const [selectedAge, setSelectedAge] = useState<string>('40-50');
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

  // Calculate scores
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
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-5 w-5 text-amber-300" />
          <span className="text-xs font-black uppercase tracking-widest text-blue-100">Longevity Protocol</span>
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">Healthy Ageing & Longevity</h1>
        <p className="text-xs text-blue-100/90 mt-1 leading-relaxed max-w-xl">
          Decade-specific organ defense and foundational cellular longevity habits.
        </p>

        {/* Live Score Pill */}
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <span className="text-xs font-bold text-blue-100">Overall Longevity Score:</span>
          <span className="text-lg font-black bg-white/20 px-3.5 py-1 rounded-xl backdrop-blur-md">
            {overallScore}%
          </span>
        </div>
      </div>

      {/* Decade Age Group Selector */}
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
          Select Your Decade:
        </span>
        <div className="grid grid-cols-4 gap-2">
          {AGE_GROUPS.map(age => (
            <button
              key={age}
              onClick={() => setSelectedAge(age)}
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

      {/* Foundational Daily Habits */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle icon={Sparkles}>Foundational Longevity Habits</SectionTitle>
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
                <span className="text-xs font-bold">{factor.label}</span>
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

      {/* Decade-Specific Organ Systems */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {selectedAge} Decade Organ Defense Factors:
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
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">{meta.label}</span>
                  </div>
                  <ScoreBadge pct={score} />
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed italic">
                  ⚠️ {data.risk}
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
                        <span className="pr-2">{f.label}</span>
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
        specialty="Geriatrician / Preventive Physician"
        note="Schedule annual health span assessments, bone density DEXA scans, and metabolic blood panels with your physician."
      />

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center leading-relaxed font-medium">
        Educational tracking, not a diagnosis. Screening intervals and thresholds should follow your clinician's guidance.
      </p>
    </div>
  );
};

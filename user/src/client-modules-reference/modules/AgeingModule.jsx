import React, { useState, useMemo } from "react";
import { Eye, Smile, Bone, Heart, Brain, Activity, ChevronRight } from "lucide-react";

/**
 * Ageing module for Mito Reboot.
 *
 * Integration note: this demo keeps scores in React state so it can be
 * previewed standalone. In the main app, swap the `scores` useState for
 * the same localStorage-backed pattern used by the other trackers
 * (stress, sleep, fasting, etc.) so daily scores persist and can feed
 * the app's trend charts, e.g.:
 *   const [scores, setScores] = useState(() =>
 *     JSON.parse(localStorage.getItem("mitoreboot_ageing_scores") || "{}")
 *   );
 *   useEffect(() => {
 *     localStorage.setItem("mitoreboot_ageing_scores", JSON.stringify(scores));
 *   }, [scores]);
 * Key scores by date + factor id (e.g. `${today}_${factorId}`) so history
 * accumulates day over day instead of overwriting. Each stored value is a
 * boolean (true = done, false = not done) rather than a numeric score.
 */

const AGE_GROUPS = ["30-40", "40-50", "50-60", "60-70"];

const CATEGORY_META = {
  eyes: { label: "Eyes", icon: Eye, color: "#5DCAA5" },
  dental: { label: "Dental", icon: Smile, color: "#FAC775" },
  bone: { label: "Bone", icon: Bone, color: "#B4B2A9" },
  cardiac: { label: "Cardiac", icon: Heart, color: "#F09595" },
  brain: { label: "Brain", icon: Brain, color: "#AFA9EC" },
  metabolic: { label: "Metabolic", icon: Activity, color: "#1D9E75" },
};

const CATEGORY_ORDER = ["eyes", "dental", "bone", "cardiac", "brain", "metabolic"];

// Applies the same way regardless of which decade tab is active.
const FOUNDATIONAL_FACTORS = [
  { id: "found_exercise", label: "Exercised today?" },
  { id: "found_sleep", label: "Slept 8 hours?" },
  { id: "found_diet", label: "Ate a balanced, whole-food diet today?" },
  { id: "found_fasting", label: "Kept to your fasting window?" },
  { id: "found_antioxidants", label: "Ate antioxidant-rich foods today?" },
  { id: "found_stress", label: "Low stress today?" },
];

const AGE_DATA = {
  "30-40": {
    eyes: {
      risk: "Early digital eye strain; first signs of presbyopia in some.",
      factors: [
        { id: "e30_2020", label: "20-20-20 screen breaks" },
        { id: "e30_outdoor", label: "60+ min outdoor daylight" },
        { id: "e30_diet", label: "Leafy greens / lutein-rich foods" },
      ],
    },
    dental: {
      risk: "Gum recession begins; enamel wear from stress grinding.",
      factors: [
        { id: "d30_brush", label: "Brush 2x + floss daily" },
        { id: "d30_sugar", label: "Limit sugary / acidic drinks" },
        { id: "d30_grind", label: "Address stress-grinding (mouthguard, relaxation)" },
      ],
    },
    bone: {
      risk: "Peak bone mass window closing — last chance to bank density.",
      factors: [
        { id: "b30_resist", label: "Resistance training (2-3x/week)" },
        { id: "b30_calcium", label: "Calcium + vitamin D intake" },
        { id: "b30_sun", label: "10-15 min sun exposure" },
      ],
    },
    cardiac: {
      risk: "Subtle lipid and BP drift begins, often unnoticed.",
      factors: [
        { id: "c30_cardio", label: "150 min/week moderate cardio" },
        { id: "c30_sodium", label: "Low-sodium, high-fibre meals" },
        { id: "c30_sleep", label: "7-8 hrs sleep" },
      ],
    },
    brain: {
      risk: "Chronic stress and sleep debt start affecting focus and memory.",
      factors: [
        { id: "n30_sleep", label: "Consistent sleep schedule" },
        { id: "n30_meditate", label: "10+ min mindfulness / meditation" },
        { id: "n30_learn", label: "New-skill or learning activity" },
      ],
    },
    metabolic: {
      risk: "Insulin sensitivity starts its slow decline.",
      factors: [
        { id: "m30_fast", label: "Adhere to fasting window" },
        { id: "m30_carb", label: "Low-carb, whole-food meals" },
        { id: "m30_steps", label: "8000+ steps" },
      ],
    },
  },
  "40-50": {
    eyes: {
      risk: "Presbyopia sets in; early cataract risk begins.",
      factors: [
        { id: "e40_uv", label: "UV-protective eyewear outdoors" },
        { id: "e40_antiox", label: "Antioxidant-rich diet (lutein/zeaxanthin)" },
        { id: "e40_checkup", label: "Annual eye check-up adherence" },
      ],
    },
    dental: {
      risk: "Periodontal disease risk rises; gum recession progresses.",
      factors: [
        { id: "d40_deep", label: "Periodontal deep-clean / check-up" },
        { id: "d40_tobacco", label: "Reduce tobacco / alcohol exposure" },
        { id: "d40_floss", label: "Diligent brushing + flossing" },
      ],
    },
    bone: {
      risk: "Bone density loss can begin, faster with perimenopause.",
      factors: [
        { id: "b40_weight", label: "Weight-bearing exercise" },
        { id: "b40_calcium", label: "Calcium + vitamin D" },
        { id: "b40_alcohol", label: "Limit alcohol intake" },
      ],
    },
    cardiac: {
      risk: "Atherosclerosis risk climbs; BP and cholesterol often cross thresholds.",
      factors: [
        { id: "c40_combo", label: "Cardio + strength combination" },
        { id: "c40_omega3", label: "Omega-3 rich foods" },
        { id: "c40_bp", label: "BP self-monitoring" },
      ],
    },
    brain: {
      risk: "Perimenopausal brain fog and memory lapses more noticeable.",
      factors: [
        { id: "n40_sleep", label: "Sleep quality (7+ hrs)" },
        { id: "n40_social", label: "Social engagement" },
        { id: "n40_bvit", label: "Omega-3 + B-vitamin foods" },
      ],
    },
    metabolic: {
      risk: "Visceral fat rises; early metabolic syndrome markers appear.",
      factors: [
        { id: "m40_fast", label: "Fasting window adherence" },
        { id: "m40_resist", label: "Resistance training" },
        { id: "m40_stress", label: "Stress-reduction practice" },
      ],
    },
  },
  "50-60": {
    eyes: {
      risk: "Cataract and early glaucoma risk increase.",
      factors: [
        { id: "e50_pressure", label: "Annual glaucoma / eye pressure check" },
        { id: "e50_control", label: "BP and glucose control (protects retina)" },
        { id: "e50_screen", label: "Reduce prolonged near-screen strain" },
      ],
    },
    dental: {
      risk: "Tooth loss risk and medication-related dry mouth increase.",
      factors: [
        { id: "d50_hydrate", label: "Hydration for dry mouth" },
        { id: "d50_review", label: "Dental review every 6 months" },
        { id: "d50_sugar", label: "Gum-friendly, low-sugar diet" },
      ],
    },
    bone: {
      risk: "Osteopenia / osteoporosis risk peaks, especially post-menopause.",
      factors: [
        { id: "b50_balance", label: "Resistance + balance training" },
        { id: "b50_k2", label: "Calcium + vitamin D + K2" },
        { id: "b50_fall", label: "Fall-prevention habits" },
      ],
    },
    cardiac: {
      risk: "Hypertension and coronary artery disease risk rise sharply.",
      factors: [
        { id: "c50_bp", label: "Daily BP tracking" },
        { id: "c50_plant", label: "Low-sodium, plant-forward meals" },
        { id: "c50_aerobic", label: "Regular aerobic activity" },
      ],
    },
    brain: {
      risk: "Mild cognitive impairment risk window opens.",
      factors: [
        { id: "n50_puzzle", label: "Cognitive training / puzzles" },
        { id: "n50_cardio", label: "Cardiovascular exercise (protects brain)" },
        { id: "n50_apnea", label: "Quality sleep; treat apnea if present" },
      ],
    },
    metabolic: {
      risk: "Type 2 diabetes risk peaks.",
      factors: [
        { id: "m50_glucose", label: "Post-meal glucose awareness" },
        { id: "m50_gi", label: "Low-carb / low-GI meals" },
        { id: "m50_muscle", label: "Muscle-preserving strength work" },
      ],
    },
  },
  "60-70": {
    eyes: {
      risk: "Macular degeneration risk; cataract surgery often needed.",
      factors: [
        { id: "e60_screen", label: "Annual retina / macula screening" },
        { id: "e60_lutein", label: "Lutein/zeaxanthin-rich diet" },
        { id: "e60_uv", label: "UV protection outdoors" },
      ],
    },
    dental: {
      risk: "Edentulism risk; oral cancer screening becomes important.",
      factors: [
        { id: "d60_cancer", label: "Oral cancer screening at check-ups" },
        { id: "d60_denture", label: "Denture / implant hygiene if applicable" },
        { id: "d60_diet", label: "Soft, nutrient-dense diet as needed" },
      ],
    },
    bone: {
      risk: "Fracture risk and sarcopenia (muscle loss) accelerate.",
      factors: [
        { id: "b60_strength", label: "Strength + balance training" },
        { id: "b60_protein", label: "Adequate protein intake" },
        { id: "b60_hazard", label: "Home fall-hazard checks" },
      ],
    },
    cardiac: {
      risk: "Heart failure and arrhythmia risk increase.",
      factors: [
        { id: "c60_meds", label: "Medication / BP adherence" },
        { id: "c60_walk", label: "Gentle regular activity (walking)" },
        { id: "c60_fluid", label: "Fluid / sodium balance" },
      ],
    },
    brain: {
      risk: "Dementia and neurodegeneration risk rises.",
      factors: [
        { id: "n60_social", label: "Social connection / engagement" },
        { id: "n60_activity", label: "Physical activity (protects cognition)" },
        { id: "n60_stim", label: "Mentally stimulating activities" },
      ],
    },
    metabolic: {
      risk: "Muscle-to-fat ratio declines; metabolic flexibility drops.",
      factors: [
        { id: "m60_protein", label: "Protein-forward meals" },
        { id: "m60_resist", label: "Resistance training 2-3x/week" },
        { id: "m60_sleep", label: "Consistent sleep-wake times" },
      ],
    },
  },
};

// Score is boolean per factor per day: true = done, false = not done,
// undefined = not yet answered (treated as not done for scoring purposes).
function pctColor(pct) {
  if (pct >= 70) return "#5DCAA5";
  if (pct >= 40) return "#FAC775";
  return "#F09595";
}

export default function AgeingModule() {
  const [activeAge, setActiveAge] = useState("30-40");
  const [activeCategory, setActiveCategory] = useState("eyes");
  const [scores, setScores] = useState({});

  const ageData = AGE_DATA[activeAge];
  const catData = ageData[activeCategory];
  const meta = CATEGORY_META[activeCategory];

  const setFactorScore = (id, value) => {
    setScores((prev) => ({ ...prev, [id]: value }));
  };

  const categoryPct = useMemo(() => {
    const done = catData.factors.filter((f) => scores[f.id] === true).length;
    return (done / catData.factors.length) * 100;
  }, [catData, scores]);

  const overallPct = useMemo(() => {
    const catIds = CATEGORY_ORDER.flatMap((c) => ageData[c].factors.map((f) => f.id));
    const allIds = [...catIds, ...FOUNDATIONAL_FACTORS.map((f) => f.id)];
    const done = allIds.filter((id) => scores[id] === true).length;
    return (done / allIds.length) * 100;
  }, [ageData, scores]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-semibold tracking-tight text-teal-300">Ageing</h1>
          <p className="text-sm text-slate-400 mt-1">
            Decade-by-decade deterioration risks, and the daily habits that counteract them.
          </p>
        </div>

        {/* Age group tabs */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {AGE_GROUPS.map((age) => (
            <button
              key={age}
              onClick={() => setActiveAge(age)}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                activeAge === age
                  ? "bg-teal-900/60 border-teal-500 text-teal-200"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600"
              }`}
            >
              {age}
            </button>
          ))}
        </div>

        {/* Overall score for this decade */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Today's ageing score · {activeAge}</p>
            <p className="text-2xl font-semibold" style={{ color: pctColor(overallPct) }}>
              {Math.round(overallPct)}%
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            Share of habits done today across eyes, dental,<br />bone, cardiac, brain and metabolic factors
          </div>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {CATEGORY_ORDER.map((key) => {
            const CMeta = CATEGORY_META[key];
            const Icon = CMeta.icon;
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors ${
                  isActive ? "border-2" : "border bg-slate-900 border-slate-800 hover:border-slate-600"
                }`}
                style={isActive ? { borderColor: CMeta.color, background: "rgba(255,255,255,0.03)" } : {}}
              >
                <Icon size={20} color={isActive ? CMeta.color : "#94a3b8"} />
                <span className="text-xs" style={{ color: isActive ? CMeta.color : "#94a3b8" }}>
                  {CMeta.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected category detail */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-base font-medium" style={{ color: meta.color }}>
              {meta.label} · {activeAge}
            </h2>
            <span className="text-sm font-medium" style={{ color: pctColor(categoryPct) }}>
              {Math.round(categoryPct)}%
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-4 flex items-start gap-1">
            <ChevronRight size={14} className="mt-0.5 shrink-0 text-slate-600" />
            {catData.risk}
          </p>

          <div className="space-y-4">
            {catData.factors.map((f) => {
              const val = scores[f.id]; // true | false | undefined
              return (
                <div key={f.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-200">{f.label}</span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setFactorScore(f.id, true)}
                      className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                        val === true
                          ? "bg-teal-900/60 border-teal-500 text-teal-200"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setFactorScore(f.id, false)}
                      className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                        val === false
                          ? "bg-red-900/40 border-red-500 text-red-200"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mt-4">
          <h2 className="text-base font-medium mb-3 text-teal-300">Foundational habits · every age</h2>
          <p className="text-xs text-slate-500 mb-3">
            Exercise, sleep, diet, fasting, antioxidants and stress — these matter the same way at every decade.
          </p>
          <div className="space-y-3">
            {FOUNDATIONAL_FACTORS.map((f) => {
              const val = scores[f.id];
              return (
                <div key={f.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-200">{f.label}</span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setFactorScore(f.id, true)}
                      className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                        val === true
                          ? "bg-teal-900/60 border-teal-500 text-teal-200"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setFactorScore(f.id, false)}
                      className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                        val === false
                          ? "bg-red-900/40 border-red-500 text-red-200"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-600 mt-4 text-center">
          Educational tracking, not a diagnosis. Screening intervals and thresholds should follow your clinician's guidance.
        </p>
      </div>
    </div>
  );
}

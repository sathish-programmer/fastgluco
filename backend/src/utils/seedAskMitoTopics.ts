import AskMitoTopic from '../models/AskMitoTopic';

const DEFAULT_ASK_MITO_TOPICS = [
  {
    title: 'Welcome & Greeting',
    category: 'General',
    keywords: ['hi', 'hello', 'hey', 'start', 'greet', 'good morning', 'good afternoon', 'good evening', 'who are you', 'what is mito'],
    suggestedPrompt: 'Hi Mito!',
    icon: '👋',
    answer: 'Hello! I\'m Mito, your AI Health & Clinical Companion for Mito_Reboot.\n\n' +
      'I can help you with:\n' +
      '• Reading & understanding CGM reports\n' +
      '• Anti-cancer nutrition & cell defence\n' +
      '• Circadian intermittent fasting & autophagy\n' +
      '• Sleep & mitochondrial renewal\n' +
      '• Physician & oncologist appointment checklists\n' +
      '• Stress, cortisol & immune resilience\n' +
      '• Environmental toxin exposure reduction\n\n' +
      'Feel free to type your question below or tap any topic shortcut to begin!',
    order: 1,
    isActive: true
  },
  {
    title: 'Help & Topics Overview',
    category: 'Support',
    keywords: ['help', 'support', 'topics', 'menu', 'options', 'what can you do', 'assistance', 'guide', 'list'],
    suggestedPrompt: 'Help & Available Topics',
    icon: '🆘',
    answer: 'Here is how I can assist you today:\n\n' +
      '1. CGM & Glucose Reports — Time-in-Range (TIR), glycemic variability, post-meal spikes.\n' +
      '2. Anti-Cancer Nutrition — Cruciferous veggies, sulforaphane, polyphenols, reducing refined sugar.\n' +
      '3. Circadian Fasting — 12-16 hour fasting windows, autophagy activation, insulin management.\n' +
      '4. Sleep Quality — Melatonin antioxidant defence, slow-wave sleep DNA repair.\n' +
      '5. Doctor Consultation Checklist — Key questions to ask your oncologist or physician.\n' +
      '6. Stress & Immune Defense — Cortisol management, vagus nerve diaphragmatic breathing.\n' +
      '7. Environmental Toxins — HEPA filtration, reducing plastics (BPA) & heavy metal exposures.\n' +
      '8. App Navigation — How to log habits with AI Check-in, switch focus modes, upload reports.\n\n' +
      'Tap any topic shortcut below or type your question!',
    order: 2,
    isActive: true
  },
  {
    title: 'CGM & Glucose Report Guide',
    category: 'CGM',
    keywords: ['cgm', 'glucose', 'reading', 'time in range', 'tir', 'spike', 'mean glucose', 'graph', 'hba1c', 'sugar'],
    suggestedPrompt: 'How do I read my CGM report?',
    icon: '📈',
    answer: 'Continuous Glucose Monitoring (CGM) tracks interstitial glucose levels 24/7. Key targets:\n\n' +
      '• Time-in-Range (TIR): Aim for >70% of readings between 70–140 mg/dL (or 70–180 mg/dL).\n' +
      '• Glucose Spikes: Post-meal spikes should ideally stay below 140 mg/dL and return to baseline within 2 hours.\n' +
      '• Glycemic Variability: Keeping glucose steady reduces oxidative stress and vascular inflammation.',
    order: 3,
    isActive: true
  },
  {
    title: 'Anti-Cancer Nutrition & Cell Defence',
    category: 'Nutrition',
    keywords: ['food', 'diet', 'eat', 'nutrition', 'cancer risk', 'reduce risk', 'antioxidant', 'turmeric', 'berries', 'cruciferous', 'sulforaphane'],
    suggestedPrompt: 'What foods help reduce cancer risk?',
    icon: '🧬',
    answer: 'Nutritional strategies for cellular defence:\n\n' +
      '1. Cruciferous Vegetables: Broccoli sprouts, kale, and cabbage contain sulforaphane, promoting cellular detoxification.\n' +
      '2. Polyphenols & Antioxidants: Deeply pigmented berries, green tea (EGCG), and turmeric (curcumin) neutralize free radicals.\n' +
      '3. Reduce Sugar & Ultra-Processed Foods: High insulin levels and excess refined carbs fuel inflammatory cascades.\n' +
      '4. Healthy Fats: Prioritize extra virgin olive oil, wild-caught fish (omega-3s), and avocados.',
    order: 4,
    isActive: true
  },
  {
    title: 'Circadian Fasting & Autophagy',
    category: 'Fasting',
    keywords: ['fasting', 'intermittent', 'autophagy', '16/8', 'eating window', 'starve', 'circadian fasting'],
    suggestedPrompt: 'What is circadian intermittent fasting?',
    icon: '⚡',
    answer: 'Intermittent circadian fasting activates cellular renewal:\n\n' +
      '• Autophagy Activation: Fasting 12–16 hours triggers autophagy, where cells clear damaged organelles and mutated proteins.\n' +
      '• Insulin Sensitivity: Lowering fasting insulin levels shuts down growth signals (like mTOR/IGF-1) associated with abnormal cell growth.\n' +
      '• Circadian Alignment: Finish eating 3 hours before sleep to optimize nighttime metabolic repair.',
    order: 5,
    isActive: true
  },
  {
    title: 'Sleep & Mitochondrial Repair',
    category: 'Sleep',
    keywords: ['sleep', 'rest', 'melatonin', 'circadian', 'night', 'insomnia', 'fatigue', 'bed'],
    suggestedPrompt: 'How does sleep affect mitochondrial health?',
    icon: '💤',
    answer: 'Sleep is essential for cellular regeneration and immune surveillance:\n\n' +
      '• Melatonin Defense: Melatonin produced during deep sleep is a potent mitochondrial antioxidant.\n' +
      '• DNA Repair: Critical enzymatic repair of damaged DNA occurs predominantly during slow-wave sleep.\n' +
      '• Immune Surveillance: Restorative 7–9 hour sleep enhances Natural Killer (NK) cell activity to target damaged cells.',
    order: 6,
    isActive: true
  },
  {
    title: 'Physician & Doctor Consultation Checklist',
    category: 'Doctor',
    keywords: ['doctor', 'oncologist', 'consultation', 'ask', 'question', 'appointment', 'checklist', 'physician'],
    suggestedPrompt: 'What questions should I ask my doctor?',
    icon: '🩺',
    answer: 'Recommended questions for your medical team:\n\n' +
      '1. How do my metabolic markers (fasting glucose, HbA1c, lipid panel) correlate with my current protocol?\n' +
      '2. Are there specific physical activity or fasting guidelines tailored to my treatment stage?\n' +
      '3. Which routine blood panels or tumor markers (e.g. CEA, CA-125, PSA, CRP) should we track next?',
    order: 7,
    isActive: true
  },
  {
    title: 'Stress, Cortisol & Immune Health',
    category: 'Stress',
    keywords: ['stress', 'anxiety', 'cortisol', 'worry', 'emotional', 'mindfulness', 'stillness', 'mental', 'nervous'],
    suggestedPrompt: 'How does stress affect cellular health?',
    icon: '🫁',
    answer: 'Managing stress protects immune resilience:\n\n' +
      '• Cortisol Impact: Chronic high cortisol suppresses immune cell activity and elevates baseline inflammatory cytokines.\n' +
      '• Vagus Nerve Activation: 5 minutes of slow diaphragmatic breathing (4-sec in, 6-sec out) signals the nervous system to shift into parasympathetic recovery mode.\n' +
      '• Daily Stillness: Prioritizing mindfulness or activities you love restores cellular equilibrium.',
    order: 8,
    isActive: true
  },
  {
    title: 'Environmental Toxin Defense',
    category: 'Environment',
    keywords: ['environment', 'toxin', 'pollution', 'microplastic', 'air', 'water', 'chemical', 'heavy metal', 'bpa'],
    suggestedPrompt: 'How do environmental toxins affect cellular health?',
    icon: '🛡️',
    answer: 'Reducing environmental toxic load:\n\n' +
      '• Air Quality: Airborne particulate matter (PM2.5) increases systemic inflammation. Consider HEPA air filtration indoors.\n' +
      '• Endocrine Disruptors: Minimize plastics (BPA/phthalates) when storing or heating food; use glass or stainless steel.\n' +
      '• Pure Water: Use multi-stage water filtration to remove heavy metals, chlorine, and micro-contaminants.',
    order: 9,
    isActive: true
  },
  {
    title: 'Mito_Reboot App Guidance',
    category: 'Features',
    keywords: ['feature', 'app', 'how to use', 'mito', 'logging', 'check-in', 'report upload', 'how app works'],
    suggestedPrompt: 'Help me understand Mito_Reboot features',
    icon: '💡',
    answer: 'How to get the most out of Mito_Reboot:\n\n' +
      '• AI Daily Check-in: Tap the floating robot button at bottom right to log your daily habits in under 60 seconds.\n' +
      '• Focus Journeys: Switch your journey mode (Cancer Prevention, Treatment Support, Secondary Prevention) at the top of your dashboard.\n' +
      '• Reports & Analytics: Upload CGM or lab reports in the Reports tab to view structured metabolic insights.',
    order: 10,
    isActive: true
  }
];

export const seedAskMitoTopics = async () => {
  try {
    // Delete existing so stale topics with embedded emojis in titles get cleanly replaced
    await AskMitoTopic.deleteMany({});
    console.log('🔄 [AskMitoSeed] Pre-filling clean Ask Mito Q&A Knowledge Workflows...');
    await AskMitoTopic.insertMany(DEFAULT_ASK_MITO_TOPICS);
    console.log(`✅ [AskMitoSeed] ${DEFAULT_ASK_MITO_TOPICS.length} clean Ask Mito topics seeded successfully.`);
  } catch (err) {
    console.error('❌ [AskMitoSeed] Error seeding Ask Mito topics:', err);
  }
};

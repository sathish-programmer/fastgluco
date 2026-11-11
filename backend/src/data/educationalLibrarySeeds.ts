export interface IEducationalLibrarySeed {
  title: string;
  category: string; // 'DAMAGE – REDUCE THE LOAD' | 'REPAIR – BUILD THE DEFENCE'
  topic: string;
  focus: string;
  description: string;
  url: string;
  speaker: string;
  duration?: string;
  isCollection?: boolean;
  takeaways: string[];
  practicalAction: string;
  targetPlatform: 'App' | 'Website' | 'Both';
  isPaidOnly?: boolean;
  order: number;
}

export const MITOREBOOT_LIBRARY_RESOURCES: IEducationalLibrarySeed[] = [
  // ==========================================
  // DAMAGE – REDUCE THE LOAD (Topics 1 - 11)
  // ==========================================

  // Topic 1: Stress
  {
    title: 'How Chronic Stress Shapes Cancer Risk and Recovery – Ground & Root Podcast',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Stress',
    focus: 'Cortisol, sympathetic activation, inflammation, immune surveillance and cancer.',
    description: 'Explores how chronic emotional and physiological stress, persistent cortisol elevation, and sympathetic nervous system activation impact tumor microenvironments and immune surveillance.',
    url: 'https://www.youtube.com/results?search_query=Ground+%26+Root+Podcast+Chronic+Stress+Cancer+Risk',
    speaker: 'Ground & Root Podcast',
    isCollection: true,
    takeaways: [
      'Persistent cortisol dysregulation dampens natural killer (NK) cell activity and lymphocyte function.',
      'Sympathetic signaling accelerates inflammatory cytokine cascades (IL-6, TNF-alpha).',
      'Active stress modulation directly supports neuroendocrine balance and metabolic recovery.'
    ],
    practicalAction: 'Incorporate daily 15-minute nervous system down-regulation (box breathing or guided meditation) before bed.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 1
  },
  {
    title: 'Chronic stress, cortisol and cancer – expert video discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Stress',
    focus: 'Cortisol, sympathetic activation, inflammation, immune surveillance and cancer.',
    description: 'Comprehensive clinical discussions on the hypothalamic-pituitary-adrenal (HPA) axis, elevated circulating glucocorticoids, and cellular repair pathways.',
    url: 'https://www.youtube.com/results?search_query=Chronic+stress+cortisol+and+cancer+mechanisms',
    speaker: 'Clinical Oncology & Neurobiology Experts',
    isCollection: true,
    takeaways: [
      'Elevated cortisol alters DNA damage repair efficiency and cell cycle control.',
      'Chronic stress promotes systemic low-grade vascular inflammation.',
      'Restoring circadian rhythm helps re-balance endocrine stress hormones.'
    ],
    practicalAction: 'Take active rest micro-breaks every 90 minutes during prolonged sedentary desk work.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 2
  },
  {
    title: 'Stress, inflammation and the immune system – neuroscience discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Stress',
    focus: 'Cortisol, sympathetic activation, inflammation, immune surveillance and cancer.',
    description: 'Neuroscientific evaluation of mind-body stress signaling, vagal tone regulation, and lymphocyte health in metabolic disease prevention.',
    url: 'https://www.youtube.com/results?search_query=Stress+inflammation+and+the+immune+system+neuroscience',
    speaker: 'Neuroscience & Immunology Discussions',
    isCollection: true,
    takeaways: [
      'The vagus nerve serves as the body’s primary anti-inflammatory brake.',
      'Mental distress increases pro-inflammatory cytokines that impair immune surveillance.',
      'Somatic decompression exercises stimulate parasympathetic activation.'
    ],
    practicalAction: 'Practice slow physiological sighs (2 quick inhales through the nose, 1 long exhale through the mouth) during stressful moments.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 3
  },

  // Topic 2: Sleep Debt
  {
    title: 'Sleep deprivation and cancer risk – scientific discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Sleep Debt',
    focus: 'Circadian rhythm, melatonin, DNA repair, immune function and night-shift work.',
    description: 'Scientific deep dive into sleep architecture, lymphatic waste clearance in the brain, and nocturnal cellular repair mechanisms.',
    url: 'https://www.youtube.com/results?search_query=Sleep+deprivation+and+cancer+risk+scientific+discussions',
    speaker: 'Sleep Medicine & Chronobiology Specialists',
    isCollection: true,
    takeaways: [
      'Consistent sleep deprivation suppresses natural killer cell count by up to 70%.',
      'Circadian misalignment disrupts clock genes governing cell cycle checkpoint regulation.',
      'Deep slow-wave sleep is essential for cellular metabolic detoxification and DNA repair.'
    ],
    practicalAction: 'Maintain a strict 7–8 hour sleep opportunity window at consistent bed and wake times.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 4
  },
  {
    title: 'Melatonin, sleep and cancer – expert interviews',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Sleep Debt',
    focus: 'Circadian rhythm, melatonin, DNA repair, immune function and night-shift work.',
    description: 'Examines the dual role of nocturnal melatonin as both a master circadian hormone and a powerful oncostatic mitochondrial antioxidant.',
    url: 'https://www.youtube.com/results?search_query=Melatonin+sleep+and+cancer+expert+interviews',
    speaker: 'Endocrine & Oncology Researchers',
    isCollection: true,
    takeaways: [
      'Melatonin protects mitochondrial membranes from reactive oxygen species.',
      'Nighttime blue light exposure severely suppresses endogenous pineal melatonin secretion.',
      'Healthy dark cycles preserve cellular antioxidant defences and genomic stability.'
    ],
    practicalAction: 'Dim household lights and turn off screens 60 minutes before your target bedtime.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 5
  },
  {
    title: 'Night shift work and cancer risk – medical discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Sleep Debt',
    focus: 'Circadian rhythm, melatonin, DNA repair, immune function and night-shift work.',
    description: 'Medical assessment of IARC classification of shift work that involves circadian disruption and actionable protocols for shift workers.',
    url: 'https://www.youtube.com/results?search_query=Night+shift+work+and+cancer+risk+medical+discussions',
    speaker: 'Occupational Health & Circadian Biology Panel',
    isCollection: true,
    takeaways: [
      'Chronic circadian desynchrony alters clock genes governing tumor suppression.',
      'Shift-work metabolic stress can trigger nocturnal glucose intolerance.',
      'Strategic light exposure and meal timing buffer circadian disruption.'
    ],
    practicalAction: 'Avoid heavy high-glycemic meals during night shifts; maintain fasting during the dark period.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 6
  },

  // Topic 3: Smoking & Chewing
  {
    title: 'HCG – Dr Vishal Rao: Quit Smoking, Give Yourself a Gift of Life',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Smoking & Chewing',
    focus: 'Tobacco carcinogens, DNA damage, oral cancer, lung cancer and cessation.',
    description: 'Renowned head and neck surgical oncologist Dr. Vishal Rao highlights the immediate cellular recovery and life-saving benefits of tobacco cessation.',
    url: 'https://www.youtube.com/results?search_query=HCG+Dr+Vishal+Rao+Quit+Smoking+Give+Yourself+a+Gift+of+Life',
    speaker: 'Dr. Vishal Rao (Surgical Oncologist, HCG)',
    isCollection: true,
    takeaways: [
      'Tobacco smoke contains over 70 recognized chemical carcinogens that directly bind and mutate DNA.',
      'Oral cavity, pharynx, and lung tissues begin cellular repair within days of quitting.',
      'Nicotine replacement and behavioral substitution significantly increase cessation success rates.'
    ],
    practicalAction: 'Consult a healthcare provider or cessation counselor to start a 30-day tobacco-free tapering plan.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 7
  },
  {
    title: 'Smoking, tobacco and cancer – WHO expert videos',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Smoking & Chewing',
    focus: 'Tobacco carcinogens, DNA damage, oral cancer, lung cancer and cessation.',
    description: 'Global health overview of smokeless tobacco, gutka, khaini, and cigarettes in relation to oral submucous fibrosis and systemic oncogenesis.',
    url: 'https://www.youtube.com/results?search_query=WHO+Smoking+tobacco+and+cancer+expert+videos',
    speaker: 'World Health Organization Experts',
    isCollection: true,
    takeaways: [
      'Smokeless tobacco and areca nut are classified as Group 1 human carcinogens.',
      'Carcinogen exposure creates persistent oxidative mucosal damage and chronic fibrosis.',
      'Complete cessation eliminates ongoing genetic mutational pressure.'
    ],
    practicalAction: 'Replace chewing habits with healthy physical anchors such as cloves, fennel seeds, or sugar-free gum.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 8
  },
  {
    title: 'How tobacco causes cancer – cancer biology explained',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Smoking & Chewing',
    focus: 'Tobacco carcinogens, DNA damage, oral cancer, lung cancer and cessation.',
    description: 'Visual explainer of polycyclic aromatic hydrocarbons (PAHs) and nitrosamines forming covalent DNA adducts in epithelial cells.',
    url: 'https://www.youtube.com/results?search_query=How+tobacco+causes+cancer+cancer+biology+explained',
    speaker: 'Cancer Biology & Molecular Genetics',
    isCollection: true,
    takeaways: [
      'DNA adducts induce irreversible p53 tumor suppressor gene mutations.',
      'Free radical generation damages mitochondrial respiration chains.',
      'Stopping tobacco halts cumulative DNA strand-breaking events immediately.'
    ],
    practicalAction: 'Educate family and peers on the reality of second-hand and third-hand smoke exposure in closed rooms.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 9
  },

  // Topic 4: Alcohol
  {
    title: 'Johns Hopkins – The Health Risks of Alcohol',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Alcohol',
    focus: 'Acetaldehyde, oxidative stress, breast cancer, liver cancer and colorectal cancer.',
    description: 'Clinicians from Johns Hopkins break down how ethanol metabolism creates toxic acetaldehyde, depletes glutathione, and stresses hepatic cells.',
    url: 'https://www.youtube.com/results?search_query=Johns+Hopkins+The+Health+Risks+of+Alcohol',
    speaker: 'Johns Hopkins Medicine',
    isCollection: true,
    takeaways: [
      'Acetaldehyde binds proteins and DNA, causing chromosomal aberrations and oxidative damage.',
      'Alcohol increases circulating estrogen levels, elevating breast cancer vulnerability.',
      'Even low-to-moderate alcohol intake raises upper GI and colorectal cancer risk.'
    ],
    practicalAction: 'Limit or eliminate alcoholic drinks; designate a minimum of 4–5 alcohol-free days per week.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 10
  },
  {
    title: 'Johns Hopkins – Alcohol and Cancer Risk',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Alcohol',
    focus: 'Acetaldehyde, oxidative stress, breast cancer, liver cancer and colorectal cancer.',
    description: 'Expert oncologists clarify the direct biological links between ethanol consumption, lipid peroxidation, and oncogene activation.',
    url: 'https://www.youtube.com/results?search_query=Johns+Hopkins+Alcohol+and+Cancer+Risk',
    speaker: 'Johns Hopkins Kimmel Cancer Center',
    isCollection: true,
    takeaways: [
      'Alcohol acts as an organic solvent, accelerating mucosal absorption of other carcinogens.',
      'Metabolism of ethanol depletes essential methyl donors and folic acid.',
      'Cessation allows liver detoxification pathways and mucosal barriers to recover.'
    ],
    practicalAction: 'Choose refreshing non-alcoholic mocktails or infused sparkling water during social events.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 11
  },
  {
    title: 'Should You Give Up Alcohol to Reduce Cancer Risk?',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Alcohol',
    focus: 'Acetaldehyde, oxidative stress, breast cancer, liver cancer and colorectal cancer.',
    description: 'Evidence-based debate on whether moderate alcohol consumption has any cardioprotective benefits versus its unequivocal oncological burden.',
    url: 'https://www.youtube.com/results?search_query=Should+You+Give+Up+Alcohol+to+Reduce+Cancer+Risk',
    speaker: 'Preventive Oncology & Nutrition Experts',
    isCollection: true,
    takeaways: [
      'Global oncological guidelines confirm no safe lower threshold exists for cancer prevention.',
      'Eliminating alcohol significantly improves metabolic liver panel markers.',
      'Sleep quality and gut microbiome diversity dramatically improve upon abstention.'
    ],
    practicalAction: 'Complete a 30-day alcohol-free challenge to reset metabolic and liver enzyme levels.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 12
  },

  // Topic 5: Substances
  {
    title: 'Cannabis and cancer – research discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Substances',
    focus: 'Recreational drugs, substance dependence, metabolic effects and associated health risks.',
    description: 'Distinguishing palliative symptom management from unproven curative claims, with analysis of combustion carcinogens in inhaled products.',
    url: 'https://www.youtube.com/results?search_query=Cannabis+and+cancer+research+discussions+oncology',
    speaker: 'Oncology Pharmacologists & Researchers',
    isCollection: true,
    takeaways: [
      'Smoking cannabis produces many of the same pyrolytic tar carcinogens as tobacco.',
      'Endocannabinoid receptors play roles in immune signaling but do not cure malignant tumors.',
      'Medically supervised non-combusted formulations avoid pyrolytic toxins.'
    ],
    practicalAction: 'Always discuss cannabinoid usage transparently with your primary treating oncologist.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 13
  },
  {
    title: 'Substance abuse and long-term health – medical experts',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Substances',
    focus: 'Recreational drugs, substance dependence, metabolic effects and associated health risks.',
    description: 'Systemic effects of illicit substance abuse on vascular endothelial integrity, immune exhaustion, and metabolic organ damage.',
    url: 'https://www.youtube.com/results?search_query=Substance+abuse+and+long-term+health+medical+experts',
    speaker: 'Addiction Medicine & Internal Medicine Experts',
    isCollection: true,
    takeaways: [
      'Chronic stimulant use induces mitochondrial hyper-exhaustion and oxidative crisis.',
      'Immune surveillance mechanisms are markedly blunted by chronic substance stress.',
      'Early professional intervention protects multiorgan reserve.'
    ],
    practicalAction: 'Utilize confidential addiction support hotlines and medical detox when dealing with dependence.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 14
  },
  {
    title: 'Opioids, addiction and the human body – medical discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Substances',
    focus: 'Recreational drugs, substance dependence, metabolic effects and associated health risks.',
    description: 'In-depth review of opioid receptor pharmacodynamics, bowel dysmotility, and immune suppression under extended opioid exposure.',
    url: 'https://www.youtube.com/results?search_query=Opioids+addiction+and+the+human+body+medical+discussions',
    speaker: 'Medical Specialists & Neurobiology Panel',
    isCollection: true,
    takeaways: [
      'Prolonged opioid use alters gut barrier permeability and systemic immune signaling.',
      'Tolerance drives neuroadaptation and metabolic dysregulation.',
      'Non-opioid multimodal pain strategies preserve gut and immune health.'
    ],
    practicalAction: 'Review all long-term analgesic and narcotic regimens periodically with your clinical physician.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 15
  },

  // Topic 6: Environment
  {
    title: 'NDTV – Lung Cancer Risk in Nonsmokers Explained by Dr Arvind Kumar',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Environment',
    focus: 'Air pollution, pesticides, endocrine disruptors, heavy metals and microplastics.',
    description: 'Chest surgeon Dr. Arvind Kumar explains the surging epidemic of adenocarcinoma lung cancer in young nonsmokers exposed to PM2.5 air pollution.',
    url: 'https://www.youtube.com/results?search_query=NDTV+Lung+Cancer+Risk+in+Nonsmokers+Dr+Arvind+Kumar',
    speaker: 'Dr. Arvind Kumar (Chest Surgeon & Lung Care Foundation)',
    isCollection: true,
    takeaways: [
      'Particulate matter (PM2.5) penetrates deep alveoli and crosses directly into the bloodstream.',
      'Ambient air pollution triggers pulmonary macrophage inflammation and EGFR mutations.',
      'Indoor air pollution from unvented cooking and dust poses significant cumulative risks.'
    ],
    practicalAction: 'Use HEPA air purifiers in bedrooms and wear certified N95 masks when AQI exceeds 150.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 16
  },
  {
    title: 'Pesticides and cancer – scientific expert discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Environment',
    focus: 'Air pollution, pesticides, endocrine disruptors, heavy metals and microplastics.',
    description: 'Detailed evaluation of agricultural organophosphates, glyphosates, and persistent bioaccumulative residues in public water and food supplies.',
    url: 'https://www.youtube.com/results?search_query=Pesticides+and+cancer+scientific+expert+discussions',
    speaker: 'Environmental Toxicology & Epidemiologists',
    isCollection: true,
    takeaways: [
      'Certain pesticides mimic hormones and generate intracellular oxidative stress.',
      'Agricultural runoff and unwashed produce are prominent exposure vectors.',
      'Thorough washing and localized seasonal sourcing lower intake.'
    ],
    practicalAction: 'Soak conventional produce in baking soda water solution (1 tsp/cup) for 15 minutes before cooking.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 17
  },
  {
    title: 'Microplastics, endocrine disruption and human health',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Environment',
    focus: 'Air pollution, pesticides, endocrine disruptors, heavy metals and microplastics.',
    description: 'Explores how nanoplastics and plasticizers leech into drinking water, cross biological membranes, and alter endocrine signalling.',
    url: 'https://www.youtube.com/results?search_query=Microplastics+endocrine+disruption+and+human+health',
    speaker: 'Environmental Scientists & Biochemists',
    isCollection: true,
    takeaways: [
      'Microplastics carry plasticizers like phthalates and BPA that bind hormone receptors.',
      'Foreign plastic particles provoke localized tissue inflammatory responses.',
      'Minimizing single-use heated plastics reduces chronic chemical migration.'
    ],
    practicalAction: 'Never microwave food in plastic containers; switch to stainless steel or glass storage.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 18
  },

  // Topic 7: Check Your Kitchen
  {
    title: 'Aflatoxin and liver cancer – scientific discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Check Your Kitchen',
    focus: 'Aflatoxin, nitrosamines, acrylamide, repeatedly heated oils, processed meat and food contamination.',
    description: 'How fungal aflatoxins from Aspergillus species in improperly stored grains, peanuts, and spices act as potent hepatic mutagens.',
    url: 'https://www.youtube.com/results?search_query=Aflatoxin+and+liver+cancer+scientific+discussions',
    speaker: 'Food Safety & Hepatology Specialists',
    isCollection: true,
    takeaways: [
      'Aflatoxin B1 is one of the most potent known hepatocarcinogens.',
      'Synergizes with Hepatitis B/C infections to multiply liver cancer risk tenfold.',
      'Proper dry food storage and discarding discolored nuts mitigates exposure.'
    ],
    practicalAction: 'Store nuts, pulses, and flours in airtight dry containers; discard any moldy or bitter-tasting nuts.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 19
  },
  {
    title: 'Repeatedly heated cooking oil and health risks',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Check Your Kitchen',
    focus: 'Aflatoxin, nitrosamines, acrylamide, repeatedly heated oils, processed meat and food contamination.',
    description: 'Scientific review of thermal oxidation, polymer formation, trans fats, and polar compounds generated by repeatedly reusing frying oil.',
    url: 'https://www.youtube.com/results?search_query=Repeatedly+heated+cooking+oil+and+health+risks+lipid+peroxidation',
    speaker: 'Nutritional Biochemistry & Toxicology Panel',
    isCollection: true,
    takeaways: [
      'Deep reheating breaks oil bonds, generating carcinogenic polycyclic hydrocarbons.',
      'Reheated oil accelerates endothelial inflammation and liver steatosis.',
      'Commercial eateries frequently reuse oil past safety limits.'
    ],
    practicalAction: 'Never reheat cooking oil after deep frying; use fresh oil and lower-temperature methods.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 20
  },
  {
    title: 'Food carcinogens: nitrosamines, acrylamide and processed meat',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Check Your Kitchen',
    focus: 'Aflatoxin, nitrosamines, acrylamide, repeatedly heated oils, processed meat and food contamination.',
    description: 'Understanding chemical transformation of nitrates into nitrosamines in cured meats and acrylamide formation in heavily browned starchy foods.',
    url: 'https://www.youtube.com/results?search_query=Food+carcinogens+nitrosamines+acrylamide+and+processed+meat',
    speaker: 'Food Chemistry & Oncological Nutrition',
    isCollection: true,
    takeaways: [
      'WHO categorizes processed meats (sausages, bacon) as Group 1 carcinogens for colorectal cancer.',
      'Over-browning starchy foods at temperatures above 120°C creates acrylamide.',
      'Steaming, boiling, and gentle sautéing minimize mutagenic compound creation.'
    ],
    practicalAction: 'Toast bread to light golden rather than charred dark brown; replace cured meats with whole proteins.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 21
  },

  // Topic 8: Obesity
  {
    title: 'The Obesity–Cancer Connection – Dr Neil Naik',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Obesity',
    focus: 'Insulin resistance, adipokines, chronic inflammation, estrogen and cancer risk.',
    description: 'Clinical breakdown of how visceral adiposity functions as an endocrine disruptor, driving hyperinsulinemia and mitogenic growth factors.',
    url: 'https://www.youtube.com/results?search_query=The+Obesity+Cancer+Connection+Dr+Neil+Naik',
    speaker: 'Dr. Neil Naik (Metabolic Health Specialist)',
    isCollection: true,
    takeaways: [
      'Excess visceral fat constantly secretes inflammatory adipokines (IL-6, TNF).',
      'Elevated insulin and free IGF-1 directly stimulate cellular proliferation.',
      'Adipose tissue houses aromatase enzymes that convert androgens to excess estrogen.'
    ],
    practicalAction: 'Measure waist-to-hip ratio regularly to monitor visceral adipose distribution.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 22
  },
  {
    title: 'Obesity, insulin resistance and cancer – expert discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Obesity',
    focus: 'Insulin resistance, adipokines, chronic inflammation, estrogen and cancer risk.',
    description: 'Detailed mechanistic look at how chronic hyperinsulinemia creates a nutrient-rich, pro-growth signaling environment for mutated cells.',
    url: 'https://www.youtube.com/results?search_query=Obesity+insulin+resistance+and+cancer+expert+discussions',
    speaker: 'Endocrinologists & Cancer Epidemiologists',
    isCollection: true,
    takeaways: [
      'Cancer cells frequently overexpress insulin receptors on their membranes.',
      'Insulin resistance impairs natural immune surveillance mechanisms.',
      'Weight reduction of even 5–10% drastically reduces circulating pro-tumorigenic markers.'
    ],
    practicalAction: 'Adopt an eating pattern focused on low glycemic index whole foods to reduce insulin spikes.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 23
  },
  {
    title: 'Fat tissue, inflammation and cancer biology',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Obesity',
    focus: 'Insulin resistance, adipokines, chronic inflammation, estrogen and cancer risk.',
    description: 'Examines macrophage infiltration in hypertrophic adipose tissue, hypoxia, and angiogenic cytokine secretion.',
    url: 'https://www.youtube.com/results?search_query=Fat+tissue+inflammation+and+cancer+biology+mechanisms',
    speaker: 'Cellular Biology & Metabolic Oncology',
    isCollection: true,
    takeaways: [
      'Crowded, oxygen-starved fat cells rupture and trigger persistent immune inflammation.',
      'Visceral adiposity is linked to at least 13 distinct types of malignancy.',
      'Metabolic improvements occur rapidly when physical activity is initiated.'
    ],
    practicalAction: 'Engage in 30 minutes of brisk daily walking to enhance adipose tissue oxygenation.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 24
  },

  // Topic 9: Dental Health
  {
    title: 'Periodontal disease and systemic inflammation',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Dental Health',
    focus: 'Periodontal disease, oral microbiome, chronic inflammation and oral cancer.',
    description: 'How chronic periodontal pockets provide direct vascular entry for pathogenic oral bacteria, triggering systemic C-reactive protein (CRP) elevations.',
    url: 'https://www.youtube.com/results?search_query=Periodontal+disease+and+systemic+inflammation+oral+health',
    speaker: 'Periodontists & Systemic Health Experts',
    isCollection: true,
    takeaways: [
      'Bleeding gums indicate ulcerated pocket lining exposing the vascular tree.',
      'Periodontal pathogens like Fusobacterium nucleatum have been discovered in colon tumors.',
      'Good periodontal health reduces chronic whole-body inflammatory load.'
    ],
    practicalAction: 'Floss daily and use a soft-bristled toothbrush with gentle 45-degree sulcular brushing.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 25
  },
  {
    title: 'Oral microbiome and cancer – scientific discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Dental Health',
    focus: 'Periodontal disease, oral microbiome, chronic inflammation and oral cancer.',
    description: 'Analysis of oral dysbiosis, tobacco interactions, alcohol mouthwashes, and neoplastic transformation of oral epithelial cells.',
    url: 'https://www.youtube.com/results?search_query=Oral+microbiome+and+cancer+scientific+discussions',
    speaker: 'Microbiome Researchers & Oral Oncologists',
    isCollection: true,
    takeaways: [
      'A balanced oral microbiome acts as an innate protective immune shield.',
      'Alcohol-containing harsh mouthwashes can strip protective salivary enzymes.',
      'Chronic irritation from sharp teeth or poorly fitting dentures can provoke dysplasia.'
    ],
    practicalAction: 'Schedule professional dental cleaning and oral cancer screenings every 6 months.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 26
  },
  {
    title: 'Gum disease and overall health – dental experts',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Dental Health',
    focus: 'Periodontal disease, oral microbiome, chronic inflammation and oral cancer.',
    description: 'Review of bidirectional relationships between diabetes, periodontal bone loss, cardiovascular risk, and immune regulation.',
    url: 'https://www.youtube.com/results?search_query=Gum+disease+and+overall+health+dental+experts',
    speaker: 'Dental Surgery & Preventive Health Panel',
    isCollection: true,
    takeaways: [
      'Controlling periodontal infections improves glycemic control in diabetic individuals.',
      'Early gum disease (gingivitis) is completely reversible with prompt hygiene.',
      'Oral hygiene is an essential pillar of lifestyle medicine and immune fitness.'
    ],
    practicalAction: 'Address any bleeding gums or lingering mouth ulcers lasting more than two weeks.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 27
  },

  // Topic 10: Gastritis
  {
    title: 'The Discovery of the Bacterium Behind 5% of All Cancers – Barry Marshall',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Gastritis',
    focus: 'Helicobacter pylori, chronic gastritis, intestinal metaplasia and gastric cancer.',
    description: 'Nobel Laureate Barry Marshall recounts how he proved Helicobacter pylori causes chronic gastritis, peptic ulcers, and distal stomach adenocarcinoma.',
    url: 'https://www.youtube.com/results?search_query=Barry+Marshall+Helicobacter+pylori+discovery+Nobel+Prize',
    speaker: 'Prof. Barry Marshall (Nobel Laureate in Medicine)',
    isCollection: true,
    takeaways: [
      'H. pylori infection is categorized by WHO as a definitive Class 1 human carcinogen.',
      'Bacterial urease allows colonization in harsh gastric acid, causing decades-long inflammation.',
      'Timely antimicrobial eradication significantly reduces lifetime gastric cancer risk.'
    ],
    practicalAction: 'Get tested for H. pylori (urea breath test or stool antigen) if experiencing recurrent dyspepsia or burning.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 28
  },
  {
    title: 'H. pylori and stomach cancer – gastroenterologist discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Gastritis',
    focus: 'Helicobacter pylori, chronic gastritis, intestinal metaplasia and gastric cancer.',
    description: 'Clinical walk-through of the Correa cascade: from superficial gastritis to chronic atrophic gastritis, intestinal metaplasia, and neoplasia.',
    url: 'https://www.youtube.com/results?search_query=H+pylori+and+stomach+cancer+gastroenterologist+discussions',
    speaker: 'Gastroenterology & Digestive Oncology Experts',
    isCollection: true,
    takeaways: [
      'Chronic stomach inflammation gradually destroys acid-secreting parietal cells.',
      'Early intervention halts the progression along the metaplasia cascade.',
      'Dietary salt and smoking synergistically accelerate H. pylori oncogenicity.'
    ],
    practicalAction: 'Reduce excessive table salt and heavily pickled sodium-rich foods to protect gastric mucosa.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 29
  },
  {
    title: 'Chronic gastritis and the progression to gastric cancer',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Gastritis',
    focus: 'Helicobacter pylori, chronic gastritis, intestinal metaplasia and gastric cancer.',
    description: 'Endoscopic surveillance guidelines for high-risk patients with persistent atrophic gastritis, family history, and precancerous lesions.',
    url: 'https://www.youtube.com/results?search_query=Chronic+gastritis+and+the+progression+to+gastric+cancer',
    speaker: 'Pathology & Endoscopy Specialists',
    isCollection: true,
    takeaways: [
      'High-definition endoscopy with biopsy detects early curable dysplasia.',
      'Symptoms of early gastric lesions often mimic routine acid reflux.',
      'Eradication therapy plus antioxidant-rich nutrition fosters gastric mucosal recovery.'
    ],
    practicalAction: 'Do not dismiss persistent indigestion or unexplained anemia; seek upper GI endoscopy review.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 30
  },

  // Topic 11: Genetic Risk
  {
    title: 'The Genetics Podcast – Managing Hereditary Cancer Risk',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Genetic Risk',
    focus: 'BRCA1/2, hereditary cancer syndromes, genetic testing and gene–environment interactions.',
    description: 'Leading clinical geneticists discuss multi-gene panel testing, BRCA1/2, Lynch syndrome, and personalized proactive surveillance plans.',
    url: 'https://www.youtube.com/results?search_query=The+Genetics+Podcast+Managing+Hereditary+Cancer+Risk',
    speaker: 'The Genetics Podcast & Clinical Geneticists',
    isCollection: true,
    takeaways: [
      'Hereditary cancer syndromes account for approximately 5–10% of all cancer diagnoses.',
      'Identifying mutations allows tailored screening (breast MRI, early colonoscopies).',
      'Genetic information empowers preventive lifestyle and risk-reducing decisions.'
    ],
    practicalAction: 'Map your family tree for cancer history spanning first- and second-degree relatives.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 31
  },
  {
    title: 'BRCA genes and hereditary cancer – geneticist interviews',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Genetic Risk',
    focus: 'BRCA1/2, hereditary cancer syndromes, genetic testing and gene–environment interactions.',
    description: 'In-depth guide to BRCA1 and BRCA2 DNA double-strand repair pathways, breast and ovarian vulnerability, and PARP inhibitors.',
    url: 'https://www.youtube.com/results?search_query=BRCA+genes+and+hereditary+cancer+geneticist+interviews',
    speaker: 'Medical Genetics & Surgical Oncology Panel',
    isCollection: true,
    takeaways: [
      'BRCA genes encode crucial tumor suppressor proteins responsible for homologous recombination.',
      'Mutations impair cell repair, leading to chromosomal instability.',
      'Risk-reducing surgical and pharmacological options provide immense survival advantages.'
    ],
    practicalAction: 'Consult a certified genetic counselor before and after ordering genetic panel testing.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 32
  },
  {
    title: 'Genes versus lifestyle – gene–environment interactions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Genetic Risk',
    focus: 'BRCA1/2, hereditary cancer syndromes, genetic testing and gene–environment interactions.',
    description: 'Explaining epigenetics: how environmental signals, nutrition, exercise, and metabolic health regulate gene expression without changing DNA sequence.',
    url: 'https://www.youtube.com/results?search_query=Genes+versus+lifestyle+epigenetics+gene+environment+interactions',
    speaker: 'Epigenetics & Genomic Medicine Researchers',
    isCollection: true,
    takeaways: [
      'Genes load the gun, but lifestyle and environmental exposures pull the trigger.',
      'Epigenetic methylation and histone modifications respond directly to lifestyle choices.',
      'Optimizing metabolic health provides cellular resilience even in hereditary susceptibility.'
    ],
    practicalAction: 'Focus energy on modifiable daily habits: circadian sleep, whole foods, and active movement.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 33
  },

  // ==========================================
  // REPAIR – BUILD THE DEFENCE (Topics 12 - 19)
  // ==========================================

  // Topic 12: Intermittent Fasting
  {
    title: 'The James Cancer-Free World Podcast – How Fasting Can Affect Cancer Treatment, Dr Faiza Kalam',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Intermittent Fasting',
    focus: 'Insulin, IGF-1, autophagy, metabolic switching and circadian eating.',
    description: 'Investigates how fasting-mimicking diets and time-restricted feeding modulate chemotherapy response, differential stress sensitization, and normal cell protection.',
    url: 'https://www.youtube.com/results?search_query=The+James+Cancer+Free+World+Podcast+Fasting+Dr+Faiza+Kalam',
    speaker: 'Dr. Faiza Kalam (The James Comprehensive Cancer Center)',
    isCollection: true,
    takeaways: [
      'Fasting lowers blood glucose and growth factors, stressing glucose-dependent cancer cells.',
      'Normal healthy cells shift into protected maintenance mode during nutrient depletion.',
      'Fasting protocols during active treatment must always be supervised by your treating oncologist.'
    ],
    practicalAction: 'Discuss fasting-mimicking protocols with your oncologist prior to any chemotherapy infusion.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 34
  },
  {
    title: 'Cancer as a Metabolic Disease – Dr Kristy Kessling',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Intermittent Fasting',
    focus: 'Insulin, IGF-1, autophagy, metabolic switching and circadian eating.',
    description: 'Exploration of the Warburg effect, mitochondrial fermentation versus respiration, and the metabolic targeting of malignant cells.',
    url: 'https://www.youtube.com/results?search_query=Cancer+as+a+Metabolic+Disease+Dr+Kristy+Kessling',
    speaker: 'Dr. Kristy Kessling (Metabolic Oncology Researcher)',
    isCollection: true,
    takeaways: [
      'Most malignant cells rely heavily on aerobic glycolysis and high glucose turnover.',
      'Lowering baseline hyperinsulinemia restricts proliferative hormonal signals.',
      'Mitochondrial metabolic flexibility is key to long-term cellular vitality.'
    ],
    practicalAction: 'Eliminate refined liquid sugars and high-fructose syrups from your daily dietary intake.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 35
  },
  {
    title: 'Intermittent fasting, autophagy and cellular repair – expert discussions',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Intermittent Fasting',
    focus: 'Insulin, IGF-1, autophagy, metabolic switching and circadian eating.',
    description: 'Scientific review of Yoshinori Ohsumi’s Nobel-winning discovery of autophagy: cellular recycling of damaged organelles and proteins during fasting.',
    url: 'https://www.youtube.com/results?search_query=Intermittent+fasting+autophagy+and+cellular+repair+expert+discussions',
    speaker: 'Cell Biologists & Longevity Clinicians',
    isCollection: true,
    takeaways: [
      'Autophagy clears damaged mitochondria (mitophagy) that leak toxic reactive oxygen species.',
      'Time-restricted feeding (14:10 or 16:8) aligns meal timing with natural metabolic rhythms.',
      'Fasting preserves immune stem cell regeneration upon re-feeding.'
    ],
    practicalAction: 'Aim for a gentle overnight 12 to 14-hour fast between dinner and your first meal next day.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 36
  },

  // Topic 13: Diet
  {
    title: 'Cancer Questions – Dana-Farber: Nutrition and Cancer Prevention',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Diet',
    focus: 'Dietary patterns, fibre, gut microbiome, glycaemic load and cancer prevention.',
    description: 'Dana-Farber oncological dietitians provide evidence-based guidance on colorful plant diversity, dietary fiber, and healthy fats.',
    url: 'https://www.youtube.com/results?search_query=Dana+Farber+Cancer+Questions+Nutrition+and+Cancer+Prevention',
    speaker: 'Dana-Farber Cancer Institute Oncology Dietitians',
    isCollection: true,
    takeaways: [
      'Consuming 30+ varied plant foods weekly nurtures a resilient, anti-inflammatory microbiome.',
      'Dietary fiber produces short-chain fatty acids (butyrate) that protect colon epithelium.',
      'Colorful polyphenols provide direct epigenetic protective signaling.'
    ],
    practicalAction: 'Add two servings of colorful cruciferous vegetables (broccoli, cabbage, kale) to lunch.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 37
  },
  {
    title: 'Plant-based diet, gut microbiome and cancer prevention',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Diet',
    focus: 'Dietary patterns, fibre, gut microbiome, glycaemic load and cancer prevention.',
    description: 'How gut microbial fermentation of complex carbohydrates regulates circulating immune cells, Treg functions, and systemic inflammation.',
    url: 'https://www.youtube.com/results?search_query=Plant+based+diet+gut+microbiome+and+cancer+prevention',
    speaker: 'Gastroenterologists & Nutritional Scientists',
    isCollection: true,
    takeaways: [
      'A diverse gut microbiome trains immune cells to distinguish healthy tissue from neoplastic changes.',
      'Ultra-processed foods degrade the protective intestinal mucin barrier layer.',
      'Polyphenol-rich berries, teas, and flaxseeds support beneficial bacterial taxa.'
    ],
    practicalAction: 'Incorporate 1 tablespoon of freshly ground flaxseed into soups, yogurts, or salads.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 38
  },
  {
    title: 'Nutrition, insulin and cancer metabolism',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Diet',
    focus: 'Dietary patterns, fibre, gut microbiome, glycaemic load and cancer prevention.',
    description: 'Analysis of glycemic index, postprandial glucose excursions, and hepatic de novo lipogenesis in metabolic disease prevention.',
    url: 'https://www.youtube.com/results?search_query=Nutrition+insulin+and+cancer+metabolism+discussions',
    speaker: 'Metabolic Nutrition & Endocrinology Panel',
    isCollection: true,
    takeaways: [
      'Frequent postprandial glucose surges drive continuous compensatory hyperinsulinemia.',
      'Protein pacing and healthy fats blunt glycemic volatility.',
      'Stabilizing glucose levels starves metabolically aberrant cellular pathways.'
    ],
    practicalAction: 'Follow the food order sequence: eat vegetables and fiber first, proteins second, and carbs last.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 39
  },

  // Topic 14: Antioxidants
  {
    title: 'Dana-Farber – Should I Take Supplements to Reduce Cancer Risk?',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Antioxidants',
    focus: 'Oxidative stress, reactive oxygen species, mitochondrial function and dietary antioxidants.',
    description: 'Why whole-food antioxidants outperform high-dose synthetic pill supplements, and the dangerous paradox of antioxidant-chemotherapy interactions.',
    url: 'https://www.youtube.com/results?search_query=Dana+Farber+Should+I+Take+Supplements+to+Reduce+Cancer+Risk',
    speaker: 'Dana-Farber Cancer Institute Clinical Team',
    isCollection: true,
    takeaways: [
      'High-dose isolated antioxidant pills can inadvertently shield malignant cells from apoptosis.',
      'Food matrices deliver hundreds of synergistic phytonutrients without toxicity.',
      'Synthetic megadoses of beta-carotene and vitamin E failed in randomized clinical trials.'
    ],
    practicalAction: 'Obtain antioxidants from deep-pigmented whole foods (berries, dark greens) rather than synthetic megadose pills.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 40
  },
  {
    title: 'Oxidative stress and mitochondrial health – researcher interviews',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Antioxidants',
    focus: 'Oxidative stress, reactive oxygen species, mitochondrial function and dietary antioxidants.',
    description: 'Diving into electron transport chain leaks, superoxides, and how endogenous antioxidants (glutathione, SOD, catalase) protect cellular machinery.',
    url: 'https://www.youtube.com/results?search_query=Oxidative+stress+and+mitochondrial+health+researcher+interviews',
    speaker: 'Biochemists & Mitochondrial Biologists',
    isCollection: true,
    takeaways: [
      'Endogenous antioxidant defenses require precursors: selenium, sulfur, zinc, and cysteine.',
      'Exercise and fasting induce hormesis, upregulating master antioxidant regulator Nrf2.',
      'Excessive exogenous antioxidant supplementation can blunt beneficial hormetic adaptations.'
    ],
    practicalAction: 'Consume sulfur-rich alliums (garlic, onions, leeks) to fuel internal glutathione production.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 41
  },
  {
    title: 'Antioxidants and cancer prevention – what does the evidence say?',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Antioxidants',
    focus: 'Oxidative stress, reactive oxygen species, mitochondrial function and dietary antioxidants.',
    description: 'Comprehensive review of epidemiological vs interventional trials on antioxidant nutrients in tumor biology.',
    url: 'https://www.youtube.com/results?search_query=Antioxidants+and+cancer+prevention+what+does+the+evidence+say',
    speaker: 'Evidence-Based Oncology Research Group',
    isCollection: true,
    takeaways: [
      'Observational studies reward dietary patterns rich in whole plant foods, not single extracts.',
      'Cancer cells utilize oxidative signaling adaptively; timing is everything in clinical therapy.',
      'Balanced lifestyle choices naturally optimize the body’s internal redox equilibrium.'
    ],
    practicalAction: 'Enjoy a cup of loose-leaf green tea (rich in EGCG) during mid-morning hours.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 42
  },

  // Topic 15: Exercise
  {
    title: 'Memorial Sloan Kettering – How Exercise Can Help Treat and Prevent Cancer',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Exercise',
    focus: 'Insulin sensitivity, myokines, immune modulation, inflammation and cancer prevention.',
    description: 'Memorial Sloan Kettering oncologists demonstrate how structured aerobic and resistance training reduces cancer recurrence and improves survivorship.',
    url: 'https://www.youtube.com/results?search_query=Memorial+Sloan+Kettering+How+Exercise+Can+Help+Treat+and+Prevent+Cancer',
    speaker: 'MSKCC Exercise Oncology Experts',
    isCollection: true,
    takeaways: [
      'Contracting skeletal muscle releases anti-inflammatory myokines (IL-15, SPARC).',
      'Physical exertion boosts circulation, mobilizing natural killer and cytotoxic T cells.',
      'Regular exercise lowers circulating baseline insulin, estrogen, and systemic inflammation.'
    ],
    practicalAction: 'Accumulate at least 150 minutes of moderate aerobic activity (e.g. brisk walking) weekly.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 43
  },
  {
    title: 'ASCO – Exercise as Medicine, Dr Kathryn Schmitz',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Exercise',
    focus: 'Insulin sensitivity, myokines, immune modulation, inflammation and cancer prevention.',
    description: 'Dr. Kathryn Schmitz presents the ASCO clinical exercise oncology guidelines: exercise is an essential adjuvant prescription in oncology care.',
    url: 'https://www.youtube.com/results?search_query=ASCO+Exercise+as+Medicine+Dr+Kathryn+Schmitz',
    speaker: 'Dr. Kathryn Schmitz (Past President, American College of Sports Medicine)',
    isCollection: true,
    takeaways: [
      'Resistance training preserves lean muscle mass, combatting sarcopenia and cachexia.',
      'Exercise improves chemotherapy tolerance, reduces fatigue, and boosts psychological health.',
      'Personalized dosage and progressive overload yield optimal therapeutic outcomes.'
    ],
    practicalAction: 'Incorporate progressive resistance or bodyweight strength exercises 2–3 times per week.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 44
  },
  {
    title: 'Exercise, mitochondria and metabolic health',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Exercise',
    focus: 'Insulin sensitivity, myokines, immune modulation, inflammation and cancer prevention.',
    description: 'Molecular exploration of PGC-1alpha activation, mitochondrial biogenesis, and glucose transporter (GLUT4) translocation in muscles.',
    url: 'https://www.youtube.com/results?search_query=Exercise+mitochondria+and+metabolic+health+biogenesis',
    speaker: 'Exercise Physiologists & Molecular Biologists',
    isCollection: true,
    takeaways: [
      'Zone 2 aerobic exercise stimulates the creation of healthy new mitochondria (biogenesis).',
      'Muscle contraction transports glucose into cells independently of insulin.',
      'Well-conditioned mitochondria burn fat efficiently and generate fewer damaging free radicals.'
    ],
    practicalAction: 'Add 45 minutes of steady Zone 2 cardio (conversational pace) twice weekly.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 45
  },

  // Topic 16: Stillness
  {
    title: 'Mindfulness and immune function – scientific discussions',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Stillness',
    focus: 'Meditation, mindfulness, autonomic regulation, stress reduction and inflammation.',
    description: 'How structured mindfulness-based stress reduction (MBSR) dampens nuclear factor-kappa B (NF-kB) and boosts immune cell telomerase activity.',
    url: 'https://www.youtube.com/results?search_query=Mindfulness+and+immune+function+scientific+discussions',
    speaker: 'Psychoneuroimmunologists & Clinical Psychologists',
    isCollection: true,
    takeaways: [
      'Mindfulness training reduces pro-inflammatory gene expression in white blood cells.',
      'Lowers resting amygdala hyperactivity and blunts sympathetic adrenal reactivity.',
      'Telomerase preservation protects immune cells from premature biological senescence.'
    ],
    practicalAction: 'Practice 10 minutes of silent seated mindful breathing each morning.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 46
  },
  {
    title: 'Meditation and inflammation – neuroscience experts',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Stillness',
    focus: 'Meditation, mindfulness, autonomic regulation, stress reduction and inflammation.',
    description: 'Neuroimaging insights into meditation: strengthening prefrontal cortex regulation over fear and stress centers, lowering systemic IL-6.',
    url: 'https://www.youtube.com/results?search_query=Meditation+and+inflammation+neuroscience+experts',
    speaker: 'Neuroscientists & Mind-Body Clinicians',
    isCollection: true,
    takeaways: [
      'Regular meditation practice thickens gray matter in emotional regulation networks.',
      'Decreases circulating pro-inflammatory markers and stress hormones.',
      'Calm mental states promote physical tissue repair and metabolic balance.'
    ],
    practicalAction: 'Use body-scan meditation techniques before sleep to release physical muscle tension.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 47
  },
  {
    title: 'Mind-body medicine and cancer survivorship',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Stillness',
    focus: 'Meditation, mindfulness, autonomic regulation, stress reduction and inflammation.',
    description: 'Evidence-based implementation of meditation, yoga, and guided imagery in supportive oncology to reduce neuropathy, pain, and anxiety.',
    url: 'https://www.youtube.com/results?search_query=Mind+body+medicine+and+cancer+survivorship+discussions',
    speaker: 'Integrative Oncology Specialists',
    isCollection: true,
    takeaways: [
      'Mind-body therapies provide meaningful improvements in patient-reported quality of life.',
      'Integrative supportive practices enhance compliance with conventional therapies.',
      'Inner calm fosters a neuro-chemical internal environment conducive to healing.'
    ],
    practicalAction: 'Engage in gentle restorative yoga or guided sound therapy once or twice weekly.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 48
  },

  // Topic 17: Power of Breath
  {
    title: 'Breathing exercises and the nervous system – neuroscience discussions',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Power of Breath',
    focus: 'Respiratory physiology, autonomic nervous system, vagal tone and stress regulation.',
    description: 'How altering breathing rate and depth stimulates pulmonary stretch receptors, sending inhibitory signals via the vagus nerve to calm the heart.',
    url: 'https://www.youtube.com/results?search_query=Breathing+exercises+and+the+nervous+system+neuroscience',
    speaker: 'Neurobiologists & Pulmonologists',
    isCollection: true,
    takeaways: [
      'Respiration is the only autonomic function under voluntary conscious control.',
      'Lengthening the exhale stimulates the parasympathetic "rest and repair" branch.',
      'Breathing at ~6 breaths per minute maximizes heart rate variability (HRV).'
    ],
    practicalAction: 'Practice 4-7-8 breathing (inhale 4s, hold 7s, exhale 8s) for 4 cycles to dissolve acute stress.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 49
  },
  {
    title: 'Slow breathing, heart rate variability and vagal tone',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Power of Breath',
    focus: 'Respiratory physiology, autonomic nervous system, vagal tone and stress regulation.',
    description: 'The clinical science of respiratory sinus arrhythmia, resonance frequency breathing, and strengthening vagal nerve tone for cardiovascular resilience.',
    url: 'https://www.youtube.com/results?search_query=Slow+breathing+heart+rate+variability+and+vagal+tone',
    speaker: 'Cardiovascular Physiologists & Autonomic Specialists',
    isCollection: true,
    takeaways: [
      'Higher heart rate variability correlates with autonomic flexibility and metabolic health.',
      'Coherent breathing at 5.5 to 6 breaths per minute optimizes baroreceptor sensitivity.',
      'Regular practice establishes a calm, restorative baseline physiology.'
    ],
    practicalAction: 'Perform 5 minutes of coherent breathing (5-second inhale, 5-second exhale) twice daily.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 50
  },
  {
    title: 'Pranayama and physiological health – medical research',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Power of Breath',
    focus: 'Respiratory physiology, autonomic nervous system, vagal tone and stress regulation.',
    description: 'Peer-reviewed investigations into Anulom Vilom (alternate nostril breathing), Bhramari, and diaphragmatic breathing on blood pressure and oxidative stress.',
    url: 'https://www.youtube.com/results?search_query=Pranayama+and+physiological+health+medical+research',
    speaker: 'Integrative Medicine & Yoga Researchers',
    isCollection: true,
    takeaways: [
      'Alternate nostril breathing promotes balanced autonomic hemisphere activation.',
      'Humming in Bhramari pranayama increases nasal nitric oxide production 15-fold.',
      'Nitric oxide dilates airways, improves alveolar oxygen exchange, and exerts antimicrobial action.'
    ],
    practicalAction: 'Practice 5 minutes of alternate nostril breathing before meditation or winding down for sleep.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 51
  },

  // Topic 18: Things You Love
  {
    title: 'Harvard Study of Adult Development – Happiness and relationships',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Things You Love',
    focus: 'Happiness, purpose, social connection, emotional well-being and longevity.',
    description: 'Lessons from the longest running 85-year scientific study on human health: positive relationships and social connection are the single strongest predictors of longevity.',
    url: 'https://www.youtube.com/results?search_query=Harvard+Study+of+Adult+Development+Robert+Waldinger+relationships',
    speaker: 'Dr. Robert Waldinger (Director, Harvard Study of Adult Development)',
    isCollection: true,
    takeaways: [
      'Loneliness is as biologically toxic as smoking 15 cigarettes a day.',
      'Warm, supportive relationships buffer against physical pain and chronic illness.',
      'Quality of social connections matters far more than quantity of acquaintances.'
    ],
    practicalAction: 'Reach out to one friend or loved one today to share sincere appreciation or gratitude.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 52
  },
  {
    title: 'Purpose in life, longevity and health – expert interviews',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Things You Love',
    focus: 'Happiness, purpose, social connection, emotional well-being and longevity.',
    description: 'How having a strong sense of purpose (Ikigai) down-regulates conserved transcriptional responses to adversity (CTRA) and inflammatory gene profiles.',
    url: 'https://www.youtube.com/results?search_query=Purpose+in+life+longevity+and+health+expert+interviews',
    speaker: 'Psychologists & Epidemiologists',
    isCollection: true,
    takeaways: [
      'Individuals with high purpose in life exhibit significantly reduced all-cause mortality.',
      'Purpose stimulates neuroendocrine resilience and healthy daily adherence.',
      'Meaningful hobbies and volunteering stimulate oxytocin and dopamine balance.'
    ],
    practicalAction: 'Carve out 30 minutes every week to engage in a creative or community activity you love.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 53
  },
  {
    title: 'Social connection, loneliness and physical health',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Things You Love',
    focus: 'Happiness, purpose, social connection, emotional well-being and longevity.',
    description: 'Public health analysis of social cohesion, community support circles in chronic illness recovery, and their immune-supportive physiology.',
    url: 'https://www.youtube.com/results?search_query=Social+connection+loneliness+and+physical+health+discussions',
    speaker: 'Public Health Researchers & Clinicians',
    isCollection: true,
    takeaways: [
      'Social isolation triggers evolutionary alarm signals that spike inflammatory cytokines.',
      'Belonging to a supportive group fosters emotional resilience during treatment.',
      'Shared laughter and touch release endorphins that alleviate pain perception.'
    ],
    practicalAction: 'Join a local walking group, community class, or supportive peer wellness circle.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 54
  },

  // Topic 19: Safer Products
  {
    title: 'Endocrine-disrupting chemicals and human health',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Safer Products',
    focus: 'Endocrine disruptors, BPA, phthalates, pesticide residues, household chemicals and exposure reduction.',
    description: 'How synthetic xenoestrogens (BPA, BPS, phthalates, parabens) bind and block nuclear hormone receptors at minuscule parts-per-billion concentrations.',
    url: 'https://www.youtube.com/results?search_query=Endocrine+disrupting+chemicals+and+human+health+toxicology',
    speaker: 'Environmental Endocrine Toxicologists',
    isCollection: true,
    takeaways: [
      'Endocrine disruptors alter development and hormone-sensitive tissues (breast, prostate).',
      'Thermal cash register receipts, canned food liners, and fragrances are everyday sources.',
      'Non-monotonic dose responses mean even tiny continuous exposures matter.'
    ],
    practicalAction: 'Refuse paper thermal store receipts when possible or wash hands thoroughly after handling.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 55
  },
  {
    title: 'Pesticides, household chemicals and cancer risk',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Safer Products',
    focus: 'Endocrine disruptors, BPA, phthalates, pesticide residues, household chemicals and exposure reduction.',
    description: 'Review of volatile organic compounds (VOCs) in chemical cleaning sprays, synthetic air fresheners, and non-stick cookware chemistry (PFAS).',
    url: 'https://www.youtube.com/results?search_query=Pesticides+household+chemicals+and+cancer+risk+environmental',
    speaker: 'Preventive Medicine & Environmental Health Specialists',
    isCollection: true,
    takeaways: [
      'PFAS "forever chemicals" persist in human blood and accumulate over decades.',
      'Harsh chemical aerosol sprays irritate pulmonary epithelium and mucosal barriers.',
      'Simple non-toxic alternatives (vinegar, baking soda, castile soap) are highly effective.'
    ],
    practicalAction: 'Replace synthetic air fresheners and aerosol cleaners with natural ventilation and non-toxic essentials.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 56
  },
  {
    title: 'Microplastics and everyday consumer products',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Safer Products',
    focus: 'Endocrine disruptors, BPA, phthalates, pesticide residues, household chemicals and exposure reduction.',
    description: 'Examining exposure vectors from synthetic clothing fibers, nylon tea bags, single-use plastic cups, and plastic cutting boards.',
    url: 'https://www.youtube.com/results?search_query=Microplastics+and+everyday+consumer+products+exposure',
    speaker: 'Materials Science & Public Health Panel',
    isCollection: true,
    takeaways: [
      'Plastic tea bags steeped in boiling water release billions of micro- and nano-plastics.',
      'Wooden or bamboo cutting boards prevent plastic fragment ingestion.',
      'Choosing natural fibers (cotton, wool, linen) cuts indoor synthetic dust inhalation.'
    ],
    practicalAction: 'Switch to loose-leaf tea with stainless steel strainers and use wood cutting boards.',
    targetPlatform: 'Both',
    isPaidOnly: false,
    order: 57
  }
];


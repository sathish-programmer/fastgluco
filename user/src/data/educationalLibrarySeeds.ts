export interface IEducationalLibrarySeed {
  _id?: string;
  title: string;
  category: 'DAMAGE – REDUCE THE LOAD' | 'REPAIR – BUILD THE DEFENCE' | string;
  topic: string;
  topicNumber: number;
  focus: string;
  url: string;
  order: number;
  isPaidOnly?: boolean;
}

export type IEducationalResource = IEducationalLibrarySeed;

export const MITOREBOOT_LIBRARY_RESOURCES: IEducationalLibrarySeed[] = [
  // ==========================================
  // DAMAGE – REDUCE THE LOAD (Topics 1 - 11)
  // ==========================================

  // 1. Stress
  {
    title: 'How Chronic Stress Shapes Cancer Risk and Recovery – Ground & Root Podcast',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Stress',
    topicNumber: 1,
    focus: 'Cortisol, sympathetic activation, inflammation, immune surveillance and cancer.',
    url: 'https://www.youtube.com/results?search_query=Ground+%26+Root+Podcast+Chronic+Stress+Cancer+Risk',
    order: 1
  },
  {
    title: 'Chronic stress, cortisol and cancer – expert video discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Stress',
    topicNumber: 1,
    focus: 'Cortisol, sympathetic activation, inflammation, immune surveillance and cancer.',
    url: 'https://www.youtube.com/results?search_query=Chronic+stress+cortisol+and+cancer+mechanisms',
    order: 2
  },
  {
    title: 'Stress, inflammation and the immune system – neuroscience discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Stress',
    topicNumber: 1,
    focus: 'Cortisol, sympathetic activation, inflammation, immune surveillance and cancer.',
    url: 'https://www.youtube.com/results?search_query=Stress+inflammation+and+the+immune+system+neuroscience',
    order: 3
  },

  // 2. Sleep Debt
  {
    title: 'Sleep deprivation and cancer risk – scientific discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Sleep Debt',
    topicNumber: 2,
    focus: 'Circadian rhythm, melatonin, DNA repair, immune function and night-shift work.',
    url: 'https://www.youtube.com/results?search_query=Sleep+deprivation+and+cancer+risk+scientific+discussions',
    order: 4
  },
  {
    title: 'Melatonin, sleep and cancer – expert interviews',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Sleep Debt',
    topicNumber: 2,
    focus: 'Circadian rhythm, melatonin, DNA repair, immune function and night-shift work.',
    url: 'https://www.youtube.com/results?search_query=Melatonin+sleep+and+cancer+expert+interviews',
    order: 5
  },
  {
    title: 'Night shift work and cancer risk – medical discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Sleep Debt',
    topicNumber: 2,
    focus: 'Circadian rhythm, melatonin, DNA repair, immune function and night-shift work.',
    url: 'https://www.youtube.com/results?search_query=Night+shift+work+and+cancer+risk+medical+discussions',
    order: 6
  },

  // 3. Smoking & Chewing
  {
    title: 'HCG – Dr Vishal Rao: Quit Smoking, Give Yourself a Gift of Life',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Smoking & Chewing',
    topicNumber: 3,
    focus: 'Tobacco carcinogens, DNA damage, oral cancer, lung cancer and cessation.',
    url: 'https://www.youtube.com/results?search_query=HCG+Dr+Vishal+Rao+Quit+Smoking+Give+Yourself+a+Gift+of+Life',
    order: 7
  },
  {
    title: 'Smoking, tobacco and cancer – WHO expert videos',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Smoking & Chewing',
    topicNumber: 3,
    focus: 'Tobacco carcinogens, DNA damage, oral cancer, lung cancer and cessation.',
    url: 'https://www.youtube.com/results?search_query=WHO+Smoking+tobacco+and+cancer+expert+videos',
    order: 8
  },
  {
    title: 'How tobacco causes cancer – cancer biology explained',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Smoking & Chewing',
    topicNumber: 3,
    focus: 'Tobacco carcinogens, DNA damage, oral cancer, lung cancer and cessation.',
    url: 'https://www.youtube.com/results?search_query=How+tobacco+causes+cancer+cancer+biology+explained',
    order: 9
  },

  // 4. Alcohol
  {
    title: 'Johns Hopkins – The Health Risks of Alcohol',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Alcohol',
    topicNumber: 4,
    focus: 'Acetaldehyde, oxidative stress, breast cancer, liver cancer and colorectal cancer.',
    url: 'https://www.youtube.com/results?search_query=Johns+Hopkins+The+Health+Risks+of+Alcohol',
    order: 10
  },
  {
    title: 'Johns Hopkins – Alcohol and Cancer Risk',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Alcohol',
    topicNumber: 4,
    focus: 'Acetaldehyde, oxidative stress, breast cancer, liver cancer and colorectal cancer.',
    url: 'https://www.youtube.com/results?search_query=Johns+Hopkins+Alcohol+and+Cancer+Risk',
    order: 11
  },
  {
    title: 'Should You Give Up Alcohol to Reduce Cancer Risk?',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Alcohol',
    topicNumber: 4,
    focus: 'Acetaldehyde, oxidative stress, breast cancer, liver cancer and colorectal cancer.',
    url: 'https://www.youtube.com/results?search_query=Should+You+Give+Up+Alcohol+to+Reduce+Cancer+Risk',
    order: 12
  },

  // 5. Substances
  {
    title: 'Cannabis and cancer – research discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Substances',
    topicNumber: 5,
    focus: 'Recreational drugs, substance dependence, metabolic effects and associated health risks.',
    url: 'https://www.youtube.com/results?search_query=Cannabis+and+cancer+research+discussions+oncology',
    order: 13
  },
  {
    title: 'Substance abuse and long-term health – medical experts',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Substances',
    topicNumber: 5,
    focus: 'Recreational drugs, substance dependence, metabolic effects and associated health risks.',
    url: 'https://www.youtube.com/results?search_query=Substance+abuse+and+long-term+health+medical+experts',
    order: 14
  },
  {
    title: 'Opioids, addiction and the human body – medical discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Substances',
    topicNumber: 5,
    focus: 'Recreational drugs, substance dependence, metabolic effects and associated health risks.',
    url: 'https://www.youtube.com/results?search_query=Opioids+addiction+and+the+human+body+medical+discussions',
    order: 15
  },

  // 6. Environment
  {
    title: 'NDTV – Lung Cancer Risk in Nonsmokers Explained by Dr Arvind Kumar',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Environment',
    topicNumber: 6,
    focus: 'Air pollution, pesticides, endocrine disruptors, heavy metals and microplastics.',
    url: 'https://www.youtube.com/results?search_query=NDTV+Lung+Cancer+Risk+in+Nonsmokers+Dr+Arvind+Kumar',
    order: 16
  },
  {
    title: 'Pesticides and cancer – scientific expert discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Environment',
    topicNumber: 6,
    focus: 'Air pollution, pesticides, endocrine disruptors, heavy metals and microplastics.',
    url: 'https://www.youtube.com/results?search_query=Pesticides+and+cancer+scientific+expert+discussions',
    order: 17
  },
  {
    title: 'Microplastics, endocrine disruption and human health',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Environment',
    topicNumber: 6,
    focus: 'Air pollution, pesticides, endocrine disruptors, heavy metals and microplastics.',
    url: 'https://www.youtube.com/results?search_query=Microplastics+endocrine+disruption+and+human+health',
    order: 18
  },

  // 7. Check Your Kitchen
  {
    title: 'Aflatoxin and liver cancer – scientific discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Check Your Kitchen',
    topicNumber: 7,
    focus: 'Aflatoxin, nitrosamines, acrylamide, repeatedly heated oils, processed meat and food contamination.',
    url: 'https://www.youtube.com/results?search_query=Aflatoxin+and+liver+cancer+scientific+discussions',
    order: 19
  },
  {
    title: 'Repeatedly heated cooking oil and health risks',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Check Your Kitchen',
    topicNumber: 7,
    focus: 'Aflatoxin, nitrosamines, acrylamide, repeatedly heated oils, processed meat and food contamination.',
    url: 'https://www.youtube.com/results?search_query=Repeatedly+heated+cooking+oil+and+health+risks+lipid+peroxidation',
    order: 20
  },
  {
    title: 'Food carcinogens: nitrosamines, acrylamide and processed meat',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Check Your Kitchen',
    topicNumber: 7,
    focus: 'Aflatoxin, nitrosamines, acrylamide, repeatedly heated oils, processed meat and food contamination.',
    url: 'https://www.youtube.com/results?search_query=Food+carcinogens+nitrosamines+acrylamide+and+processed+meat',
    order: 21
  },

  // 8. Obesity
  {
    title: 'The Obesity–Cancer Connection – Dr Neil Naik',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Obesity',
    topicNumber: 8,
    focus: 'Insulin resistance, adipokines, chronic inflammation, estrogen and cancer risk.',
    url: 'https://www.youtube.com/results?search_query=The+Obesity+Cancer+Connection+Dr+Neil+Naik',
    order: 22
  },
  {
    title: 'Obesity, insulin resistance and cancer – expert discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Obesity',
    topicNumber: 8,
    focus: 'Insulin resistance, adipokines, chronic inflammation, estrogen and cancer risk.',
    url: 'https://www.youtube.com/results?search_query=Obesity+insulin+resistance+and+cancer+expert+discussions',
    order: 23
  },
  {
    title: 'Fat tissue, inflammation and cancer biology',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Obesity',
    topicNumber: 8,
    focus: 'Insulin resistance, adipokines, chronic inflammation, estrogen and cancer risk.',
    url: 'https://www.youtube.com/results?search_query=Fat+tissue+inflammation+and+cancer+biology+mechanisms',
    order: 24
  },

  // 9. Dental Health
  {
    title: 'Periodontal disease and systemic inflammation',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Dental Health',
    topicNumber: 9,
    focus: 'Periodontal disease, oral microbiome, chronic inflammation and oral cancer.',
    url: 'https://www.youtube.com/results?search_query=Periodontal+disease+and+systemic+inflammation+oral+health',
    order: 25
  },
  {
    title: 'Oral microbiome and cancer – scientific discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Dental Health',
    topicNumber: 9,
    focus: 'Periodontal disease, oral microbiome, chronic inflammation and oral cancer.',
    url: 'https://www.youtube.com/results?search_query=Oral+microbiome+and+cancer+scientific+discussions',
    order: 26
  },
  {
    title: 'Gum disease and overall health – dental experts',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Dental Health',
    topicNumber: 9,
    focus: 'Periodontal disease, oral microbiome, chronic inflammation and oral cancer.',
    url: 'https://www.youtube.com/results?search_query=Gum+disease+and+overall+health+dental+experts',
    order: 27
  },

  // 10. Gastritis
  {
    title: 'The Discovery of the Bacterium Behind 5% of All Cancers – Barry Marshall',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Gastritis',
    topicNumber: 10,
    focus: 'Helicobacter pylori, chronic gastritis, intestinal metaplasia and gastric cancer.',
    url: 'https://www.youtube.com/results?search_query=Barry+Marshall+Helicobacter+pylori+discovery+Nobel+Prize',
    order: 28
  },
  {
    title: 'H. pylori and stomach cancer – gastroenterologist discussions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Gastritis',
    topicNumber: 10,
    focus: 'Helicobacter pylori, chronic gastritis, intestinal metaplasia and gastric cancer.',
    url: 'https://www.youtube.com/results?search_query=H+pylori+and+stomach+cancer+gastroenterologist+discussions',
    order: 29
  },
  {
    title: 'Chronic gastritis and the progression to gastric cancer',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Gastritis',
    topicNumber: 10,
    focus: 'Helicobacter pylori, chronic gastritis, intestinal metaplasia and gastric cancer.',
    url: 'https://www.youtube.com/results?search_query=Chronic+gastritis+and+the+progression+to+gastric+cancer',
    order: 30
  },

  // 11. Genetic Risk
  {
    title: 'The Genetics Podcast – Managing Hereditary Cancer Risk',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Genetic Risk',
    topicNumber: 11,
    focus: 'BRCA1/2, hereditary cancer syndromes, genetic testing and gene–environment interactions.',
    url: 'https://www.youtube.com/results?search_query=The+Genetics+Podcast+Managing+Hereditary+Cancer+Risk',
    order: 31
  },
  {
    title: 'BRCA genes and hereditary cancer – geneticist interviews',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Genetic Risk',
    topicNumber: 11,
    focus: 'BRCA1/2, hereditary cancer syndromes, genetic testing and gene–environment interactions.',
    url: 'https://www.youtube.com/results?search_query=BRCA+genes+and+hereditary+cancer+geneticist+interviews',
    order: 32
  },
  {
    title: 'Genes versus lifestyle – gene–environment interactions',
    category: 'DAMAGE – REDUCE THE LOAD',
    topic: 'Genetic Risk',
    topicNumber: 11,
    focus: 'BRCA1/2, hereditary cancer syndromes, genetic testing and gene–environment interactions.',
    url: 'https://www.youtube.com/results?search_query=Genes+versus+lifestyle+epigenetics+gene+environment+interactions',
    order: 33
  },

  // ==========================================
  // REPAIR – BUILD THE DEFENCE (Topics 12 - 19)
  // ==========================================

  // 12. Intermittent Fasting
  {
    title: 'The James Cancer-Free World Podcast – How Fasting Can Affect Cancer Treatment, Dr Faiza Kalam',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Intermittent Fasting',
    topicNumber: 12,
    focus: 'Insulin, IGF-1, autophagy, metabolic switching and circadian eating.',
    url: 'https://www.youtube.com/results?search_query=The+James+Cancer+Free+World+Podcast+Fasting+Dr+Faiza+Kalam',
    order: 34
  },
  {
    title: 'Cancer as a Metabolic Disease – Dr Kristy Kessling',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Intermittent Fasting',
    topicNumber: 12,
    focus: 'Insulin, IGF-1, autophagy, metabolic switching and circadian eating.',
    url: 'https://www.youtube.com/results?search_query=Cancer+as+a+Metabolic+Disease+Dr+Kristy+Kessling',
    order: 35
  },
  {
    title: 'Intermittent fasting, autophagy and cellular repair – expert discussions',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Intermittent Fasting',
    topicNumber: 12,
    focus: 'Insulin, IGF-1, autophagy, metabolic switching and circadian eating.',
    url: 'https://www.youtube.com/results?search_query=Intermittent+fasting+autophagy+and+cellular+repair+expert+discussions',
    order: 36
  },

  // 13. Diet
  {
    title: 'Cancer Questions – Dana-Farber: Nutrition and Cancer Prevention',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Diet',
    topicNumber: 13,
    focus: 'Dietary patterns, fibre, gut microbiome, glycaemic load and cancer prevention.',
    url: 'https://www.youtube.com/results?search_query=Dana+Farber+Cancer+Questions+Nutrition+and+Cancer+Prevention',
    order: 37
  },
  {
    title: 'Plant-based diet, gut microbiome and cancer prevention',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Diet',
    topicNumber: 13,
    focus: 'Dietary patterns, fibre, gut microbiome, glycaemic load and cancer prevention.',
    url: 'https://www.youtube.com/results?search_query=Plant+based+diet+gut+microbiome+and+cancer+prevention',
    order: 38
  },
  {
    title: 'Nutrition, insulin and cancer metabolism',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Diet',
    topicNumber: 13,
    focus: 'Dietary patterns, fibre, gut microbiome, glycaemic load and cancer prevention.',
    url: 'https://www.youtube.com/results?search_query=Nutrition+insulin+and+cancer+metabolism+discussions',
    order: 39
  },

  // 14. Antioxidants
  {
    title: 'Dana-Farber – Should I Take Supplements to Reduce Cancer Risk?',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Antioxidants',
    topicNumber: 14,
    focus: 'Oxidative stress, reactive oxygen species, mitochondrial function and dietary antioxidants.',
    url: 'https://www.youtube.com/results?search_query=Dana+Farber+Should+I+Take+Supplements+to+Reduce+Cancer+Risk',
    order: 40
  },
  {
    title: 'Oxidative stress and mitochondrial health – researcher interviews',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Antioxidants',
    topicNumber: 14,
    focus: 'Oxidative stress, reactive oxygen species, mitochondrial function and dietary antioxidants.',
    url: 'https://www.youtube.com/results?search_query=Oxidative+stress+and+mitochondrial+health+researcher+interviews',
    order: 41
  },
  {
    title: 'Antioxidants and cancer prevention – what does the evidence say?',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Antioxidants',
    topicNumber: 14,
    focus: 'Oxidative stress, reactive oxygen species, mitochondrial function and dietary antioxidants.',
    url: 'https://www.youtube.com/results?search_query=Antioxidants+and+cancer+prevention+what+does+the+evidence+say',
    order: 42
  },

  // 15. Exercise
  {
    title: 'Memorial Sloan Kettering – How Exercise Can Help Treat and Prevent Cancer',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Exercise',
    topicNumber: 15,
    focus: 'Insulin sensitivity, myokines, immune modulation, inflammation and cancer prevention.',
    url: 'https://www.youtube.com/results?search_query=Memorial+Sloan+Kettering+How+Exercise+Can+Help+Treat+and+Prevent+Cancer',
    order: 43
  },
  {
    title: 'ASCO – Exercise as Medicine, Dr Kathryn Schmitz',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Exercise',
    topicNumber: 15,
    focus: 'Insulin sensitivity, myokines, immune modulation, inflammation and cancer prevention.',
    url: 'https://www.youtube.com/results?search_query=ASCO+Exercise+as+Medicine+Dr+Kathryn+Schmitz',
    order: 44
  },
  {
    title: 'Exercise, mitochondria and metabolic health',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Exercise',
    topicNumber: 15,
    focus: 'Insulin sensitivity, myokines, immune modulation, inflammation and cancer prevention.',
    url: 'https://www.youtube.com/results?search_query=Exercise+mitochondria+and+metabolic+health+biogenesis',
    order: 45
  },

  // 16. Stillness
  {
    title: 'Mindfulness and immune function – scientific discussions',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Stillness',
    topicNumber: 16,
    focus: 'Meditation, mindfulness, autonomic regulation, stress reduction and inflammation.',
    url: 'https://www.youtube.com/results?search_query=Mindfulness+and+immune+function+scientific+discussions',
    order: 46
  },
  {
    title: 'Meditation and inflammation – neuroscience experts',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Stillness',
    topicNumber: 16,
    focus: 'Meditation, mindfulness, autonomic regulation, stress reduction and inflammation.',
    url: 'https://www.youtube.com/results?search_query=Meditation+and+inflammation+neuroscience+experts',
    order: 47
  },
  {
    title: 'Mind-body medicine and cancer survivorship',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Stillness',
    topicNumber: 16,
    focus: 'Meditation, mindfulness, autonomic regulation, stress reduction and inflammation.',
    url: 'https://www.youtube.com/results?search_query=Mind+body+medicine+and+cancer+survivorship+discussions',
    order: 48
  },

  // 17. Power of Breath
  {
    title: 'Breathing exercises and the nervous system – neuroscience discussions',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Power of Breath',
    topicNumber: 17,
    focus: 'Respiratory physiology, autonomic nervous system, vagal tone and stress regulation.',
    url: 'https://www.youtube.com/results?search_query=Breathing+exercises+and+the+nervous+system+neuroscience',
    order: 49
  },
  {
    title: 'Slow breathing, heart rate variability and vagal tone',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Power of Breath',
    topicNumber: 17,
    focus: 'Respiratory physiology, autonomic nervous system, vagal tone and stress regulation.',
    url: 'https://www.youtube.com/results?search_query=Slow+breathing+heart+rate+variability+and+vagal+tone',
    order: 50
  },
  {
    title: 'Pranayama and physiological health – medical research',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Power of Breath',
    topicNumber: 17,
    focus: 'Respiratory physiology, autonomic nervous system, vagal tone and stress regulation.',
    url: 'https://www.youtube.com/results?search_query=Pranayama+and+physiological+health+medical+research',
    order: 51
  },

  // 18. Things You Love
  {
    title: 'Harvard Study of Adult Development – Happiness and relationships',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Things You Love',
    topicNumber: 18,
    focus: 'Happiness, purpose, social connection, emotional well-being and longevity.',
    url: 'https://www.youtube.com/results?search_query=Harvard+Study+of+Adult+Development+Robert+Waldinger+relationships',
    order: 52
  },
  {
    title: 'Purpose in life, longevity and health – expert interviews',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Things You Love',
    topicNumber: 18,
    focus: 'Happiness, purpose, social connection, emotional well-being and longevity.',
    url: 'https://www.youtube.com/results?search_query=Purpose+in+life+longevity+and+health+expert+interviews',
    order: 53
  },
  {
    title: 'Social connection, loneliness and physical health',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Things You Love',
    topicNumber: 18,
    focus: 'Happiness, purpose, social connection, emotional well-being and longevity.',
    url: 'https://www.youtube.com/results?search_query=Social+connection+loneliness+and+physical+health+discussions',
    order: 54
  },

  // 19. Safer Products
  {
    title: 'Endocrine-disrupting chemicals and human health',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Safer Products',
    topicNumber: 19,
    focus: 'Endocrine disruptors, BPA, phthalates, pesticide residues, household chemicals and exposure reduction.',
    url: 'https://www.youtube.com/results?search_query=Endocrine+disrupting+chemicals+and+human+health+toxicology',
    order: 55
  },
  {
    title: 'Pesticides, household chemicals and cancer risk',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Safer Products',
    topicNumber: 19,
    focus: 'Endocrine disruptors, BPA, phthalates, pesticide residues, household chemicals and exposure reduction.',
    url: 'https://www.youtube.com/results?search_query=Pesticides+household+chemicals+and+cancer+risk+environmental',
    order: 56
  },
  {
    title: 'Microplastics and everyday consumer products',
    category: 'REPAIR – BUILD THE DEFENCE',
    topic: 'Safer Products',
    topicNumber: 19,
    focus: 'Endocrine disruptors, BPA, phthalates, pesticide residues, household chemicals and exposure reduction.',
    url: 'https://www.youtube.com/results?search_query=Microplastics+and+everyday+consumer+products+exposure',
    order: 57
  }
];

export const FALLBACK_EDUCATIONAL_VIDEOS = MITOREBOOT_LIBRARY_RESOURCES;


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
  {
    "title": "How Chronic Stress Shapes Cancer Risk and Recovery \u2013 Ground & Root Podcast",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Stress",
    "topicNumber": 1,
    "focus": "Cortisol, sympathetic activation, inflammation, immune surveillance and cancer.",
    "url": "https://www.buzzsprout.com/2539990/episodes/18617849-how-chronic-stress-shapes-cancer-risk-and-recovery",
    "order": 1,
    "isPaidOnly": true
  },
  {
    "title": "Chronic stress, cortisol and cancer \u2013 expert video discussions",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Stress",
    "topicNumber": 1,
    "focus": "Cortisol, sympathetic activation, inflammation, immune surveillance and cancer.",
    "url": "https://www.youtube.com/results?search_query=chronic+stress+cortisol+immune+system+cancer+research+podcast",
    "order": 2
  },
  {
    "title": "Stress, inflammation and the immune system \u2013 neuroscience discussions",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Stress",
    "topicNumber": 1,
    "focus": "Cortisol, sympathetic activation, inflammation, immune surveillance and cancer.",
    "url": "https://www.youtube.com/results?search_query=stress+inflammation+immune+system+neuroscience+podcast",
    "order": 3
  },
  {
    "title": "Sleep deprivation and cancer risk \u2013 scientific discussions",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Sleep Debt",
    "topicNumber": 2,
    "focus": "Circadian rhythm, melatonin, DNA repair, immune function and night-shift work.",
    "url": "https://www.youtube.com/results?search_query=sleep+deprivation+circadian+rhythm+cancer+risk+podcast",
    "order": 4
  },
  {
    "title": "Melatonin, sleep and cancer \u2013 expert interviews",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Sleep Debt",
    "topicNumber": 2,
    "focus": "Circadian rhythm, melatonin, DNA repair, immune function and night-shift work.",
    "url": "https://www.youtube.com/results?search_query=melatonin+sleep+cancer+oncologist+podcast",
    "order": 5
  },
  {
    "title": "Night shift work and cancer risk \u2013 medical discussions",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Sleep Debt",
    "topicNumber": 2,
    "focus": "Circadian rhythm, melatonin, DNA repair, immune function and night-shift work.",
    "url": "https://www.youtube.com/results?search_query=night+shift+work+cancer+risk+podcast",
    "order": 6
  },
  {
    "title": "HCG \u2013 Dr Vishal Rao: Quit Smoking, Give Yourself a Gift of Life",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Smoking & Chewing",
    "topicNumber": 3,
    "focus": "Tobacco carcinogens, DNA damage, oral cancer, lung cancer and cessation.",
    "url": "https://www.hcgoncology.com/podcasts/quit-smoking-give-yourself-a-gift-of-life/",
    "order": 7
  },
  {
    "title": "Smoking, tobacco and cancer \u2013 WHO expert videos",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Smoking & Chewing",
    "topicNumber": 3,
    "focus": "Tobacco carcinogens, DNA damage, oral cancer, lung cancer and cessation.",
    "url": "https://www.youtube.com/results?search_query=WHO+tobacco+chewing+oral+cancer+expert+video",
    "order": 8
  },
  {
    "title": "How tobacco causes cancer \u2013 cancer biology explained",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Smoking & Chewing",
    "topicNumber": 3,
    "focus": "Tobacco carcinogens, DNA damage, oral cancer, lung cancer and cessation.",
    "url": "https://www.youtube.com/results?search_query=how+tobacco+causes+cancer+DNA+damage+oncologist+podcast",
    "order": 9
  },
  {
    "title": "Johns Hopkins \u2013 The Health Risks of Alcohol",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Alcohol",
    "topicNumber": 4,
    "focus": "Acetaldehyde, oxidative stress, breast cancer, liver cancer and colorectal cancer.",
    "url": "https://podcast.publichealth.jhu.edu/website/977-the-health-risks-of-alcohol",
    "order": 10
  },
  {
    "title": "Johns Hopkins \u2013 Alcohol and Cancer Risk",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Alcohol",
    "topicNumber": 4,
    "focus": "Acetaldehyde, oxidative stress, breast cancer, liver cancer and colorectal cancer.",
    "url": "https://podcasts.hopkinsmedicine.org/alcohol-and-cancer-risk/",
    "order": 11
  },
  {
    "title": "Should You Give Up Alcohol to Reduce Cancer Risk?",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Alcohol",
    "topicNumber": 4,
    "focus": "Acetaldehyde, oxidative stress, breast cancer, liver cancer and colorectal cancer.",
    "url": "https://podcasts.hopkinsmedicine.org/should-you-give-up-alcohol-to-reduce-your-cancer-risk-elizabeth-tracey-reports/",
    "order": 12
  },
  {
    "title": "Cannabis and cancer \u2013 research discussions",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Substances",
    "topicNumber": 5,
    "focus": "Recreational drugs, substance dependence, metabolic effects and associated health risks.",
    "url": "https://www.youtube.com/results?search_query=cannabis+marijuana+cancer+risk+medical+research+podcast",
    "order": 13
  },
  {
    "title": "Substance abuse and long-term health \u2013 medical experts",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Substances",
    "topicNumber": 5,
    "focus": "Recreational drugs, substance dependence, metabolic effects and associated health risks.",
    "url": "https://www.youtube.com/results?search_query=substance+abuse+long+term+health+medical+expert+podcast",
    "order": 14
  },
  {
    "title": "Opioids, addiction and the human body \u2013 medical discussions",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Substances",
    "topicNumber": 5,
    "focus": "Recreational drugs, substance dependence, metabolic effects and associated health risks.",
    "url": "https://www.youtube.com/results?search_query=opioid+addiction+effects+on+body+medical+podcast",
    "order": 15
  },
  {
    "title": "NDTV \u2013 Lung Cancer Risk in Nonsmokers Explained by Dr Arvind Kumar",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Environment",
    "topicNumber": 6,
    "focus": "Air pollution, pesticides, endocrine disruptors, heavy metals and microplastics.",
    "url": "https://www.ndtv.com/podcast/ndtv-lifeline-1045/lung-cancer-risk-in-nonsmokers-explained-by-dr-arvind-kumar-ndtv-lifeline-health-actually-podcast-ep-1186996/audio",
    "order": 16
  },
  {
    "title": "Pesticides and cancer \u2013 scientific expert discussions",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Environment",
    "topicNumber": 6,
    "focus": "Air pollution, pesticides, endocrine disruptors, heavy metals and microplastics.",
    "url": "https://www.youtube.com/results?search_query=pesticides+cancer+risk+epidemiology+scientist+podcast",
    "order": 17
  },
  {
    "title": "Microplastics, endocrine disruption and human health",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Environment",
    "topicNumber": 6,
    "focus": "Air pollution, pesticides, endocrine disruptors, heavy metals and microplastics.",
    "url": "https://www.youtube.com/results?search_query=microplastics+endocrine+disruption+human+health+scientist+podcast",
    "order": 18
  },
  {
    "title": "Aflatoxin and liver cancer \u2013 scientific discussions",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Check Your Kitchen",
    "topicNumber": 7,
    "focus": "Aflatoxin, nitrosamines, acrylamide, repeatedly heated oils, processed meat and food contamination.",
    "url": "https://www.youtube.com/results?search_query=aflatoxin+liver+cancer+food+safety+expert+video",
    "order": 19
  },
  {
    "title": "Repeatedly heated cooking oil and health risks",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Check Your Kitchen",
    "topicNumber": 7,
    "focus": "Aflatoxin, nitrosamines, acrylamide, repeatedly heated oils, processed meat and food contamination.",
    "url": "https://www.youtube.com/results?search_query=repeatedly+heated+cooking+oil+toxic+compounds+research+video",
    "order": 20
  },
  {
    "title": "Food carcinogens: nitrosamines, acrylamide and processed meat",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Check Your Kitchen",
    "topicNumber": 7,
    "focus": "Aflatoxin, nitrosamines, acrylamide, repeatedly heated oils, processed meat and food contamination.",
    "url": "https://www.youtube.com/results?search_query=food+carcinogens+nitrosamines+acrylamide+processed+meat+expert",
    "order": 21
  },
  {
    "title": "The Obesity\u2013Cancer Connection \u2013 Dr Neil Naik",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Obesity",
    "topicNumber": 8,
    "focus": "Insulin resistance, adipokines, chronic inflammation, estrogen and cancer risk.",
    "url": "https://podcasts.apple.com/ca/podcast/184-the-obesity-cancer-connection-what-every-patient/id1581084278?i=1000771665035",
    "order": 22
  },
  {
    "title": "Obesity, insulin resistance and cancer \u2013 expert discussions",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Obesity",
    "topicNumber": 8,
    "focus": "Insulin resistance, adipokines, chronic inflammation, estrogen and cancer risk.",
    "url": "https://www.youtube.com/results?search_query=obesity+insulin+resistance+cancer+risk+oncologist+podcast",
    "order": 23
  },
  {
    "title": "Fat tissue, inflammation and cancer biology",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Obesity",
    "topicNumber": 8,
    "focus": "Insulin resistance, adipokines, chronic inflammation, estrogen and cancer risk.",
    "url": "https://www.youtube.com/results?search_query=adipose+tissue+inflammation+cancer+biology+researcher+podcast",
    "order": 24
  },
  {
    "title": "Periodontal disease and systemic inflammation",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Dental Health",
    "topicNumber": 9,
    "focus": "Periodontal disease, oral microbiome, chronic inflammation and oral cancer.",
    "url": "https://www.youtube.com/results?search_query=periodontal+disease+systemic+inflammation+expert+podcast",
    "order": 25
  },
  {
    "title": "Oral microbiome and cancer \u2013 scientific discussions",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Dental Health",
    "topicNumber": 9,
    "focus": "Periodontal disease, oral microbiome, chronic inflammation and oral cancer.",
    "url": "https://www.youtube.com/results?search_query=oral+microbiome+cancer+research+podcast",
    "order": 26
  },
  {
    "title": "Gum disease and overall health \u2013 dental experts",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Dental Health",
    "topicNumber": 9,
    "focus": "Periodontal disease, oral microbiome, chronic inflammation and oral cancer.",
    "url": "https://www.youtube.com/results?search_query=gum+disease+systemic+health+cardiovascular+cancer+expert",
    "order": 27
  },
  {
    "title": "The Discovery of the Bacterium Behind 5% of All Cancers \u2013 Barry Marshall",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Gastritis",
    "topicNumber": 10,
    "focus": "Helicobacter pylori, chronic gastritis, intestinal metaplasia and gastric cancer.",
    "url": "https://podcasts.apple.com/us/podcast/the-discovery-of-the-bacterium-behind-5-of/id1236553683?i=1000723635508",
    "order": 28
  },
  {
    "title": "H. pylori and stomach cancer \u2013 gastroenterologist discussions",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Gastritis",
    "topicNumber": 10,
    "focus": "Helicobacter pylori, chronic gastritis, intestinal metaplasia and gastric cancer.",
    "url": "https://www.youtube.com/results?search_query=helicobacter+pylori+gastric+cancer+gastroenterologist+podcast",
    "order": 29
  },
  {
    "title": "Chronic gastritis and the progression to gastric cancer",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Gastritis",
    "topicNumber": 10,
    "focus": "Helicobacter pylori, chronic gastritis, intestinal metaplasia and gastric cancer.",
    "url": "https://www.youtube.com/results?search_query=chronic+gastritis+intestinal+metaplasia+gastric+cancer+expert+video",
    "order": 30
  },
  {
    "title": "The Genetics Podcast \u2013 Managing Hereditary Cancer Risk",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Genetic Risk",
    "topicNumber": 11,
    "focus": "BRCA1/2, hereditary cancer syndromes, genetic testing and gene\u2013environment interactions.",
    "url": "https://podcasts.apple.com/us/podcast/the-genetics-podcast/id1462418412",
    "order": 31
  },
  {
    "title": "BRCA genes and hereditary cancer \u2013 geneticist interviews",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Genetic Risk",
    "topicNumber": 11,
    "focus": "BRCA1/2, hereditary cancer syndromes, genetic testing and gene\u2013environment interactions.",
    "url": "https://www.youtube.com/results?search_query=BRCA1+BRCA2+hereditary+cancer+geneticist+podcast",
    "order": 32
  },
  {
    "title": "Genes versus lifestyle \u2013 gene\u2013environment interactions",
    "category": "DAMAGE \u2013 REDUCE THE LOAD",
    "topic": "Genetic Risk",
    "topicNumber": 11,
    "focus": "BRCA1/2, hereditary cancer syndromes, genetic testing and gene\u2013environment interactions.",
    "url": "https://www.youtube.com/results?search_query=gene+environment+interaction+cancer+prevention+scientist+podcast",
    "order": 33
  },
  {
    "title": "The James Cancer-Free World Podcast \u2013 How Fasting Can Affect Cancer Treatment, Dr Faiza Kalam",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Intermittent Fasting",
    "topicNumber": 12,
    "focus": "Insulin, IGF-1, autophagy, metabolic switching and circadian eating.",
    "url": "https://podcasts.apple.com/us/podcast/episode-199-how-fasting-can-affect-cancer-treatment/id1388527079?i=1000736454070",
    "order": 34
  },
  {
    "title": "Cancer as a Metabolic Disease \u2013 Dr Kristy Kessling",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Intermittent Fasting",
    "topicNumber": 12,
    "focus": "Insulin, IGF-1, autophagy, metabolic switching and circadian eating.",
    "url": "https://podcasts.apple.com/us/podcast/cancer-as-a-metabolic-disease-insulin-keto/id1720997321?i=1000752960832",
    "order": 35
  },
  {
    "title": "Intermittent fasting, autophagy and cellular repair \u2013 expert discussions",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Intermittent Fasting",
    "topicNumber": 12,
    "focus": "Insulin, IGF-1, autophagy, metabolic switching and circadian eating.",
    "url": "https://www.youtube.com/results?search_query=intermittent+fasting+autophagy+cellular+repair+scientist+podcast",
    "order": 36
  },
  {
    "title": "Cancer Questions \u2013 Dana-Farber: Nutrition and Cancer Prevention",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Diet",
    "topicNumber": 13,
    "focus": "Dietary patterns, fibre, gut microbiome, glycaemic load and cancer prevention.",
    "url": "https://www.dana-farber.org/newsroom/cancer-questions-podcast",
    "order": 37
  },
  {
    "title": "Plant-based diet, gut microbiome and cancer prevention",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Diet",
    "topicNumber": 13,
    "focus": "Dietary patterns, fibre, gut microbiome, glycaemic load and cancer prevention.",
    "url": "https://www.youtube.com/results?search_query=plant+based+diet+gut+microbiome+cancer+prevention+scientist+podcast",
    "order": 38
  },
  {
    "title": "Nutrition, insulin and cancer metabolism",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Diet",
    "topicNumber": 13,
    "focus": "Dietary patterns, fibre, gut microbiome, glycaemic load and cancer prevention.",
    "url": "https://www.youtube.com/results?search_query=nutrition+insulin+glucose+cancer+metabolism+oncologist+podcast",
    "order": 39
  },
  {
    "title": "Dana-Farber \u2013 Should I Take Supplements to Reduce Cancer Risk?",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Antioxidants",
    "topicNumber": 14,
    "focus": "Oxidative stress, reactive oxygen species, mitochondrial function and dietary antioxidants.",
    "url": "https://www.dana-farber.org/newsroom/cancer-questions-podcast",
    "order": 40
  },
  {
    "title": "Oxidative stress and mitochondrial health \u2013 researcher interviews",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Antioxidants",
    "topicNumber": 14,
    "focus": "Oxidative stress, reactive oxygen species, mitochondrial function and dietary antioxidants.",
    "url": "https://www.youtube.com/results?search_query=oxidative+stress+mitochondria+antioxidants+scientist+podcast",
    "order": 41
  },
  {
    "title": "Antioxidants and cancer prevention \u2013 what does the evidence say?",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Antioxidants",
    "topicNumber": 14,
    "focus": "Oxidative stress, reactive oxygen species, mitochondrial function and dietary antioxidants.",
    "url": "https://www.youtube.com/results?search_query=antioxidants+cancer+prevention+evidence+oncologist+podcast",
    "order": 42
  },
  {
    "title": "Memorial Sloan Kettering \u2013 How Exercise Can Help Treat and Prevent Cancer",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Exercise",
    "topicNumber": 15,
    "focus": "Insulin sensitivity, myokines, immune modulation, inflammation and cancer prevention.",
    "url": "https://www.mskcc.org/podcasts/cancer-straight-talk/how-exercise-can-help-treat-and-prevent-cancer",
    "order": 43
  },
  {
    "title": "ASCO \u2013 Exercise as Medicine, Dr Kathryn Schmitz",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Exercise",
    "topicNumber": 15,
    "focus": "Insulin sensitivity, myokines, immune modulation, inflammation and cancer prevention.",
    "url": "https://ascopubs.org/do/exercise-medicine-strategies-integrating-exercise-into-cancer-care",
    "order": 44
  },
  {
    "title": "Exercise, mitochondria and metabolic health",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Exercise",
    "topicNumber": 15,
    "focus": "Insulin sensitivity, myokines, immune modulation, inflammation and cancer prevention.",
    "url": "https://www.youtube.com/results?search_query=exercise+mitochondria+metabolic+health+exercise+physiologist+podcast",
    "order": 45
  },
  {
    "title": "Mindfulness and immune function \u2013 scientific discussions",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Stillness",
    "topicNumber": 16,
    "focus": "Meditation, mindfulness, autonomic regulation, stress reduction and inflammation.",
    "url": "https://www.youtube.com/results?search_query=mindfulness+meditation+immune+function+scientific+research+podcast",
    "order": 46
  },
  {
    "title": "Meditation and inflammation \u2013 neuroscience experts",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Stillness",
    "topicNumber": 16,
    "focus": "Meditation, mindfulness, autonomic regulation, stress reduction and inflammation.",
    "url": "https://www.youtube.com/results?search_query=meditation+inflammation+neuroscience+researcher+podcast",
    "order": 47
  },
  {
    "title": "Mind-body medicine and cancer survivorship",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Stillness",
    "topicNumber": 16,
    "focus": "Meditation, mindfulness, autonomic regulation, stress reduction and inflammation.",
    "url": "https://www.youtube.com/results?search_query=mind+body+medicine+cancer+survivorship+oncologist+podcast",
    "order": 48
  },
  {
    "title": "Breathing exercises and the nervous system \u2013 neuroscience discussions",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Power of Breath",
    "topicNumber": 17,
    "focus": "Respiratory physiology, autonomic nervous system, vagal tone and stress regulation.",
    "url": "https://www.youtube.com/results?search_query=breathing+exercises+autonomic+nervous+system+neuroscience+podcast",
    "order": 49
  },
  {
    "title": "Slow breathing, heart rate variability and vagal tone",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Power of Breath",
    "topicNumber": 17,
    "focus": "Respiratory physiology, autonomic nervous system, vagal tone and stress regulation.",
    "url": "https://www.youtube.com/results?search_query=slow+breathing+HRV+vagal+tone+research+podcast",
    "order": 50
  },
  {
    "title": "Pranayama and physiological health \u2013 medical research",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Power of Breath",
    "topicNumber": 17,
    "focus": "Respiratory physiology, autonomic nervous system, vagal tone and stress regulation.",
    "url": "https://www.youtube.com/results?search_query=pranayama+physiological+health+clinical+research+podcast",
    "order": 51
  },
  {
    "title": "Harvard Study of Adult Development \u2013 Happiness and relationships",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Things You Love",
    "topicNumber": 18,
    "focus": "Happiness, purpose, social connection, emotional well-being and longevity.",
    "url": "https://www.youtube.com/results?search_query=Harvard+study+adult+development+relationships+happiness+podcast",
    "order": 52
  },
  {
    "title": "Purpose in life, longevity and health \u2013 expert interviews",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Things You Love",
    "topicNumber": 18,
    "focus": "Happiness, purpose, social connection, emotional well-being and longevity.",
    "url": "https://www.youtube.com/results?search_query=purpose+in+life+longevity+health+researcher+podcast",
    "order": 53
  },
  {
    "title": "Social connection, loneliness and physical health",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Things You Love",
    "topicNumber": 18,
    "focus": "Happiness, purpose, social connection, emotional well-being and longevity.",
    "url": "https://www.youtube.com/results?search_query=social+connection+loneliness+physical+health+scientific+podcast",
    "order": 54
  },
  {
    "title": "Endocrine-disrupting chemicals and human health",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Safer Products",
    "topicNumber": 19,
    "focus": "Endocrine disruptors, BPA, phthalates, pesticide residues, household chemicals and exposure reduction.",
    "url": "https://www.youtube.com/results?search_query=endocrine+disrupting+chemicals+BPA+phthalates+scientist+podcast",
    "order": 55
  },
  {
    "title": "Pesticides, household chemicals and cancer risk",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Safer Products",
    "topicNumber": 19,
    "focus": "Endocrine disruptors, BPA, phthalates, pesticide residues, household chemicals and exposure reduction.",
    "url": "https://www.youtube.com/results?search_query=pesticide+exposure+household+chemicals+cancer+research+podcast",
    "order": 56
  },
  {
    "title": "Microplastics and everyday consumer products",
    "category": "REPAIR \u2013 BUILD THE DEFENCE",
    "topic": "Safer Products",
    "topicNumber": 19,
    "focus": "Endocrine disruptors, BPA, phthalates, pesticide residues, household chemicals and exposure reduction.",
    "url": "https://www.youtube.com/results?search_query=microplastics+everyday+products+human+health+expert+podcast",
    "order": 57
  }
];

export const FALLBACK_EDUCATIONAL_VIDEOS = MITOREBOOT_LIBRARY_RESOURCES;

import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { CoachingSession } from '../models/CoachingSession';
import { FoodLog } from '../models/FoodLog';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';

/**
 * Backfills foodName for sessions that don't have it stored.
 * Uses the native MongoDB collection to bypass the soft-delete pre-find hook.
 */
async function backfillFoodNames(sessions: any[]): Promise<any[]> {
  const result = [];
  for (const session of sessions) {
    const plain = session.toObject ? session.toObject() : { ...session };

    // If foodName already set, nothing to do
    if (plain.foodName) {
      result.push(plain);
      continue;
    }

    // Try to get the food name from the populated foodLogId
    const populatedName = plain.foodLogId?.name;
    if (populatedName) {
      plain.foodName = populatedName;
      // Persist so future fetches don't need this lookup
      await CoachingSession.updateOne({ _id: plain._id }, { $set: { foodName: populatedName } });
      result.push(plain);
      continue;
    }

    // foodLogId populate returned null (food log soft-deleted) — use native driver to bypass middleware
    if (session.foodLogId || plain.foodLogId) {
      const rawFoodLogId = plain.foodLogId?._id || plain.foodLogId;
      if (rawFoodLogId) {
        try {
          const raw = await FoodLog.collection.findOne(
            { _id: rawFoodLogId },
            { projection: { name: 1 } }
          );
          if (raw?.name) {
            plain.foodName = raw.name;
            // Persist backfilled name
            await CoachingSession.updateOne({ _id: plain._id }, { $set: { foodName: raw.name } });
          }
        } catch (_) {
          // ignore lookup error
        }
      }
    }

    result.push(plain);
  }
  return result;
}

import { normalizeLang, SupportedLang } from './aiChatController';

export class CoachingController {
  /**
   * Get all coaching sessions for a user
   */
  public static async getSessions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const sessions = await CoachingSession.find({ userId })
        .populate('foodLogId', 'name loggedAt')
        .sort({ createdAt: -1 });

      const enriched = await backfillFoodNames(sessions);
      return res.status(200).json(enriched);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching coaching sessions.' });
    }
  }

  /**
   * Get all coaching sessions for a user (Admin View)
   */
  public static async getSessionsForUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const sessions = await CoachingSession.find({ userId })
        .populate('foodLogId', 'name loggedAt')
        .sort({ createdAt: -1 });

      const enriched = await backfillFoodNames(sessions);
      return res.status(200).json(enriched);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching coaching sessions for user.' });
    }
  }

  /**
   * Reply to a coaching session
   */
  public static async replyToSession(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { content, language } = req.body;
      const normLang: SupportedLang = normalizeLang(language);

      if (!content) {
        return res.status(400).json({ message: 'Reply content is required.' });
      }

      const session = await CoachingSession.findOne({ _id: id, userId });
      if (!session) {
        return res.status(404).json({ message: 'Coaching session not found.' });
      }

      if (session.status === 'resolved') {
        return res.status(400).json({ message: 'This coaching session is already resolved.' });
      }

      // Add user reply
      session.messages.push({
        role: 'user',
        content,
        createdAt: new Date()
      });

      // Get associated food log info for hyper-personalization
      let foodData: any = null;
      if (session.foodLogId) {
        try {
          foodData = await FoodLog.findById(session.foodLogId);
          if (!foodData) {
            foodData = await FoodLog.collection.findOne({ _id: session.foodLogId });
          }
        } catch (_) {}
      }

      const foodName = foodData?.name || session.foodName || 'this meal';
      const quantity = foodData?.quantity ?? 1;
      const carbs = Math.round((foodData?.carbs ?? 0) * quantity);
      const protein = Math.round((foodData?.protein ?? 0) * quantity);
      const fiber = Math.round((foodData?.fiber ?? 0) * quantity);
      const peakGlucose = session.peakGlucose;

      const config = await PaymentGatewayConfig.findOne();
      const aiQuestions = config?.aiQuestions && config.aiQuestions.length > 0
        ? config.aiQuestions
        : ["You recently logged a food that spiked your glucose. Why did you consume this when it's advised to avoid it?", "Did you take a walk afterwards?"];

      const nextIndex = session.currentQuestionIndex + 1;

      if (nextIndex < aiQuestions.length) {
        const activityKeywords = ['walk', 'run', 'gym', 'workout', 'steps', 'active', 'exercise', 'moved', 'moving', 'cardio', 'cycling', 'stairs', 'stretch', 'நட', 'நடை', 'ஓட்டம்', 'ನಡೆ', 'ನಡಿಗೆ', 'टहल', 'कसरत', 'నడక', 'వ్యాయామం'];
        const stressKeywords = ['stress', 'anxious', 'sleep', 'tired', 'worry', 'work', 'deadline', 'busy', 'exhausted', 'restless', 'அழுத்தம்', 'தூக்கம்', 'ಸೋರ್ವು', 'ಒತ್ತಡ', 'ತೀವ್ರ', 'तनाव', 'थकान', 'चिंता', 'ఒత్తిడి', 'నిద్ర', 'అలసట'];
        const hungerKeywords = ['hungry', 'starving', 'empty', 'fast', 'craving', 'sweet', 'skip', 'sugar', 'habit', 'பசி', 'உண்ணாநோன்பு', 'ಹಸಿವು', 'ಉಪವಾಸ', 'भूख', 'उपवास', 'ఆకలి', 'ఉపవాసం'];
        const sequenceKeywords = ['first', 'order', 'before', 'vegetable', 'salad', 'protein', 'sequence', 'carb', 'காய்கறி', 'சாலட்', 'ಮೊದಲು', 'ಸಲಾಡ್', 'पहले', 'सलाद', 'ముందు', 'సలాడ్'];

        const text = content.toLowerCase();
        const hasActivity = activityKeywords.some(kw => text.includes(kw));
        const hasStress = stressKeywords.some(kw => text.includes(kw));
        const hasHunger = hungerKeywords.some(kw => text.includes(kw));
        const hasSequence = sequenceKeywords.some(kw => text.includes(kw));

        // 1. Analyze Food Macros in 5 Languages
        let macroAdvice = '';
        if (normLang === 'ta') {
          macroAdvice = carbs > 40
            ? `உங்கள் **${foodName}** அதிக கார்போஹைட்ரேட்டுகளைக் (${carbs}g) கொண்டுள்ளது, இது விரைவாக குளுக்கோஸாக மாறுகிறது.${fiber < 4 ? ` குறைந்த நார்ச்சத்தினால் (${fiber}g) உறிஞ்சுதல் வேகம் அதிகரித்து ஸ்பைக் ஏற்படுகிறது.` : ` ${fiber}g நார்ச்சத்து இருந்தபோதும் கிளைசெமிக் சுமை அதிகமாக இருந்தது.`}`
            : `**${foodName}** மிதமான கார்போஹைட்ரேட்டுகளைக் (${carbs}g) கொண்டிருந்தாலும், இன்சுலின் உணர்திறன் அல்லது பிற காரணிகள் குளுக்கோஸ் உயர்வை அதிகரித்திருக்கலாம்.`;
        } else if (normLang === 'kn') {
          macroAdvice = carbs > 40
            ? `ನಿಮ್ಮ **${foodName}** ಅಧಿಕ ಕಾರ್ಬೋಹೈಡ್ರೇಟ್‌ಗಳನ್ನು (${carbs}g) ಹೊಂದಿದೆ, ಇದು ವೇಗವಾಗಿ ಗ್ಲೂಕೋಸ್ ಆಗಿ ವಿಭಜನೆಯಾಗುತ್ತದೆ.${fiber < 4 ? ` ಕಡಿಮೆ ನಾರಿನಂಶದಿಂದಾಗಿ (${fiber}g) ಗ್ಲೂಕೋಸ್ ಹೀರಿಕೊಳ್ಳುವಿಕೆ ವೇಗವಾಗಿ ಸ್ಪೈಕ್ ಉಂಟಾಗುತ್ತದೆ.` : ` ${fiber}g ನಾರಿನಂಶವಿದ್ದರೂ ಒಟ್ಟಾರೆ ಗ್ಲೈಸೆಮಿಕ್ ಲೋಡ್ ಅಧಿಕವಾಗಿತ್ತು.`}`
            : `**${foodName}** ಮಧ್ಯಮ ಕಾರ್ಬೋಹೈಡ್ರೇಟ್ (${carbs}g) ಹೊಂದಿದ್ದರೂ, ಇನ್ಸುಲಿನ್ ಸೂಕ್ಷ್ಮತೆ ಅಥವಾ ಇತರ ಅಂಶಗಳು ಗ್ಲೂಕೋಸ್ ಸ್ಪೈಕ್ ಅನ್ನು ಹೆಚ್ಚಿಸಿರಬಹುದು.`;
        } else if (normLang === 'hi') {
          macroAdvice = carbs > 40
            ? `आपके **${foodName}** में कार्बोहाइड्रेट की मात्रा अधिक थी (${carbs}g), जो तेजी से ग्लूकोज में बदल जाता है।${fiber < 4 ? ` कम फाइबर (${fiber}g) के कारण अवशोषण धीमा नहीं हो सका, जिससे स्पाइक आया।` : ` हालांकि इसमें ${fiber}g फाइबर था, लेकिन कुल ग्लाइसेमिक लोड अधिक था।`}`
            : `यद्यपि **${foodName}** में मध्यम कार्ब्स (${carbs}g) थे, फिर भी इंसुलिन संवेदनशीलता या अन्य कारणों से ग्लूकोज बढ़ा।`;
        } else if (normLang === 'te') {
          macroAdvice = carbs > 40
            ? `మీ **${foodName}** అధిక కార్బోహైడ్రేట్లను (${carbs}g) కలిగి ఉంది, ఇది వేగంగా గ్లూకోజ్‌గా మారుతుంది.${fiber < 4 ? ` తక్కువ పీచు పదార్థం (${fiber}g) ఉండటం వల్ల శోషణ వేగవంతమై షుగర్ లెవెల్స్ పెరిగాయి.` : ` ${fiber}g పీచు ఉన్నప్పటికీ మొత్తం గ్లైసెమిక్ లోడ్ ఎక్కువగా ఉంది.`}`
            : `**${foodName}** మితమైన కార్బోహైడ్రేట్లు (${carbs}g) కలిగి ఉన్నప్పటికీ, ఇన్సులిన్ సున్నితత్వ మార్పుల వల్ల గ్లూకోజ్ పెరిగి ఉండవచ్చు.`;
        } else {
          macroAdvice = carbs > 40
            ? `Your **${foodName}** was high in carbohydrates (${carbs}g carbs), which breaks down rapidly into glucose.${fiber < 4 ? ` Since it had low fiber (${fiber}g), there was no physical barrier to slow down absorption, leading to a steep rise.` : ` Although it had ${fiber}g fiber, the overall glycemic load was high enough to spike your levels.`}`
            : `Even though **${foodName}** had moderate carbs (${carbs}g), other metabolic factors or insulin sensitivity levels might have amplified the glucose response.`;
        }

        // 2. Contextual Analysis in 5 Languages
        let contextAnalysis = '';
        const detectedContexts: string[] = [];

        if (hasActivity) {
          detectedContexts.push('activity');
          if (normLang === 'ta') contextAnalysis += `🏃 **உடற்பயிற்சி தாக்கம்**: நீங்கள் சுறுசுறுப்பாக நடந்தீர்கள் என்பது சிறப்பு! நடைப்பயிற்சி தசைகளில் GLUT4 ஏற்பிகளை இயக்கி குளுக்கோஸை எரிக்க உதவுகிறது.`;
          else if (normLang === 'kn') contextAnalysis += `🏃 **ಚಲನೆಯ ಪ್ರಭಾವ**: ನೀವು ಸಕ್ರಿಯವಾಗಿ ನಡೆದಿರುವುದು ಅತ್ಯುತ್ತಮ! ನಡಿಗೆಯು ಸ್ನಾಯುಗಳಲ್ಲಿ GLUT4 ರಿಸೆಪ್ಟರ್‌ಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ ರಕ್ತದಿಂದ ಗ್ಲೂಕೋಸ್ ತೆರವುಗೊಳಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.`;
          else if (normLang === 'hi') contextAnalysis += `🏃 **शारीरिक गतिविधि प्रभाव**: आपने टहलने या सक्रिय रहने की बात कही, यह बहुत बढ़िया है! हल्की गतिविधि मांसपेशियों में GLUT4 रिसेप्टर्स को सक्रिय करती है।`;
          else if (normLang === 'te') contextAnalysis += `🏃 **వ్యాయామ ప్రభావం**: మీరు చురుకుగా నడిచారని చెప్పడం చాలా మంచిది! నడక కండరాలలో GLUT4 గ్రాహకాలను సక్రియం చేసి గ్లూకోజ్‌ను కరిగిస్తుంది.`;
          else contextAnalysis += `🏃 **Movement Impact**: You mentioned being active or walking! Light activity activates GLUT4 receptors in muscle, clearing glucose without needing extra insulin.`;
        } else {
          if (normLang === 'ta') contextAnalysis += `🛋️ **உடற்பயிற்சி தாக்கம்**: உணவுக்குப் பின் நடைப்பயிற்சி இல்லாததால் குளுக்கோஸ் இரத்தத்தில் நீடித்தது. உணவுக்குப் பின் 10-15 நிமிட நடைப்பயிற்சி குளுக்கோஸ் உச்சத்தை 30% வரை குறைக்கும்.`;
          else if (normLang === 'kn') contextAnalysis += `🛋️ **ಚಲನೆಯ ಪ್ರಭಾವ**: ಊಟದ ನಂತರ ಯಾವುದೇ ಚಟುವಟಿಕೆ ಇಲ್ಲದಿದ್ದರಿಂದ ಗ್ಲೂಕೋಸ್ ರಕ್ತದಲ್ಲಿ ಉಳಿಯಿತು. ಊಟದ ನಂತರ 10-15 ನಿಮಿಷಗಳ ಲಘು ನಡಿಗೆ ಗ್ಲೂಕೋಸ್ ಸ್ಪೈಕ್ ಅನ್ನು 30% ರಷ್ಟು ತಗ್ಗಿಸುತ್ತದೆ.`;
          else if (normLang === 'hi') contextAnalysis += `🛋️ **शारीरिक गतिविधि प्रभाव**: भोजन के बाद कोई गतिविधि न होने से ग्लूकोज रक्त में बना रहा। 10-15 मिनट की वॉक स्पाइक को 30% तक कम कर सकती है।`;
          else if (normLang === 'te') contextAnalysis += `🛋️ **వ్యాయామ ప్రభావం**: భోజనం తర్వాత ఎలాంటి నడక లేకపోవడం వల్ల గ్లూకోజ్ రక్తంలోనే ఉండిపోయింది. 10-15 నిమిషాల నడక షుగర్ స్పైక్‌ను 30% వరకు తగ్గిస్తుంది.`;
          else contextAnalysis += `🛋️ **Movement Impact**: Since there was no post-meal activity, glucose remained in circulation longer. A simple 10-15 min light walk shaves up to 30% off your peak.`;
        }

        if (hasStress) {
          detectedContexts.push('stress');
          if (normLang === 'ta') contextAnalysis += `\n\n🧠 **மன அழுத்தம்/தூக்கக் காரணி**: கார்டிசோல் ஹார்மோன் இன்சுலினை எதிர்த்து கல்லீரலில் இருந்து சேமிக்கப்பட்ட சர்க்கரையை வெளியிடுகிறது.`;
          else if (normLang === 'kn') contextAnalysis += `\n\n🧠 **ಒತ್ತಡ/ನಿದ್ರೆಯ ಅಂಶ**: ಕಾರ್ಟಿಸೋಲ್ ಹಾರ್ಮೋನ್ ಇನ್ಸುಲಿನ್ ವಿರೋಧಿಯಾಗಿ ಕೆಲಸ ಮಾಡಿ ಯಕೃತ್ತಿನಿಂದ ಗ್ಲೂಕೋಸ್ ಬಿಡುಗಡೆ ಮಾಡುತ್ತದೆ.`;
          else if (normLang === 'hi') contextAnalysis += `\n\n🧠 **तनाव/नींद कारक**: कोर्टिसोल हार्मोन इंसुलिन के असर को घटाकर लिवर से अतिरिक्त शुगर छोड़ता है।`;
          else if (normLang === 'te') contextAnalysis += `\n\n🧠 **ఒత్తిడి/నిద్ర కారకం**: కార్టిసాల్ హార్మోన్ ఇన్సులిన్ చర్యను నిరోధించి కాలేయం నుండి అదనపు షుగర్‌ను విడుదల చేస్తుంది.`;
          else contextAnalysis += `\n\n🧠 **Stress/Sleep Factor**: Cortisol triggers the liver to release stored glycogen as glucose, compounding your spike.`;
        }

        // 3. Substitution Tip
        let substitutionTip = '';
        const foodLower = foodName.toLowerCase();
        const isRice = foodLower.includes('rice') || foodLower.includes('biryani') || foodLower.includes('அரிசி') || foodLower.includes('ಅನ್ನ') || foodLower.includes('चावल') || foodLower.includes('రైస్');
        const isRoti = foodLower.includes('roti') || foodLower.includes('bread') || foodLower.includes('chappati') || foodLower.includes('ரொட்டி') || foodLower.includes('ರೊಟ್ಟಿ') || foodLower.includes('रोटी');

        if (isRice) {
          if (normLang === 'ta') substitutionTip = `💡 **உணவு மாற்று**: வெள்ளை அரிசி குளுக்கோஸை ${peakGlucose} mg/dL வரை உயர்த்துகிறது. அடுத்த முறை **பிரவுன் பாசுமதி அரிசி** அல்லது **காலிஃபிளவர் ரைஸ்** முயற்சிக்கவும், அல்லது காய்கறி நார்ச்சத்தை அதிகரிக்கவும்.`;
          else if (normLang === 'kn') substitutionTip = `💡 **ಆಹಾರ ಪರ್ಯಾಯ**: ಬಿಳಿ ಅನ್ನವು ನಿಮ್ಮ ಗ್ಲೂಕೋಸ್ ಅನ್ನು ${peakGlucose} mg/dL ಗೆ ಹೆಚ್ಚಿಸುತ್ತದೆ. ಮುಂದಿನ ಬಾರಿ **ಬ್ರೌನ್ ಬಾಸ್ಮತಿ ರೈಸ್** ಅಥವಾ **ಕಾಲಿಫ್ಲವರ್ ರೈಸ್** ಬಳಸಿ.`;
          else if (normLang === 'hi') substitutionTip = `💡 **आहार विकल्प**: सफेद चावल से आपका ग्लूकोज ${peakGlucose} mg/dL तक पहुंच गया। अगली बार **ब्राउन बासमती राइस** या **कॉलीफ्लावर राइस** चुनें।`;
          else if (normLang === 'te') substitutionTip = `💡 **ఆహార ప్రత్యామ్నాయం**: తెల్లటి అన్నం మీ గ్లూకోజ్‌ను ${peakGlucose} mg/dL కు పెంచింది. తదుపరిసారి **బ్రౌన్ బాస్మతి రైస్** లేదా **కాలీఫ్లవర్ రైస్** ప్రయత్నించండి.`;
          else substitutionTip = `💡 **Meal Substitution**: White rice spikes your glucose to ${peakGlucose} mg/dL. Try substituting with **Brown Basmati Rice** or **Cauliflower Rice** next time.`;
        } else if (isRoti) {
          if (normLang === 'ta') substitutionTip = `💡 **உணவு மாற்று**: மைதா ரொட்டி குளுக்கோஸை விரைவாக ஏற்றும். அதற்குப் பதிலாக **பாதாம் மாவு ரொட்டி** அல்லது **தேங்காய் மாவு ரொட்டி** தேர்வு செய்யவும்.`;
          else if (normLang === 'kn') substitutionTip = `💡 **ಆಹಾರ ಪರ್ಯಾಯ**: ಮೈದಾ ರೊಟ್ಟಿಯು ಗ್ಲೂಕೋಸ್ ಅನ್ನು ವೇಗವಾಗಿ ಹೆಚ್ಚಿಸುತ್ತದೆ. ಬದಲು **ಬಾದಾಮಿ ಹಿಟ್ಟಿನ ರೊಟ್ಟಿ** ಅಥವಾ **ತೆಂಗಿನ ಹಿಟ್ಟಿನ ರೊಟ್ಟಿ** ಬಳಸಿ.`;
          else if (normLang === 'hi') substitutionTip = `💡 **आहार विकल्प**: मैदे की रोटी से ग्लूकोज तेजी से बढ़ता है। इसके बजाय **बादाम के आटे की रोटी** या साबुत अनाज चुनें।`;
          else if (normLang === 'te') substitutionTip = `💡 **ఆహార ప్రత్యామ్నాయం**: మైదా పిండి రొట్టె గ్లూకోజ్‌ను త్వరగా పెంచుతుంది. బదులుగా **బాదం పిండి రొట్టె** ప్రయత్నించండి.`;
          else substitutionTip = `💡 **Meal Substitution**: Refined flour bread/roti spikes your glucose rapidly. Try swapping it with **Almond Flour Roti** next time.`;
        }

        // 4. Proposed Experiment
        let experimentOption = '';
        if (normLang === 'ta') {
          experimentOption = detectedContexts.includes('activity')
            ? `நீங்கள் ஏற்கனவே சுறுசுறுப்பாக இருப்பதால், **பயிற்சி A (நார்ச்சத்து முதலில்)**: மாவுச்சத்துக்கு முன் சாலட் அல்லது பச்சை காய்கறிகளை உண்ணுங்கள்.`
            : `அடுத்த முறை உயர் கார்ப் உணவுக்குப் பிறகு 10 நிமிட **குளுக்கோஸ் நடைப்பயிற்சி** செய்ய உறுதி கொள்வோமா?`;
        } else if (normLang === 'kn') {
          experimentOption = detectedContexts.includes('activity')
            ? `ನೀವು ಈಗಾಗಲೇ ಸಕ್ರಿಯವಾಗಿರುವುದರಿಂದ, **ಪ್ರಯೋಗ A (ನಾರಿನಂಶ ಮೊದಲು)**: ಕಾರ್ಬೋಹೈಡ್ರೇಟ್‌ಗೆ ಮೊದಲು ಸಲಾಡ್ ಸೇವಿಸಿ.`
            : `ಮುಂದಿನ ಬಾರಿ ಊಟದ ನಂತರ 10 ನಿಮಿಷಗಳ **ಗ್ಲೂಕೋಸ್ ನಡಿಗೆ** ಮಾಡಲು ನೀವು ಸಿದ್ಧರಿದ್ದೀರಾ?`;
        } else if (normLang === 'hi') {
          experimentOption = detectedContexts.includes('activity')
            ? `चूँकि आप पहले से सक्रिय हैं, आइए **प्रयोग A (फाइबर पहले)** आजमाएं: कार्ब्स से पहले सलाद खाएं।`
            : `आइए **प्रयोग B (ग्लूकोज वॉक)** अपनाएं: क्या आप अगले भोजन के बाद 10 मिनट टहल सकते हैं?`;
        } else if (normLang === 'te') {
          experimentOption = detectedContexts.includes('activity')
            ? `మీరు ఇప్పటికే చురుకుగా ఉన్నారు కాబట్టి, **ప్రయోగం A (పీచు పదార్థం ముందు)**: అన్నం తినడానికి ముందు సలాడ్ లేదా ఆకుకూరలు తినండి.`
            : `తదుపరి భోజనం తర్వాత 10 నిమిషాల **గ్లూకోజ్ వాకింగ్** చేయడానికి సిద్ధంగా ఉన్నారా?`;
        } else {
          experimentOption = detectedContexts.includes('activity')
            ? `Since you are already active, let's test **Experiment A (Fiber First)**: Eat your fiber/veggies first before eating carbs.`
            : `Let's commit to **Experiment B (The Glucose Walk)**: Can you commit to a quick 10-minute walk after your next high-carb meal?`;
        }

        const headerTitles: Record<SupportedLang, string> = {
          en: '🤖 **Hyper-Personalized Coach Analysis**',
          ta: '🤖 **தனிப்பயனாக்கப்பட்ட பயிற்சியாளர் ஆய்வு**',
          kn: '🤖 **ವೈಯಕ್ತೀಕರಿಸಿದ ಕೋಚ್ ವಿಶ್ಲೇಷಣೆ**',
          hi: '🤖 **व्यक्तिगत कोच विश्लेषण**',
          te: '🤖 **వ్యక్తిగతీకరించిన కోచ్ విశ్లేషణ**'
        };

        const expTitles: Record<SupportedLang, string> = {
          en: '💡 **Proposed Metabolic Experiment:**',
          ta: '💡 **முன்மொழியப்பட்ட வளர்சிதை மாற்றப் பயிற்சி:**',
          kn: '💡 **ಪ್ರಸ್ತಾವಿತ ಚಯಾಪಚಯ ಪ್ರಯೋಗ:**',
          hi: '💡 **प्रस्तावित मेटाबॉलिक प्रयोग:**',
          te: '💡 **ప్రతిపాదిత మెటబాలిక్ ప్రయోగం:**'
        };

        const coachResponse = `${headerTitles[normLang]}\n\n` +
          `${macroAdvice}\n\n` +
          (substitutionTip ? `${substitutionTip}\n\n` : '') +
          `${contextAnalysis}\n\n` +
          `${expTitles[normLang]}\n` +
          `${experimentOption}\n\n` +
          `${aiQuestions[nextIndex]}`;

        session.messages.push({
          role: 'assistant',
          content: coachResponse,
          createdAt: new Date()
        });
        session.currentQuestionIndex = nextIndex;
      } else {
        // Stage 2: Finalize the session with their commitment
        const lowerContent = content.toLowerCase();
        const choseWalk = lowerContent.includes('walk') || lowerContent.includes('b') || lowerContent.includes('exercise') || lowerContent.includes('நட') || lowerContent.includes('ನಡೆ') || lowerContent.includes('टहल') || lowerContent.includes('నడక');

        let committedHack = '';
        if (normLang === 'ta') {
          committedHack = choseWalk ? 'குளுக்கோஸ் நடைப்பயிற்சி (உணவுக்குப் பின் 10-15 நிமிடம்)' : 'நார்ச்சத்து முதலில் (கார்ப்ஸுக்கு முன் காய்கறி)';
        } else if (normLang === 'kn') {
          committedHack = choseWalk ? 'ಗ್ಲೂಕೋಸ್ ನಡಿಗೆ (ಊಟದ ನಂತರ 10-15 ನಿಮಿಷ)' : 'ನಾರಿನಂಶ ಮೊದಲು (ಕಾರ್ಬ್ಸ್‌ಗೆ ಮುನ್ನ ತರಕಾರಿ)';
        } else if (normLang === 'hi') {
          committedHack = choseWalk ? 'ग्लूकोज वॉक (भोजन के बाद 10-15 मिनट)' : 'फाइबर पहले (कार्ब्स से पहले सलाद/सब्जियां)';
        } else if (normLang === 'te') {
          committedHack = choseWalk ? 'గ్లూకోజ్ వాకింగ్ (భోజనం తర్వాత 10-15 నిమిషాలు)' : 'పీచు పదార్థం ముందు (కార్బోహైడ్రేట్లకు ముందు కూరగాయలు)';
        } else {
          committedHack = choseWalk ? 'The Glucose Walk (10-15m post-meal)' : 'Fiber First (veggies before carbs)';
        }

        const summaryTitles: Record<SupportedLang, { header: string; summary: string; meal: string; peak: string; macros: string; hack: string }> = {
          en: { header: '🤖 **Final Coach Summary**', summary: '📊 **Metabolic Coach Summary:**', meal: 'Trigger Meal', peak: 'Peak Glucose', macros: 'Macronutrients', hack: 'Committed Hack' },
          ta: { header: '🤖 **இறுதி பயிற்சியாளர் சுருக்கம்**', summary: '📊 **வளர்சிதை மாற்ற சுருக்கம்:**', meal: 'உணவு', peak: 'உச்ச குளுக்கோஸ்', macros: 'ஊட்டச்சத்துக்கள்', hack: 'ஏற்றுக்கொண்ட பயிற்சி' },
          kn: { header: '🤖 **ಅಂತಿಮ ಕೋಚ್ ಸಾರಾಂಶ**', summary: '📊 **ಚಯಾಪಚಯ ಕೋಚ್ ಸಾರಾಂಶ:**', meal: 'ಆಹಾರ', peak: 'ಗರಿಷ್ಠ ಗ್ಲೂಕೋಸ್', macros: 'ಪೋಷಕಾಂಶಗಳು', hack: 'ಒಪ್ಪಿಕೊಂಡ ಅಭ್ಯಾಸ' },
          hi: { header: '🤖 **अंतिम कोच सारांश**', summary: '📊 **मेटाबॉलिक कोच सारांश:**', meal: 'भोजन', peak: 'अधिकतम ग्लूकोज', macros: 'पोषक तत्व', hack: 'स्वीकृत अभ्यास' },
          te: { header: '🤖 **తుది కోచ్ సారాంశం**', summary: '📊 **మెటబాలిక్ కోచ్ సారాంశం:**', meal: 'ఆహారం', peak: 'గరిష్ట గ్లూకోజ్', macros: 'పోషకాలు', hack: 'అంగీకరించిన అలవాటు' }
        };

        const labels = summaryTitles[normLang];
        const defaultCompletionMsgs: Record<SupportedLang, string> = {
          en: config?.aiCompletionMessage || "Thank you for the context. We have recorded your activity.",
          ta: "விவரங்களைப் பகிர்ந்ததற்கு நன்றி. உங்கள் செயல்பாடு பதிவு செய்யப்பட்டுள்ளது.",
          kn: "ಮಾಹಿತಿ ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಚಟುವಟಿಕೆಯನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ.",
          hi: "जानकारी साझा करने के लिए धन्यवाद। आपकी गतिविधि दर्ज कर ली गई है।",
          te: "వివరాలను అందించినందుకు ధన్యవాదాలు. మీ కార్యాచరణ నమోదు చేయబడింది."
        };

        const finalResponse = `${labels.header}\n\n` +
          `${defaultCompletionMsgs[normLang]}\n\n` +
          `${labels.summary}\n` +
          `• **${labels.meal}**: ${foodName}\n` +
          `• **${labels.peak}**: ${peakGlucose} mg/dL\n` +
          `• **${labels.macros}**: ${carbs}g Carbs | ${protein}g Protein | ${fiber}g Fiber\n` +
          `• **${labels.hack}**: ${committedHack}`;

        session.messages.push({
          role: 'assistant',
          content: finalResponse,
          createdAt: new Date()
        });
        session.status = 'resolved';
      }

      await session.save();

      // Enrich response
      const plain = session.toObject();
      if (!plain.foodName && plain.foodLogId) {
        try {
          const raw = await FoodLog.collection.findOne(
            { _id: plain.foodLogId },
            { projection: { name: 1 } }
          );
          if (raw?.name) plain.foodName = raw.name;
        } catch (_) {}
      }

      return res.status(200).json(plain);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error replying to coaching session.' });
    }
  }

  /**
   * Dismiss/resolve a coaching session (user closes the popup without answering)
   */
  public static async dismissSession(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const session = await CoachingSession.findOne({ _id: id, userId });
      if (!session) {
        return res.status(404).json({ message: 'Coaching session not found.' });
      }

      session.status = 'resolved';
      await session.save();

      return res.status(200).json({ message: 'Session dismissed.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error dismissing session.' });
    }
  }
}

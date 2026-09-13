import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AskMitoTopic from '../models/AskMitoTopic';
import AskMitoQuery from '../models/AskMitoQuery';
import { UserSubscription } from '../models/UserSubscription';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { PaymentTransaction } from '../models/PaymentTransaction';

const SYSTEM_PROMPT = `You are Mito, an expert AI health companion for the Mito_Reboot app — a cancer prevention and metabolic health platform.

You specialise in:
- Cancer prevention lifestyle habits (fasting, movement, stress, sleep, antioxidants, alcohol reduction)
- Cancer treatment support (oncology, side-effect management, circadian rhythm during chemo)
- Secondary prevention for cancer survivors (recurrence reduction, metabolic health)
- CGM and metabolic data interpretation (glucose, insulin sensitivity, glycemic variability)
- Circadian biology and mitochondrial health
- Environmental exposures and their cancer risk links
- Reading and explaining lab reports (CEA, CA-125, PSA, HbA1c, CBC, CRP, etc.)

Rules:
1. Be warm, empathetic and concise — answer in 3-5 sentences unless more detail is asked.
2. Always recommend consulting a qualified doctor for personal medical decisions.
3. Never give specific treatment dosage advice.
4. Focus on actionable, evidence-based lifestyle guidance.
5. If asked about Mito_Reboot app features, explain how the relevant feature works.
6. If the question is a greeting or asks for help/support, provide a warm summary of available health topics.`;

// ─── GET /api/ask-mito/topics — Returns active topics for user app ─────────
export const getAskMitoTopics = async (_req: Request, res: Response) => {
  try {
    const topics = await AskMitoTopic.find({ isActive: true }).sort({ order: 1 });
    return res.json(topics);
  } catch (err) {
    console.error('Error fetching Ask Mito topics:', err);
    return res.status(500).json({ message: 'Error fetching topics' });
  }
};

// ─── ADMIN ENDPOINTS FOR ASK MITO WORKFLOWS / TOPICS ──────────────────────
export const getAdminAskMitoTopics = async (_req: Request, res: Response) => {
  try {
    const topics = await AskMitoTopic.find().sort({ order: 1, createdAt: -1 });
    return res.json(topics);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching admin topics' });
  }
};

export const createAskMitoTopic = async (req: Request, res: Response) => {
  try {
    const topic = new AskMitoTopic(req.body);
    await topic.save();
    return res.status(201).json(topic);
  } catch (err) {
    return res.status(500).json({ message: 'Error creating topic' });
  }
};

export const updateAskMitoTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await AskMitoTopic.findByIdAndUpdate(id, req.body, { new: true });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    return res.json(topic);
  } catch (err) {
    return res.status(500).json({ message: 'Error updating topic' });
  }
};

export const deleteAskMitoTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await AskMitoTopic.findByIdAndDelete(id);
    return res.json({ message: 'Topic deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Error deleting topic' });
  }
};

// ─── MAIN ASK MITO CONTROLLER ──────────────────────────────────────────────
export const askMito = async (req: Request, res: Response) => {
  try {
    const { message, history, language = 'en' } = req.body as {
      message: string;
      history?: Array<{ role: 'user' | 'model'; parts: string }>;
      language?: 'en' | 'ta' | 'kn' | 'hi' | 'te';
    };

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const trimmedMsg = message.trim();
    const lowerMsg = trimmedMsg.toLowerCase();

    // 1. Query MongoDB AskMitoTopics for DB-driven matching
    const allTopics = await AskMitoTopic.find({ isActive: true }).sort({ order: 1 });
    
    let matchedTopicAnswer: string | null = null;
    let highestScore = 0;

    for (const t of allTopics) {
      let score = 0;
      for (const kw of t.keywords) {
        const lowerKw = kw.toLowerCase();
        if (lowerMsg === lowerKw) {
          score += 50; // exact keyword match
        } else if (lowerMsg.includes(lowerKw)) {
          score += lowerKw.length;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        matchedTopicAnswer = `${t.title}\n\n${t.answer}`;
      }
    }

    // 2. If user typed a greeting or help/support query, return the pre-filled Help/Welcome workflow topic
    const isGreetingOrHelp = ['hi', 'hello', 'hey', 'help', 'support', 'topics', 'menu', 'options', 'start'].some(w => lowerMsg === w || lowerMsg.startsWith(w + ' '));
    if (isGreetingOrHelp && language === 'en') {
      const helpTopic = allTopics.find(t => t.keywords.includes('help') || t.keywords.includes('hi')) || allTopics[0];
      if (helpTopic) {
        return res.json({ answer: `${helpTopic.title}\n\n${helpTopic.answer}` });
      }
    }

    // 3. Try Gemini AI if GEMINI_API_KEY is configured
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      if (matchedTopicAnswer) {
        return res.json({ answer: matchedTopicAnswer });
      }
      const defaultOfflineGreetings: Record<string, string> = {
        ta: "நான் மிட்டோ, உங்கள் சுகாதார தோழன்! CGM அறிக்கைகள், உண்ணாநோன்பு, தூக்கம், மன அழுத்தம், புற்றுநோய் எதிர்ப்பு உணவுகள் பற்றி என்னிடம் கேட்கலாம்.",
        kn: "ನಾನು ಮಿಟೊ, ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಂಗಾತಿ! CGM ವರದಿಗಳು, ಉಪವಾಸ, ನಿದ್ರೆ, ಒತ್ತಡ, ಕ್ಯಾನ್ಸರ್ ವಿರೋಧಿ ಆಹಾರಗಳ ಬಗ್ಗೆ ನನ್ನನ್ನು ಕೇಳಬಹುದು.",
        hi: "मैं माइटो हूँ, आपका स्वास्थ्य साथी! आप मुझसे CGM रिपोर्ट, उपवास, नींद, तनाव या कैंसर-रोधी आहार के बारे में पूछ सकते हैं।",
        te: "నేను మిటో, మీ ఆరోగ్య సహచరుడిని! CGM నివేదికలు, ఉపవాసం, నిద్ర, ఒత్తిడి లేదా క్యాన్సర్ నిరోధక ఆహారాల గురించి నన్ను అడగవచ్చు.",
        en: "I'm Mito, your health companion! You can ask me about CGM reports, anti-cancer foods, intermittent fasting, sleep, stress reduction, or physician checklists."
      };
      return res.json({
        answer: defaultOfflineGreetings[language] || defaultOfflineGreetings.en
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      let languageDirective = '';
      if (language === 'ta') {
        languageDirective = '\n\nLANGUAGE INSTRUCTION: You MUST respond ENTIRELY in Tamil (தமிழ்). Do NOT output English sentences or mixed paragraphs. Use natural, empathetic conversational Tamil. Retain critical medical terms (e.g. glucose, CGM, HbA1c, mg/dL, ketones, mitochondria) in English for clinical clarity.';
      } else if (language === 'kn') {
        languageDirective = '\n\nLANGUAGE INSTRUCTION: You MUST respond ENTIRELY in Kannada (ಕನ್ನಡ). Do NOT output English sentences or mixed paragraphs. Use natural, empathetic conversational Kannada. Retain critical medical terms (e.g. glucose, CGM, HbA1c, mg/dL, ketones, mitochondria) in English for clinical clarity.';
      } else if (language === 'hi') {
        languageDirective = '\n\nLANGUAGE INSTRUCTION: You MUST respond ENTIRELY in Hindi (हिंदी). Do NOT output English sentences or mixed paragraphs. Use natural, empathetic conversational Hindi. Retain critical medical terms (e.g. glucose, CGM, HbA1c, mg/dL, ketones, mitochondria) in English for clinical clarity.';
      } else if (language === 'te') {
        languageDirective = '\n\nLANGUAGE INSTRUCTION: You MUST respond ENTIRELY in Telugu (తెలుగు). Do NOT output English sentences or mixed paragraphs. Use natural, empathetic conversational Telugu. Retain critical medical terms (e.g. glucose, CGM, HbA1c, mg/dL, ketones, mitochondria) in English for clinical clarity.';
      } else {
        languageDirective = '\n\nLANGUAGE INSTRUCTION: You MUST respond ENTIRELY in English.';
      }

      const contents: any[] = [];
      contents.push({ role: 'user', parts: [{ text: `[SYSTEM INSTRUCTIONS]\n${SYSTEM_PROMPT}${languageDirective}\n\nAcknowledge and begin as Mito.` }] });
      contents.push({ role: 'model', parts: [{ text: "Understood. I'm Mito, your health companion." }] });

      const safeHistory = (history || []).filter(h => h.parts?.trim());
      for (const h of safeHistory) {
        const role = h.role === 'model' ? 'model' : 'user';
        contents.push({ role, parts: [{ text: h.parts }] });
      }
      contents.push({ role: 'user', parts: [{ text: trimmedMsg }] });

      const result = await model.generateContent({ contents });
      const answer = result.response.text();

      return res.json({ answer });
    } catch (geminiError: any) {
      console.warn('[AskMito] Gemini API error, falling back to MongoDB Knowledge Base:', geminiError?.message || geminiError);
      
      if (matchedTopicAnswer) {
        return res.json({ answer: matchedTopicAnswer });
      }
      
      const fallbacks: Record<string, string> = {
        ta: "நான் மிட்டோ, உங்கள் சுகாதார தோழன்! CGM அறிக்கைகள், உண்ணாநோன்பு, தூக்கம், மன அழுத்தம், புற்றுநோய் எதிர்ப்பு உணவுகள் பற்றி என்னிடம் கேட்கலாம்.",
        kn: "ನಾನು ಮಿಟೊ, ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಂಗಾತಿ! CGM ವರದಿಗಳು, ಉಪವಾಸ, ನಿದ್ರೆ, ಒತ್ತಡ, ಕ್ಯಾನ್ಸರ್ ವಿರೋಧಿ ಆಹಾರಗಳ ಬಗ್ಗೆ ನನ್ನನ್ನು ಕೇಳಬಹುದು.",
        hi: "मैं माइटो हूँ, आपका स्वास्थ्य साथी! आप मुझसे CGM रिपोर्ट, उपवास, नींद, तनाव या कैंसर-रोधी आहार के बारे में पूछ सकते हैं।",
        te: "నేను మిటో, మీ ఆరోగ్య సహచరుడిని! CGM నివేదికలు, ఉపవాసం, నిద్ర, ఒత్తిడి లేదా క్యాన్సర్ నిరోధక ఆహారాల గురించి నన్ను అడగవచ్చు.",
        en: "I'm Mito, your health companion! For personalized guidance, try asking about CGM reports, intermittent fasting, sleep, stress, anti-cancer nutrition, or questions for your doctor."
      };
      
      return res.json({
        answer: fallbacks[language] || fallbacks.en
      });
    }
  } catch (err: any) {
    const lang = (req.body?.language || 'en') as string;
    const errorFallbacks: Record<string, string> = {
      ta: "நான் மிட்டோ, உங்கள் சுகாதார தோழன்! தயவுசெய்து உங்கள் கேள்வியை மீண்டும் முயற்சிக்கவும் அல்லது கீழே உள்ள தலைப்பைத் தேர்ந்தெடுக்கவும்.",
      kn: "ನಾನು ಮಿಟೊ, ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಂಗಾತಿ! ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಕೆಳಗಿನ ವಿಷಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
      hi: "मैं माइटो हूँ, आपका स्वास्थ्य साथी! कृपया अपना प्रश्न पुनः पूछें या नीचे दिए गए सुझावों में से चुनें।",
      te: "నేను మిటో, మీ ఆరోగ్య సహచరుడిని! దయచేసి మీ ప్రశ్నను మళ్ళీ ప్రయత్నించండి లేదా క్రింది అంశాన్ని ఎంచుకోండి.",
      en: "I'm Mito, your health companion! Please try your question again or choose a suggested topic below."
    };
    return res.status(500).json({
      answer: errorFallbacks[lang] || errorFallbacks.en
    });
  }
};

// ─── PATIENT QUERY CONSULTATION HANDLERS (48-HOUR SLA & QUOTA) ────────────

/**
 * Get user's active consultation quota and fee details
 */
export const getQuotaStatus = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const config = await PaymentGatewayConfig.findOne();
    const questionFee = config?.askMitoQuestionFee ?? 100;
    const isSandbox = config ? config.isSandbox : true;
    const razorpayKeyId = config?.razorpayKeyId || '';

    // Check user's active subscription
    const subscription = await UserSubscription.findOne({
      userId,
      status: { $in: ['active', 'trialing'] },
      endDate: { $gte: new Date() }
    });

    let isSubscribed = false;
    let planName = 'Basic';
    let billingCycle: 'monthly' | 'yearly' = 'monthly';
    let totalFreeQuestions = 0;
    let freeQuestionsUsed = 0;
    let remainingFreeQuestions = 0;

    if (subscription) {
      isSubscribed = true;
      billingCycle = subscription.billingCycle;
      const plan = await SubscriptionPlan.findById(subscription.planId);
      if (plan) {
        planName = plan.name;
        totalFreeQuestions = subscription.billingCycle === 'yearly'
          ? (plan.yearlyFreeQuestions ?? 10)
          : (plan.monthlyFreeQuestions ?? 1);
      } else {
        totalFreeQuestions = subscription.billingCycle === 'yearly' ? 10 : 1;
      }

      // Count questions submitted using free quota during current subscription window
      freeQuestionsUsed = await AskMitoQuery.countDocuments({
        userId,
        isFreeQuotaUsed: true,
        createdAt: { $gte: subscription.startDate, $lte: subscription.endDate }
      });

      remainingFreeQuestions = Math.max(0, totalFreeQuestions - freeQuestionsUsed);
    }

    return res.json({
      isSubscribed,
      planName,
      billingCycle,
      totalFreeQuestions,
      freeQuestionsUsed,
      remainingFreeQuestions,
      questionFee,
      isSandbox,
      razorpayKeyId,
      enableGlobalImageUpload: config?.enableAskMitoImageUpload ?? true
    });
  } catch (err: any) {
    console.error('Error fetching Ask Mito quota status:', err);
    return res.status(500).json({ message: 'Error fetching quota status.' });
  }
};

/**
 * Create order for paid 48-hour question (₹100)
 */
export const createQuestionOrder = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const config = await PaymentGatewayConfig.findOne();
    const questionFee = config?.askMitoQuestionFee ?? 100;
    const useRazorpay = !!(config && config.enablePayments && config.razorpayKeyId && config.razorpayKeySecret);

    if (useRazorpay) {
      const razorpay = new Razorpay({
        key_id: config.razorpayKeyId!,
        key_secret: config.razorpayKeySecret!
      });

      const order = await razorpay.orders.create({
        amount: Math.round(questionFee * 100), // amount in paise
        currency: 'INR',
        receipt: `ask_mito_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        notes: { userId: userId.toString(), type: 'ask_mito_query' }
      });

      return res.status(201).json({
        gateway: 'razorpay',
        orderId: order.id,
        amount: order.amount, // in paise
        currency: 'INR',
        keyId: config.razorpayKeyId,
        questionFee
      });
    } else {
      // Mock gateway order
      const mockOrderId = `mock_ask_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      return res.status(201).json({
        gateway: 'mock',
        orderId: mockOrderId,
        amount: Math.round(questionFee * 100),
        currency: 'INR',
        keyId: config?.razorpayKeyId || 'rzp_test_mock',
        questionFee
      });
    }
  } catch (err: any) {
    console.error('Error creating Ask Mito order:', err);
    return res.status(500).json({ message: 'Failed to create consultation order.' });
  }
};

/**
 * Submit a direct question to the clinical team
 */
export const submitPatientQuery = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userName = req.user?.name || req.body.userName || 'Patient';
    const userEmail = req.user?.email || req.body.userEmail || '';
    const { category, subject, question, paymentDetails, patientImageUrl } = req.body;

    if (!subject?.trim() || !question?.trim()) {
      return res.status(400).json({ message: 'Subject and question are required.' });
    }

    const config = await PaymentGatewayConfig.findOne();
    const questionFee = config?.askMitoQuestionFee ?? 100;

    // 1. Check user's active subscription and free quota
    const subscription = await UserSubscription.findOne({
      userId,
      status: { $in: ['active', 'trialing'] },
      endDate: { $gte: new Date() }
    });

    let hasFreeQuota = false;
    if (subscription) {
      const plan = await SubscriptionPlan.findById(subscription.planId);
      const totalFree = subscription.billingCycle === 'yearly'
        ? (plan?.yearlyFreeQuestions ?? 10)
        : (plan?.monthlyFreeQuestions ?? 1);

      const used = await AskMitoQuery.countDocuments({
        userId,
        isFreeQuotaUsed: true,
        createdAt: { $gte: subscription.startDate, $lte: subscription.endDate }
      });

      if (used < totalFree) {
        hasFreeQuota = true;
      }
    }

    let isPaid = false;
    let amountPaid = 0;
    let isFreeQuotaUsed = false;
    let paymentTxId: any = undefined;

    if (hasFreeQuota) {
      isFreeQuotaUsed = true;
      isPaid = true;
      amountPaid = 0;
    } else {
      // Requires paid verification
      if (!paymentDetails || !paymentDetails.orderId) {
        return res.status(402).json({
          message: `Doctor Consultation requires payment of ₹${questionFee}. Please complete payment.`,
          requiresPayment: true,
          questionFee
        });
      }

      const { gateway, orderId, paymentId, signature } = paymentDetails;

      // Verify Razorpay signature if gateway === 'razorpay'
      if (gateway === 'razorpay' && config?.razorpayKeySecret) {
        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
          .createHmac('sha256', config.razorpayKeySecret)
          .update(body.toString())
          .digest('hex');

        if (expectedSignature !== signature) {
          return res.status(400).json({ message: 'Invalid payment signature verification.' });
        }
      }

      // Record transaction
      const transaction = new PaymentTransaction({
        userId,
        amount: questionFee,
        originalAmount: questionFee,
        discountAmount: 0,
        currency: 'INR',
        gateway: gateway === 'razorpay' ? 'razorpay' : 'mock',
        gatewayOrderId: orderId,
        gatewayPaymentId: paymentId || `pay_${Date.now()}`,
        gatewaySignature: signature,
        status: 'success'
      });
      await transaction.save();
      paymentTxId = transaction._id;

      isPaid = true;
      amountPaid = questionFee;
      isFreeQuotaUsed = false;
    }

    const newQuery = new AskMitoQuery({
      userId,
      userName,
      userEmail,
      category: category?.trim() || 'General',
      subject: subject.trim(),
      question: question.trim(),
      status: 'pending',
      isPaid,
      amountPaid,
      isFreeQuotaUsed,
      paymentTransactionId: paymentTxId,
      allowImageUpload: true,
      patientImageUrl: patientImageUrl?.trim() || ''
    });

    await newQuery.save();

    return res.status(201).json({
      message: 'Your question has been received. Our clinical specialists will review and reply within 48 hours.',
      query: newQuery,
      isFreeQuotaUsed,
      amountPaid
    });
  } catch (err: any) {
    console.error('Error submitting patient question:', err);
    return res.status(500).json({ message: 'Failed to submit question. Please try again.' });
  }
};

/**
 * Get all questions submitted by the authenticated user
 */
export const getMyQueries = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const queries = await AskMitoQuery.find({ userId }).sort({ createdAt: -1 });
    return res.json(queries);
  } catch (err: any) {
    console.error('Error fetching patient questions:', err);
    return res.status(500).json({ message: 'Error fetching your questions.' });
  }
};

/**
 * Admin: Get all patient questions with optional status and search filter
 */
export const getAdminQueries = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query as { status?: string; search?: string };
    const filter: any = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { userName: regex },
        { userEmail: regex },
        { subject: regex },
        { question: regex },
        { category: regex }
      ];
    }

    const queries = await AskMitoQuery.find(filter).sort({ createdAt: -1 });
    const pendingCount = await AskMitoQuery.countDocuments({ status: 'pending' });
    const answeredCount = await AskMitoQuery.countDocuments({ status: 'answered' });

    const config = await PaymentGatewayConfig.findOne();
    return res.json({
      queries,
      total: queries.length,
      pendingCount,
      answeredCount,
      enableGlobalImageUpload: config?.enableAskMitoImageUpload ?? true
    });
  } catch (err: any) {
    console.error('Error fetching admin patient queries:', err);
    return res.status(500).json({ message: 'Error fetching queries.' });
  }
};

/**
 * Admin: Reply to a patient query
 */
export const replyPatientQuery = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const adminName = req.user?.name && !req.user?.name.includes('@') ? req.user.name : 'Mito Clinical Specialist';

    if (!reply?.trim()) {
      return res.status(400).json({ message: 'Reply text is required.' });
    }

    const updatedQuery = await AskMitoQuery.findByIdAndUpdate(
      id,
      {
        adminReply: reply.trim(),
        status: 'answered',
        repliedBy: adminName,
        repliedAt: new Date()
      },
      { new: true }
    );

    if (!updatedQuery) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    return res.json({
      message: 'Reply sent successfully to patient.',
      query: updatedQuery
    });
  } catch (err: any) {
    console.error('Error replying to patient question:', err);
    return res.status(500).json({ message: 'Failed to send reply.' });
  }
};

/**
 * Admin: Delete a patient query
 */
export const deleteAdminQuery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await AskMitoQuery.findByIdAndDelete(id);
    return res.json({ message: 'Query deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Error deleting query.' });
  }
};

/**
 * Admin: Toggle image upload permission for a query
 */
export const toggleImageUpload = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { allowImageUpload } = req.body;

    const query = await AskMitoQuery.findByIdAndUpdate(
      id,
      { allowImageUpload: !!allowImageUpload },
      { new: true }
    );

    if (!query) {
      return res.status(404).json({ message: 'Query not found.' });
    }

    return res.json({
      message: `Image upload permission set to ${allowImageUpload ? 'enabled' : 'disabled'}.`,
      query
    });
  } catch (err: any) {
    console.error('Error toggling image upload:', err);
    return res.status(500).json({ message: 'Error updating image upload status.' });
  }
};

/**
 * Patient: Attach / update image for a query
 */
export const uploadPatientQueryImage = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { patientImageUrl } = req.body;
    const userId = req.user?.id || req.user?._id;

    const query = await AskMitoQuery.findOne({ _id: id, userId });
    if (!query) {
      return res.status(404).json({ message: 'Query not found or unauthorized.' });
    }

    if (query.allowImageUpload === false) {
      return res.status(403).json({ message: 'Image upload is disabled by clinical team for this consultation.' });
    }

    query.patientImageUrl = patientImageUrl || '';
    await query.save();

    return res.json({
      message: 'Image attached successfully to consultation.',
      query
    });
  } catch (err: any) {
    console.error('Error uploading patient query image:', err);
    return res.status(500).json({ message: 'Error attaching image.' });
  }
};

/**
 * Admin: Toggle global image upload setting across all Ask Mito consultations
 */
export const toggleGlobalAskMitoImageUpload = async (req: Request, res: Response) => {
  try {
    let config = await PaymentGatewayConfig.findOne();
    if (!config) {
      config = new PaymentGatewayConfig();
    }

    const { enabled } = req.body;
    config.enableAskMitoImageUpload = !!enabled;
    await config.save();

    return res.json({
      message: `Global Ask Mito Image Upload set to ${config.enableAskMitoImageUpload ? 'enabled' : 'disabled'}.`,
      enableGlobalImageUpload: config.enableAskMitoImageUpload
    });
  } catch (err: any) {
    console.error('Error toggling global Ask Mito image upload setting:', err);
    return res.status(500).json({ message: 'Error updating global image upload setting.' });
  }
};



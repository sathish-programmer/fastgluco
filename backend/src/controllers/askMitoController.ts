import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AskMitoTopic from '../models/AskMitoTopic';
import AskMitoQuery from '../models/AskMitoQuery';

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
    const { message, history } = req.body as {
      message: string;
      history?: Array<{ role: 'user' | 'model'; parts: string }>;
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
    if (isGreetingOrHelp) {
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
      return res.json({
        answer: "I'm Mito, your health companion! You can ask me about CGM reports, anti-cancer foods, intermittent fasting, sleep, stress reduction, or physician checklists."
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const contents: any[] = [];
      contents.push({ role: 'user', parts: [{ text: `[SYSTEM INSTRUCTIONS]\n${SYSTEM_PROMPT}\n\nAcknowledge and begin as Mito.` }] });
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
      return res.json({
        answer: "I'm Mito, your health companion! For personalized guidance, try asking about CGM reports, intermittent fasting, sleep, stress, anti-cancer nutrition, or questions for your doctor."
      });
    }
  } catch (err: any) {
    console.error('[AskMito] General error:', err?.message || err);
    return res.status(500).json({
      answer: "I'm Mito, your health companion! Please try your question again or choose a suggested topic below."
    });
  }
};

// ─── PATIENT QUERY CONSULTATION HANDLERS (48-HOUR SLA) ─────────────────────

/**
 * Submit a direct question to the clinical team
 */
export const submitPatientQuery = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userName = req.user?.name || req.body.userName || 'Patient';
    const userEmail = req.user?.email || req.body.userEmail || '';
    const { category, subject, question } = req.body;

    if (!subject?.trim() || !question?.trim()) {
      return res.status(400).json({ message: 'Subject and question are required.' });
    }

    const newQuery = new AskMitoQuery({
      userId,
      userName,
      userEmail,
      category: category?.trim() || 'General',
      subject: subject.trim(),
      question: question.trim(),
      status: 'pending'
    });

    await newQuery.save();

    return res.status(201).json({
      message: 'Your question has been received. Our clinical specialists will review and reply within 48 hours.',
      query: newQuery
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

    return res.json({
      queries,
      total: queries.length,
      pendingCount,
      answeredCount
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

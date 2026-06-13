import { Request, Response } from 'express';
import { SupportTicket } from '../models/SupportTicket';
import { FAQ } from '../models/FAQ';
import { AuthRequest } from '../middlewares/authMiddleware';

export class SupportController {
  /**
   * Submit a new support question from the website/app
   */
  public static async submitTicket(req: AuthRequest, res: Response) {
    try {
      const { name, email, mobile, question } = req.body;
      if (!name || !email || !question) {
        return res.status(400).json({ message: 'Name, email, and question are required.' });
      }

      const ticket = new SupportTicket({
        userId: req.user?.id, // Optional, if they are logged in
        name,
        email,
        mobile,
        question
      });

      await ticket.save();

      return res.status(201).json({ message: 'Question submitted successfully. Our team will get back to you soon!', ticket });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error submitting question.' });
    }
  }

  /**
   * Get FAQs for the public website / app
   */
  public static async getPublicFAQs(req: Request, res: Response) {
    try {
      const { platform } = req.query; // 'App' or 'Website'
      const filter: any = { isActive: true };
      
      if (platform) {
        filter.platform = { $in: [platform, 'Both'] };
      }

      const faqs = await FAQ.find(filter).sort({ order: 1, createdAt: -1 });
      return res.status(200).json(faqs);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching FAQs.' });
    }
  }
}

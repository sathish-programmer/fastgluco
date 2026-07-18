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
      const { name, email, mobile, question, relatedId, type } = req.body;
      if (!name || !email || !question) {
        return res.status(400).json({ message: 'Name, email, and question are required.' });
      }

      const ticket = new SupportTicket({
        userId: req.user?.id, // Optional, if they are logged in
        name,
        email,
        mobile,
        question,
        relatedId,
        type: type || 'GENERAL'
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

  // ================= ADMIN METHODS =================

  public static async getAllTickets(req: AuthRequest, res: Response) {
    try {
      const tickets = await SupportTicket.find().sort({ createdAt: -1 });
      return res.status(200).json(tickets);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching tickets.' });
    }
  }

  public static async replyToTicket(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { answer } = req.body;

      if (!answer) {
        return res.status(400).json({ message: 'Answer is required.' });
      }

      const ticket = await SupportTicket.findById(id);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found.' });
      }

      ticket.answer = answer;
      ticket.status = 'Answered';
      ticket.answeredAt = new Date();
      await ticket.save();

      // Send Email to User
      const { EmailService } = require('../services/emailService');
      await EmailService.sendSupportAnswerEmail(ticket.email, ticket.name, ticket.question, answer);

      return res.status(200).json({ message: 'Replied successfully', ticket });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error replying to ticket.' });
    }
  }
}

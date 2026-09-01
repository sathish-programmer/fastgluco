import { Request, Response } from 'express';
import { UserFeedback } from '../models/UserFeedback';
import { User } from '../models/User';

export class FeedbackController {
  /**
   * Submit user rating and feedback
   */
  public static async submitFeedback(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const { rating, category, comment, name, email } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
      }

      if (!comment || !comment.trim()) {
        return res.status(400).json({ error: 'Feedback text is required.' });
      }

      let userProfile = null;
      if (authUser && authUser.id) {
        userProfile = await User.findById(authUser.id);
      }

      const userName = name || userProfile?.name || authUser?.name || 'Anonymous User';
      const userEmail = email || userProfile?.email || authUser?.email || 'N/A';

      const feedback = await UserFeedback.create({
        userId: userProfile ? userProfile._id : undefined,
        userName,
        userEmail,
        rating: Number(rating),
        category: category || 'General Feedback',
        comment: comment.trim(),
        status: 'Pending'
      });

      return res.status(201).json({
        message: 'Thank you for your feedback! Your review has been submitted successfully.',
        feedback
      });
    } catch (err: any) {
      console.error('Error submitting user feedback:', err);
      return res.status(500).json({ error: 'Failed to submit feedback. Please try again later.' });
    }
  }

  /**
   * Get feedback submitted by the logged-in user
   */
  public static async getMyFeedback(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const feedbacks = await UserFeedback.find({ userId: authUser.id })
        .sort({ createdAt: -1 })
        .limit(20);

      return res.status(200).json(feedbacks);
    } catch (err: any) {
      console.error('Error fetching user feedback:', err);
      return res.status(500).json({ error: 'Failed to load feedback history.' });
    }
  }

  /**
   * Update own feedback (User)
   */
  public static async updateMyFeedback(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { rating, category, comment } = req.body;

      const feedback = await UserFeedback.findById(id);
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found.' });
      }

      if (feedback.userId && feedback.userId.toString() !== authUser.id) {
        return res.status(403).json({ error: 'You are not authorized to edit this feedback.' });
      }

      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
      }

      if (rating) feedback.rating = Number(rating);
      if (category) feedback.category = category;
      if (comment && comment.trim()) feedback.comment = comment.trim();
      feedback.status = 'Pending';

      await feedback.save();

      return res.status(200).json({
        message: 'Your review has been updated successfully!',
        feedback
      });
    } catch (err: any) {
      console.error('Error updating my feedback:', err);
      return res.status(500).json({ error: 'Failed to update feedback.' });
    }
  }

  /**
   * Delete own feedback (User)
   */
  public static async deleteMyFeedback(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const feedback = await UserFeedback.findById(id);
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found.' });
      }

      if (feedback.userId && feedback.userId.toString() !== authUser.id) {
        return res.status(403).json({ error: 'You are not authorized to delete this feedback.' });
      }

      await UserFeedback.findByIdAndDelete(id);

      return res.status(200).json({ message: 'Review deleted successfully.' });
    } catch (err: any) {
      console.error('Error deleting my feedback:', err);
      return res.status(500).json({ error: 'Failed to delete feedback.' });
    }
  }

  /**
   * Admin: Get all feedback with filters & pagination
   */
  public static async getAllFeedbackAdmin(req: Request, res: Response) {
    try {
      const { rating, category, status, search, page = 1, limit = 20 } = req.query;
      const query: any = {};

      if (rating && Number(rating) > 0) {
        query.rating = Number(rating);
      }

      if (category && category !== 'All') {
        query.category = category;
      }

      if (status && status !== 'All') {
        query.status = status;
      }

      if (search && String(search).trim()) {
        const searchRegex = new RegExp(String(search).trim(), 'i');
        query.$or = [
          { userName: searchRegex },
          { userEmail: searchRegex },
          { comment: searchRegex },
          { category: searchRegex }
        ];
      }

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.max(1, Number(limit));
      const skip = (pageNum - 1) * limitNum;

      const [feedbacks, total] = await Promise.all([
        UserFeedback.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        UserFeedback.countDocuments(query)
      ]);

      // Calculate rating statistics
      const allFeedbacks = await UserFeedback.find({});
      const totalCount = allFeedbacks.length;
      const avgRating = totalCount > 0
        ? Number((allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalCount).toFixed(1))
        : 5.0;

      const distribution = {
        5: allFeedbacks.filter(f => f.rating === 5).length,
        4: allFeedbacks.filter(f => f.rating === 4).length,
        3: allFeedbacks.filter(f => f.rating === 3).length,
        2: allFeedbacks.filter(f => f.rating === 2).length,
        1: allFeedbacks.filter(f => f.rating === 1).length
      };

      return res.status(200).json({
        feedbacks,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        stats: {
          totalFeedbacks: totalCount,
          avgRating,
          distribution
        }
      });
    } catch (err: any) {
      console.error('Error fetching admin feedback:', err);
      return res.status(500).json({ error: 'Failed to load feedbacks.' });
    }
  }

  /**
   * Admin: Update feedback status or notes
   */
  public static async updateFeedbackAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const feedback = await UserFeedback.findById(id);
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found.' });
      }

      if (status) feedback.status = status;
      if (adminNotes !== undefined) feedback.adminNotes = adminNotes;

      await feedback.save();
      return res.status(200).json({ message: 'Feedback updated successfully.', feedback });
    } catch (err: any) {
      console.error('Error updating admin feedback:', err);
      return res.status(500).json({ error: 'Failed to update feedback.' });
    }
  }

  /**
   * Admin: Delete feedback
   */
  public static async deleteFeedbackAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await UserFeedback.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Feedback deleted successfully.' });
    } catch (err: any) {
      console.error('Error deleting admin feedback:', err);
      return res.status(500).json({ error: 'Failed to delete feedback.' });
    }
  }
}

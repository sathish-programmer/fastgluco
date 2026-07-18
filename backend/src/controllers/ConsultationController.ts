import { Request, Response } from 'express';
import { ConsultationRecommendation } from '../models/ConsultationRecommendation';

export const ConsultationController = {
  logRecommendation: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const {
        sourceModule,
        reason,
        triggerCondition,
        riskLevel,
        assessmentAnswers,
        recommendedSpecialty,
        status = 'Generated' // Or 'Viewed'
      } = req.body;

      if (!sourceModule || !reason || !recommendedSpecialty) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if a recommendation for this module exists within 24h that is NOT yet Booked/Completed
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      let recommendation = await ConsultationRecommendation.findOne({
        userId,
        sourceModule,
        status: { $nin: ['Booked', 'Completed', 'Cancelled'] },
        updatedAt: { $gte: twentyFourHoursAgo }
      });

      if (recommendation) {
        // Update existing to prevent duplicates
        recommendation.status = status === 'Generated' && recommendation.status !== 'Generated' ? recommendation.status : status;
        recommendation.triggerCondition = triggerCondition || recommendation.triggerCondition;
        recommendation.riskLevel = riskLevel || recommendation.riskLevel;
        recommendation.assessmentAnswers = assessmentAnswers || recommendation.assessmentAnswers;
        
        await recommendation.save();
      } else {
        // Create new
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Expires in 30 days
        recommendation = new ConsultationRecommendation({
          userId,
          sourceModule,
          reason,
          triggerCondition,
          riskLevel,
          assessmentAnswers,
          recommendedSpecialty,
          status,
          expiresAt
        });
        await recommendation.save();
      }

      res.status(200).json({ recommendation });
    } catch (error) {
      console.error('Error logging consultation recommendation:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = (req as any).user.id;

      const recommendation = await ConsultationRecommendation.findOne({ _id: id, userId });
      if (!recommendation) {
        return res.status(404).json({ message: 'Recommendation not found' });
      }

      recommendation.status = status;
      await recommendation.save();

      res.status(200).json({ recommendation });
    } catch (error) {
      console.error('Error updating consultation status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getRecommendation: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const recommendation = await ConsultationRecommendation.findOne({ _id: id, userId });
      if (!recommendation) {
        return res.status(404).json({ message: 'Recommendation not found' });
      }

      res.status(200).json({ recommendation });
    } catch (error) {
      console.error('Error getting consultation recommendation:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAnalytics: async (req: Request, res: Response) => {
    try {
      const totalGenerated = await ConsultationRecommendation.countDocuments();
      const totalViewed = await ConsultationRecommendation.countDocuments({ status: { $in: ['Viewed', 'Clicked', 'Booked', 'Completed'] } });
      const totalClicked = await ConsultationRecommendation.countDocuments({ status: { $in: ['Clicked', 'Booked', 'Completed'] } });
      const totalBooked = await ConsultationRecommendation.countDocuments({ status: { $in: ['Booked', 'Completed'] } });
      const totalCompleted = await ConsultationRecommendation.countDocuments({ status: 'Completed' });
      const totalCancelled = await ConsultationRecommendation.countDocuments({ status: 'Cancelled' });

      const conversionRate = totalViewed > 0 ? ((totalBooked / totalViewed) * 100).toFixed(1) : 0;

      // Module-wise
      const moduleStats = await ConsultationRecommendation.aggregate([
        {
          $group: {
            _id: '$sourceModule',
            generated: { $sum: 1 },
            viewed: { $sum: { $cond: [{ $in: ['$status', ['Viewed', 'Clicked', 'Booked', 'Completed']] }, 1, 0] } },
            clicked: { $sum: { $cond: [{ $in: ['$status', ['Clicked', 'Booked', 'Completed']] }, 1, 0] } },
            booked: { $sum: { $cond: [{ $in: ['$status', ['Booked', 'Completed']] }, 1, 0] } }
          }
        },
        { $sort: { generated: -1 } }
      ]);

      res.status(200).json({
        funnel: {
          totalGenerated,
          totalViewed,
          totalClicked,
          totalBooked,
          totalCompleted,
          totalCancelled,
          conversionRate
        },
        byModule: moduleStats
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

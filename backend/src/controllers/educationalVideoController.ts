import { Request, Response } from 'express';
import EducationalVideoConfig from '../models/EducationalVideoConfig';

const DEFAULT_VIDEOS: Record<string, { title: string; description: string; youtubeUrl: string }> = {
  breast_self_exam: {
    title: 'Animated Self Breast Examination',
    description: 'Step-by-step visual animation for monthly breast self-examination and awareness',
    youtubeUrl: 'https://youtu.be/hymu-0jWtdM?si=n8pz91JRuhK4opin'
  }
};

/**
 * Public/User: Get educational video by key
 */
export const getEducationalVideoByKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    let video = await EducationalVideoConfig.findOne({ key });

    if (!video) {
      const def = DEFAULT_VIDEOS[key];
      if (def) {
        // Seed default document in background
        video = await EducationalVideoConfig.create({
          key,
          title: def.title,
          description: def.description,
          youtubeUrl: def.youtubeUrl,
          isActive: true
        });
      } else {
        return res.status(404).json({ message: 'Video config not found', key });
      }
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error: any) {
    console.error('Error fetching educational video config:', error);
    res.status(500).json({ success: false, message: 'Server error fetching video config' });
  }
};

/**
 * Admin: Get all educational videos
 */
export const getAllEducationalVideosAdmin = async (req: Request, res: Response) => {
  try {
    // Ensure default breast_self_exam exists
    const exists = await EducationalVideoConfig.findOne({ key: 'breast_self_exam' });
    if (!exists) {
      await EducationalVideoConfig.create({
        key: 'breast_self_exam',
        title: DEFAULT_VIDEOS.breast_self_exam.title,
        description: DEFAULT_VIDEOS.breast_self_exam.description,
        youtubeUrl: DEFAULT_VIDEOS.breast_self_exam.youtubeUrl,
        isActive: true
      });
    }

    const videos = await EducationalVideoConfig.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: videos
    });
  } catch (error: any) {
    console.error('Error fetching admin educational videos:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Admin: Update educational video config by key
 */
export const updateEducationalVideoAdmin = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { title, description, youtubeUrl, isActive } = req.body;
    const adminUser = (req as any).user?.email || (req as any).user?.id || 'admin';

    const updated = await EducationalVideoConfig.findOneAndUpdate(
      { key },
      {
        $set: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(youtubeUrl !== undefined && { youtubeUrl }),
          ...(isActive !== undefined && { isActive }),
          updatedBy: adminUser
        }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Educational video configuration updated successfully',
      data: updated
    });
  } catch (error: any) {
    console.error('Error updating educational video config:', error);
    res.status(500).json({ success: false, message: 'Server error updating video config' });
  }
};

/**
 * Admin: Remove/deactivate video by key
 */
export const removeEducationalVideoAdmin = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const adminUser = (req as any).user?.email || (req as any).user?.id || 'admin';

    const updated = await EducationalVideoConfig.findOneAndUpdate(
      { key },
      {
        $set: {
          youtubeUrl: '',
          isActive: false,
          updatedBy: adminUser
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Educational video link removed successfully',
      data: updated
    });
  } catch (error: any) {
    console.error('Error removing educational video config:', error);
    res.status(500).json({ success: false, message: 'Server error removing video config' });
  }
};

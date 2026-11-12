import { Request, Response } from 'express';
import { Guide } from '../models/Guide';
import { Video } from '../models/Video';
import { MITOREBOOT_LIBRARY_RESOURCES } from '../data/educationalLibrarySeeds';

export class EducationalController {
  /**
   * Get all guides
   */
  public static async getGuides(req: Request, res: Response) {
    try {
      const guides = await Guide.find().sort({ createdAt: -1 });
      return res.status(200).json(guides);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching guides.' });
    }
  }

  /**
   * Get single guide details
   */
  public static async getGuideById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const guide = await Guide.findById(id);

      if (!guide) {
        return res.status(404).json({ message: 'Guide article not found.' });
      }

      return res.status(200).json(guide);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching guide content.' });
    }
  }

  /**
   * Get all videos / educational video links
   */
  public static async getVideos(req: Request, res: Response) {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

      // Auto-sync URLs if any record still has outdated youtube search when docx specifies dedicated podcast
      const outdated = await Video.findOne({
        title: 'How Chronic Stress Shapes Cancer Risk and Recovery – Ground & Root Podcast',
        url: { $regex: 'youtube\\.com' }
      });

      if (outdated) {
        for (const item of MITOREBOOT_LIBRARY_RESOURCES) {
          const match = await Video.findOne({
            $or: [{ order: item.order }, { title: item.title }]
          });
          if (match) {
            match.title = item.title;
            match.category = item.category;
            match.topic = item.topic;
            match.topicNumber = item.topicNumber;
            match.focus = item.focus;
            match.url = item.url;
            match.order = item.order;
            await match.save();
          } else {
            await Video.create({ ...item, isPaidOnly: false });
          }
        }
      }

      let videos = await Video.find().sort({ order: 1, createdAt: -1 });
      
      // Auto-seed library if empty so mobile and web immediately have the 57 curated resources
      if (videos.length === 0) {
        try {
          await Video.insertMany(MITOREBOOT_LIBRARY_RESOURCES);
          videos = await Video.find().sort({ order: 1, createdAt: -1 });
        } catch (seedErr) {
          console.error('[EducationalController] Auto-seed error:', seedErr);
        }
      }

      return res.status(200).json(videos);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching videos.' });
    }
  }
}

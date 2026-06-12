import { Request, Response } from 'express';
import { Guide } from '../models/Guide';
import { Video } from '../models/Video';

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
   * Get all videos
   */
  public static async getVideos(req: Request, res: Response) {
    try {
      const videos = await Video.find().sort({ createdAt: -1 });
      return res.status(200).json(videos);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching videos.' });
    }
  }
}

import { Request, Response } from 'express';
import { Founder } from '../models/Founder';

export class FounderController {
  /**
   * Get all active founders
   */
  public static async getAll(req: Request, res: Response) {
    try {
      const founders = await Founder.find().sort({ createdAt: 1 });
      return res.status(200).json(founders);
    } catch (error: any) {
      console.error('Error fetching founders:', error);
      return res.status(500).json({ message: error.message || 'Error fetching founders.' });
    }
  }

  /**
   * Create a new founder (Admin only)
   */
  public static async create(req: Request, res: Response) {
    try {
      const { name, role, background, workDone, achievements, tryingToSolve, videoUrl } = req.body;

      if (!name || !role || !background || !workDone || !achievements || !tryingToSolve) {
        return res.status(400).json({ message: 'Missing required founder fields.' });
      }

      const founder = new Founder({
        name,
        role,
        background,
        workDone,
        achievements,
        tryingToSolve,
        videoUrl: videoUrl || ''
      });

      await founder.save();

      return res.status(201).json({
        message: 'Founder created successfully.',
        founder
      });
    } catch (error: any) {
      console.error('Error creating founder:', error);
      return res.status(500).json({ message: error.message || 'Error creating founder.' });
    }
  }

  /**
   * Update a founder (Admin only)
   */
  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, role, background, workDone, achievements, tryingToSolve, videoUrl } = req.body;

      const founder = await Founder.findById(id);
      if (!founder) {
        return res.status(404).json({ message: 'Founder record not found.' });
      }

      if (name !== undefined) founder.name = name;
      if (role !== undefined) founder.role = role;
      if (background !== undefined) founder.background = background;
      if (workDone !== undefined) founder.workDone = workDone;
      if (achievements !== undefined) founder.achievements = achievements;
      if (tryingToSolve !== undefined) founder.tryingToSolve = tryingToSolve;
      if (videoUrl !== undefined) founder.videoUrl = videoUrl;

      await founder.save();

      return res.status(200).json({
        message: 'Founder updated successfully.',
        founder
      });
    } catch (error: any) {
      console.error('Error updating founder:', error);
      return res.status(500).json({ message: error.message || 'Error updating founder.' });
    }
  }

  /**
   * Delete a founder (Admin only - soft delete)
   */
  public static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const founder = await Founder.findById(id);
      if (!founder) {
        return res.status(404).json({ message: 'Founder record not found.' });
      }

      founder.isDeleted = true;
      await founder.save();

      return res.status(200).json({ message: 'Founder deleted successfully.' });
    } catch (error: any) {
      console.error('Error deleting founder:', error);
      return res.status(500).json({ message: error.message || 'Error deleting founder.' });
    }
  }
}

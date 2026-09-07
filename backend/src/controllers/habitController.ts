import { Request, Response } from 'express';
import HabitLog from '../models/HabitLog';

export const logHabit = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { type, value, timestamp, source } = req.body;

    if (!type || value === undefined) {
      return res.status(400).json({ message: 'Type and value are required' });
    }

    const logDate = timestamp ? new Date(timestamp) : new Date();
    const startOfDay = new Date(logDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(logDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Upsert or update existing log for the same user, habit type and day to prevent duplicate logs
    const existingLog = await HabitLog.findOne({
      userId,
      type: { $regex: new RegExp(`^${type}$`, 'i') },
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingLog) {
      existingLog.value = value;
      existingLog.source = source || existingLog.source || 'manual';
      existingLog.timestamp = logDate;
      await existingLog.save();
      return res.status(200).json(existingLog);
    }

    const newLog = new HabitLog({
      userId,
      type,
      value,
      source: source || 'manual',
      timestamp: logDate
    });

    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    console.error('Error logging habit:', error);
    res.status(500).json({ message: 'Error logging habit' });
  }
};

export const getRecentHabits = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { type, days } = req.query;

    if (!type) {
      return res.status(400).json({ message: 'Type is required' });
    }

    const limitDays = days ? parseInt(days as string, 10) : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - limitDays);

    const query: any = {
      userId,
      timestamp: { $gte: startDate }
    };
    if (type !== 'all') {
      query.type = { $regex: new RegExp(`^${type}$`, 'i') };
    }

    const logs = await HabitLog.find(query).sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ message: 'Error fetching habits' });
  }
};

export const deleteHabit = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const log = await HabitLog.findOne({ _id: id, userId });
    
    if (!log) {
      return res.status(404).json({ message: 'Habit log not found or unauthorized' });
    }

    const startOfDay = new Date(log.timestamp);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(log.timestamp);
    endOfDay.setHours(23, 59, 59, 999);

    await HabitLog.deleteMany({
      userId,
      type: { $regex: new RegExp(`^${log.type}$`, 'i') },
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json({ message: 'Habit log deleted successfully' });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ message: 'Error deleting habit' });
  }
};

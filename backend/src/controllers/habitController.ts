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
    startDate.setHours(0, 0, 0, 0);

    const andConditions: any[] = [{ userId }];

    // Add date filter
    if (limitDays > 0) {
      andConditions.push({
        $or: [
          { timestamp: { $gte: startDate } },
          { createdAt: { $gte: startDate } }
        ]
      });
    }

    if (type !== 'all') {
      const typeStr = String(type).trim().toLowerCase();
      if (typeStr === 'kitchen') {
        andConditions.push({
          $or: [
            { type: { $regex: /^kitchen/i } },
            { type: { $regex: /^environment/i }, 'value.answers.kitchenQ1': { $exists: true } },
            { type: { $regex: /^environment/i }, 'value.kitchenQ1': { $exists: true } },
            { type: { $regex: /^damage/i }, 'value.stepId': { $regex: /kitchen/i } }
          ]
        });
      } else if (typeStr === 'environmental' || typeStr === 'environment') {
        andConditions.push({
          $or: [
            { type: { $regex: /^environment/i } },
            { type: { $regex: /^kitchen/i } },
            { type: { $regex: /^damage/i } }
          ]
        });
      } else if (typeStr === 'substance' || typeStr === 'substances') {
        andConditions.push({ type: { $regex: /^substances?$/i } });
      } else if (typeStr === 'movement' || typeStr === 'exercise') {
        andConditions.push({ type: { $regex: /^(movement|exercise)$/i } });
      } else if (typeStr === 'breath' || typeStr === 'power_of_breath' || typeStr === 'breathwork') {
        andConditions.push({ type: { $regex: /^(breath|power_of_breath|breathwork)$/i } });
      } else if (typeStr === 'saferproducts' || typeStr === 'safer_products') {
        andConditions.push({ type: { $regex: /^safer_?products?$/i } });
      } else if (typeStr === 'genetic' || typeStr === 'genetics') {
        andConditions.push({ type: { $regex: /^genetics?$/i } });
      } else if (typeStr === 'antioxidant' || typeStr === 'antioxidants') {
        andConditions.push({
          $or: [
            { type: { $regex: /^antioxidants?$/i } },
            { type: { $regex: /^repair_habit$/i } }
          ]
        });
      } else if (typeStr === 'gastritis') {
        andConditions.push({ type: { $regex: /^(gastritis|gut_health)$/i } });
      } else if (typeStr === 'obesity' || typeStr === 'weight') {
        andConditions.push({ type: { $regex: /^(obesity|weight)$/i } });
      } else {
        andConditions.push({ type: { $regex: new RegExp(`^${type}$`, 'i') } });
      }
    }

    const logs = await HabitLog.find({ $and: andConditions }).sort({ timestamp: -1, createdAt: -1 });

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

    await HabitLog.findByIdAndDelete(id);
    res.json({ message: 'Habit log deleted successfully' });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ message: 'Error deleting habit' });
  }
};

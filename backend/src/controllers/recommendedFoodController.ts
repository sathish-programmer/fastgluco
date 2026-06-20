import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import RecommendedFood from '../models/RecommendedFood';

// GET all recommended foods (User & Admin)
export const getRecommendedFoods = async (req: AuthRequest, res: Response) => {
  try {
    const filter = (req.user?.role === 'Admin' || req.user?.role === 'SuperAdmin') ? {} : { status: 'active' };
    const foods = await RecommendedFood.find(filter).sort({ createdAt: -1 });
    res.json(foods);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching recommended foods', error: error.message });
  }
};

// POST add new recommended food (Admin only)
export const addRecommendedFood = async (req: Request, res: Response) => {
  try {
    const newFood = new RecommendedFood(req.body);
    const savedFood = await newFood.save();
    res.status(201).json(savedFood);
  } catch (error: any) {
    res.status(400).json({ message: 'Error adding recommended food', error: error.message });
  }
};

// PUT update recommended food (Admin only)
export const updateRecommendedFood = async (req: Request, res: Response) => {
  try {
    const updatedFood = await RecommendedFood.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedFood) return res.status(404).json({ message: 'Food not found' });
    res.json(updatedFood);
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating recommended food', error: error.message });
  }
};

// DELETE recommended food (Admin only)
export const deleteRecommendedFood = async (req: Request, res: Response) => {
  try {
    const deletedFood = await RecommendedFood.findByIdAndDelete(req.params.id);
    if (!deletedFood) return res.status(404).json({ message: 'Food not found' });
    res.json({ message: 'Food deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting recommended food', error: error.message });
  }
};

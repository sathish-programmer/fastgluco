import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Coupon } from '../models/Coupon';
import { AuditLog } from '../models/AuditLog';

export class CouponAdminController {
  /**
   * List Coupons (Admin)
   */
  public static async listCoupons(req: AuthRequest, res: Response) {
    try {
      const { q, page = '1', limit = '10' } = req.query;
      const filter: any = { isDeleted: false };

      if (q) {
        filter.code = { $regex: q as string, $options: 'i' };
      }

      const p = parseInt(page as string, 10);
      const l = parseInt(limit as string, 10);
      const skip = (p - 1) * l;

      const coupons = await Coupon.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l);

      const total = await Coupon.countDocuments(filter);

      return res.status(200).json({
        coupons,
        pagination: {
          total,
          page: p,
          limit: l,
          pages: Math.ceil(total / l)
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error listing coupons.' });
    }
  }

  /**
   * Create Coupon (Admin)
   */
  public static async createCoupon(req: AuthRequest, res: Response) {
    try {
      const { code, discountType, discountValue, expiryDate, maxRedemptions } = req.body;

      if (!code || !discountType || discountValue === undefined) {
        return res.status(400).json({ message: 'Code, discount type, and discount value are required.' });
      }

      const cleanCode = code.trim().toUpperCase();
      const existing = await Coupon.findOne({ code: cleanCode, isDeleted: false });
      if (existing) {
        return res.status(400).json({ message: `Coupon with code '${cleanCode}' already exists.` });
      }

      if (discountType !== 'percentage' && discountType !== 'fixed') {
        return res.status(400).json({ message: 'Discount type must be percentage or fixed.' });
      }

      if (discountValue <= 0) {
        return res.status(400).json({ message: 'Discount value must be greater than zero.' });
      }

      if (discountType === 'percentage' && discountValue > 100) {
        return res.status(400).json({ message: 'Percentage discount cannot exceed 100%.' });
      }

      const coupon = new Coupon({
        code: cleanCode,
        discountType,
        discountValue,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        maxRedemptions: maxRedemptions !== undefined ? parseInt(maxRedemptions, 10) : undefined
      });

      await coupon.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'CREATE_COUPON',
        details: `Created coupon code: ${cleanCode} (${discountType}: ${discountValue})`,
        ipAddress: req.ip
      });

      return res.status(201).json({ message: 'Coupon created successfully.', coupon });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error creating coupon.' });
    }
  }

  /**
   * Update Coupon (Admin)
   */
  public static async updateCoupon(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { code, discountType, discountValue, expiryDate, maxRedemptions, isActive } = req.body;

      const coupon = await Coupon.findById(id);
      if (!coupon || coupon.isDeleted) {
        return res.status(404).json({ message: 'Coupon not found.' });
      }

      if (code) {
        const cleanCode = code.trim().toUpperCase();
        if (cleanCode !== coupon.code) {
          const existing = await Coupon.findOne({ code: cleanCode, isDeleted: false });
          if (existing) {
            return res.status(400).json({ message: `Coupon with code '${cleanCode}' already exists.` });
          }
          coupon.code = cleanCode;
        }
      }

      if (discountType !== undefined) {
        if (discountType !== 'percentage' && discountType !== 'fixed') {
          return res.status(400).json({ message: 'Discount type must be percentage or fixed.' });
        }
        coupon.discountType = discountType;
      }

      if (discountValue !== undefined) {
        if (discountValue <= 0) {
          return res.status(400).json({ message: 'Discount value must be greater than zero.' });
        }
        if (coupon.discountType === 'percentage' && discountValue > 100) {
          return res.status(400).json({ message: 'Percentage discount cannot exceed 100%.' });
        }
        coupon.discountValue = discountValue;
      }

      if (expiryDate !== undefined) {
        coupon.expiryDate = expiryDate ? new Date(expiryDate) : undefined;
      }

      if (maxRedemptions !== undefined) {
        coupon.maxRedemptions = maxRedemptions !== null && maxRedemptions !== '' ? parseInt(maxRedemptions, 10) : undefined;
      }

      if (isActive !== undefined) {
        coupon.isActive = isActive;
      }

      await coupon.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'UPDATE_COUPON',
        details: `Updated coupon code: ${coupon.code}`,
        ipAddress: req.ip
      });

      return res.status(200).json({ message: 'Coupon updated successfully.', coupon });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error updating coupon.' });
    }
  }

  /**
   * Delete Coupon (Admin soft-delete)
   */
  public static async deleteCoupon(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findById(id);

      if (!coupon || coupon.isDeleted) {
        return res.status(404).json({ message: 'Coupon not found.' });
      }

      coupon.isDeleted = true;
      await coupon.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'DELETE_COUPON',
        details: `Soft deleted coupon code: ${coupon.code}`,
        ipAddress: req.ip
      });

      return res.status(200).json({ message: 'Coupon deleted successfully.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error deleting coupon.' });
    }
  }
}

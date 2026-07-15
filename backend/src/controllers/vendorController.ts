import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Vendor } from '../models/Vendor';
import ShopOrder from '../models/ShopOrder';
import { EmailService } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345!';

export class VendorController {
  // --- ADMIN VENDOR MANAGEMENT ---

  public static async adminAddVendor(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required.' });
      }

      const existing = await Vendor.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Vendor already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const vendor = new Vendor({
        name,
        email,
        passwordHash
      });
      await vendor.save();
      res.status(201).json(vendor);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error adding vendor' });
    }
  }

  public static async adminEditVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, isActive } = req.body;
      const vendor = await Vendor.findById(id);
      if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

      if (name) vendor.name = name;
      if (isActive !== undefined) vendor.isActive = isActive;
      await vendor.save();
      res.json(vendor);
    } catch (err) {
      res.status(500).json({ message: 'Error updating vendor.' });
    }
  }

  public static async adminGetVendors(req: Request, res: Response) {
    try {
      const vendors = await Vendor.find().sort({ createdAt: -1 });
      res.json(vendors);
    } catch (err) {
      res.status(500).json({ message: 'Error listing vendors' });
    }
  }

  public static async adminAssignOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const { vendorId } = req.body;
      const order = await ShopOrder.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found.' });

      order.vendorId = vendorId;
      order.deliveryStatus = 'assigned';
      await order.save();

      EmailService.sendOrderEmail('assigned', order._id.toString()).catch(console.error);

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error assigning order.' });
    }
  }

  // --- VENDOR ACTIONS ---

  public static async vendorLogin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const vendor = await Vendor.findOne({ email });
      if (!vendor || vendor.isDeleted || !vendor.isActive) {
        return res.status(401).json({ message: 'Invalid credentials or inactive account.' });
      }

      const isMatch = await bcrypt.compare(password, vendor.passwordHash);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

      const token = jwt.sign(
        { id: vendor._id, email: vendor.email, role: 'Vendor' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        token,
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email
        }
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error logging in.' });
    }
  }

  public static async getVendorOrders(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const orders = await ShopOrder.find({ vendorId })
        .populate('userId', 'name email mobileNumber')
        .sort({ updatedAt: -1 });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching vendor orders.' });
    }
  }

  public static async updateOrderStatus(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const { orderId } = req.params;
      const { deliveryStatus } = req.body; // accepted | packed | shipped | delivered | cancelled

      const order = await ShopOrder.findOne({ _id: orderId, vendorId });
      if (!order) return res.status(404).json({ message: 'Order not found or unauthorized.' });

      order.deliveryStatus = deliveryStatus;
      await order.save();

      // Trigger email updates
      if (deliveryStatus === 'delivered') {
        EmailService.sendOrderEmail('delivered', order._id.toString()).catch(console.error);
      } else {
        EmailService.sendOrderEmail('statusUpdated', order._id.toString()).catch(console.error);
      }

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error updating order status.' });
    }
  }
}

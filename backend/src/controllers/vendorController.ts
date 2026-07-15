import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Vendor } from '../models/Vendor';
import ShopOrder from '../models/ShopOrder';
import { EmailService } from '../services/emailService';
import { InvoiceService } from '../services/invoiceService';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345!';

export class VendorController {
  // --- ADMIN VENDOR MANAGEMENT ---

  public static async adminAddVendor(req: Request, res: Response) {
    try {
      const { name, email, password, phone, address, businessName, licenseNumber, taxId, businessAddress, assignedProducts } = req.body;
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
        passwordHash,
        phone: phone || '',
        address: address || '',
        businessName: businessName || '',
        licenseNumber: licenseNumber || '',
        taxId: taxId || '',
        businessAddress: businessAddress || '',
        assignedProducts: assignedProducts || [],
        isActive: true
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
      const { name, phone, address, businessName, licenseNumber, taxId, businessAddress, assignedProducts, isActive } = req.body;
      const vendor = await Vendor.findById(id);
      if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

      if (name !== undefined) vendor.name = name;
      if (phone !== undefined) vendor.phone = phone;
      if (address !== undefined) vendor.address = address;
      if (businessName !== undefined) vendor.businessName = businessName;
      if (licenseNumber !== undefined) vendor.licenseNumber = licenseNumber;
      if (taxId !== undefined) vendor.taxId = taxId;
      if (businessAddress !== undefined) vendor.businessAddress = businessAddress;
      if (assignedProducts !== undefined) vendor.assignedProducts = assignedProducts;
      if (isActive !== undefined) {
        vendor.isActive = isActive;
        if (!isActive) {
          vendor.deactivatedAt = new Date();
        } else {
          vendor.deactivatedAt = undefined;
        }
      }

      await vendor.save();
      res.json(vendor);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error updating vendor.' });
    }
  }

  public static async adminGetVendors(req: Request, res: Response) {
    try {
      const vendors = await Vendor.find().populate('assignedProducts').sort({ createdAt: -1 });
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

      order.vendorId = vendorId || undefined;
      order.deliveryStatus = vendorId ? 'assigned' : 'pending';
      
      // Update order timeline
      const statusLabel = vendorId ? 'assigned' : 'pending';
      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: statusLabel,
        timestamp: new Date(),
        comment: vendorId ? 'Order assigned to vendor for fulfillment' : 'Order marked as pending review'
      });

      await order.save();

      if (vendorId) {
        EmailService.sendOrderEmail('assigned', order._id.toString()).catch(console.error);
      }

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error assigning order.' });
    }
  }

  public static async adminGetVendorPerformance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orders = await ShopOrder.find({ vendorId: id });
      
      const totalAssigned = orders.length;
      const deliveredOrders = orders.filter(o => o.deliveryStatus === 'delivered');
      const totalDelivered = deliveredOrders.length;
      const totalCancelled = orders.filter(o => o.deliveryStatus === 'cancelled').length;
      
      // Calculate revenue
      const totalRevenue = deliveredOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

      // Average fulfillment time (assigned to delivered) in hours
      let totalFulfillmentTimeHours = 0;
      let fulfillmentCount = 0;
      
      deliveredOrders.forEach(order => {
        const assignedStep = order.orderTimeline?.find(t => t.status === 'assigned');
        const deliveredStep = order.orderTimeline?.find(t => t.status === 'delivered') || { timestamp: order.deliveryDate };
        
        if (assignedStep && deliveredStep && deliveredStep.timestamp) {
          const diffMs = new Date(deliveredStep.timestamp).getTime() - new Date(assignedStep.timestamp).getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          totalFulfillmentTimeHours += diffHours;
          fulfillmentCount++;
        }
      });

      const avgFulfillmentTimeHours = fulfillmentCount > 0 ? (totalFulfillmentTimeHours / fulfillmentCount).toFixed(1) : 'N/A';

      res.json({
        totalAssigned,
        totalDelivered,
        totalCancelled,
        totalRevenue,
        avgFulfillmentTimeHours,
        cancelRate: totalAssigned > 0 ? ((totalCancelled / totalAssigned) * 100).toFixed(1) + '%' : '0%'
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error calculating vendor performance.' });
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
          email: vendor.email,
          businessName: vendor.businessName,
          licenseNumber: vendor.licenseNumber,
          taxId: vendor.taxId
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

  public static async vendorDashboard(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const orders = await ShopOrder.find({ vendorId });

      const stats = {
        totalOrders: orders.length,
        pending: orders.filter(o => o.deliveryStatus === 'assigned').length, // Assigned is pending vendor action
        processing: orders.filter(o => o.deliveryStatus === 'accepted').length,
        packed: orders.filter(o => o.deliveryStatus === 'packed').length,
        shipped: orders.filter(o => o.deliveryStatus === 'shipped').length,
        delivered: orders.filter(o => o.deliveryStatus === 'delivered').length,
        cancelled: orders.filter(o => o.deliveryStatus === 'cancelled').length,
        revenue: orders.filter(o => o.deliveryStatus === 'delivered').reduce((acc, curr) => acc + curr.totalAmount, 0)
      };

      const recentOrders = await ShopOrder.find({ vendorId })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10);

      res.json({ stats, recentOrders });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error generating vendor dashboard.' });
    }
  }

  public static async updateOrderStatus(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const { orderId } = req.params;
      const { deliveryStatus, comment } = req.body; // accepted | processing | packed | shipped | out_for_delivery | delivered | cancelled

      const order = await ShopOrder.findOne({ _id: orderId, vendorId }).populate('userId');
      if (!order) return res.status(404).json({ message: 'Order not found or unauthorized.' });

      order.deliveryStatus = deliveryStatus;
      
      // Update timeline
      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: deliveryStatus,
        timestamp: new Date(),
        comment: comment || `Status updated to ${deliveryStatus}`
      });

      if (deliveryStatus === 'delivered') {
        order.deliveryDate = new Date();
        // Generate PDF Invoice
        try {
          const invoiceUrl = await InvoiceService.generateInvoicePDF(order);
          order.invoiceUrl = invoiceUrl;
        } catch (pdfErr) {
          console.error('Failed to generate invoice PDF:', pdfErr);
        }
      }

      await order.save();

      // Trigger email updates
      if (deliveryStatus === 'delivered') {
        EmailService.sendOrderEmail('delivered', order._id.toString()).catch(console.error);
      } else if (deliveryStatus === 'accepted') {
        EmailService.sendOrderEmail('accepted', order._id.toString()).catch(console.error);
      } else if (deliveryStatus === 'shipped') {
        EmailService.sendOrderEmail('shipped', order._id.toString()).catch(console.error);
      }

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error updating order status.' });
    }
  }

  public static async uploadTrackingDetails(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const { orderId } = req.params;
      const { courierName, trackingId, trackingUrl } = req.body;

      if (!courierName || !trackingId) {
        return res.status(400).json({ message: 'Courier name and tracking ID are required.' });
      }

      const order = await ShopOrder.findOne({ _id: orderId, vendorId });
      if (!order) return res.status(404).json({ message: 'Order not found or unauthorized.' });

      order.trackingDetails = {
        courierName,
        trackingId,
        trackingUrl: trackingUrl || ''
      };
      
      // Auto transition status to 'shipped' if tracking details are uploaded
      order.deliveryStatus = 'shipped';
      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: 'shipped',
        timestamp: new Date(),
        comment: `Shipped via ${courierName}. Tracking ID: ${trackingId}`
      });

      await order.save();

      EmailService.sendOrderEmail('shipped', order._id.toString()).catch(console.error);

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error uploading tracking details.' });
    }
  }

  public static async confirmDelivery(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const { orderId } = req.params;

      const order = await ShopOrder.findOne({ _id: orderId, vendorId }).populate('userId');
      if (!order) return res.status(404).json({ message: 'Order not found or unauthorized.' });

      order.deliveryStatus = 'delivered';
      order.deliveryDate = new Date();
      
      // Update timeline
      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: 'delivered',
        timestamp: new Date(),
        comment: 'Order delivered successfully.'
      });

      // Generate PDF Invoice
      try {
        const invoiceUrl = await InvoiceService.generateInvoicePDF(order);
        order.invoiceUrl = invoiceUrl;
      } catch (pdfErr) {
        console.error('Failed to generate invoice PDF:', pdfErr);
      }

      await order.save();

      EmailService.sendOrderEmail('delivered', order._id.toString()).catch(console.error);

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error confirming delivery.' });
    }
  }
}

import { Request, Response } from 'express';
import crypto from 'crypto';
import ShopProduct from '../models/ShopProduct';
import ShopOrder from '../models/ShopOrder';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import Razorpay from 'razorpay';

// --- ADMIN ROUTES ---

export const getAdminProducts = async (req: Request, res: Response) => {
  try {
    let products = await ShopProduct.find().sort({ createdAt: -1 });
    
    // Seed default template if empty
    if (products.length === 0) {
      const defaults = [
        { name: 'Mito-C Complex', description: 'High absorption Vitamin C with bioflavonoids.', price: 24.99, image: '🍊', category: 'Antioxidants', isActive: true },
        { name: 'Cellular Glutathione', description: 'The master antioxidant, liposomal delivery.', price: 39.99, image: '🛡️', category: 'Antioxidants', isActive: true },
        { name: 'Resveratrol Elite', description: 'Trans-resveratrol for mitochondrial repair.', price: 29.99, image: '🍇', category: 'Antioxidants', isActive: true },
        { name: 'Non-Toxic Deodorant', description: 'Aluminum-free, paraben-free.', price: 12.99, image: '🌿', category: 'SaferProducts', isActive: true },
        { name: 'Clean Sunscreen', description: 'Mineral based, reef-safe, no endocrine disruptors.', price: 18.99, image: '☀️', category: 'SaferProducts', isActive: true },
        { name: 'Glass Food Containers', description: 'BPA-free, non-leaching glass set.', price: 34.99, image: '🍱', category: 'SaferProducts', isActive: true }
      ];
      await ShopProduct.insertMany(defaults);
      products = await ShopProduct.find().sort({ createdAt: -1 });
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const createAdminProduct = async (req: Request, res: Response) => {
  try {
    const newProduct = new ShopProduct(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error creating product' });
  }
};

export const updateAdminProduct = async (req: Request, res: Response) => {
  try {
    const product = await ShopProduct.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error updating product' });
  }
};

export const deleteAdminProduct = async (req: Request, res: Response) => {
  try {
    await ShopProduct.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product' });
  }
};

// --- USER ROUTES ---

export const getProducts = async (req: Request, res: Response) => {
  try {
    let products = await ShopProduct.find({ isActive: true });
    
    if (products.length === 0) {
      const allProducts = await ShopProduct.find();
      if (allProducts.length === 0) {
        const defaults = [
          { name: 'Mito-C Complex', description: 'High absorption Vitamin C with bioflavonoids.', price: 24.99, image: '🍊', category: 'Antioxidants', isActive: true },
          { name: 'Cellular Glutathione', description: 'The master antioxidant, liposomal delivery.', price: 39.99, image: '🛡️', category: 'Antioxidants', isActive: true },
          { name: 'Resveratrol Elite', description: 'Trans-resveratrol for mitochondrial repair.', price: 29.99, image: '🍇', category: 'Antioxidants', isActive: true },
          { name: 'Non-Toxic Deodorant', description: 'Aluminum-free, paraben-free.', price: 12.99, image: '🌿', category: 'SaferProducts', isActive: true },
          { name: 'Clean Sunscreen', description: 'Mineral based, reef-safe, no endocrine disruptors.', price: 18.99, image: '☀️', category: 'SaferProducts', isActive: true },
          { name: 'Glass Food Containers', description: 'BPA-free, non-leaching glass set.', price: 34.99, image: '🍱', category: 'SaferProducts', isActive: true }
        ];
        await ShopProduct.insertMany(defaults);
        products = await ShopProduct.find({ isActive: true });
      }
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// --- SHOP COUPON ---

export const validateShopCoupon = async (req: Request, res: Response) => {
  try {
    const { couponCode, totalAmount } = req.body;
    if (!couponCode) {
      return res.status(400).json({ message: 'Coupon code is required.' });
    }

    let discountAmount = 0;
    let couponRes: any = null;

    if (couponCode !== 'NO_COUPON') {
      couponRes = await Coupon.findOne({ 
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        isDeleted: false
      });

      if (!couponRes) {
        return res.status(400).json({ valid: false, message: 'Invalid or inactive coupon code.' });
      }

      if (couponRes.expiryDate && new Date(couponRes.expiryDate) < new Date()) {
        return res.status(400).json({ valid: false, message: 'This coupon code has expired.' });
      }

      if (couponRes.maxRedemptions !== undefined && couponRes.redemptionsCount >= couponRes.maxRedemptions) {
        return res.status(400).json({ valid: false, message: 'This coupon code has reached its limit.' });
      }

      if (couponRes.discountType === 'percentage') {
        discountAmount = (totalAmount * couponRes.discountValue) / 100;
      } else {
        discountAmount = couponRes.discountValue;
      }
    }

    const config = await PaymentGatewayConfig.findOne();
    const shopDiscountAmount = (totalAmount * (config?.shopDiscountPercentage || 0)) / 100;
    const totalDiscountAmount = discountAmount + shopDiscountAmount;
    
    const discountedAmount = Math.max(0, totalAmount - totalDiscountAmount);
    const gstAmount = (discountedAmount * (config?.shopGstPercentage || 0)) / 100;
    const shippingFee = config?.shopShippingFee || 0;
    const finalAmount = discountedAmount + gstAmount + shippingFee;

    return res.status(200).json({
      valid: true,
      couponCode: couponRes ? couponRes.code : 'NO_COUPON',
      discountAmount: totalDiscountAmount,
      gstAmount,
      shippingFee,
      finalAmount,
      shopGstPercentage: config?.shopGstPercentage || 0,
      shopDiscountPercentage: config?.shopDiscountPercentage || 0
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error validating coupon.' });
  }
};

// --- RAZORPAY CHECKOUT ---

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { items, totalAmount, couponCode } = req.body;

    const user = await User.findById(userId);
    const currency = user?.currency || 'INR';

    const config = await PaymentGatewayConfig.findOne();

    let couponDiscountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true, isDeleted: false });
      if (coupon) {
        if (coupon.discountType === 'percentage') {
          couponDiscountAmount = (totalAmount * coupon.discountValue) / 100;
        } else {
          couponDiscountAmount = coupon.discountValue;
        }
      } else {
        return res.status(400).json({ message: 'Invalid or expired coupon code.' });
      }
    }

    const shopDiscountAmount = (totalAmount * (config?.shopDiscountPercentage || 0)) / 100;
    const totalDiscountAmount = couponDiscountAmount + shopDiscountAmount;
    const discountedAmount = Math.max(0, totalAmount - totalDiscountAmount);
    
    const gstAmount = (discountedAmount * (config?.shopGstPercentage || 0)) / 100;
    const finalAmount = discountedAmount + gstAmount;

    // Create DB Order pending
    const newOrder = new ShopOrder({
      userId,
      products: items,
      totalAmount: finalAmount,
      gstAmount,
      discountAmount: totalDiscountAmount,
      couponCode: couponCode || null,
      currency,
      status: 'pending'
    });
    await newOrder.save();

    if (!config || !config.razorpayKeyId || !config.razorpayKeySecret) {
      return res.status(400).json({ message: 'Razorpay is not configured on the admin side.' });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret
    });

    // Create Razorpay Order
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: currency,
      receipt: newOrder._id.toString()
    });

    newOrder.razorpayOrderId = rzpOrder.id;
    await newOrder.save();

    res.json({
      gateway: 'razorpay',
      orderId: newOrder._id,
      rzpOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: config.razorpayKeyId,
      breakdown: {
        subtotal: totalAmount,
        discount: totalDiscountAmount,
        gst: gstAmount,
        finalAmount
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating order' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const config = await PaymentGatewayConfig.findOne();
    if (!config || !config.razorpayKeySecret) {
      return res.status(500).json({ message: 'Payment gateway error' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const order = await ShopOrder.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'completed';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    res.json({ message: 'Payment verified successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error verifying payment' });
  }
};

export const getAvailableCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find({ isActive: true, isDeleted: false }).select('code discountType discountValue');
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons' });
  }
};

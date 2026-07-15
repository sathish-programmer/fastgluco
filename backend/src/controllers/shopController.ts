import { Request, Response } from 'express';
import crypto from 'crypto';
import ShopProduct from '../models/ShopProduct';
import ProductReview from '../models/ProductReview';
import ShopOrder from '../models/ShopOrder';
import { ShopCategory } from '../models/ShopCategory';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import Razorpay from 'razorpay';

// Predefined categories
export const PREDEFINED_CATEGORIES = [
  'Antioxidants',
  'SaferProducts',
  'Safer Products',
  'Diabetes Care',
  'Nutrition',
  'Vitamins & Supplements',
  'Protein Supplements',
  'Women\'s Health',
  'Men\'s Health',
  'Heart Health',
  'Weight Management',
  'Digestive Health',
  'Immunity',
  'Sleep Support',
  'Stress Management',
  'Mental Wellness',
  'Bone & Joint Care',
  'Skin Care',
  'Hair Care',
  'Ayurvedic Products',
  'Herbal Supplements',
  'Medical Devices',
  'CGM Accessories',
  'Blood Glucose Monitoring',
  'Foot Care',
  'Healthy Snacks',
  'Organic Foods',
  'General Wellness'
];

// --- ADMIN ROUTES ---

export const getAdminProducts = async (req: Request, res: Response) => {
  try {
    let products = await ShopProduct.find().sort({ createdAt: -1 });
    
    // Seed default template if empty
    if (products.length === 0) {
      const defaults = [
        { name: 'Mito-C Complex', description: 'High absorption Vitamin C with bioflavonoids.', price: 24.99, image: '🍊', category: 'Vitamins & Supplements', isActive: true, stock: 50, brand: 'MitoLife' },
        { name: 'Cellular Glutathione', description: 'The master antioxidant, liposomal delivery.', price: 39.99, image: '🛡️', category: 'Vitamins & Supplements', isActive: true, stock: 30, brand: 'MitoLife' },
        { name: 'Resveratrol Elite', description: 'Trans-resveratrol for mitochondrial repair.', price: 29.99, image: '🍇', category: 'Nutrition', isActive: true, stock: 45, brand: 'CellMax' },
        { name: 'Blood Glucose Monitor Kit', description: 'Accurate Blood Glucose Monitoring system.', price: 49.99, image: '🩸', category: 'Blood Glucose Monitoring', isActive: true, stock: 20, brand: 'AccuCheck' },
        { name: 'CGM Sensor Patch', description: 'Waterproof protective patch for CGM sensors.', price: 15.99, image: '🩹', category: 'CGM Accessories', isActive: true, stock: 100, brand: 'Freestyle' },
        { name: 'Organic Almond Bar', description: 'Healthy Snacks with zero added sugar.', price: 3.99, image: '🍫', category: 'Healthy Snacks', isActive: true, stock: 200, brand: 'NutriBite' }
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
    // Compute available stock as sum of variants or main stock
    if (newProduct.variants && newProduct.variants.length > 0) {
      newProduct.stock = newProduct.variants.reduce((sum, v) => sum + v.stock, 0);
      newProduct.availableStock = newProduct.stock;
    } else {
      newProduct.availableStock = newProduct.stock;
    }
    
    // Calculate offer price
    newProduct.regularPrice = newProduct.price;
    if (newProduct.discountPercent && newProduct.discountPercent > 0) {
      newProduct.offerPrice = Number((newProduct.price * (1 - newProduct.discountPercent / 100)).toFixed(2));
    } else {
      newProduct.offerPrice = newProduct.price;
    }

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating product' });
  }
};

export const updateAdminProduct = async (req: Request, res: Response) => {
  try {
    const body = { ...req.body };
    if (body.variants && body.variants.length > 0) {
      body.stock = body.variants.reduce((sum: number, v: any) => sum + Number(v.stock), 0);
      body.availableStock = body.stock;
    } else {
      body.availableStock = body.stock;
    }

    // Calculate offer price
    body.regularPrice = body.price;
    if (body.discountPercent && body.discountPercent > 0) {
      body.offerPrice = Number((body.price * (1 - body.discountPercent / 100)).toFixed(2));
    } else {
      body.offerPrice = body.price;
      body.discountPercent = 0;
    }

    const product = await ShopProduct.findByIdAndUpdate(req.params.id, body, { new: true });
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

// --- CATEGORIES MANAGEMENT ---

export const getCategories = async (req: Request, res: Response) => {
  try {
    const dbCategories = await ShopCategory.find({ isActive: true }).sort({ name: 1 });
    const customNames = dbCategories.map(c => c.name);
    // Merge predefined with custom ones ensuring unique
    const merged = Array.from(new Set([...PREDEFINED_CATEGORIES, ...customNames]));
    res.json(merged.map(name => ({
      name,
      isCustom: !PREDEFINED_CATEGORIES.includes(name)
    })));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

export const createAdminCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });
    const existing = await ShopCategory.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: 'Category already exists.' });

    const cat = new ShopCategory({ name: name.trim(), description });
    await cat.save();
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ message: 'Error creating category' });
  }
};

// --- USER SHOP ROUTES ---

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, brand, minPrice, maxPrice, healthBenefit, doctorRecommended, available, search, sortBy } = req.query;

    const filterQuery: any = { isActive: true };

    if (category) {
      filterQuery.category = category;
    }
    if (brand) {
      filterQuery.brand = brand;
    }
    if (doctorRecommended === 'true') {
      filterQuery.doctorRecommended = true;
    }
    if (healthBenefit) {
      filterQuery.healthBenefits = { $in: [healthBenefit] };
    }
    if (available === 'true') {
      filterQuery.stock = { $gt: 0 };
    }
    if (search) {
      filterQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      filterQuery.price = {};
      if (minPrice) filterQuery.price.$gte = Number(minPrice);
      if (maxPrice) filterQuery.price.$lte = Number(maxPrice);
    }

    let query = ShopProduct.find(filterQuery);

    if (sortBy === 'price_asc') {
      query = query.sort({ price: 1 });
    } else if (sortBy === 'price_desc') {
      query = query.sort({ price: -1 });
    } else if (sortBy === 'newest') {
      query = query.sort({ createdAt: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const products = await query;
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const getProductDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ShopProduct.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Find similar products in same category
    const similar = await ShopProduct.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true
    }).limit(4);

    res.json({ product, similar });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product details' });
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

// --- CHECKOUT FLOW ---

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { items, totalAmount, couponCode, patientName, patientEmail, patientPhone, shippingAddress, billingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in the order.' });
    }

    const user = await User.findById(userId);
    const currency = user?.currency || 'INR';
    const config = await PaymentGatewayConfig.findOne();

    // 1. INVENTORY STOCK VALIDATION & UPDATE PREPARATION
    const productsToUpdate = [];

    for (const item of items) {
      const product = await ShopProduct.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product ${item.name} is no longer available.` });
      }

      if (item.variantName) {
        // Variant stock check
        const variant = product.variants?.find(v => v.name === item.variantName);
        if (!variant) {
          return res.status(400).json({ message: `Variant ${item.variantName} for product ${item.name} not found.` });
        }
        if (variant.stock < item.qty) {
          return res.status(400).json({ message: `Insufficient stock for product ${item.name} (${item.variantName}). Only ${variant.stock} left.` });
        }
        productsToUpdate.push({ product, variant, qty: item.qty });
      } else {
        // Main stock check
        if (product.stock < item.qty) {
          return res.status(400).json({ message: `Insufficient stock for product ${item.name}. Only ${product.stock} left.` });
        }
        productsToUpdate.push({ product, qty: item.qty });
      }
    }

    // 2. REDUCE STOCK (AUTO REDUCE STOCK AFTER ORDER)
    for (const update of productsToUpdate) {
      if (update.variant) {
        update.variant.stock -= update.qty;
        update.product.stock = update.product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
        update.product.availableStock = update.product.stock;
      } else {
        update.product.stock -= update.qty;
        update.product.availableStock = update.product.stock;
      }
      await update.product.save();
    }

    // 3. CALCULATION
    let couponDiscountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true, isDeleted: false });
      if (coupon) {
        if (coupon.discountType === 'percentage') {
          couponDiscountAmount = (totalAmount * coupon.discountValue) / 100;
        } else {
          couponDiscountAmount = coupon.discountValue;
        }
        // Increment coupon redemption
        coupon.redemptionsCount = (coupon.redemptionsCount || 0) + 1;
        await coupon.save();
      } else {
        return res.status(400).json({ message: 'Invalid or expired coupon code.' });
      }
    }

    const shopDiscountAmount = (totalAmount * (config?.shopDiscountPercentage || 0)) / 100;
    const totalDiscountAmount = couponDiscountAmount + shopDiscountAmount;
    const discountedAmount = Math.max(0, totalAmount - totalDiscountAmount);
    
    const gstAmount = (discountedAmount * (config?.shopGstPercentage || 0)) / 100;
    const shippingCharge = config?.shopShippingFee || 0;
    const finalAmount = discountedAmount + gstAmount + shippingCharge;

    // Create DB Order pending
    const newOrder = new ShopOrder({
      userId,
      products: items,
      totalAmount: finalAmount,
      gstAmount,
      taxAmount: gstAmount,
      shippingCharge,
      discountAmount: totalDiscountAmount,
      couponCode: couponCode || null,
      currency,
      status: 'pending',
      deliveryStatus: 'pending',
      patientName: patientName || user?.name || '',
      patientEmail: patientEmail || user?.email || '',
      patientPhone: patientPhone || user?.mobileNumber || '',
      shippingAddress: shippingAddress || { line1: '', city: '', state: '', postalCode: '', country: 'India' },
      billingAddress: billingAddress || shippingAddress || { line1: '', city: '', state: '', postalCode: '', country: 'India' },
      orderTimeline: [{
        status: 'pending',
        timestamp: new Date(),
        comment: 'Order placed, awaiting admin review'
      }]
    });
    await newOrder.save();

    if (!config || !config.razorpayKeyId || !config.razorpayKeySecret) {
      // In development or if Razorpay isn't configured, bypass gateway payment check
      newOrder.status = 'completed';
      await newOrder.save();

      // Trigger confirmation email
      const { EmailService } = require('../services/emailService');
      EmailService.sendOrderEmail('placed', newOrder._id.toString()).catch(console.error);

      return res.json({
        gateway: 'manual_bypass',
        orderId: newOrder._id,
        amount: finalAmount,
        currency,
        breakdown: {
          subtotal: totalAmount,
          discount: totalDiscountAmount,
          gst: gstAmount,
          shippingCharge,
          finalAmount
        }
      });
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
        shippingCharge,
        finalAmount
      }
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Error creating order' });
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
    
    // Add to timeline
    order.orderTimeline = order.orderTimeline || [];
    order.orderTimeline.push({
      status: 'placed',
      timestamp: new Date(),
      comment: 'Payment verified, order confirmed'
    });

    await order.save();

    // Trigger confirmation email
    const { EmailService } = require('../services/emailService');
    EmailService.sendOrderEmail('placed', order._id.toString()).catch(console.error);

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

// Submit product review (User)
export const submitProductReview = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { productId, orderId, rating, comment } = req.body;

    if (!productId || !orderId || !rating) {
      return res.status(400).json({ message: 'Product ID, Order ID, and Rating are required.' });
    }

    // Check if order exists, is completed, and belongs to user
    const order = await ShopOrder.findOne({ _id: orderId, userId, status: 'completed' });
    if (!order) {
      return res.status(404).json({ message: 'Order not found or not completed.' });
    }

    // Check if product belongs to order
    const hasProduct = order.products.some(p => p.productId.toString() === productId);
    if (!hasProduct) {
      return res.status(400).json({ message: 'This product was not purchased in this order.' });
    }

    // Check if already reviewed
    const existing = await ProductReview.findOne({ productId, orderId, userId });
    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this product for this order.' });
    }

    const userRecord = await User.findById(userId);
    const patientName = userRecord?.name || 'Valued Patient';

    const review = new ProductReview({
      productId,
      orderId,
      userId,
      patientName,
      rating,
      comment: comment || ''
    });

    await review.save();
    res.status(201).json({ message: 'Review submitted successfully. Pending approval.', review });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error submitting review.' });
  }
};

// Get reviews of a product (Public/User)
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reviews = await ProductReview.find({ productId: id, status: 'approved' }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

// Get all reviews for admin approval (Admin)
export const getAdminReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await ProductReview.find()
      .populate('productId', 'name image price')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews for admin.' });
  }
};

// Update review status (Admin approve/reject)
export const updateReviewStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
    }

    const review = await ProductReview.findByIdAndUpdate(id, { status }, { new: true });
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    res.json({ message: `Review status updated to ${status}.`, review });
  } catch (err) {
    res.status(500).json({ message: 'Error updating review status.' });
  }
};

// Get patient's own reviews
export const getPatientReviews = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const reviews = await ProductReview.find({ userId });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews.' });
  }
};

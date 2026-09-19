import { Request, Response } from 'express';
import crypto from 'crypto';
import ShopProduct from '../models/ShopProduct';
import ProductReview from '../models/ProductReview';
import ShopOrder from '../models/ShopOrder';
import { ShopCategory } from '../models/ShopCategory';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { PincodeShippingRule } from '../models/PincodeShippingRule';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import { Vendor } from '../models/Vendor';
import { VendorAdapterFactory } from '../services/vendorAdapters/VendorAdapterFactory';
import Razorpay from 'razorpay';
import { FCMService } from '../services/fcmService';


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
    const activeProductCategories = await ShopProduct.distinct('category', { isActive: true });
    // Active product categories first, then predefined and custom
    const merged = Array.from(new Set([
      ...activeProductCategories.filter(Boolean),
      ...PREDEFINED_CATEGORIES,
      ...customNames
    ]));
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
    const { category, brand, vendor, minPrice, maxPrice, healthBenefit, doctorRecommended, available, search, sortBy } = req.query;

    const filterQuery: any = { isActive: true };

    if (category && category !== 'All') {
      filterQuery.category = category;
    }
    if (vendor) {
      if (vendor === 'arivu-foods' || vendor === 'Arivu Foods') {
        filterQuery.$or = [
          { brand: { $regex: 'Arivu', $options: 'i' } },
          { name: { $regex: 'Arivu', $options: 'i' } }
        ];
      } else {
        filterQuery.vendorId = vendor;
      }
    } else if (brand && brand !== 'All') {
      if (brand === 'Arivu Foods') {
        filterQuery.$or = [
          { brand: { $regex: 'Arivu', $options: 'i' } },
          { name: { $regex: 'Arivu', $options: 'i' } }
        ];
      } else {
        filterQuery.brand = brand;
      }
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

    const pincode = req.body.pincode || req.body.deliveryPincode || '';
    const address = req.body.address || req.body.shippingAddress;
    const vendorSlug = req.body.vendorSlug;
    const userLat = req.body.userLat ? Number(req.body.userLat) : undefined;
    const userLon = req.body.userLon ? Number(req.body.userLon) : undefined;

    const shippingRes = await computeShippingFeeForPincode(pincode, userLat, userLon, address, totalAmount, vendorSlug);
    const shippingFee = shippingRes.shippingFee;
    const finalAmount = discountedAmount + gstAmount + shippingFee;

    return res.status(200).json({
      valid: true,
      couponCode: couponRes ? couponRes.code : 'NO_COUPON',
      discountAmount: totalDiscountAmount,
      gstAmount,
      shippingFee,
      isServiceable: shippingRes.serviceable,
      estimatedDeliveryTime: shippingRes.estimatedDeliveryTime,
      estimatedDeliveryDate: shippingRes.estimatedDeliveryDate,
      courierPartner: shippingRes.courierPartner,
      vendorName: shippingRes.vendorName,
      localityName: shippingRes.localityName,
      city: shippingRes.city,
      state: shippingRes.state,
      isFreeShipping: shippingRes.isFreeShipping,
      freeShippingThreshold: shippingRes.freeShippingThreshold || 499,
      finalAmount,
      shopGstPercentage: config?.shopGstPercentage || 0,
      shopDiscountPercentage: config?.shopDiscountPercentage || 0
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error validating coupon.' });
  }
};

// Helper: Auto-assign order to vendor and dispatch order via vendor adapter

async function autoAssignAndSubmitVendorOrder(order: any) {
  try {
    let matchedVendorId = order.vendorId;

    if (!matchedVendorId && order.products && order.products.length > 0) {
      for (const item of order.products) {
        const prod = await ShopProduct.findById(item.productId);
        if (prod && prod.vendorId) {
          matchedVendorId = prod.vendorId;
          break;
        }
      }
    }

    if (!matchedVendorId && order.products) {
      for (const item of order.products) {
        if ((item.name && item.name.includes('Arivu')) || (item.brand && item.brand.includes('Arivu'))) {
          const arivu = await Vendor.findOne({ slug: 'arivu-foods' });
          if (arivu) {
            matchedVendorId = arivu._id;
            break;
          }
        }
      }
    }

    if (!matchedVendorId) return;

    const vendor = await Vendor.findById(matchedVendorId);
    if (!vendor) return;

    order.vendorId = vendor._id;

    // Financial calculations per vendor agreement (Arivu Foods 30% + 18% GST + 100% shipping pass-through)
    const listedProductPrice = order.products.reduce((acc: number, p: any) => acc + (p.price * p.qty), 0);
    const commissionRate = vendor.commissionConfig?.rate ?? (vendor.commissionValue || 30);
    const gstRate = vendor.commissionConfig?.gstOnCommissionRate ?? 18;
    const passThroughShipping = vendor.commissionConfig?.passThroughShipping ?? true;

    const platformComm = Number(((listedProductPrice * commissionRate) / 100).toFixed(2));
    const gstComm = Number(((platformComm * gstRate) / 100).toFixed(2));
    const totalRetention = Number((platformComm + gstComm).toFixed(2));
    const vendorProductShare = Number((listedProductPrice - totalRetention).toFixed(2));
    const shipping = passThroughShipping ? (order.shippingCharge || 0) : 0;
    const customerGatewayCharge = Number(((order.totalAmount * 2.36) / 100).toFixed(2));
    const finalPayable = Number((vendorProductShare + shipping).toFixed(2));

    order.platformCommission = totalRetention;
    order.vendorEarnings = finalPayable;
    order.deliveryStatus = 'assigned';
    order.financialBreakdown = {
      listedProductPrice,
      platformCommissionRate: commissionRate,
      platformCommission: platformComm,
      gstOnCommissionRate: gstRate,
      gstOnCommission: gstComm,
      totalPlatformRetention: totalRetention,
      vendorProductShare,
      shippingCharge: order.shippingCharge || 0,
      customerGatewayCharge,
      finalVendorPayable: finalPayable
    };

    // Auto-submit to vendor via adapter
    const adapter = VendorAdapterFactory.getAdapter(vendor);
    const submitResult = await adapter.submitOrder(vendor, order);

    if (submitResult.success) {
      order.vendorOrderId = submitResult.vendorOrderId || '';
      order.vendorOrderStatus = submitResult.vendorOrderStatus || 'PROCESSING';
      order.vendorSubmissionStatus = 'SUBMITTED';
      order.vendorSubmissionAttempts = (order.vendorSubmissionAttempts || 0) + 1;

      if (submitResult.trackingNumber) {
        order.trackingDetails = {
          courierName: submitResult.courierName || 'Blue Dart Express',
          trackingId: submitResult.trackingNumber,
          trackingUrl: submitResult.trackingUrl || ''
        };
        order.deliveryStatus = 'shipped';
      }

      if (submitResult.estimatedDeliveryDate) {
        order.estimatedDeliveryDate = submitResult.estimatedDeliveryDate;
      }
      if (submitResult.statusMessage) {
        order.vendorStatusMessage = submitResult.statusMessage;
      }

      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: 'assigned_and_submitted',
        timestamp: new Date(),
        comment: `Order submitted to ${vendor.name}. External ref: ${order.vendorOrderId || 'N/A'}${order.estimatedDeliveryDate ? ` • Est. Delivery: ${order.estimatedDeliveryDate.toDateString()}` : ''}`
      });
    } else {
      order.vendorSubmissionStatus = 'FAILED';
      order.vendorSubmissionError = submitResult.errorMessage || 'Auto-dispatch failed';
      order.vendorSubmissionAttempts = (order.vendorSubmissionAttempts || 0) + 1;
    }

    await order.save();
  } catch (e) {
    console.error('Error in autoAssignAndSubmitVendorOrder:', e);
  }
}

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
    
    // Extract delivery pincode and calculate shipping fee on backend
    const orderPincode = shippingAddress?.postalCode || shippingAddress?.zip || shippingAddress?.pincode || req.body.pincode || '';
    const userLat = req.body.userLat ? Number(req.body.userLat) : undefined;
    const userLon = req.body.userLon ? Number(req.body.userLon) : undefined;

    const shippingRes = await computeShippingFeeForPincode(
      orderPincode,
      userLat,
      userLon,
      shippingAddress,
      discountedAmount,
      req.body.vendorSlug
    );
    if (!shippingRes.serviceable) {
      return res.status(400).json({ message: shippingRes.message || `Delivery is unavailable for pincode ${orderPincode}.` });
    }

    const shippingCharge = shippingRes.shippingFee;
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
      estimatedDeliveryDate: shippingRes.estimatedDeliveryDateIso,
      vendorStatusMessage: shippingRes.message || `Delivery estimated by ${shippingRes.estimatedDeliveryDate} via ${shippingRes.courierPartner}`,
      trackingDetails: {
        courierName: shippingRes.courierPartner || 'Delhivery Express',
        trackingId: '',
        trackingUrl: ''
      },
      orderTimeline: [{
        status: 'pending',
        timestamp: new Date(),
        comment: `Order placed. Estimated delivery: ${shippingRes.estimatedDeliveryDate || 'N/A'} via ${shippingRes.courierPartner || 'Partner Logistics'}`
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

      // Trigger FCM Push Notification
      FCMService.sendNotificationToUser(userId.toString(), {
        title: 'Order Placed Successfully',
        body: `Your order for ₹${finalAmount} has been placed.`,
        type: 'OrderPlaced',
        data: {
          route: 'Shop Orders',
          orderId: newOrder._id.toString()
        }
      }).catch(console.error);

      // Auto-assign and submit to Vendor if order contains vendor items (e.g. Arivu Foods)
      await autoAssignAndSubmitVendorOrder(newOrder);

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

    // Trigger FCM Push Notification
    FCMService.sendNotificationToUser(order.userId.toString(), {
      title: 'Order Payment Confirmed',
      body: `Payment verified for order #${order._id.toString().slice(-6).toUpperCase()}. Your order is confirmed!`,
      type: 'OrderPaid',
      data: {
        route: 'Shop Orders',
        orderId: order._id.toString()
      }
    }).catch(console.error);

    // Auto-assign and submit to Vendor if order contains vendor items (e.g. Arivu Foods)
    await autoAssignAndSubmitVendorOrder(order);

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

// --- PINCODE & DISTANCE SHIPPING CONTROLLER ---

// Haversine distance calculator in kilometers
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Get all pincode shipping rules (Admin)
export const getAdminPincodeRules = async (req: Request, res: Response) => {
  try {
    const rules = await PincodeShippingRule.find().sort({ pincode: 1 });
    res.json(rules);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching pincode rules.' });
  }
};

// --- PINCODE & DISTANCE SHIPPING VALIDATIONS & CALCULATIONS ---

// Distance Range Validation Helper (Overlap & Boundaries Check)
export function validateDistanceRanges(ranges: any[]): { valid: boolean; message?: string } {
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return { valid: true };
  }

  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    const min = Number(r.minDistanceKm);
    const max = Number(r.maxDistanceKm);
    const fee = Number(r.shippingCharge);

    if (isNaN(min) || isNaN(max) || min < 0 || max <= 0) {
      return { valid: false, message: `Invalid distance range at tier ${i + 1}. Minimum and maximum distances must be positive numbers.` };
    }
    if (min >= max) {
      return { valid: false, message: `Invalid distance tier (${min}km - ${max}km) at row ${i + 1}. Minimum distance must be strictly less than maximum distance.` };
    }
    if (isNaN(fee) || fee < 0) {
      return { valid: false, message: `Invalid shipping charge at tier ${i + 1}. Shipping charge must be a non-negative number.` };
    }
  }

  // Check for range overlaps by sorting by minDistanceKm
  const sorted = [...ranges].sort((a, b) => Number(a.minDistanceKm) - Number(b.minDistanceKm));
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentMax = Number(sorted[i].maxDistanceKm);
    const nextMin = Number(sorted[i + 1].minDistanceKm);
    if (currentMax > nextMin) {
      return {
        valid: false,
        message: `Distance tier overlap detected! Range (${sorted[i].minDistanceKm}-${sorted[i].maxDistanceKm} km) overlaps with range (${sorted[i + 1].minDistanceKm}-${sorted[i + 1].maxDistanceKm} km).`
      };
    }
  }

  return { valid: true };
}

// Pincode Format Validation Helper
export function validatePincodeFormat(pincode: string): { valid: boolean; cleanPincode: string; message?: string } {
  const cleanPincode = (pincode || '').toString().trim();
  if (!cleanPincode) {
    return { valid: false, cleanPincode: '', message: 'Pincode is required.' };
  }
  if (!/^\d{6}$/.test(cleanPincode) && !/^[A-Z0-9\s-]{3,10}$/i.test(cleanPincode)) {
    return { valid: false, cleanPincode, message: `Invalid pincode format (${cleanPincode}). Pincode must be a valid 6-digit number.` };
  }
  return { valid: true, cleanPincode };
}

// Shared Shipping Fee & Serviceability Calculation Helper
export const computeShippingFeeForPincode = async (
  pincode?: string,
  userLat?: number,
  userLon?: number,
  address?: { line1?: string; city?: string; state?: string },
  cartAmount?: number,
  vendorSlug?: string
) => {
  const cleanPincode = (pincode || '').toString().trim().replace(/\D/g, '');

  // 1. Check if vendor adapter is available for delivery estimation
  let activeVendor = null;
  if (vendorSlug) {
    activeVendor = await Vendor.findOne({ slug: vendorSlug, isActive: true, isDeleted: { $ne: true } });
  }
  if (!activeVendor) {
    // If no specific vendor requested, check if Arivu Foods or any active vendor is in the system
    activeVendor = await Vendor.findOne({ slug: 'arivu-foods', isActive: true, isDeleted: { $ne: true } }) || 
                   await Vendor.findOne({ isActive: true, isDeleted: { $ne: true } });
  }

  if (activeVendor && cleanPincode && cleanPincode.length === 6) {
    try {
      const adapter = VendorAdapterFactory.getAdapter(activeVendor);
      const estimate = await adapter.checkDeliveryEstimate(activeVendor, cleanPincode, address, cartAmount || 0);

      // Check if there is also an admin override in PincodeShippingRule
      const rule = await PincodeShippingRule.findOne({ pincode: cleanPincode });
      if (rule && !rule.isServiceable) {
        return {
          serviceable: false,
          pincode: cleanPincode,
          shippingFee: 0,
          estimatedDeliveryTime: 'N/A',
          estimatedDeliveryDate: 'N/A',
          courierPartner: 'N/A',
          isFallback: false,
          distanceKm: 0,
          message: `Delivery to ${rule.localityName} (${cleanPincode}) is currently suspended.`
        };
      }

      return {
        serviceable: estimate.serviceable,
        pincode: cleanPincode,
        localityName: estimate.localityName || rule?.localityName || address?.city || 'Delivery Area',
        city: estimate.city || rule?.city || address?.city || 'India',
        state: estimate.state || rule?.state || address?.state || 'India',
        zone: estimate.zone || 'South Zone',
        shippingFee: estimate.shippingFee,
        isFreeShipping: estimate.isFreeShipping,
        freeShippingThreshold: estimate.freeShippingThreshold,
        estimatedDeliveryDate: estimate.estimatedDeliveryDate,
        estimatedDeliveryDateIso: estimate.estimatedDeliveryDateIso,
        estimatedDeliveryTime: estimate.estimatedDeliveryTime,
        courierPartner: estimate.courierPartner,
        vendorName: estimate.vendorName || activeVendor.name,
        vendorOrigin: estimate.vendorOrigin || 'Central Warehouse',
        distanceKm: 0,
        isFallback: false,
        message: estimate.message
      };
    } catch (err) {
      console.warn('Vendor delivery estimate error, falling back to standard calculator:', err);
    }
  }

  // Fallback to standard shop rule / global distance calculation
  const config = await PaymentGatewayConfig.findOne();
  const globalShippingFee = config?.shopShippingFee || 0;
  const storeLat = config?.storeOriginLat || 12.9716;
  const storeLon = config?.storeOriginLon || 77.5946;
  const fallbackMode = config?.unconfiguredPincodeFallback || 'GLOBAL_FALLBACK';
  const globalTiers = config?.globalDistanceRanges && config.globalDistanceRanges.length > 0
    ? config.globalDistanceRanges
    : [
        { minDistanceKm: 0, maxDistanceKm: 5, shippingCharge: 40, estimatedDeliveryTime: 'Same Day Delivery (2-4 hrs)' },
        { minDistanceKm: 5, maxDistanceKm: 15, shippingCharge: 75, estimatedDeliveryTime: '24 Hours Delivery' },
        { minDistanceKm: 15, maxDistanceKm: 30, shippingCharge: 120, estimatedDeliveryTime: '2-3 Business Days' }
      ];

  if (!cleanPincode) {
    return {
      serviceable: true,
      shippingFee: globalShippingFee,
      estimatedDeliveryTime: 'Standard Delivery (3-5 Days)',
      estimatedDeliveryDate: '3-5 Business Days',
      courierPartner: 'Standard Courier',
      isFallback: true,
      distanceKm: 0,
      message: 'Using global standard shipping fee.'
    };
  }

  const rule = await PincodeShippingRule.findOne({ pincode: cleanPincode });

  // Unconfigured Pincode
  if (!rule) {
    if (fallbackMode === 'STRICT') {
      return {
        serviceable: false,
        shippingFee: 0,
        estimatedDeliveryTime: 'N/A',
        estimatedDeliveryDate: 'N/A',
        courierPartner: 'N/A',
        isFallback: false,
        distanceKm: 0,
        message: `Delivery is currently unavailable for pincode ${cleanPincode}.`
      };
    }
    // GLOBAL_FALLBACK
    return {
      serviceable: true,
      shippingFee: globalShippingFee,
      estimatedDeliveryTime: 'Standard Delivery (3-5 Days)',
      estimatedDeliveryDate: '3-5 Business Days',
      courierPartner: 'Standard Courier',
      isFallback: true,
      distanceKm: 0,
      message: `Standard delivery to ${cleanPincode}.`
    };
  }

  // Configured & Non-Serviceable
  if (!rule.isServiceable) {
    return {
      serviceable: false,
      shippingFee: 0,
      estimatedDeliveryTime: 'N/A',
      estimatedDeliveryDate: 'N/A',
      courierPartner: 'N/A',
      isFallback: false,
      distanceKm: 0,
      message: `Delivery to ${rule.localityName} (${cleanPincode}) is currently suspended.`
    };
  }

  // Configured & Serviceable: Calculate distance from Store Warehouse Origin
  const destLat = userLat ? Number(userLat) : (rule.pincodeCenterLat || storeLat);
  const destLon = userLon ? Number(userLon) : (rule.pincodeCenterLon || storeLon);
  const distanceKm = calculateHaversineDistanceKm(storeLat, storeLon, destLat, destLon);

  // Custom pincode distance ranges override, or inherit global distance tiers if empty
  const activeTiers = (rule.distanceRanges && rule.distanceRanges.length > 0)
    ? rule.distanceRanges
    : globalTiers;

  let matchedRange = activeTiers.find(
    r => distanceKm >= r.minDistanceKm && distanceKm < r.maxDistanceKm
  );

  if (!matchedRange && activeTiers.length > 0) {
    matchedRange = activeTiers[activeTiers.length - 1];
  }

  const calculatedFee = matchedRange ? matchedRange.shippingCharge : (rule.baseShippingFee ?? globalShippingFee);
  const deliveryEstimate = matchedRange ? matchedRange.estimatedDeliveryTime : '24-48 Hours Delivery';

  return {
    serviceable: true,
    localityName: rule.localityName,
    city: rule.city,
    state: rule.state,
    shippingFee: calculatedFee,
    estimatedDeliveryTime: deliveryEstimate,
    estimatedDeliveryDate: deliveryEstimate,
    courierPartner: 'Local Express Courier',
    distanceKm,
    isFallback: false,
    message: `Delivery available to ${rule.localityName} (${distanceKm} km from Warehouse).`
  };
};

// Create a new pincode shipping rule (Admin)
export const createAdminPincodeRule = async (req: Request, res: Response) => {
  try {
    const { pincode, localityName, city, state, isServiceable, pincodeCenterLat, pincodeCenterLon, baseShippingFee, distanceRanges } = req.body;
    
    // 1. Format validation
    const pincodeCheck = validatePincodeFormat(pincode);
    if (!pincodeCheck.valid) {
      return res.status(400).json({ message: pincodeCheck.message });
    }
    if (!localityName || !localityName.trim()) {
      return res.status(400).json({ message: 'Locality Name is required.' });
    }

    // 2. Uniqueness check
    const existing = await PincodeShippingRule.findOne({ pincode: pincodeCheck.cleanPincode });
    if (existing) {
      return res.status(400).json({ message: `Pincode ${pincodeCheck.cleanPincode} is already configured in the system.` });
    }

    // 3. Distance Range Overlap check
    if (distanceRanges && Array.isArray(distanceRanges) && distanceRanges.length > 0) {
      const rangeCheck = validateDistanceRanges(distanceRanges);
      if (!rangeCheck.valid) {
        return res.status(400).json({ message: rangeCheck.message });
      }
    }

    const rule = new PincodeShippingRule({
      pincode: pincodeCheck.cleanPincode,
      localityName: localityName.trim(),
      city: city ? city.trim() : 'India',
      state: state ? state.trim() : 'India',
      isServiceable: isServiceable !== undefined ? isServiceable : true,
      pincodeCenterLat: pincodeCenterLat ? Number(pincodeCenterLat) : 12.9716,
      pincodeCenterLon: pincodeCenterLon ? Number(pincodeCenterLon) : 77.5946,
      baseShippingFee: baseShippingFee !== undefined && baseShippingFee !== '' ? Number(baseShippingFee) : undefined,
      distanceRanges: Array.isArray(distanceRanges) ? distanceRanges : []
    });

    await rule.save();
    res.status(201).json(rule);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating pincode rule.' });
  }
};

// Update an existing pincode rule (Admin)
export const updateAdminPincodeRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pincode, localityName, distanceRanges } = req.body;

    if (pincode) {
      const pincodeCheck = validatePincodeFormat(pincode);
      if (!pincodeCheck.valid) {
        return res.status(400).json({ message: pincodeCheck.message });
      }
      const existing = await PincodeShippingRule.findOne({ pincode: pincodeCheck.cleanPincode, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: `Pincode ${pincodeCheck.cleanPincode} is already used by another rule.` });
      }
      req.body.pincode = pincodeCheck.cleanPincode;
    }

    if (distanceRanges && Array.isArray(distanceRanges) && distanceRanges.length > 0) {
      const rangeCheck = validateDistanceRanges(distanceRanges);
      if (!rangeCheck.valid) {
        return res.status(400).json({ message: rangeCheck.message });
      }
    }

    const rule = await PincodeShippingRule.findByIdAndUpdate(id, req.body, { new: true });
    if (!rule) return res.status(404).json({ message: 'Pincode rule not found.' });
    res.json(rule);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating pincode rule.' });
  }
};

// Delete a pincode rule (Admin)
export const deleteAdminPincodeRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = await PincodeShippingRule.findByIdAndDelete(id);
    if (!rule) return res.status(404).json({ message: 'Pincode rule not found.' });
    res.json({ message: 'Pincode rule deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error deleting pincode rule.' });
  }
};

// Public/User Serviceability & Distance Shipping Fee Calculation Check
export const checkPincodeServiceability = async (req: Request, res: Response) => {
  try {
    const { pincode, userLat, userLon, address, cartAmount, vendorSlug } = req.body;
    const result = await computeShippingFeeForPincode(pincode, userLat, userLon, address, cartAmount, vendorSlug);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Error checking pincode serviceability.' });
  }
};

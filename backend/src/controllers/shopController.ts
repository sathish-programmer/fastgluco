import { Request, Response } from 'express';
import mongoose from 'mongoose';
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
import { ArivuFoodsAdapter } from '../services/vendorAdapters/ArivuFoodsAdapter';
import Razorpay from 'razorpay';
import { FCMService } from '../services/fcmService';
import path from 'path';
import fs from 'fs';
import { InvoiceService } from '../services/invoiceService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { resolveAmazonProductMetadata, extractAsin } from '../services/amazonScraperService';


// Predefined categories
export const PREDEFINED_CATEGORIES = [
  'Pesticide free food',
  'Arivu in nutrition',
  'Environment safe products',
  'Safe kitchen',
  'Glucose monitoring',
  'Cancer support wig',
  'Antioxidants'
];

// --- ADMIN ROUTES ---

export const getAdminProducts = async (req: Request, res: Response) => {
  try {
    try {
      const arivuVendor = await Vendor.findOne({ slug: 'arivu-foods' });
      const arivuAdapter = new ArivuFoodsAdapter();
      const dynamicProducts = await arivuAdapter.fetchDynamicProducts(arivuVendor || undefined);
      if (dynamicProducts && dynamicProducts.length > 0) {
        return res.json(dynamicProducts);
      }
    } catch (e: any) {
      console.warn('[getAdminProducts] Live API fetch error, falling back to DB:', e.message);
    }

    let products = await ShopProduct.find().sort({ createdAt: -1 });
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
    const coreCategories = [
      'Pesticide free food',
      'Arivu in nutrition',
      'Environment safe products',
      'Safe kitchen',
      'Glucose monitoring',
      'Cancer support wig',
      'Antioxidants'
    ];

    res.json(coreCategories.map(name => ({
      name,
      isCustom: false
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

    let dynamicProducts: any[] = [];
    let isDynamicSuccess = false;

    // 1. Fetch live dynamic products directly from Arivu Foods partner API (doc: /api/mitoreboot/products)
    try {
      const arivuVendor = await Vendor.findOne({ slug: 'arivu-foods' });
      const arivuAdapter = new ArivuFoodsAdapter();
      const rawProducts = await arivuAdapter.fetchDynamicProducts(arivuVendor || undefined);
      if (rawProducts && rawProducts.length > 0) {
        dynamicProducts = rawProducts.map(p => ({
          ...p,
          category: (p.category === 'MitoReboot Nutrition' || !p.category) ? 'Arivu in nutrition' : p.category
        }));
        isDynamicSuccess = true;
      }
    } catch (apiErr: any) {
      console.warn('[getProducts] Arivu live API fetch error, falling back to local DB cache:', apiErr.message);
    }

    // 2. Fetch products from MongoDB
    const dbFilter: any = { isActive: true };
    if (isDynamicSuccess) {
      // Exclude Arivu products to avoid duplicates since we already have dynamic products
      dbFilter.brand = { $ne: 'Arivu Foods' };
      dbFilter.vendorSku = { $not: /^ARIVU/ };
    }

    const dbProducts = await ShopProduct.find(dbFilter).populate('vendorId', 'name slug gstPercentage gstInclusive shippingConfig');
    const plainDbProducts = dbProducts.map(p => (p.toObject ? p.toObject() : p));

    // 3. Merge products
    let allProducts = [...dynamicProducts, ...plainDbProducts];

    // 4. Apply category filter
    if (category && category !== 'All') {
      const catStr = String(category).trim().toLowerCase();
      allProducts = allProducts.filter(p => {
        const pCat = (p.category || '').toLowerCase();
        if (catStr === 'pesticide free food') {
          return pCat === 'pesticide free food' || pCat.includes('pesticide') || pCat.includes('organic food');
        }
        if (catStr === 'arivu in nutrition') {
          return pCat === 'arivu in nutrition' || (p.brand || '').toLowerCase().includes('arivu') || pCat.includes('nutrition');
        }
        if (catStr === 'environment safe products' || catStr === 'saferproducts' || catStr === 'safer products') {
          return pCat === 'environment safe products' || pCat.includes('environment') || pCat.includes('safer');
        }
        if (catStr === 'safe kitchen') {
          return pCat === 'safe kitchen' || pCat.includes('kitchen');
        }
        if (catStr === 'glucose monitoring') {
          return pCat === 'glucose monitoring' || pCat.includes('glucose') || pCat.includes('cgm') || pCat.includes('monitor');
        }
        if (catStr === 'cancer support wig') {
          return pCat === 'cancer support wig' || pCat.includes('wig');
        }
        if (catStr === 'antioxidants' || catStr === 'antioxidant') {
          return pCat.includes('antioxidant');
        }
        return pCat.includes(catStr);
      });
    }

    // 5. Apply brand filter
    if (brand && brand !== 'All') {
      const brandStr = String(brand).trim().toLowerCase();
      allProducts = allProducts.filter(p => (p.brand || '').toLowerCase().includes(brandStr));
    }

    // 6. Apply doctorRecommended filter
    if (doctorRecommended === 'true') {
      allProducts = allProducts.filter(p => p.doctorRecommended === true);
    }

    // 7. Apply stock availability filter
    if (available === 'true') {
      allProducts = allProducts.filter(p => ((p.stock || p.availableStock || 0) > 0));
    }

    // 8. Apply search filter
    if (search) {
      const searchTerms = String(search).trim().toLowerCase().split(/\s+/).filter(Boolean);
      allProducts = allProducts.filter(p => {
        const text = `${p.name || ''} ${p.description || ''} ${p.shortDescription || ''} ${p.detailedDescription || ''} ${p.category || ''} ${p.brand || ''} ${(p.keyBenefits || []).join(' ')}`.toLowerCase();
        return searchTerms.every(term => text.includes(term));
      });
    }

    // 9. Apply minPrice / maxPrice
    if (minPrice) {
      allProducts = allProducts.filter(p => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      allProducts = allProducts.filter(p => p.price <= Number(maxPrice));
    }

    // 10. Sort
    if (sortBy === 'price_asc') {
      allProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      allProducts.sort((a, b) => b.price - a.price);
    } else {
      allProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json(allProducts);
  } catch (err: any) {
    console.error('[getProducts] Error:', err);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const validateCart = async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    // Pre-fetch dynamic catalog for live stock and price validation
    let dynamicCatalog: any[] = [];
    try {
      const arivuVendor = await Vendor.findOne({ slug: 'arivu-foods' });
      const arivuAdapter = new ArivuFoodsAdapter();
      dynamicCatalog = await arivuAdapter.fetchDynamicProducts(arivuVendor || undefined);
    } catch {
      // ignore
    }

    const validatedItems = await Promise.all(items.map(async (item: any) => {
      const prodId = item.productId || item.item?.id || item.item?._id || item.id;

      // 1. Check live dynamic catalog first
      let product: any = dynamicCatalog.find(p => p._id.toString() === prodId.toString() || p.vendorExternalId === prodId.toString());

      // 2. If not found in live catalog, check MongoDB
      if (!product) {
        if (mongoose.Types.ObjectId.isValid(prodId)) {
          product = await ShopProduct.findById(prodId);
        }
        if (!product) {
          product = await ShopProduct.findOne({ vendorExternalId: prodId });
        }
      }

      const requestedQty = Number(item.qty || 1);

      if (!product || product.isActive === false) {
        return {
          productId: prodId,
          name: item.item?.name || item.name || 'Product',
          variantName: item.variantName || null,
          requestedQty,
          availableStock: 0,
          isOutOfStock: true,
          isInsufficient: true,
          notFound: true,
          message: `${item.item?.name || item.name || 'This product'} is currently unavailable.`
        };
      }

      let availableStock = Number(product.stock ?? 50);
      let price = product.price;

      if (item.variantName && product.variants && product.variants.length > 0) {
        const v = product.variants.find((x: any) => x.name === item.variantName || x.weight === item.variantName);
        if (v) {
          availableStock = Number(v.stock ?? 50);
          price = v.price || price;
        } else {
          availableStock = 0;
        }
      }

      const isOutOfStock = availableStock <= 0;
      const isInsufficient = requestedQty > availableStock;

      return {
        productId: (product._id || prodId).toString(),
        name: product.name || product.title,
        variantName: item.variantName || null,
        requestedQty,
        availableStock,
        price,
        image: product.image,
        isOutOfStock,
        isInsufficient,
        message: isOutOfStock
          ? `${product.name || product.title}${item.variantName ? ` (${item.variantName})` : ''} is currently out of stock.`
          : isInsufficient
            ? `Only ${availableStock} units left for ${product.name || product.title}${item.variantName ? ` (${item.variantName})` : ''}.`
            : null
      };
    }));

    const hasOutOfStock = validatedItems.some(i => i.isOutOfStock);
    const hasInsufficient = validatedItems.some(i => i.isInsufficient);

    return res.json({
      valid: !hasOutOfStock && !hasInsufficient,
      hasOutOfStock,
      hasInsufficient,
      items: validatedItems
    });
  } catch (err) {
    console.error('Error validating cart:', err);
    return res.status(500).json({ message: 'Error validating cart items' });
  }
};

export const getProductDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let product: any = null;

    // 1. Fetch dynamically from Arivu Foods API by ID (doc: GET /api/mitoreboot/products/:id)
    try {
      const arivuVendor = await Vendor.findOne({ slug: 'arivu-foods' });
      const arivuAdapter = new ArivuFoodsAdapter();
      product = await arivuAdapter.fetchDynamicProductById(id, arivuVendor || undefined);
    } catch (err: any) {
      console.warn('[getProductDetails] Dynamic API fetch warning:', err.message);
    }

    // 2. Fallback to MongoDB
    if (!product) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await ShopProduct.findById(id).populate('vendorId', 'name slug gstPercentage gstInclusive shippingConfig');
      }
      if (!product) {
        product = await ShopProduct.findOne({ vendorExternalId: id }).populate('vendorId', 'name slug gstPercentage gstInclusive shippingConfig');
      }
    }

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Find similar products in same category from dynamic catalog
    let similar: any[] = [];
    try {
      const arivuAdapter = new ArivuFoodsAdapter();
      const allDynamic = await arivuAdapter.fetchDynamicProducts();
      similar = allDynamic
        .filter(p => p._id.toString() !== (product._id || product.id).toString())
        .slice(0, 4);
    } catch {
      similar = await ShopProduct.find({
        category: product.category,
        _id: { $ne: product._id },
        isActive: true
      }).limit(4);
    }

    res.json({ product, similar });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product details' });
  }
};

// --- SHOP COUPON ---

export const validateShopCoupon = async (req: Request, res: Response) => {
  try {
    const { couponCode, totalAmount, vendorSlug, vendorId, items } = req.body;
    if (!couponCode) {
      return res.status(400).json({ message: 'Coupon code is required.' });
    }

    // 1. Resolve Active Vendor dynamically
    let activeVendor: any = null;
    if (vendorId) {
      activeVendor = await Vendor.findOne({ _id: vendorId, isActive: true, isDeleted: { $ne: true } });
    }
    if (!activeVendor && vendorSlug) {
      activeVendor = await Vendor.findOne({ slug: vendorSlug, isActive: true, isDeleted: { $ne: true } });
    }
    if (!activeVendor && items && items.length > 0) {
      for (const item of items) {
        const pId = item.productId || item.id;
        if (pId) {
          const prod = await ShopProduct.findById(pId);
          if (prod && prod.vendorId) {
            activeVendor = await Vendor.findOne({ _id: prod.vendorId, isActive: true, isDeleted: { $ne: true } });
            if (activeVendor) break;
          }
        }
      }
    }
    if (!activeVendor) {
      activeVendor = await Vendor.findOne({ slug: 'arivu-foods', isActive: true, isDeleted: { $ne: true } }) || 
                     await Vendor.findOne({ isActive: true, isDeleted: { $ne: true } });
    }

    let discountAmount = 0;
    let couponRes: any = null;

    if (couponCode !== 'NO_COUPON') {
      couponRes = await Coupon.findOne({ 
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        isDeleted: false
      }).populate('vendorId', 'name slug');

      if (!couponRes) {
        return res.status(400).json({ valid: false, message: 'Invalid or inactive coupon code.' });
      }

      if (couponRes.expiryDate && new Date(couponRes.expiryDate) < new Date()) {
        return res.status(400).json({ valid: false, message: 'This coupon code has expired.' });
      }

      if (couponRes.maxRedemptions !== undefined && couponRes.redemptionsCount >= couponRes.maxRedemptions) {
        return res.status(400).json({ valid: false, message: 'This coupon code has reached its limit.' });
      }

      // Vendor Eligibility Check:
      // If coupon is vendor-specific, ensure it matches the vendor of products in cart
      if (couponRes.vendorId && !couponRes.isGlobal) {
        const couponVendorIdStr = (couponRes.vendorId._id || couponRes.vendorId).toString();
        const activeVendorIdStr = activeVendor ? activeVendor._id.toString() : '';
        if (activeVendorIdStr && couponVendorIdStr !== activeVendorIdStr) {
          const vendorDisplayName = couponRes.vendorId.name || 'its designated vendor';
          return res.status(400).json({ 
            valid: false, 
            message: `This coupon is valid only for products from ${vendorDisplayName}.` 
          });
        }
      } else if (!couponRes.isGlobal && !couponRes.vendorId && activeVendor) {
        // Old legacy coupons without vendorId and not flagged isGlobal do not apply to vendor products
        return res.status(400).json({
          valid: false,
          message: 'This coupon code is not valid for vendor products.'
        });
      }

      if (couponRes.discountType === 'percentage') {
        discountAmount = Number(((totalAmount * couponRes.discountValue) / 100).toFixed(2));
      } else {
        discountAmount = Number((couponRes.discountValue).toFixed(2));
      }
    }

    const config = await PaymentGatewayConfig.findOne();
    const shopDiscountAmount = Number(((totalAmount * (config?.shopDiscountPercentage || 0)) / 100).toFixed(2));
    const totalDiscountAmount = Number((discountAmount + shopDiscountAmount).toFixed(2));
    
    const discountedAmount = Number(Math.max(0, totalAmount - totalDiscountAmount).toFixed(2));

    // Dynamic GST calculation based on Vendor configuration
    let gstAmount = 0;
    let includedGstAmount = 0;
    let gstPercentage = 0;
    let gstInclusive = true;

    if (activeVendor && activeVendor.gstPercentage !== undefined && activeVendor.gstPercentage > 0) {
      gstPercentage = activeVendor.gstPercentage;
      gstInclusive = activeVendor.gstInclusive !== false;

      if (!gstInclusive) {
        // Exclusive GST: Added on top of subtotal
        gstAmount = Number(((discountedAmount * gstPercentage) / 100).toFixed(2));
      } else {
        // Inclusive GST: Built into the product price (standard Indian MRP)
        gstAmount = 0;
        includedGstAmount = Number((discountedAmount - (discountedAmount / (1 + (gstPercentage / 100)))).toFixed(2));
      }
    } else if (!activeVendor && config?.shopGstPercentage) {
      // Fallback for legacy non-vendor products
      gstPercentage = config.shopGstPercentage;
      gstInclusive = false;
      gstAmount = Number(((discountedAmount * gstPercentage) / 100).toFixed(2));
    }

    const pincode = req.body.pincode || req.body.deliveryPincode || '';
    const address = req.body.address || req.body.shippingAddress;
    const userLat = req.body.userLat ? Number(req.body.userLat) : undefined;
    const userLon = req.body.userLon ? Number(req.body.userLon) : undefined;

    const shippingRes = await computeShippingFeeForPincode(
      pincode, 
      userLat, 
      userLon, 
      address, 
      discountedAmount, 
      activeVendor?.slug,
      activeVendor?._id?.toString()
    );
    const shippingFee = Number((shippingRes.shippingFee || 0).toFixed(2));
    const finalAmount = Number((discountedAmount + gstAmount + shippingFee).toFixed(2));

    return res.status(200).json({
      valid: true,
      couponCode: couponRes ? couponRes.code : 'NO_COUPON',
      discountAmount: totalDiscountAmount,
      gstAmount,
      includedGstAmount,
      gstInclusive,
      gstPercentage,
      shippingFee,
      isServiceable: shippingRes.serviceable,
      estimatedDeliveryTime: shippingRes.estimatedDeliveryTime,
      estimatedDeliveryDate: shippingRes.estimatedDeliveryDate,
      courierPartner: shippingRes.courierPartner,
      vendorName: shippingRes.vendorName || activeVendor?.name,
      shippingNote: shippingRes.shippingNote || activeVendor?.shippingConfig?.shippingNote || '',
      localityName: shippingRes.localityName,
      city: shippingRes.city,
      state: shippingRes.state,
      isFreeShipping: shippingRes.isFreeShipping,
      freeShippingThreshold: shippingRes.freeShippingThreshold || activeVendor?.shippingConfig?.freeShippingThreshold || 499,
      finalAmount,
      shopGstPercentage: gstPercentage,
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

    // Self-heal: ensure Arivu Foods vendor in database always has the verified brand logo
    if (vendor.slug === 'arivu-foods' || (vendor.name && vendor.name.toLowerCase().includes('arivu'))) {
      if (!vendor.logo || !vendor.logo.includes('arivu-logo')) {
        vendor.logo = 'https://app.mitoreboot.in/assets/arivu-logo.png';
        await vendor.save().catch(() => {});
      }
    }

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

    // 1. INVENTORY STOCK VALIDATION & SERVER-SIDE PRICE ENFORCEMENT
    // Never trust product prices or totalAmount directly received from the mobile frontend!
    let verifiedSubtotal = 0;
    const productsToUpdate = [];

    for (const item of items) {
      const product = await ShopProduct.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product ${item.name} is no longer available.` });
      }

      let officialUnitPrice = product.price;

      if (item.variantName) {
        // Variant stock and price check
        const variant = product.variants?.find(v => v.name === item.variantName);
        if (!variant) {
          return res.status(400).json({ message: `Variant ${item.variantName} for product ${item.name} not found.` });
        }
        if (variant.stock < item.qty) {
          return res.status(400).json({ message: `Insufficient stock for product ${item.name} (${item.variantName}). Only ${variant.stock} left.` });
        }
        officialUnitPrice = variant.price;
        productsToUpdate.push({ product, variant, qty: item.qty });
      } else {
        // Main stock check
        if (product.stock < item.qty) {
          return res.status(400).json({ message: `Insufficient stock for product ${item.name}. Only ${product.stock} left.` });
        }
        productsToUpdate.push({ product, qty: item.qty });
      }

      // Enforce the genuine DB price
      item.price = officialUnitPrice;
      verifiedSubtotal += Number((officialUnitPrice * item.qty).toFixed(2));
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

    // 3. SERVER-SIDE CALCULATION
    // Resolve Vendor dynamically from cart products or payload
    let activeVendor: any = null;
    const vendorIdFromProd = productsToUpdate.find(u => u.product.vendorId)?.product.vendorId;
    if (vendorIdFromProd) {
      activeVendor = await Vendor.findById(vendorIdFromProd);
    }
    if (!activeVendor && req.body.vendorId) {
      activeVendor = await Vendor.findById(req.body.vendorId);
    }
    if (!activeVendor && req.body.vendorSlug) {
      activeVendor = await Vendor.findOne({ slug: req.body.vendorSlug });
    }
    if (!activeVendor) {
      activeVendor = await Vendor.findOne({ slug: 'arivu-foods' }) || await Vendor.findOne({ isActive: true });
    }

    let couponDiscountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase(), isActive: true, isDeleted: false });
      if (coupon) {
        // Enforce Vendor eligibility: vendor-specific coupons only apply to that vendor
        if (coupon.vendorId && !coupon.isGlobal) {
          const couponVendorIdStr = coupon.vendorId.toString();
          const hasMatchingVendorItem = productsToUpdate.some(u => u.product.vendorId && u.product.vendorId.toString() === couponVendorIdStr);
          if (!hasMatchingVendorItem && activeVendor?._id?.toString() !== couponVendorIdStr) {
            return res.status(400).json({ message: 'This coupon is not valid for the items in your cart.' });
          }
        } else if (!coupon.isGlobal && !coupon.vendorId && activeVendor) {
          return res.status(400).json({ message: 'This coupon code is not valid for vendor products.' });
        }

        if (coupon.discountType === 'percentage') {
          couponDiscountAmount = (verifiedSubtotal * coupon.discountValue) / 100;
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

    const shopDiscountAmount = Number(((verifiedSubtotal * (config?.shopDiscountPercentage || 0)) / 100).toFixed(2));
    const totalDiscountAmount = Number((couponDiscountAmount + shopDiscountAmount).toFixed(2));
    const discountedAmount = Number(Math.max(0, verifiedSubtotal - totalDiscountAmount).toFixed(2));
    
    // Dynamic GST calculation based on vendor configuration
    let gstAmount = 0;
    if (activeVendor && activeVendor.gstPercentage !== undefined && activeVendor.gstPercentage > 0) {
      if (activeVendor.gstInclusive === false) {
        gstAmount = Number(((discountedAmount * activeVendor.gstPercentage) / 100).toFixed(2));
      } else {
        gstAmount = 0; // inclusive in product price
      }
    } else if (!activeVendor && config?.shopGstPercentage) {
      gstAmount = Number(((discountedAmount * config.shopGstPercentage) / 100).toFixed(2));
    }
    
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
      activeVendor?.slug || req.body.vendorSlug || 'arivu-foods',
      activeVendor?._id?.toString()
    );

    const shippingCharge = Number((shippingRes.shippingFee || 0).toFixed(2));
    const finalAmount = Number((discountedAmount + gstAmount + shippingCharge).toFixed(2));

    // Pre-generate deterministic vendor order ID (MR-XXXXXXXX-XXXX)
    const orderHex = new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase();
    const vendorOrderId = `MR-${orderHex}-${Math.floor(1000 + Math.random() * 9000)}`;

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
      vendorOrderId,
      vendorId: activeVendor?._id || undefined,
      patientName: patientName || user?.name || '',
      patientEmail: patientEmail || user?.email || '',
      patientPhone: patientPhone || user?.mobileNumber || '',
      shippingAddress: shippingAddress || { line1: '', city: '', state: '', postalCode: '', country: 'India' },
      billingAddress: billingAddress || shippingAddress || { line1: '', city: '', state: '', postalCode: '', country: 'India' },
      estimatedDeliveryDate: shippingRes.estimatedDeliveryDateIso,
      vendorStatusMessage: shippingRes.message || `Delivery estimated by ${shippingRes.estimatedDeliveryDate} via ${shippingRes.courierPartner}`,
      trackingDetails: {
        courierName: shippingRes.courierPartner && shippingRes.courierPartner !== 'N/A' ? shippingRes.courierPartner : '',
        trackingId: '',
        trackingUrl: ''
      },
      orderTimeline: [{
        status: 'pending',
        timestamp: new Date(),
        comment: `Order placed. Delivery address: ${shippingAddress?.city || ''} (${orderPincode}). Awaiting vendor dispatch.`
      }]
    });
    await newOrder.save();

    if (!config || !config.razorpayKeyId || !config.razorpayKeySecret) {
      // In development or if Razorpay isn't configured, bypass gateway payment check
      newOrder.status = 'completed';
      await newOrder.save();

      // Auto-assign and submit to Vendor first so vendorOrderId and shipment info are fully established
      await autoAssignAndSubmitVendorOrder(newOrder);

      // Trigger confirmation email with vendorOrderId
      const { EmailService } = require('../services/emailService');
      EmailService.sendOrderEmail('placed', newOrder._id.toString()).catch(console.error);

      // Trigger FCM Push Notification
      const displayId = newOrder.vendorOrderId || newOrder._id.toString().slice(-6).toUpperCase();
      FCMService.sendNotificationToUser(userId.toString(), {
        title: 'Order Placed Successfully',
        body: `Your order #${displayId} for ₹${finalAmount} has been placed.`,
        type: 'OrderPlaced',
        data: {
          route: 'Shop Orders',
          orderId: newOrder._id.toString(),
          vendorOrderId: newOrder.vendorOrderId || ''
        }
      }).catch(console.error);

      return res.json({
        gateway: 'manual_bypass',
        orderId: newOrder._id,
        vendorOrderId: newOrder.vendorOrderId,
        displayOrderId: newOrder.vendorOrderId || newOrder._id,
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
      vendorOrderId: newOrder.vendorOrderId,
      displayOrderId: newOrder.vendorOrderId || newOrder._id,
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
    const razorpay_order_id = req.body.razorpay_order_id || req.body.razorpayOrderId;
    const razorpay_payment_id = req.body.razorpay_payment_id || req.body.razorpayPaymentId;
    const razorpay_signature = req.body.razorpay_signature || req.body.razorpaySignature;
    const orderId = req.body.orderId || req.body.order_id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        message: 'Missing required Razorpay payment verification parameters (razorpayOrderId, razorpayPaymentId, razorpaySignature).' 
      });
    }

    const config = await PaymentGatewayConfig.findOne();
    if (!config || !config.razorpayKeySecret) {
      return res.status(500).json({ message: 'Payment gateway error: configuration or key secret missing' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const order = (orderId ? await ShopOrder.findById(orderId) : null) || 
                  await ShopOrder.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'completed';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;

    // Ensure vendorOrderId exists
    if (!order.vendorOrderId) {
      const orderHex = order._id.toString().slice(-8).toUpperCase();
      order.vendorOrderId = `MR-${orderHex}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    
    // Add to timeline
    order.orderTimeline = order.orderTimeline || [];
    order.orderTimeline.push({
      status: 'placed',
      timestamp: new Date(),
      comment: 'Payment verified, order confirmed'
    });

    await order.save();

    // Auto-assign and submit to Vendor if order contains vendor items (e.g. Arivu Foods)
    // Run this BEFORE sending the email so vendorOrderId is fully populated & synced
    await autoAssignAndSubmitVendorOrder(order);

    // Trigger confirmation email
    const { EmailService } = require('../services/emailService');
    EmailService.sendOrderEmail('placed', order._id.toString()).catch(console.error);

    // Trigger FCM Push Notification
    const displayId = order.vendorOrderId || order._id.toString().slice(-6).toUpperCase();
    FCMService.sendNotificationToUser(order.userId.toString(), {
      title: 'Order Payment Confirmed',
      body: `Payment verified for order #${displayId}. Your order is confirmed!`,
      type: 'OrderPaid',
      data: {
        route: 'Shop Orders',
        orderId: order._id.toString(),
        vendorOrderId: order.vendorOrderId || ''
      }
    }).catch(console.error);

    res.json({
      message: 'Payment verified successfully',
      order,
      vendorOrderId: order.vendorOrderId,
      displayOrderId: order.vendorOrderId || order._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error verifying payment' });
  }
};

export const getAvailableCoupons = async (req: Request, res: Response) => {
  try {
    const { vendorId, vendorSlug } = req.query;
    let targetVendorId = vendorId as string | undefined;

    if (!targetVendorId && vendorSlug) {
      const v = await Vendor.findOne({ slug: vendorSlug, isActive: true, isDeleted: false });
      if (v) targetVendorId = v._id.toString();
    }

    let filter: any = { isActive: true, isDeleted: false };
    if (targetVendorId) {
      filter.$or = [{ vendorId: targetVendorId }, { isGlobal: true }];
    }

    const coupons = await Coupon.find(filter)
      .populate('vendorId', 'name slug')
      .select('code discountType discountValue vendorId isGlobal');
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
  vendorSlug?: string,
  vendorId?: string
) => {
  const cleanPincode = (pincode || '').toString().trim().replace(/\D/g, '');

  // 1. Check if vendor adapter is available for delivery estimation
  let activeVendor = null;
  if (vendorId) {
    activeVendor = await Vendor.findOne({ _id: vendorId, isActive: true, isDeleted: { $ne: true } });
  }
  if (!activeVendor && vendorSlug) {
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
          shippingNote: '',
          isFallback: false,
          distanceKm: 0,
          message: `Delivery to ${rule.localityName} (${cleanPincode}) is currently suspended.`
        };
      }

      if (!estimate.serviceable) {
        return {
          serviceable: false,
          pincode: cleanPincode,
          shippingFee: 0,
          estimatedDeliveryTime: '',
          courierPartner: '',
          shippingNote: '',
          isFallback: false,
          distanceKm: 0,
          message: estimate.message || `Delivery is unavailable for pincode ${cleanPincode}.`
        };
      }

      return {
        serviceable: true,
        pincode: cleanPincode,
        localityName: estimate.localityName || (rule?.localityName ? `${rule.localityName}, ${rule.city}` : undefined) || 'Delivery Area',
        city: estimate.city || rule?.city || 'India',
        state: estimate.state || rule?.state || 'India',
        zone: estimate.zone || 'South Zone',
        shippingFee: estimate.shippingFee || 0,
        isFreeShipping: estimate.isFreeShipping !== false,
        freeShippingThreshold: estimate.freeShippingThreshold,
        estimatedDeliveryDate: estimate.estimatedDeliveryDate,
        estimatedDeliveryDateIso: estimate.estimatedDeliveryDateIso,
        estimatedDeliveryTime: estimate.estimatedDeliveryTime || '',
        courierPartner: estimate.courierPartner || activeVendor.shippingConfig?.carrierPartnerName || '',
        shippingNote: estimate.shippingNote || activeVendor.shippingConfig?.shippingNote || '',
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

  // Resolve vendor or config shipping thresholds
  const freeThreshold = activeVendor?.shippingConfig?.freeShippingThreshold ?? 499;
  const standardFee = activeVendor?.shippingConfig?.shippingChargeBelowThreshold ?? ((activeVendor as any)?.shippingConfig?.shippingFee) ?? (config?.shopShippingFee && config.shopShippingFee <= 70 ? config.shopShippingFee : 70);
  const effectiveFee = (cartAmount !== undefined && cartAmount >= freeThreshold) ? 0 : standardFee;

  if (!cleanPincode) {
    return {
      serviceable: true,
      shippingFee: effectiveFee,
      estimatedDeliveryTime: '3-5 Business Days',
      estimatedDeliveryDate: '3-5 Business Days',
      courierPartner: 'Pan-India Express',
      isFallback: true,
      distanceKm: 0,
      message: effectiveFee === 0 ? 'Free Shipping unlocked!' : `Standard shipping ₹${effectiveFee}. Free on orders above ₹${freeThreshold}.`
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
      shippingFee: effectiveFee,
      estimatedDeliveryTime: '3-5 Business Days',
      estimatedDeliveryDate: '3-5 Business Days',
      courierPartner: 'Pan-India Express',
      isFallback: true,
      distanceKm: 0,
      message: effectiveFee === 0 ? 'Free Shipping unlocked!' : `Standard delivery to ${cleanPincode} (₹${effectiveFee}). Free above ₹${freeThreshold}.`
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

// On-demand authenticated Shop Order Invoice download
export const downloadShopOrderInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const order = await ShopOrder.findById(orderId)
      .populate('userId', 'name email mobileNumber')
      .populate('vendorId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Authorization: owner or Admin/SuperAdmin
    const orderUserId = (order.userId as any)?._id?.toString() || order.userId?.toString();
    if (orderUserId !== userId && userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    let filePath: string | null = null;
    if (order.invoiceUrl) {
      const candidatePath = path.join(__dirname, '../../', order.invoiceUrl);
      if (fs.existsSync(candidatePath)) {
        filePath = candidatePath;
      }
    }

    // If invoice not generated yet or file missing on disk, generate dynamically
    if (!filePath) {
      const relPath = await InvoiceService.generateInvoicePDF(order);
      order.invoiceUrl = relPath;
      await order.save();
      filePath = path.join(__dirname, '../../', relPath);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Invoice file could not be generated.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order._id}.pdf"`);
    return res.sendFile(filePath);
  } catch (error: any) {
    console.error('Error downloading shop order invoice:', error);
    return res.status(500).json({ message: error.message || 'Failed to download invoice.' });
  }
};

/**
 * Customer Order Cancellation / Return / Refund Request
 * Allows customer to raise a cancellation, return, or refund request.
 * Admin can subsequently review, process gateway refund if eligible, and communicate with Arivu team manually.
 */
export const requestOrderCancellation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { orderId } = req.params;
    const { type, reason } = req.body;

    if (!type || !['cancellation', 'return', 'refund'].includes(type)) {
      return res.status(400).json({ message: 'Valid request type (cancellation, return, or refund) is required.' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Please provide a reason for the request.' });
    }

    const order = await ShopOrder.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.cancellationRequest && order.cancellationRequest.status === 'PENDING') {
      return res.status(400).json({ message: 'A request is already pending review for this order.' });
    }

    order.cancellationRequest = {
      type,
      reason: reason.trim(),
      requestedAt: new Date(),
      status: 'PENDING',
      refundAmount: order.totalAmount,
      refundStatus: 'NONE',
      arivuActionRequired: true
    };

    order.orderTimeline = order.orderTimeline || [];
    order.orderTimeline.push({
      status: `request_${type}`,
      timestamp: new Date(),
      comment: `Customer submitted a ${type} request: "${reason.trim()}". Awaiting administrative review.`
    });

    await order.save();
    return res.json({ 
      success: true, 
      message: `Your ${type} request has been submitted successfully and is under review.`, 
      order 
    });
  } catch (error: any) {
    console.error('Error processing customer cancellation request:', error);
    return res.status(500).json({ message: error.message || 'Error submitting cancellation request.' });
  }
};

// --- AMAZON AFFILIATE VENDOR ENDPOINTS ---

export const previewAmazonProduct = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: 'Amazon product URL or ASIN is required.' });
    }
    const meta = await resolveAmazonProductMetadata(url);
    res.json({ success: true, data: meta });
  } catch (error: any) {
    console.error('[previewAmazonProduct] Error:', error);
    res.status(400).json({ message: error.message || 'Failed to resolve Amazon product details.' });
  }
};

export const createAmazonAffiliateProduct = async (req: Request, res: Response) => {
  try {
    const { url, category, name, brand, image, description } = req.body;
    if (!url) {
      return res.status(400).json({ message: 'Amazon product URL or ASIN is required.' });
    }
    if (!category) {
      return res.status(400).json({ message: 'Shop category is required.' });
    }

    const meta = await resolveAmazonProductMetadata(url);

    // Ensure category exists
    await ShopCategory.findOneAndUpdate(
      { name: category.trim() },
      { $set: { name: category.trim(), isActive: true } },
      { upsert: true, new: true }
    );

    const productName = (name && name.trim()) || meta.title;
    const productImage = (image && image.trim()) || meta.image;
    const productBrand = (brand && brand.trim()) || meta.brand;

    // Check if product already exists with this ASIN
    const asinRegex = new RegExp(meta.asin, 'i');
    let product = await ShopProduct.findOne({ buyOnAmazonUrl: asinRegex });

    if (product) {
      product.name = productName;
      product.category = category.trim();
      product.brand = productBrand;
      product.image = productImage;
      product.images = [productImage];
      product.buyOnAmazonUrl = meta.affiliateUrl;
      product.isActive = true;
      product.productStatus = 'active';
      if (description) product.description = description;
      await product.save();
    } else {
      product = new ShopProduct({
        name: productName,
        category: category.trim(),
        brand: productBrand,
        image: productImage,
        images: [productImage],
        buyOnAmazonUrl: meta.affiliateUrl,
        price: 0,
        regularPrice: 0,
        offerPrice: 0,
        discountPercent: 0,
        stock: 100,
        availableStock: 100,
        isActive: true,
        productStatus: 'active',
        description: description || `Recommended healthy product available via Amazon: ${productName}`,
        shortDescription: `Available via Amazon: ${productName}`
      });
      await product.save();
    }

    res.status(201).json({
      success: true,
      message: 'Amazon affiliate product created successfully',
      product
    });
  } catch (error: any) {
    console.error('[createAmazonAffiliateProduct] Error:', error);
    res.status(500).json({ message: error.message || 'Failed to add Amazon product.' });
  }
};

export const getAdminAmazonProducts = async (req: Request, res: Response) => {
  try {
    const products = await ShopProduct.find({
      buyOnAmazonUrl: { $exists: true, $ne: '' }
    }).sort({ updatedAt: -1, createdAt: -1 });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching Amazon affiliate products' });
  }
};

export const refreshAdminAmazonProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ShopProduct.findById(id);
    if (!product || !product.buyOnAmazonUrl) {
      return res.status(404).json({ message: 'Amazon affiliate product not found.' });
    }

    const meta = await resolveAmazonProductMetadata(product.buyOnAmazonUrl);
    product.name = meta.title;
    product.image = meta.image;
    product.images = [meta.image];
    if (meta.brand && meta.brand !== 'Amazon') {
      product.brand = meta.brand;
    }
    product.buyOnAmazonUrl = meta.affiliateUrl;
    await product.save();

    res.json({
      success: true,
      message: 'Amazon product refreshed with live details.',
      product
    });
  } catch (error: any) {
    console.error('[refreshAdminAmazonProduct] Error:', error);
    res.status(500).json({ message: error.message || 'Error refreshing product.' });
  }
};

export const updateAdminAmazonProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      brand,
      image,
      images,
      buyOnAmazonUrl,
      price,
      offerPrice,
      regularPrice,
      isActive,
      description,
      shortDescription
    } = req.body;

    const product = await ShopProduct.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (name !== undefined) product.name = String(name).trim();
    if (category !== undefined) product.category = String(category).trim();
    if (brand !== undefined) product.brand = String(brand).trim();
    if (image !== undefined) {
      product.image = String(image).trim();
      product.images = [product.image];
    }
    if (images && Array.isArray(images) && images.length > 0) {
      product.images = images;
    }
    if (buyOnAmazonUrl !== undefined) {
      let finalUrl = String(buyOnAmazonUrl).trim();
      if (finalUrl && !finalUrl.includes('tag=')) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'tag=mitoreboot-21&linkCode=ll2';
      }
      product.buyOnAmazonUrl = finalUrl;
    }
    if (price !== undefined) product.price = Number(price) || 0;
    if (offerPrice !== undefined) product.offerPrice = Number(offerPrice) || product.price;
    if (regularPrice !== undefined) product.regularPrice = Number(regularPrice) || product.price;
    if (isActive !== undefined) product.isActive = Boolean(isActive);
    if (description !== undefined) product.description = String(description);
    if (shortDescription !== undefined) product.shortDescription = String(shortDescription);

    // Ensure doctorRecommended is false for affiliate products
    product.doctorRecommended = false;

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully.',
      product
    });
  } catch (error: any) {
    console.error('[updateAdminAmazonProduct] Error:', error);
    res.status(500).json({ message: error.message || 'Error updating product.' });
  }
};

